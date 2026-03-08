-- 机构管理（committee_members）MariaDB schema
-- 执行库：village

USE `village`;

CREATE TABLE IF NOT EXISTS `committee_members` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `resident_id` BIGINT NOT NULL,
  `organization_type` VARCHAR(64) NOT NULL COMMENT '机构类型',
  `term_number` VARCHAR(32) NOT NULL COMMENT '届次',
  `term_start_date` DATE NOT NULL,
  `term_end_date` DATE NULL,
  `position` VARCHAR(64) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'current' COMMENT 'current/history',
  `remarks` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_committee_members_resident_id` (`resident_id`),
  KEY `idx_committee_members_org_type` (`organization_type`),
  KEY `idx_committee_members_status` (`status`),
  KEY `idx_committee_members_term_number` (`term_number`),
  KEY `idx_committee_members_org_term` (`organization_type`, `term_number`),
  CONSTRAINT `fk_committee_members_resident`
    FOREIGN KEY (`resident_id`) REFERENCES `residents` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

