const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

class DatabaseInitializer {
    constructor() {
        this.dbConfig = {
            host: 'localhost',
            port: 3307,  // 使用3307端口
            user: 'root',
            password: '',
            charset: 'utf8mb4'
        };
        this.databaseName = 'vue_element_plus_admin';
    }

    async connect() {
        return await mysql.createConnection(this.dbConfig);
    }

    async executeSQL(connection, sql, description = '') {
        try {
            await connection.execute(sql);
            if (description) {
                console.log(`✓ ${description}`);
            }
            return true;
        } catch (error) {
            console.error(`✗ ${description || 'SQL执行失败'}:`, error.message);
            return false;
        }
    }

    async initializeDatabase() {
        let connection;
        try {
            console.log('开始数据库初始化（端口3307）...');
            
            // 连接数据库
            connection = await this.connect();
            
            // 1. 创建数据库
            await this.executeSQL(
                connection,
                `CREATE DATABASE IF NOT EXISTS \`${this.databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
                '创建数据库'
            );
            
            // 2. 使用数据库
            await this.executeSQL(connection, `USE \`${this.databaseName}\``, '切换到目标数据库');
            
            // 3. 执行完整数据库导出文件
            const sqlFilePath = path.join(__dirname, 'database-full-export-2026-02-23.sql'); // 使用实际的导出文件名
            try {
                const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
                const statements = sqlContent
                    .split(';')
                    .map(stmt => stmt.trim())
                    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
                
                console.log(`执行 ${statements.length} 个SQL语句...`);
                
                let successCount = 0;
                for (const statement of statements) {
                    if (await this.executeSQL(connection, statement)) {
                        successCount++;
                    }
                }
                
                console.log(`成功执行 ${successCount}/${statements.length} 个SQL语句`);
                
            } catch (fileError) {
                console.error('读取数据库导出文件失败:', fileError.message);
                
                // 如果主文件不存在，尝试其他可能的文件名
                const possibleFiles = [
                    'database-full-export.sql',
                    'full-database-export.sql',
                    'exported-database.sql',
                    'backup.sql'
                ];
                
                let foundFile = false;
                for (const fileName of possibleFiles) {
                    try {
                        const filePath = path.join(__dirname, fileName);
                        const sqlContent = await fs.readFile(filePath, 'utf8');
                        const statements = sqlContent
                            .split(';')
                            .map(stmt => stmt.trim())
                            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
                        
                        console.log(`找到数据库文件: ${fileName}, 执行 ${statements.length} 个SQL语句...`);
                        
                        let successCount = 0;
                        for (const statement of statements) {
                            if (await this.executeSQL(connection, statement)) {
                                successCount++;
                            }
                        }
                        
                        console.log(`成功执行 ${successCount}/${statements.length} 个SQL语句`);
                        foundFile = true;
                        break;
                    } catch (err) {
                        console.log(`未找到文件: ${fileName}`);
                    }
                }
                
                if (!foundFile) {
                    throw new Error('数据库初始化文件不存在或损坏');
                }
            }
            
            // 4. 验证初始化结果
            await this.verifyInitialization(connection);
            
            console.log('\n🎉 数据库初始化完成！');
            return true;
            
        } catch (error) {
            console.error('\n❌ 数据库初始化失败:', error.message);
            return false;
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }

    async verifyInitialization(connection) {
        console.log('\n验证数据库初始化结果...');
        
        // 检查关键表是否存在
        const requiredTables = ['users', 'roles', 'permissions', 'sys_menu'];
        const [tables] = await connection.execute(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
            [this.databaseName]
        );
        
        const existingTables = tables.map(t => t.TABLE_NAME);
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));
        
        if (missingTables.length > 0) {
            throw new Error(`缺少关键表: ${missingTables.join(', ')}`);
        }
        
        console.log('✓ 所有关键表都已创建');
        
        // 检查用户数据
        const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
        console.log(`✓ 用户表记录数: ${userCount[0].count}`);
        
        // 检查角色数据
        const [roleCount] = await connection.execute('SELECT COUNT(*) as count FROM roles');
        console.log(`✓ 角色表记录数: ${roleCount[0].count}`);
        
        // 检查权限数据
        const [permissionCount] = await connection.execute('SELECT COUNT(*) as count FROM permissions');
        console.log(`✓ 权限表记录数: ${permissionCount[0].count}`);
        
        // 检查菜单数据
        const [menuCount] = await connection.execute('SELECT COUNT(*) as count FROM sys_menu');
        console.log(`✓ 菜单表记录数: ${menuCount[0].count}`);
    }
}

// 执行初始化
const initializer = new DatabaseInitializer();
initializer.initializeDatabase().then(success => {
    if (success) {
        console.log('数据库初始化成功完成！');
        process.exit(0);
    } else {
        console.error('数据库初始化失败！');
        process.exit(1);
    }
});