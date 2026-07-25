import { useEffect, useState } from "react";
import {
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
  BoltIcon,
  DollarLineIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { getDeliveryOverview } from "../../services/deliveryDashboard.service";

export default function DeliveryMetrics() {
  const [data, setData] = useState<{
    activeTrips: number;
    pendingTrips: number;
    totalUsers: number;
    totalDrivers: number;
    revenueThisMonth: number;
    unpaidOrdersCount: number;
    paidOrdersCount: number;
  } | null>(null);

  useEffect(() => {
    getDeliveryOverview()
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const iconClass = "size-6 text-gray-700 dark:text-white";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Active Trips */}
      <div className="rounded-2xl border bg-white p-5 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className={iconClass} />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-white">
              Active Trips
            </span>
            <h4 className="mt-2 font-bold text-title-sm dark:text-white">
              {data?.activeTrips ?? "--"}
            </h4>
          </div>
          <Badge color="primary">
            <ArrowUpIcon className="dark:text-white" /> Live
          </Badge>
        </div>
      </div>

      {/* Pending Trips */}
      <div className="rounded-2xl border bg-white p-5 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className={iconClass} />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-white">
              Pending Trips
            </span>
            <h4 className="mt-2 font-bold text-title-sm dark:text-white">
              {data?.pendingTrips ?? "--"}
            </h4>
          </div>
          <Badge color="warning">
            <ArrowUpIcon className="dark:text-white" /> Awaiting
          </Badge>
        </div>
      </div>

      {/* Users */}
      <div className="rounded-2xl border bg-white p-5 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className={iconClass} />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-white">Users</span>
            <h4 className="mt-2 font-bold text-title-sm dark:text-white">
              {data?.totalUsers ?? "--"}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon className="dark:text-white" /> Active
          </Badge>
        </div>
      </div>

      {/* Drivers */}
      <div className="rounded-2xl border bg-white p-5 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoltIcon className={iconClass} />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-white">Drivers</span>
            <h4 className="mt-2 font-bold text-title-sm dark:text-white">
              {data?.totalDrivers ?? "--"}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon className="dark:text-white" /> Active
          </Badge>
        </div>
      </div>

      {/* Revenue This Month */}
      <div className="rounded-2xl border bg-white p-5 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <DollarLineIcon className={iconClass} />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-white">
              Revenue (Month)
            </span>
            <h4 className="mt-2 font-bold text-title-sm dark:text-white">
              ETB {data?.revenueThisMonth?.toFixed(2) ?? "--"}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon className="dark:text-white" /> Delivered
          </Badge>
        </div>
      </div>

      {/* Payment Status - Unpaid Orders */}
      <div className="rounded-2xl border bg-white p-5 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <DollarLineIcon className={iconClass} />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-white">
              Unpaid Orders
            </span>
            <h4 className="mt-2 font-bold text-title-sm dark:text-white">
              {data?.unpaidOrdersCount ?? "--"}
            </h4>
          </div>
          <Badge color="warning">
            Pending payment
          </Badge>
        </div>
      </div>
    </div>
  );
}
