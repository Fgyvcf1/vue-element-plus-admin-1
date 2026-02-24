@echo off
title Vue Element Plus Admin - Environment Setup

echo ========================================
echo Vue Element Plus Admin - Environment Setup
echo ========================================
echo.

:: Define portable paths
set "NODE_DIR=node-portable"
set "MARIADB_DIR=mariadb-portable"

:: Check if Node.js portable is present
echo Checking for portable Node.js...
if not exist "..\%NODE_DIR%" (
    echo Portable Node.js not found.
    echo Downloading portable Node.js...
    echo.
    echo ERROR: Automatic download not implemented in this version
    echo Please download Node.js portable version and extract to:
    echo ..\%NODE_DIR%
    echo.
    echo Recommended: Node.js LTS version (at least v16.x)
    echo You can download from: https://nodejs.org/en/download/
    pause
    exit /b 1
) else (
    echo Portable Node.js found.
)

:: Check if MariaDB portable is present
echo Checking for portable MariaDB...
if not exist "..\%MARIADB_DIR%" (
    echo Portable MariaDB not found.
    echo Downloading portable MariaDB...
    echo.
    echo ERROR: Automatic download not implemented in this version
    echo Please download MariaDB portable version and extract to:
    echo ..\%MARIADB_DIR%
    echo.
    echo Recommended: MariaDB 10.6 or newer
    echo You can download from: https://mariadb.org/download/
    pause
    exit /b 1
) else (
    echo Portable MariaDB found.
)

:: Set up environment variables
set "NODE_PATH=..\%NODE_DIR%"
set "MARIADB_PATH=..\%MARIADB_DIR%\bin"
set "PATH=%NODE_PATH%;%MARIADB_PATH%;%PATH%"

echo.
echo Environment setup complete!
echo Node.js path: %NODE_PATH%
echo MariaDB path: %MARIADB_PATH%

:: Install dependencies
echo.
echo Installing dependencies, please wait...
cd ..
"%NODE_PATH%\npm.cmd" install --no-audit --no-fund
if errorlevel 1 (
    echo.
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo Dependencies installed successfully!

:: Return to backend directory and start deployment
cd backend
echo.
echo Starting deployment...
call complete-deploy-en.bat

echo.
echo Process completed!
pause