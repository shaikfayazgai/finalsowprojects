# Run every per-role standalone FRONTEND (each on its own port → its own backend).
# Backends are started by apps\run_all.ps1. Each frontend needs `npm install` once.
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
  $dir = Join-Path $Root "$($a.role)\frontend"
  if (-not (Test-Path (Join-Path $dir "node_modules\next"))) {
    Write-Host "[$($a.role)] node_modules missing — run 'npm install' in $dir first"; continue
  }
  $log = $a.role -replace '-','_'
  Write-Host "Starting $($a.role) frontend on :$($a.port)"
  Start-Process -WindowStyle Hidden -FilePath "cmd.exe" `
    -ArgumentList "/c","npm run dev -- --port $($a.port) > `"$env:TEMP\glm_$($log)_fe.log`" 2>&1" `
    -WorkingDirectory $dir
}
Write-Host "All per-role frontends launched. Ports 3101-3105. Logs in %TEMP%\glm_*_fe.log"
