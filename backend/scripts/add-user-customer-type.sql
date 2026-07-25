ALTER TABLE users
ADD COLUMN IF NOT EXISTS customer_type ENUM('level_1', 'level_2', 'level_3') NOT NULL DEFAULT 'level_1';
