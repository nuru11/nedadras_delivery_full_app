const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const DriverSettlement = sequelize.define(
  "DriverSettlement",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    driver_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "drivers", key: "id" },
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    received_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "driver_settlements",
    timestamps: false,
    underscored: true,
  }
);

module.exports = DriverSettlement;
