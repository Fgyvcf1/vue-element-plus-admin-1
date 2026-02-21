param(
  [ValidateSet('pro', 'dev', 'test', 'gitee')]
  [string]$Mode = 'pro',
  [string]$FrontendDir = '',
  [string]$MariaDbDir = '',
  [string]$NodeRuntimeDir = '',
  [ValidateSet('isolated', 'hoisted', 'pnp')]
  [string]$NodeLinker = 'hoisted',
  [switch]$SkipFrontendBuild,
  [switch]$SkipBackendInstall
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

if (Test-Path $appDir) {
  Remove-Item $appDir -Recurse -Force
}
New-Item -ItemType Directory -Path $appDir | Out-Null

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

if (-not $SkipBackendInstall) {
  Write-Host 'Installing backend production dependencies (pnpm)...'
  & pnpm -C $backendDest install --prod --node-linker $NodeLinker
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
  $runtimeDest = Join-Path $appDir 'runtime'
  robocopy $NodeRuntimeDir $runtimeDest /E | Out-Null
  if ($LASTEXITCODE -ge 8) {
    throw "Robocopy failed with exit code $LASTEXITCODE"
  }
} else {
  Write-Host 'Node runtime not staged. Add -NodeRuntimeDir to bundle node.exe.'
}

Write-Host "Release staged at $appDir"
