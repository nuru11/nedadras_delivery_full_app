import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import DriversScreen from "../../components/drivers/DriversScreen";

export default function ActiveDriversTable() {
  return (
    <>
      <PageMeta
        title="Active Drivers | Delivery App Admin"
        description="View all active drivers"
      />
      <PageBreadcrumb pageTitle="Active Drivers" />
      <div className="space-y-6">
        <ComponentCard
          title="Active Drivers"
          desc="Drivers whose accounts are active and ready for deliveries"
        >
          <DriversScreen filterStatus="active" />
        </ComponentCard>
      </div>
    </>
  );
}

