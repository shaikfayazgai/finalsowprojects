# GTPROJECT — stop everything on :3000 + :9000 + backend service ports.
$ports = @(3000, 9000, 8011, 8012, 8013, 8014, 8015, 8016, 8017, 8018, 8019)
foreach ($port in $ports) {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conns) {
    try {
      Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
      Write-Host "stopped pid $($c.OwningProcess) on :$port"
    } catch {}
  }
}
Write-Host "All GTPROJECT dev servers stopped."
