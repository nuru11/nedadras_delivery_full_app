const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const DeliveryOrderSequence = sequelize.define(
  "DeliveryOrderSequence",
  {
    name: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "delivery_order_sequence",
    timestamps: false,
  }
);

module.exports = DeliveryOrderSequence;
