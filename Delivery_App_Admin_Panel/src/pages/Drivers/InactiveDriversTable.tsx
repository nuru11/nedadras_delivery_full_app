import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import DriversScreen from "../../components/drivers/DriversScreen";

export default function InactiveDriversTable() {
  return (
    <>
      <PageMeta
        title="Inactive Drivers | Delivery App Admin"
        description="View all inactive drivers"
      />
      <PageBreadcrumb pageTitle="Inactive Drivers" />
      <div className="space-y-6">
        <ComponentCard
          title="Inactive Drivers"
          desc="Drivers whose accounts are inactive"
        >
          <DriversScreen filterStatus="inactive" />
        </ComponentCard>
      </div>
    </>
  );
}

