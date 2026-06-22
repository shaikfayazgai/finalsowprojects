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

task_def_id = 'task_8313798f74c84a978cff1e77'  # from this run

print('=== STEP 9 REDO: POST /api/v1/submissions with taskDefinitionId ===')
r = requests.post(
    f'{GW}/api/v1/submissions',
    json={'taskId': task_def_id, 'taskDefinitionId': task_def_id, 'summary': 'E2E test submission redo', 'structured_response': {'note': 'e2e'}},
    headers={'Authorization': f'Bearer {cont_tok}', 'Content-Type': 'application/json'}
)
print(f'Create: {r.status_code} {r.text[:600]}')
submission_id = None
if r.status_code in (200, 201):
    body = r.json()
    submission_id = body.get('submission', {}).get('id') or body.get('id')
    print(f'submission_id={submission_id}')

    if submission_id:
        r2 = requests.post(
            f'{GW}/api/v1/submissions/{submission_id}/submit',
            json={},
            headers={'Authorization': f'Bearer {cont_tok}', 'Content-Type': 'application/json'}
        )
        print(f'Submit: {r2.status_code} {r2.text[:400]}')

print()
print('=== CHECK MENTOR QUEUE AFTER SUBMIT ===')
rq = requests.get(f'{GW}/api/v1/mentor/queue', headers={'Authorization': f'Bearer {ment_tok}'})
print(f'Mentor queue: {rq.status_code} {rq.text[:600]}')

# Try mentor review endpoints
if submission_id:
    print()
    print(f'=== MENTOR CLAIM submission {submission_id} ===')
    rc = requests.post(
        f'{GW}/api/v1/mentor/submissions/{submission_id}/claim',
        json={},
        headers={'Authorization': f'Bearer {ment_tok}', 'Content-Type': 'application/json'}
    )
    print(f'Claim: {rc.status_code} {rc.text[:400]}')

    print()
    print(f'=== MENTOR DECIDE on submission {submission_id} ===')
    rd = requests.post(
        f'{GW}/api/v1/mentor/submissions/{submission_id}/decide',
        json={'kind': 'accept', 'comment': 'e2e accepted', 'score': 85},
        headers={'Authorization': f'Bearer {ment_tok}', 'Content-Type': 'application/json'}
    )
    print(f'Decide: {rd.status_code} {rd.text[:400]}')

print()
print('=== REVIEWER DASHBOARD after mentor accept ===')
rrev = requests.get(f'{GW}/api/v1/reviewer/dashboard', headers={'Authorization': f'Bearer {rev_tok}'})
print(f'Status: {rrev.status_code}')
body = rrev.json()
print(json.dumps(body, indent=2)[:2000])

assignments = body.get('assignments', [])
print(f'Assignments found: {len(assignments)}')
if assignments:
    asn = assignments[0]
    asn_id = asn.get('id')
    print(f'First assignment id={asn_id}, status={asn.get("status")}')

    print()
    print(f'=== REVIEWER PATCH assignment {asn_id} ===')
    rp = requests.patch(
        f'{GW}/api/v1/reviewer/assignments/{asn_id}',
        json={'status': 'approved', 'feedback': 'e2e approved'},
        headers={'Authorization': f'Bearer {rev_tok}', 'Content-Type': 'application/json'}
    )
    print(f'PATCH: {rp.status_code} {rp.text[:400]}')

# Check plan approve/activate with correct id
plan_id = 'plan_17b1ace6db0e47139b9b9215'
print()
print(f'=== PLAN APPROVE/ACTIVATE for {plan_id} ===')
# Try SA token
r_ap = requests.post(
    f'{GW}/api/v1/enterprise/decomposition/plans/{plan_id}/approve',
    json={},
    headers={'Authorization': f'Bearer {sa_tok}', 'Content-Type': 'application/json'}
)
print(f'Approve with SA: {r_ap.status_code} {r_ap.text[:300]}')

r_ac = requests.post(
    f'{GW}/api/v1/enterprise/decomposition/plans/{plan_id}/activate',
    json={},
    headers={'Authorization': f'Bearer {ent_tok}', 'Content-Type': 'application/json'}
)
print(f'Activate with ENT: {r_ac.status_code} {r_ac.text[:300]}')
