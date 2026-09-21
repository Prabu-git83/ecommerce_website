# Starts everything Arca needs for local development:
#   Docker Desktop -> Postgres/Redis/MinIO/Mailpit -> backend, website, admin dev servers.
# Safe to re-run any time - already-running pieces are left alone.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

function Test-Url($url) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
        return $r.StatusCode -eq 200
    } catch { return $false }
}

Write-Host "== Arca dev environment ==" -ForegroundColor Cyan

# 1. Docker Desktop
$dockerReady = $false
try {
    docker info *> $null
    $dockerReady = $true
} catch { $dockerReady = $false }

if (-not $dockerReady) {
    Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    $waited = 0
    while (-not $dockerReady -and $waited -lt 90) {
        Start-Sleep -Seconds 3
        $waited += 3
        try { docker info *> $null; $dockerReady = $true } catch { $dockerReady = $false }
    }
    if (-not $dockerReady) {
        Write-Host "Docker didn't come up after 90s - open Docker Desktop manually and re-run this script." -ForegroundColor Red
        exit 1
    }
}
Write-Host "Docker is ready." -ForegroundColor Green

# 2. Infra containers
Write-Host "Starting Postgres, Redis, MinIO, Mailpit..." -ForegroundColor Yellow
Push-Location $root
docker compose up -d postgres redis minio mailpit
Pop-Location

# 3. App dev servers - each in its own window so logs stay visible and any one
#    can be closed/restarted independently.
function Start-DevServer($title, $workDir, $command) {
    Start-Process powershell -ArgumentList @(
        "-NoExit", "-Command",
        "cd '$workDir'; `$host.ui.RawUI.WindowTitle = '$title'; $command"
    )
}

if (-not (Test-Url "http://localhost:4000/health")) {
    Write-Host "Starting backend (:4000)..." -ForegroundColor Yellow
    Start-DevServer "Arca - backend" "$root\backend" "npx tsx src/server.ts"
} else {
    Write-Host "Backend already running." -ForegroundColor Green
}

if (-not (Test-Url "http://localhost:3000")) {
    Write-Host "Starting website (:3000)..." -ForegroundColor Yellow
    Start-DevServer "Arca - website" "$root\website" "npx next dev"
} else {
    Write-Host "Website already running." -ForegroundColor Green
}

if (-not (Test-Url "http://localhost:5173")) {
    Write-Host "Starting admin portal (:5173)..." -ForegroundColor Yellow
    Start-DevServer "Arca - admin" "$root\admin" "npx vite"
} else {
    Write-Host "Admin portal already running." -ForegroundColor Green
}

Write-Host ""
Write-Host "Give the servers about 10 seconds to finish booting, then open:" -ForegroundColor Cyan
Write-Host "  Website:  http://localhost:3000"
Write-Host "  Admin:    http://localhost:5173  (admin@arca.local / admin123)"
Write-Host "  API:      http://localhost:4000/v1"
Write-Host "  Mailpit:  http://localhost:8025"
