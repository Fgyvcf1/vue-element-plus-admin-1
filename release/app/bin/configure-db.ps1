param(
  [Parameter(Mandatory = $true)]
  [string]$AppConfig,
  [string]$AdminConfig,
  [string]$InitSqlDir
)

$ErrorActionPreference = 'Stop'
$OutputEncoding = [System.Text.Encoding]::UTF8

$serviceName = 'VueElementPlusAdminDB'
$logPath = Join-Path (Split-Path -Parent $AppConfig) 'install-db.log'

function Write-Log {
  param([string]$Message)
  $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  $line = "[$timestamp] $Message"
  try {
    Add-Content -Path $logPath -Value $line -Encoding UTF8
  } catch {
  }
  Write-Host $Message
}

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
  [System.IO.File]::WriteAllText($Path, $json, (New-Object System.Text.UTF8Encoding($false)))
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
  $installCode = $null
  if (Test-Path $installDb) {
    Write-Log "Initializing MariaDB data dir with mariadb-install-db..."
    $installDir = Split-Path -Parent $installDb
    Push-Location $installDir
    try {
      & $installDb "--datadir=$DataDir" | Out-Null
      $installCode = $LASTEXITCODE
    } finally {
      Pop-Location
    }
    Write-Log "mariadb-install-db exit code: $installCode"
    if ($installCode -eq 0) { return }
    Write-Log "mariadb-install-db failed. Falling back to mysqld --initialize-insecure..."
  }

  if (Test-Path $mysqld) {
    Write-Log "Initializing MariaDB data dir with mysqld --initialize-insecure..."
    & $mysqld "--initialize-insecure" "--basedir=$MariaDbDir" "--datadir=$DataDir" | Out-Null
    Write-Log "mysqld initialize exit code: $LASTEXITCODE"
  }
}

function Write-MariaDbIni {
  param([string]$IniPath, [string]$MariaDbDir, [string]$DataDir, [int]$Port)
  $normalizedBase = $MariaDbDir -replace '\\', '/'
  $normalizedData = $DataDir -replace '\\', '/'
  $content = @"
[mysqld]
basedir=$normalizedBase
datadir=$normalizedData
port=$Port
bind-address=127.0.0.1
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

[client]
port=$Port
default-character-set=utf8mb4
"@
  # Write without BOM to avoid MariaDB "option without preceding group" errors.
  Set-Content -Path $IniPath -Value $content -Encoding ASCII
}

function Ensure-MariaDbService {
  param([string]$ServiceName, [string]$MariaDbDir, [string]$IniPath, [int]$Port)
  $mysqld = Join-Path $MariaDbDir 'bin\mysqld.exe'
  if (-not (Test-Path $mysqld)) {
    Write-Log "MariaDB server not found: $mysqld"
    return $false
  }

  $existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
  if ($existing) {
    try {
      if ($existing.Status -ne 'Stopped') { Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue }
    } catch { }
    & $mysqld --remove $ServiceName | Out-Null
    Write-Log "Removed existing MariaDB service $ServiceName. Exit code: $LASTEXITCODE"
  }

  & $mysqld --install $ServiceName --defaults-file="$IniPath" | Out-Null
  Write-Log "Installed MariaDB service $ServiceName. Exit code: $LASTEXITCODE"
  & sc.exe config $ServiceName start= auto | Out-Null
  Start-Service -Name $ServiceName -ErrorAction SilentlyContinue | Out-Null

  for ($i = 0; $i -lt 90; $i++) {
    if (Test-TcpPort -TargetHost '127.0.0.1' -Port $Port) { return $true }
    Start-Sleep -Seconds 1
  }
  return $false
}

$app = Read-JsonFile -Path $AppConfig
if (-not $app) {
  Write-Log "App config not found: $AppConfig"
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
$templateDir = Join-Path (Split-Path -Parent $AppConfig) 'mariadb-data-template'
$usedTemplate = $false
$skipAdminInit = $false

$isLocalHost = ($appHost -eq 'localhost' -or $appHost -eq '127.0.0.1')

if ($isLocalHost -and (Test-Path $mariadbDir)) {
  if (Test-Path $templateDir) {
    $mysqlDir = Join-Path $dataDir 'mysql'
    if (-not (Test-Path $mysqlDir)) {
      Write-Log "Copying MariaDB data template from $templateDir to $dataDir..."
      if (-not (Test-Path $dataDir)) {
        New-Item -ItemType Directory -Path $dataDir | Out-Null
      }
      robocopy $templateDir $dataDir /E | Out-Null
      if ($LASTEXITCODE -ge 8) {
        Write-Log "Robocopy data template failed with exit code $LASTEXITCODE"
      } else {
        $usedTemplate = $true
      }
    }
  }

  if (Test-PortInUse -Port $appPort) {
    $newPort = Find-FreePort -StartPort $appPort
    if ($newPort -ne $appPort) {
      Write-Log "Port $appPort is in use. Switching to $newPort."
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
  if (-not $admin.user) { $admin.user = 'root' }
  Write-JsonFile -Path $AdminConfig -Data @{
    host = $admin.host
    port = $admin.port
    user = $admin.user
    password = $admin.password
  }
}

$mysqlCmd = $null
if (Test-Path (Join-Path $mariadbDir 'bin\mysql.exe')) {
  $mysqlCmd = Join-Path $mariadbDir 'bin\mysql.exe'
} else {
  $mysqlCmd = (Get-Command mysql -ErrorAction SilentlyContinue).Source
}

if ($isLocalHost -and (Test-Path $mariadbDir)) {
  Write-Log "Preparing bundled MariaDB at $mariadbDir"
  Ensure-DataDirInitialized -MariaDbDir $mariadbDir -DataDir $dataDir
  $iniPath = Join-Path $dataDir 'mariadb.ini'
  Write-MariaDbIni -IniPath $iniPath -MariaDbDir $mariadbDir -DataDir $dataDir -Port $appPort
  $serviceReady = Ensure-MariaDbService -ServiceName $serviceName -MariaDbDir $mariadbDir -IniPath $iniPath -Port $appPort
  if (-not $serviceReady) {
    Write-Log "MariaDB service did not become ready on port $appPort"
  }
}

if (-not $admin) {
  if ($usedTemplate) {
    Write-Log "MariaDB data template detected; skip admin initialization."
    $skipAdminInit = $true
    $admin = [pscustomobject]@{
      host = $appHost
      port = $appPort
      user = 'root'
      password = ''
    }
  } elseif ($isLocalHost -and (Test-Path $mariadbDir)) {
    Write-Log "Admin config not provided; attempting local init with root/empty password."
    $admin = [pscustomobject]@{
      host = $appHost
      port = $appPort
      user = 'root'
      password = ''
    }
  } else {
    Write-Log "Admin config not provided; skip DB initialization."
    exit 0
  }
}

if (-not $mysqlCmd) {
  Write-Log "mysql client not found; skip DB initialization."
  exit 0
}

$dbName = Escape-SqlString $appData.database
$appUser = Escape-SqlString $appData.user
$appPass = Escape-SqlString $appData.password

$adminHost = $admin.host
$adminPort = $admin.port
if (-not $adminHost) { $adminHost = $appHost }
if (-not $adminPort) { $adminPort = $appPort }
if ($null -eq $admin.password) { $admin.password = '' }

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

function Invoke-MySql {
  param(
    [string[]]$Args,
    [string]$SqlText,
    [string]$Label
  )
  $tmpFile = New-TemporaryFile
  $outFile = New-TemporaryFile
  $errFile = New-TemporaryFile
  try {
    [System.IO.File]::WriteAllText($tmpFile.FullName, $SqlText, (New-Object System.Text.UTF8Encoding($false)))
    $process = Start-Process -FilePath $mysqlCmd -ArgumentList $Args -NoNewWindow -Wait -PassThru `
      -RedirectStandardInput $tmpFile.FullName `
      -RedirectStandardOutput $outFile.FullName `
      -RedirectStandardError $errFile.FullName
    $code = $process.ExitCode
    $stdout = ''
    $stderr = ''
    if (Test-Path $outFile.FullName) {
      $stdout = Get-Content -Path $outFile.FullName -Raw -Encoding UTF8
    }
    if (Test-Path $errFile.FullName) {
      $stderr = Get-Content -Path $errFile.FullName -Raw -Encoding UTF8
    }
    if ($stdout) {
      Write-Log "$Label stdout: $stdout"
    }
    if ($stderr) {
      Write-Log "$Label stderr: $stderr"
    }
    Write-Log "$Label exit code: $code"
    return $code
  } finally {
    if (Test-Path $tmpFile.FullName) {
      Remove-Item $tmpFile.FullName -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path $outFile.FullName) {
      Remove-Item $outFile.FullName -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path $errFile.FullName) {
      Remove-Item $errFile.FullName -Force -ErrorAction SilentlyContinue
    }
  }
}

try {
  $mysqlArgs = $null
  if (-not $skipAdminInit) {
    $baseArgs = @(
      "--protocol=TCP",
      "--port=$adminPort",
      "--user=$($admin.user)",
      "--password=$($admin.password)",
      "--default-character-set=utf8mb4",
      "--binary-mode=1",
      "--connect-timeout=30"
    )

    $attempts = @()
    $attempts += ,(@("--host=$adminHost") + $baseArgs)
    if ($adminHost -ne 'localhost') {
      $attempts += ,(@("--host=localhost") + $baseArgs)
    }
    if ($adminHost -ne '127.0.0.1') {
      $attempts += ,(@("--host=127.0.0.1") + $baseArgs)
    }

    foreach ($candidate in $attempts) {
      $code = Invoke-MySql -Args $candidate -SqlText "SELECT 1;" -Label "MySQL connectivity check"
      if ($code -eq 0) {
        $mysqlArgs = $candidate
        break
      }
    }
  }

  if (-not $mysqlArgs) {
    if (-not $skipAdminInit) {
      Write-Log "Admin connection failed. Attempting to use app credentials for import."
    }
    $appArgs = @(
      "--protocol=TCP",
      "--port=$appPort",
      "--user=$($appData.user)",
      "--password=$($appData.password)",
      "--default-character-set=utf8mb4",
      "--binary-mode=1",
      "--connect-timeout=30"
    )
    $appAttempts = @()
    $appAttempts += ,(@("--host=$appHost") + $appArgs)
    if ($appHost -ne 'localhost') {
      $appAttempts += ,(@("--host=localhost") + $appArgs)
    }
    if ($appHost -ne '127.0.0.1') {
      $appAttempts += ,(@("--host=127.0.0.1") + $appArgs)
    }
    foreach ($candidate in $appAttempts) {
      $code = Invoke-MySql -Args $candidate -SqlText "SELECT 1;" -Label "App MySQL connectivity check"
      if ($code -eq 0) {
        $mysqlArgs = $candidate
        break
      }
    }
    if (-not $mysqlArgs) {
      Write-Log "No valid MySQL connection available; skip DB initialization."
      exit 0
    }
  }

  if (-not $skipAdminInit -and $mysqlArgs) {
    $initCode = Invoke-MySql -Args $mysqlArgs -SqlText $sql -Label "Database initialization"
    if ($initCode -ne 0) {
      Write-Log "Database initialization returned errors; continuing with schema import."
    } else {
      Write-Log "Database initialized successfully."
    }
  }

  if ($usedTemplate) {
    Write-Log "MariaDB data template detected; skipping SQL import."
  } elseif ($InitSqlDir -and (Test-Path $InitSqlDir)) {
    $sqlFiles = Get-ChildItem -Path $InitSqlDir -Filter '*.sql' -File | Where-Object {
      $_.Name -ne '010-seed-data.sql'
    }
    Write-Log "SQL import directory: $InitSqlDir (files: $($sqlFiles.Count))"
    $orderedSqlFiles = $sqlFiles | Sort-Object `
      @{ Expression = {
          $lower = $_.Name.ToLowerInvariant()
          if ($lower -match 'schema|ddl|structure') { 0 }
          elseif ($lower -match 'seed|data') { 2 }
          else { 1 }
        }
      }, `
      @{ Expression = { $_.Name.ToLowerInvariant() } }
    foreach ($file in $orderedSqlFiles) {
      Write-Log "Importing $($file.Name)..."
      $importArgs = $mysqlArgs + @("--database=$dbName")
      $importCode = Invoke-MySql -Args $importArgs -SqlText (Get-Content -Path $file.FullName -Raw -Encoding UTF8) -Label "Import $($file.Name)"
      if ($importCode -ne 0) {
        Write-Log "Import failed for $($file.Name)."
      }
    }
    Write-Log "SQL import completed."
  }

  $nodeExe = Join-Path $appRoot 'runtime\node.exe'
  if (-not (Test-Path $nodeExe)) {
    $nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
  }
  $initScript = Join-Path $appRoot 'backend\init-db.js'
  if ($nodeExe -and (Test-Path $initScript)) {
    Write-Log "Ensuring default roles/users..."
    & $nodeExe $initScript | Out-Null
    Write-Log "Init script exit code: $LASTEXITCODE"
  }

  $seedScript = Join-Path $appRoot 'backend\seed-data.js'
  if ($nodeExe -and (Test-Path $seedScript)) {
    Write-Log "Seeding dictionaries and menus..."
    & $nodeExe $seedScript | Out-Null
    Write-Log "Seed script exit code: $LASTEXITCODE"
  }
} catch {
  Write-Log "Database initialization failed: $($_.Exception.Message)"
} finally {
  if ($AdminConfig -and (Test-Path $AdminConfig)) {
    Remove-Item $AdminConfig -Force -ErrorAction SilentlyContinue
  }
}
