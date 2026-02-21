# Docker 部署指南

## 🐳 为什么选择Docker部署？

### 优势
- **环境一致性**：开发、测试、生产环境完全一致
- **快速部署**：一条命令启动整个应用栈
- **资源隔离**：各服务独立运行，互不影响
- **易于扩展**：支持水平扩展和负载均衡
- **简化运维**：容器化管理，降低运维复杂度

## 📦 部署架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (Nginx)       │◄──►│   (Node.js)     │◄──►│   (MariaDB)     │
│   Port: 80      │    │   Port: 3001    │    │   Port: 3306    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 快速开始

### 1. 生产环境部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 2. 开发环境部署

```bash
# 启动开发环境（带热重载）
docker-compose -f docker-compose.dev.yaml up
```

### 3. 单独构建镜像

```bash
# 构建生产环境前端
docker build -t vue-element-plus-admin .

# 构建开发环境前端
docker build -f Dockerfile.dev -t vue-element-plus-admin:dev .

# 构建后端服务
docker build -f backend/Dockerfile -t vue-element-plus-admin-backend backend/
```

## 🔧 环境变量配置

### 数据库配置
```bash
DB_HOST=mariadb          # 数据库主机
DB_USER=app_user         # 数据库用户
DB_PASSWORD=strongpass791002  # 数据库密码
DB_NAME=village          # 数据库名
DB_PORT=3306             # 数据库端口
```

### 应用配置
```bash
PORT=3001                # 后端服务端口
NODE_ENV=production      # 运行环境
```

## 📁 目录结构

```
vue-element-plus-admin/
├── Dockerfile           # 生产环境前端Dockerfile
├── Dockerfile.dev       # 开发环境前端Dockerfile
├── docker-compose.yml   # 生产环境编排文件
├── docker-compose.dev.yaml  # 开发环境编排文件
├── nginx.conf           # Nginx配置文件
├── backend/
│   └── Dockerfile       # 后端Dockerfile
└── ...
```

## 🛠️ 常用操作

### 管理服务
```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启特定服务
docker-compose restart frontend

# 查看服务日志
docker-compose logs frontend
docker-compose logs backend
docker-compose logs mariadb
```

### 数据库管理
```bash
# 进入数据库容器
docker-compose exec mariadb mysql -u app_user -p

# 备份数据库
docker-compose exec mariadb mysqldump -u app_user -p village > backup.sql

# 恢复数据库
docker-compose exec -T mariadb mysql -u app_user -p village < backup.sql
```

### 镜像管理
```bash
# 查看镜像
docker images | grep vue-element-plus-admin

# 删除镜像
docker rmi vue-element-plus-admin

# 清理未使用的镜像
docker image prune
```

## 🔒 安全建议

1. **修改默认密码**：生产环境务必修改数据库默认密码
2. **网络隔离**：使用自定义网络隔离服务
3. **资源限制**：为容器设置CPU和内存限制
4. **定期更新**：及时更新基础镜像和依赖包
5. **日志监控**：启用日志收集和监控告警

## 🚨 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 查看端口占用
   netstat -tlnp | grep :80
   netstat -tlnp | grep :3001
   
   # 修改docker-compose.yml中的端口映射
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库服务状态
   docker-compose ps mariadb
   
   # 查看数据库日志
   docker-compose logs mariadb
   ```

3. **构建失败**
   ```bash
   # 清理构建缓存
   docker builder prune
   
   # 重新构建
   docker-compose build --no-cache
   ```

4. **权限问题**
   ```bash
   # 设置正确的文件权限
   chmod -R 755 ./backend/uploads
   chmod -R 755 ./backend/archives
   ```

## 📊 性能优化

### Nginx优化
- 启用Gzip压缩
- 配置缓存策略
- 设置合适的worker进程数

### 数据库优化
- 调整缓冲池大小
- 优化查询索引
- 定期维护表结构

### 应用优化
- 启用HTTP/2
- 配置CDN加速
- 实施负载均衡

## 🔄 CI/CD集成

可以在GitHub Actions、GitLab CI等平台集成Docker部署：

```yaml
# 示例：GitHub Actions workflow
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build and deploy
        run: |
          docker-compose build
          docker-compose up -d
```

## 📞 技术支持

如有部署问题，请查看：
- [官方文档](https://element-plus-admin-doc.cn/)
- [GitHub Issues](https://github.com/kailong321200875/vue-element-plus-admin/issues)
- Docker官方文档