@echo off
setlocal

set "SERVICE_NAME=VueElementPlusAdmin"
set "DB_SERVICE_NAME=VueElementPlusAdminDB"

sc query "%SERVICE_NAME%" >nul 2>&1
if %errorlevel%==0 (
  sc stop "%SERVICE_NAME%" >nul 2>&1
  sc delete "%SERVICE_NAME%" >nul 2>&1
  timeout /t 2 >nul
)

netsh advfirewall firewall delete rule name="%SERVICE_NAME% 3001" >nul 2>&1

sc query "%DB_SERVICE_NAME%" >nul 2>&1
if %errorlevel%==0 (
  sc stop "%DB_SERVICE_NAME%" >nul 2>&1
  sc delete "%DB_SERVICE_NAME%" >nul 2>&1
  timeout /t 2 >nul
)

endlocal
