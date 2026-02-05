-- 修复调解相关表的自增ID问题 - 最终版
-- 请在数据库管理工具中以root用户执行
-- 这6个表的id列当前不是主键，需要同时设置主键和自增

-- 方法: 修改id列为主键并添加自增
ALTER TABLE mediation_archives MODIFY id INT NOT NULL PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE mediation_applications MODIFY id INT NOT NULL PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE mediation_applicants MODIFY id INT NOT NULL PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE mediation_respondents MODIFY id INT NOT NULL PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE mediation_records MODIFY id INT NOT NULL PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE mediation_agreements MODIFY id INT NOT NULL PRIMARY KEY AUTO_INCREMENT;
