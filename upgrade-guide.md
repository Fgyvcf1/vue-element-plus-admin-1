# 项目升级简易指南

如果您是业余开发者，并且使用AI辅助开发，这里提供一个简单的升级流程。

## 升级前准备

1. **备份现有项目**
   - 复制您当前正在运行的网站文件夹，保存到其他位置
   - 这样如果升级出现问题，您可以随时恢复到之前的版本

2. **备份源代码**
   - 确保您的源代码（项目文件夹）也做了备份
   - 提交所有更改到Git（如果有使用）

## 升级步骤

### 第一步：在源码中添加新功能

1. 在您的项目源码中，继续使用AI助手添加和完善新功能
2. 完成开发后，进行测试以确保一切正常

### 第二步：重新构建项目

打开终端或命令提示符，进入项目目录：

```bash
# 安装依赖（如果需要）
pnpm install

# 构建生产版本
pnpm run build:pro
```

这会在 `dist-pro` 文件夹中生成新的部署文件。

### 第三步：部署新版本

1. 将旧的部署目录重命名或移动到其他位置（作为备份）
2. 将新生成的 `dist-pro` 文件夹的内容复制到您的Web服务器目录中
3. 如果您使用的是Nginx，确保配置指向正确的路径

## Windows用户专用批处理脚本

如果您使用Windows，可以在项目根目录创建一个批处理文件来简化升级过程。

创建 `upgrade.bat` 文件，内容如下：

```batch
@echo off
echo 开始升级 vue-element-plus-admin...

REM 创建时间戳备份
set timestamp=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
echo 创建备份 backup_%timestamp%
xcopy /E /I /Y "C:\inetpub\wwwroot\vue-element-plus-admin" "C:\inetpub\wwwroot\backup_%timestamp%"

REM 构建项目
echo 正在构建项目...
call pnpm install
call pnpm run build:pro

REM 复制新文件到部署目录
echo 正在部署新版本...
xcopy /E /I /Y "dist-pro" "C:\inetpub\wwwroot\vue-element-plus-admin"

echo 升级完成！请检查网站是否正常运行。
pause
```

注意：请根据您的实际部署路径修改脚本中的路径。

## Linux/Mac用户专用脚本

创建 `upgrade.sh` 文件：

```bash
#!/bin/bash

echo "开始升级 vue-element-plus-admin..."

# 创建带时间戳的备份
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
echo "创建备份 backup_$TIMESTAMP"
cp -r /var/www/html/vue-element-plus-admin /var/www/html/backup_$TIMESTAMP

# 构建项目
echo "正在构建项目..."
pnpm install
pnpm run build:pro

# 复制新文件到部署目录
echo "正在部署新版本..."
sudo cp -r dist-pro/* /var/www/html/vue-element-plus-admin/

echo "升级完成！请检查网站是否正常运行。"
```

## 验证升级结果

升级完成后，请务必检查：

1. 网站能否正常访问
2. 主要功能是否正常工作
3. 登录、导航等功能是否正常
4. 检查浏览器控制台是否有错误信息

## 如何回滚到旧版本

如果升级后出现问题：

1. 删除新部署的文件
2. 将之前备份的旧版本文件复制回去
3. 检查网站是否恢复正常

## 小贴士

- 每次升级前都要备份
- 在非工作时间进行升级，以免影响用户
- 升级后多花点时间测试，确保一切正常
- 如果不确定，可以先在测试环境中尝试升级

这种方法虽然不是最专业的，但对于您的使用场景来说简单有效，而且风险可控。