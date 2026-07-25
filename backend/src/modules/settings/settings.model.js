const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Settings = sequelize.define(
  "Settings",
  {
    key: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "settings",
    timestamps: false,
  }
);

module.exports = Settings;
