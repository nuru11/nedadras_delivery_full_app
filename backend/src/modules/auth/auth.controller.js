const AuthService = require("./auth.service");
const User = require("../users/user.model");

function formatError(error) {
  const isProduction = process.env.NODE_ENV === "production";
  const status = Number.isInteger(error?.status) ? error.status : 500;
  const fallbackMessage = "Something went wrong, please try again later.";

  // In production, keep 5xx errors generic. In development, expose the real message
  // to speed up debugging (and also log the full error server-side).
  const message =
    status >= 500 && isProduction ? fallbackMessage : error?.message || fallbackMessage;

  return { status, message };
}

async function signup(req, res) {
  try {
    const { name, phone, role } = req.body;

    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(409).json({ error: "Phone number already registered" });
    }
    
    const user = await AuthService.signup({ name, phone, role });

    return res.status(201).json({
      message: "Signup successful",
      user,
    });
  } catch (error) {
    const formatted = formatError(error);
    return res.status(formatted.status).json({ message: formatted.message });
  }
}

async function login(req, res) {
  console.log("Login called", {
    phone: req?.body?.phone,
    phoneType: typeof req?.body?.phone,
  });

  try {
    const phone = req?.body?.phone;
    if (phone === undefined || phone === null || String(phone).trim() === "") {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // OTP-based login: request an OTP for an existing user.
    const result = await AuthService.requestOtp(phone);

    const response = {
      message: "OTP sent successfully",
      phone: result.phone,
      expiresInMinutes: result.expiresInMinutes,
    };

    if (process.env.NODE_ENV !== "production" && result.debugOtp != null) {
      response.debugOtp = result.debugOtp;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Login failed:", error);
    const formatted = formatError(error);
    return res.status(formatted.status).json({ message: formatted.message });
  }
}

async function verifyLogin(req, res) {
  console.log("Verify Login called");

  try {
    const phone = req?.body?.phone;
    const otp = req?.body?.otp;

    if (phone === undefined || phone === null || String(phone).trim() === "") {
      return res.status(400).json({ message: "Phone number is required" });
    }

    if (otp === undefined || otp === null || String(otp).trim() === "") {
      return res.status(400).json({ message: "OTP is required" });
    }

    console.log("phonennnnnnnn: ", phone);
    console.log("otpnnnnnnnn: ", otp);

    const { token, user } = await AuthService.verifyOtp(phone, otp);

    return res.status(200).json({ token, user });
  } catch (error) {
    console.error("Verify Login failed:", error);
    const formatted = formatError(error);
    return res.status(formatted.status).json({ message: formatted.message });
  }
}

async function requestOtp(req, res) {
  console.log("Request OTP called", {
    phone: req?.body?.phone,
    phoneType: typeof req?.body?.phone,
  });
  try {
    const phone = req?.body?.phone;
    if (phone === undefined || phone === null || String(phone).trim() === "") {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const result = await AuthService.requestOtp(phone);

    const response = {
      message: result.message,
      phone: result.phone,
      expiresInMinutes: result.expiresInMinutes,
    };

    if (process.env.NODE_ENV !== "production" && result.debugOtp != null) {
      response.debugOtp = result.debugOtp;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Request OTP failed:", error);
    const formatted = formatError(error);
    return res.status(formatted.status).json({ message: formatted.message });
  }
}

async function verifyOtp(req, res) {
  console.log("Verify OTP called");
  try {
    const phone = req?.body?.phone;
    const otp = req?.body?.otp;

    if (phone === undefined || phone === null || String(phone).trim() === "") {
      return res.status(400).json({ message: "Phone number is required" });
    }

    if (otp === undefined || otp === null || String(otp).trim() === "") {
      return res.status(400).json({ message: "OTP is required" });
    }

    const { token, user } = await AuthService.verifyOtp(phone, otp);

    console.log(
      "OTP verified successfully for phone:",
      phone,
      "User ID:",
      user.id,
      "Token generated."
    );

    return res.status(200).json({
      token,
      user,
    });
  } catch (error) {
    console.error("Verify OTP failed:", error);
    const formatted = formatError(error);
    return res.status(formatted.status).json({ message: formatted.message });
  }
}

async function requestOtpAdmin(req, res) {
  try {
    const phone = req?.body?.phone;
    if (phone === undefined || phone === null || String(phone).trim() === "") {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const result = await AuthService.requestOtpAdmin(phone);

    const response = {
      message: result.message,
      phone: result.phone,
      expiresInMinutes: result.expiresInMinutes,
    };

    if (process.env.NODE_ENV !== "production") {
      response.debugOtp = result.otp;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Admin request OTP failed:", error);
    const formatted = formatError(error);
    return res.status(formatted.status).json({ message: formatted.message });
  }
}

async function verifyOtpAdmin(req, res) {
  try {
    const phone = req?.body?.phone;
    const otp = req?.body?.otp;

    if (phone === undefined || phone === null || String(phone).trim() === "") {
      return res.status(400).json({ message: "Phone number is required" });
    }

    if (otp === undefined || otp === null || String(otp).trim() === "") {
      return res.status(400).json({ message: "OTP is required" });
    }

    const { token, user } = await AuthService.verifyOtpAdmin(phone, otp);

    return res.status(200).json({ token, user });
  } catch (error) {
    console.error("Admin verify OTP failed:", error);
    const formatted = formatError(error);
    return res.status(formatted.status).json({ message: formatted.message });
  }
}

async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;
    const result = await AuthService.adminLogin(username, password);
    return res.status(200).json(result);
  } catch (error) {
    const formatted = formatError(error);
    return res.status(formatted.status).json({ message: formatted.message });
  }
}

async function me(req, res) {
  try {
    const sub = req.user?.sub;
    if (!sub) {
      return res.status(401).json({ message: "User id missing" });
    }

    if (req.user?.role === "admin") {
      const user = await AuthService.getCurrentAdmin(sub);
      return res.status(200).json({ user });
    }

    const user = await AuthService.getCurrentUser(sub);
    return res.status(200).json({ user });
  } catch (error) {
    const formatted = formatError(error);
    return res.status(formatted.status).json({ message: formatted.message });
  }
}

async function deleteMe(req, res) {
  try {
    const sub = req.user?.sub;
    if (!sub) {
      return res.status(401).json({ message: "User id missing" });
    }

    if (req.user?.role === "admin") {
      return res
        .status(403)
        .json({ message: "Admin accounts cannot be deleted via this endpoint" });
    }

    const result = await AuthService.softDeleteCurrentUser(sub);
    return res.status(200).json({ message: "Account deleted", user: result });
  } catch (error) {
    const formatted = formatError(error);
    return res.status(formatted.status).json({ message: formatted.message });
  }
}

module.exports = {
  signup,
  login,
  verifyLogin,
  requestOtp,
  verifyOtp,
  requestOtpAdmin,
  verifyOtpAdmin,
  adminLogin,
  me,
  deleteMe,
};
