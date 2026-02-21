# fix-dev.ps1
Write-Host "🔧 开始修复 vue-element-plus-admin 开发环境..." -ForegroundColor Cyan

# 1. 杀掉 4000 端口占用进程
Write-Host "Step 1: 释放端口 4000..."
$ports = netstat -ano | findstr ":4000"
if ($ports) {
    $pid = $ports.Split() | Where-Object { $_ -match '^\d+$' } | Select-Object -First 1
    Write-Host "检测到 PID $pid 占用端口，正在终止..."
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "端口 4000 空闲"
}

# 2. 确保 .env.development 存在
$envFile = Join-Path $PWD ".env.development"
if (-not (Test-Path $envFile)) {
    Write-Host "Step 2: 创建 .env.development..."
    @'
VITE_USE_MOCK=true
VITE_BASE_PATH=/
VITE_APP_TITLE=vue-element-plus-admin
VITE_API_BASE_URL=http://localhost:3001/api
VITE_DROP_CONSOLE=false
VITE_DROP_DEBUGGER=false
VITE_SOURCEMAP=true
VITE_OUT_DIR=dist
'@ | Out-File -FilePath $envFile -Encoding UTF8
} else {
    Write-Host ".env.development 已存在"
}

# 3. 清理 Vite 缓存
Write-Host "Step 3: 清理 Vite 缓存..."
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Write-Host "缓存清理完成"

# 4. 启动开发服务器
Write-Host "Step 4: 启动开发服务器..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; pnpm run dev"

Write-Host "✅ 修复完成！请查看新打开的 PowerShell 窗口中的启动日志。" -ForegroundColor Green