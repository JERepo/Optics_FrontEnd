import { createBrowserRouter } from "react-router-dom";
import AuthRoute from "./AuthCheck/AuthRoute";
import GuestRoute from "./AuthCheck/GuestRoute";

import AuthLayout from "./AuthLayout";
import AdminLayout from "./AdminLayout";

import Login from "../pages/authentication/Login";
// import Dashboard from "../pages/admin/Dashboard";
import NavigateFromRoot from "./AuthCheck/NavigateFromRoot";
import AdminDashboard from '../pages/admin/AdminDashboard'

export const router = createBrowserRouter([
  {
    path: "/",
    element: <NavigateFromRoot />,
  },
  {
    path: "/login",
    element: (
      <GuestRoute>
        <AuthLayout />
      </GuestRoute>
    ),
    children: [{ index: true, element: <Login /> }],
  },

  // admin related routes here
  {
    path: "/admin",
    element: (
      <AuthRoute>
        <AdminLayout />
      </AuthRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <AdminDashboard />,
      },
    ],
  },
]);
