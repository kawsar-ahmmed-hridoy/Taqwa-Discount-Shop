ALTER TABLE `audit_logs`
  ADD COLUMN `actorRole` ENUM('OWNER', 'MANAGER', 'STAFF') NULL AFTER `userId`,
  ADD INDEX `audit_logs_actorRole_idx` (`actorRole`);