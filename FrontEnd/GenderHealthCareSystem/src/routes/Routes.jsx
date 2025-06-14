import { Route, Routes, Outlet } from "react-router-dom";
import ScrollToTop from "../components/utils/ScrollToTop";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Home from "../home/Home";
import Login from "../auth/Login";
import Register from "../auth/Register";
import ForgotPassword from "../auth/ForgotPassword";
import ResetPassword from "../auth/ResetPassword";
import HealthTracker from "../menstrualcycle/HealthTracker";
import Profile from "../user/UserProfile";
import ProtectedRoute from "./ProtectedRoute";
import AboutPage from "../site-info/AboutPage";
import OvulationCalendar from "../menstrualcycle/OvulationCalendar";
import Blog from "../blog/Blog";
import BlogDetail from "../blog/BlogDetail";
import MedicationReminder from "../menstrualcycle/MedicationReminder";
import ServiceList from "../site-info/ServiceList";
import ContactSection from "../site-info/Contact";
import PrivacySection from "../site-info/Privacy";
import ExpertSection from "../site-info/Expert";
import STITesting from "../services/testing/STITesting";
import STIBooking from "../services/testing/STIBooking";
import ConsultationBooking from "../services/consultant/ConsultationBooking";
import Consultation from "../services/consultant/Consultation";
import DashboardLayout from "../dashboard/components/layout/DashboardLayout";
import ManageMyBlog from "../dashboard/features/blog/ManageMyBlog";
// Layout component with Header
const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

function RouteMap() {
  return (
    <Routes>
      {/* Routes với Layout (có Header/Footer) */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/health-tracker" element={<HealthTracker />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/sti-testing" element={<STITesting />} />
        <Route path="/sti-booking" element={<STIBooking />} />
        <Route
          path="/services/consultationbooking"
          element={<ConsultationBooking />}
        />
        <Route
          path="/services/consultation"
          element={<Consultation />}
        />

        {/* Các trang khác */}
        <Route path="/about" element={<AboutPage />} />
        <Route 
          path="menstrual-ovulation" 
          element={
            <ProtectedRoute>
              <OvulationCalendar/>
            </ProtectedRoute>
          } />
        <Route path="/medication-reminder" element={<MedicationReminder />} />
        <Route path="/servicelist" element={<ServiceList />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:postId" element={<BlogDetail />} />
        <Route path="/contact" element={<ContactSection />} />
        <Route path="/privacy" element={<PrivacySection />} />
        <Route path="/expert" element={<ExpertSection />} />
      </Route>

      {/* Routes không có Layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Routes dashboard */}
      <Route
        path="/consultant/dashboard"
        element={
          <ProtectedRoute allowedRoles="Consultant">
            <DashboardLayout userRole={"Consultant"}/>
          </ProtectedRoute>
        }
      >
        <Route index element={<h1>Dashboard</h1>} />
        <Route path="manage-blog" element={<ManageMyBlog />} />
      </Route>
    </Routes>
  );
}

export default RouteMap;
