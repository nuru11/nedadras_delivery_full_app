import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import DriversScreen from "../../components/drivers/DriversScreen";

export default function DriversTable() {
  return (
    <>
      <PageMeta
        title="Drivers | Delivery App Admin"
        description="View all registered drivers"
      />
      <PageBreadcrumb pageTitle="Drivers" />
      <div className="space-y-6">
        <ComponentCard
          title="Drivers"
          desc="All registered drivers available for delivery assignments"
        >
          <DriversScreen />
        </ComponentCard>
      </div>
    </>
  );
}
