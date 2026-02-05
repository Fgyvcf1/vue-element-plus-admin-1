-- 修复调解相关表的自增ID问题 - 版本3
-- 请在数据库管理工具中以root用户执行

-- 只修复实际存在的表
ALTER TABLE mediation_archives MODIFY id INT NOT NULL AUTO_INCREMENT;
ALTER TABLE mediation_applications MODIFY id INT NOT NULL AUTO_INCREMENT;
ALTER TABLE mediation_applicants MODIFY id INT NOT NULL AUTO_INCREMENT;
ALTER TABLE mediation_respondents MODIFY id INT NOT NULL AUTO_INCREMENT;
ALTER TABLE mediation_records MODIFY id INT NOT NULL AUTO_INCREMENT;
ALTER TABLE mediation_agreements MODIFY id INT NOT NULL AUTO_INCREMENT;
ALTER TABLE archive_sequences MODIFY id INT NOT NULL AUTO_INCREMENT;
