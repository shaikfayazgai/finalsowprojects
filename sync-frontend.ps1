#!/usr/bin/env powershell
<#
.SYNOPSIS
    Synchronize frontend with updatedfrontend — copy all role portals and features.

.DESCRIPTION
    This script copies the complete updated frontend from updatedfrontend/ to frontend/,
    preserving the latest role-based authentication, all portal UIs, and integration logic.

.EXAMPLE
    .\sync-frontend.ps1
    
    # Dry run (preview changes):
    .\sync-frontend.ps1 -DryRun
    
    # Backup first, then sync:
    .\sync-frontend.ps1 -CreateBackup
#>

param(
    [switch]$DryRun = $false,
    [switch]$CreateBackup = $false,
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

# Paths
$srcDir = "E:\GLIMMORA\educore\GTPROJECT\updatedfrontend\frontend"
$dstDir = "E:\GLIMMORA\educore\GTPROJECT\frontend"
$backupDir = "E:\GLIMMORA\educore\GTPROJECT\frontend.backup"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDated = "$backupDir`_$timestamp"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔄  Frontend Synchronization Script" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Verify source exists
if (-not (Test-Path $srcDir)) {
    Write-Host "❌  Source directory not found: $srcDir" -ForegroundColor Red
    exit 1
}
Write-Host "✅  Source found: $srcDir" -ForegroundColor Green

# Verify destination exists
if (-not (Test-Path $dstDir)) {
    Write-Host "❌  Destination directory not found: $dstDir" -ForegroundColor Red
    exit 1
}
Write-Host "✅  Destination found: $dstDir" -ForegroundColor Green
Write-Host ""

# Create backup if requested
if ($CreateBackup) {
    Write-Host "📦  Creating backup..." -ForegroundColor Yellow
    try {
        Copy-Item -Path $dstDir -Destination $backupDated -Recurse -Force
        Write-Host "✅  Backup created: $backupDated" -ForegroundColor Green
    } catch {
        Write-Host "⚠️   Backup failed: $_" -ForegroundColor Yellow
        if (-not $Force) {
            exit 1
        }
    }
    Write-Host ""
}

# List directories to sync
$dirsToSync = @(
    @{ src = "src"; desc = "Source code" },
    @{ src = "public"; desc = "Static assets" }
)

$filesToSync = @(
    "next.config.ts",
    "tsconfig.json",
    "package.json",
    "prisma.config.ts",
    ".env.example"
)

Write-Host "📋  Sync Plan:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Directories:" -ForegroundColor White
$dirsToSync | ForEach-Object {
    $srcPath = Join-Path $srcDir $_.src
    $count = (Get-ChildItem $srcPath -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Host "    • $($_.desc) ($($_.src)/) — $count files" -ForegroundColor Gray
}

Write-Host ""
Write-Host "  Files:" -ForegroundColor White
$filesToSync | ForEach-Object {
    $exists = Test-Path (Join-Path $srcDir $_)
    $status = if ($exists) { "✓" } else { "✗" }
    Write-Host "    $status $_" -ForegroundColor Gray
}

Write-Host ""

if ($DryRun) {
    Write-Host "⏭️   Dry run mode — no changes made" -ForegroundColor Yellow
    exit 0
}

# Confirm before proceeding
if (-not $Force) {
    Write-Host "⚠️   This will overwrite files in: $dstDir" -ForegroundColor Yellow
    $confirm = Read-Host "Continue? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "❌  Sync cancelled" -ForegroundColor Red
        exit 0
    }
}

Write-Host ""
Write-Host "🔄  Syncing..." -ForegroundColor Cyan
Write-Host ""

# Sync directories
foreach ($dir in $dirsToSync) {
    $srcPath = Join-Path $srcDir $dir.src
    $dstPath = Join-Path $dstDir $dir.src
    
    if (Test-Path $srcPath) {
        Write-Host "  → Syncing $($dir.src)/" -ForegroundColor White
        try {
            # Remove destination to ensure clean sync
            if (Test-Path $dstPath) {
                Remove-Item -Path $dstPath -Recurse -Force -ErrorAction SilentlyContinue
            }
            Copy-Item -Path $srcPath -Destination $dstPath -Recurse -Force
            $fileCount = (Get-ChildItem $dstPath -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
            Write-Host "     ✅  Synced $fileCount files" -ForegroundColor Green
        } catch {
            Write-Host "     ❌  Failed: $_" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""

# Sync individual files
foreach ($file in $filesToSync) {
    $srcFile = Join-Path $srcDir $file
    $dstFile = Join-Path $dstDir $file
    
    if (Test-Path $srcFile) {
        Write-Host "  → Copying $file" -ForegroundColor White
        try {
            Copy-Item -Path $srcFile -Destination $dstFile -Force
            Write-Host "     ✅  Copied" -ForegroundColor Green
        } catch {
            Write-Host "     ⚠️   Skipped: $_" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅  Sync Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""

Write-Host "📝  Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Navigate to frontend:" -ForegroundColor White
Write-Host "     cd $dstDir" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Reinstall dependencies:" -ForegroundColor White
Write-Host "     pnpm install" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Generate Prisma client:" -ForegroundColor White
Write-Host "     pnpm prisma generate" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Start dev server:" -ForegroundColor White
Write-Host "     pnpm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  5. Open browser:" -ForegroundColor White
Write-Host "     http://localhost:3000" -ForegroundColor Gray
Write-Host ""

Write-Host "🧪  Test with credentials:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Superadmin:" -ForegroundColor White
Write-Host "    📧 superadmin@glimmora.dev" -ForegroundColor Gray
Write-Host "    🔑 glimmora123" -ForegroundColor Gray
Write-Host ""
Write-Host "  Enterprise:" -ForegroundColor White
Write-Host "    📧 enterprise@glimmora.dev" -ForegroundColor Gray
Write-Host "    🔑 enterprise123" -ForegroundColor Gray
Write-Host ""
Write-Host "  Contributor:" -ForegroundColor White
Write-Host "    📧 contributor@glimmora.dev" -ForegroundColor Gray
Write-Host "    🔑 contributor123" -ForegroundColor Gray
Write-Host ""

Write-Host "📚  For more details, see: FRONTEND_UPDATE_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
