import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import { getRecentProducts } from "../../services/dashboardData.service";
import { AdminRecentProduct } from "../../type/dashboardData";

export default function RecentOrders() {
  const [products, setProducts] = useState<AdminRecentProduct[]>([]);

  useEffect(() => {
    getRecentProducts().then((res) => {
      setProducts(res); // ✅ direct
    });
  }, []);

  return (
    <div className="rounded-2xl border bg-white p-5 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-lg font-semibold dark:text-white">
        Recent Products
      </h3>

      <Table>
        <TableHeader>
          <TableRow className="border-b dark:border-white/10">
            <TableCell
              isHeader
              className="text-gray-600 dark:text-gray-300"
            >
              Product
            </TableCell>
            <TableCell
              isHeader
              className="text-gray-600 dark:text-gray-300"
            >
              Price
            </TableCell>
            <TableCell
              isHeader
              className="text-gray-600 dark:text-gray-300"
            >
              Status
            </TableCell>
          </TableRow>
        </TableHeader>

        <TableBody>
          {products.map((p) => (
            <TableRow
              key={p.id}
              className="hover:bg-gray-50 dark:hover:bg-white/5 border-b dark:border-white/10"
            >
              <TableCell className="text-gray-900 dark:text-white">
                {p.categoryName}
              </TableCell>

              <TableCell className="text-gray-900 dark:text-white">
                ETB {Number(p.price).toLocaleString()}
              </TableCell>

              <TableCell>
                <Badge
                  size="sm"
                  color={
                    p.status === "active"
                      ? "success"
                      : p.status === "pending"
                      ? "warning"
                      : "error"
                  }
                >
                  {p.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}

          {products.length === 0 && (
            <TableRow>
              <TableCell
                // colSpan={3}
                className="text-center text-gray-500 dark:text-gray-400 py-6"
              >
                No recent products found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
