$ErrorActionPreference = 'Continue'
$BASE = "http://localhost:9000"
$TS   = 1780340000

$SA = (Invoke-RestMethod "$BASE/api/v1/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"superadmin@glimmora.dev","password":"glimmora123"}').access_token
try { $c = Invoke-RestMethod "$BASE/api/v1/auth/login" -Method Post -ContentType "application/json" -Body "{`"email`":`"apitst_$TS@glimmora.dev`",`"password`":`"NewPassw0rd!23`"}" -EA Stop }
catch { $c = Invoke-RestMethod "$BASE/api/v1/auth/login" -Method Post -ContentType "application/json" -Body "{`"email`":`"apitst_$TS@glimmora.dev`",`"password`":`"Passw0rd!23`"}" }
$CON = $c.access_token
Write-Output "SA=$($SA.Length) CON=$($CON.Length)"

$PASS=0; $FAIL=0

function Api-Status($method, $url, $body, $tok) {
    try {
        $h = @{ Authorization = "Bearer $tok" }
        $params = @{ Uri=$url; Method=$method; Headers=$h; UseBasicParsing=$true; ErrorAction='Stop' }
        if ($body) { $params.Body = $body; $params.ContentType = "application/json" }
        $r = Invoke-WebRequest @params
        return [int]$r.StatusCode
    } catch {
        $resp = $_.Exception.Response
        if ($resp) { return [int]$resp.StatusCode } else { return 0 }
    }
}

function Api-Body($method, $url, $body, $tok) {
    try {
        $h = @{ Authorization = "Bearer $tok" }
        $params = @{ Uri=$url; Method=$method; Headers=$h; UseBasicParsing=$true; ErrorAction='Stop' }
        if ($body) { $params.Body = $body; $params.ContentType = "application/json" }
        $r = Invoke-WebRequest @params
        return ($r.Content | ConvertFrom-Json)
    } catch { return $null }
}

function T($name, $code, $exp, $note="") {
    if ($code -eq $exp) { $script:PASS++; Write-Output "  OK  [$code] $name $note" }
    else                { $script:FAIL++; Write-Output "  FAIL[$code] $name (exp $exp) $note" }
}
function G($url, $tok=$SA)           { return Api-Status "GET"    $url $null $tok }
function P($url, $body, $tok=$SA)    { return Api-Status "POST"   $url $body $tok }
function PA($url, $body, $tok=$SA)   { return Api-Status "PATCH"  $url $body $tok }
function PU($url, $body, $tok=$SA)   { return Api-Status "PUT"    $url $body $tok }
function DEL($url, $tok=$SA)         { return Api-Status "DELETE" $url $null $tok }
function GB($method,$url,$body,$tok=$SA) { return Api-Body $method $url $body $tok }
function Nz($a,$b) { if ($a) { return $a } else { return $b } }

# ─── CONTRIBUTOR ────────────────────────────────────────────────────────────
Write-Output "`n========== CONTRIBUTOR =========="
T "dashboard"                (G "$BASE/api/contributor/dashboard" $CON) 200
T "notifications GET"        (G "$BASE/api/contributor/notifications?page=1" $CON) 200
T "notifications read-all"   (P "$BASE/api/contributor/notifications/read-all" '{}' $CON) 200
T "settings GET"             (G "$BASE/api/contributor/settings" $CON) 200
T "settings PATCH account"   (PA "$BASE/api/contributor/settings/account" '{"display_name":"Final API Tester"}' $CON) 200
T "settings PATCH notif"     (PA "$BASE/api/contributor/settings/notifications" '{"task_assignments":true}' $CON) 200
T "settings PATCH locale"    (PA "$BASE/api/contributor/settings/locale" '{"timezone":"Asia/Kolkata","language":"en"}' $CON) 200
T "tasks list"               (G "$BASE/api/contributor/tasks?page=1" $CON) 200
T "tasks summary"            (G "$BASE/api/contributor/tasks/summary" $CON) 200
T "tasks discovery"          (G "$BASE/api/contributor/tasks/discovery/summary" $CON) 200
T "submissions list"         (G "$BASE/api/contributor/submissions?page=1" $CON) 200
T "earnings summary"         (G "$BASE/api/contributor/earnings/summary" $CON) 200
T "earnings chart"           (G "$BASE/api/contributor/earnings/chart?period=3m" $CON) 200
T "earnings kyc"             (G "$BASE/api/contributor/earnings/kyc/status" $CON) 200
T "payouts list"             (G "$BASE/api/contributor/payouts?page=1" $CON) 200
T "payout-prefs GET"         (G "$BASE/api/contributor/payout-preferences" $CON) 200
T "payout-prefs PUT"         (PU "$BASE/api/contributor/payout-preferences" '{"preferred_method":"bank","auto_payout":false,"minimum_payout_amount":1000}' $CON) 200
T "messages/threads"         (G "$BASE/api/contributor/messages/threads?page=1" $CON) 200
T "learning recommendations" (G "$BASE/api/contributor/learning/recommendations" $CON) 200

$tk  = GB "POST" "$BASE/api/contributor/support/tickets" '{"subject":"Final Test","category":"technical","priority":"medium","description":"API final test"}' $CON
$tkId = Nz $tk.id ""
T "support ticket POST"      (if ($tkId) { "200" } else { "500" }) 200 "(id=$tkId)"
T "support tickets GET"      (G "$BASE/api/contributor/support/tickets?page=1" $CON) 200
T "support ticket GET by id" (G "$BASE/api/contributor/support/tickets/$tkId" $CON) 200
T "support ticket PATCH"     (PA "$BASE/api/contributor/support/tickets/$tkId" '{"status":"in_progress"}' $CON) 200
T "support ticket msg POST"  (P "$BASE/api/contributor/support/tickets/$tkId/messages" '{"message":"API test follow up"}' $CON) 200
T "support faqs"             (G "$BASE/api/contributor/support/faqs" $CON) 200
T "support grievances GET"   (G "$BASE/api/contributor/support/grievances" $CON) 200
T "support grievance POST"   (P "$BASE/api/contributor/support/grievances" '{"category":"payment","subject":"TestGriev","description":"test","anonymous":false}' $CON) 200
T "safety-report POST"       (P "$BASE/api/contributor/support/safety-reports" '{"category":"harassment","description":"API test safety"}' $CON) 200
T "credentials list"         (G "$BASE/api/contributor/credentials" $CON) 200
T "credentials wallet/sum"   (G "$BASE/api/contributor/credentials/wallet/summary" $CON) 200
T "credentials wallet/cards" (G "$BASE/api/contributor/credentials/wallet/cards" $CON) 200
T "credentials skills/verify"(G "$BASE/api/contributor/credentials/skills/verification" $CON) 200
T "profile GET"              (G "$BASE/api/contributor/profile" $CON) 200
T "profile PATCH"            (PA "$BASE/api/contributor/profile" '{"display_name":"Final","bio":"bio","country":"India","city":"Chennai","timezone":"Asia/Kolkata","weekly_hours":40,"availability":"full_time","language":"en"}' $CON) 200
T "profile skills PUT"       (PU "$BASE/api/contributor/profile/skills" '{"skills":[{"name":"Python","proficiency":"expert"}]}' $CON) 200
T "profile evidence GET"     (G "$BASE/api/contributor/profile/evidence" $CON) 200
$ev  = GB "POST" "$BASE/api/contributor/profile/evidence" '{"title":"FinalProj","type":"project","url":"https://github.com/test","file_id":"","description":"test","skills":[{"name":"Python","proficiency":"expert"}]}' $CON
$evId = Nz $ev.id ""
T "profile evidence POST"    (if ($evId) { "200" } else { "500" }) 200 "(id=$evId)"
if ($evId) { T "evidence PATCH"  (PA "$BASE/api/contributor/profile/evidence/$evId" '{"title":"Updated Final Evidence"}' $CON) 200 }
if ($evId) { T "evidence DELETE" (DEL "$BASE/api/contributor/profile/evidence/$evId" $CON) 200 }
T "digital-twin GET"         (G "$BASE/api/contributor/profile/digital-twin" $CON) 200
T "digital-twin history"     (G "$BASE/api/contributor/profile/digital-twin/history?period=3m" $CON) 200
T "search"                   (G "$BASE/api/contributor/search?q=python&limit=5" $CON) 200
T "public credentials 404"   (G "$BASE/api/public/credentials/nosuchid" "noop") 404

# ─── ENTERPRISE ──────────────────────────────────────────────────────────────
Write-Output "`n========== ENTERPRISE =========="
T "wizards GET"              (G "$BASE/api/v1/wizards") 200
$wiz  = GB "POST" "$BASE/api/v1/wizards" '{"enterprise_id":"ent_final"}'
$wizId = Nz $wiz.data.id (Nz $wiz.wizard_id (Nz $wiz.id ""))
T "wizards POST"             (if ($wizId.Length -gt 5) { "200" } else { "500" }) 200 "(id=$wizId)"
T "wizard GET by id"         (G "$BASE/api/v1/wizards/$wizId") 200
T "wizard steps PUT"         (PU "$BASE/api/v1/wizards/$wizId/steps/0" '{"project_name":"Final Project","description":"API test"}') 200
T "wizard step skip"         (P "$BASE/api/v1/wizards/$wizId/steps/1/skip" '{}') 200
T "sows GET"                 (G "$BASE/api/v1/sows") 200
T "sows enterprise/all"      (G "$BASE/api/v1/sows/enterprise/all") 200
T "sow manual list"          (G "$BASE/api/v1/sow") 200
T "portfolio projects"       (G "$BASE/api/v1/portfolio/projects") 200
T "users search"             (G "$BASE/api/v1/users/search?q=admin") 200
T "users me profile PUT"     (PU "$BASE/api/v1/users/me/profile" '{"firstName":"Super","lastName":"Admin","adminTitle":"Platform Admin"}') 200
T "decomp plans GET"         (G "$BASE/api/v1/enterprise/decomposition/plans") 200

$np    = GB "POST" "$BASE/api/v1/enterprise/decomposition/plans" "{`"wizard_id`":`"wiz_final`",`"enterprise_id`":`"ent001`",`"sow_reference`":`"sow001`",`"project_name`":`"FinalPlan$TS`",`"minimum_budget`":10000,`"maximum_budget`":50000,`"start_date`":`"2026-07-01`",`"end_date`":`"2026-12-31`"}"
$planId = Nz $np.data.id (Nz $np.plan_id (Nz $np.id ""))
T "decomp plan POST"         (if ($planId.Length -gt 3) { "200" } else { "500" }) 200 "(plan=$planId)"
T "decomp plan GET"          (G "$BASE/api/v1/enterprise/decomposition/plans/$planId") 200
T "decomp plan summary"      (G "$BASE/api/v1/enterprise/decomposition/plans/$planId/summary") 200
T "decomp plan status"       (G "$BASE/api/v1/enterprise/decomposition/plans/$planId/status") 200
T "decomp tasks GET"         (G "$BASE/api/v1/enterprise/decomposition/plans/$planId/tasks") 200

$nt    = GB "POST" "$BASE/api/v1/enterprise/decomposition/plans/$planId/tasks" '{"title":"Final Task","priority":"high","effort":8,"estimated_hours":8,"skills":["Python"],"description":"test"}'
$taskId = Nz $nt.data.id (Nz $nt.task_id (Nz $nt.id ""))
T "decomp task POST"         (if ($taskId.Length -gt 3) { "200" } else { "500" }) 200 "(task=$taskId)"
T "decomp task GET"          (G "$BASE/api/v1/enterprise/decomposition/plans/$planId/tasks/$taskId") 200
T "decomp task PATCH"        (PA "$BASE/api/v1/enterprise/decomposition/plans/$planId/tasks/$taskId" '{"title":"Updated Final Task"}') 200
T "decomp task DELETE"       (DEL "$BASE/api/v1/enterprise/decomposition/plans/$planId/tasks/$taskId") 200
T "decomp milestones"        (G "$BASE/api/v1/enterprise/decomposition/plans/$planId/milestones") 200
T "decomp checklist"         (G "$BASE/api/v1/enterprise/decomposition/plans/$planId/checklist") 200
T "decomp critical-path"     (G "$BASE/api/v1/enterprise/decomposition/plans/$planId/critical-path") 200
T "decomp review"            (G "$BASE/api/v1/enterprise/decomposition/plans/$planId/review") 200

# ─── SUPERADMIN ──────────────────────────────────────────────────────────────
Write-Output "`n========== SUPERADMIN =========="
T "reviewers list"           (G "$BASE/api/v1/users/reviewers/list") 200
$nr    = GB "POST" "$BASE/api/v1/users" "{`"firstName`":`"RevFinal`",`"lastName`":`"User`",`"email`":`"revfinal2_$TS@g.dev`",`"role`":`"reviewer`"}"
T "create user POST (201)"   (if ($nr.id) { "201" } else { "500" }) 201 "(id=$($nr.id))"
T "reviewer dashboard"       (G "$BASE/api/v1/reviewer/dashboard") 200
T "reviewer projects"        (G "$BASE/api/v1/reviewer/projects") 200
T "pricing GET"              (G "$BASE/api/v1/settings/contributor-pricing") 200
T "pricing PUT"              (PU "$BASE/api/v1/settings/contributor-pricing" '{"student":{"currency":"INR","hourlyRate":400},"workforceSlabs":[{"id":"s1","minYears":0,"maxYears":2,"currency":"INR","rate":450}]}') 200
$pr    = GB "GET" "$BASE/api/v1/settings/contributor-pricing"
$rate  = $pr.data.student.hourlyRate
T "pricing persisted"        (if ($rate -eq 400 -or $rate -eq 400.0) { "ok" } else { "fail" }) "ok" "(rate=$rate)"
T "pricing public no-auth"   (try { [int](Invoke-WebRequest "$BASE/api/v1/config/contributor-pricing" -UseBasicParsing -EA Stop).StatusCode } catch { [int]$_.Exception.Response.StatusCode }) 200

$csvPath = "$env:TEMP\final_bulk_test.csv"
[System.IO.File]::WriteAllText($csvPath,"email,name,role`r`nbkfinal_$TS@g.dev,Final Alpha,contributor`r`nsuperadmin@glimmora.dev,Dup,admin`r`n",[System.Text.Encoding]::ASCII)
$prev = (& curl.exe -sf -X POST -H "Authorization: Bearer $SA" -F "file=@$csvPath;type=text/csv" "$BASE/api/admin/users/bulk-import?commit=false") | ConvertFrom-Json
T "bulk import PREVIEW"      (if ($prev.validRows.Count -eq 1 -and $prev.errorRows.Count -eq 1) { "200" } else { "500" }) 200 "(valid=$($prev.validRows.Count) dup=$($prev.errorRows[0].isDuplicate))"
$comm = (& curl.exe -sf -X POST -H "Authorization: Bearer $SA" -F "file=@$csvPath;type=text/csv" "$BASE/api/admin/users/bulk-import?commit=true&sendCredentials=false") | ConvertFrom-Json
T "bulk import COMMIT"       (if ($comm.insertedCount -eq 1) { "200" } else { "500" }) 200 "(inserted=$($comm.insertedCount))"

# ─── UNIVERSITIES ────────────────────────────────────────────────────────────
Write-Output "`n========== UNIVERSITIES =========="
$uniId = "uni_final2_$TS"
T "universities GET"         (G "$BASE/api/universities") 200
T "university POST"          (P "$BASE/api/universities" "{`"id`":`"$uniId`",`"name`":`"FinalUniv2$TS`",`"kind`":`"university`",`"metadata`":{}}") 200
T "university GET by id"     (G "$BASE/api/universities/$uniId") 200
T "university students GET"  (G "$BASE/api/universities/$uniId/students") 200
T "student POST"             (P "$BASE/api/universities/$uniId/students" "{`"firstName`":`"Stu`",`"lastName`":`"Final`",`"email`":`"stufinal2_$TS@uni.edu`",`"role`":`"student`",`"department`":`"CS`"}") 200
T "university dashboard"     (G "$BASE/api/universities/$uniId/dashboard") 200
T "university audit"         (G "$BASE/api/universities/$uniId/audit?page=1") 200
$uCsv = "$env:TEMP\uni_bulk_final.csv"
[System.IO.File]::WriteAllText($uCsv,"email,name,role`r`nbku2_$TS@uni.edu,Alpha,student`r`nsuperadmin@glimmora.dev,Dup,student`r`n",[System.Text.Encoding]::ASCII)
$uPrev = (& curl.exe -sf -X POST -H "Authorization: Bearer $SA" -F "file=@$uCsv;type=text/csv" "$BASE/api/universities/$uniId/students/bulk-import?commit=false") | ConvertFrom-Json
T "uni bulk PREVIEW"         (if ($uPrev.validRows.Count -eq 1) { "200" } else { "500" }) 200 "(valid=$($uPrev.validRows.Count) errors=$($uPrev.errorRows.Count))"
$uComm = (& curl.exe -sf -X POST -H "Authorization: Bearer $SA" -F "file=@$uCsv;type=text/csv" "$BASE/api/universities/$uniId/students/bulk-import?commit=true&sendCredentials=false") | ConvertFrom-Json
T "uni bulk COMMIT"          (if ($uComm.insertedCount -eq 1) { "200" } else { "500" }) 200 "(inserted=$($uComm.insertedCount))"

# ─── WOMEN ───────────────────────────────────────────────────────────────────
Write-Output "`n========== WOMEN =========="
$wtId = "wt_final2_$TS"
T "women teams GET"          (G "$BASE/api/women/teams") 200
T "women team POST"          (P "$BASE/api/women/teams" "{`"id`":`"$wtId`",`"name`":`"FinalTeam2$TS`",`"kind`":`"women_team`",`"metadata`":{}}") 200
T "women team GET"           (G "$BASE/api/women/teams/$wtId") 200
T "women members GET"        (G "$BASE/api/women/teams/$wtId/members") 200
T "women member POST"        (P "$BASE/api/women/teams/$wtId/members" "{`"firstName`":`"Wm`",`"lastName`":`"Final`",`"email`":`"wmfinal2_$TS@g.dev`",`"role`":`"contributor`",`"department`":`"Eng`"}") 200
T "women dashboard"          (G "$BASE/api/women/teams/$wtId/dashboard") 200
T "women audit"              (G "$BASE/api/women/teams/$wtId/audit?page=1") 200
$wCsv = "$env:TEMP\women_bulk_final.csv"
[System.IO.File]::WriteAllText($wCsv,"email,name,role`r`nbkw2_$TS@g.dev,Alpha,contributor`r`nsuperadmin@glimmora.dev,Dup,contributor`r`n",[System.Text.Encoding]::ASCII)
$wPrev = (& curl.exe -sf -X POST -H "Authorization: Bearer $SA" -F "file=@$wCsv;type=text/csv" "$BASE/api/women/teams/$wtId/members/bulk-import?commit=false") | ConvertFrom-Json
T "women bulk PREVIEW"       (if ($wPrev.validRows.Count -eq 1) { "200" } else { "500" }) 200 "(valid=$($wPrev.validRows.Count) errors=$($wPrev.errorRows.Count))"
$wComm = (& curl.exe -sf -X POST -H "Authorization: Bearer $SA" -F "file=@$wCsv;type=text/csv" "$BASE/api/women/teams/$wtId/members/bulk-import?commit=true&sendCredentials=false") | ConvertFrom-Json
T "women bulk COMMIT"        (if ($wComm.insertedCount -eq 1) { "200" } else { "500" }) 200 "(inserted=$($wComm.insertedCount))"

# ─── MENTOR ──────────────────────────────────────────────────────────────────
Write-Output "`n========== MENTOR =========="
T "mentor dashboard"         (G "$BASE/api/mentor/dashboard") 200
T "mentor queue"             (G "$BASE/api/mentor/queue") 200
T "mentor mentorship"        (G "$BASE/api/mentor/mentorship") 200
T "mentor escalation GET"    (G "$BASE/api/mentor/escalation") 200
$esc  = GB "POST" "$BASE/api/mentor/escalation" '{"subject":"Final Escalation","description":"API final test","severity":"medium"}'
$escId = Nz $esc.id (Nz $esc.data.id "")
T "mentor escalation POST"   (if ($escId) { "200" } else { "500" }) 200 "(id=$escId)"
T "mentor esc GET by id"     (G "$BASE/api/mentor/escalation/$escId") 200
T "mentor esc PATCH"         (PA "$BASE/api/mentor/escalation/$escId" '{"status":"in_progress","note":"Working"}') 200
T "mentor history"           (G "$BASE/api/mentor/history") 200
T "mentor profile GET"       (G "$BASE/api/mentor/profile") 200
T "mentor profile PATCH"     (PA "$BASE/api/mentor/profile" '{"bio":"Final test mentor","expertise":["Python","ML"]}') 200
T "mentor settings GET"      (G "$BASE/api/mentor/settings") 200
T "mentor settings PATCH"    (PA "$BASE/api/mentor/settings" '{"settings":{"email_notifications":true,"review_reminders":true}}') 200

# ─── EMAIL ───────────────────────────────────────────────────────────────────
Write-Output "`n========== EMAIL =========="
$eKey = "finalkey$TS"
T "email templates GET"      (G "$BASE/api/email/templates") 200
T "email template PUT"       (PU "$BASE/api/email/templates" "{`"key`":`"$eKey`",`"subject`":`"Final Test Email`",`"body_html`":`"<p>Hello {{name}}</p>`",`"header_color`":`"#0D1B2A`",`"footer_text`":`"GlimmoraTeam`"}") 200
T "email template GET"       (G "$BASE/api/email/templates/$eKey") 200
T "email template test send" (P "$BASE/api/email/templates/$eKey/test" '{"to_email":"test@glimmora.dev"}') 200
T "email send"               (P "$BASE/api/email/send" "{`"to`":`"test@glimmora.dev`",`"subject`":`"API Final $TS`",`"body`":`"Automated test`"}") 200
T "email template DELETE"    (DEL "$BASE/api/email/templates/$eKey") 200
T "email template GET 404"   (G "$BASE/api/email/templates/$eKey") 404

# ─── FILE ────────────────────────────────────────────────────────────────────
Write-Output "`n========== FILE =========="
T "files list GET"           (G "$BASE/api/files") 200
$fPath = "$env:TEMP\upload_final.txt"
[System.IO.File]::WriteAllText($fPath,"Hello Glimmora API final test $TS")
$fRaw  = & curl.exe -sf -X POST -H "Authorization: Bearer $SA" -F "file=@$fPath;type=text/plain" -F "category=test" -F "title=FinalAPITest$TS" "$BASE/api/files/upload"
$fData = $fRaw | ConvertFrom-Json
$fileId = $fData.id
T "file upload (Vercel Blob)" (if ($fileId -gt 0) { "200" } else { "503" }) 200 "(id=$fileId)"
T "file GET by id"           (G "$BASE/api/files/$fileId") 200
T "file DELETE"              (DEL "$BASE/api/files/$fileId") 200

# ─── FINAL ───────────────────────────────────────────────────────────────────
$total = $PASS + $FAIL
$pct   = [Math]::Round($PASS * 100 / $total, 1)
Write-Output ""
Write-Output "=============================================="
Write-Output "  FINAL: $PASS passed / $FAIL failed / $total total"
Write-Output "  PASS RATE: $pct%"
Write-Output "=============================================="
