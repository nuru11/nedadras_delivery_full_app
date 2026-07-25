import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import {
  getMonthlyActivity,
  getMonthlyRevenue,
} from "../../services/dashboardData.service";
import {
  AdminMonthlyActivity,
  AdminMonthlyRevenue,
} from "../../type/dashboardData";

export default function StatisticsChart() {
  const [series, setSeries] = useState([
    { name: "Listings", data: Array(12).fill(0) },
    { name: "Revenue", data: Array(12).fill(0) },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const activity: AdminMonthlyActivity = await getMonthlyActivity();
        const revenue: AdminMonthlyRevenue = await getMonthlyRevenue();

        setSeries([
          { name: "Listings", data: activity.listings ?? Array(12).fill(0) },
          { name: "Revenue", data: revenue.monthly ?? Array(12).fill(0) },
        ]);
      } catch (err) {
        console.error("Statistics chart fetch error:", err);
      }
    };

    fetchData();
  }, []);

  const options: ApexOptions = {
    chart: {
      type: "area",
      height: 310,
      toolbar: { show: false },
      foreColor: "#9CA3AF", // axis + labels base color
    },
    xaxis: {
      categories: [
        "Jan","Feb","Mar","Apr","May","Jun",
        "Jul","Aug","Sep","Oct","Nov","Dec",
      ],
      labels: {
        style: { colors: "#9CA3AF" },
      },
    },
    yaxis: {
      labels: {
        style: { colors: "#9CA3AF" },
      },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3 },
    grid: { borderColor: "#E5E7EB" },
    colors: ["#4F46E5", "#10B981"],
    tooltip: {
      theme: "light",
      y: {
        formatter: (val: number) => `ETB ${val.toLocaleString()}`,
      },
    },
    legend: {
      labels: {
        colors: "#9CA3AF",
      },
    },
  };

  return (
    <div className="rounded-2xl border bg-white p-5 dark:bg-white/[0.03]">
      <h3 className="mb-3 text-lg font-semibold dark:text-white">
        Statistics
      </h3>

      {/* Dark-mode overrides for ApexCharts SVG */}
      <div
        className="
          dark:[&_.apexcharts-text]:!fill-white
          dark:[&_.apexcharts-xaxis-label]:!fill-white
          dark:[&_.apexcharts-yaxis-label]:!fill-white
          dark:[&_.apexcharts-legend-text]:!fill-white
          dark:[&_.apexcharts-gridline]:!stroke-gray-700
          dark:[&_.apexcharts-tooltip]:!bg-gray-900
        "
      >
        <Chart options={options} series={series} type="area" height={310} />
      </div>
    </div>
  );
}
