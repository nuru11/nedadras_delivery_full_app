import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import {
  getDrivers,
  Driver,
  updateDriverStatus,
  updateDriverType,
} from "../../services/driver.service";

interface DriversScreenProps {
  filterStatus?: Driver["status"];
}

export default function DriversScreen({ filterStatus }: DriversScreenProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const data = await getDrivers();
      const allDrivers = data.drivers;
      setDrivers(
        filterStatus
          ? allDrivers.filter((d) => d.status === filterStatus)
          : allDrivers
      );
    } catch (err) {
      console.error("Failed to fetch drivers:", err);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const getVehicleBadgeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "car":
        return "primary";
      case "van":
        return "info";
      case "truck":
        return "warning";
      case "bike":
        return "success";
      default:
        return "light";
    }
  };

  if (loading)
    return <p className="text-gray-600 dark:text-gray-300">Loading drivers...</p>;

  const handleStatusChange = async (driverId: string, status: Driver["status"]) => {
    if (!status) return;
    try {
      const updated = await updateDriverStatus(driverId, status);
      setDrivers((prev) =>
        prev.map((d) => (d.id === driverId ? { ...d, status: updated.status } : d))
      );
    } catch (err) {
      console.error("Failed to update driver status:", err);
      // You could show a toast/alert here if you have a common UI for errors
    }
  };

  const handleTypeChange = async (
    driverId: string,
    driver_type: Driver["driver_type"]
  ) => {
    if (!driver_type) return;
    try {
      const updated = await updateDriverType(driverId, driver_type);
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === driverId ? { ...d, driver_type: updated.driver_type } : d
        )
      );
    } catch (err) {
      console.error("Failed to update driver type:", err);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/[0.05]">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total: {drivers.length} drivers
        </p>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="p-4 dark:text-white">
                No
              </TableCell>
              <TableCell isHeader className="p-4 dark:text-white">
                Name
              </TableCell>
              <TableCell isHeader className="p-4 dark:text-white">
                Phone
              </TableCell>
              <TableCell isHeader className="p-4 dark:text-white">
                Vehicle Type
              </TableCell>
              <TableCell isHeader className="p-4 dark:text-white">
                Plate Number
              </TableCell>
              <TableCell isHeader className="p-4 dark:text-white">
                Driver Type
              </TableCell>
              <TableCell isHeader className="p-4 dark:text-white">
                Status
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {drivers.map((driver, index) => (
              <TableRow key={driver.id}>
                <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {index + 1}
                </TableCell>
                <TableCell className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {driver.name || "—"}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {driver.phone || "—"}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge
                    size="sm"
                    color={getVehicleBadgeColor(driver.vehicle_type)}
                  >
                    {driver.vehicle_type || "—"}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono">
                  {driver.plate_number || "—"}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  <select
                    value={driver.driver_type ?? "freelancer"}
                    onChange={(e) =>
                      handleTypeChange(
                        driver.id,
                        e.target.value as Driver["driver_type"]
                      )
                    }
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="in_house">In house</option>
                    <option value="freelancer">Freelancer</option>
                  </select>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  <select
                    value={driver.status ?? "pending"}
                    onChange={(e) =>
                      handleStatusChange(driver.id, e.target.value as Driver["status"])
                    }
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {drivers.length === 0 && (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          No drivers found
        </div>
      )}
    </div>
  );
}
