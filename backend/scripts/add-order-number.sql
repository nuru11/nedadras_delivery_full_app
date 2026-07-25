-- ============================================================
-- Add 6-digit order_number to deliveries
-- Run this on your MySQL database (e.g. production) if you do
-- not use sequelize.sync() there.
-- ============================================================

-- 1. Add order_number column to deliveries (allow 0 for existing rows; backfill next)
ALTER TABLE deliveries
  ADD COLUMN order_number INT UNSIGNED NOT NULL DEFAULT 0 AFTER id;

-- 2. Create unique index (after backfill we enforce uniqueness)
--    Skip this until after step 3 backfill, then run:
-- ALTER TABLE deliveries ADD UNIQUE KEY deliveries_order_number_unique (order_number);

-- 3. Backfill existing rows: assign 1, 2, 3, ... by created_at
SET @rownum := 0;
UPDATE deliveries
  SET order_number = (@rownum := @rownum + 1)
  ORDER BY created_at ASC;

-- 4. Add unique constraint now that all rows have distinct order_number
ALTER TABLE deliveries ADD UNIQUE KEY deliveries_order_number_unique (order_number);

-- 5. Create sequence table for new order numbers
CREATE TABLE IF NOT EXISTS delivery_order_sequence (
  name VARCHAR(64) NOT NULL PRIMARY KEY,
  value INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Seed sequence to "next" value (max order_number + 1)
INSERT IGNORE INTO delivery_order_sequence (name, value) VALUES ('delivery_order_number', 1);
UPDATE delivery_order_sequence s
  SET s.value = (SELECT COALESCE(MAX(d.order_number), 0) + 1 FROM deliveries d)
  WHERE s.name = 'delivery_order_number';
