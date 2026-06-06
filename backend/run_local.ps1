# Run the GlimmoraTeam backend DIRECTLY (no Docker).
# Starts each FastAPI service on its own port + a local gateway on :9000.
# Usage:  powershell -ExecutionPolicy Bypass -File run_local.ps1

$ErrorActionPreference = "Continue"
$Backend = "E:\GLIMMORA\educore\GTPROJECT\backend"
$Shared  = $Backend
$Services = $Backend + "\services"

# service dir -> package -> port  (ports must match local_gateway.py SERVICE_PORTS)
$Map = @(
  @{ dir="auth-service";         pkg="auth_app";         port=8011 },
  @{ dir="contributor-service";  pkg="contributor_app";  port=8012 },
  @{ dir="enterprise-service";   pkg="enterprise_app";   port=8013 },
  @{ dir="superadmin-service";   pkg="superadmin_app";   port=8014 },
  @{ dir="mentor-service";       pkg="mentor_app";       port=8015 },
  @{ dir="universities-service"; pkg="universities_app"; port=8016 },
  @{ dir="women-service";        pkg="women_app";        port=8017 },
  @{ dir="email-service";        pkg="email_app";        port=8018 },
  @{ dir="file-service";         pkg="file_app";         port=8019 }
)

# Load backend/.env into this process so child uvicorns inherit DATABASE_URL etc.
Get-Content "$Backend\.env" | ForEach-Object {
  if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
    $name = $matches[1]; $val = $matches[2].Trim('"')
    [Environment]::SetEnvironmentVariable($name, $val, "Process")
  }
}

foreach ($s in $Map) {
  $svcDir = Join-Path $Services $s.dir
  # PYTHONPATH = shared root + the service dir (so `import <pkg>` resolves)
  $pp = "$Shared;$svcDir"
  Write-Host "Starting $($s.pkg) on :$($s.port)"
  $env:PYTHONPATH = $pp
  Start-Process -WindowStyle Hidden -FilePath "python" `
    -ArgumentList "-m","uvicorn","$($s.pkg).main:app","--host","127.0.0.1","--port","$($s.port)" `
    -WorkingDirectory $svcDir `
    -RedirectStandardOutput "$env:TEMP\glm_$($s.pkg).out.log" `
    -RedirectStandardError  "$env:TEMP\glm_$($s.pkg).err.log"
}

# Gateway on :9000
Write-Host "Starting local gateway on :9000"
$env:PYTHONPATH = $Shared
Start-Process -WindowStyle Hidden -FilePath "python" `
  -ArgumentList "-m","uvicorn","local_gateway:app","--host","127.0.0.1","--port","9000" `
  -WorkingDirectory $Backend `
  -RedirectStandardOutput "$env:TEMP\glm_gateway.out.log" `
  -RedirectStandardError  "$env:TEMP\glm_gateway.err.log"

Write-Host "All services launched. Logs in %TEMP%\glm_*.log"
