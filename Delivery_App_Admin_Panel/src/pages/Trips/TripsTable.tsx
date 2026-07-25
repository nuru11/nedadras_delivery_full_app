import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import TripsScreen from "../../components/trips/TripsScreen";

export default function TripsTable() {
  return (
    <>
      <PageMeta
        title="Trips | Delivery App Admin"
        description="Manage delivery trips - create and assign to drivers"
      />
      <PageBreadcrumb pageTitle="Trips" />
      <div className="space-y-6">
        <ComponentCard title="Trips" desc="Create trips and assign drivers">
          <TripsScreen />
        </ComponentCard>
      </div>
    </>
  );
}
