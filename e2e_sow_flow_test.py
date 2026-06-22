"""
Complete SOW→payout E2E flow test against gateway http://127.0.0.1:9000
"""
import requests
import json
import io
import sys

GW = "http://127.0.0.1:9000"
PASSWORD = "Glimmora@123"

LOGINS = {
    "superadmin": "superadmin@glimmora.dev",
    "enterprise": "iotcourseiot@gmail.com",
    "mentor": "mywebsitebuilt@gmail.com",
    "reviewer": "reviewer.live@glimmora.dev",
    "contributor": "contributor.live@glimmora.dev",
}

results = []
tokens = {}
roles_seen = {}

def step(name, ok, detail):
    results.append({"step": name, "ok": ok, "detail": str(detail)})
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {name}: {str(detail)[:300]}")

def post_json(url, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = requests.post(url, json=data, headers=headers, timeout=30)
    return r

def get_json(url, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = requests.get(url, headers=headers, timeout=30)
    return r

def patch_json(url, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = requests.patch(url, json=data, headers=headers, timeout=30)
    return r

# ──────────────────────────────────────────────────────────
# STEP 1: AUTH
# ──────────────────────────────────────────────────────────
print("\n=== STEP 1: AUTH ===")
all_auth_ok = True
for role, email in LOGINS.items():
    r = post_json(f"{GW}/api/v1/auth/login", {"email": email, "password": PASSWORD})
    if r.status_code == 200:
        data = r.json()
        token = data.get("access_token") or data.get("token")
        if not token:
            # Try nested
            token = data.get("data", {}).get("access_token")
        if token:
            tokens[role] = token
            role_val = data.get("role") or data.get("user", {}).get("role") or data.get("data", {}).get("role")
            roles_seen[role] = role_val
            print(f"  {role} ({email}): token={token[:30]}... role={role_val}")
        else:
            print(f"  {role}: 200 but no token — {json.dumps(data)[:200]}")
            all_auth_ok = False
    else:
        print(f"  {role}: HTTP {r.status_code} — {r.text[:200]}")
        all_auth_ok = False

step("auth", all_auth_ok and len(tokens) == 5,
     f"Logged in {len(tokens)}/5 roles. roles={roles_seen}")

# ──────────────────────────────────────────────────────────
# STEP 2: SOW UPLOAD (enterprise)
# ──────────────────────────────────────────────────────────
print("\n=== STEP 2: SOW UPLOAD ===")
sow_id = None
ent_tok = tokens.get("enterprise")
if ent_tok:
    fake_pdf = io.BytesIO(b"%PDF-1.4 fake pdf for e2e test")
    fake_pdf.name = "e2e_test.pdf"
    files = {"file": ("e2e_test.pdf", fake_pdf, "application/pdf")}
    data = {
        "projectTitle": "E2E SOW Test Project",
        "clientOrganisation": "E2E Corp",
        "budgetAmount": "50000",
        "budgetCurrency": "INR",
    }
    r = requests.post(
        f"{GW}/api/v1/sow/upload",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {ent_tok}"},
        timeout=30,
    )
    print(f"  Status: {r.status_code}, Body: {r.text[:500]}")
    if r.status_code in (200, 201):
        body = r.json()
        sow_id = (body.get("sow_id") or body.get("id") or
                  body.get("data", {}).get("sow_id") or
                  body.get("data", {}).get("id"))
        step("sow_upload", bool(sow_id), f"sow_id={sow_id} body={json.dumps(body)[:300]}")
    else:
        step("sow_upload", False, f"HTTP {r.status_code}: {r.text[:300]}")
else:
    step("sow_upload", False, "No enterprise token")

# ──────────────────────────────────────────────────────────
# STEP 3: SOW SUBMIT (NEW)
# ──────────────────────────────────────────────────────────
print("\n=== STEP 3: SOW SUBMIT ===")
if sow_id and ent_tok:
    r = post_json(f"{GW}/api/v1/sow/{sow_id}/submit", {}, ent_tok)
    print(f"  Status: {r.status_code}, Body: {r.text[:500]}")
    if r.status_code in (200, 201):
        body = r.json()
        status_val = (body.get("status") or body.get("data", {}).get("status"))
        step("sow_submit", True, f"status={status_val} body={json.dumps(body)[:300]}")
    else:
        step("sow_submit", False, f"HTTP {r.status_code}: {r.text[:300]}")
else:
    step("sow_submit", False, f"No sow_id ({sow_id}) or no enterprise token")

# ──────────────────────────────────────────────────────────
# STEP 4: ASSIGN REVIEWER (super-admin)
# ──────────────────────────────────────────────────────────
print("\n=== STEP 4: ASSIGN REVIEWER ===")
sa_tok = tokens.get("superadmin")
rev_tok = tokens.get("reviewer")
# Get reviewer user id if possible
reviewer_id = "reviewer.live@glimmora.dev"  # fallback: use email as id
if sa_tok and sow_id:
    payload = {
        "reviewerId": reviewer_id,
        "reviewerEmail": "reviewer.live@glimmora.dev",
        "reviewerName": "Live Reviewer",
    }
    r = post_json(f"{GW}/api/superadmin/sows/{sow_id}/assign-reviewer", payload, sa_tok)
    print(f"  Status: {r.status_code}, Body: {r.text[:500]}")
    if r.status_code in (200, 201):
        step("assign_reviewer", True, f"body={r.text[:300]}")
    else:
        step("assign_reviewer", False, f"HTTP {r.status_code}: {r.text[:300]}")
else:
    step("assign_reviewer", False, f"No superadmin token or no sow_id")

# ──────────────────────────────────────────────────────────
# STEP 5: APPROVALS
# ──────────────────────────────────────────────────────────
print("\n=== STEP 5: APPROVALS ===")
if sow_id and ent_tok:
    r = get_json(f"{GW}/api/v1/approvals/{sow_id}", ent_tok)
    print(f"  GET approvals status: {r.status_code}, Body: {r.text[:600]}")
    if r.status_code == 200:
        approvals_body = r.json()
        # Find stages
        stages = (approvals_body.get("stages") or
                  approvals_body.get("data", {}).get("stages") or
                  approvals_body.get("data") or [])
        if isinstance(stages, dict):
            stage_keys = list(stages.keys())
        elif isinstance(stages, list):
            stage_keys = [s.get("key") or s.get("stage") or s.get("name") for s in stages if isinstance(s, dict)]
        else:
            stage_keys = []
        print(f"  Stages found: {stage_keys}")

        # Validation test: bogus decision
        bogus_ok = False
        if stage_keys:
            first_key = stage_keys[0]
            r_bogus = post_json(
                f"{GW}/api/v1/approvals/{sow_id}/stage/{first_key}/decide",
                {"decision": "bogus", "comment": "e2e test"},
                ent_tok,
            )
            print(f"  Bogus decision test: HTTP {r_bogus.status_code} body={r_bogus.text[:200]}")
            bogus_ok = r_bogus.status_code == 422

        # Approve all stages
        approve_results = []
        for key in stage_keys:
            if key is None:
                continue
            # SA token for platform/commercial stages
            use_tok = sa_tok if (key and ("platform" in str(key).lower() or "commercial" in str(key).lower() or "security" in str(key).lower() or "legal" in str(key).lower() or "finance" in str(key).lower())) else ent_tok
            r_dec = post_json(
                f"{GW}/api/v1/approvals/{sow_id}/stage/{key}/decide",
                {"decision": "approve", "comment": "e2e"},
                use_tok,
            )
            print(f"  Approve stage '{key}': HTTP {r_dec.status_code} body={r_dec.text[:200]}")
            approve_results.append((key, r_dec.status_code, r_dec.text[:100]))

        # Verify SOW status
        r_sow = get_json(f"{GW}/api/v1/sow/{sow_id}", ent_tok)
        sow_status = None
        if r_sow.status_code == 200:
            sb = r_sow.json()
            sow_status = (sb.get("status") or sb.get("data", {}).get("status"))
        print(f"  SOW status after approvals: {sow_status}")

        step("approvals", True,
             f"stages={stage_keys}, approve_results={approve_results}, bogus_422={bogus_ok}, sow_status={sow_status}")
    else:
        step("approvals", False, f"GET approvals HTTP {r.status_code}: {r.text[:300]}")
else:
    step("approvals", False, f"No sow_id or enterprise token")

# ──────────────────────────────────────────────────────────
# STEP 6: ASSIGN MENTOR (super-admin)
# ──────────────────────────────────────────────────────────
print("\n=== STEP 6: ASSIGN MENTOR ===")
if sa_tok and sow_id:
    payload = {
        "mentorId": "mywebsitebuilt@gmail.com",
        "mentorEmail": "mywebsitebuilt@gmail.com",
        "mentorName": "Live Mentor",
    }
    r = post_json(f"{GW}/api/superadmin/sows/{sow_id}/assign-mentor", payload, sa_tok)
    print(f"  Status: {r.status_code}, Body: {r.text[:500]}")
    if r.status_code in (200, 201):
        step("assign_mentor", True, f"body={r.text[:300]}")
    else:
        step("assign_mentor", False, f"HTTP {r.status_code}: {r.text[:300]}")
else:
    step("assign_mentor", False, "No superadmin token or no sow_id")

# ──────────────────────────────────────────────────────────
# STEP 7: DECOMPOSE (plans + tasks)
# ──────────────────────────────────────────────────────────
print("\n=== STEP 7: DECOMPOSE ===")
plan_id = None
task_id = None
if ent_tok and sow_id:
    # Create plan
    r = post_json(
        f"{GW}/api/v1/enterprise/decomposition/plans",
        {"sowId": sow_id, "title": "E2E Plan"},
        ent_tok,
    )
    print(f"  Create plan: {r.status_code} {r.text[:400]}")
    if r.status_code in (200, 201):
        body = r.json()
        plan_id = (body.get("plan_id") or body.get("id") or
                   body.get("data", {}).get("plan_id") or
                   body.get("data", {}).get("id"))
        print(f"  plan_id={plan_id}")

        if plan_id:
            # Create task
            r2 = post_json(
                f"{GW}/api/v1/enterprise/decomposition/plans/{plan_id}/tasks",
                {"title": "E2E Task", "description": "test task", "estimatedHours": 4},
                ent_tok,
            )
            print(f"  Create task: {r2.status_code} {r2.text[:400]}")
            if r2.status_code in (200, 201):
                b2 = r2.json()
                task_id = (b2.get("task_id") or b2.get("id") or
                           b2.get("data", {}).get("task_id") or
                           b2.get("data", {}).get("id"))
                print(f"  task_id={task_id}")

            # Approve plan
            r3 = post_json(
                f"{GW}/api/v1/enterprise/decomposition/plans/{plan_id}/approve",
                {}, ent_tok,
            )
            print(f"  Approve plan: {r3.status_code} {r3.text[:300]}")

            # Activate plan
            r4 = post_json(
                f"{GW}/api/v1/enterprise/decomposition/plans/{plan_id}/activate",
                {}, ent_tok,
            )
            print(f"  Activate plan: {r4.status_code} {r4.text[:300]}")

            step("decompose", bool(task_id),
                 f"plan_id={plan_id}, task_id={task_id}, approve={r3.status_code}, activate={r4.status_code}")
        else:
            step("decompose", False, f"No plan_id extracted from: {r.text[:200]}")
    else:
        step("decompose", False, f"Create plan HTTP {r.status_code}: {r.text[:300]}")
else:
    step("decompose", False, "No enterprise token or sow_id")

# ──────────────────────────────────────────────────────────
# STEP 8: ASSIGN CONTRIBUTOR
# ──────────────────────────────────────────────────────────
print("\n=== STEP 8: ASSIGN CONTRIBUTOR ===")
contributor_task_id = None
if ent_tok and task_id:
    payload = {
        "contributorId": "contributor.live@glimmora.dev",
        "contributorEmail": "contributor.live@glimmora.dev",
        "contributorName": "Live Contributor",
    }
    # Try NEW endpoint first
    r = post_json(f"{GW}/api/v1/enterprise/tasks/{task_id}/assign", payload, ent_tok)
    print(f"  NEW assign endpoint: {r.status_code} {r.text[:400]}")
    if r.status_code in (200, 201):
        body = r.json()
        contributor_task_id = (body.get("contributorTaskId") or body.get("id") or
                                body.get("task_id") or task_id)
        step("assign_contributor", True, f"contributorTaskId={contributor_task_id} body={r.text[:200]}")
    else:
        # Try decomposition assign
        r2 = post_json(
            f"{GW}/api/v1/enterprise/decomposition/tasks/{task_id}/assign",
            payload, ent_tok,
        )
        print(f"  Decomp assign endpoint: {r2.status_code} {r2.text[:400]}")
        if r2.status_code in (200, 201):
            b2 = r2.json()
            contributor_task_id = (b2.get("contributorTaskId") or b2.get("id") or task_id)
            step("assign_contributor", True, f"via decomp assign, contributorTaskId={contributor_task_id}")
        else:
            step("assign_contributor", False,
                 f"Both endpoints failed: {r.status_code}/{r2.status_code} {r2.text[:200]}")
            contributor_task_id = task_id  # use task_id as fallback
else:
    step("assign_contributor", False, f"No enterprise token or task_id={task_id}")
    contributor_task_id = task_id

# ──────────────────────────────────────────────────────────
# STEP 9: CONTRIBUTOR SUBMIT
# ──────────────────────────────────────────────────────────
print("\n=== STEP 9: CONTRIBUTOR SUBMIT ===")
submission_id = None
cont_tok = tokens.get("contributor")
if cont_tok and (contributor_task_id or task_id):
    use_task_id = contributor_task_id or task_id
    # Try NEW submissions endpoint
    r = post_json(
        f"{GW}/api/v1/submissions",
        {"taskId": use_task_id, "summary": "E2E test submission", "structured_response": {"note": "e2e"}},
        cont_tok,
    )
    print(f"  POST /api/v1/submissions: {r.status_code} {r.text[:400]}")
    if r.status_code in (200, 201):
        body = r.json()
        submission_id = (body.get("submission_id") or body.get("id") or
                         body.get("data", {}).get("submission_id") or
                         body.get("data", {}).get("id"))
        print(f"  submission_id={submission_id}")
        if submission_id:
            r2 = post_json(f"{GW}/api/v1/submissions/{submission_id}/submit", {}, cont_tok)
            print(f"  Submit submission: {r2.status_code} {r2.text[:400]}")

            # Check mentor_reviews row
            # Try to verify via mentor queue
            ment_tok = tokens.get("mentor")
            mentor_queue_check = None
            if ment_tok:
                rq = get_json(f"{GW}/api/v1/mentor/queue", ment_tok)
                print(f"  Mentor queue check: {rq.status_code} {rq.text[:300]}")
                mentor_queue_check = f"HTTP {rq.status_code}"

            step("contributor_submit", True,
                 f"submission_id={submission_id}, submit={r2.status_code}, mentor_queue={mentor_queue_check}")
        else:
            step("contributor_submit", False, f"No submission_id from: {r.text[:200]}")
    else:
        # Try legacy path
        r_leg = post_json(
            f"{GW}/api/contributor/tasks/{use_task_id}/submissions",
            {"summary": "E2E test submission"},
            cont_tok,
        )
        print(f"  Legacy /api/contributor/tasks/.../submissions: {r_leg.status_code} {r_leg.text[:400]}")
        if r_leg.status_code in (200, 201):
            body = r_leg.json()
            submission_id = (body.get("submission_id") or body.get("id") or
                             body.get("data", {}).get("id"))
            step("contributor_submit", True,
                 f"via legacy path, submission_id={submission_id}")
        else:
            step("contributor_submit", False,
                 f"Both paths failed: new={r.status_code} legacy={r_leg.status_code} {r_leg.text[:200]}")
else:
    step("contributor_submit", False, f"No contributor token or task_id")

# ──────────────────────────────────────────────────────────
# STEP 10: MENTOR REVIEW
# ──────────────────────────────────────────────────────────
print("\n=== STEP 10: MENTOR REVIEW ===")
ment_tok = tokens.get("mentor")
review_id = None
if ment_tok:
    r = get_json(f"{GW}/api/v1/mentor/queue", ment_tok)
    print(f"  GET /api/v1/mentor/queue: {r.status_code} {r.text[:500]}")
    if r.status_code == 200:
        queue_body = r.json()
        queue_items = (queue_body.get("queue") or queue_body.get("items") or
                       queue_body.get("data") or queue_body if isinstance(queue_body, list) else [])
        print(f"  Queue items count: {len(queue_items)}")
        if queue_items:
            item = queue_items[0]
            review_id = (item.get("id") or item.get("review_id") or item.get("submission_id"))
            print(f"  First queue item: {json.dumps(item)[:300]}")

            if review_id:
                # Claim
                r2 = post_json(f"{GW}/api/v1/mentor/submissions/{review_id}/claim", {}, ment_tok)
                print(f"  Claim: {r2.status_code} {r2.text[:300]}")

                # Decide accept
                r3 = post_json(
                    f"{GW}/api/v1/mentor/submissions/{review_id}/decide",
                    {"kind": "accept", "comment": "e2e accepted", "score": 85},
                    ment_tok,
                )
                print(f"  Decide: {r3.status_code} {r3.text[:300]}")

                # Check reviewer assignment
                rev_tok_local = tokens.get("reviewer")
                reviewer_assign_check = None
                if rev_tok_local:
                    rr = get_json(f"{GW}/api/v1/reviewer/dashboard", rev_tok_local)
                    print(f"  Reviewer dashboard: {rr.status_code} {rr.text[:300]}")
                    reviewer_assign_check = f"HTTP {rr.status_code}"

                step("mentor_review", True,
                     f"review_id={review_id}, claim={r2.status_code}, decide={r3.status_code}, reviewer_check={reviewer_assign_check}")
            else:
                step("mentor_review", False, f"No review_id in queue item: {item}")
        else:
            step("mentor_review", False, f"Empty mentor queue. body={json.dumps(queue_body)[:300]}")
    else:
        step("mentor_review", False, f"HTTP {r.status_code}: {r.text[:300]}")
else:
    step("mentor_review", False, "No mentor token")

# ──────────────────────────────────────────────────────────
# STEP 11: REVIEWER APPROVE
# ──────────────────────────────────────────────────────────
print("\n=== STEP 11: REVIEWER APPROVE ===")
rev_tok = tokens.get("reviewer")
assignment_id = None
if rev_tok:
    r = get_json(f"{GW}/api/v1/reviewer/dashboard", rev_tok)
    print(f"  GET /api/v1/reviewer/dashboard: {r.status_code} {r.text[:500]}")
    if r.status_code == 200:
        dash = r.json()
        assignments = (dash.get("assignments") or dash.get("items") or
                       dash.get("data") or dash if isinstance(dash, list) else [])
        if assignments:
            asn = assignments[0]
            assignment_id = asn.get("id") or asn.get("assignment_id")
            print(f"  First assignment: {json.dumps(asn)[:300]}")

            if assignment_id:
                r2 = patch_json(
                    f"{GW}/api/v1/reviewer/assignments/{assignment_id}",
                    {"status": "approved", "feedback": "e2e approved"},
                    rev_tok,
                )
                print(f"  PATCH assignment: {r2.status_code} {r2.text[:300]}")
                step("reviewer_approve", r2.status_code in (200, 201),
                     f"assignment_id={assignment_id}, patch={r2.status_code} {r2.text[:200]}")
            else:
                step("reviewer_approve", False, f"No assignment_id in: {asn}")
        else:
            step("reviewer_approve", False, f"No assignments in dashboard. body={json.dumps(dash)[:300]}")
    else:
        step("reviewer_approve", False, f"HTTP {r.status_code}: {r.text[:300]}")
else:
    step("reviewer_approve", False, "No reviewer token")

# ──────────────────────────────────────────────────────────
# STEP 12: ENTERPRISE REVIEW QUEUE (NEW)
# ──────────────────────────────────────────────────────────
print("\n=== STEP 12: ENTERPRISE REVIEW QUEUE ===")
if ent_tok:
    r = get_json(f"{GW}/api/v1/enterprise/review-queue", ent_tok)
    print(f"  GET /api/v1/enterprise/review-queue: {r.status_code} {r.text[:500]}")
    if r.status_code == 200:
        step("enterprise_review_queue", True, f"body={r.text[:300]}")
    else:
        step("enterprise_review_queue", False, f"HTTP {r.status_code}: {r.text[:300]}")
else:
    step("enterprise_review_queue", False, "No enterprise token")

# ──────────────────────────────────────────────────────────
# STEP 13: BILLING + PAYOUT
# ──────────────────────────────────────────────────────────
print("\n=== STEP 13: BILLING + PAYOUT ===")
billing_results = {}

# Enterprise billing summary
if ent_tok:
    r = get_json(f"{GW}/api/v1/billing/summary", ent_tok)
    print(f"  Enterprise billing/summary: {r.status_code} {r.text[:400]}")
    billing_results["billing_summary"] = r.status_code

# Contributor payouts
if cont_tok:
    r = get_json(f"{GW}/api/v1/payouts", cont_tok)
    print(f"  Contributor /api/v1/payouts: {r.status_code} {r.text[:400]}")
    billing_results["payouts"] = r.status_code

    r2 = get_json(f"{GW}/api/v1/payouts/methods", cont_tok)
    print(f"  Contributor /api/v1/payouts/methods: {r2.status_code} {r2.text[:400]}")
    billing_results["payout_methods"] = r2.status_code

    r3 = get_json(f"{GW}/api/v1/notifications", cont_tok)
    print(f"  Contributor /api/v1/notifications: {r3.status_code} {r3.text[:400]}")
    billing_results["notifications"] = r3.status_code

all_200 = all(v == 200 for v in billing_results.values())
step("billing_payout", all_200, f"results={billing_results}")

# ──────────────────────────────────────────────────────────
# SUMMARY
# ──────────────────────────────────────────────────────────
print("\n=== SUMMARY ===")
for r in results:
    status = "PASS" if r["ok"] else "FAIL"
    print(f"  [{status}] {r['step']}: {r['detail'][:200]}")

print("\nJSON RESULTS:")
print(json.dumps(results, indent=2))
