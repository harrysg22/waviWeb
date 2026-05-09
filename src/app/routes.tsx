import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { TermsAndConditions } from "./pages/TermsAndConditions";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";

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
  }
]);