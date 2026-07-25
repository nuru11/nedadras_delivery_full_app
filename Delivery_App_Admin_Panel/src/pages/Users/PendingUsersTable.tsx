import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import UsersTable from "../../components/tables/BasicTables/BasicTableOne";

export default function PendingUsersTable() {
  return (
    <>
      <PageMeta
        title="Pending Users | Delivery App Admin"
        description="View all pending users awaiting approval"
      />
      <PageBreadcrumb pageTitle="Pending Users" />
      <div className="space-y-6">
        <ComponentCard
          title="Pending Users"
          desc="Users whose accounts are still pending review"
        >
          <UsersTable statusFilter="pending" />
        </ComponentCard>
      </div>
    </>
  );
}

