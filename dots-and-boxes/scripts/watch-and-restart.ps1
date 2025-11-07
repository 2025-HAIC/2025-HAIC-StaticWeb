# Watch for file changes and run restart-dev.ps1 after debounce
# Usage: run this in PowerShell from the project root: ./scripts/watch-and-restart.ps1

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $projectRoot

$exclude = @('node_modules','dist','.git','.vite','.cache')

function IsExcluded($path) {
    foreach ($ex in $exclude) {
        if ($path -like "*$ex*") { return $true }
    }
    return $false
}

$timer = $null
$debounceMs = 1200

$action = {
    param($sender,$e)
    $full = $e.FullPath
    if (IsExcluded $full) { return }
    Write-Host "Change detected: $($e.ChangeType) $full"
    if ($timer) { $timer.Stop(); $timer.Dispose() }
    $timer = New-Object Timers.Timer $debounceMs
    $timer.AutoReset = $false
    Register-ObjectEvent $timer Elapsed -Action {
        Write-Host "Debounced: running restart script at $(Get-Date)"
        & "${projectRoot}\restart-dev.ps1"
    } | Out-Null
    $timer.Start()
}

$watcher = New-Object System.IO.FileSystemWatcher $projectRoot -Property @{ IncludeSubdirectories = $true; NotifyFilter = [IO.NotifyFilters]'FileName, LastWrite, DirectoryName'; Filter='*.*' }

$handlers = @()
$handlers += Register-ObjectEvent $watcher Changed -Action $action
$handlers += Register-ObjectEvent $watcher Created -Action $action
$handlers += Register-ObjectEvent $watcher Renamed -Action $action
$handlers += Register-ObjectEvent $watcher Deleted -Action $action

$watcher.EnableRaisingEvents = $true

Write-Host "Watching $projectRoot for changes (excludes: $($exclude -join ', ')). Press Enter to stop."
Read-Host | Out-Null

# cleanup
foreach ($h in $handlers) { Unregister-Event -SourceIdentifier $h.Name -ErrorAction SilentlyContinue }
$watcher.EnableRaisingEvents = $false
$watcher.Dispose()
Write-Host "Watcher stopped."