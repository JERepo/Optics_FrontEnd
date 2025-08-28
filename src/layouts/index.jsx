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
import Brands from "../pages/admin/Brands/Brands";
import EditBrands from "../pages/admin/Brands/EditBrands";
import Accssories from "../pages/admin/AccsoriesVariations/Accssories";
import EditVariations from "../pages/admin/AccsoriesVariations/EditVariations";
import AccessoriesMaster from "../pages/admin/Master/AccessoriesMaster";
import EditAccessoriesMaster from "../pages/admin/Master/EditAccessoriesMaster";
import CreateVariation from "../pages/admin/Master/CreateVariation";
import ShapeMaster from "../pages/admin/ShapeMaster/ShapeMaster";
import EditShapeMaster from "../pages/admin/ShapeMaster/EditShapeMaster";
import SeasonMaster from "../pages/admin/SeasonMaster/SeasonMaster";
import EditSeasonMaster from "../pages/admin/SeasonMaster/EditSeasonMaster";
import MaterialMaster from "../pages/admin/MaterialMaster/MaterialMaster";
import EditmaterialMaster from "../pages/admin/MaterialMaster/EditMaterialMaster";
import FrameMaster from "../pages/admin/FrameMaster/FrameMaster";
import EditFrameMaster from "../pages/admin/FrameMaster/EditFrameMaster";
import CustomerMain from "../pages/customers/CustomerMain";
import Customer from "../pages/customers/Customer";
import CustomerGroup from "../pages/customer/customerGroup/CustomerGroup";
import EditCustomerGroup from "../pages/customer/customerGroup/EditCustomerGroup";
import SalesPerson from "../pages/customer/SalesPerson/SalesPerson";
import EditSalesPerson from "../pages/customer/SalesPerson/EditSalesPerson";
import BankMaster from "../pages/customer/BankMaster/BankMaster";
import EditBankMaster from "../pages/customer/BankMaster/EditBankMaster";
import BankAccountDetails from "../pages/customer/BankAccountDetails/BankAccountDetails";
import EditBankAccountDetails from "../pages/customer/BankAccountDetails/EditBankAccountDetails";
import PaymentMachine from "../pages/customer/PaymentMachine/PaymentMachine";
import EditPaymentMachine from "../pages/customer/PaymentMachine/EditPaymentMachine";
import Vendor from "../pages/Vendor/Vendor";
import EditVendor from "../pages/Vendor/EditVendor";
import NotFound from "../components/NotFound";
import TotalOrder from "../pages/Order";
import OrderList from "../pages/Order/MainOrder/OrderList";
import ErrorBoundary from "../components/ErrorBoundary";
import Prescription from "../pages/Prescription/Prescription";
import EditPrescription from "../pages/Prescription/EditPrescription";
import ClBatchDetails from "../pages/cl_batch_details/ClBatchDetails";
import SavePurchaseOrder from "../pages/PurchaseOrder/savePurchaseOrderPage";
import OrderView from "../pages/Order/MainOrder/OrderView";
import CustomerSelect from "../pages/Invoice/CustomerSelect";
import InvoiceList from "../pages/Invoice/InvoiceList";
import InvoiceView from "../pages/Invoice/InvoiceView";
import SalesList from "../pages/SalesReturn/MainSalesReturn/SalesList";
import TotalSales from "../pages/SalesReturn";
import SalesView from "../pages/SalesReturn/MainSalesReturn/SalesView";
import StockTransfer from "../pages/StockTransfer";
import StockTransferOut from "../pages/StockTransfer/MainStockTransferOut/StockTransferOut";
import StockTransferView from "../pages/StockTransfer/MainStockTransferOut/StockTransferView";
import TotalPurchaseReturn from "../pages/PurchaseReturn";
import PurchaseReturn from "../pages/PurchaseReturn/MainPurchaseReturn/PurchaseReturn";
import PurchaseReturnView from "../pages/PurchaseReturn/MainPurchaseReturn/PurchaseReturnView";
import TotalStockTransferIn from "../pages/StockTransferIn";

// import CreateVariationForm from "../pages/admin/FrameMaster/CreateVariationFrame";

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
          <PermissionRoute module="Dashboard" action="view">
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
      {
        path: "settings/brand",
        element: (
          <PermissionRoute module="Brand" action="view">
            <Brands />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/brand/create",
        element: (
          <PermissionRoute module="Brand" action="create">
            <EditBrands />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/brand/edit/:id",
        element: (
          <PermissionRoute module="Brand" action="edit">
            <EditBrands />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/brand/view/:id",
        element: (
          <PermissionRoute module="Brand" action="view">
            <EditBrands />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/accessories",
        element: (
          <PermissionRoute module="Variation Master" action="view">
            <Accssories />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/accessories/create",
        element: (
          <PermissionRoute module="Variation Master" action="view">
            <EditVariations />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/accessories/edit/:id",
        element: (
          <PermissionRoute module="Variation Master" action="view">
            <EditVariations />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/accessories/view/:id",
        element: (
          <PermissionRoute module="Variation Master" action="view">
            <EditVariations />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/accessories-master",
        element: (
          <PermissionRoute module="Accessory Master" action="view">
            <AccessoriesMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/accessories-master/create",
        element: (
          <PermissionRoute module="Accessory Master" action="create">
            <EditAccessoriesMaster />
          </PermissionRoute>
        ),
      },

      {
        path: "settings/accessories-master/edit/:id",
        element: (
          <PermissionRoute module="Accessory Master" action="edit">
            <EditAccessoriesMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/accessories-master/view/:id",
        element: (
          <PermissionRoute module="Accessory Master" action="view">
            <EditAccessoriesMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/accessories-master/edit/:id/create",
        element: (
          <PermissionRoute module="Accessory Master" action="edit">
            <CreateVariation />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/accessories-master/edit/:id/variation/:id",
        element: (
          <PermissionRoute module="Accessory Master" action="edit">
            <CreateVariation />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/accessories-master/create/variation",
        element: (
          <PermissionRoute module="Accessory Master" action="create">
            <CreateVariation />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/accessories-master/view/variation",
        element: (
          <PermissionRoute module="Accessory Master" action="view">
            <CreateVariation />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/frameshape-master",
        element: (
          <PermissionRoute module="Shape Master" action="view">
            <ShapeMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/frameshape-master/create",
        element: (
          <PermissionRoute module="Shape Master" action="create">
            <EditShapeMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/frameshape-master/edit/:id",
        element: (
          <PermissionRoute module="Shape Master" action="edit">
            <EditShapeMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/frameshape-master/view/:id",
        element: (
          <PermissionRoute module="Shape Master" action="view">
            <EditShapeMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/season-master",
        element: (
          <PermissionRoute module="Season Master" action="view">
            <SeasonMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/season-master/create",
        element: (
          <PermissionRoute module="Season Master" action="create">
            <EditSeasonMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/season-master/edit/:id",
        element: (
          <PermissionRoute module="Season Master" action="edit">
            <EditSeasonMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/season-master/view/:id",
        element: (
          <PermissionRoute module="Season Master" action="view">
            <EditSeasonMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/material-master",
        element: (
          <PermissionRoute module="Material Master" action="view">
            <MaterialMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/material-master/create",
        element: (
          <PermissionRoute module="Material Master" action="create">
            <EditmaterialMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/material-master/edit/:id",
        element: (
          <PermissionRoute module="Material Master" action="edit">
            <EditmaterialMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/material-master/view/:id",
        element: (
          <PermissionRoute module="Material Master" action="view">
            <EditmaterialMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/frame-master",
        element: (
          <PermissionRoute module="Frame Master" action="view">
            <FrameMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/frame-master/create",
        element: (
          <PermissionRoute module="Frame Master" action="edit">
            <EditFrameMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/frame-master/edit/:id",
        element: (
          <PermissionRoute module="Frame Master" action="edit">
            <EditFrameMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/frame-master/view/:id",
        element: (
          <PermissionRoute module="Frame Master" action="view">
            <EditFrameMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "customer-group",
        element: <CustomerGroup />,
      },
      {
        path: "customer-group/create",
        element: <EditCustomerGroup />,
      },
      {
        path: "customer-group/edit/:id",
        element: <EditCustomerGroup />,
      },
      {
        path: "customer-group/view/:id",
        element: <EditCustomerGroup />,
      },
      {
        path: "customer",
        element: <CustomerMain />,
      },
      {
        path: "customer/create",
        element: <Customer />,
      },
      {
        path: "customer/edit/:id",
        element: <Customer />,
      },
      {
        path: "customer/view/:id",
        element: <Customer />,
      },
      {
        path: "sales",
        element: <SalesPerson />,
      },
      {
        path: "sales/create",
        element: <EditSalesPerson />,
      },
      {
        path: "sales/edit/:id",
        element: <EditSalesPerson />,
      },
      {
        path: "sales/view/:id",
        element: <EditSalesPerson />,
      },
      {
        path: "bank-master",
        element: <BankMaster />,
      },
      {
        path: "bank-master/create",
        element: <EditBankMaster />,
      },
      {
        path: "bank-master/edit/:id",
        element: <EditBankMaster />,
      },
      {
        path: "bank-master/view/:id",
        element: <EditBankMaster />,
      },
      {
        path: "bank-account-details",
        element: <BankAccountDetails />,
      },
      {
        path: "bank-account-details/create",
        element: <EditBankAccountDetails />,
      },
      {
        path: "bank-account-details/edit/:id",
        element: <EditBankAccountDetails />,
      },
      {
        path: "bank-account-details/view/:id",
        element: <EditBankAccountDetails />,
      },
      {
        path: "payment-machine",
        element: <PaymentMachine />,
      },
      {
        path: "payment-machine/create",
        element: <EditPaymentMachine />,
      },
      {
        path: "payment-machine/edit/:id",
        element: <EditPaymentMachine />,
      },
      {
        path: "payment-machine/view/:id",
        element: <EditPaymentMachine />,
      },
      {
        path: "vendor",
        element: <Vendor />,
      },
      {
        path: "vendor/create",
        element: <EditVendor />,
      },
      {
        path: "vendor/edit/:id",
        element: <EditVendor />,
      },

      {
        path: "order-list",
        element: (
          <ErrorBoundary>
            <OrderList />
          </ErrorBoundary>
        ),
      },
      {
        path: "add-order",
        element: (
          <ErrorBoundary>
            <TotalOrder />
          </ErrorBoundary>
        ),
      },
      {
        path: "add-order/view-order",
        element: (
          <ErrorBoundary>
            <OrderView />
          </ErrorBoundary>
        ),
      },
      {
        path: "prescription",
        element: (
          <ErrorBoundary>
            <Prescription />
          </ErrorBoundary>
        ),
      },
      {
        path: "prescription/create",
        element: (
          <ErrorBoundary>
            <EditPrescription />
          </ErrorBoundary>
        ),
      },
      {
        path: "cl-batch-details",
        element: <ClBatchDetails />,
      },
      {
        path: "purchase-order/create",
        element: (
          <PermissionRoute module="Purchase Order" action="view">
            <SavePurchaseOrder />
          </PermissionRoute>
        ),
      },
      {
        path: "invoice",
        element: <InvoiceList />,
      },
      {
        path: "invoice/view",
        element: <InvoiceView />,
      },
      {
        path: "invoice/create",
        element: <CustomerSelect />,
      },
      {
        path: "sales-return",
        element: <SalesList />,
      },
      {
        path: "sales-return/view",
        element: <SalesView />,
      },
      {
        path: "sales-return/create",
        element: <TotalSales />,
      },
      {
        path: "stock-transfer",
        element: (
          <ErrorBoundary>
            <StockTransferOut />
          </ErrorBoundary>
        ),
      },
      {
        path: "stock-transfer/view",
        element: (
          <ErrorBoundary>
            <StockTransferView />
          </ErrorBoundary>
        ),
      },
      {
        path: "stock-transfer/create",
        element: (
          <ErrorBoundary>
            <StockTransfer />
          </ErrorBoundary>
        ),
      },
      {
        path: "purchase-return/create",
        element: <TotalPurchaseReturn />,
      },
      {
        path: "purchase-return",
        element: <PurchaseReturn />,
      },
      {
        path: "purchase-return/view",
        element: <PurchaseReturnView />,
      },
      { path: "stock-transferin/create", element: <TotalStockTransferIn /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
