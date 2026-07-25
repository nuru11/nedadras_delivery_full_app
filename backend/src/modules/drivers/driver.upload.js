const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadDir = path.join(__dirname, "../../driver_kyc_img");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const name = `${req.user.sub}_${Date.now()}_${file.fieldname}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: "driver_license", maxCount: 1 },
  { name: "fyda_image_front", maxCount: 1 },
  { name: "fyda_image_back", maxCount: 1 },
  { name: "additional_document", maxCount: 1 },
]);

module.exports = { upload, uploadDir };
