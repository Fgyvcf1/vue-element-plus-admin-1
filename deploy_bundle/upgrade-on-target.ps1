param(
  [string]$TargetRoot = $PSScriptRoot,
  [switch]$NoStart
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host "[STEP] $Message" -ForegroundColor Cyan
}

function Write-Ok {
  param([string]$Message)
  Write-Host "[ OK ] $Message" -ForegroundColor Green
}

function Write-WarnMsg {
  param([string]$Message)
  Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Invoke-RobocopySafe {
  param(
    [string]$Source,
    [string]$Destination,
    [string[]]$Args
  )

  $allArgs = @($Source, $Destination) + $Args
  & robocopy @allArgs | Out-Null
  $exitCode = $LASTEXITCODE
  if ($exitCode -gt 7) {
    throw "robocopy failed with exit code $exitCode. Source: $Source Target: $Destination"
  }
}

function Stop-BackendProcesses {
  param(
    [string]$BackendDir,
    [int]$Port
  )

  $stoppedAny = $false
  $escapedBackend = [Regex]::Escape(($BackendDir -replace '\\', '\\'))

  $nodeProcesses = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue
  foreach ($proc in $nodeProcesses) {
    $cmd = $proc.CommandLine
    if (-not $cmd) {
      continue
    }
    if ($cmd -match $escapedBackend) {
      try {
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
        Write-Ok "Stopped node process PID=$($proc.ProcessId) linked to target backend."
        $stoppedAny = $true
      } catch {
        Write-WarnMsg "Failed to stop PID=$($proc.ProcessId): $($_.Exception.Message)"
      }
    }
  }

  $portOwners = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($portPid in $portOwners) {
    try {
      if ($portPid -and (Get-Process -Id $portPid -ErrorAction SilentlyContinue)) {
        Stop-Process -Id $portPid -Force -ErrorAction Stop
        Write-Ok "Stopped process PID=$portPid listening on port $Port."
        $stoppedAny = $true
      }
    } catch {
      Write-WarnMsg "Failed to stop PID=$portPid on port ${Port}: $($_.Exception.Message)"
    }
  }

  if (-not $stoppedAny) {
    Write-WarnMsg "No running backend process was detected."
  }
}

$sourceRoot = $PSScriptRoot
$sourceBackend = Join-Path $sourceRoot 'backend'
$sourceFrontend = Join-Path $sourceRoot 'frontend'
$sourceQuickStart = Join-Path $sourceRoot 'quick-start.bat'
$sourceReadme = Join-Path $sourceRoot 'README.txt'

$targetRootResolved = [System.IO.Path]::GetFullPath($TargetRoot)
$targetBackend = Join-Path $targetRootResolved 'backend'
$targetFrontend = Join-Path $targetRootResolved 'frontend'
$targetBackendFrontend = Join-Path $targetBackend 'frontend'
$backupRoot = Join-Path $targetRootResolved '_upgrade_backups'
$backupStamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupDir = Join-Path $backupRoot $backupStamp

Write-Host ""
Write-Host "Vue Element Plus Admin - Target Upgrade" -ForegroundColor White
Write-Host "Source : $sourceRoot"
Write-Host "Target : $targetRootResolved"
Write-Host ""

function Test-SamePath {
  param(
    [string]$A,
    [string]$B
  )
  return [string]::Equals(
    [System.IO.Path]::GetFullPath($A).TrimEnd('\'),
    [System.IO.Path]::GetFullPath($B).TrimEnd('\'),
    [System.StringComparison]::OrdinalIgnoreCase
  )
}

if (-not (Test-Path $sourceBackend)) {
  throw "Source backend not found: $sourceBackend"
}
if (-not (Test-Path $sourceFrontend)) {
  throw "Source frontend not found: $sourceFrontend"
}

if (-not (Test-Path $targetRootResolved)) {
  throw "Target root does not exist: $targetRootResolved"
}

Write-Step "Stopping backend process (path + port 3002)."
Stop-BackendProcesses -BackendDir $targetBackend -Port 3002

Write-Step "Preparing backup directory."
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$preserveList = @(
  'backend\uploads',
  'backend\archives',
  'backend\config.json',
  'backend\app.db',
  'backend\data.db',
  'backend\db.sqlite'
)

foreach ($relativePath in $preserveList) {
  $srcPath = Join-Path $targetRootResolved $relativePath
  if (Test-Path $srcPath) {
    $dstPath = Join-Path $backupDir $relativePath
    $dstParent = Split-Path -Parent $dstPath
    New-Item -ItemType Directory -Path $dstParent -Force | Out-Null
    Copy-Item -Path $srcPath -Destination $dstPath -Recurse -Force
  }
}
Write-Ok "Backup saved to $backupDir"

$sameBackend = Test-SamePath -A $sourceBackend -B $targetBackend
$sameFrontend = Test-SamePath -A $sourceFrontend -B $targetFrontend

if ($sameBackend) {
  Write-WarnMsg "Source backend and target backend are the same path. Skipping backend self-copy."
} else {
  Write-Step "Copying backend code (keeping runtime data folders/files)."
  New-Item -ItemType Directory -Path $targetBackend -Force | Out-Null
  Invoke-RobocopySafe -Source $sourceBackend -Destination $targetBackend -Args @(
    '/E', '/R:2', '/W:1', '/NFL', '/NDL', '/NP',
    '/XD', 'node_modules', 'uploads', 'archives', 'frontend',
    '/XF', 'config.json', 'app.db', 'data.db', 'db.sqlite', '*.log'
  )
  Write-Ok "Backend code synced."
}

if ($sameFrontend) {
  Write-WarnMsg "Source frontend and target frontend are the same path. Skipping top-level frontend self-copy."
} else {
  Write-Step "Copying top-level frontend package."
  New-Item -ItemType Directory -Path $targetFrontend -Force | Out-Null
  Invoke-RobocopySafe -Source $sourceFrontend -Destination $targetFrontend -Args @('/E', '/R:2', '/W:1', '/NFL', '/NDL', '/NP')
  Write-Ok "Top-level frontend synced."
}

Write-Step "Replacing backend/frontend (this is what app.js actually serves)."
if (Test-Path $targetBackendFrontend) {
  Remove-Item -Path $targetBackendFrontend -Recurse -Force
}
Copy-Item -Path $sourceFrontend -Destination $targetBackendFrontend -Recurse -Force
Write-Ok "backend/frontend replaced."

if (Test-Path $sourceQuickStart) {
  $targetQuickStart = Join-Path $targetRootResolved 'quick-start.bat'
  if (-not (Test-SamePath -A $sourceQuickStart -B $targetQuickStart)) {
    Copy-Item -Path $sourceQuickStart -Destination $targetQuickStart -Force
  }
}
if (Test-Path $sourceReadme) {
  $targetReadme = Join-Path $targetRootResolved 'README.txt'
  if (-not (Test-SamePath -A $sourceReadme -B $targetReadme)) {
    Copy-Item -Path $sourceReadme -Destination $targetReadme -Force
  }
}

if ($NoStart) {
  Write-WarnMsg "Upgrade completed. Backend was not restarted because -NoStart was specified."
  exit 0
}

$startScript = Join-Path $targetBackend 'start.bat'
if (Test-Path $startScript) {
  Write-Step "Starting backend via start.bat in a new window."
  Start-Process -FilePath $startScript -WorkingDirectory $targetBackend | Out-Null
  Write-Ok "Backend start command launched."
} else {
  Write-WarnMsg "start.bat not found: $startScript"
  Write-WarnMsg "Please start backend manually."
}

Write-Host ""
Write-Host "Upgrade finished." -ForegroundColor Green
Write-Host "If browser still shows old page, force refresh with Ctrl+F5." -ForegroundColor Yellow
