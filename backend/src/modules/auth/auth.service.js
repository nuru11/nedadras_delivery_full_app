const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../users/user.model");
const Admin = require("../admins/admin.model");
const Driver = require("../drivers/driver.model");
const AfromessageService = require("../afromessage/afromessage.service");
const { ensureRedisConnected } = require("../../config/redis");
const env = require("../../config/env");

const STATIC_OTP = "2222";
const OTP_TTL_MINUTES = 5;
const OTP_REDIS_TTL_SECONDS = 300; // 5 minutes
const OTP_REDIS_KEY_PREFIX = "otp:";
const ALLOWED_ROLES = ["user", "driver", "admin"];
const CUSTOMER_LEVEL_LABELS = {
  level_1: "Level 1",
  level_2: "Level 2",
  level_3: "Level 3",
};

function normalizePhone(phone) {
  if (phone === null || phone === undefined) {
    return "";
  }

  // Accept numbers as well as strings to avoid runtime errors when clients send
  // phone values as numeric JSON.
  return String(phone).replace(/\s+/g, "");
}

function ensureJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
}

function validateRole(role) {
  if (!role || !ALLOWED_ROLES.includes(role)) {
    const error = new Error(
      `Role must be one of: ${ALLOWED_ROLES.join(", ")}`
    );
    error.status = 400;
    throw error;
  }
}

function formatNameWithCustomerLevel(name, role, customerType) {
  const trimmedName = (name || "").toString().trim();
  const normalizedRole = (role || "").toString().toLowerCase();
  if (!trimmedName) return trimmedName;
  if (normalizedRole !== "user") return trimmedName;

  const levelLabel =
    CUSTOMER_LEVEL_LABELS[(customerType || "").toString().toLowerCase()] ||
    CUSTOMER_LEVEL_LABELS.level_1;

  return `${trimmedName} (${levelLabel})`;
}

async function getUserByPhoneOrThrow(phone) {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    const error = new Error("Phone number is required");
    error.status = 400;
    throw error;
  }

  const user = await User.findOne({ where: { phone: normalizedPhone } });

  if (!user) {
    const error = new Error("User is not registered. Please sign up first.");
    error.status = 404;
    throw error;
  }

  if (user.status === "deleted") {
    const error = new Error("User is not registered. Please sign up first.");
    error.status = 404;
    throw error;
  }

  return user;
}

async function signup({ name, phone, role }) {
  const normalizedPhone = normalizePhone(phone);
  const trimmedName = (name || "").trim();
  const normalizedRole = (role || "").toLowerCase();

  if (!trimmedName) {
    const error = new Error("Name is required");
    error.status = 400;
    throw error;
  }

  if (!normalizedPhone) {
    const error = new Error("Phone number is required");
    error.status = 400;
    throw error;
  }

  validateRole(normalizedRole);

  const existingUser = await User.findOne({ where: { phone: normalizedPhone } });
  if (existingUser) {
    const error = new Error("A user with this phone already exists");
    error.status = 409;
    throw error;
  }

  const user = await User.create({
    name: trimmedName,
    phone: normalizedPhone,
    role: normalizedRole,
  });

  // Create Driver record at signup so delivery creation can create DeliveryRequests for them
  if (normalizedRole === "driver") {
    await Driver.findOrCreate({
      where: { user_id: user.id },
      defaults: { vehicle_type: "car", plate_number: "TBD" },
    });
  }

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    customer_type: user.customer_type,
  };
}

async function requestOtp(phone) {
  const user = await getUserByPhoneOrThrow(phone);
  const normalizedPhone = normalizePhone(phone);
  const redisKey = OTP_REDIS_KEY_PREFIX + normalizedPhone;

  let code;
  let verificationId = null;

  if (env.afromessageFrom) {
    try {
      const result = await AfromessageService.sendOtp(user.phone);
      code = result.code;
      verificationId = result.verificationId;
    } catch (err) {
      // if (process.env.NODE_ENV !== "production") { // comment on production
      //   code = STATIC_OTP;
      //   verificationId = "fallback";
      // } else {

        throw "Something went wrong"; // keep on production
      // } // comment on production
    }
  } else {
    code = STATIC_OTP;
    verificationId = "static";
  }

  const redis = await ensureRedisConnected();
  await redis.setEx(
    redisKey,
    OTP_REDIS_TTL_SECONDS,
    JSON.stringify({ code, verificationId })
  );

  const response = {
    message: "OTP sent successfully",
    phone: user.phone,
    expiresInMinutes: OTP_TTL_MINUTES,
  };

  if (process.env.NODE_ENV !== "production" && code === STATIC_OTP) {
    response.debugOtp = code;
  }

  return response;
}

async function verifyOtp(phone, otp) {
  const normalizedPhone = normalizePhone(phone);
  const otpTrimmed = otp != null ? String(otp).trim() : "";

  if (!normalizedPhone || !otpTrimmed) {
    const error = new Error("Phone number and OTP are required");
    error.status = 400;
    throw error;
  }

  const redisKey = OTP_REDIS_KEY_PREFIX + normalizedPhone;
  const redis = await ensureRedisConnected();
  const stored = await redis.get(redisKey);

  if (!stored) {
    const error = new Error("Invalid or expired OTP");
    error.status = 401;
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(stored);
  } catch {
    const error = new Error("Invalid or expired OTP");
    error.status = 401;
    throw error;
  }

  const storedCode = parsed.code != null ? String(parsed.code).trim() : "";

  if (otpTrimmed !== storedCode) {
    const error = new Error("Invalid OTP");
    error.status = 401;
    throw error;
  }

  await redis.del(redisKey);

  const user = await getUserByPhoneOrThrow(normalizedPhone);

  if (user.role === "driver") {
    await Driver.findOrCreate({
      where: { user_id: user.id },
      defaults: { vehicle_type: "car", plate_number: "TBD" },
    });
  }

  ensureJwtSecret();

  const token = jwt.sign(
    {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user.id,
      phone: user.phone,
      role: user.role,
      name: formatNameWithCustomerLevel(user.name, user.role, user.customer_type),
      status: user.status,
      kyc: user.kyc ?? false,
      customer_type: user.customer_type,
    },
  };
}

async function requestOtpAdmin(phone) {
  const user = await getUserByPhoneOrThrow(phone);
  const role = (user.role || "").toLowerCase();
  if (role !== "admin") {
    const error = new Error("Access denied. Admin role required.");
    error.status = 403;
    throw error;
  }
  return requestOtp(phone);
}

async function verifyOtpAdmin(phone, otp) {
  const result = await verifyOtp(phone, otp);
  const role = (result.user.role || "").toLowerCase();
  if (role !== "admin") {
    const error = new Error("Access denied. Admin role required.");
    error.status = 403;
    throw error;
  }
  return result;
}

async function getCurrentUser(userId) {
  if (!userId) {
    const error = new Error("User id is required");
    error.status = 400;
    throw error;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return {
    id: user.id,
    name: formatNameWithCustomerLevel(user.name, user.role, user.customer_type),
    phone: user.phone,
    role: user.role,
    status: user.status,
    kyc: user.kyc ?? false,
    customer_type: user.customer_type,
  };
}

async function adminLogin(username, password) {
  const trimmedUsername = (username || "").trim();
  const plainPassword = password == null ? "" : String(password);

  if (!trimmedUsername) {
    const error = new Error("Username is required");
    error.status = 400;
    throw error;
  }
  if (!plainPassword) {
    const error = new Error("Password is required");
    error.status = 400;
    throw error;
  }

  const admin = await Admin.findOne({ where: { username: trimmedUsername } });
  if (!admin) {
    const error = new Error("Invalid username or password");
    error.status = 401;
    throw error;
  }

  const match = await bcrypt.compare(plainPassword, admin.password_hash);
  if (!match) {
    const error = new Error("Invalid username or password");
    error.status = 401;
    throw error;
  }

  const adminRole = admin.admin_role || "operations";

  ensureJwtSecret();
  const token = jwt.sign(
    {
      sub: admin.id,
      role: "admin",
      username: admin.username,
      adminRole,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: admin.id,
      username: admin.username,
      name: admin.name ?? null,
      adminRole,
    },
  };
}

async function getCurrentAdmin(adminId) {
  if (!adminId) {
    const error = new Error("Admin id is required");
    error.status = 400;
    throw error;
  }

  const admin = await Admin.findByPk(adminId);
  if (!admin) {
    const error = new Error("Admin not found");
    error.status = 404;
    throw error;
  }

  return {
    id: admin.id,
    username: admin.username,
    name: admin.name ?? null,
    adminRole: admin.admin_role || "operations",
  };
}

async function softDeleteCurrentUser(userId) {
  if (!userId) {
    const error = new Error("User id is required");
    error.status = 400;
    throw error;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  if (user.status === "deleted") {
    return { id: user.id, status: user.status };
  }

  await user.update({ status: "deleted" });
  return { id: user.id, status: user.status };
}

module.exports = {
  signup,
  requestOtp,
  verifyOtp,
  requestOtpAdmin,
  verifyOtpAdmin,
  getCurrentUser,
  adminLogin,
  getCurrentAdmin,
  softDeleteCurrentUser,
};
