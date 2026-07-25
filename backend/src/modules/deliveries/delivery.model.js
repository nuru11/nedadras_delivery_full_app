const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Delivery = sequelize.define(
  "Delivery",
  {
    id: {
      type: DataTypes.BLOB("tiny"), // for BINARY(16)
      primaryKey: true,
      allowNull: false,
    },

    order_number: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      unique: true,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    driver_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    object_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    weight_kg: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    pickup_lat: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },

    pickup_lng: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },

    pickup_address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    pickup_name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    drop_lat: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },

    drop_lng: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },

    drop_address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    drop_name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    receiver_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    receiver_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    delivery_plan: {
      type: DataTypes.ENUM("express", "standard", "same_day", "outside_town"),
      allowNull: true,
    },

    distance_km: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    payment: {
      type: DataTypes.ENUM("paid", "unpaid"),
      allowNull: false,
      defaultValue: "unpaid",
    },

    driver_commission_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    amount_due_to_admin: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    paid_from_wallet: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    wallet_debit_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    admin_remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "pending",
        "accepted",
        "picked",
        "on_way",
        "delivered",
        "cancelled",
        "failed"
      ),
      allowNull: false,
      defaultValue: "pending",
    },


    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "deliveries",
    timestamps: false,
    underscored: true,
  }
);

module.exports = Delivery;
