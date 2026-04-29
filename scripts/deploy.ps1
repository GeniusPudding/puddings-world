$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if ($env:DOCKER -eq "1") {
    docker build -t "puddings-world" .
    Write-Host "Image built: puddings-world"
} else {
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) { npm i -g vercel }
    vercel deploy --prod
}
