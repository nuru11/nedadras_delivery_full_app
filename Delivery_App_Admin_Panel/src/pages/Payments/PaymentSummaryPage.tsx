import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { getAllDriversPaymentSummary, DriverPaymentSummary } from "../../services/settlement.service";

export default function PaymentSummaryPage() {
  const [summaries, setSummaries] = useState<DriverPaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getAllDriversPaymentSummary();
        if (!cancelled) setSummaries(data.drivers ?? []);
      } catch (err) {
        console.error("Failed to fetch payment summary:", err);
        if (!cancelled) setSummaries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <PageMeta
        title="Payment summary | Delivery App Admin"
        description="Driver balances and payment overview"
      />
      <PageBreadcrumb pageTitle="Payment summary" />
      <div className="space-y-6">
        <ComponentCard
          title="All drivers – payment summary"
          desc="Total due from deliveries, total settled, and balance per driver (positive = driver owes admin)"
        >
          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading…</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="p-4 dark:text-white">
                        Driver
                      </TableCell>
                      <TableCell isHeader className="p-4 dark:text-white">
                        Total due (ETB)
                      </TableCell>
                      <TableCell isHeader className="p-4 dark:text-white">
                        Total settled (ETB)
                      </TableCell>
                      <TableCell isHeader className="p-4 dark:text-white">
                        Balance (ETB)
                      </TableCell>
                      <TableCell isHeader className="p-4 dark:text-white">
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {summaries.map((s) => (
                      <TableRow key={s.driver.id}>
                        <TableCell className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {s.driver.name || s.driver.phone || s.driver.id}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {s.totalDueFromDeliveries.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {s.totalSettled.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {s.balance.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Link
                            to={`/payments/driver/${s.driver.id}`}
                            className="text-brand-500 hover:underline text-sm"
                          >
                            View details
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {summaries.length === 0 && (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  No drivers found
                </div>
              )}
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
