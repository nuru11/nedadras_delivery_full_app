import { useEffect, useState, useCallback } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import {
  getHistoryDeliveries,
  Delivery,
  updateDeliveryPayment,
  updateDeliveryRemark,
} from "../../services/delivery.service";

const STATUS_COLORS: Record<
  string,
  "primary" | "success" | "error" | "warning"
> = {
  delivered: "success",
  cancelled: "error",
};

const STATUS_LABELS: Record<string, string> = {
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function pickupDisplay(d: Delivery): string {
  return d.pickup_name?.trim() ? d.pickup_name : d.pickup_address || "—";
}

function dropDisplay(d: Delivery): string {
  return d.drop_name?.trim() ? d.drop_name : d.drop_address || "—";
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso || "—";
  }
}

function paymentLabel(d: Delivery): string {
  if (d.payment === "paid") {
    return d.paid_from_wallet ? "Paid (Wallet)" : "Paid (Cash)";
  }
  return "Unpaid";
}

export default function TripsHistoryScreen() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const detailModal = useModal(false);
  const [detailDelivery, setDetailDelivery] = useState<Delivery | null>(null);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [savingRemark, setSavingRemark] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [remarkDraft, setRemarkDraft] = useState<string>("");

  const handleOpenDetail = (d: Delivery) => {
    setDetailDelivery(d);
    setRemarkDraft(d.admin_remark ?? "");
    setPaymentMessage(null);
    detailModal.openModal();
  };

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHistoryDeliveries();
      setDeliveries(data.deliveries);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch trip history:", err);
      setDeliveries([]);
      setError("Failed to load trip history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Completed and cancelled trips
        </p>
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">
            {error}
          </p>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={fetchDeliveries}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {loading && deliveries.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">
          Loading trip history...
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Order #
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    ID
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Pickup
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Dropoff
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Status
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Payment
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Price
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Requester
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Driver
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Completed
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {deliveries.map((d) => (
                  <TableRow
                    key={d.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.04] cursor-pointer"
                    onClick={() => handleOpenDetail(d)}
                  >
                    <TableCell className="px-4 py-3 font-mono text-sm text-gray-700 dark:text-gray-300">
                      {String(d.order_number ?? 0).padStart(6, "0")}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {d.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell
                      className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[180px] truncate"
                      title={pickupDisplay(d)}
                    >
                      {pickupDisplay(d)}
                    </TableCell>
                    <TableCell
                      className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[180px] truncate"
                      title={dropDisplay(d)}
                    >
                      {dropDisplay(d)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        size="sm"
                        color={STATUS_COLORS[d.status] || "primary"}
                      >
                        {STATUS_LABELS[d.status] ?? d.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        size="sm"
                      color={d.payment === "paid" ? "success" : "warning"}
                      >
                      {paymentLabel(d)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {d.price} ETB
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {d.user?.name || "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {d.driver?.name || "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(d.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {deliveries.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              No trip history
            </div>
          )}
        </div>
      )}

      {/* Trip Detail Modal */}
      <Modal
        isOpen={detailModal.isOpen}
        onClose={() => {
          detailModal.closeModal();
          setDetailDelivery(null);
          setPaymentMessage(null);
        }}
      >
        <div className="max-w-lg p-6 dark:bg-gray-900 rounded-3xl">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Trip details
          </h3>
          {paymentMessage && (
            <div
              className={`mb-4 rounded-lg p-3 text-sm ${
                paymentMessage.type === "error"
                  ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                  : "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
              }`}
            >
              {paymentMessage.text}
            </div>
          )}
          {detailDelivery && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Order #</span>
                <span className="font-mono text-gray-800 dark:text-gray-200">{String(detailDelivery.order_number ?? 0).padStart(6, "0")}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">ID</span>
                <span className="font-mono text-gray-800 dark:text-gray-200 truncate max-w-[240px]" title={detailDelivery.id}>{detailDelivery.id}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <Badge size="sm" color={STATUS_COLORS[detailDelivery.status] || "primary"}>
                  {STATUS_LABELS[detailDelivery.status] ?? detailDelivery.status}
                </Badge>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Payment</span>
                <Badge
                  size="sm"
                  color={detailDelivery.payment === "paid" ? "success" : "warning"}
                >
                  {paymentLabel(detailDelivery)}
                </Badge>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Price</span>
                <span className="text-gray-800 dark:text-gray-200">{detailDelivery.price} ETB</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Distance</span>
                <span className="text-gray-800 dark:text-gray-200">{detailDelivery.distance_km} km</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Object type</span>
                <span className="text-gray-800 dark:text-gray-200">{detailDelivery.object_type}</span>
              </div>
              {detailDelivery.weight_kg != null && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Weight</span>
                  <span className="text-gray-800 dark:text-gray-200">{detailDelivery.weight_kg} kg</span>
                </div>
              )}
              {detailDelivery.description && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Description</span>
                  <span className="text-gray-800 dark:text-gray-200 text-right max-w-[240px]">{detailDelivery.description}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500 dark:text-gray-400 block mb-1">Admin remark</span>
                <textarea
                  value={remarkDraft}
                  onChange={(e) => setRemarkDraft(e.target.value)}
                  placeholder="Add an internal remark for this trip (visible only in admin panel)"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={async () => {
                    if (!detailDelivery) return;
                    setSavingRemark(true);
                    setPaymentMessage(null);
                    try {
                      const { delivery } = await updateDeliveryRemark(detailDelivery.id, remarkDraft);
                      setDetailDelivery(delivery);
                      await fetchDeliveries();
                      setPaymentMessage({ type: "success", text: "Remark saved." });
                    } catch (err: unknown) {
                      const ax = err as { response?: { data?: { message?: string } } };
                      const msg = ax?.response?.data?.message || "Failed to save remark";
                      setPaymentMessage({ type: "error", text: msg });
                    } finally {
                      setSavingRemark(false);
                    }
                  }}
                  disabled={savingRemark}
                >
                  {savingRemark ? "Saving..." : "Save remark"}
                </Button>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 block mb-1">Pickup</span>
                <p className="text-gray-800 dark:text-gray-200">
                  {detailDelivery.pickup_name?.trim() ? detailDelivery.pickup_name : null}
                  {detailDelivery.pickup_name?.trim() && detailDelivery.pickup_address ? " – " : null}
                  {detailDelivery.pickup_address || "—"}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 block mb-1">Dropoff</span>
                <p className="text-gray-800 dark:text-gray-200">
                  {detailDelivery.drop_name?.trim() ? detailDelivery.drop_name : null}
                  {detailDelivery.drop_name?.trim() && detailDelivery.drop_address ? " – " : null}
                  {detailDelivery.drop_address || "—"}
                </p>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Requester</span>
                <span className="text-gray-800 dark:text-gray-200">
                  {detailDelivery.user?.name || "—"}
                  {detailDelivery.user?.phone ? ` (${detailDelivery.user.phone})` : ""}
                </span>
              </div>
              {(detailDelivery.receiver_name || detailDelivery.receiver_phone) && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Receiver</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {detailDelivery.receiver_name || "—"}
                    {detailDelivery.receiver_name && detailDelivery.receiver_phone ? " · " : ""}
                    {detailDelivery.receiver_phone || ""}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Driver</span>
                <span className="text-gray-800 dark:text-gray-200">
                  {detailDelivery.driver?.name || "—"}
                  {detailDelivery.driver?.phone ? ` (${detailDelivery.driver.phone})` : ""}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Completed</span>
                <span className="text-gray-800 dark:text-gray-200">
                  {detailDelivery.created_at ? formatDate(detailDelivery.created_at) : "—"}
                </span>
              </div>
              <div className="pt-4 flex flex-col gap-3">
                <div className="flex justify-end gap-2">
                  {detailDelivery.status === "delivered" && detailDelivery.payment !== "paid" && detailDelivery.user_id && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!detailDelivery) return;
                        setUpdatingPayment(true);
                        setPaymentMessage(null);
                        try {
                          const { delivery } = await updateDeliveryPayment(detailDelivery.id, "paid");
                          setDetailDelivery(delivery);
                          await fetchDeliveries();
                          setPaymentMessage({ type: "success", text: "Trip marked as paid (wallet)." });
                        } catch (err: unknown) {
                          const ax = err as { response?: { data?: { message?: string } } };
                          const msg =
                            ax?.response?.data?.message || "Failed to mark as paid";
                          setPaymentMessage({ type: "error", text: msg });
                        } finally {
                          setUpdatingPayment(false);
                        }
                      }}
                      disabled={updatingPayment}
                    >
                      {updatingPayment ? "Updating..." : "Mark as paid (wallet)"}
                    </Button>
                  )}
                  {detailDelivery.payment === "paid" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (!detailDelivery) return;
                        setUpdatingPayment(true);
                        setPaymentMessage(null);
                        try {
                          const { delivery } = await updateDeliveryPayment(detailDelivery.id, "unpaid");
                          setDetailDelivery(delivery);
                          await fetchDeliveries();
                          setPaymentMessage({ type: "success", text: "Trip marked as unpaid." });
                        } catch (err: unknown) {
                          const ax = err as { response?: { data?: { message?: string } } };
                          const msg =
                            ax?.response?.data?.message || "Failed to mark as unpaid";
                          setPaymentMessage({ type: "error", text: msg });
                        } finally {
                          setUpdatingPayment(false);
                        }
                      }}
                      disabled={updatingPayment}
                    >
                      {updatingPayment ? "Updating..." : "Mark as unpaid"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
