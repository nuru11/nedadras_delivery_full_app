const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },

    role: {
      type: DataTypes.ENUM("user", "driver", "admin"),
      allowNull: false,
      defaultValue: "user",
    },

    status: {
      type: DataTypes.ENUM("pending", "active", "inactive", "deleted"),
      allowNull: false,
      defaultValue: "pending",
    },

    kyc: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    customer_type: {
      type: DataTypes.ENUM("level_1", "level_2", "level_3"),
      allowNull: false,
      defaultValue: "level_1",
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "users",
    timestamps: false, // because you already use created_at manually
    underscored: true,
  }
);

module.exports = User;
