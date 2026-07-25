import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";

import ProtectedRoute from "./routes/ProtectedRoute";
import AuthRoute from "./routes/AuthRoute";
import TripsTable from "./pages/Trips/TripsTable";
import OngoingJourneys from "./pages/Trips/OngoingJourneys";
import TripsHistory from "./pages/Trips/TripsHistory";
import DriversTable from "./pages/Drivers/DriversTable";
import PendingDriversTable from "./pages/Drivers/PendingDriversTable";
import ActiveDriversTable from "./pages/Drivers/ActiveDriversTable";
import InactiveDriversTable from "./pages/Drivers/InactiveDriversTable";
import SettlementsPage from "./pages/Payments/SettlementsPage";
import PaymentSummaryPage from "./pages/Payments/PaymentSummaryPage";
import DriverPaymentSummaryPage from "./pages/Payments/DriverPaymentSummaryPage";
import CommissionRatesPage from "./pages/Settings/CommissionRatesPage";
import PendingUsersTable from "./pages/Users/PendingUsersTable";
import ActiveUsersTable from "./pages/Users/ActiveUsersTable";
import InactiveUsersTable from "./pages/Users/InactiveUsersTable";

export default function App() {
  return (
    <Router>
      <ScrollToTop />

      <Routes>
        {/* 🔒 Protected Dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />

            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            <Route path="/form-elements" element={<FormElements />} />
            <Route path="/basic-tables" element={<BasicTables />} /> {/* All Users */}
            <Route path="/users/pending" element={<PendingUsersTable />} />
            <Route path="/users/active" element={<ActiveUsersTable />} />
            <Route path="/users/inactive" element={<InactiveUsersTable />} />
            <Route path="/drivers" element={<DriversTable />} />
            <Route path="/drivers/pending" element={<PendingDriversTable />} />
            <Route path="/drivers/active" element={<ActiveDriversTable />} />
            <Route path="/drivers/inactive" element={<InactiveDriversTable />} />
            <Route path="/trips" element={<TripsTable />} />
            <Route path="/ongoing-journeys" element={<OngoingJourneys />} />
            <Route path="/trips-history" element={<TripsHistory />} />
            <Route path="/payments/settlements" element={<SettlementsPage />} />
            <Route path="/payments/summary" element={<PaymentSummaryPage />} />
            <Route path="/payments/driver/:id" element={<DriverPaymentSummaryPage />} />
            <Route path="/settings/commission-rates" element={<CommissionRatesPage />} />

            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>
        </Route>

        {/* 🔓 Auth Pages */}
        <Route element={<AuthRoute />}>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
