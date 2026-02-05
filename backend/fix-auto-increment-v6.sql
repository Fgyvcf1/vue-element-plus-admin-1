-- 修复调解相关表自增问题 - 版本6（保留数据）
-- 错误1075: 自增列必须被定义为主键
-- 请在数据库管理工具中以root用户执行

-- 方法: 先移除自增属性，添加主键，再添加自增

-- 对于 mediation_archives
ALTER TABLE mediation_archives MODIFY id INT;
ALTER TABLE mediation_archives ADD PRIMARY KEY (id);
ALTER TABLE mediation_archives MODIFY id INT AUTO_INCREMENT;

-- 对于 mediation_applications
ALTER TABLE mediation_applications MODIFY id INT;
ALTER TABLE mediation_applications ADD PRIMARY KEY (id);
ALTER TABLE mediation_applications MODIFY id INT AUTO_INCREMENT;

-- 对于 mediation_applicants
ALTER TABLE mediation_applicants MODIFY id INT;
ALTER TABLE mediation_applicants ADD PRIMARY KEY (id);
ALTER TABLE mediation_applicants MODIFY id INT AUTO_INCREMENT;

-- 对于 mediation_respondents
ALTER TABLE mediation_respondents MODIFY id INT;
ALTER TABLE mediation_respondents ADD PRIMARY KEY (id);
ALTER TABLE mediation_respondents MODIFY id INT AUTO_INCREMENT;

-- 对于 mediation_records
ALTER TABLE mediation_records MODIFY id INT;
ALTER TABLE mediation_records ADD PRIMARY KEY (id);
ALTER TABLE mediation_records MODIFY id INT AUTO_INCREMENT;
