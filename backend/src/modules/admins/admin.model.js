const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const ADMIN_ROLES = ["super_admin", "operations", "finance"];

const Admin = sequelize.define(
  "Admin",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    admin_role: {
      type: DataTypes.ENUM(...ADMIN_ROLES),
      allowNull: false,
      defaultValue: "operations",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "admins",
    timestamps: false,
    underscored: true,
  }
);

module.exports = Admin;
module.exports.ADMIN_ROLES = ADMIN_ROLES;
