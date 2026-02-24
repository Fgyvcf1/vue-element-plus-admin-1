@echo off
title Vue Element Plus Admin - Installing Dependencies and Starting

echo ========================================
echo Vue Element Plus Admin
echo Installing Dependencies and Starting
echo ========================================
echo.

:: Set environment variables
set "NODE_PATH=E:\node-portable\node-v24.13.1-win-x64"
set "PATH=%NODE_PATH%;%PATH%"

:: Check if Node.js is available
echo Checking Node.js availability...
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not available in the specified path
    echo Please check NODE_PATH in this script
    pause
    exit /b 1
)

:: Check if package.json exists
if not exist "package.json" (
    echo Error: package.json not found in current directory
    pause
    exit /b 1
)

:: Install dependencies
echo.
echo Installing dependencies, please wait...
npm install --no-audit --no-fund

if errorlevel 1 (
    echo.
    echo Error: Failed to install dependencies
    echo Please check your network connection or Node.js environment
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!

:: Start deployment script
echo.
echo Starting deployment...
call complete-deploy-en.bat

echo.
echo Process completed!
pause