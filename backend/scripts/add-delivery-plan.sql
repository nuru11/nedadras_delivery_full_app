-- Add delivery_plan column for Express/Standard/Same Day plans.
-- Run once on existing DB: mysql -u USER -p DB_NAME < scripts/add-delivery-plan.sql

ALTER TABLE deliveries
  ADD COLUMN delivery_plan ENUM('express', 'standard', 'same_day') NULL AFTER receiver_phone;
