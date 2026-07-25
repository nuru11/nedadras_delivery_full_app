import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import {
  getUserWallet,
  depositToUserWallet,
  UserWalletResponse,
  WalletTransaction,
} from "../../services/userWallet.service";

interface UserWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatType(type: WalletTransaction["type"]) {
  switch (type) {
    case "deposit":
      return "Admin deposit";
    case "adjustment":
      return "Adjustment";
    case "refund":
      return "Refund";
    case "debit_delivery":
      return "Delivery payment";
    default:
      return type;
  }
}

export default function UserWalletModal({
  isOpen,
  onClose,
  userId,
  userName,
}: UserWalletModalProps) {
  const [wallet, setWallet] = useState<UserWalletResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNotes, setDepositNotes] = useState("");
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  const fetchWallet = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserWallet(userId);
      setWallet(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load wallet");
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchWallet();
      setDepositAmount("");
      setDepositNotes("");
      setDepositError(null);
    }
  }, [isOpen, userId]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setDepositError("Enter a valid positive amount");
      return;
    }
    setDepositSubmitting(true);
    setDepositError(null);
    try {
      await depositToUserWallet(userId, amount, depositNotes || undefined);
      setDepositAmount("");
      setDepositNotes("");
      await fetchWallet();
    } catch (err: unknown) {
      setDepositError(
        err instanceof Error ? err.message : "Failed to add credit"
      );
    } finally {
      setDepositSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg m-4">
      <div className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Wallet — {userName}
        </h3>

        {loading && (
          <p className="text-gray-500 dark:text-gray-400">Loading wallet...</p>
        )}
        {error && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {!loading && wallet && (
          <>
            <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current balance
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Number(wallet.balance).toFixed(2)} ETB
              </p>
            </div>

            <div className="mb-6">
              <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Add credit
              </h4>
              <form onSubmit={handleDeposit} className="space-y-3">
                <div>
                  <label
                    htmlFor="wallet-amount"
                    className="mb-1 block text-sm text-gray-600 dark:text-gray-400"
                  >
                    Amount (ETB)
                  </label>
                  <input
                    id="wallet-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="e.g. 500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="wallet-notes"
                    className="mb-1 block text-sm text-gray-600 dark:text-gray-400"
                  >
                    Notes (optional)
                  </label>
                  <input
                    id="wallet-notes"
                    type="text"
                    value={depositNotes}
                    onChange={(e) => setDepositNotes(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="e.g. Top-up"
                  />
                </div>
                {depositError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {depositError}
                  </p>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={depositSubmitting}
                >
                  {depositSubmitting ? "Adding…" : "Add credit"}
                </Button>
              </form>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Recent transactions
              </h4>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                {wallet.transactions.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                    No transactions yet
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {wallet.transactions.map((tx) => (
                      <li
                        key={tx.id}
                        className="flex items-center justify-between px-4 py-2 text-sm"
                      >
                        <div>
                          <span
                            className={
                              Number(tx.amount) >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }
                          >
                            {Number(tx.amount) >= 0 ? "+" : ""}
                            {Number(tx.amount).toFixed(2)} ETB
                          </span>
                          <span className="ml-2 text-gray-500 dark:text-gray-400">
                            {formatType(tx.type)}
                            {tx.notes ? ` — ${tx.notes}` : ""}
                          </span>
                        </div>
                        <span className="text-gray-400 dark:text-gray-500">
                          {formatDate(tx.created_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
