-- 修复调解相关表 - 先添加主键，再添加自增
-- 请在数据库管理工具中以root用户执行

-- 步骤1: 先添加主键（如果id列有重复值，需要先清理）
ALTER TABLE mediation_archives ADD PRIMARY KEY (id);
ALTER TABLE mediation_applications ADD PRIMARY KEY (id);
ALTER TABLE mediation_applicants ADD PRIMARY KEY (id);
ALTER TABLE mediation_respondents ADD PRIMARY KEY (id);
ALTER TABLE mediation_records ADD PRIMARY KEY (id);

-- 步骤2: 再添加自增属性
ALTER TABLE mediation_archives MODIFY id INT AUTO_INCREMENT;
ALTER TABLE mediation_applications MODIFY id INT AUTO_INCREMENT;
ALTER TABLE mediation_applicants MODIFY id INT AUTO_INCREMENT;
ALTER TABLE mediation_respondents MODIFY id INT AUTO_INCREMENT;
ALTER TABLE mediation_records MODIFY id INT AUTO_INCREMENT;
