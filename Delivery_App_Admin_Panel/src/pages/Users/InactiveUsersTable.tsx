import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import UsersTable from "../../components/tables/BasicTables/BasicTableOne";

export default function InactiveUsersTable() {
  return (
    <>
      <PageMeta
        title="Inactive Users | Delivery App Admin"
        description="View all inactive users"
      />
      <PageBreadcrumb pageTitle="Inactive Users" />
      <div className="space-y-6">
        <ComponentCard
          title="Inactive Users"
          desc="Users whose accounts are inactive"
        >
          <UsersTable statusFilter="inactive" />
        </ComponentCard>
      </div>
    </>
  );
}

