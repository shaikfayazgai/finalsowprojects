"""
Investigate: mentor claim/decide uses mentor_review id (not submission id).
Also investigate plan approve/activate routing.
"""
import requests, json

GW = 'http://127.0.0.1:9000'
PASSWORD = 'Glimmora@123'

def login(email):
    r = requests.post(f'{GW}/api/v1/auth/login', json={'email': email, 'password': PASSWORD})
    return r.json().get('access_token')

ent_tok = login('iotcourseiot@gmail.com')
rev_tok = login('reviewer.live@glimmora.dev')
cont_tok = login('contributor.live@glimmora.dev')
ment_tok = login('mywebsitebuilt@gmail.com')
sa_tok = login('superadmin@glimmora.dev')

# Mentor queue item id=29 (the mentor_review id, not submission id)
mentor_review_id = 29

print('=== MENTOR CLAIM using mentor_review id=29 ===')
rc = requests.post(
    f'{GW}/api/v1/mentor/submissions/{mentor_review_id}/claim',
    json={},
    headers={'Authorization': f'Bearer {ment_tok}', 'Content-Type': 'application/json'}
)
print(f'Claim: {rc.status_code} {rc.text[:400]}')

print()
print('=== MENTOR DECIDE using mentor_review id=29 ===')
rd = requests.post(
    f'{GW}/api/v1/mentor/submissions/{mentor_review_id}/decide',
    json={'kind': 'accept', 'comment': 'e2e accepted', 'score': 85},
    headers={'Authorization': f'Bearer {ment_tok}', 'Content-Type': 'application/json'}
)
print(f'Decide: {rd.status_code} {rd.text[:600]}')

print()
print('=== MENTOR QUEUE AFTER DECIDE ===')
rq = requests.get(f'{GW}/api/v1/mentor/queue', headers={'Authorization': f'Bearer {ment_tok}'})
print(f'{rq.status_code} {rq.text[:600]}')

print()
print('=== REVIEWER DASHBOARD AFTER MENTOR DECIDE ===')
rrev = requests.get(f'{GW}/api/v1/reviewer/dashboard', headers={'Authorization': f'Bearer {rev_tok}'})
body = rrev.json()
print(json.dumps(body, indent=2)[:2000])

# Plan routes investigation
print()
print('=== PLAN ROUTES - try different paths ===')
plan_id = 'plan_17b1ace6db0e47139b9b9215'

# Maybe it's under /api/v1/plans/ not /api/v1/enterprise/decomposition/plans/
r1 = requests.get(f'{GW}/api/v1/plans/{plan_id}', headers={'Authorization': f'Bearer {ent_tok}'})
print(f'GET /api/v1/plans/{plan_id}: {r1.status_code} {r1.text[:200]}')

# Maybe approve/activate doesn't use enterprise prefix in this service
r2 = requests.post(
    f'{GW}/api/v1/decomposition/plans/{plan_id}/approve',
    json={},
    headers={'Authorization': f'Bearer {ent_tok}', 'Content-Type': 'application/json'}
)
print(f'POST /api/v1/decomposition/plans/.../approve: {r2.status_code} {r2.text[:200]}')

# Examine gateway routing for plans
r3 = requests.get(f'{GW}/api/v1/enterprise/decomposition/plans/{plan_id}', headers={'Authorization': f'Bearer {ent_tok}'})
print(f'GET /api/v1/enterprise/decomposition/plans/{plan_id}: {r3.status_code} {r3.text[:400]}')
