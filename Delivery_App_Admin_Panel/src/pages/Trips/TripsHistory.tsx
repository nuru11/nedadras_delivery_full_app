import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import TripsHistoryScreen from "../../components/trips/TripsHistoryScreen";

export default function TripsHistory() {
  return (
    <>
      <PageMeta
        title="Trip History | Delivery App Admin"
        description="View completed and cancelled delivery trips"
      />
      <PageBreadcrumb pageTitle="Trip History" />
      <div className="space-y-6">
        <ComponentCard
          title="Trip History"
          desc="Completed and cancelled trips"
        >
          <TripsHistoryScreen />
        </ComponentCard>
      </div>
    </>
  );
}
