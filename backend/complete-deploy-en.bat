@echo off
title Vue Element Plus Admin - Complete Deployment (Port 3002/3307)

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "ROOT_DIR=%%~fI"

if not defined NODE_PATH set "NODE_PATH=%ROOT_DIR%\node-portable"
if not defined MARIADB_HOME set "MARIADB_HOME=%ROOT_DIR%\mariadb-portable"
if not defined MARIADB_PATH set "MARIADB_PATH=%MARIADB_HOME%\bin"
set "PATH=%NODE_PATH%;%MARIADB_PATH%;%PATH%"

echo ========================================
echo Vue Element Plus Admin Complete Deployment Tool
echo Port Config: Backend 3002, Database 3307
echo ========================================
echo.

:: Check required files
echo Checking required files...
if not exist "database-full-export-2026-02-23.sql" (
    echo Warning: Expected database export file database-full-export-2026-02-23.sql not found
    echo Checking for alternative database export files...
    
    :: Try other possible filenames
    if exist "database-full-export.sql" (
        echo Found: database-full-export.sql
        copy "database-full-export.sql" "database-full-export-2026-02-23.sql"
    ) else if exist "full-database-export.sql" (
        echo Found: full-database-export.sql
        copy "full-database-export.sql" "database-full-export-2026-02-23.sql"
    ) else if exist "exported-database.sql" (
        echo Found: exported-database.sql
        copy "exported-database.sql" "database-full-export-2026-02-23.sql"
    ) else (
        echo Error: Database export file not found
        echo Please ensure database export file exists in current directory
        pause
        exit /b 1
    )
)

if not exist "%NODE_PATH%\node.exe" (
    echo Error: Node.js executable not found
    pause
    exit /b 1
)

if not exist "%MARIADB_PATH%\mysqld.exe" (
    echo Error: MariaDB executable not found
    pause
    exit /b 1
)

:: Create required directories
echo Creating required directories...
if not exist "data" mkdir data
if not exist "logs" mkdir logs

:: Start database (port 3307)
echo.
echo Starting database service (port 3307)...
call setup-portable-env.bat

start "" "%MARIADB_PATH%\mysqld.exe" --defaults-file="%SCRIPT_DIR%mariadb-config.ini" --console

:: Wait for database to start
echo Waiting for database to start...
timeout /t 15 /nobreak >nul

:: Check database process
tasklist | findstr mysqld >nul
if errorlevel 1 (
    echo Warning: Database process not found, continuing initialization attempt...
)

:: Initialize database
echo.
echo Initializing database...
"%NODE_PATH%\node.exe" robust-init-db.js

if errorlevel 1 (
    echo.
    echo Database initialization failed!
    echo Please check:
    echo 1. MariaDB started correctly
    echo 2. Database export file exists and is complete
    echo 3. Port 3307 is not occupied by other programs
    pause
    exit /b 1
)

:: Start backend service (port 3002)
echo.
echo Starting backend service (port 3002)...
set "PORT=3002"
start "" "%NODE_PATH%\node.exe" app.js

echo.
echo ========================================
echo Deployment completed!
echo ========================================
echo Access URL: http://localhost:3002
echo Admin Account: admin
echo Admin Password: admin123
echo Database Port: 3307
echo ========================================
echo.

:: Open browser
timeout /t 3 /nobreak >nul
start http://localhost:3002

echo.
echo Press any key to exit...
pause >nul
