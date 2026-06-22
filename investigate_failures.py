import requests, json

GW = 'http://127.0.0.1:9000'
PASSWORD = 'Glimmora@123'

def login(email):
    r = requests.post(f'{GW}/api/v1/auth/login', json={'email': email, 'password': PASSWORD})
    return r.json().get('access_token')

ent_tok = login('iotcourseiot@gmail.com')
rev_tok = login('reviewer.live@glimmora.dev')
cont_tok = login('contributor.live@glimmora.dev')
sa_tok = login('superadmin@glimmora.dev')

# Fix 1: Reviewer dashboard full response
print('=== REVIEWER DASHBOARD FULL ===')
r = requests.get(f'{GW}/api/v1/reviewer/dashboard', headers={'Authorization': f'Bearer {rev_tok}'})
body = r.json()
print(json.dumps(body, indent=2)[:3000])

# Fix 2: Submissions endpoint investigation
print()
print('=== SUBMISSION - try taskDefinitionId ===')
task_id = 'task_8313798f74c84a978cff1e77'
r2 = requests.post(
    f'{GW}/api/v1/submissions',
    json={'taskId': task_id, 'taskDefinitionId': task_id, 'summary': 'e2e', 'structured_response': {}},
    headers={'Authorization': f'Bearer {cont_tok}', 'Content-Type': 'application/json'}
)
print(f'With taskDefinitionId str: {r2.status_code} {r2.text[:500]}')

# Try getting contributor tasks
print()
print('=== GET contributor tasks (v1) ===')
r3 = requests.get(f'{GW}/api/v1/contributor/tasks', headers={'Authorization': f'Bearer {cont_tok}'})
print(f'Status: {r3.status_code}')
print(r3.text[:1000])

print()
print('=== GET contributor tasks (legacy) ===')
r4 = requests.get(f'{GW}/api/contributor/tasks', headers={'Authorization': f'Bearer {cont_tok}'})
print(f'Status: {r4.status_code}')
print(r4.text[:1000])

# Check what taskDefinitionId looks like from an integer task
print()
print('=== GET decomposition plans to find integer task id ===')
r5 = requests.get(f'{GW}/api/v1/enterprise/decomposition/plans', headers={'Authorization': f'Bearer {ent_tok}'})
print(f'Status: {r5.status_code}')
print(r5.text[:1500])

# Get reviewer assignments endpoint directly
print()
print('=== REVIEWER ASSIGNMENTS list ===')
r6 = requests.get(f'{GW}/api/v1/reviewer/assignments', headers={'Authorization': f'Bearer {rev_tok}'})
print(f'Status: {r6.status_code}')
print(r6.text[:1000])
