"""Check login validation, expired sessions, and onboarding redirects with mocked API errors."""
from playwright.sync_api import sync_playwright
from ui_smoke import BASE, Fixture
import json

def main():
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True)
        page=browser.new_page()
        fixture=Fixture()
        def invalid_login(route):
            if '/auth/login' in route.request.url:
                route.fulfill(status=401,content_type='application/json',
                              body=json.dumps({'code':'UNAUTHORIZED','message':'Invalid email or password.'}))
            else: fixture.handle(route)
        page.route('**/api/v1/**',invalid_login)
        page.goto(f'{BASE}/auth/login.html')
        page.locator('#email').fill('bad@example.com')
        page.locator('#password').fill('WrongPassword@123')
        page.locator('#loginForm button[type=submit]').click()
        page.wait_for_timeout(200)
        assert 'Invalid email or password.' in page.locator('#loginMessage').inner_text()
        assert page.url.endswith('/auth/login.html')
        print('PASS: invalid login stays on form with server error')
        page.unroute('**/api/v1/**',invalid_login)
        def no_session(route):
            if '/auth/me' in route.request.url:
                route.fulfill(status=401,content_type='application/json',
                              body=json.dumps({'code':'UNAUTHORIZED','message':'Session ended.'}))
            else: fixture.handle(route)
        page.route('**/api/v1/**',no_session)
        page.goto(f'{BASE}/dashboard/index.html')
        page.wait_for_url('**/auth/login.html')
        print('PASS: expired session redirects to login')
        page.unroute('**/api/v1/**',no_session)
        def onboarding(route):
            if '/students/me/onboarding' in route.request.url:
                route.fulfill(status=200,content_type='application/json',
                              body=json.dumps({'ready':False,'completed':0,'total':8,
                                               'sections':[{'key':'profile','complete':False,
                                                            'href':'/profile/profile.html','title':'Profile',
                                                            'detail':'Fill profile'}]}))
            else: fixture.handle(route)
        page.route('**/api/v1/**',onboarding)
        page.goto(f'{BASE}/dashboard/index.html')
        page.wait_for_url('**/profile/profile.html')
        print('PASS: incomplete onboarding redirects to profile')
        browser.close()

if __name__=='__main__': main()
