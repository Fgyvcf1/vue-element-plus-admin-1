@echo off
chcp 65001 > nul
setlocal

set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%upgrade-on-target.ps1"

if not exist "%PS_SCRIPT%" (
  echo [ERROR] upgrade-on-target.ps1 not found.
  pause
  exit /b 1
)

echo.
echo ===============================================
echo   Vue Element Plus Admin - One Click Upgrade
echo ===============================================
echo.
echo Usage:
echo   1) In-place upgrade (default):
echo      upgrade-on-target.bat
echo   2) Upgrade another directory:
echo      upgrade-on-target.bat "D:\YourInstallDir"
echo.

if "%~1"=="" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" -TargetRoot "%~1"
)

if %errorlevel% neq 0 (
  echo.
  echo [ERROR] Upgrade failed. Please check the messages above.
  pause
  exit /b 1
)

echo.
echo [ OK ] Upgrade script completed.
pause
