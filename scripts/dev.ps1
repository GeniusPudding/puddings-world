$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
if (Get-Command pnpm -ErrorAction SilentlyContinue) { pnpm dev } else { npm run dev }
