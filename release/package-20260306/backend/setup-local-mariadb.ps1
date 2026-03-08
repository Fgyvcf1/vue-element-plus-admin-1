param(
  [string]$MysqlPath = ""
)

$ErrorActionPreference = "Stop"

function Read-Input([string]$prompt, [string]$defaultValue) {
  $value = Read-Host "$prompt (默认: $defaultValue)"
  if ([string]::IsNullOrWhiteSpace($value)) {
    return $defaultValue
  }
  return $value
}

function New-RandomString([int]$length) {
  $chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
  $bytes = New-Object byte[] $length
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $builder = New-Object System.Text.StringBuilder
  foreach ($b in $bytes) {
    [void]$builder.Append($chars[$b % $chars.Length])
  }
  return $builder.ToString()
}

function Resolve-MysqlExe([string]$overridePath) {
  if ($overridePath -and (Test-Path $overridePath)) {
    return (Resolve-Path $overridePath).Path
  }

  $cmd = Get-Command mysql.exe -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Path }

  $cmd = Get-Command mariadb.exe -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Path }

  $candidates = @(
    "D:\MariaDB\bin\mysql.exe",
    "C:\Program Files\MariaDB 10.6\bin\mysql.exe",
    "C:\Program Files\MariaDB 10.11\bin\mysql.exe"
  )
  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) { return $candidate }
  }

  return $null
}

function Escape-SqlLiteral([string]$value) {
  return $value.Replace("'", "''")
}

function Invoke-Mysql([string]$mysqlExe, [string[]]$args, [string]$sql) {
  & $mysqlExe @args -e $sql
  if ($LASTEXITCODE -ne 0) {
    throw "MariaDB 命令执行失败: $sql"
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlDir = Join-Path $scriptDir "sql"
$configPath = Join-Path $scriptDir "config.json"

$mysqlExe = Resolve-MysqlExe $MysqlPath
if (-not $mysqlExe) {
  $manualPath = Read-Host "未找到 mysql.exe，请输入完整路径"
  if ($manualPath -and (Test-Path $manualPath)) {
    $mysqlExe = (Resolve-Path $manualPath).Path
  } else {
    Write-Host "错误: 找不到 mysql.exe，终止。" -ForegroundColor Red
    exit 1
  }
}

$rootUser = Read-Input "请输入 MariaDB root 用户名" "root"
$rootPwdSecure = Read-Host "请输入 root 密码（可直接回车表示空）" -AsSecureString
$rootPwd = [System.Net.NetworkCredential]::new("", $rootPwdSecure).Password

$dbHost = Read-Input "请输入数据库地址" "localhost"
$dbPort = Read-Input "请输入数据库端口" "3306"
$dbName = Read-Input "请输入数据库名" "village"
$appUser = Read-Input "请输入业务数据库用户名" "app_user"

$appPassword = New-RandomString 20

if (Test-Path $configPath) {
  $overwrite = Read-Host "config.json 已存在，是否覆盖？(Y/N)"
  if ($overwrite -notin @("Y", "y", "Yes", "YES")) {
    Write-Host "已取消，未覆盖 config.json。"
    exit 0
  }
}

$bt = [char]96
$dbNameSafe = $dbName.Replace($bt, "$bt$bt")
$appUserSafe = Escape-SqlLiteral $appUser
$appPasswordSafe = Escape-SqlLiteral $appPassword

if ([string]::IsNullOrEmpty($rootPwd)) {
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
} else {
  $env:MYSQL_PWD = $rootPwd
}

$commonArgs = @("-u", $rootUser, "-h", $dbHost, "--port", $dbPort, "--default-character-set=utf8mb4")

try {
  Write-Host "正在创建数据库与账号..."
  Invoke-Mysql $mysqlExe $commonArgs "CREATE DATABASE IF NOT EXISTS ${bt}${dbNameSafe}${bt} DEFAULT CHARSET utf8mb4;"
  Invoke-Mysql $mysqlExe $commonArgs "CREATE USER IF NOT EXISTS '$appUserSafe'@'localhost' IDENTIFIED BY '$appPasswordSafe';"
  Invoke-Mysql $mysqlExe $commonArgs "CREATE USER IF NOT EXISTS '$appUserSafe'@'127.0.0.1' IDENTIFIED BY '$appPasswordSafe';"
  Invoke-Mysql $mysqlExe $commonArgs "GRANT ALL PRIVILEGES ON ${bt}${dbNameSafe}${bt}.* TO '$appUserSafe'@'localhost';"
  Invoke-Mysql $mysqlExe $commonArgs "GRANT ALL PRIVILEGES ON ${bt}${dbNameSafe}${bt}.* TO '$appUserSafe'@'127.0.0.1';"
  Invoke-Mysql $mysqlExe $commonArgs "FLUSH PRIVILEGES;"
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
} finally {
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
}

$import = Read-Host "是否导入初始化 SQL（推荐）？(Y/N)"
if ($import -in @("Y", "y", "Yes", "YES")) {
  $sqlFiles = @(
    "database-structure.sql",
    "_dict-seed-utf8.sql",
    "010-seed-data.sql",
    "020-default-users.sql"
  )
  foreach ($sqlFile in $sqlFiles) {
    $sqlPath = Join-Path $sqlDir $sqlFile
    if (Test-Path $sqlPath) {
      Write-Host "导入: $sqlPath"
      & $mysqlExe @commonArgs $dbName < $sqlPath
      if ($LASTEXITCODE -ne 0) {
        Write-Host "错误: 导入失败 $sqlPath" -ForegroundColor Red
        exit 1
      }
    } else {
      Write-Host "跳过，未找到: $sqlPath" -ForegroundColor Yellow
    }
  }
}

$config = @{
  host = $dbHost
  user = $appUser
  password = $appPassword
  database = $dbName
  port = [int]$dbPort
}
$config | ConvertTo-Json -Depth 3 | Set-Content -Path $configPath -Encoding UTF8

Write-Host ""
Write-Host "✅ 完成！已写入 $configPath"
Write-Host "数据库账号：$appUser"
Write-Host "数据库密码：$appPassword"
Write-Host "数据库名：$dbName"
Write-Host ""
Write-Host "提示：请妥善保存上面的数据库密码。"
