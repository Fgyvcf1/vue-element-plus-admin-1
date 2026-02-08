#!/bin/bash

echo "========================================"
echo "  启动 Vue3 + Element Plus 项目"
echo "========================================"
echo ""

echo "[1/2] 启动后端服务（端口3001）..."
cd backend
node start-backend.js &
BACKEND_PID=$!
echo "后端服务 PID: $BACKEND_PID"

echo ""
echo "[2/2] 启动前端服务..."
cd ..
pnpm dev &
FRONTEND_PID=$!
echo "前端服务 PID: $FRONTEND_PID"

echo ""
echo "========================================"
echo "  服务已启动"
echo "  前端: http://localhost:5173"
echo "  后端: http://localhost:3001"
echo "========================================"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获退出信号，关闭所有进程
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# 等待进程结束
wait
