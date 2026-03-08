@echo off
:: 启动MariaDB服务（使用3307端口）
echo 正在启动MariaDB（端口3307）...

:: 启动数据库
start "" "E:\mariadb-portable\bin\mysqld.exe" --defaults-file=.\mariadb-config.ini --console

:: 等待数据库启动
timeout /t 10 /nobreak >nul

:: 检查数据库是否启动成功
echo 检查数据库状态...
for /f "tokens=*" %%a in ('tasklist ^| findstr mysqld') do (
    echo 数据库已启动: %%a
    goto :database_started
)
echo 数据库启动失败！
goto :error

:database_started
echo 数据库启动成功（端口3307）！
exit /b 0

:error
echo 错误：数据库启动失败
exit /b 1