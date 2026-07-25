import { useEffect, useState } from "react";
import { getUserDemographics } from "../../services/dashboardData.service";

export default function DemographicCard() {
  const [cities, setCities] = useState<{ city: string; count: number }[]>([]);

  useEffect(() => {
    getUserDemographics().then((res) => {
      setCities(res); // ✅ direct
    });
  }, []);

  const total = cities.reduce((s, c) => s + c.count, 0);

  return (
    <div className="rounded-2xl border bg-white p-5 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-lg font-semibold dark:text-white">
        Users by City
      </h3>

      <div className="space-y-4">
        {cities.map((c) => {
          const percent = total ? Math.round((c.count / total) * 100) : 0;

          return (
            <div
              key={c.city}
              className="flex justify-between rounded-lg p-2 transition
                         hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {c.city}
                </p>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {c.count} users
                </span>
              </div>

              <span className="font-semibold text-gray-900 dark:text-white">
                {percent}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
