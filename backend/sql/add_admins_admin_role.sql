-- Run once on production MySQL before deploying admin role RBAC.
-- Existing panel admins become super_admin.

ALTER TABLE admins
  ADD COLUMN admin_role ENUM('super_admin','operations','finance')
  NOT NULL DEFAULT 'operations'
  AFTER name;

UPDATE admins SET admin_role = 'super_admin';
