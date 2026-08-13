import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import {
  createSettlement,
  getSettlements,
  CreateSettlementBody,
  Settlement,
} from "../../services/settlement.service";
import { getDrivers } from "../../services/driver.service";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function SettlementsPage() {
  const { can } = useAdminAuth();
  const canWriteSettlements = can("settlements:write");
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; name?: string; phone?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [driverFilter, setDriverFilter] = useState<string>("");
  const [form, setForm] = useState<CreateSettlementBody>({
    driver_id: "",
    amount: 0,
    received_at: new Date().toISOString().slice(0, 16),
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const data = await getSettlements(driverFilter || undefined);
      setSettlements(data.settlements ?? []);
    } catch (err) {
      console.error("Failed to fetch settlements:", err);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const data = await getDrivers();
      setDrivers(data.drivers ?? []);
    } catch (err) {
      console.error("Failed to fetch drivers:", err);
      setDrivers([]);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [driverFilter]);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.driver_id || !form.amount || form.amount <= 0) {
      setError("Please select a driver and enter a positive amount.");
      return;
    }
    setSubmitting(true);
    try {
      await createSettlement({
        driver_id: form.driver_id,
        amount: Number(form.amount),
        received_at: form.received_at || undefined,
        notes: form.notes || undefined,
      });
      setSuccess("Settlement recorded successfully.");
      setForm({
        driver_id: "",
        amount: 0,
        received_at: new Date().toISOString().slice(0, 16),
        notes: "",
      });
      fetchSettlements();
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : "Failed to record settlement.";
      setError(message || "Failed to record settlement.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  };

  return (
    <>
      <PageMeta
        title="Settlements | Delivery App Admin"
        description="Record and view driver cash settlements"
      />
      <PageBreadcrumb pageTitle="Settlements" />
      <div className="space-y-6">
        {canWriteSettlements && (
        <ComponentCard
          title="Record settlement"
          desc="Record cash received from a driver (handover)"
        >
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Driver
              </label>
              <select
                required
                value={form.driver_id}
                onChange={(e) => setForm((f) => ({ ...f, driver_id: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">Select driver</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name || d.phone || d.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount (ETB)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.amount || ""}
                onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date received
              </label>
              <input
                type="datetime-local"
                value={form.received_at || ""}
                onChange={(e) => setForm((f) => ({ ...f, received_at: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={form.notes || ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Record settlement"}
            </button>
          </form>
        </ComponentCard>
        )}

        <ComponentCard
          title="Settlements list"
          desc="All recorded cash handovers from drivers"
        >
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by driver
            </label>
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">All drivers</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name || d.phone || d.id}
                </option>
              ))}
            </select>
          </div>
          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading settlements…</p>
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
                        Amount (ETB)
                      </TableCell>
                      <TableCell isHeader className="p-4 dark:text-white">
                        Received at
                      </TableCell>
                      <TableCell isHeader className="p-4 dark:text-white">
                        Recorded by
                      </TableCell>
                      <TableCell isHeader className="p-4 dark:text-white">
                        Notes
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {settlements.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {s.driver_name || s.driver_phone || s.driver_id}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {Number(s.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {formatDate(s.received_at)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {s.created_by_name ?? "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {s.notes || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {settlements.length === 0 && (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  No settlements found
                </div>
              )}
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
