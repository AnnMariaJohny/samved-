"""Stateful guided-onboarding browser checks on the updated portal source."""
import json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
from ui_smoke import Fixture

BASE='http://127.0.0.1:8765'

class GuidedFixture(Fixture):
    def __init__(self):
        super().__init__()
        self.profile['id']=101
        self.career_reviewed=False
        self.assessment_done=False
        self.fail_recommendations=False
    def state(self):
        steps=[('profile','Personal details',True,'/profile/profile.html'),
               ('academics','Academic background',bool(self.profile['academics']),'/profile/academic.html'),
               ('career','Career direction',self.career_reviewed,'/profile/careergoal.html'),
               *[(s,s.title(),bool(self.profile[s]),'/profile/'+s+'.html') for s in ['interests','skills','strengths','values']],
               ('assessment','Career assessment',self.assessment_done,'/assessment/assessment.html')]
        sections=[{'key':k,'title':t,'complete':bool(c),'href':h,'detail':t} for k,t,c,h in steps]
        done=sum(s['complete'] for s in sections)
        return {'completed':done,'total':8,'ready':done==8,'sections':sections}
    def handle(self,route):
        path=urlparse(route.request.url).path
        if path.endswith('/students/me/onboarding'):
            route.fulfill(status=200,content_type='application/json',body=json.dumps(self.state()));return
        if path.endswith('/students/me/review/career'):self.career_reviewed=True
        if path.endswith('/assessments/current/responses'):self.assessment_done=True
        if path.endswith('/recommendations/me') and self.fail_recommendations:
            route.fulfill(status=503,content_type='application/json',body='{"message":"Career provider temporarily unavailable"}');return
        super().handle(route)

def main():
    fixture=GuidedFixture();checks=[];errors=[];visited=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        page=browser.new_page(viewport={'width':1440,'height':900})
        page.route('**/api/v1/**',fixture.handle)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('framenavigated',lambda frame:visited.append(urlparse(frame.url).path) if frame==page.main_frame else None)
        def check(label,ok):
            assert ok,label
            checks.append(label)
        def visit(path):page.goto(BASE+path);page.wait_for_timeout(150)
        def saved():page.wait_for_function("document.getElementById('portal-status').textContent === 'Saved to your account.'")
        visit('/login.html')
        page.locator('#email').fill('test@example.com');page.locator('#password').fill('Password@123')
        page.get_by_role('button',name='Log in',exact=False).click();page.wait_for_url('**/onboarding/index.html')
        check('incomplete login opens onboarding welcome',True)
        page.locator('.onboarding-overview').wait_for()
        check('welcome shows exactly eight required sections',page.locator('.onboarding-overview li').count()==8)
        check('feature navigation is hidden',page.locator('.portal-sidebar .portal-nav-link').count()==0)
        check('future steps are locked',page.locator('.onboarding-step[aria-disabled=true]').count()==6)
        page.screenshot(path='QA_EVIDENCE/guided-onboarding-welcome.png',full_page=True)
        page.get_by_role('link',name='Review personal details & start').click();page.wait_for_url('**/profile/index.html')
        check('profile setup hides account settings',page.get_by_role('button',name='Delete my account and saved data').count()==0)
        page.get_by_role('button',name='Save & Continue',exact=False).click();page.wait_for_url('**/academic-details/index.html')
        check('saved personal details advance to education',True)
        check('education cannot continue empty',page.locator('.onboarding-actions button').is_disabled())
        visit('/skills/index.html');page.wait_for_url('**/academic-details/index.html')
        check('direct future-step URL returns to unfinished step',True)
        page.set_viewport_size({'width':390,'height':844})
        check('mobile onboarding has no horizontal overflow',not page.evaluate('document.documentElement.scrollWidth>innerWidth+1'))
        page.screenshot(path='QA_EVIDENCE/guided-onboarding-mobile.png',full_page=True)
        page.set_viewport_size({'width':1440,'height':900})
        for name,value in [('institution','Fixture College'),('course','Computer Science'),('period','2'),('score','86')]:page.locator('#'+name).fill(value)
        page.locator('[name=subject]').fill('Programming');page.locator('[name=marks]').fill('90')
        page.get_by_role('button',name='Save Academic Record').click();saved()
        check('education unlocks continue only after API save',page.locator('.onboarding-actions button').is_enabled())
        page.get_by_role('button',name='Delete record',exact=True).click();saved()
        check('deleting the final education record locks continue again',page.locator('.onboarding-actions button').is_disabled())
        for name,value in [('institution','Fixture College'),('course','Computer Science'),('period','2'),('score','86')]:page.locator('#'+name).fill(value)
        page.locator('[name=subject]').fill('Programming');page.locator('[name=marks]').fill('90')
        page.get_by_role('button',name='Save Academic Record').click();saved()
        page.reload();page.locator('.onboarding-actions button:enabled').wait_for()
        check('resume loads saved education', 'Fixture College' in page.locator('#portal-content').inner_text())
        page.locator('.onboarding-actions button').click();page.wait_for_url('**/career-goal/index.html')
        page.get_by_role('button',name='Save & Continue',exact=False).click();page.wait_for_url('**/interests/index.html')
        check('explicit exploring choice is valid and advances',fixture.career_reviewed)
        page.get_by_role('button',name='Save & Continue',exact=False).click()
        page.get_by_text('Choose at least one interest before continuing.',exact=True).wait_for()
        check('empty interests cannot advance',not fixture.profile['interests'])
        page.locator('.portal-chip').first.click();page.get_by_role('button',name='Save & Continue',exact=False).click();page.wait_for_url('**/skills/index.html')
        page.locator('#skill').fill('Java');page.get_by_role('button',name='Add Skill',exact=True).click();saved()
        page.get_by_role('button',name='Delete',exact=True).click();saved()
        check('deleting the final skill locks continue again',page.locator('.onboarding-actions button').is_disabled())
        page.locator('#skill').fill('Java');page.get_by_role('button',name='Add Skill',exact=True).click();saved()
        page.locator('.onboarding-actions button').click();page.wait_for_url('**/strengths/index.html')
        for section,next_path in [('strengths','values'),('values','form%20assessment')]:
            page.locator('.portal-choice').first.click();page.get_by_role('button',name='Save & Continue',exact=False).click();page.wait_for_url('**/'+next_path+'/index.html')
            check(section+' must save before advancing',len(fixture.profile[section])==1)
        page.wait_for_function("document.querySelectorAll('fieldset').length===8")
        check('assessment requires eight answers',page.locator('fieldset').count()==8)
        page.get_by_role('button',name='Finish & prepare',exact=False).click()
        check('empty assessment does not submit',not fixture.assessment_done)
        for group in page.locator('fieldset').all():group.locator('input[type=radio]').first.check()
        page.get_by_role('button',name='Finish & prepare',exact=False).click();page.wait_for_url('**/dashboard/index.html')
        check('all steps complete before dashboard',fixture.state()['ready'])
        check('analysis page appears between assessment and dashboard','/onboarding/prepare.html' in visited)
        page.get_by_role('heading',name='Matched opportunities',exact=True).wait_for()
        check('dashboard automatically loads opportunities',any(c[1]=='opportunities' for c in fixture.calls))
        check('dashboard automatically computes career suggestions',any(c[1]=='recommendations/me' for c in fixture.calls))
        check('dashboard automatically prepares roadmap guidance',any(c[1]=='roadmaps/guidance' for c in fixture.calls))
        check('fallback label does not claim AI was used','AI ranking is not enabled' in page.locator('#portal-content').inner_text())
        page.screenshot(path='QA_EVIDENCE/guided-onboarding-dashboard.png',full_page=True)
        fixture.fail_recommendations=True
        visit('/onboarding/prepare.html');page.wait_for_url('**/dashboard/index.html')
        page.get_by_role('button',name='Try again',exact=True).wait_for()
        check('provider failure leaves a usable dashboard with retry',True)
        check('no browser errors',not errors)
        browser.close()
    Path('QA_EVIDENCE/guided-onboarding-result.json').write_text(json.dumps({'checks':checks,'errors':errors},indent=2))
    print('PASS:',len(checks),'guided onboarding checks')

if __name__=='__main__':main()
