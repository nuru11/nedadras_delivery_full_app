import { useEffect, useState } from "react";
import { getRecentPayments } from "../../services/dashboardData.service";
import { AdminRecentPayment } from "../../type/dashboardData";

export default function RecentPayments() {
  const [payments, setPayments] = useState<AdminRecentPayment[]>([]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await getRecentPayments();
        setPayments(res ?? []);
      } catch (err) {
        console.error("Failed to fetch recent payments:", err);
      }
    };
    fetchPayments();
  }, []);

  return (
    <div className="rounded-2xl border bg-white p-5 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-lg font-semibold dark:text-white">
        Recent Payments
      </h3>

      {payments.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No recent payments
        </p>
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex justify-between items-start border-b pb-3 last:border-b-0
                         border-gray-200 dark:border-white/10
                         hover:bg-gray-50 dark:hover:bg-white/5 px-2 rounded-lg transition"
            >
              {/* Left side */}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {p.user?.name ?? "Unknown User"}
                </p>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {p.type.toUpperCase()}
                </span>
              </div>

              {/* Right side */}
              <div className="text-right space-y-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  ETB {Number(p.amount).toLocaleString()}
                </p>

                {p.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {p.description}
                  </p>
                )}

                <span
                  className={`text-xs font-medium ${
                    p.status === "success"
                      ? "text-green-600 dark:text-green-400"
                      : p.status === "failed"
                      ? "text-red-600 dark:text-red-400"
                      : "text-yellow-500 dark:text-yellow-400"
                  }`}
                >
                  {p.status === "success"
                    ? "Success"
                    : p.status === "failed"
                    ? "Failed"
                    : "Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
