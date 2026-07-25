-- Run once on production MySQL before deploying code that uses status='deleted'.
-- Sequelize model update alone does not alter existing ENUM columns.

ALTER TABLE users
  MODIFY COLUMN status ENUM('pending','active','inactive','deleted')
  NOT NULL DEFAULT 'pending';
