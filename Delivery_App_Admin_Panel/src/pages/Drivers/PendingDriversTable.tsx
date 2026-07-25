import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import DriversScreen from "../../components/drivers/DriversScreen";

export default function PendingDriversTable() {
  return (
    <>
      <PageMeta
        title="Pending Drivers | Delivery App Admin"
        description="View all pending drivers awaiting approval"
      />
      <PageBreadcrumb pageTitle="Pending Drivers" />
      <div className="space-y-6">
        <ComponentCard
          title="Pending Drivers"
          desc="Drivers whose accounts are still pending review"
        >
          <DriversScreen filterStatus="pending" />
        </ComponentCard>
      </div>
    </>
  );
}

