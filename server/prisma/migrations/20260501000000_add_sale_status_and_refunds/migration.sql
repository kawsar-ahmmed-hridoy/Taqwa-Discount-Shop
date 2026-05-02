-- Add SaleStatus enum columns
ALTER TABLE `sales` ADD COLUMN `status` ENUM('COMPLETED', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE `sales` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `sales` ADD INDEX `idx_sales_status` (`status`);

-- Create Refund table
CREATE TABLE `refunds` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `saleId` INT NOT NULL,
  `reason` VARCHAR(191) NOT NULL,
  `amount` DOUBLE NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED') NOT NULL DEFAULT 'PENDING',
  `approvedBy` INT,
  `processedAt` DATETIME(3),
  `notes` LONGTEXT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `refunds_saleId_idx` (`saleId`),
  INDEX `refunds_status_idx` (`status`),
  INDEX `refunds_createdAt_idx` (`createdAt`),
  CONSTRAINT `refunds_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `refunds_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL
);
