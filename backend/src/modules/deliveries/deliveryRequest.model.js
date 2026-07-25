const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const DeliveryRequest = sequelize.define(
  "DeliveryRequest",
  {
    id: {
      type: DataTypes.BLOB("tiny"), // BINARY(16)
      primaryKey: true,
      allowNull: false,
    },

    delivery_id: {
      type: DataTypes.BLOB("tiny"),
      allowNull: true,
    },

    driver_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("sent", "accepted", "rejected", "timeout"),
      allowNull: false,
      defaultValue: "sent",
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "delivery_requests",
    timestamps: false,
    underscored: true,
  }
);

module.exports = DeliveryRequest;
