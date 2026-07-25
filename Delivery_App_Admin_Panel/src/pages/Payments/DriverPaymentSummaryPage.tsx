import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { getDriverPaymentSummary, DriverPaymentSummary } from "../../services/settlement.service";

export default function DriverPaymentSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const [summary, setSummary] = useState<DriverPaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDriverPaymentSummary(id);
        if (!cancelled) setSummary(data);
      } catch (err) {
        console.error("Failed to fetch driver payment summary:", err);
        if (!cancelled) {
          setError("Failed to load payment summary.");
          setSummary(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  };

  const driverName = summary?.driver?.name || summary?.driver?.phone || summary?.driver?.id || "Driver";

  return (
    <>
      <PageMeta
        title={`${driverName} – Payment summary | Delivery App Admin`}
        description="Driver balance and payment breakdown"
      />
      <PageBreadcrumb pageTitle={`Payment summary – ${driverName}`} />
      <div className="space-y-6">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {loading ? (
          <p className="text-gray-600 dark:text-gray-400">Loading…</p>
        ) : summary ? (
          <>
            <ComponentCard
              title="Balance overview"
              desc={`Totals for ${driverName}`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cash to hand over (from deliveries)</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {summary.totalDueFromDeliveries.toFixed(2)} ETB
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total settled</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {summary.totalSettled.toFixed(2)} ETB
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Balance (driver owes admin)</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {summary.balance.toFixed(2)} ETB
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Commission from wallet-paid trips (admin will pay driver)</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {(summary.totalCommissionFromWalletPaid ?? 0).toFixed(2)} ETB
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  to="/payments/settlements"
                  className="text-brand-500 hover:underline text-sm"
                >
                  ← Back to Settlements
                </Link>
                {" · "}
                <Link
                  to="/payments/summary"
                  className="text-brand-500 hover:underline text-sm"
                >
                  All drivers summary
                </Link>
              </div>
            </ComponentCard>

            <ComponentCard
              title="Paid deliveries"
              desc="Deliveries marked as paid (amount due to admin)"
            >
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="p-4 dark:text-white">
                          Delivery ID
                        </TableCell>
                        <TableCell isHeader className="p-4 dark:text-white">
                          Price (ETB)
                        </TableCell>
                        <TableCell isHeader className="p-4 dark:text-white">
                          Commission (ETB)
                        </TableCell>
                        <TableCell isHeader className="p-4 dark:text-white">
                          Amount due to admin (ETB)
                        </TableCell>
                        <TableCell isHeader className="p-4 dark:text-white">
                          Date
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {summary.paidDeliveries.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="px-4 py-3 font-mono text-sm text-gray-700 dark:text-gray-300">
                            {d.id.slice(0, 8)}…
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {Number(d.price).toFixed(2)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {d.driver_commission_amount != null ? Number(d.driver_commission_amount).toFixed(2) : "—"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {d.amount_due_to_admin != null ? Number(d.amount_due_to_admin).toFixed(2) : "—"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {formatDate(d.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {summary.paidDeliveries.length === 0 && (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No paid deliveries
                  </div>
                )}
              </div>
            </ComponentCard>

            <ComponentCard
              title="Settlements"
              desc="Cash handovers recorded for this driver"
            >
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="p-4 dark:text-white">
                          Amount (ETB)
                        </TableCell>
                        <TableCell isHeader className="p-4 dark:text-white">
                          Received at
                        </TableCell>
                        <TableCell isHeader className="p-4 dark:text-white">
                          Notes
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {summary.settlements.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {Number(s.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {formatDate(s.received_at)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {s.notes || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {summary.settlements.length === 0 && (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No settlements recorded
                  </div>
                )}
              </div>
            </ComponentCard>
          </>
        ) : !loading && !summary && !error && id && (
          <p className="text-gray-600 dark:text-gray-400">Driver not found.</p>
        )}
      </div>
    </>
  );
}
