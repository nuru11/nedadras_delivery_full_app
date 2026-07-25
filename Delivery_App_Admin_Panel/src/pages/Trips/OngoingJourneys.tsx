import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import OngoingJourneysScreen from "../../components/trips/OngoingJourneysScreen";

export default function OngoingJourneys() {
  return (
    <>
      <PageMeta
        title="Ongoing Journeys | Delivery App Admin"
        description="View active delivery journeys in progress"
      />
      <PageBreadcrumb pageTitle="Ongoing Journeys" />
      <div className="space-y-6">
        <ComponentCard
          title="Ongoing Journeys"
          desc="Trips currently in progress (accepted, picked up, or on the way)"
        >
          <OngoingJourneysScreen />
        </ComponentCard>
      </div>
    </>
  );
}
