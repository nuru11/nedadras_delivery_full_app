const WalletService = require("./wallet.service");

async function getMyWallet(req, res) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "User id missing" });
    }
    const balance = await WalletService.getUserWalletBalance(userId);
    const transactions = await WalletService.getUserWalletTransactions(userId, {
      limit: 20,
      offset: 0,
    });
    return res.status(200).json({ balance, transactions });
  } catch (err) {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "Failed to fetch wallet";
    return res.status(statusCode).json({ message });
  }
}

module.exports = {
  getMyWallet,
};
