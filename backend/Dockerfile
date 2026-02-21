FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install --only=production

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3001

# 启动应用
CMD ["node", "start-backend.js"]