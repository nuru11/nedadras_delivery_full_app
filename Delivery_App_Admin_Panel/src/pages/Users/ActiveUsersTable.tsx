import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import UsersTable from "../../components/tables/BasicTables/BasicTableOne";

export default function ActiveUsersTable() {
  return (
    <>
      <PageMeta
        title="Active Users | Delivery App Admin"
        description="View all active users"
      />
      <PageBreadcrumb pageTitle="Active Users" />
      <div className="space-y-6">
        <ComponentCard
          title="Active Users"
          desc="Users whose accounts are active"
        >
          <UsersTable statusFilter="active" />
        </ComponentCard>
      </div>
    </>
  );
}

