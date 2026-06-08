# Run every per-role standalone backend (each on its own port, shared DB).
# Usage:  powershell -ExecutionPolicy Bypass -File apps\run_all.ps1
$ErrorActionPreference = "Continue"
$Root = "E:\GLIMMORA\educore\GTPROJECT\apps"

$Apps = @(
  @{ role = "mentor";      port = 8101 },
  @{ role = "super-admin"; port = 8102 },
  @{ role = "enterprise";  port = 8103 },
  @{ role = "freelancer";  port = 8104 },
  @{ role = "reviewer";    port = 8105 }
)

foreach ($a in $Apps) {
  $dir = Join-Path $Root "$($a.role)\backend"
  if (-not (Test-Path $dir)) { Write-Host "skip $($a.role) (no folder)"; continue }
  # load this app's own .env into the process
  Get-Content "$dir\.env" | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
      [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim('"'), "Process")
    }
  }
  $env:PYTHONPATH = $dir
  $log = $a.role -replace '-','_'
  Write-Host "Starting $($a.role) backend on :$($a.port)"
  Start-Process -WindowStyle Hidden -FilePath "python" `
    -ArgumentList "-m","uvicorn","app:app","--host","127.0.0.1","--port","$($a.port)" `
    -WorkingDirectory $dir `
    -RedirectStandardOutput "$env:TEMP\glm_$($log)_standalone.out.log" `
    -RedirectStandardError  "$env:TEMP\glm_$($log)_standalone.err.log"
}
Write-Host "All per-role backends launched. Logs in %TEMP%\glm_*_standalone.log"
