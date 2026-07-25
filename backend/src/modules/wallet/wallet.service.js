const { fn, col } = require("sequelize");
const sequelize = require("../../config/db");
const UserWalletTransaction = require("./userWalletTransaction.model");
const User = require("../users/user.model");
const Delivery = require("../deliveries/delivery.model");
const { binToUuid } = require("../../utils/uuid");

/**
 * Get current wallet balance for a user (sum of all transaction amounts).
 */
async function getUserWalletBalance(userId) {
  if (!userId) return 0;
  const result = await UserWalletTransaction.findAll({
    where: { user_id: userId },
    attributes: [[fn("COALESCE", fn("SUM", col("amount")), 0), "total"]],
    raw: true,
  });
  const total = result?.[0]?.total;
  return total != null ? parseFloat(String(total)) : 0;
}

/**
 * Get paginated wallet transactions for a user.
 */
async function getUserWalletTransactions(userId, options = {}) {
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
  const offset = Math.max(0, Number(options.offset) || 0);
  const rows = await UserWalletTransaction.findAll({
    where: { user_id: userId },
    order: [["created_at", "DESC"]],
    limit,
    offset,
    raw: true,
  });
  return rows.map((r) => {
    const out = { ...r };
    if (out.delivery_id && Buffer.isBuffer(out.delivery_id)) {
      out.delivery_id = binToUuid(out.delivery_id);
    }
    return out;
  });
}

/**
 * Admin deposit: add a positive amount to user wallet.
 */
async function createAdminDeposit(userId, amount, notes, adminUserId) {
  const amt = parseFloat(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    const err = new Error("amount must be a positive number");
    err.status = 400;
    throw err;
  }
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  const rounded = Math.round(amt * 100) / 100;
  await UserWalletTransaction.create({
    user_id: userId,
    amount: rounded,
    type: "deposit",
    delivery_id: null,
    notes: (notes || "").toString().trim() || null,
    // created_by FK references users; admin id is from admins table so pass null to avoid FK violation
    created_by: null,
  });
  return getUserWalletBalance(userId);
}

/**
 * Debit user wallet for a delivery (used when paying from wallet).
 * Must be called inside a transaction; validates sufficient balance.
 */
async function debitForDelivery(userId, deliveryIdBin, amount, transaction) {
  const amt = parseFloat(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    const err = new Error("amount must be a positive number");
    err.status = 400;
    throw err;
  }
  const balance = await getUserWalletBalance(userId);
  const rounded = Math.round(amt * 100) / 100;
  if (balance < rounded) {
    const err = new Error("Insufficient wallet balance");
    err.status = 400;
    throw err;
  }
  await UserWalletTransaction.create(
    {
      user_id: userId,
      amount: -rounded,
      type: "debit_delivery",
      delivery_id: deliveryIdBin,
      notes: null,
      created_by: null,
    },
    { transaction }
  );
  return rounded;
}

/**
 * Credit user wallet for a delivery (refund when a wallet-paid trip is reverted to unpaid).
 * Must be called inside a transaction.
 */
async function creditForDelivery(userId, deliveryIdBin, amount, transaction) {
  const amt = parseFloat(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    const err = new Error("amount must be a positive number");
    err.status = 400;
    throw err;
  }
  const rounded = Math.round(amt * 100) / 100;
  await UserWalletTransaction.create(
    {
      user_id: userId,
      amount: rounded,
      type: "refund",
      delivery_id: deliveryIdBin,
      notes: null,
      created_by: null,
    },
    { transaction }
  );
  return rounded;
}

module.exports = {
  getUserWalletBalance,
  getUserWalletTransactions,
  createAdminDeposit,
  debitForDelivery,
  creditForDelivery,
};
