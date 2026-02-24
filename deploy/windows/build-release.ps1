param(
  [ValidateSet('pro', 'dev', 'test', 'gitee')]
  [string]$Mode = 'pro',
  [string]$FrontendDir = '',
  [string]$MariaDbDir = '',
  [string]$NodeRuntimeDir = '',
  [ValidateSet('isolated', 'hoisted', 'pnp')]
  [string]$NodeLinker = 'hoisted',
  [switch]$SkipFrontendBuild,
  [switch]$SkipBackendInstall,
  [switch]$UseBackendNodeModules
)

$ErrorActionPreference = 'Stop'

function Get-EnvValue {
  param(
    [string]$FilePath,
    [string]$Key
  )
  if (-not (Test-Path $FilePath)) {
    return $null
  }
  $line = Get-Content $FilePath | Where-Object { $_ -match "^\s*$Key=" } | Select-Object -First 1
  if (-not $line) {
    return $null
  }
  return ($line -split '=', 2)[1].Trim()
}

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$releaseDir = Join-Path $root 'release'
$appDir = Join-Path $releaseDir 'app'
$backendSrc = Join-Path $root 'backend'
$envFile = Join-Path $root (".env.$Mode")

Write-Host 'Generating sys_menu seed from routes...'
$seedScript = Join-Path $root 'scripts\generate-sys-menu-seed.cjs'
if (Test-Path $seedScript) {
  & node $seedScript
} else {
  Write-Host "Seed script not found: $seedScript"
}

if (-not $SkipFrontendBuild) {
  Write-Host "Building frontend (mode: $Mode)..."
  & pnpm ("build:$Mode")
}

if (-not $FrontendDir) {
  $outDir = Get-EnvValue -FilePath $envFile -Key 'VITE_OUT_DIR'
  if ($outDir) {
    $FrontendDir = Join-Path $root $outDir
  }
}

if (-not $FrontendDir -or -not (Test-Path $FrontendDir)) {
  throw "Frontend output not found. Provide -FrontendDir or check .env.$Mode."
}
$frontendIndex = Join-Path $FrontendDir 'index.html'
if (-not (Test-Path $frontendIndex)) {
  throw "Frontend index.html not found in $FrontendDir. Run pnpm run build:$Mode or set -FrontendDir."
}

if (Test-Path $appDir) {
  try {
    Remove-Item $appDir -Recurse -Force -ErrorAction Stop
  } catch {
    $backupDir = Join-Path $releaseDir ("app_old_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
    try {
      Rename-Item -Path $appDir -NewName $backupDir -ErrorAction Stop
      Write-Warning "Existing app directory was locked. Renamed to $backupDir."
    } catch {
      Write-Warning "Failed to remove or rename $appDir. Reusing existing directory: $($_.Exception.Message)"
    }
  }
}
New-Item -ItemType Directory -Path $appDir -Force | Out-Null

Write-Host 'Staging backend...'
$backendDest = Join-Path $appDir 'backend'
robocopy $backendSrc $backendDest /E /XD node_modules .git /XF *.log | Out-Null
if ($LASTEXITCODE -ge 8) {
  throw "Robocopy failed with exit code $LASTEXITCODE"
}

$configExample = Join-Path $backendDest 'config.example.json'
$configTarget = Join-Path $backendDest 'config.json'
if ((Test-Path $configExample) -and -not (Test-Path $configTarget)) {
  Copy-Item $configExample $configTarget
}

Write-Host 'Staging frontend...'
$frontendDest = Join-Path $backendDest 'frontend'
robocopy $FrontendDir $frontendDest /E | Out-Null
if ($LASTEXITCODE -ge 8) {
  throw "Robocopy failed with exit code $LASTEXITCODE"
}
$stagedFrontendIndex = Join-Path $frontendDest 'index.html'
if (-not (Test-Path $stagedFrontendIndex)) {
  throw "Staged frontend index.html missing at $stagedFrontendIndex. Check frontend build output."
}

if (-not $SkipBackendInstall) {
  if ($UseBackendNodeModules) {
    $sourceModules = Join-Path $backendSrc 'node_modules'
    $destModules = Join-Path $backendDest 'node_modules'
    if (Test-Path $sourceModules) {
      Write-Host 'Copying backend node_modules from source...'
      robocopy $sourceModules $destModules /E | Out-Null
      if ($LASTEXITCODE -ge 8) {
        throw "Robocopy failed with exit code $LASTEXITCODE"
      }
    } else {
      Write-Host 'Source backend node_modules not found. Falling back to pnpm install...'
      & pnpm -C $backendDest install --prod --node-linker $NodeLinker
    }
  } else {
    Write-Host 'Installing backend production dependencies (pnpm)...'
    & pnpm -C $backendDest install --prod --node-linker $NodeLinker
  }
}

if ($MariaDbDir) {
  if (-not (Test-Path $MariaDbDir)) {
    throw "MariaDB directory not found: $MariaDbDir"
  }
  Write-Host "Staging MariaDB runtime from $MariaDbDir..."
  $mariadbDest = Join-Path $appDir 'mariadb'
  robocopy $MariaDbDir $mariadbDest /E | Out-Null
  if ($LASTEXITCODE -ge 8) {
    throw "Robocopy failed with exit code $LASTEXITCODE"
  }
} else {
  Write-Host 'MariaDB runtime not staged. Add -MariaDbDir to bundle MariaDB.'
}

Write-Host 'Staging installer scripts...'
$binSrc = Join-Path $PSScriptRoot 'bin'
$binDest = Join-Path $appDir 'bin'
robocopy $binSrc $binDest /E | Out-Null
if ($LASTEXITCODE -ge 8) {
  throw "Robocopy failed with exit code $LASTEXITCODE"
}

if ($NodeRuntimeDir) {
  Write-Host "Staging Node runtime from $NodeRuntimeDir..."
  $nodeExe = Join-Path $NodeRuntimeDir 'node.exe'
  if (-not (Test-Path $nodeExe)) {
    throw "Node runtime not found: node.exe missing in $NodeRuntimeDir"
  }
  $runtimeDest = Join-Path $appDir 'runtime'
  robocopy $NodeRuntimeDir $runtimeDest /E | Out-Null
  if ($LASTEXITCODE -ge 8) {
    throw "Robocopy failed with exit code $LASTEXITCODE"
  }
} else {
  Write-Host 'NOTE: Node runtime not staged. Add -NodeRuntimeDir to bundle node.exe.'
  Write-Host 'If deploying to a machine without Node.js installed, please provide a Node runtime directory.'
  # Create a placeholder file to indicate that runtime is intentionally empty
  $placeholderFile = Join-Path $appDir 'runtime\NODE_RUNTIME_REQUIRED.txt'
  $readmeFile = Join-Path $appDir 'runtime\README.txt'
  New-Item -ItemType Directory -Path (Split-Path $placeholderFile -Parent) -Force | Out-Null
  
  Set-Content -Path $placeholderFile -Value @"
This application requires Node.js to be installed on the target machine.
Either install Node.js on the target machine, or rerun this script with the -NodeRuntimeDir parameter
to bundle a Node.js runtime with the application.
"@

  Set-Content -Path $readmeFile -Value @"
Vue Element Plus Admin - Runtime Directory

This directory is intended to hold the Node.js runtime environment.

Two deployment options:
1. Install Node.js on the target machine (recommended for development)
2. Bundle Node.js runtime with the application (recommended for end-user distribution)

To bundle Node.js runtime:
- Download a portable Node.js runtime
- Re-run the build script with -NodeRuntimeDir parameter:
  powershell -ExecutionPolicy Bypass -File build-release.ps1 -NodeRuntimeDir ""C:\path\to\nodejs\"
"@
}

Write-Host "Release staged at $appDir"
