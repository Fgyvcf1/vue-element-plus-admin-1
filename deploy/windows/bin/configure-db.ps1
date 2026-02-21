$ErrorActionPreference = 'Stop'

param(
  [Parameter(Mandatory = $true)]
  [string]$AppConfig,
  [string]$AdminConfig,
  [string]$InitSqlDir
)

$serviceName = 'VueElementPlusAdminDB'

function Read-JsonFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    return $null
  }
  $raw = Get-Content -Path $Path -Raw -ErrorAction Stop
  return $raw | ConvertFrom-Json
}

function Write-JsonFile {
  param([string]$Path, [hashtable]$Data)
  $json = $Data | ConvertTo-Json -Depth 5
  Set-Content -Path $Path -Value $json -Encoding UTF8
}

function Escape-SqlString {
  param([string]$Value)
  if ($null -eq $Value) { return '' }
  return $Value.Replace("'", "''")
}

function Test-PortInUse {
  param([int]$Port)
  $listeners = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners()
  return ($listeners | Where-Object { $_.Port -eq $Port }).Count -gt 0
}

function Find-FreePort {
  param([int]$StartPort, [int]$MaxAttempts = 50)
  for ($i = 0; $i -lt $MaxAttempts; $i++) {
    $port = $StartPort + $i
    if (-not (Test-PortInUse -Port $port)) {
      return $port
    }
  }
  return $StartPort
}

function Test-TcpPort {
  param([string]$TargetHost, [int]$Port)
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
  param([string]$MariaDbDir, [string]$DataDir)
  if (-not (Test-Path $MariaDbDir)) { return }
  if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir | Out-Null
  }
  $mysqlDir = Join-Path $DataDir 'mysql'
  if (Test-Path $mysqlDir) { return }

  $installDb = Join-Path $MariaDbDir 'bin\mariadb-install-db.exe'
  $mysqld = Join-Path $MariaDbDir 'bin\mysqld.exe'
  if (Test-Path $installDb) {
    & $installDb "--basedir=$MariaDbDir" "--datadir=$DataDir" | Out-Null
  } elseif (Test-Path $mysqld) {
    & $mysqld "--initialize-insecure" "--basedir=$MariaDbDir" "--datadir=$DataDir" | Out-Null
  }
}

function Write-MariaDbIni {
  param([string]$IniPath, [string]$MariaDbDir, [string]$DataDir, [int]$Port)
  $content = @"
[mysqld]
basedir=$MariaDbDir
datadir=$DataDir
port=$Port
bind-address=127.0.0.1
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
skip-name-resolve

[client]
port=$Port
default-character-set=utf8mb4
"@
  Set-Content -Path $IniPath -Value $content -Encoding UTF8
}

function Ensure-MariaDbService {
  param([string]$ServiceName, [string]$MariaDbDir, [string]$IniPath, [int]$Port)
  $mysqld = Join-Path $MariaDbDir 'bin\mysqld.exe'
  if (-not (Test-Path $mysqld)) { return $false }

  $existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
  if ($existing) {
    try {
      if ($existing.Status -ne 'Stopped') { Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue }
    } catch { }
    & $mysqld --remove $ServiceName | Out-Null
  }

  & $mysqld --install $ServiceName --defaults-file="$IniPath" | Out-Null
  & sc.exe config $ServiceName start= auto | Out-Null
  Start-Service -Name $ServiceName -ErrorAction SilentlyContinue | Out-Null

  for ($i = 0; $i -lt 30; $i++) {
    if (Test-TcpPort -TargetHost '127.0.0.1' -Port $Port) { return $true }
    Start-Sleep -Seconds 1
  }
  return $false
}

$app = Read-JsonFile -Path $AppConfig
if (-not $app) {
  Write-Host "App config not found: $AppConfig"
  exit 0
}

$appHost = $app.host
if (-not $appHost) { $appHost = 'localhost' }
$appPort = $app.port
if (-not $appPort) { $appPort = 3306 }
$appPort = [int]$appPort

$admin = $null
if ($AdminConfig -and (Test-Path $AdminConfig)) {
  $admin = Read-JsonFile -Path $AdminConfig
}

$appRoot = Resolve-Path (Join-Path (Split-Path -Parent $AppConfig) '..')
$mariadbDir = Join-Path $appRoot 'mariadb'
$dataDir = Join-Path (Split-Path -Parent $AppConfig) 'mariadb-data'

$isLocalHost = ($appHost -eq 'localhost' -or $appHost -eq '127.0.0.1')

if ($isLocalHost -and (Test-Path $mariadbDir)) {
  if (Test-PortInUse -Port $appPort) {
    $newPort = Find-FreePort -StartPort $appPort
    if ($newPort -ne $appPort) {
      Write-Host "Port $appPort is in use. Switching to $newPort."
      $appPort = $newPort
    }
  }
}

$appData = @{
  host = $appHost
  user = $app.user
  password = $app.password
  database = $app.database
  port = $appPort
}
Write-JsonFile -Path $AppConfig -Data $appData

if ($admin) {
  if (-not $admin.host) { $admin.host = $appHost }
  $admin.port = $appPort
  Write-JsonFile -Path $AdminConfig -Data @{
    host = $admin.host
    port = $admin.port
    user = $admin.user
    password = $admin.password
  }
}

$mysqlCmd = (Get-Command mysql -ErrorAction SilentlyContinue).Source
if (-not $mysqlCmd -and (Test-Path (Join-Path $mariadbDir 'bin\mysql.exe'))) {
  $mysqlCmd = Join-Path $mariadbDir 'bin\mysql.exe'
}

if ($isLocalHost -and (Test-Path $mariadbDir)) {
  Ensure-DataDirInitialized -MariaDbDir $mariadbDir -DataDir $dataDir
  $iniPath = Join-Path $dataDir 'mariadb.ini'
  Write-MariaDbIni -IniPath $iniPath -MariaDbDir $mariadbDir -DataDir $dataDir -Port $appPort
  $serviceReady = Ensure-MariaDbService -ServiceName $serviceName -MariaDbDir $mariadbDir -IniPath $iniPath -Port $appPort
  if (-not $serviceReady) {
    Write-Host "MariaDB service did not become ready on port $appPort"
  }
}

if (-not $admin) {
  Write-Host "Admin config not provided; skip DB initialization."
  exit 0
}

if (-not $mysqlCmd) {
  Write-Host "mysql client not found; skip DB initialization."
  exit 0
}

$dbName = Escape-SqlString $appData.database
$appUser = Escape-SqlString $appData.user
$appPass = Escape-SqlString $appData.password

$adminHost = $admin.host
$adminPort = $admin.port
if (-not $adminHost) { $adminHost = $appHost }
if (-not $adminPort) { $adminPort = $appPort }

$sql = @"
CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$appUser'@'%' IDENTIFIED BY '$appPass';
CREATE USER IF NOT EXISTS '$appUser'@'localhost' IDENTIFIED BY '$appPass';
ALTER USER '$appUser'@'%' IDENTIFIED BY '$appPass';
ALTER USER '$appUser'@'localhost' IDENTIFIED BY '$appPass';
GRANT ALL PRIVILEGES ON `$dbName`.* TO '$appUser'@'%';
GRANT ALL PRIVILEGES ON `$dbName`.* TO '$appUser'@'localhost';
FLUSH PRIVILEGES;
"@

$tmpFile = New-TemporaryFile
try {
  Set-Content -Path $tmpFile.FullName -Value $sql -Encoding UTF8

  $args = @(
    "--host=$adminHost",
    "--port=$adminPort",
    "--user=$($admin.user)",
    "--password=$($admin.password)",
    "--protocol=TCP",
    "--default-character-set=utf8mb4"
  )

  & $mysqlCmd @args < $tmpFile.FullName | Out-Null
  Write-Host "Database initialized successfully."

  if ($InitSqlDir -and (Test-Path $InitSqlDir)) {
    $sqlFiles = Get-ChildItem -Path $InitSqlDir -Filter '*.sql' -File | Sort-Object Name
    foreach ($file in $sqlFiles) {
      Write-Host "Importing $($file.Name)..."
      $importArgs = $args + @("--database=$dbName")
      & $mysqlCmd @importArgs < $file.FullName | Out-Null
    }
    Write-Host "SQL import completed."
  }
} catch {
  Write-Host "Database initialization failed: $($_.Exception.Message)"
} finally {
  if (Test-Path $tmpFile.FullName) {
    Remove-Item $tmpFile.FullName -Force -ErrorAction SilentlyContinue
  }
  if ($AdminConfig -and (Test-Path $AdminConfig)) {
    Remove-Item $AdminConfig -Force -ErrorAction SilentlyContinue
  }
}
