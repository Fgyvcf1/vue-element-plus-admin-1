$ErrorActionPreference = 'Stop'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  启动 Vue3 + Element Plus 项目" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$pnpm = Join-Path $env:APPDATA 'npm\pnpm.cmd'
if (-not (Test-Path $pnpm)) {
  Write-Host "未找到 pnpm：$pnpm" -ForegroundColor Red
  Write-Host "请先安装 pnpm（用户级）：npm i -g pnpm --prefix `"$env:APPDATA\npm`"" -ForegroundColor Yellow
  exit 1
}

Write-Host "[1/1] 启动前后端（dev:all）..." -ForegroundColor Green
& $pnpm dev:all
