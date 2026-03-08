@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%start-backend.ps1"
set "PORT=3002"

powershell -ExecutionPolicy Bypass -File "%PS_SCRIPT%"

endlocal
