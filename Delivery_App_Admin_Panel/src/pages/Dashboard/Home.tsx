import PageMeta from "../../components/common/PageMeta";
import DeliveryMetrics from "../../components/dashboard/DeliveryMetrics";
import RecentTrips from "../../components/dashboard/RecentTrips";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Dashboard | Delivery App Admin"
        description="Delivery app admin dashboard - overview and recent trips"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <DeliveryMetrics />
        </div>
        <div className="col-span-12 xl:col-span-8">
          <RecentTrips />
        </div>
      </div>
    </>
  );
}
