const AdminService = require("./admin.service");
const WalletService = require("../wallet/wallet.service");
const SettingsService = require("../settings/settings.service");
const { binToUuid } = require("../../utils/uuid");

async function getDashboardOverview(req, res) {
  try {
    const data = await AdminService.getDashboardOverview();
    return res.status(200).json(data);
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to fetch dashboard overview";
    return res.status(status).json({ message });
  }
}

async function getUsers(req, res) {
  try {
    const users = await AdminService.getUsers();
    return res.status(200).json({ users });
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to fetch users";
    return res.status(status).json({ message });
  }
}

async function getAllUsers(req, res) {
  try {
    const page = parseInt(req.query?.page, 10) || 1;
    const limit = parseInt(req.query?.limit, 10) || 20;
    const result = await AdminService.getAllUsers(page, limit);
    return res.status(200).json(result);
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to fetch users";
    return res.status(status).json({ message });
  }
}

async function getDrivers(req, res) {
  try {
    const drivers = await AdminService.getDrivers();
    return res.status(200).json({ drivers });
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to fetch drivers";
    return res.status(status).json({ message });
  }
}

async function getDeliveries(req, res) {
  try {
    const status = req.query?.status || null;
    const ongoing = req.query?.ongoing === "true" || req.query?.ongoing === "1";
    const history = req.query?.history === "true" || req.query?.history === "1";
    const deliveries = await AdminService.getDeliveries(
      status || undefined,
      ongoing,
      history
    );
    return res.status(200).json({ deliveries });
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to fetch deliveries";
    return res.status(status).json({ message });
  }
}

async function createUser(req, res) {
  try {
    const result = await AdminService.createUser(req.body || {});
    return res.status(201).json(result);
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to create user";
    return res.status(status).json({ message });
  }
}

async function createDelivery(req, res) {
  try {
    const result = await AdminService.createDelivery(req.body || {});
    return res.status(201).json(result);
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to create delivery";
    return res.status(status).json({ message });
  }
}

async function createOutsideTownDelivery(req, res) {
  try {
    const result = await AdminService.createOutsideTownDelivery(req.body || {});
    return res.status(201).json(result);
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to create outside-town delivery";
    return res.status(status).json({ message });
  }
}

async function assignDelivery(req, res) {
  try {
    const deliveryId = req.params.id;
    const { driverId } = req.body || {};
    if (!deliveryId || !driverId) {
      return res.status(400).json({
        message: "Delivery id and driverId are required",
      });
    }
    const result = await AdminService.assignDelivery(deliveryId, driverId);
    return res.status(200).json(result);
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to assign delivery";
    return res.status(status).json({ message });
  }
}

async function updateDeliveryStatus(req, res) {
  try {
    const deliveryId = req.params.id;
    const { status } = req.body || {};
    if (!deliveryId || !status) {
      return res.status(400).json({
        message: "Delivery id and status are required",
      });
    }
    const result = await AdminService.updateDeliveryStatus(deliveryId, status);
    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "Failed to update status";
    return res.status(statusCode).json({ message });
  }
}

async function updateDriverStatus(req, res) {
  try {
    const driverId = req.params.id;
    const { status } = req.body || {};

    if (!driverId || !status) {
      return res.status(400).json({
        message: "Driver id and status are required",
      });
    }

    const result = await AdminService.updateDriverStatus(driverId, status);
    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "Failed to update driver status";
    return res.status(statusCode).json({ message });
  }
}

async function updateDriverType(req, res) {
  try {
    const driverId = req.params.id;
    const { driver_type } = req.body || {};

    if (!driverId || !driver_type) {
      return res.status(400).json({
        message: "Driver id and driver_type are required",
      });
    }

    const result = await AdminService.updateDriverType(driverId, driver_type);
    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "Failed to update driver type";
    return res.status(statusCode).json({ message });
  }
}

async function updateUserStatus(req, res) {
  try {
    const userId = req.params.id;
    const { status } = req.body || {};

    if (!userId || !status) {
      return res.status(400).json({
        message: "User id and status are required",
      });
    }

    const result = await AdminService.updateUserStatus(userId, status);
    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "Failed to update user status";
    return res.status(statusCode).json({ message });
  }
}

async function createSettlement(req, res) {
  try {
    const adminUserId = req.user?.sub;
    if (!adminUserId) {
      return res.status(401).json({ message: "User id missing" });
    }
    const result = await AdminService.createSettlement(req.body || {}, adminUserId);
    return res.status(201).json(result);
  } catch (err) {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "Failed to create settlement";
    return res.status(statusCode).json({ message });
  }
}

async function getSettlements(req, res) {
  try {
    const driverId = req.query?.driver_id || null;
    const list = await AdminService.getSettlements({ driver_id: driverId || undefined });
    return res.status(200).json({ settlements: list });
  } catch (err) {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "Failed to fetch settlements";
    return res.status(statusCode).json({ message });
  }
}

async function getDriverPaymentSummary(req, res) {
  try {
    const driverId = req.params.id;
    if (!driverId) {
      return res.status(400).json({ message: "Driver id is required" });
    }
    const result = await AdminService.getDriverPaymentSummary(driverId);
    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "Failed to fetch payment summary";
    return res.status(statusCode).json({ message });
  }
}

async function getAllDriversPaymentSummary(req, res) {
  try {
    const result = await AdminService.getAllDriversPaymentSummary();
    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "Failed to fetch payment summary";
    return res.status(statusCode).json({ message });
  }
}

async function getUserWallet(req, res) {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ message: "User id is required" });
    }
    const balance = await WalletService.getUserWalletBalance(userId);
    const transactions = await WalletService.getUserWalletTransactions(userId, {
      limit: 50,
      offset: 0,
    });
    return res.status(200).json({ balance, transactions });
  } catch (err) {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "Failed to fetch user wallet";
    return res.status(statusCode).json({ message });
  }
}

async function depositToUserWallet(req, res) {
  try {
    const userId = req.params.id;
    const adminUserId = req.user?.sub;
    if (!userId) {
      return res.status(400).json({ message: "User id is required" });
    }
    if (!adminUserId) {
      return res.status(401).json({ message: "Admin user id missing" });
    }
    const { amount, notes } = req.body || {};
    const balance = await WalletService.createAdminDeposit(
      userId,
      amount,
      notes,
      adminUserId
    );
    const transactions = await WalletService.getUserWalletTransactions(userId, {
      limit: 1,
      offset: 0,
    });
    return res.status(200).json({
      balance,
      transaction: transactions[0] || null,
    });
  } catch (err) {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "Failed to deposit to user wallet";
    return res.status(statusCode).json({ message });
  }
}

async function updateDeliveryPayment(req, res) {
  try {
    const deliveryId = req.params.id;
    const { payment } = req.body || {};
    if (!deliveryId) {
      return res.status(400).json({ message: "Delivery id is required" });
    }
    if (!payment) {
      return res.status(400).json({ message: 'payment is required and must be "paid" or "unpaid"' });
    }
    const delivery = await AdminService.updateDeliveryPayment(deliveryId, { payment });
    const data = delivery.toJSON ? delivery.toJSON() : delivery;
    const idStr =
      delivery.id && Buffer.isBuffer(delivery.id) ? binToUuid(delivery.id) : delivery.id;
    return res.status(200).json({ delivery: { ...data, id: idStr } });
  } catch (err) {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "Failed to update delivery payment";
    return res.status(statusCode).json({ message });
  }
}

async function updateDeliveryRemark(req, res) {
  try {
    const deliveryId = req.params.id;
    const { remark } = req.body || {};
    if (!deliveryId) {
      return res.status(400).json({ message: "Delivery id is required" });
    }
    const delivery = await AdminService.updateDeliveryRemark(deliveryId, { remark });
    const data = delivery.toJSON ? delivery.toJSON() : delivery;
    const idStr =
      delivery.id && Buffer.isBuffer(delivery.id) ? binToUuid(delivery.id) : delivery.id;
    return res.status(200).json({ delivery: { ...data, id: idStr } });
  } catch (err) {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "Failed to update delivery remark";
    return res.status(statusCode).json({ message });
  }
}

async function getCommissionRates(req, res) {
  try {
    const rates = await SettingsService.getCommissionRates();
    return res.status(200).json(rates);
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to fetch commission rates";
    return res.status(status).json({ message });
  }
}

async function updateCommissionRates(req, res) {
  try {
    const { in_house, freelancer } = req.body || {};
    const rates = await SettingsService.setCommissionRates({
      ...(in_house != null && { in_house }),
      ...(freelancer != null && { freelancer }),
    });
    return res.status(200).json(rates);
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to update commission rates";
    return res.status(status).json({ message });
  }
}

module.exports = {
  getDashboardOverview,
  getUsers,
  getAllUsers,
  createUser,
  getDrivers,
  getDeliveries,
  createDelivery,
  createOutsideTownDelivery,
  assignDelivery,
  updateDeliveryStatus,
  updateDriverStatus,
  updateUserStatus,
  updateDriverType,
  createSettlement,
  getSettlements,
  getDriverPaymentSummary,
  getAllDriversPaymentSummary,
  getUserWallet,
  depositToUserWallet,
  getCommissionRates,
  updateCommissionRates,
  updateDeliveryPayment,
  updateDeliveryRemark,
};
