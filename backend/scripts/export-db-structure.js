const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`⚠ 读取配置失败: ${filePath} (${error.message})`);
    return null;
  }
}

function resolveDbConfig() {
  const configPath = path.resolve(__dirname, '../config.json');
  const cfg = readJsonFile(configPath) || {};

  const dbConfig = {
    host: process.env.DB_HOST || cfg.host || 'localhost',
    user: process.env.DB_USER || cfg.user || 'app_user',
    password: process.env.DB_PASSWORD || cfg.password || 'strongpass791002',
    database: process.env.DB_NAME || cfg.database || 'village',
    port: Number(process.env.DB_PORT || cfg.port || 3306)
  };

  if (!dbConfig.database) {
    throw new Error('数据库名为空，请设置 DB_NAME 或 backend/config.json 的 database');
  }

  return dbConfig;
}

function ensureOutputPath() {
  const outputPath = path.resolve(__dirname, '../sql/database-structure.sql');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  return outputPath;
}

function findMysqldump() {
  const candidates = [];
  if (process.env.MYSQLDUMP_PATH) {
    candidates.push(process.env.MYSQLDUMP_PATH);
  }
  if (process.env.MARIADB_DIR) {
    candidates.push(path.join(process.env.MARIADB_DIR, 'bin', 'mysqldump.exe'));
    candidates.push(path.join(process.env.MARIADB_DIR, 'bin', 'mysqldump'));
  }

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  try {
    const cmd = process.platform === 'win32' ? 'where mysqldump' : 'which mysqldump';
    const resolved = execSync(cmd, { encoding: 'utf8' }).trim().split(/\r?\n/)[0];
    if (resolved && fs.existsSync(resolved)) return resolved;
  } catch {
  }

  return null;
}

function exportWithMysqldump(dbConfig, outputPath) {
  const mysqldump = findMysqldump();
  if (!mysqldump) {
    return false;
  }

  const args = [
    `--host=${dbConfig.host}`,
    `--port=${dbConfig.port}`,
    `--user=${dbConfig.user}`,
    '--default-character-set=utf8mb4',
    '--routines',
    '--triggers',
    '--events',
    '--no-data',
    '--databases',
    dbConfig.database
  ];

  if (dbConfig.password !== undefined) {
    args.unshift(`--password=${dbConfig.password}`);
  }

  console.log(`使用 mysqldump 导出结构: ${mysqldump}`);
  const output = execFileSync(mysqldump, args, { encoding: 'utf8' });
  fs.writeFileSync(outputPath, output, 'utf8');
  return true;
}

async function exportWithMysql2(dbConfig, outputPath) {
  let connection;
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);

    const [tables] = await connection.execute(
      "SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'"
    );

    let sqlContent = `-- Village Office System Database Structure
-- Generated on ${new Date().toISOString()}

CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`${dbConfig.database}\`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

`;

    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      console.log(`处理表: ${tableName}`);

      const [createTableResult] = await connection.execute(
        `SHOW CREATE TABLE \`${tableName}\``
      );
      const createTableSql = createTableResult[0]['Create Table'];

      sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlContent += `${createTableSql};\n\n`;
    }

    sqlContent += 'SET FOREIGN_KEY_CHECKS = 1;\n';
    fs.writeFileSync(outputPath, sqlContent, 'utf8');
  } finally {
    if (connection) await connection.end();
  }
}

async function exportDatabaseStructure() {
  try {
    const dbConfig = resolveDbConfig();
    const outputPath = ensureOutputPath();

    if (exportWithMysqldump(dbConfig, outputPath)) {
      console.log(`✅ 数据库结构已导出到: ${outputPath}`);
      return;
    }

    console.log('未找到 mysqldump，改用 mysql2 导出结构...');
    await exportWithMysql2(dbConfig, outputPath);
    console.log(`✅ 数据库结构已导出到: ${outputPath}`);
  } catch (error) {
    console.error('❌ 导出失败:', error.message);
    process.exit(1);
  }
}

exportDatabaseStructure();
