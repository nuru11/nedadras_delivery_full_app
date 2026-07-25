const DriverService = require("./driver.service");

async function submitKyc(req, res) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "User id missing" });
    }

    const files = req.files;
    if (
      !files?.driver_license?.[0] ||
      !files?.fyda_image_front?.[0] ||
      !files?.fyda_image_back?.[0] ||
      !files?.additional_document?.[0]
    ) {
      return res.status(400).json({
        message:
          "All documents are required: driver_license, fyda_image_front, fyda_image_back, additional_document",
      });
    }

    const plate_number = (req.body?.plate_number || "").toString().trim();
    const vehicle_type = (req.body?.vehicle_type || "").toString().trim();
    if (!plate_number || !vehicle_type) {
      return res.status(400).json({
        message: "plate_number and vehicle_type are required",
      });
    }

    const fileNames = {
      driver_license: files.driver_license[0].filename,
      fyda_image_front: files.fyda_image_front[0].filename,
      fyda_image_back: files.fyda_image_back[0].filename,
      additional_document: files.additional_document[0].filename,
    };

    const result = await DriverService.submitKyc(
      userId,
      { plate_number, vehicle_type },
      fileNames
    );

    return res.status(200).json(result);
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to submit KYC";
    return res.status(status).json({ message });
  }
}

module.exports = { submitKyc };
