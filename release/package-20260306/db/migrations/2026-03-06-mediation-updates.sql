-- 2026-03-06 mediation release database updates
-- Purpose: make dictionaries.id and archive_files.id AUTO_INCREMENT primary keys
-- Notes:
-- 1) Run on the target database (USE village;).
-- 2) This script is safe to re-run; it only adds PKs if missing.
-- 3) If there are duplicate ids, the ALTER ADD PRIMARY KEY will fail. Resolve duplicates first.

START TRANSACTION;

-- dictionaries
SET @dict_has_pk := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'dictionaries'
    AND CONSTRAINT_TYPE = 'PRIMARY KEY'
);

SET @dict_max := (SELECT IFNULL(MAX(id), 0) FROM dictionaries);
SET @row := @dict_max;
UPDATE dictionaries
SET id = (@row := @row + 1)
WHERE id IS NULL;

SET @sql := IF(@dict_has_pk = 0, 'ALTER TABLE dictionaries ADD PRIMARY KEY (id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE dictionaries MODIFY COLUMN id INT(11) NOT NULL AUTO_INCREMENT;

-- archive_files
SET @af_has_pk := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'archive_files'
    AND CONSTRAINT_TYPE = 'PRIMARY KEY'
);

SET @af_max := (SELECT IFNULL(MAX(id), 0) FROM archive_files);
SET @row := @af_max;
UPDATE archive_files
SET id = (@row := @row + 1)
WHERE id IS NULL;

SET @sql := IF(@af_has_pk = 0, 'ALTER TABLE archive_files ADD PRIMARY KEY (id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE archive_files MODIFY COLUMN id INT(11) NOT NULL AUTO_INCREMENT;

COMMIT;
