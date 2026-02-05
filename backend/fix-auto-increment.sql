-- 修复调解相关表的自增ID问题
-- 请在数据库管理工具（如phpMyAdmin、Navicat等）中以root用户执行

-- 修复 mediation_archives 表
ALTER TABLE mediation_archives 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;

-- 修复 mediation_applications 表
ALTER TABLE mediation_applications 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;

-- 修复 mediation_applicants 表
ALTER TABLE mediation_applicants 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;

-- 修复 mediation_respondents 表
ALTER TABLE mediation_respondents 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;

-- 修复 mediation_records 表
ALTER TABLE mediation_records 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;

-- 修复 mediation_agreements 表
ALTER TABLE mediation_agreements 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;

-- 修复 archive_attachments 表
ALTER TABLE archive_attachments 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;

-- 修复 archive_sequences 表
ALTER TABLE archive_sequences 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;
