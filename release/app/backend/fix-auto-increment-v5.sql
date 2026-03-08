-- 修复调解相关表自增问题 - 版本5
-- 错误1075: 自增列必须被定义为主键
-- 请在数据库管理工具中以root用户执行

-- 方法: 先删除自增属性，添加主键，再重新添加自增
-- 或者: 直接修改列定义，同时设置主键和自增

-- 对于 mediation_archives
ALTER TABLE mediation_archives DROP COLUMN id;
ALTER TABLE mediation_archives ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- 对于 mediation_applications
ALTER TABLE mediation_applications DROP COLUMN id;
ALTER TABLE mediation_applications ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- 对于 mediation_applicants
ALTER TABLE mediation_applicants DROP COLUMN id;
ALTER TABLE mediation_applicants ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- 对于 mediation_respondents
ALTER TABLE mediation_respondents DROP COLUMN id;
ALTER TABLE mediation_respondents ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- 对于 mediation_records
ALTER TABLE mediation_records DROP COLUMN id;
ALTER TABLE mediation_records ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
