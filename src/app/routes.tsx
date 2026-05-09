import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { TermsAndConditions } from "./pages/TermsAndConditions";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/terminos-y-condiciones",
    Component: TermsAndConditions,
  }
]);