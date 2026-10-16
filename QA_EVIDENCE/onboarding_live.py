"""Real MySQL verification of required onboarding, analysis, and isolated demo."""
import json, uuid
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE='http://127.0.0.1:8080'

def main():
    checks=[];visited=[];ranking_source=None
    email='guided-'+uuid.uuid4().hex+'@example.test'
    password='GuidedQa!Aa1'+uuid.uuid4().hex[:8]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        page=browser.new_page(viewport={'width':1440,'height':900})
        page.on('framenavigated',lambda f:visited.append(f.url) if f==page.main_frame else None)
        page.on('dialog',lambda d:d.accept())
        def check(label,ok):
            assert ok,label
            checks.append(label)
        def visit(path):page.goto(BASE+path);page.wait_for_timeout(150)
        def saved():page.wait_for_function("document.getElementById('portal-status').textContent==='Saved to your account.'")
        try:
            visit('/register.html')
            for name,value in [('name','Guided QA Student'),('cityRegion','Kochi'),('email',email),('password',password),('confirmPassword',password)]:page.locator('#'+name).fill(value)
            page.locator('#education').select_option('undergraduate')
            page.locator('#adultConfirmed').check();page.locator('#privacyAccepted').check()
            page.get_by_role('button',name='Create account',exact=False).click();page.wait_for_url('**/onboarding/index.html')
            page.locator('.onboarding-overview').wait_for()
            original_id=page.request.get(BASE+'/api/v1/auth/me').json()['id']
            check('registration opens guided welcome',True)
            check('real feature API is locked before onboarding',page.request.get(BASE+'/api/v1/tasks?demo=true').status==403)
            future=page.request.get(BASE+'/skills/index.html',max_redirects=0)
            check('real server blocks jumping to future setup page',future.status==302 and future.headers.get('location','').endswith('/profile/academic.html'))
            page.screenshot(path='QA_EVIDENCE/onboarding-live-welcome.png',full_page=True)
            page.get_by_role('link',name='Review personal details & start').click();page.wait_for_url('**/profile/index.html')
            page.get_by_role('button',name='Save & Continue',exact=False).click();page.wait_for_url('**/academic-details/index.html')
            check('real personal save advances to academic step',True)
            check('real empty education cannot continue',page.locator('.onboarding-actions button').is_disabled())
            for name,value in [('institution','Guided QA College'),('course','Computer Science'),('period','2'),('score','86')]:page.locator('#'+name).fill(value)
            page.locator('[name=subject]').fill('Programming');page.locator('[name=marks]').fill('90')
            page.get_by_role('button',name='Save Academic Record').click();saved()
            check('real education save unlocks continue',page.locator('.onboarding-actions button').is_enabled())
            original_academics=page.request.get(BASE+'/api/v1/students/me').json()['academics']
            page.locator('.portal-sidebar .onboarding-demo-link').click()
            page.get_by_role('button',name='Start judge demo',exact=True).click()
            check('judge demo requires explicit consent',page.locator('#judge-demo-dialog').is_visible() and page.url.endswith('/academic-details/index.html'))
            page.locator('#demo-adult').check();page.locator('#demo-privacy').check()
            page.get_by_role('button',name='Start judge demo',exact=True).click();page.wait_for_url('**/dashboard/index.html',timeout=120000)
            page.locator('.portal-demo-banner').wait_for()
            demo_profile=page.request.get(BASE+'/api/v1/students/me').json()
            check('judge shortcut opens separate sample student',demo_profile['id']!=original_id and demo_profile['name']=='Demo Student')
            check('demo still satisfies the normal backend gate',page.request.get(BASE+'/api/v1/students/me/onboarding').json()['ready'])
            check('demo dashboard is clearly labelled', 'sample student' in page.locator('.portal-demo-banner').inner_text())
            page.get_by_role('heading',name='Matched opportunities',exact=True).wait_for(timeout=60000)
            page.screenshot(path='QA_EVIDENCE/onboarding-live-demo-dashboard.png',full_page=True)
            demo_tasks=page.request.get(BASE+'/api/v1/tasks').json()
            check('demo seeds pending sample work without fake completions',demo_tasks and all(t['status']=='PENDING' for t in demo_tasks))
            page.get_by_role('button',name='Exit demo',exact=True).click();page.wait_for_url('**/login.html')
            check('exit demo deletes account and ends session',page.request.get(BASE+'/api/v1/auth/me').status==401)
            page.locator('#email').fill(email);page.locator('#password').fill(password)
            page.get_by_role('button',name='Log in',exact=False).click();page.wait_for_url('**/onboarding/index.html')
            page.get_by_role('link',name='Continue onboarding',exact=False).wait_for()
            restored=page.request.get(BASE+'/api/v1/students/me').json()
            check('original student survives demo unchanged',restored['id']==original_id and restored['academics']==original_academics and not restored['skills'])
            page.get_by_role('link',name='Continue onboarding',exact=False).click();page.wait_for_url('**/career-goal/index.html')
            check('login resumes first unfinished step',True)
            page.locator('#direction').select_option('CUSTOM');page.locator('#goal').fill('Software Engineer')
            page.get_by_role('button',name='Save & Continue',exact=False).click();page.wait_for_url('**/interests/index.html')
            page.get_by_role('button',name='Save & Continue',exact=False).click()
            page.get_by_text('Choose at least one interest before continuing.',exact=True).wait_for()
            check('real wizard blocks empty interest submission',True)
            page.locator('.portal-chip').first.click();page.get_by_role('button',name='Save & Continue',exact=False).click();page.wait_for_url('**/skills/index.html')
            page.locator('#skill').fill('Programming');page.get_by_role('button',name='Add Skill',exact=True).click();saved()
            page.locator('.onboarding-actions button').click();page.wait_for_url('**/strengths/index.html')
            for next_path in ['values','form%20assessment']:
                page.locator('.portal-choice').first.click();page.get_by_role('button',name='Save & Continue',exact=False).click();page.wait_for_url('**/'+next_path+'/index.html')
            page.locator('fieldset').first.wait_for()
            page.get_by_role('button',name='Finish & prepare',exact=False).click()
            check('all eight assessment answers remain required',not page.request.get(BASE+'/api/v1/students/me/onboarding').json()['ready'])
            for group in page.locator('fieldset').all():group.locator('input[type=radio]').first.check()
            page.get_by_role('button',name='Finish & prepare',exact=False).click();page.wait_for_url('**/dashboard/index.html',timeout=120000)
            page.get_by_role('heading',name='Matched opportunities',exact=True).wait_for(timeout=60000)
            state=page.request.get(BASE+'/api/v1/students/me/onboarding').json()
            check('real eight-section gate completes',state['ready'] and state['completed']==8)
            check('automatic analysis precedes dashboard',any('/onboarding/prepare.html' in url for url in visited))
            recommendation=page.request.get(BASE+'/api/v1/recommendations/me').json();ranking_source=recommendation['source']
            expected='AI-ranked career suggestions' if ranking_source=='AI' else 'Profile matching'
            check('dashboard reports actual recommendation source',expected in page.locator('.onboarding-source-label').inner_text())
            check('dashboard loads opportunity matches automatically',page.get_by_role('heading',name='Matched opportunities',exact=True).is_visible())
            check('normal account is never labelled demo',page.locator('.portal-demo-banner').count()==0)
            page.screenshot(path='QA_EVIDENCE/onboarding-live-personal-dashboard.png',full_page=True)
            visit('/profile/index.html')
            page.get_by_role('button',name='Delete my account and saved data',exact=True).click();page.wait_for_url('**/login.html')
            check('normal QA account cleaned up',page.request.get(BASE+'/api/v1/auth/me').status==401)
        finally:
            response=page.request.get(BASE+'/api/v1/auth/me')
            if response.ok and (response.json().get('email','').startswith('guided-') or response.json().get('email','').endswith('@demo.samved.invalid')):
                token=page.request.get(BASE+'/api/v1/auth/csrf').json()['token'];page.request.delete(BASE+'/api/v1/students/me',headers={'X-CSRF-TOKEN':token})
            cleanup=p.request.new_context(base_url=BASE)
            token=cleanup.get('/api/v1/auth/csrf').json()['token']
            signed=cleanup.post('/api/v1/auth/login',headers={'X-CSRF-TOKEN':token},data={'email':email,'password':password})
            if signed.ok:
                token=cleanup.get('/api/v1/auth/csrf').json()['token'];cleanup.delete('/api/v1/students/me',headers={'X-CSRF-TOKEN':token})
            cleanup.dispose();browser.close()
    Path('QA_EVIDENCE/onboarding-live-result.json').write_text(json.dumps({'checks':checks,'rankingSource':ranking_source,'database':'MySQL','disposableAccountsDeleted':True},indent=2))
    print('PASS:',len(checks),'live onboarding/demo checks; ranking source='+str(ranking_source))

if __name__=='__main__':main()
