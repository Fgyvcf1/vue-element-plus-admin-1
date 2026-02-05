-- 修复空表的自增ID问题
-- 这4个表都是空表，可以直接添加主键和自增
-- 请在数据库管理工具中以root用户执行

-- 为 mediation_archives 添加主键和自增
ALTER TABLE mediation_archives MODIFY id INT NOT NULL PRIMARY KEY AUTO_INCREMENT;

-- 为 mediation_applications 添加主键和自增
ALTER TABLE mediation_applications MODIFY id INT NOT NULL PRIMARY KEY AUTO_INCREMENT;

-- 为 mediation_applicants 添加主键和自增
ALTER TABLE mediation_applicants MODIFY id INT NOT NULL PRIMARY KEY AUTO_INCREMENT;

-- 为 mediation_respondents 添加主键和自增
ALTER TABLE mediation_respondents MODIFY id INT NOT NULL PRIMARY KEY AUTO_INCREMENT;
