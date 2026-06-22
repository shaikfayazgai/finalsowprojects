"""
Complete reviewer_approve with new assignment id=11, then verify task completion.
Also test plan approve/activate more paths.
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

assignment_id = '11'

print(f'=== REVIEWER PATCH assignment {assignment_id} ===')
rp = requests.patch(
    f'{GW}/api/v1/reviewer/assignments/{assignment_id}',
    json={'status': 'approved', 'feedback': 'e2e approved'},
    headers={'Authorization': f'Bearer {rev_tok}', 'Content-Type': 'application/json'}
)
print(f'PATCH: {rp.status_code} {rp.text[:600]}')

print()
print('=== REVIEWER DASHBOARD AFTER PATCH ===')
rrev = requests.get(f'{GW}/api/v1/reviewer/dashboard', headers={'Authorization': f'Bearer {rev_tok}'})
body = rrev.json()
stats = body.get('stats', {})
print(f'Stats: {json.dumps(stats)}')
assignments = body.get('assignments', [])
for a in assignments:
    print(f"  id={a['id']} status={a['status']} projectName={a.get('projectName', '')[:40]}")

# Check enterprise review queue after approval
print()
print('=== ENTERPRISE REVIEW QUEUE after reviewer approval ===')
req = requests.get(f'{GW}/api/v1/enterprise/review-queue', headers={'Authorization': f'Bearer {ent_tok}'})
print(f'Status: {req.status_code} {req.text[:600]}')

# Investigate plan approve/activate -- check what routes the enterprise service exposes
# The plan get works at /api/v1/enterprise/decomposition/plans/{id}
# But approve/activate returns 404 -- let's check if plan needs to be in a specific state
plan_id = 'plan_17b1ace6db0e47139b9b9215'

print()
print('=== GET plan detail to see state ===')
rp = requests.get(
    f'{GW}/api/v1/enterprise/decomposition/plans/{plan_id}',
    headers={'Authorization': f'Bearer {ent_tok}'}
)
print(f'Status: {rp.status_code}')
body = rp.json()
plan_data = body.get('data', {})
print(f'Plan status={plan_data.get("status")}, locked={plan_data.get("locked")}')

# Try POST to approve using the plan's own id (no 'plans/' prefix?)
r_ap2 = requests.post(
    f'{GW}/api/v1/enterprise/decomposition/plans/{plan_id}/approve',
    json={},
    headers={'Authorization': f'Bearer {ent_tok}', 'Content-Type': 'application/json'}
)
print(f'POST approve (ent): {r_ap2.status_code} {r_ap2.text[:300]}')

# Check if gateway routes this to a different service
# Try with sa token
r_ap3 = requests.post(
    f'{GW}/api/v1/enterprise/decomposition/plans/{plan_id}/approve',
    json={},
    headers={'Authorization': f'Bearer {sa_tok}', 'Content-Type': 'application/json'}
)
print(f'POST approve (sa): {r_ap3.status_code} {r_ap3.text[:300]}')

# Try activate
r_ac = requests.post(
    f'{GW}/api/v1/enterprise/decomposition/plans/{plan_id}/activate',
    json={},
    headers={'Authorization': f'Bearer {ent_tok}', 'Content-Type': 'application/json'}
)
print(f'POST activate: {r_ac.status_code} {r_ac.text[:300]}')

# Get gateway info to understand routing
print()
print('=== GATEWAY ROOT ===')
rg = requests.get(f'{GW}/')
print(f'{rg.status_code} {rg.text[:400]}')

print()
print('=== GATEWAY /health ===')
rh = requests.get(f'{GW}/health')
print(f'{rh.status_code} {rh.text[:400]}')

print()
print('=== GATEWAY /api/v1/enterprise/decomposition/ ===')
rd = requests.get(f'{GW}/api/v1/enterprise/decomposition/', headers={'Authorization': f'Bearer {ent_tok}'})
print(f'{rd.status_code} {rd.text[:400]}')
