const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 打包目录（与目标机部署结构保持一致）
const packageDir = path.join(__dirname, 'deploy_bundle');

console.log('正在创建Vue Element Plus Admin安装包...');

// 1. 创建打包目录结构
console.log('1. 创建打包目录结构...');
if (!fs.existsSync(packageDir)) {
  fs.mkdirSync(packageDir, { recursive: true });
}

const subDirs = ['backend', 'frontend'];
for (const dir of subDirs) {
  const dirPath = path.join(packageDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 2. 复制后端文件
console.log('2. 复制后端文件...');
const backendSrcDir = path.join(__dirname, 'backend');
const backendDestDir = path.join(packageDir, 'backend');

// 清理旧目录，避免残留文件
if (fs.existsSync(backendDestDir)) {
  fs.rmSync(backendDestDir, { recursive: true, force: true });
}
fs.mkdirSync(backendDestDir, { recursive: true });

if (fs.existsSync(backendSrcDir)) {
  copyDir(backendSrcDir, backendDestDir, ['node_modules']);
  console.log('✓ 复制后端目录完成');
} else {
  console.log('⚠ backend目录不存在，跳过后端文件复制');
}

// 3. 复制前端构建文件（如果存在）
console.log('3. 准备前端文件...');
const frontendDistDir = path.join(__dirname, 'deploy_bundle', 'dist-pro');
const legacyFrontendDistDir = path.join(__dirname, 'dist');
const legacyReleaseDistDir = path.join(__dirname, 'release', 'dist-pro');
const frontendDestDir = path.join(packageDir, 'frontend');

// 清理旧目录，避免残留文件
if (fs.existsSync(frontendDestDir)) {
  fs.rmSync(frontendDestDir, { recursive: true, force: true });
}
fs.mkdirSync(frontendDestDir, { recursive: true });

if (fs.existsSync(frontendDistDir)) {
  copyDir(frontendDistDir, frontendDestDir);
  console.log('✓ 复制前端构建文件 (deploy_bundle/dist-pro)');
} else if (fs.existsSync(legacyReleaseDistDir)) {
  copyDir(legacyReleaseDistDir, frontendDestDir);
  console.log('✓ 复制前端构建文件 (release/dist-pro, legacy)');
} else if (fs.existsSync(legacyFrontendDistDir)) {
  copyDir(legacyFrontendDistDir, frontendDestDir);
  console.log('✓ 复制前端构建文件 (dist)');
} else {
  console.log('⚠ 前端构建文件不存在，需要先构建前端项目');
  console.log('  请运行: pnpm run build:pro');
}

// 4. 创建说明文档
console.log('4. 创建说明文档...');
const readmeContent = `Vue Element Plus Admin - Portable Installation Package
=======================================

This installation package contains the complete Vue Element Plus Admin application, including the frontend interface and backend services.

Prerequisites:
- You need to separately download portable versions of Node.js and MariaDB
- Extract Node.js portable to: node-portable/
- Extract MariaDB portable to: mariadb-portable/
- These folders should be in the same parent directory as this package

Directory Structure:
- backend/: Backend service files and startup scripts
- frontend/: Frontend build files
- node-portable/: (User to provide) Portable Node.js installation
- mariadb-portable/: (User to provide) Portable MariaDB installation
- docs/: Documentation files

Installation and Operation:
1. Ensure the system meets the following requirements:
   - Windows 10 or higher
   - At least 4GB free disk space
   
2. Download portable Node.js (LTS version) and extract to node-portable/ directory
3. Download portable MariaDB (10.6 or newer) and extract to mariadb-portable/ directory
4. Extract the entire folder to the desired installation path, for example: E:\\vue-app\\

5. Double-click to run backend/check-and-setup-env.bat script
   - This script will check for portable Node.js and MariaDB
   - Automatically install all required dependencies
   - Start the database service
   - Initialize the database structure and data
   - Start the backend service
   - Open the browser to access the application

Port Information:
- Backend Service Port: 3002
- Database Port: 3307

Access Application:
- Browser Access: http://localhost:3002
- Admin Account: admin
- Initial Password: admin123

Notes:
- Do not modify or delete any files in the backend directory
- The first run may take a few minutes to complete dependency installation and database initialization
- Database files are stored in the backend/data directory, please back up this directory regularly
`;

const readmePath = path.join(packageDir, 'README.txt');
fs.writeFileSync(readmePath, readmeContent, 'utf8');

// 5. Create quick start script
console.log('5. Creating quick start script...');
const quickStartScript = `@echo off
title Vue Element Plus Admin - Quick Start

echo ========================================
echo Vue Element Plus Admin - Quick Start
echo ========================================
echo.

echo NOTE: Before running this application, you need to:
echo 1. Download portable Node.js and extract to ../node-portable/
echo 2. Download portable MariaDB and extract to ../mariadb-portable/
echo 3. Then run this script again
echo.
echo For more details, please read README.txt
echo.

pause
`;

const quickStartPath = path.join(packageDir, 'quick-start.bat');
fs.writeFileSync(quickStartPath, quickStartScript, 'utf8');

console.log('6. Installation package created!');
console.log('');
console.log('📦 Installation Package Location: ' + packageDir);
console.log('');
console.log('Package Contents:');
console.log('- backend/: Contains all backend files and startup scripts');
console.log('- frontend/: Contains frontend build files (if built)');
console.log('- README.txt: Installation and usage instructions');
console.log('- quick-start.bat: Quick start script');
console.log('');
console.log('💡 Usage Instructions:');
console.log('1. Download portable Node.js and MariaDB');
console.log('2. Extract to node-portable/ and mariadb-portable/ directories');
console.log('3. Copy the entire folder to the target machine');
console.log('4. Double-click quick-start.bat to check environment and start the application');
console.log('5. Wait for automatic completion of dependency installation and deployment');
console.log('6. Browser will automatically open the application interface');

// Helper function: Copy directory
function copyDir(src, dest, exclude = []) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    if (exclude.includes(entry.name)) {
      continue;
    }
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, exclude);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
