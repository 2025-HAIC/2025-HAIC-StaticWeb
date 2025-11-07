# Restart development environment (Docker Compose)
# Usage: ./scripts/restart-dev.ps1

Write-Host "Stopping containers..." -ForegroundColor Cyan
docker compose down

Write-Host "Starting containers (rebuild)..." -ForegroundColor Cyan
docker compose up --build -d

Write-Host "Tailing web logs (press Ctrl+C to stop)..." -ForegroundColor Cyan
docker compose logs -f web
