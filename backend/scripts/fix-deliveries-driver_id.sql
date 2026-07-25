-- Fix deliveries.driver_id: must be CHAR(36) to match drivers.id (UUID).
-- Run against negadrpt_deliveryapp_name. Run these 3 lines in order.

ALTER TABLE deliveries DROP FOREIGN KEY deliveries_ibfk_2;
ALTER TABLE deliveries MODIFY driver_id CHAR(36) NULL;
ALTER TABLE deliveries ADD CONSTRAINT deliveries_driver_id_fk FOREIGN KEY (driver_id) REFERENCES drivers(id);
