-- Add optional place name columns for display (e.g. "Mexico Square" instead of full address).
-- Run once on existing DB: mysql -u USER -p DB_NAME < scripts/add-delivery-place-names.sql

ALTER TABLE deliveries
  ADD COLUMN pickup_name TEXT NULL AFTER pickup_address,
  ADD COLUMN drop_name TEXT NULL AFTER drop_address;
