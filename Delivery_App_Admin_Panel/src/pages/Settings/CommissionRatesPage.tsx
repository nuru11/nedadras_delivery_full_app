import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import InputField from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import {
  getCommissionRates,
  updateCommissionRates,
} from "../../services/settings.service";
import { can } from "../../utils/adminPermissions";

export default function CommissionRatesPage() {
  const canWriteCommission = can("commission:write");
  const [inHousePercent, setInHousePercent] = useState<number>(10);
  const [freelancerPercent, setFreelancerPercent] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rates = await getCommissionRates();
        if (!cancelled) {
          setInHousePercent(Math.round((rates.in_house ?? 0.1) * 100));
          setFreelancerPercent(Math.round((rates.freelancer ?? 0.3) * 100));
        }
      } catch (err) {
        console.error("Failed to fetch commission rates:", err);
        if (!cancelled) setError("Failed to load commission rates.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const inHouse = inHousePercent / 100;
    const freelancer = freelancerPercent / 100;
    if (inHouse < 0 || inHouse > 1 || freelancer < 0 || freelancer > 1) {
      setError("Rates must be between 0 and 100%.");
      return;
    }
    setSubmitting(true);
    try {
      await updateCommissionRates({ in_house: inHouse, freelancer });
      setSuccess("Commission rates updated successfully.");
    } catch (err) {
      console.error("Failed to update commission rates:", err);
      setError(
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Failed to update commission rates."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Commission rates | Delivery App Admin"
        description="Configure commission rates for in-house and freelancer drivers"
      />
      <PageBreadcrumb pageTitle="Commission rates" />
      <div className="space-y-6">
        <ComponentCard
          title="Driver commission rates"
          desc="Set the driver share of delivery price (as percentage). In-house and freelancer rates are used when marking deliveries as paid or when users pay with wallet."
        >
          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading…</p>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md space-y-4">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              {success && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  {success}
                </p>
              )}
              <div>
                <label
                  htmlFor="in_house"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  In-house driver commission (%)
                </label>
                <InputField
                  id="in_house"
                  type="number"
                  min="0"
                  max="100"
                  step={0.5}
                  value={inHousePercent}
                  onChange={(e) =>
                    setInHousePercent(parseFloat(e.target.value) || 0)
                  }
                  disabled={!canWriteCommission}
                />
              </div>
              <div>
                <label
                  htmlFor="freelancer"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Freelancer driver commission (%)
                </label>
                <InputField
                  id="freelancer"
                  type="number"
                  min="0"
                  max="100"
                  step={0.5}
                  value={freelancerPercent}
                  onChange={(e) =>
                    setFreelancerPercent(parseFloat(e.target.value) || 0)
                  }
                  disabled={!canWriteCommission}
                />
              </div>
              {canWriteCommission && (
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving…" : "Save rates"}
                </Button>
              )}
            </form>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
