import { createBrowserRouter } from "react-router";
import Home from "./pages/marketing/Home";
import TermsAndConditions from "./pages/marketing/TermsAndConditions";
import PrivacyPolicy from "./pages/marketing/PrivacyPolicy";
import DownloadPage from "./pages/marketing/DownloadPage";
import RegisterWizard from "./pages/registration/RegisterWizard";
import RegisterSuccess from "./pages/registration/RegisterSuccess";
import { ProtectedAdminRoute } from "./components/auth/ProtectedAdminRoute";
import { ProtectedBusinessRoute } from "./components/auth/ProtectedBusinessRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RegistrationDetail from "./pages/admin/RegistrationDetail";
import EditRequestDetail from "./pages/admin/EditRequestDetail";
import BusinessPortal from "./pages/portal/BusinessPortal";
import PortalInfo from "./pages/portal/PortalInfo";
import PortalServices from "./pages/portal/PortalServices";
import PortalPromos from "./pages/portal/PortalPromos";
import PortalEvents from "./pages/portal/PortalEvents";

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
