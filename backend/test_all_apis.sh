#!/usr/bin/env bash
set -euo pipefail
BASE="http://localhost:9000"
TS=1780340000

# ── Tokens ───────────────────────────────────────────────────────────────────
SA=$(curl -sf -X POST "$BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@glimmora.dev","password":"glimmora123"}' \
  | python -c "import sys,json;print(json.load(sys.stdin).get('access_token',''))")

REF=$(curl -sf -X POST "$BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@glimmora.dev","password":"glimmora123"}' \
  | python -c "import sys,json;print(json.load(sys.stdin).get('refresh_token',''))")

CON_EMAIL="apitst_${TS}@glimmora.dev"
# Try new password first, fall back to original
CON=$(curl -sf -X POST "$BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CON_EMAIL\",\"password\":\"NewPassw0rd!23\"}" \
  | python -c "import sys,json;print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || echo "")
if [ ${#CON} -lt 50 ]; then
  CON=$(curl -sf -X POST "$BASE/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$CON_EMAIL\",\"password\":\"Passw0rd!23\"}" \
    | python -c "import sys,json;print(json.load(sys.stdin).get('access_token',''))")
fi

echo "Tokens: SA=${SA:0:20}... CON=${CON:0:20}..."

TOTAL=0; PASS=0; FAIL=0

r() {
  local name="$1" got="$2" exp="$3" note="${4:-}"
  TOTAL=$((TOTAL+1))
  if [ "$got" = "$exp" ]; then
    echo "  ✅ [$got] $name $note"
    PASS=$((PASS+1))
  else
    echo "  ❌ [$got] $name (expected $exp) $note"
    FAIL=$((FAIL+1))
  fi
}

g() { curl -sf -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $SA" "$BASE$1" 2>/dev/null || echo "000"; }
gc() { curl -sf -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $CON" "$BASE$1" 2>/dev/null || echo "000"; }
p() { curl -sf -o /dev/null -w "%{http_code}" -X POST -H "Authorization: Bearer $SA" -H "Content-Type: application/json" -d "$2" "$BASE$1" 2>/dev/null || echo "000"; }
pc() { curl -sf -o /dev/null -w "%{http_code}" -X POST -H "Authorization: Bearer $CON" -H "Content-Type: application/json" -d "$2" "$BASE$1" 2>/dev/null || echo "000"; }
pu() { curl -sf -o /dev/null -w "%{http_code}" -X PUT -H "Authorization: Bearer $CON" -H "Content-Type: application/json" -d "$2" "$BASE$1" 2>/dev/null || echo "000"; }
pa() { curl -sf -o /dev/null -w "%{http_code}" -X PATCH -H "Authorization: Bearer $CON" -H "Content-Type: application/json" -d "$2" "$BASE$1" 2>/dev/null || echo "000"; }
pas() { curl -sf -o /dev/null -w "%{http_code}" -X PATCH -H "Authorization: Bearer $SA" -H "Content-Type: application/json" -d "$2" "$BASE$1" 2>/dev/null || echo "000"; }
pus() { curl -sf -o /dev/null -w "%{http_code}" -X PUT -H "Authorization: Bearer $SA" -H "Content-Type: application/json" -d "$2" "$BASE$1" 2>/dev/null || echo "000"; }
del() { curl -sf -o /dev/null -w "%{http_code}" -X DELETE -H "Authorization: Bearer $CON" "$BASE$1" 2>/dev/null || echo "000"; }
dels() { curl -sf -o /dev/null -w "%{http_code}" -X DELETE -H "Authorization: Bearer $SA" "$BASE$1" 2>/dev/null || echo "000"; }
pub() { curl -sf -o /dev/null -w "%{http_code}" "$BASE$1" 2>/dev/null || echo "000"; }
body() { curl -sf -X POST -H "Authorization: Bearer $SA" -H "Content-Type: application/json" -d "$2" "$BASE$1" 2>/dev/null || echo "{}"; }
bodyc() { curl -sf -X POST -H "Authorization: Bearer $CON" -H "Content-Type: application/json" -d "$2" "$BASE$1" 2>/dev/null || echo "{}"; }
getid() { python -c "import sys,json;d=json.load(sys.stdin);print(d.get('id') or d.get('plan_id') or d.get('wizard_id') or d.get('task_id') or d.get('ticket_id') or d.get('evidence_id') or '')" 2>/dev/null; }
getidc() { python -c "import sys,json;d=json.load(sys.stdin);print(d.get('id') or '')" 2>/dev/null; }

# ════════════════════════════════════════════════════════════════════════
echo ""
echo "════════════════ CONTRIBUTOR SERVICE ════════════════"
r "dashboard"                   "$(gc /api/contributor/dashboard)" 200
r "notifications GET"           "$(gc /api/contributor/notifications?page=1)" 200
r "notifications read-all"      "$(pc /api/contributor/notifications/read-all '{}')" 200
r "settings GET"                "$(gc /api/contributor/settings)" 200
r "settings PATCH account"      "$(pa /api/contributor/settings/account '{"display_name":"API Tester v2"}')" 200
r "settings PATCH notifications" "$(pa /api/contributor/settings/notifications '{"task_assignments":true}')" 200
r "settings PATCH locale"       "$(pa /api/contributor/settings/locale '{"timezone":"Asia/Kolkata","language":"en"}')" 200
r "tasks list"                  "$(gc /api/contributor/tasks?page=1&page_size=10)" 200
r "tasks summary"               "$(gc /api/contributor/tasks/summary)" 200
r "tasks discovery summary"     "$(gc /api/contributor/tasks/discovery/summary)" 200
r "submissions list"            "$(gc /api/contributor/submissions?page=1)" 200
r "earnings summary"            "$(gc /api/contributor/earnings/summary)" 200
r "earnings chart"              "$(gc /api/contributor/earnings/chart?period=3m)" 200
r "earnings kyc status"         "$(gc /api/contributor/earnings/kyc/status)" 200
r "payouts list"                "$(gc /api/contributor/payouts?page=1)" 200
r "payout-preferences GET"      "$(gc /api/contributor/payout-preferences)" 200
r "payout-preferences PUT"      "$(pu /api/contributor/payout-preferences '{"preferred_method":"bank","auto_payout":false,"minimum_payout_amount":1000}')" 200
r "messages/threads"            "$(gc /api/contributor/messages/threads?page=1)" 200
r "learning recommendations"    "$(gc /api/contributor/learning/recommendations)" 200

TICKET=$(bodyc /api/contributor/support/tickets \
  "{\"subject\":\"Test $TS\",\"category\":\"technical\",\"priority\":\"medium\",\"description\":\"API test\"}" | getidc)
r "support ticket POST"         "$([ ${#TICKET} -gt 1 ] && echo 200 || echo 500)" 200 "(id=$TICKET)"
r "support tickets GET"         "$(gc /api/contributor/support/tickets?page=1)" 200
r "support ticket GET by id"    "$(gc /api/contributor/support/tickets/$TICKET)" 200
r "support ticket PATCH"        "$(pa /api/contributor/support/tickets/$TICKET '{"status":"in_progress"}')" 200
r "support ticket msg POST"     "$(pc /api/contributor/support/tickets/$TICKET/messages '{"message":"Follow up"}')" 200
r "support faqs"                "$(gc /api/contributor/support/faqs)" 200
r "support grievances GET"      "$(gc /api/contributor/support/grievances)" 200
r "support grievance POST"      "$(pc /api/contributor/support/grievances '{"category":"payment","subject":"Test","description":"test","anonymous":false}')" 200
r "safety-reports POST"         "$(pc /api/contributor/support/safety-reports '{"category":"harassment","description":"test report"}')" 200
r "credentials list"            "$(gc /api/contributor/credentials)" 200
r "credentials wallet/summary"  "$(gc /api/contributor/credentials/wallet/summary)" 200
r "credentials wallet/cards"    "$(gc /api/contributor/credentials/wallet/cards)" 200
r "credentials skills/verify"   "$(gc /api/contributor/credentials/skills/verification)" 200
r "profile GET"                 "$(gc /api/contributor/profile)" 200
r "profile PATCH"               "$(pa /api/contributor/profile '{"display_name":"API","bio":"bio","country":"India","city":"Chennai","timezone":"Asia/Kolkata","weekly_hours":40,"availability":"full_time","language":"en"}')" 200
r "profile skills PUT"          "$(pu /api/contributor/profile/skills '{"skills":[{"name":"Python","proficiency":"expert"}]}')" 200
r "profile evidence GET"        "$(gc /api/contributor/profile/evidence)" 200

EV=$(bodyc /api/contributor/profile/evidence \
  '{"title":"TestProj","type":"project","url":"https://github.com/test","file_id":"","description":"test","skills":[{"name":"Python","proficiency":"expert"}]}' | getidc)
r "profile evidence POST"       "$([ ${#EV} -gt 1 ] && echo 200 || echo 500)" 200 "(id=$EV)"
[ ${#EV} -gt 1 ] && r "profile evidence PATCH" "$(pa /api/contributor/profile/evidence/$EV '{"title":"Updated Evidence"}')" 200
[ ${#EV} -gt 1 ] && r "profile evidence DELETE" "$(del /api/contributor/profile/evidence/$EV)" 200
r "digital-twin GET"            "$(gc /api/contributor/profile/digital-twin)" 200
r "digital-twin history"        "$(gc /api/contributor/profile/digital-twin/history?period=3m)" 200
r "search"                      "$(gc /api/contributor/search?q=python&limit=5)" 200
r "public credentials 404"      "$(pub /api/public/credentials/nosuchid)" 404

echo "CONTRIBUTOR: PASS=$PASS FAIL=$FAIL"
echo ""

# ════════════════════════════════════════════════════════════════════════
echo "════════════════ ENTERPRISE SERVICE ════════════════"
WIZ=$(body /api/v1/wizards '{"enterprise_id":"ent_api_test"}' | python -c "import sys,json;d=json.load(sys.stdin);print(d.get('data',{}).get('wizard_id',d.get('wizard_id','')))" 2>/dev/null)
r "wizards GET"                 "$(g /api/v1/wizards)" 200
r "wizards POST"                "$([ ${#WIZ} -gt 1 ] && echo 200 || echo 500)" 200 "(wiz=$WIZ)"
r "wizard GET by id"            "$(g /api/v1/wizards/$WIZ)" 200
r "wizard steps PUT"            "$(pus /api/v1/wizards/$WIZ/steps/0 '{"project_name":"API Test Project","description":"Test","objectives":["Build","Test"]}')" 200
r "wizard step skip"            "$(p /api/v1/wizards/$WIZ/steps/1/skip '{}')" 200
r "sows GET"                    "$(g /api/v1/sows)" 200
r "sows enterprise/all"         "$(g /api/v1/sows/enterprise/all)" 200
r "sow manual list"             "$(g /api/v1/sow)" 200
r "decomposition plans GET"     "$(g /api/v1/enterprise/decomposition/plans)" 200

PLAN=$(body /api/v1/enterprise/decomposition/plans \
  "{\"wizard_id\":\"wiz_test\",\"enterprise_id\":\"ent001\",\"sow_reference\":\"sow001\",\"project_name\":\"Plan$TS\",\"minimum_budget\":10000,\"maximum_budget\":50000,\"start_date\":\"2026-07-01\",\"end_date\":\"2026-12-31\"}" | getid)
r "decomp plan POST"            "$([ ${#PLAN} -gt 1 ] && echo 200 || echo 500)" 200 "(plan=$PLAN)"
r "decomp plan GET"             "$(g /api/v1/enterprise/decomposition/plans/$PLAN)" 200
r "decomp plan summary"         "$(g /api/v1/enterprise/decomposition/plans/$PLAN/summary)" 200
r "decomp plan status"          "$(g /api/v1/enterprise/decomposition/plans/$PLAN/status)" 200
r "decomp plan tasks GET"       "$(g /api/v1/enterprise/decomposition/plans/$PLAN/tasks)" 200

TASK=$(body /api/v1/enterprise/decomposition/plans/$PLAN/tasks \
  '{"title":"API Test Task","priority":"high","effort":8,"estimated_hours":8,"skills":["Python"],"description":"test task"}' | getid)
r "decomp task POST"            "$([ ${#TASK} -gt 1 ] && echo 200 || echo 500)" 200 "(task=$TASK)"
r "decomp task GET"             "$(g /api/v1/enterprise/decomposition/plans/$PLAN/tasks/$TASK)" 200
r "decomp task PATCH"           "$(pas /api/v1/enterprise/decomposition/plans/$PLAN/tasks/$TASK '{"title":"Updated Task","priority":"medium"}')" 200
r "decomp task DELETE"          "$(dels /api/v1/enterprise/decomposition/plans/$PLAN/tasks/$TASK)" 200
r "decomp milestones"           "$(g /api/v1/enterprise/decomposition/plans/$PLAN/milestones)" 200
r "decomp checklist"            "$(g /api/v1/enterprise/decomposition/plans/$PLAN/checklist)" 200
r "decomp critical-path"        "$(g /api/v1/enterprise/decomposition/plans/$PLAN/critical-path)" 200
r "decomp summary-panel"        "$(g /api/v1/enterprise/decomposition/plans/$PLAN/summary-panel)" 200
r "decomp review"               "$(g /api/v1/enterprise/decomposition/plans/$PLAN/review)" 200
r "portfolio projects"          "$(g /api/v1/portfolio/projects)" 200
r "users search"                "$(g /api/v1/users/search?q=admin)" 200
r "users me/profile PUT"        "$(pus /api/v1/users/me/profile '{"firstName":"Super","lastName":"Admin","adminTitle":"Platform Admin"}')" 200

echo "ENTERPRISE: PASS=$PASS FAIL=$FAIL"
echo ""

# ════════════════════════════════════════════════════════════════════════
echo "════════════════ SUPERADMIN SERVICE ════════════════"
r "reviewers list"              "$(g /api/v1/users/reviewers/list)" 200
r "create reviewer (v1/users)"  "$(p /api/v1/users \"{\\\"firstName\\\":\\\"Rev\\\",\\\"lastName\\\":\\\"One\\\",\\\"email\\\":\\\"rev_${TS}@g.dev\\\",\\\"role\\\":\\\"reviewer\\\",\\\"department\\\":\\\"QA\\\"}\")" 200
r "create admin (superadmin)"   "$(p /api/superadmin/users \"{\\\"firstName\\\":\\\"Adm\\\",\\\"lastName\\\":\\\"Two\\\",\\\"email\\\":\\\"adm_${TS}@g.dev\\\",\\\"role\\\":\\\"admin\\\",\\\"department\\\":\\\"Platform\\\"}\")" 200
r "reviewer dashboard"          "$(g /api/v1/reviewer/dashboard)" 200
r "reviewer projects"           "$(g /api/v1/reviewer/projects)" 200
r "pricing GET"                 "$(g /api/v1/settings/contributor-pricing)" 200
r "pricing PUT"                 "$(pus /api/v1/settings/contributor-pricing '{"student":{"currency":"INR","hourlyRate":300},"workforceSlabs":[{"id":"s1","minYears":0,"maxYears":2,"currency":"INR","rate":350},{"id":"s2","minYears":3,"maxYears":5,"currency":"INR","rate":600},{"id":"s3","minYears":6,"maxYears":null,"currency":"INR","rate":1000}]}')" 200
PRICE=$(curl -sf -H "Authorization: Bearer $SA" "$BASE/api/v1/settings/contributor-pricing" | python -c "import sys,json;d=json.load(sys.stdin);print(d.get('data',{}).get('student',{}).get('hourlyRate','?'))" 2>/dev/null)
r "pricing persisted (rate=300)" "$([ \"$PRICE\" = '300' ] && echo ok || echo fail)" ok "(got $PRICE)"
r "pricing public (no auth)"    "$(pub /api/v1/config/contributor-pricing)" 200

# Bulk import - CSV preview
CSV="email,name,role\nbulk_x${TS}@g.dev,Alpha,contributor\nbulk_y${TS}@g.dev,Beta,reviewer\nsuperadmin@glimmora.dev,Dup,admin\n"
printf "$CSV" > /tmp/bulk_test.csv
PREV=$(curl -sf -X POST \
  -H "Authorization: Bearer $SA" \
  -F "file=@/tmp/bulk_test.csv;type=text/csv" \
  "$BASE/api/admin/users/bulk-import?commit=false" 2>/dev/null || echo "{}")
VALID=$(echo "$PREV" | python -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('validRows',[])))" 2>/dev/null)
ERRS=$(echo "$PREV" | python -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('errorRows',[])))" 2>/dev/null)
DUP=$(echo "$PREV" | python -c "import sys,json;d=json.load(sys.stdin);rows=d.get('errorRows',[]); print('yes' if any(r.get('isDuplicate') for r in rows) else 'no')" 2>/dev/null)
r "bulk import PREVIEW"         "$([ \"$VALID\" = '2' ] && [ \"$ERRS\" = '1' ] && echo ok || echo fail)" ok "(valid=$VALID errors=$ERRS dup=$DUP)"

COMM=$(curl -sf -X POST \
  -H "Authorization: Bearer $SA" \
  -F "file=@/tmp/bulk_test.csv;type=text/csv" \
  "$BASE/api/admin/users/bulk-import?commit=true&sendCredentials=false" 2>/dev/null || echo "{}")
INS=$(echo "$COMM" | python -c "import sys,json;print(json.load(sys.stdin).get('insertedCount',0))" 2>/dev/null)
r "bulk import COMMIT"          "$([ \"$INS\" = '2' ] && echo ok || echo fail)" ok "(inserted=$INS)"

echo "SUPERADMIN: PASS=$PASS FAIL=$FAIL"
echo ""

# ════════════════════════════════════════════════════════════════════════
echo "════════════════ UNIVERSITIES SERVICE ════════════════"
UNI_ID="uni_${TS}"
r "universities GET"            "$(g /api/universities)" 200
r "university POST"             "$(p /api/universities \"{\\\"id\\\":\\\"$UNI_ID\\\",\\\"name\\\":\\\"TestUniv$TS\\\",\\\"kind\\\":\\\"university\\\",\\\"metadata\\\":{}}\")" 200
r "university GET by id"        "$(g /api/universities/$UNI_ID)" 200
r "university students GET"     "$(g /api/universities/$UNI_ID/students)" 200
r "student POST"                "$(p /api/universities/$UNI_ID/students \"{\\\"firstName\\\":\\\"Stu\\\",\\\"lastName\\\":\\\"One\\\",\\\"email\\\":\\\"stu_${TS}@uni.edu\\\",\\\"role\\\":\\\"student\\\",\\\"department\\\":\\\"CS\\\"}\")" 200
r "university dashboard"        "$(g /api/universities/$UNI_ID/dashboard)" 200
r "university audit"            "$(g /api/universities/$UNI_ID/audit?page=1)" 200

UCSV="email,name,role\nbk_sa${TS}@u.edu,Alpha,student\nbk_sb${TS}@u.edu,Beta,student\nsuperadmin@glimmora.dev,Dup,student\n"
printf "$UCSV" > /tmp/uni_bulk.csv
UPREV=$(curl -sf -X POST -H "Authorization: Bearer $SA" -F "file=@/tmp/uni_bulk.csv;type=text/csv" \
  "$BASE/api/universities/$UNI_ID/students/bulk-import?commit=false" 2>/dev/null || echo "{}")
UVALID=$(echo "$UPREV" | python -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('validRows',[])))" 2>/dev/null)
UERRS=$(echo "$UPREV" | python -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('errorRows',[])))" 2>/dev/null)
r "uni bulk import PREVIEW"     "$([ \"$UVALID\" = '2' ] && [ \"$UERRS\" = '1' ] && echo ok || echo fail)" ok "(valid=$UVALID errors=$UERRS)"
UCOMM=$(curl -sf -X POST -H "Authorization: Bearer $SA" -F "file=@/tmp/uni_bulk.csv;type=text/csv" \
  "$BASE/api/universities/$UNI_ID/students/bulk-import?commit=true&sendCredentials=false" 2>/dev/null || echo "{}")
UINS=$(echo "$UCOMM" | python -c "import sys,json;print(json.load(sys.stdin).get('insertedCount',0))" 2>/dev/null)
r "uni bulk import COMMIT"      "$([ \"$UINS\" = '2' ] && echo ok || echo fail)" ok "(inserted=$UINS)"

echo "UNIVERSITIES: PASS=$PASS FAIL=$FAIL"
echo ""

# ════════════════════════════════════════════════════════════════════════
echo "════════════════ WOMEN SERVICE ════════════════"
WT_ID="wt_${TS}"
r "teams GET"                   "$(g /api/women/teams)" 200
r "team POST"                   "$(p /api/women/teams \"{\\\"id\\\":\\\"$WT_ID\\\",\\\"name\\\":\\\"TestTeam$TS\\\",\\\"kind\\\":\\\"women_team\\\",\\\"metadata\\\":{}}\")" 200
r "team GET by id"              "$(g /api/women/teams/$WT_ID)" 200
r "team members GET"            "$(g /api/women/teams/$WT_ID/members)" 200
r "member POST"                 "$(p /api/women/teams/$WT_ID/members \"{\\\"firstName\\\":\\\"Wm\\\",\\\"lastName\\\":\\\"One\\\",\\\"email\\\":\\\"wm_${TS}@g.dev\\\",\\\"role\\\":\\\"contributor\\\",\\\"department\\\":\\\"Engineering\\\"}\")" 200
r "team dashboard"              "$(g /api/women/teams/$WT_ID/dashboard)" 200
r "team audit"                  "$(g /api/women/teams/$WT_ID/audit?page=1)" 200

WCSV="email,name,role\nbk_wa${TS}@g.dev,Alpha,contributor\nbk_wb${TS}@g.dev,Beta,contributor\nsuperadmin@glimmora.dev,Dup,contributor\n"
printf "$WCSV" > /tmp/women_bulk.csv
WPREV=$(curl -sf -X POST -H "Authorization: Bearer $SA" -F "file=@/tmp/women_bulk.csv;type=text/csv" \
  "$BASE/api/women/teams/$WT_ID/members/bulk-import?commit=false" 2>/dev/null || echo "{}")
WVALID=$(echo "$WPREV" | python -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('validRows',[])))" 2>/dev/null)
WERRS=$(echo "$WPREV" | python -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('errorRows',[])))" 2>/dev/null)
r "women bulk import PREVIEW"   "$([ \"$WVALID\" = '2' ] && [ \"$WERRS\" = '1' ] && echo ok || echo fail)" ok "(valid=$WVALID errors=$WERRS)"
WCOMM=$(curl -sf -X POST -H "Authorization: Bearer $SA" -F "file=@/tmp/women_bulk.csv;type=text/csv" \
  "$BASE/api/women/teams/$WT_ID/members/bulk-import?commit=true&sendCredentials=false" 2>/dev/null || echo "{}")
WINS=$(echo "$WCOMM" | python -c "import sys,json;print(json.load(sys.stdin).get('insertedCount',0))" 2>/dev/null)
r "women bulk import COMMIT"    "$([ \"$WINS\" = '2' ] && echo ok || echo fail)" ok "(inserted=$WINS)"

echo "WOMEN: PASS=$PASS FAIL=$FAIL"
echo ""

# ════════════════════════════════════════════════════════════════════════
echo "════════════════ MENTOR SERVICE ════════════════"
r "mentor dashboard"            "$(g /api/mentor/dashboard)" 200
r "mentor queue"                "$(g /api/mentor/queue)" 200
r "mentor mentorship"           "$(g /api/mentor/mentorship)" 200
r "mentor escalation GET"       "$(g /api/mentor/escalation)" 200

ESC=$(body /api/mentor/escalation \
  "{\"title\":\"Esc$TS\",\"description\":\"API test escalation\",\"severity\":\"medium\",\"related_id\":\"task001\"}" | getidc)
r "mentor escalation POST"      "$([ ${#ESC} -gt 1 ] && echo 200 || echo 500)" 200 "(id=$ESC)"
r "mentor escalation GET by id" "$(g /api/mentor/escalation/$ESC)" 200
r "mentor escalation PATCH"     "$(pas /api/mentor/escalation/$ESC '{"status":"in_progress","notes":"Working on it"}')" 200
r "mentor history"              "$(g /api/mentor/history)" 200
r "mentor profile GET"          "$(g /api/mentor/profile)" 200
r "mentor profile PATCH"        "$(pas /api/mentor/profile '{"bio":"Senior mentor","specializations":["Python","ML"]}')" 200
r "mentor settings GET"         "$(g /api/mentor/settings)" 200
r "mentor settings PATCH"       "$(pas /api/mentor/settings '{"email_notifications":true,"review_reminders":true}')" 200

echo "MENTOR: PASS=$PASS FAIL=$FAIL"
echo ""

# ════════════════════════════════════════════════════════════════════════
echo "════════════════ EMAIL SERVICE ════════════════"
KEY="welcome${TS}"
r "email templates GET"         "$(g /api/email/templates)" 200
r "email template PUT"          "$(pus /api/email/templates \"{\\\"key\\\":\\\"$KEY\\\",\\\"subject\\\":\\\"Welcome\\\",\\\"body_html\\\":\\\"<p>Hello {{name}}</p>\\\",\\\"header_color\\\":\\\"#0D1B2A\\\",\\\"footer_text\\\":\\\"GlimmoraTeam\\\"}\")" 200
r "email template GET by key"   "$(g /api/email/templates/$KEY)" 200
r "email template PUT otp"      "$(pus /api/email/templates \"{\\\"key\\\":\\\"otp$TS\\\",\\\"subject\\\":\\\"Your OTP\\\",\\\"body_html\\\":\\\"<p>Code: {{code}}</p>\\\",\\\"header_color\\\":\\\"#1a73e8\\\",\\\"footer_text\\\":\\\"Expires 5m\\\"}\")" 200
r "email templates list (2+)"   "$(g /api/email/templates)" 200
r "email template test send"    "$(p /api/email/templates/$KEY/test '{\"to_email\":\"test@glimmora.dev\"}')" 200
r "email send"                  "$(p /api/email/send \"{\\\"to\\\":\\\"test@glimmora.dev\\\",\\\"subject\\\":\\\"APITest$TS\\\",\\\"body\\\":\\\"Automated API test\\\"}\")" 200
r "email template DELETE"       "$(dels /api/email/templates/$KEY)" 200
r "email template GET 404"      "$(g /api/email/templates/$KEY)" 404

echo "EMAIL: PASS=$PASS FAIL=$FAIL"
echo ""

# ════════════════════════════════════════════════════════════════════════
echo "════════════════ FILE SERVICE ════════════════"
r "files GET"                   "$(g /api/files)" 200
r "files GET by category"       "$(g /api/files?category=test)" 200

FDATA=$(curl -sf -X POST \
  -H "Authorization: Bearer $SA" \
  -F "file=@/tmp/bulk_test.csv;type=text/plain;filename=apitest${TS}.txt" \
  -F "category=test" \
  -F "title=APITest${TS}" \
  -F "description=Automated test upload" \
  "$BASE/api/files/upload" 2>/dev/null || echo "{}")
FSTATUS=$(echo "$FDATA" | python -c "import sys,json;d=json.load(sys.stdin);print('200' if d.get('id') or d.get('url') else '503')" 2>/dev/null || echo "503")
FID=$(echo "$FDATA" | python -c "import sys,json;print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")
r "file upload POST"            "$FSTATUS" 200 "(id=$FID)"
if [ "$FSTATUS" = "200" ] && [ ${#FID} -gt 1 ]; then
  r "file GET by id"            "$(g /api/files/$FID)" 200
  r "files list (has file)"     "$(g /api/files)" 200
  r "file DELETE"               "$(dels /api/files/$FID)" 200
  r "file GET after delete 404" "$(g /api/files/$FID)" 404
fi
r "file upload no file (422)"   "$(curl -sf -o /dev/null -w "%{http_code}" -X POST -H "Authorization: Bearer $SA" "$BASE/api/files/upload" 2>/dev/null || echo "000")" 422

echo "FILE: PASS=$PASS FAIL=$FAIL"
echo ""

# ════════════════════════════════════════════════════════════════════════
echo "══════════════════════════════════════════════════════"
echo "  FINAL RESULTS: $PASS passed / $FAIL failed / $TOTAL total"
PCTF=$(python -c "print(round($PASS*100/$TOTAL,1))" 2>/dev/null || echo "?")
echo "  PASS RATE: ${PCTF}%"
echo "══════════════════════════════════════════════════════"
