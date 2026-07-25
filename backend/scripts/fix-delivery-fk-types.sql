-- Fix foreign key type mismatch: users.id and drivers.id are CHAR(36) (UUID),
-- but deliveries/delivery_requests had BINARY(16) for user_id/driver_id.
-- Run against your MySQL DB (e.g. negadrpt_deliveryapp_name).
-- If a DROP fails (e.g. constraint already dropped/renamed), skip that line and run MODIFY + ADD only.
-- If ADD fails (constraint already exists), skip the ADD line.

-- ========== 1) deliveries.user_id → users.id (CHAR(36)) ==========
ALTER TABLE deliveries DROP FOREIGN KEY deliveries_ibfk_1;
ALTER TABLE deliveries MODIFY user_id CHAR(36) NULL;
ALTER TABLE deliveries ADD CONSTRAINT deliveries_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id);

-- ========== 2) deliveries.driver_id → drivers.id (CHAR(36)) ==========
ALTER TABLE deliveries DROP FOREIGN KEY deliveries_ibfk_2;
ALTER TABLE deliveries MODIFY driver_id CHAR(36) NULL;
ALTER TABLE deliveries ADD CONSTRAINT deliveries_driver_id_fk FOREIGN KEY (driver_id) REFERENCES drivers(id);

-- ========== 3) delivery_requests.driver_id → drivers.id (CHAR(36)) ==========
ALTER TABLE delivery_requests DROP FOREIGN KEY delivery_requests_ibfk_2;
ALTER TABLE delivery_requests MODIFY driver_id CHAR(36) NULL;
ALTER TABLE delivery_requests ADD CONSTRAINT delivery_requests_driver_id_fk FOREIGN KEY (driver_id) REFERENCES drivers(id);
