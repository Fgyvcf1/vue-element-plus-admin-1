$ErrorActionPreference = 'Stop'

function Test-TcpPort {
  param(
    [string]$TargetHost,
    [int]$Port
  )
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $client.Connect($TargetHost, $Port)
    $client.Close()
    return $true
  } catch {
    return $false
  }
}

function Ensure-DataDirInitialized {
  param(
    [string]$MariaDbDir,
    [string]$DataDir
  )
  if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir | Out-Null
  }

  $mysqlDir = Join-Path $DataDir 'mysql'
  if (Test-Path $mysqlDir) {
    return
  }

  $installDb = Join-Path $MariaDbDir 'bin\mariadb-install-db.exe'
  $mysqld = Join-Path $MariaDbDir 'bin\mysqld.exe'

  if (Test-Path $installDb) {
    & $installDb "--datadir=$DataDir" | Out-Null
    return
  }

  if (Test-Path $mysqld) {
    & $mysqld "--initialize-insecure" "--basedir=$MariaDbDir" "--datadir=$DataDir" | Out-Null
  }
}

function Start-MariaDbIfNeeded {
  param(
    [string]$MariaDbDir,
    [string]$DataDir,
    [int]$Port
  )

  if (-not (Test-Path $MariaDbDir)) {
    return $null
  }

  if (Test-TcpPort -TargetHost '127.0.0.1' -Port $Port) {
    return $null
  }

  Ensure-DataDirInitialized -MariaDbDir $MariaDbDir -DataDir $DataDir

  $mysqld = Join-Path $MariaDbDir 'bin\mysqld.exe'
  if (-not (Test-Path $mysqld)) {
    return $null
  }

  $args = @(
    "--basedir=$MariaDbDir",
    "--datadir=$DataDir",
    "--port=$Port",
    "--bind-address=127.0.0.1",
    "--skip-networking=0"
  )

  return Start-Process -FilePath $mysqld -ArgumentList $args -WorkingDirectory $MariaDbDir -WindowStyle Hidden -PassThru
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$appDir = Resolve-Path (Join-Path $scriptDir '..')
$backendDir = Join-Path $appDir 'backend'
$configPath = Join-Path $backendDir 'config.json'
$nodeExe = Join-Path $appDir 'runtime\node.exe'

if (-not (Test-Path $nodeExe)) {
  $nodeExe = 'node'
}

if (-not $env:PORT) {
  $env:PORT = '3001'
}
if (-not $env:FRONTEND_DIR) {
  $env:FRONTEND_DIR = Join-Path $backendDir 'frontend'
}

$dbHost = 'localhost'
$dbPort = 3306
if (Test-Path $configPath) {
  try {
    $cfg = Get-Content -Path $configPath -Raw | ConvertFrom-Json
    if ($cfg.host) { $dbHost = $cfg.host }
    if ($cfg.port) { $dbPort = [int]$cfg.port }
  } catch {
    Write-Host "Failed to read config.json: $($_.Exception.Message)"
  }
}

$mariadbDir = Join-Path $appDir 'mariadb'
$dataDir = Join-Path $backendDir 'mariadb-data'
$serviceName = 'VueElementPlusAdminDB'

$mariadbProcess = $null
$startedMariaDb = $false

if ($dbHost -eq 'localhost' -or $dbHost -eq '127.0.0.1') {
  $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
  if ($service) {
    try {
      if ($service.Status -ne 'Running') {
        Start-Service -Name $serviceName -ErrorAction SilentlyContinue | Out-Null
      }
    } catch {
    }
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
      if (Test-TcpPort -TargetHost '127.0.0.1' -Port $dbPort) {
        $ready = $true
        break
      }
      Start-Sleep -Seconds 1
    }
    if (-not $ready) {
      Write-Host "MariaDB service did not become ready on port $dbPort"
    }
  } else {
    $mariadbProcess = Start-MariaDbIfNeeded -MariaDbDir $mariadbDir -DataDir $dataDir -Port $dbPort
    if ($mariadbProcess) {
      $startedMariaDb = $true
      $ready = $false
      for ($i = 0; $i -lt 30; $i++) {
        if (Test-TcpPort -TargetHost '127.0.0.1' -Port $dbPort) {
          $ready = $true
          break
        }
        Start-Sleep -Seconds 1
      }
      if (-not $ready) {
        Write-Host "MariaDB did not become ready on port $dbPort"
      }
    }
  }
}

try {
  Push-Location $backendDir
  & $nodeExe app.js
} finally {
  Pop-Location
  if ($startedMariaDb -and $mariadbProcess) {
    try {
      Stop-Process -Id $mariadbProcess.Id -Force -ErrorAction SilentlyContinue
    } catch {
    }
  }
}
