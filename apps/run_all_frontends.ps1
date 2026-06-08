# Run every per-role standalone FRONTEND (each on its own port, talking to its
# own backend). Backends are started by apps\run_all.ps1. Each frontend needs
# `npm install` once before this works.
# Usage:  powershell -ExecutionPolicy Bypass -File apps\run_all_frontends.ps1
$ErrorActionPreference = "Continue"
$Root = "E:\GLIMMORA\educore\GTPROJECT\apps"

$Apps = @(
  @{ role = "mentor";      port = 3101 },
  @{ role = "super-admin"; port = 3102 },
  @{ role = "enterprise";  port = 3103 },
  @{ role = "freelancer";  port = 3104 },
  @{ role = "reviewer";    port = 3105 }
)

foreach ($a in $Apps) {
  $dir = Join-Path $Root ($a.role + "\frontend")
  $hasDeps = Test-Path (Join-Path $dir "node_modules\next")
  if (-not $hasDeps) {
    Write-Host ("[" + $a.role + "] node_modules missing - run npm install in " + $dir)
    continue
  }
  $logName = $a.role.Replace("-", "_")
  $logPath = Join-Path $env:TEMP ("glm_" + $logName + "_fe.log")
  $cmd = "npm run dev -- --port " + $a.port + " > `"" + $logPath + "`" 2>&1"
  Write-Host ("Starting " + $a.role + " frontend on :" + $a.port)
  Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList "/c", $cmd -WorkingDirectory $dir
}
Write-Host "All per-role frontends launched (ports 3101-3105)."
