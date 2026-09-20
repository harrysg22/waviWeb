import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { TermsAndConditions } from "./pages/TermsAndConditions";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import DownloadPage from "./pages/DownloadPage";
import RegisterWizard from "./pages/RegisterWizard";
import RegisterSuccess from "./pages/RegisterSuccess";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedBusinessRoute from "./components/ProtectedBusinessRoute";
import AdminDashboard from "./pages/AdminDashboard";
import RegistrationDetail from "./pages/RegistrationDetail";
import EditRequestDetail from "./pages/EditRequestDetail";
import BusinessPortal from "./pages/BusinessPortal";
import PortalInfo from "./pages/PortalInfo";
import PortalServices from "./pages/PortalServices";
import PortalPromos from "./pages/PortalPromos";
import PortalEvents from "./pages/PortalEvents";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/terminos-y-condiciones",
    Component: TermsAndConditions,
  },
  {
    path: "/politica-de-privacidad",
    Component: PrivacyPolicy,
  },
  {
    path: "/descargar",
    Component: DownloadPage,
  },
  {
    path: "/register",
    Component: RegisterWizard,
  },
  {
    path: "/register/done",
    Component: RegisterSuccess,
  },
  {
    element: <ProtectedBusinessRoute />,
    children: [
      { path: "/portal",          Component: BusinessPortal },
      { path: "/portal/info",     Component: PortalInfo },
      { path: "/portal/services", Component: PortalServices },
      { path: "/portal/promos",   Component: PortalPromos },
      { path: "/portal/events",   Component: PortalEvents },
    ],
  },
  {
    element: <ProtectedAdminRoute />,
    children: [
      { path: "/admin",           Component: AdminDashboard },
      { path: "/admin/:id",       Component: RegistrationDetail },
      { path: "/admin/edits/:id", Component: EditRequestDetail },
    ],
  },
]);
