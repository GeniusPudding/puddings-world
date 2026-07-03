# Syncs the generated KTV wire contract from its canonical home in
# StreetPerformerMaster into this repo's lib/ktv/contract.gen.ts.
#
# The contract is OWNED by StreetPerformerMaster:
#   canonical:  contract/ktv-contract.json   (the only file a human edits)
#   generator:  python tools/gen_contract.py (renders contract/dist/*)
# This script only copies the rendered TS artifact — never edit either side
# by hand. To change the contract, edit the JSON there, regenerate, re-sync.
#
# Usage:
#   .\scripts\sync-ktv-contract.ps1
#   .\scripts\sync-ktv-contract.ps1 -Source "D:\code\StreetPerformerMaster"

param(
    [string]$Source = "$env:USERPROFILE\Desktop\StreetPerformerMaster"
)

$ErrorActionPreference = "Stop"
$srcFile = Join-Path $Source "contract\dist\ktv-contract.ts"
$dstFile = Join-Path $PSScriptRoot "..\lib\ktv\contract.gen.ts"

if (-not (Test-Path $srcFile)) {
    Write-Error "Source artifact not found: $srcFile — run 'python tools/gen_contract.py' in $Source first."
    exit 1
}

$before = if (Test-Path $dstFile) { Get-Content $dstFile -Raw } else { "" }
$after = Get-Content $srcFile -Raw

if ($before -eq $after) {
    Write-Host "Already up to date." -ForegroundColor Green
} else {
    Copy-Item -Force $srcFile $dstFile
    Write-Host "Updated lib/ktv/contract.gen.ts" -ForegroundColor Green
}

$version = ($after | Select-String 'KTV_CONTRACT_VERSION = "([^"]+)"').Matches[0].Groups[1].Value
Write-Host "Contract version: $version" -ForegroundColor Cyan
