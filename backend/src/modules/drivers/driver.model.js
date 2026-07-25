const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const User = require("../users/user.model"); // for relation

const Driver = sequelize.define(
  "Driver",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    vehicle_type: {
      type: DataTypes.ENUM("bike", "car", "van", "truck"),
      allowNull: false,
    },

    plate_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    fyda_image_front: {
      type: DataTypes.STRING(255), // image path / URL
      allowNull: true,
    },

    fyda_image_back: {
      type: DataTypes.STRING(255), // image path / URL
      allowNull: true,
    },

    driver_license: {
      type: DataTypes.STRING(255), // image path / URL
      allowNull: true,
    },

    additional_document: {
      type: DataTypes.STRING(255), // image path / URL
      allowNull: true,
    },

    is_online: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    rating_avg: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
    },

    driver_type: {
      type: DataTypes.ENUM("in_house", "freelancer"),
      allowNull: false,
      defaultValue: "freelancer",
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "drivers",
    timestamps: false,
    underscored: true,
  }
);

// Optional association (recommended)
Driver.belongsTo(User, { foreignKey: "user_id" });

module.exports = Driver;
