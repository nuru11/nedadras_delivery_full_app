const sequelize = require("../../config/db");
const Driver = require("./driver.model");
const User = require("../users/user.model");

const VEHICLE_TYPES = ["bike", "car", "van", "truck"];

function validateVehicleType(value) {
  const s = (value || "").toString().toLowerCase().trim();
  if (!VEHICLE_TYPES.includes(s)) {
    const err = new Error(
      `vehicle_type must be one of: ${VEHICLE_TYPES.join(", ")}`
    );
    err.status = 400;
    throw err;
  }
  return s;
}

/**
 * Submit driver KYC: update Driver record and set User.kyc = true.
 * @param {string} userId - req.user.sub
 * @param {{ plate_number: string, vehicle_type: string }} fields
 * @param {{ driver_license: string, fyda_image_front: string, fyda_image_back: string, additional_document: string }} fileNames - filenames (not full paths) stored in driver_kyc_img
 */
async function submitKyc(userId, fields, fileNames) {
  const plate_number = (fields.plate_number || "").toString().trim();
  if (!plate_number) {
    const err = new Error("plate_number is required");
    err.status = 400;
    throw err;
  }

  const vehicle_type = validateVehicleType(fields.vehicle_type);

  if (
    !fileNames.driver_license ||
    !fileNames.fyda_image_front ||
    !fileNames.fyda_image_back ||
    !fileNames.additional_document
  ) {
    const err = new Error(
      "All documents are required: driver_license, fyda_image_front, fyda_image_back, additional_document"
    );
    err.status = 400;
    throw err;
  }

  const transaction = await sequelize.transaction();

  try {
    const [driver] = await Driver.findOrCreate({
      where: { user_id: userId },
      defaults: {
        vehicle_type,
        plate_number,
        driver_license: fileNames.driver_license,
        fyda_image_front: fileNames.fyda_image_front,
        fyda_image_back: fileNames.fyda_image_back,
        additional_document: fileNames.additional_document,
      },
      transaction,
    });

    if (driver.user_id !== userId) {
      const err = new Error("Driver record mismatch");
      err.status = 403;
      throw err;
    }

    await driver.update(
      {
        plate_number,
        vehicle_type,
        driver_license: fileNames.driver_license,
        fyda_image_front: fileNames.fyda_image_front,
        fyda_image_back: fileNames.fyda_image_back,
        additional_document: fileNames.additional_document,
      },
      { transaction }
    );

    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }
    await user.update({ kyc: true }, { transaction });

    await transaction.commit();

    const updatedUser = await User.findByPk(userId, {
      attributes: ["id", "name", "phone", "role", "status", "kyc"],
    });
    const updatedDriver = await Driver.findOne({
      where: { user_id: userId },
      attributes: [
        "id",
        "user_id",
        "plate_number",
        "vehicle_type",
        "driver_license",
        "fyda_image_front",
        "fyda_image_back",
        "additional_document",
      ],
    });

    return {
      user: updatedUser.toJSON ? updatedUser.toJSON() : updatedUser,
      driver: updatedDriver.toJSON ? updatedDriver.toJSON() : updatedDriver,
    };
  } catch (e) {
    await transaction.rollback();
    throw e;
  }
}

module.exports = { submitKyc, VEHICLE_TYPES };
