@echo off
setlocal

set "SCRIPT_DIR=%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%setup-local-mariadb.ps1"
if errorlevel 1 (
  echo.
  echo 初始化失败，请检查上面的错误信息。
  exit /b 1
)

echo.
echo 初始化完成。
endlocal
