-- 修复 committee_members 表的自增ID
ALTER TABLE committee_members MODIFY id INT NOT NULL PRIMARY KEY AUTO_INCREMENT;
