@echo off
setlocal

set "SERVICE_NAME=VueElementPlusAdmin"
set "SERVICE_DISPLAY=Vue Element Plus Admin"
set "DB_SERVICE_NAME=VueElementPlusAdminDB"

set "APP_DIR=%~dp0.."
for %%I in ("%APP_DIR%") do set "APP_DIR=%%~fI"
set "SERVICE_CMD=%ComSpec% /c ""%APP_DIR%\bin\start-backend.cmd"""

sc query "%SERVICE_NAME%" >nul 2>&1
if %errorlevel%==0 (
  sc stop "%SERVICE_NAME%" >nul 2>&1
  sc delete "%SERVICE_NAME%" >nul 2>&1
  timeout /t 2 >nul
)

sc create "%SERVICE_NAME%" binPath= "%SERVICE_CMD%" start= auto DisplayName= "%SERVICE_DISPLAY%" >nul
sc description "%SERVICE_NAME%" "Vue Element Plus Admin backend service" >nul
sc query "%DB_SERVICE_NAME%" >nul 2>&1
if %errorlevel%==0 (
  sc config "%SERVICE_NAME%" depend= "%DB_SERVICE_NAME%" >nul
)
sc start "%SERVICE_NAME%" >nul

netsh advfirewall firewall show rule name="%SERVICE_NAME% 3001" >nul 2>&1
if %errorlevel%==1 (
  netsh advfirewall firewall add rule name="%SERVICE_NAME% 3001" dir=in action=allow protocol=TCP localport=3001 >nul
)

endlocal
