import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";

export default function BasicTables() {
  return (
    <>
      <PageMeta
        title="Users | Delivery App Admin"
        description="Manage delivery app users"
      />
      <PageBreadcrumb pageTitle="Users" />
      <div className="space-y-6">
        <ComponentCard title="Users" desc="All registered users. Use Add balance in each row to add credit to a user's wallet.">
          <BasicTableOne />
        </ComponentCard>
      </div>
    </>
  );
}
