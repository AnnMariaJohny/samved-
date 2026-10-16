"""All active pages at three widths, with populated matches and real request states."""
import json
from pathlib import Path
from urllib.parse import quote, urlparse
from playwright.sync_api import sync_playwright
from ui_smoke import Fixture

BASE='http://127.0.0.1:8765'
ROOT=Path('SAMVED_Portal_Updated/JAVA PROJECT OOP')

def main():
    checks=[]
    errors=[]
    held=[]
    hold=False
    fixture=Fixture()
    def handle(route):
        path=urlparse(route.request.url).path.removeprefix('/api/v1/')
        if hold and path in ('recommendations/me','roadmaps/guidance','opportunities','action-plan/ensure'):
            held.append((route,path));return
        if path=='roadmaps/guidance':
            route.fulfill(json={'recommended':[{'title':title,'reasons':['Interest: Technology','Skill: Programming','Goal: Software Engineer','Assessment: technology']} for title in ['Frontend','Backend','Full Stack']],'saved':[],'message':'Learning options matched to your saved interests, skills, career direction and assessment.'})
        else:fixture.handle(route)
    def check(label,ok):
        assert ok,label
        checks.append(label)
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        page=browser.new_page()
        page.route('**/api/v1/**',handle)
        page.on('pageerror',lambda error:errors.append(str(error)))
        pages=list(json.loads((ROOT/'portal-page-index.json').read_text()))+['welcome.html','privacy.html']
        for width in (390,900,1440):
            page.set_viewport_size({'width':width,'height':900})
            for path in pages:
                page.goto(BASE+'/'+quote(path,safe='/'))
                page.wait_for_timeout(120)
                # Inspect actual boxes: body overflow:hidden must not hide layout errors.
                escaped=page.evaluate('''() => [...document.querySelectorAll('main,header,.portal-sidebar,.portal-right-rail,.portal-act-card,.portal-assess-item,input,select,.portal-btn,.portal-brand')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.left < -1||r.right>innerWidth+1)}).map(e=>e.tagName+'.'+e.className)''')
                check(f'{path} boxes fit {width}px',not escaped)
                if path not in ('privacy.html',):
                    check(f'{path} current logo {width}px',page.locator('.portal-brand-mark img').evaluate('(e)=>e.complete&&e.naturalWidth>0&&e.src.includes("7d29b29b41")'))
                if path=='dashboard/index.html':
                    gaps=page.locator('.portal-match-list').evaluate_all('''lists=>lists.flatMap(l=>{const a=[...l.children].filter(e=>e.matches('article'));return a.slice(1).map((e,i)=>e.getBoundingClientRect().top-a[i].getBoundingClientRect().bottom)})''')
                    check(f'dashboard cards separated {width}px',bool(gaps) and min(gaps)>=15)
                    page.screenshot(path=f'QA_EVIDENCE/polished-dashboard-{width}.png',full_page=True)
        page.set_viewport_size({'width':1440,'height':1000})
        hold=True
        page.goto(BASE+'/onboarding/prepare.html')
        page.wait_for_function("document.querySelectorAll('.preparation-pending').length===4")
        check('all request indicators pending',len(held)==4)
        check('preparation ring animates',page.locator('.preparation-symbol').evaluate('e=>getComputedStyle(e,"::before").animationName')=='preparation-orbit')
        check('progress reflects zero settled requests',page.locator('progress').get_attribute('value')=='0')
        page.screenshot(path='QA_EVIDENCE/polished-preparation.png',full_page=True)
        page.emulate_media(reduced_motion='reduce')
        check('reduced motion disables animation',page.locator('.preparation-symbol').evaluate('e=>getComputedStyle(e,"::before").animationName')=='none')
        route,path=held.pop(0)
        route.fulfill(json={'source':'RULES_FALLBACK','recommendations':[]})
        page.wait_for_function("document.querySelector('progress').value===1")
        check('fallback is honestly labelled','AI provider temporarily unavailable' in page.locator('.prepared').inner_text())
        route,path=held.pop(0);route.fulfill(status=503,json={'message':'Temporarily unavailable'})
        page.wait_for_selector('.preparation-warning')
        check('failed request receives warning',page.locator('.preparation-warning[aria-busy=false]').count()==1)
        route,path=held.pop(0);route.fulfill(json={'content':[]})
        route,path=held.pop(0);route.fulfill(json={'goal':'Research Scientist','source':'AI','summary':'A week of research practice','throughDate':'2026-10-22','today':'2026-10-16'})
        page.wait_for_function("document.querySelector('progress').value===4")
        check('all requests settled and animation stopped',page.locator('.preparation-pending').count()==0 and page.locator('.preparation-finished').count()==1)
        hold=False
        page.wait_for_url('**/dashboard/index.html')
        check('preparation redirects despite partial failure',True)
        check('no browser errors',not errors)
        browser.close()
    Path('QA_EVIDENCE/ui-layout-result.json').write_text(json.dumps({'checks':len(checks),'pages':len(pages),'widths':[390,900,1440],'errors':errors,'verdict':'PASS'},indent=2))
    print('VERDICT: PASS —',len(checks),'checks across',len(pages),'pages at 3 widths')

if __name__=='__main__':main()
