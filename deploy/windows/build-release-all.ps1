$ErrorActionPreference = 'Stop'

param(
  [ValidateSet('pro', 'dev', 'test', 'gitee')]
  [string]$Mode = 'pro',
  [string]$MariaDbDir = 'E:\mariadb-portable',
  [string]$NodeRuntimeDir = 'E:\node-portable\node-v24.13.1-win-x64',
  [bool]$UseBackendNodeModules = $true,
  [switch]$SkipFrontendBuild,
  [string]$IsccPath = 'C:\Program Files (x86)\Inno Setup 6\ISCC.exe'
)

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$buildScript = Join-Path $root 'deploy\windows\build-release.ps1'
$installerScript = Join-Path $root 'deploy\windows\installer.iss'
$vcRedist = Join-Path $PSScriptRoot 'redist\vc_redist.x64.exe'

if (-not (Test-Path $buildScript)) {
  throw "build-release.ps1 not found: $buildScript"
}
if (-not (Test-Path $installerScript)) {
  throw "installer.iss not found: $installerScript"
}
if (-not (Test-Path $IsccPath)) {
  throw "ISCC.exe not found: $IsccPath"
}

if ($MariaDbDir -and -not (Test-Path $MariaDbDir)) {
  Write-Warning "MariaDB portable dir not found: $MariaDbDir"
}
if ($NodeRuntimeDir -and -not (Test-Path $NodeRuntimeDir)) {
  Write-Warning "Node runtime dir not found: $NodeRuntimeDir"
}
if (-not (Test-Path $vcRedist)) {
  Write-Warning "vc_redist.x64.exe not found at $vcRedist (installer will skip VC++ runtime install)"
}

if ($UseBackendNodeModules) {
  $sourceModules = Join-Path $root 'backend\node_modules'
  if (-not (Test-Path $sourceModules)) {
    Write-Warning "backend\\node_modules not found. build-release will fall back to pnpm install."
  }
}

$env:PUPPETEER_SKIP_DOWNLOAD = '1'

$args = @(
  '-ExecutionPolicy', 'Bypass',
  '-File', $buildScript,
  '-Mode', $Mode
)
if ($SkipFrontendBuild) {
  $args += '-SkipFrontendBuild'
}
if ($MariaDbDir) {
  $args += @('-MariaDbDir', $MariaDbDir)
}
if ($NodeRuntimeDir) {
  $args += @('-NodeRuntimeDir', $NodeRuntimeDir)
}
$args += @('-UseBackendNodeModules', $UseBackendNodeModules)

Write-Host "Staging release (mode: $Mode)..."
& powershell @args

Write-Host 'Compiling installer...'
& $IsccPath $installerScript

Write-Host 'Done. Installer at release\installer\VueElementPlusAdmin-Setup.exe'
