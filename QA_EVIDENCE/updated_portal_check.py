"""Validate only SAMVED_Portal_Updated's pages against the shared API fixture.

Serve SAMVED_Portal_Updated/JAVA PROJECT OOP on port 8765, then run this file.
This validates browser/API wiring; Java boundary and live MySQL checks are separate.
"""
import json
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright
from ui_smoke import Fixture

ROOT = Path('SAMVED_Portal_Updated/JAVA PROJECT OOP')
BASE = 'http://127.0.0.1:8765'

def main():
    fixture = Fixture()
    checks = []
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width':1440,'height':900})
        page.route('**/api/v1/**', fixture.handle)
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('dialog', lambda dialog: dialog.accept())
        def visit(path):
            page.goto(BASE+'/'+quote(path,safe='/'))
            page.wait_for_timeout(200)
        def check(label, ok):
            assert ok, label
            checks.append(label)
        pages=json.loads((ROOT/'portal-page-index.json').read_text())
        for path, kind in pages.items():
            visit(path)
            check(path+' uses updated source page',page.locator('body').get_attribute('data-page')==kind)
            if kind not in ['login','register']:
                check(path+' uses original portal shell',page.locator('.app-layout .portal-body-grid > main.portal-main-card').count()==1)
                check(path+' has no old shell',page.locator('.samved-portal-adapter,.samved-topbar').count()==0)
            check(path+' has no sample student', 'Anugrah' not in page.locator('body').inner_text())
        visit('profile/profile.html')
        page.wait_for_url('**/profile/index.html')
        check('legacy profile URL maps to updated profile',True)
        page.locator('#name').fill('Saved Student')
        page.get_by_role('button',name='Save profile',exact=True).click()
        page.wait_for_timeout(200)
        check('profile persists through API',fixture.profile['name']=='Saved Student')
        visit('academic-details/index.html')
        for selector,value in [('institution','Test College'),('course','Computer Science'),('period','2'),('score','88')]:
            page.locator('#'+selector).fill(value)
        page.locator('[name=subject]').fill('Mathematics')
        page.locator('[name=marks]').fill('90')
        page.get_by_role('button',name='Save Academic Record').click()
        page.wait_for_timeout(200)
        check('academic source page saves record and subject',fixture.profile['academics'][0]['subjects'][0]['name']=='Mathematics')
        page.reload();page.wait_for_timeout(200)
        check('academic source page reloads saved record','Test College' in page.locator('#portal-content').inner_text())
        page.screenshot(path='QA_EVIDENCE/actual-updated-academic-desktop.png',full_page=True)
        visit('skills/index.html')
        page.locator('#skill').fill('Java')
        page.get_by_role('button',name='Add Skill',exact=True).click();page.wait_for_timeout(200)
        check('skills source page saves proficiency',fixture.profile['skills'][0]['proficiency']=='BEGINNER')
        for section in ['interests','strengths','values']:
            visit(section+'/index.html')
            page.locator('.portal-chip,.portal-choice').first.click()
            page.get_by_role('button',name='Save '+section,exact=True).click();page.wait_for_timeout(200)
            check(section+' source choices persist',len(fixture.profile[section])>0)
        visit('career-goal/index.html')
        page.locator('#direction').select_option('CUSTOM');page.locator('#goal').fill('Robotics researcher')
        page.get_by_role('button',name='Save Career Goal').click();page.wait_for_timeout(200)
        check('career goal persists',fixture.profile['careerGoal']['text']=='Robotics researcher')
        visit('form assessment/index.html')
        for group in page.locator('fieldset').all():group.locator('input[type=radio]').first.check()
        page.get_by_role('button',name='Save Assessment').click();page.wait_for_timeout(200)
        check('assessment submits eight backend answers',any(c[1]=='assessments/current/responses' and len(c[2]['answers'])==8 for c in fixture.calls))
        visit('daily tasks/index.html')
        page.locator('#title').fill('Prepare portfolio');page.locator('#dueDate').fill('2026-11-01')
        page.get_by_role('button',name='Save Task',exact=True).click();page.wait_for_timeout(200)
        check('daily task source page saves task',fixture.tasks[0]['title']=='Prepare portfolio')
        page.get_by_role('button',name='Complete',exact=True).click();page.wait_for_timeout(200)
        check('task completion persists',fixture.tasks[0]['status']=='COMPLETED')
        page.get_by_role('button',name='Edit',exact=True).click();page.locator('#title').fill('Updated portfolio')
        page.get_by_role('button',name='Save Task',exact=True).click();page.wait_for_timeout(200)
        check('task edit persists',fixture.tasks[0]['title']=='Updated portfolio')
        page.get_by_role('button',name='Delete',exact=True).click();page.wait_for_timeout(200)
        check('task delete persists',not fixture.tasks)
        visit('career roadmap/index.html')
        page.get_by_role('button',name='Preview',exact=True).first.click();page.wait_for_timeout(200)
        check('updated roadmap page opens native graph',page.locator('.rv-node').count()==1)
        page.get_by_role('button',name='Add to my roadmaps',exact=True).first.click();page.wait_for_timeout(200)
        check('updated roadmap saves preference',len(fixture.saved)==1)
        visit('oppertunity page/index.html')
        page.locator('#opportunityType').select_option('INTERNSHIP');page.wait_for_timeout(200)
        check('updated opportunity filter calls backend',any(c[1]=='opportunities' and 'type=INTERNSHIP' in c[3] for c in fixture.calls))
        visit('dashboard/index.html')
        page.screenshot(path='QA_EVIDENCE/actual-updated-dashboard-desktop.png',full_page=True)
        page.set_viewport_size({'width':390,'height':844})
        for path,kind in pages.items():
            visit(path)
            check(path+' fits mobile',not page.evaluate('document.documentElement.scrollWidth > innerWidth+1'))
            if kind not in ['login','register']:
                check(path+' offers mobile menu',page.locator('.portal-mobile-menu').is_visible())
        visit('academic-details/index.html')
        page.screenshot(path='QA_EVIDENCE/actual-updated-academic-mobile.png',full_page=True)
        page.locator('.portal-mobile-menu').click()
        check('updated mobile navigation opens',page.locator('.portal-sidebar').is_visible())
        page.get_by_role('button',name='Log Out',exact=False).click();page.wait_for_url('**/login.html')
        check('source logout calls backend',any(c[1]=='auth/logout' and c[0]=='POST' for c in fixture.calls))
        page.locator('#email').fill('test@example.com');page.locator('#password').fill('Password@123')
        page.get_by_role('button',name='Log in',exact=False).click();page.wait_for_url('**/dashboard/index.html')
        check('source login calls backend',any(c[1]=='auth/login' and c[0]=='POST' for c in fixture.calls))
        check('no browser script errors',not errors)
        browser.close()
    result={'checks':len(checks),'errors':errors,'pages':len(pages),'source':str(ROOT)}
    Path('QA_EVIDENCE/actual-updated-portal-result.json').write_text(json.dumps(result,indent=2))
    print('PASS:',len(checks),'checks across',len(pages),'updated source pages')

if __name__=='__main__':main()
