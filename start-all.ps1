# GTPROJECT — persistent dev launcher.
#
# Starts the backend (9 FastAPI services + gateway on :9000) and the frontend
# (Next.js on :3000), then keeps a WATCHDOG running that auto-restarts the
# frontend if it ever dies. Run this once and leave it; close the window (or
# Ctrl-C) to stop the watchdog (the detached servers keep running).
#
# Usage:   powershell -ExecutionPolicy Bypass -File E:\GLIMMORA\educore\GTPROJECT\start-all.ps1
# Stop all: powershell -File E:\GLIMMORA\educore\GTPROJECT\stop-all.ps1

$ErrorActionPreference = "Continue"
$root      = "E:\GLIMMORA\educore\GTPROJECT"
$backend   = Join-Path $root "backend"
$frontend  = Join-Path $root "frontend4\frontend"
$logDir    = Join-Path $env:TEMP "glm_logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Test-Port($port) {
  $c = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  return [bool]$c
}

function Start-Backend {
  if (Test-Port 9000) {
    Write-Host "[backend] gateway :9000 already up - skipping"
    return
  }
  Write-Host "[backend] starting via run_local.ps1 ..."
  Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-ExecutionPolicy","Bypass","-File","$backend\run_local.ps1" `
    -WindowStyle Hidden
  # wait for gateway
  for ($i = 0; $i -lt 60; $i++) {
    if (Test-Port 9000) { Write-Host "[backend] gateway :9000 up"; break }
    Start-Sleep -Seconds 2
  }
}

function Start-Frontend {
  Write-Host "[frontend] starting Next.js on :3000 ..."
  $out = Join-Path $logDir "frontend.out.log"
  $err = Join-Path $logDir "frontend.err.log"
  # PORT pinned to 3000 so NEXTAUTH_URL matches.
  $p = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c","set PORT=3000&& npm run dev" `
    -WorkingDirectory $frontend `
    -WindowStyle Hidden `
    -RedirectStandardOutput $out `
    -RedirectStandardError $err `
    -PassThru
  return $p
}

# --- boot ---
Start-Backend

$fe = $null
if (-not (Test-Port 3000)) {
  $fe = Start-Frontend
} else {
  Write-Host "[frontend] :3000 already up - skipping initial start"
}

Write-Host ""
Write-Host "=== GTPROJECT watchdog running ==="
Write-Host "  frontend: http://localhost:3000"
Write-Host "  gateway:  http://127.0.0.1:9000"
Write-Host "  logs:     $logDir"
Write-Host "  (leave this window open; it auto-restarts the frontend if it dies)"
Write-Host ""

# --- watchdog: auto-restart the frontend if :3000 goes down ---
while ($true) {
  Start-Sleep -Seconds 15
  if (-not (Test-Port 3000)) {
    Write-Host "[watchdog] frontend :3000 DOWN - restarting $(Get-Date -Format 'HH:mm:ss')"
    Remove-Item -Recurse -Force (Join-Path $frontend ".next\dev\lock") -ErrorAction SilentlyContinue
    $fe = Start-Frontend
    Start-Sleep -Seconds 20
  }
  if (-not (Test-Port 9000)) {
    Write-Host "[watchdog] backend :9000 DOWN - restarting $(Get-Date -Format 'HH:mm:ss')"
    Start-Backend
  }
}
