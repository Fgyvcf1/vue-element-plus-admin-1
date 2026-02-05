-- 清理调解表数据问题，然后添加主键和自增
-- 请在数据库管理工具中以root用户执行

-- ========== mediation_archives ==========
-- 先删除重复和null的id记录（或者更新为有效值）
-- 方案1: 删除有问题记录（如果数据不重要）
-- DELETE FROM mediation_archives WHERE id IS NULL;
-- DELETE FROM mediation_archives WHERE id IN (SELECT id FROM (SELECT id FROM mediation_archives GROUP BY id HAVING COUNT(*) > 1) AS t);

-- 方案2: 为null id生成临时值
SET @rownum = 0;
UPDATE mediation_archives SET id = (@rownum := @rownum + 1) WHERE id IS NULL;

-- 如果有重复id，需要手动处理或删除重复记录
-- 先查看重复记录: SELECT id, COUNT(*) FROM mediation_archives GROUP BY id HAVING COUNT(*) > 1;

-- 添加主键和自增（在数据清理后执行）
-- ALTER TABLE mediation_archives ADD PRIMARY KEY (id);
-- ALTER TABLE mediation_archives MODIFY id INT AUTO_INCREMENT;

-- ========== mediation_applications ==========
SET @rownum = 0;
UPDATE mediation_applications SET id = (@rownum := @rownum + 1) WHERE id IS NULL;
-- ALTER TABLE mediation_applications ADD PRIMARY KEY (id);
-- ALTER TABLE mediation_applications MODIFY id INT AUTO_INCREMENT;

-- ========== mediation_applicants ==========
SET @rownum = 0;
UPDATE mediation_applicants SET id = (@rownum := @rownum + 1) WHERE id IS NULL;
-- ALTER TABLE mediation_applicants ADD PRIMARY KEY (id);
-- ALTER TABLE mediation_applicants MODIFY id INT AUTO_INCREMENT;

-- ========== mediation_respondents ==========
SET @rownum = 0;
UPDATE mediation_respondents SET id = (@rownum := @rownum + 1) WHERE id IS NULL;
-- ALTER TABLE mediation_respondents ADD PRIMARY KEY (id);
-- ALTER TABLE mediation_respondents MODIFY id INT AUTO_INCREMENT;
