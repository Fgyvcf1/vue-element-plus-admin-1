const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到SQLite数据库
const dbPath = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('连接数据库失败:', err.message);
        process.exit(1);
    }
    console.log('成功连接到SQLite数据库');
});

// 逐个添加列
const addColumns = [
    'ADD COLUMN name VARCHAR(50)',
    'ADD COLUMN gender VARCHAR(10)',
    'ADD COLUMN id_card VARCHAR(18)',
    'ADD COLUMN political_status VARCHAR(20)',
    'ADD COLUMN is_two_committee_member VARCHAR(10)',
    'ADD COLUMN position VARCHAR(50)',
    'ADD COLUMN phone_number VARCHAR(20)'
];

let index = 0;

function addNextColumn() {
    if (index < addColumns.length) {
        const sql = `ALTER TABLE mediators ${addColumns[index]}`;
        db.run(sql, (err) => {
            if (err) {
                console.error(`添加列失败 (${addColumns[index]}):`, err.message);
            } else {
                console.log(`成功添加列: ${addColumns[index]}`);
            }
            index++;
            addNextColumn();
        });
    } else {
        console.log('所有列添加完成');
        db.close((err) => {
            if (err) {
                console.error('关闭数据库连接失败:', err.message);
            } else {
                console.log('数据库连接已关闭');
            }
        });
    }
}

// 开始添加列
addNextColumn();
