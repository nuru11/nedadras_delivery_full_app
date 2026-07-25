import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import { getMonthlyRevenue } from "../../services/dashboardData.service";

export default function MonthlySalesChart() {
  const [series, setSeries] = useState([
    { name: "Revenue", data: [] as number[] },
  ]);

  useEffect(() => {
    getMonthlyRevenue().then((res) => {
      setSeries([{ name: "Revenue", data: res.monthly }]); // ✅ direct
    });
  }, []);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 180,
      toolbar: { show: false },
      foreColor: "#9CA3AF", // default label color (light mode)
    },
    plotOptions: {
      bar: { borderRadius: 5, columnWidth: "40%" },
    },
    xaxis: {
      categories: [
        "Jan","Feb","Mar","Apr","May","Jun",
        "Jul","Aug","Sep","Oct","Nov","Dec",
      ],
      labels: {
        style: {
          colors: "#9CA3AF",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#9CA3AF",
        },
      },
    },
    grid: {
      borderColor: "#E5E7EB",
    },
    tooltip: {
      theme: "light",
    },
    dataLabels: { enabled: false },
  };

  return (
    <div className="rounded-2xl border bg-white p-5 dark:bg-white/[0.03]">
      <h3 className="mb-3 text-lg font-semibold dark:text-white">
        Monthly Revenue
      </h3>

      {/* Dark mode override for Apex */}
      <div className="dark:[&_.apexcharts-text]:!fill-white
                      dark:[&_.apexcharts-yaxis-label]:!fill-white
                      dark:[&_.apexcharts-xaxis-label]:!fill-white
                      dark:[&_.apexcharts-gridline]:!stroke-gray-700
                      dark:[&_.apexcharts-tooltip]:!bg-gray-900">
        <Chart options={options} series={series} type="bar" height={180} />
      </div>
    </div>
  );
}