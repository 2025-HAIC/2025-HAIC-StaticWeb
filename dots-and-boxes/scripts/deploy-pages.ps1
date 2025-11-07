# Deploy Dots-and-Boxes to GitHub Pages (local helper)
# Usage: from project root run: powershell -NoProfile -ExecutionPolicy Bypass -File .\dots-and-boxes\scripts\deploy-pages.ps1

Param()

$projectDir = Join-Path $PSScriptRoot ".."
$projectDir = Resolve-Path $projectDir
Set-Location $projectDir
Write-Host "Project dir: $projectDir"

# Ensure npm deps
Write-Host "Installing dependencies... (npm ci)"
npm ci
if ($LASTEXITCODE -ne 0) { Write-Error "npm ci failed (exit $LASTEXITCODE)"; exit $LASTEXITCODE }

# Build
Write-Host "Building the app (npm run build)..."
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Build failed (exit $LASTEXITCODE)"; exit $LASTEXITCODE }

# Deploy using gh-pages package
Write-Host "Deploying to gh-pages branch (npm run deploy)..."
# npm run deploy will run predeploy then gh-pages -d dist
npm run deploy
if ($LASTEXITCODE -ne 0) { Write-Error "Deploy failed (exit $LASTEXITCODE). Check git remote and auth."; exit $LASTEXITCODE }

Write-Host "Deploy complete. Check your repository's GitHub Pages settings and the gh-pages branch."