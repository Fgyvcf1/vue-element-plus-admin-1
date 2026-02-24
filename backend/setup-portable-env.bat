@echo off

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "ROOT_DIR=%%~fI"

if not defined NODE_PATH set "NODE_PATH=%ROOT_DIR%\node-portable"
if not defined MARIADB_HOME set "MARIADB_HOME=%ROOT_DIR%\mariadb-portable"
if not defined MARIADB_PATH set "MARIADB_PATH=%MARIADB_HOME%\bin"
set "MYSQL_HOME=%MARIADB_HOME%"
set "PATH=%NODE_PATH%;%MARIADB_PATH%;%PATH%"

set "DATA_DIR=%SCRIPT_DIR%data"
set "LOG_DIR=%SCRIPT_DIR%logs"
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

set "INI_PATH=%SCRIPT_DIR%mariadb-config.ini"
(
echo [mysqld]
echo port=3307
echo datadir=%DATA_DIR%
echo basedir=%MARIADB_HOME%
echo log-error=%LOG_DIR%\error.log
echo general_log=1
echo general_log_file=%LOG_DIR%\general.log
echo bind-address=127.0.0.1
echo max_connections=100
) > "%INI_PATH%"

echo 环境配置完成！
