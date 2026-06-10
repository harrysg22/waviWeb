import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { TermsAndConditions } from "./pages/TermsAndConditions";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import DownloadPage from "./pages/DownloadPage";
import RegisterWizard from "./pages/RegisterWizard";
import RegisterSuccess from "./pages/RegisterSuccess";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import RegistrationDetail from "./pages/RegistrationDetail";

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
    element: <ProtectedAdminRoute />,
    children: [
      {
        path: "/admin",
        Component: AdminDashboard,
      },
      {
        path: "/admin/:id",
        Component: RegistrationDetail,
      },
    ],
  },
]);
