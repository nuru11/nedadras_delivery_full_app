import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import {
  getDeliveries,
  Delivery,
} from "../../services/delivery.service";

const STATUS_COLORS: Record<
  string,
  "primary" | "success" | "error" | "warning"
> = {
  pending: "warning",
  accepted: "primary",
  picked: "primary",
  on_way: "primary",
  delivered: "success",
  cancelled: "error",
};

function pickupDisplay(d: Delivery): string {
  return d.pickup_name?.trim() ? d.pickup_name : d.pickup_address || "—";
}

function dropDisplay(d: Delivery): string {
  return d.drop_name?.trim() ? d.drop_name : d.drop_address || "—";
}

function paymentLabel(d: Delivery): string {
  if (d.payment === "paid") {
    return d.paid_from_wallet ? "Paid (Wallet)" : "Paid (Cash)";
  }
  return "Unpaid";
}

export default function RecentTrips() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDeliveries()
      .then((res) => setDeliveries(res.deliveries.slice(0, 10)))
      .catch(() => setDeliveries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-2xl border bg-white p-6 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Recent Trips
        </h3>
        <Link
          to="/trips"
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          View all
        </Link>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading...
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="p-3 dark:text-white">
                  Route
                </TableCell>
                <TableCell isHeader className="p-3 dark:text-white">
                  Status
                </TableCell>
                <TableCell isHeader className="p-3 dark:text-white">
                  Payment
                </TableCell>
                <TableCell isHeader className="p-3 dark:text-white">
                  Price
                </TableCell>
                <TableCell isHeader className="p-3 dark:text-white">
                  Driver
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {deliveries.map((d) => (
                <TableRow
                  key={d.id}
                  className="hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                >
                  <TableCell
                    className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200 max-w-[240px]"
                    title={`${pickupDisplay(d)} → ${dropDisplay(d)}`}
                  >
                    <span className="truncate block">
                      {pickupDisplay(d)} → {dropDisplay(d)}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Badge
                      size="sm"
                      color={STATUS_COLORS[d.status] || "primary"}
                    >
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Badge
                      size="sm"
                      color={d.payment === "paid" ? "success" : "warning"}
                    >
                      {paymentLabel(d)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                    {d.price} ETB
                  </TableCell>
                  <TableCell className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                    {d.driver?.name || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {!loading && deliveries.length === 0 && (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          No trips yet
        </p>
      )}
    </div>
  );
}
