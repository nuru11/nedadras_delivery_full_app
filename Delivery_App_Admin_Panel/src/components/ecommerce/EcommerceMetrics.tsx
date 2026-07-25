import { useEffect, useState } from "react";
import {  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
  ShootingStarIcon, // sellers
  DollarLineIcon,   } from "../../icons";
import Badge from "../ui/badge/Badge";
import { getAdminOverview } from "../../services/dashboardData.service";

export default function EcommerceMetrics() {
  const [data, setData] = useState<{
    totalUsers: number;
  activeCars: number;
  sellers: number;
  totalBalance: number;
} | null>(null);

  useEffect(() => {
    getAdminOverview().then((res) => setData(res)); // backend now returns all metrics
  }, []);

  const iconClass = "size-6 text-gray-700 dark:text-white";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
      {/* CUSTOMERS */}
      <div className="rounded-2xl border bg-white p-5 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className={iconClass} />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-white">Customers</span>
            <h4 className="mt-2 font-bold text-title-sm dark:text-white">
              {data?.totalUsers ?? "--"}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon className="dark:text-white" /> Live
          </Badge>
        </div>
      </div>

      {/* ACTIVE CARS */}
      <div className="rounded-2xl border bg-white p-5 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className={iconClass} />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-white">Active Cars</span>
            <h4 className="mt-2 font-bold text-title-sm dark:text-white">
              {data?.activeCars ?? "--"}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon className="dark:text-white" /> Active
          </Badge>
        </div>
      </div>

      {/* SELLERS */}
      <div className="rounded-2xl border bg-white p-5 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <ShootingStarIcon className={iconClass} />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-white">Sellers</span>
            <h4 className="mt-2 font-bold text-title-sm dark:text-white">
              {data?.sellers ?? "--"}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon className="dark:text-white" /> Active
          </Badge>
        </div>
      </div>

      {/* TOTAL BALANCE */}
      <div className="rounded-2xl border bg-white p-5 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <DollarLineIcon className={iconClass} />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-white">Total Balance</span>
            <h4 className="mt-2 font-bold text-title-sm dark:text-white">
              ETB {data?.totalBalance?.toFixed(2) ?? "--"}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon className="dark:text-white" /> Live
          </Badge>
        </div>
      </div>
    </div>
  );
}