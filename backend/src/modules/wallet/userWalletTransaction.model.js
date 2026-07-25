const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const UserWalletTransaction = sequelize.define(
  "UserWalletTransaction",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    type: {
      type: DataTypes.ENUM("deposit", "adjustment", "refund", "debit_delivery"),
      allowNull: false,
    },

    delivery_id: {
      type: DataTypes.BLOB("tiny"),
      allowNull: true,
      references: { model: "deliveries", key: "id" },
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      // Store admin or user id for audit; no FK so admin (from admins table) can be stored
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "user_wallet_transactions",
    timestamps: false,
    underscored: true,
  }
);

module.exports = UserWalletTransaction;
