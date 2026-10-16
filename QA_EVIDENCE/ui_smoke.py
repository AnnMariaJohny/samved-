"""Browser smoke checks against the static frontend with a stateful API fixture.

Start `python -m http.server 8765 --bind 127.0.0.1 --directory frontend`,
then run from the repository root: python QA_EVIDENCE/ui_smoke.py
This checks browser wiring; it is not a replacement for a live Java/MySQL test.
"""
import json
import os
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

BASE = os.environ.get('SAMVED_TEST_BASE', 'http://127.0.0.1:8765')
PAGES = [
    'dashboard/index.html', 'profile/profile.html', 'profile/academic.html',
    'profile/interests.html', 'profile/skills.html', 'profile/strengths.html',
    'profile/values.html', 'profile/careergoal.html', 'assessment/assessment.html',
    'career%20roadmap/index.html', 'progress%20tracker/index.html',
    'daily%20tasks/index.html', 'deadline%20system/index.html',
    'oppertunity%20page/index.html', 'recommondation%20page/index.html',
    'charts/index.html', 'roadmap-explorer/view.html',
]

class Fixture:
    def __init__(self):
        self.calls = []
        self.profile = {
            'name':'Test Student', 'email':'test@example.com', 'cityRegion':'Kerala',
            'educationLevel':'undergraduate', 'careerGoal':{'type':'EXPLORING','text':None},
            'skills':[], 'academics':[], 'interests':[], 'strengths':[], 'values':[]
        }
        self.tasks = []
        self.notifications = []
        self.saved = []
        self.active_slug = None

    def handle(self, route):
        request = route.request
        path = urlparse(request.url).path.removeprefix('/api/v1/')
        method = request.method
        body = json.loads(request.post_data) if request.post_data else None
        self.calls.append((method, path, body, urlparse(request.url).query))
        checklist = {'ready':True,'completed':8,'total':8,'sections':[]}
        catalogue = [{'id':'frontend','title':'Frontend Developer','description':'Learn web UI',
                      'url':'https://roadmap.sh/frontend'}]
        guidance = {'checklist':checklist,'recommended':[],'saved':self.saved,
                    'activeSlug':self.active_slug,'message':'Browse a path to get started.'}
        result = []
        if path == 'auth/csrf': result = {'token':'test-token'}
        elif path == 'auth/me': result = self.profile
        elif path == 'auth/login': result = {'message':'Signed in'}
        elif path == 'auth/register': result = {'message':'Registered'}
        elif path == 'auth/logout': result = {'message':'Signed out'}
        elif path == 'students/me/onboarding': result = checklist
        elif path == 'students/me':
            if method == 'PUT': self.profile.update(body)
            result = self.profile
        elif path.startswith('students/me/review/'): result = self.profile
        elif path.startswith('students/me/'):
            section = path.split('/')[-1]
            if section in self.profile:
                if method == 'PUT': self.profile[section] = body
                result = self.profile[section]
        elif path == 'auth/password': result = {'message':'Password changed'}
        elif path == 'roadmaps/guidance': result = guidance
        elif path == 'roadmaps/catalogue': result = catalogue
        elif path == 'roadmaps/preferences':
            if method == 'POST' and body.get('slug') == 'frontend' and not self.saved:
                self.saved.append({**catalogue[0],'slug':'frontend'})
            result = guidance
        elif path == 'roadmaps/preferences/active':
            self.active_slug=body.get('slug'); guidance['activeSlug']=self.active_slug; result=guidance
        elif path.startswith('roadmaps/preferences/'):
            if method == 'DELETE': self.saved.clear()
            result=guidance
        elif path == 'roadmaps/content':
            result={'title':'Frontend Developer','nodes':[
                {'id':'topic-1','type':'topic','position':{'x':0,'y':0},
                 'width':180,'height':50,'data':{'label':'HTML basics'}}], 'edges':[]}
        elif path == 'roadmaps/content/topic':
            result={'description':'Learn HTML structure.','resources':[]}
        elif path.startswith('roadmaps/content'): result = {'content':'Guide content'}
        elif path == 'roadmaps/me': result = []
        elif path == 'progress/me':
            done = sum(task['status']=='COMPLETED' for task in self.tasks)
            result = {'percent':0,'completedTasks':done,'totalTasks':len(self.tasks),
                      'completedMilestones':0,'totalMilestones':0,'completed':done,'total':len(self.tasks)}
        elif path == 'tasks':
            if method == 'POST':
                result = {'id':len(self.tasks)+1,'status':'PENDING','description':None,
                          'dueDate':None,'roadmapId':None,'milestoneId':None, **body}
                self.tasks.append(result)
            else: result = self.tasks
        elif path.startswith('tasks/'):
            parts = path.split('/')
            task = next((t for t in self.tasks if str(t['id'])==parts[1]), None)
            if task:
                if method == 'DELETE': self.tasks.remove(task); result = None
                elif method in ('PATCH','PUT'): task.update(body); result = task
        elif path == 'notifications': result = self.notifications
        elif path.startswith('notifications/'):
            note = next((n for n in self.notifications if str(n['id'])==path.split('/')[1]), None)
            if note: note['readAt']='2026-10-16T00:00:00Z'; result=note
        elif path == 'recommendations/me':
            result = {'source':'RULES','guidance':'Explore your options.','recommendations':[
                {'careerId':1,'careerTitle':'Web Developer','score':68,
                 'reasons':['Matches your interests'],'matchedSkills':['HTML'],
                 'skillGaps':['CSS'],'ruleVersion':'test-rule'}]}
        elif path == 'opportunities':
            query = urlparse(request.url).query
            item = {'id':1,'title':'Web internship','summary':'Build a website.',
                    'type':'INTERNSHIP','organizer':'Test Org','sourceName':'Test Source',
                    'sourceUrl':'https://example.org/listing','applicationUrl':'https://example.org/apply',
                    'deadline':'2026-11-01','verifiedAt':'2026-10-16T00:00:00Z',
                    'matchedSignals':['HTML']}
            result = {'content':[item] if 'type=' not in query or 'type=INTERNSHIP' in query else [],
                      'totalElements':1}
        elif path == 'roadmaps/discover': result = [{'roadmap':catalogue[0],'reason':'Topic match'}]
        elif path == 'roadmaps/for-role': result = {'source':'ROADMAP_SH','jobTitle':'frontend',
                                                   'summary':'Learn frontend.','milestones':[]}
        elif path == 'assessments/current':
            result = {'questionVersion':1,'questions':[
                {'id':f'q{i}','text':f'Question {i}?','options':[
                    {'id':'a','label':'Yes','dimension':'CREATIVE'},
                    {'id':'b','label':'No','dimension':'ANALYTICAL'}]}
                for i in range(1,9)],'answers':[]}
        elif path == 'assessments/current/responses': result = body
        elif path == 'assessments/current/result':
            result = {'leadingDimensions':['CREATIVE'],'answeredQuestions':8}
        route.fulfill(status=200,content_type='application/json',body=json.dumps(result))

def main():
    fixture = Fixture()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width':1365,'height':900})
        page.route('**/api/v1/**', fixture.handle)
        problems = []
        for path in PAGES:
            errors=[]
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(f'{BASE}/{path}')
            page.wait_for_timeout(250)
            visible = page.locator('body').inner_text()
            shell = page.locator('.portal-topbar').count()==1 and page.locator('.portal-sidebar').count()==1
            if not shell: problems.append(f'{path}: missing portal shell')
            if errors: problems.append(f'{path}: JS error: {errors[0]}')
            if 'Anugrah' in visible or 'Demo data' in visible:
                problems.append(f'{path}: visible sample content')
            labels=page.locator('button:visible').all_inner_texts()
            print(f'{path}: shell={shell}, buttons={labels}, errors={len(errors)}')
        page.set_viewport_size({'width':390,'height':844})
        for path in PAGES:
            page.goto(f'{BASE}/{path}')
            page.wait_for_timeout(150)
            if page.evaluate('document.documentElement.scrollWidth > innerWidth + 1'):
                problems.append(f'{path}: mobile horizontal overflow')
            if not page.locator('.samved-menu-toggle').is_visible():
                problems.append(f'{path}: mobile navigation unavailable')
        browser.close()
    print('PROBLEMS:', *problems, sep='\n- ')

if __name__ == '__main__': main()
