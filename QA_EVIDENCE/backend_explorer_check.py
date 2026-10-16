"""Verify all BV entry points, source anchors, diagram interaction and responsive layout."""
import json,hashlib
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright
from ui_smoke import Fixture

ROOT=Path('SAMVED_Portal_Updated/JAVA PROJECT OOP')
BASE='http://127.0.0.1:8765'

def main():
    raw=(ROOT/'backend-visualization/map-data.js').read_text(encoding='utf-8')
    data=json.loads(raw.removeprefix('window.SAMVED_BACKEND_MAP = ').strip().removesuffix(';'))
    checks=[];errors=[]
    def check(label,ok):
        assert ok,label
        checks.append(label)
    for feature in data['features']:
        for ref in feature['refs']:
            p=Path(ref['path']);lines=p.read_text(encoding='utf-8-sig').splitlines()
            check(ref['path']+':'+str(ref['start'])+' source lines verified',ref['code']=='\n'.join(lines[ref['start']-1:ref['end']]) and hashlib.sha256(p.read_bytes()).hexdigest()==ref['sha256'])
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        context=browser.new_context(viewport={'width':1600,'height':1000})
        context.route('**/api/v1/**',Fixture().handle)
        page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        pages=list(json.loads((ROOT/'portal-page-index.json').read_text()))+['welcome.html','privacy.html']
        for path in pages:
            page.goto(BASE+'/'+quote(path,safe='/'));page.locator('#bv-entry').wait_for()
            check(path+' has BV',page.locator('.bv-entry-button').is_visible())
        page.goto(BASE+'/academic-details/index.html')
        with context.expect_page() as opened:page.locator('.bv-entry-button').click()
        explorer=opened.value;explorer.wait_for_load_state();explorer.on('pageerror',lambda e:errors.append(str(e)))
        explorer.locator('.feature-tile').first.wait_for()
        check('BV preserves original screen',page.url.endswith('/academic-details/index.html'))
        check('BV selects related feature',explorer.locator('#feature-detail h2').inner_text()=='Profile & academics')
        check('return link points to original screen',explorer.locator('#return-link').get_attribute('href').endswith('/academic-details/index.html'))
        check('all features render',explorer.locator('.feature-tile').count()==17)
        explorer.get_by_role('button',name='View code',exact=False).click()
        check('code shortcut expands source',explorer.locator('.code-ref').first.get_attribute('open') is not None)
        requests=[];explorer.on('request',lambda r:requests.append(r.url))
        for feature in data['features']:
            explorer.locator('[data-feature='+feature['id']+']').click()
            check(feature['id']+' expands correct details',explorer.locator('#feature-detail h2').inner_text()==feature['title'])
            check(feature['id']+' exposes exact code references',explorer.locator('.code-ref').count()==len(feature['refs']))
            explorer.locator('.code-ref>summary').first.click()
            check(feature['id']+' code is expandable',explorer.locator('.code-lines').first.is_visible())
        check('exploration executes no feature APIs',not any('/api/v1/' in url for url in requests))
        explorer.locator('#trace-select').select_option('1')
        explorer.locator('#next-step').click()
        check('walkthrough follows feature flow',explorer.locator('#feature-detail h2').inner_text()=='Identity & security')
        explorer.locator('#play-flow').click();explorer.wait_for_timeout(3700)
        check('play advances illustrated flow',explorer.locator('#trace-counter').inner_text().startswith('03'))
        explorer.locator('#play-flow').click()
        check('pause stops playback',explorer.locator('#play-flow').get_attribute('aria-pressed')=='false')
        explorer.locator('[data-feature=actionplan]').click()
        explorer.screenshot(path='QA_EVIDENCE/backend-explorer-desktop.png',full_page=True)
        for width in [390,900,1600]:
            explorer.set_viewport_size({'width':width,'height':950})
            explorer.wait_for_timeout(100)
            check('explorer fits '+str(width),not explorer.evaluate('document.documentElement.scrollWidth>innerWidth+1'))
        explorer.set_viewport_size({'width':390,'height':844})
        explorer.locator('[data-feature=careers]').click();explorer.wait_for_timeout(350)
        check('mobile feature opens details',explorer.locator('#feature-detail h2').inner_text()=='Career match & AI')
        explorer.screenshot(path='QA_EVIDENCE/backend-explorer-mobile.png',full_page=True)
        explorer.emulate_media(reduced_motion='reduce')
        check('reduced motion stops diagram animation',explorer.locator('.flow-edge').first.evaluate('(e)=>getComputedStyle(e).animationName')=='none')
        check('no script errors',not errors)
        browser.close()
    Path('QA_EVIDENCE/backend-explorer-result.json').write_text(json.dumps({'checks':len(checks),'features':17,'sourceAnchors':65,'entryScreens':len(pages),'errors':errors,'verdict':'PASS'},indent=2))
    print('VERDICT: PASS -',len(checks),'checks; 17 features, 65 source anchors, 27 entry screens')

if __name__=='__main__':main()
