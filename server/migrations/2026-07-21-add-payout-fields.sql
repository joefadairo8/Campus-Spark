-- Migration: Add payout fields to User table if they do not exist
ALTER TABLE `User`
  ADD COLUMN IF NOT EXISTS `phoneNumber` VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `accountName` VARCHAR(128) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `accountNumber` VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `bankCode` VARCHAR(32) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `bankName` VARCHAR(128) DEFAULT NULL;

-- Note: MySQL older versions do not support IF NOT EXISTS on ADD COLUMN. If your MySQL
-- version does not support it, run the following checks before altering:
-- ALTER TABLE `User` ADD COLUMN `accountNumber` VARCHAR(64) DEFAULT NULL;
-- Use your migration tooling or run these statements manually.
