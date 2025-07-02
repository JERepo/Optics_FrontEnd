import { createBrowserRouter } from "react-router-dom";
import AuthRoute from "./AuthCheck/AuthRoute";
import GuestRoute from "./AuthCheck/GuestRoute";
import PermissionRoute from "./AuthCheck/PermissionRoute";

import AuthLayout from "./AuthLayout";
import AdminLayout from "./AdminLayout";
import Login from "../pages/authentication/Login";
import NavigateFromRoot from "./AuthCheck/NavigateFromRoot";
import AdminDashboard from "../pages/admin/AdminDashboard";
import RoleManagement from "../pages/admin/RoleManagement/RoleManagement";
import PagePermissions from "../pages/admin/RoleManagement/PagePermissions";
import UserManagement from "../pages/admin/UserManagement/UserManagement";
import EditUserManagement from "../pages/admin/UserManagement/EditUserManagement";
import PoolCreation from "../pages/admin/Pool/PoolCreation";
import EditPool from "../pages/admin/Pool/EditPool";
import BrandCategory from "../pages/admin/BrandCategory/BrandCategory";
import EditBrandCategory from "../pages/admin/BrandCategory/EditBrandCategory";
import BrandGroup from "../pages/admin/BrandGroup/BrandGroup";
import EditBrandGroup from "../pages/admin/BrandGroup/EditBrandGroup";

export const router = createBrowserRouter([
  { path: "/", element: <NavigateFromRoot /> },
  {
    path: "/login",
    element: (
      <GuestRoute>
        <AuthLayout />
      </GuestRoute>
    ),
    children: [{ index: true, element: <Login /> }],
  },
  {
    path: "/",
    element: (
      <AuthRoute>
        <AdminLayout />
      </AuthRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: (
          <PermissionRoute module="Page Management" action="view">
            <AdminDashboard />
          </PermissionRoute>
        ),
      },
      {
        path: "role-management",
        element: (
          <PermissionRoute module="Role Management" action="view">
            <RoleManagement />
          </PermissionRoute>
        ),
      },
      {
        path: "role-management/add-role",
        element: (
          <PermissionRoute module="Role Management" action="create">
            <PagePermissions />
          </PermissionRoute>
        ),
      },
      {
        path: "role-management/edit-role/:id",
        element: (
          <PermissionRoute module="Role Management" action="edit">
            <PagePermissions />
          </PermissionRoute>
        ),
      },
      {
        path: "role-management/view/:id",
        element: (
          <PermissionRoute module="Role Management" action="view">
            <PagePermissions />
          </PermissionRoute>
        ),
      },
      {
        path: "user-management",
        element: (
          <PermissionRoute module="User Management" action="view">
            <UserManagement />
          </PermissionRoute>
        ),
      },
      {
        path: "user-management/edit/:id",
        element: (
          <PermissionRoute module="User Management" action="edit">
            <EditUserManagement />
          </PermissionRoute>
        ),
      },
      {
        path: "user-management/view/:id",
        element: (
          <PermissionRoute module="User Management" action="view">
            <EditUserManagement />
          </PermissionRoute>
        ),
      },
      {
        path: "user-management/create-user",
        element: (
          <PermissionRoute module="User Management" action="create">
            <EditUserManagement />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/pool-creation",
        element: (
          <PermissionRoute module="Pool" action="view">
            <PoolCreation />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/pool-creation/create",
        element: (
          <PermissionRoute module="Pool" action="create">
            <EditPool />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/pool-creation/edit/:id",
        element: (
          <PermissionRoute module="Pool" action="edit">
            <EditPool />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/pool-creation/view/:id",
        element: (
          <PermissionRoute module="Pool" action="view">
            <EditPool />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/brand-category",
        element: (
          <PermissionRoute module="Brand catagory" action="view">
            <BrandCategory />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/brand-category/create",
        element: (
          <PermissionRoute module="Brand catagory" action="create">
            <EditBrandCategory />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/brand-category/edit/:id",
        element: (
          <PermissionRoute module="Brand catagory" action="edit">
            <EditBrandCategory />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/brand-category/view/:id",
        element: (
          <PermissionRoute module="Brand catagory" action="view">
            <EditBrandCategory />
          </PermissionRoute>
        ),
      },

      {
        path: "settings/brand-group",
        element: (
          <PermissionRoute module="Brand group" action="view">
            <BrandGroup />
          </PermissionRoute>
        ),
      },
       {
        path: "settings/brand-group/create",
        element: (
          <PermissionRoute module="Brand group" action="create">
            <EditBrandGroup />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/brand-group/edit/:id",
        element: (
          <PermissionRoute module="Brand group" action="edit">
            <EditBrandGroup />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/brand-group/view/:id",
        element: (
          <PermissionRoute module="Brand group" action="view">
            <EditBrandGroup />
          </PermissionRoute>
        ),
      },
    ],
  },
]);
