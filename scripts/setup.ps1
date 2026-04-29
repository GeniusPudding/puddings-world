$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm install
} elseif (Get-Command npm -ErrorAction SilentlyContinue) {
    npm install
} else {
    Write-Error "Install Node.js (>=20) first."
    exit 1
}
Write-Host "Done."
