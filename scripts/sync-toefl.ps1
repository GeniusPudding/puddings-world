# Syncs the TOEFL Daily Trainer PWA from the canonical source in
# us-online-masters-guide into this site's public/toefl/.
#
# Run from anywhere — the script resolves paths relative to itself.
#
# Usage:
#   .\scripts\sync-toefl.ps1
#   .\scripts\sync-toefl.ps1 -Source "D:\code\us-online-masters-guide\toefl-trainer"

param(
    [string]$Source = "$env:USERPROFILE\Desktop\GitHub\us-online-masters-guide\toefl-trainer"
)

$ErrorActionPreference = "Stop"
$dst = Join-Path $PSScriptRoot "..\public\toefl"

if (-not (Test-Path $Source)) {
    Write-Error "Source not found: $Source"
    exit 1
}

New-Item -ItemType Directory -Force $dst | Out-Null

$files = @("index.html", "manifest.json", "sw.js")
foreach ($f in $files) {
    $srcFile = Join-Path $Source $f
    if (-not (Test-Path $srcFile)) {
        Write-Warning "Missing source file: $srcFile (skipped)"
        continue
    }
    Copy-Item -Force $srcFile (Join-Path $dst $f)
    Write-Host "  $f" -ForegroundColor Green
}

Write-Host ""
Write-Host "Synced TOEFL trainer to $dst" -ForegroundColor Cyan
Write-Host "Commit + push to deploy via Vercel."
