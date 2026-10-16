"""Disposable Research Scientist account: real AI, MySQL tasks, shared pages and progress."""
import json,uuid
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE='http://127.0.0.1:8080'

def main():
    checks=[];errors=[];sources={}
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        context=browser.new_context(viewport={'width':1440,'height':1000})
        api=context.request;page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        email='action-plan-'+uuid.uuid4().hex+'@example.test';password='ActionQa!Aa1'+uuid.uuid4().hex[:8]
        def check(label,ok):
            assert ok,label
            checks.append(label)
        def write(method,path,data=None):
            token=api.get(BASE+'/api/v1/auth/csrf').json()['token']
            response=api.fetch(BASE+'/api/v1/'+path,method=method,data=data,headers={'X-CSRF-TOKEN':token},timeout=90000)
            assert response.ok,f'{path}: HTTP {response.status}'
            return response.json() if response.body() else None
        try:
            write('POST','auth/register',{'name':'Research QA Student','email':email,'password':password,'educationLevel':'undergraduate','cityRegion':'Kochi','adultConfirmed':True,'privacyAccepted':True})
            write('POST','auth/login',{'email':email,'password':password})
            write('PUT','students/me',{'name':'Research QA Student','educationLevel':'undergraduate','cityRegion':'Kochi','careerGoal':{'type':'CUSTOM','text':'Research Scientist'}})
            values={'academics':[{'educationLevel':'undergraduate','institution':'QA College','course':'Physics','periodType':'SEMESTER','period':2,'scoreType':'PERCENTAGE','score':82,'subjects':[{'name':'Statistics','marks':85}]}],
                'interests':['Research','Science'],'skills':[{'name':'Python','proficiency':'BEGINNER'}],'strengths':['Curiosity','Analytical Thinking'],'values':['Continuous Learning','Discovery']}
            for key,value in values.items():write('PUT','students/me/'+key,value)
            write('PUT','students/me/review/career')
            chosen={'work':'research','activity':'experimenting','problem':'gathering','environment':'lab','motivation':'learning','working_style':'independent','skill':'analysis','confidence':'somewhat'}
            write('PUT','assessments/current/responses',{'questionVersion':1,'answers':[{'questionId':q,'optionId':o} for q,o in chosen.items()]})
            page.goto(BASE+'/onboarding/prepare.html');page.wait_for_url('**/dashboard/index.html',timeout=150000)
            page.get_by_role('heading',name='Matched opportunities',exact=True).wait_for(timeout=90000)
            plan=write('POST','action-plan/ensure');sources['plan']=plan['source']
            check('real provider generated the research plan',plan['source']=='AI' and plan['goal']=='Research Scientist')
            tasks=api.get(BASE+'/api/v1/tasks').json()
            check('seven real dated assignments persist',len(tasks)==7 and len(set(t['dueDate'] for t in tasks))==7 and all(t['automaticallyAssigned'] for t in tasks))
            before=set(t['id'] for t in tasks);write('POST','action-plan/ensure')
            check('refresh does not create duplicates',set(t['id'] for t in api.get(BASE+'/api/v1/tasks').json())==before)
            recs=api.get(BASE+'/api/v1/recommendations/me',timeout=90000).json();sources['career']=recs['source']
            check('AI returns bounded career match percentages',recs['source']=='AI' and all(isinstance(r.get('aiMatchPercent'),int) and 0<=r['aiMatchPercent']<=100 for r in recs['recommendations']))
            check('dashboard explains career match','Career match:' in page.locator('#portal-content').inner_text() and 'AI estimate' in page.locator('#portal-content').inner_text())
            check('dashboard includes charts and schedule',page.locator('.portal-progress-ring').count()==1 and page.locator('.portal-week-column').count()==7 and page.locator('.portal-schedule-row').count()==7)
            today_task=next(t for t in tasks if t['dueDate']==plan['today'])
            page.get_by_role('button',name='Mark complete',exact=True).first.click()
            page.wait_for_function("document.querySelector('.portal-progress-ring strong')?.textContent==='14%'")
            check('completion updates actual progress',api.get(BASE+'/api/v1/progress/me').json()['completedTasks']==1)
            page.screenshot(path='QA_EVIDENCE/action-plan-live-dashboard.png',full_page=True)
            for route in ['daily%20tasks','planner','deadline%20system']:
                page.goto(BASE+'/'+route+'/index.html');page.get_by_role('heading',name=today_task['title'],exact=True).wait_for(timeout=60000)
                check(route+' shows same persisted assignment',True)
            page.goto(BASE+'/dashboard/index.html');page.get_by_role('heading',name='Matched opportunities',exact=True).wait_for(timeout=60000)
            page.set_viewport_size({'width':390,'height':844});page.screenshot(path='QA_EVIDENCE/action-plan-live-mobile.png',full_page=True)
            check('mobile dashboard fits',not page.evaluate("[...document.querySelectorAll('main,.portal-schedule-row,.portal-progress-grid,.portal-btn')].some(e=>e.getBoundingClientRect().right>innerWidth+1)"))
            check('no browser errors',not errors)
        finally:
            response=api.get(BASE+'/api/v1/auth/me')
            if response.ok and response.json().get('email')==email:write('DELETE','students/me')
            context.close();browser.close()
    Path('QA_EVIDENCE/action-plan-live-result.json').write_text(json.dumps({'checks':checks,'sources':sources,'errors':errors,'disposableAccountDeleted':True},indent=2))
    print('VERDICT: PASS —',len(checks),'live checks;',sources)

if __name__=='__main__':main()
