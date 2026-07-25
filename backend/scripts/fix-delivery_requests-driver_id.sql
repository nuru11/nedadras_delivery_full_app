-- Fix delivery_requests.driver_id: must be CHAR(36) to match drivers.id (UUID).
-- Run against negadrpt_deliveryapp_name. Run these 3 lines in order.

ALTER TABLE delivery_requests DROP FOREIGN KEY delivery_requests_ibfk_2;
ALTER TABLE delivery_requests MODIFY driver_id CHAR(36) NULL;
ALTER TABLE delivery_requests ADD CONSTRAINT delivery_requests_driver_id_fk FOREIGN KEY (driver_id) REFERENCES drivers(id);
