-- 修复调解相关表的自增ID问题 - 版本4（id已是主键的情况）
-- 请在数据库管理工具中以root用户执行

-- 方法: 直接添加AUTO_INCREMENT属性（假设id已经是主键）
ALTER TABLE mediation_archives MODIFY id INT AUTO_INCREMENT;
ALTER TABLE mediation_applications MODIFY id INT AUTO_INCREMENT;
ALTER TABLE mediation_applicants MODIFY id INT AUTO_INCREMENT;
ALTER TABLE mediation_respondents MODIFY id INT AUTO_INCREMENT;
ALTER TABLE mediation_records MODIFY id INT AUTO_INCREMENT;
ALTER TABLE mediation_agreements MODIFY id INT AUTO_INCREMENT;
ALTER TABLE archive_attachments MODIFY id INT AUTO_INCREMENT;
ALTER TABLE archive_sequences MODIFY id INT AUTO_INCREMENT;
