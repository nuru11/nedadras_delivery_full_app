import { useEffect, useState, useCallback, type MouseEvent } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import {
  getOngoingDeliveries,
  updateDeliveryStatus,
  Delivery,
} from "../../services/delivery.service";

const STATUS_COLORS: Record<
  string,
  "primary" | "success" | "error" | "warning"
> = {
  accepted: "primary",
  picked: "primary",
  on_way: "primary",
  delivered: "success",
  cancelled: "error",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "—";
  }
}

const STATUS_OPTIONS = [
  { value: "accepted", label: "Accepted" },
  { value: "picked", label: "Picked up" },
  { value: "on_way", label: "On the way" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function pickupDisplay(d: Delivery): string {
  return d.pickup_name?.trim() ? d.pickup_name : d.pickup_address || "—";
}

function dropDisplay(d: Delivery): string {
  return d.drop_name?.trim() ? d.drop_name : d.drop_address || "—";
}

export default function OngoingJourneysScreen() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const detailModal = useModal(false);
  const [detailDelivery, setDetailDelivery] = useState<Delivery | null>(null);

  const handleOpenDetail = (d: Delivery) => {
    setDetailDelivery(d);
    detailModal.openModal();
  };

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOngoingDeliveries();
      setDeliveries(data.deliveries);
    } catch (err) {
      console.error("Failed to fetch ongoing journeys:", err);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleStatusChange = async (deliveryId: string, newStatus: string) => {
    setStatusUpdatingId(deliveryId);
    try {
      await updateDeliveryStatus(deliveryId, newStatus);
      fetchDeliveries();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchDeliveries, 30_000);
    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Trips with driver assigned (accepted, picked up, or on the way)
        </p>
        <Button size="sm" variant="outline" onClick={fetchDeliveries} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {loading && deliveries.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">Loading ongoing journeys...</p>
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
                    Price
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Requester
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Driver
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
                      className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[200px] truncate"
                      title={pickupDisplay(d)}
                    >
                      {pickupDisplay(d)}
                    </TableCell>
                    <TableCell
                      className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[200px] truncate"
                      title={dropDisplay(d)}
                    >
                      {dropDisplay(d)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div
                        role="presentation"
                        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                      >
                        <select
                          value={d.status}
                          onChange={(e) =>
                            handleStatusChange(d.id, e.target.value)
                          }
                          disabled={statusUpdatingId === d.id}
                          className="h-8 min-w-[100px] rounded border border-gray-300 bg-transparent px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {statusUpdatingId === d.id && (
                          <span className="ml-2 text-xs text-gray-500">
                            Updating...
                          </span>
                        )}
                      </div>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {deliveries.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              No ongoing journeys
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
        }}
      >
        <div className="max-w-lg p-6 dark:bg-gray-900 rounded-3xl">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Trip details
          </h3>
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
                  {detailDelivery.status}
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
                <span className="text-gray-500 dark:text-gray-400">Created</span>
                <span className="text-gray-800 dark:text-gray-200">
                  {detailDelivery.created_at ? formatDate(detailDelivery.created_at) : "—"}
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
