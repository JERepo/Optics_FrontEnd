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
import { GRNProvider } from "../features/GRNContext";
import GRNMain from "../pages/GRN/GRNMain";
import GRNStep1 from "../pages/GRN/GRNStep1";
import GRNStep2 from "../pages/GRN/GRNStep2";
import { PurchaseOrderMainPage } from "../pages/PurchaseOrder/POMainPage";
import { POViewPage } from "../pages/PurchaseOrder/POViewPage";
import { GRNListPage } from "../pages/GRN/GRNListPage";
import { GRNViewPage } from "../pages/GRN/GRNViewPage";
import NewGVMain from "../pages/GiftVoucher/NewGV/NewGVMain";
import NewGV from "../pages/GiftVoucher/NewGV/NewGV";
import ActiveteGV from "../pages/GiftVoucher/ActivateGV/ActiveteGV";
import StockTransferIn from "../pages/StockTransferIn/MainStockTransferIn/StockTransferIn";
import StockTransferInView from "../pages/StockTransferIn/MainStockTransferIn/StockTransferInView";
import SelectCustomer from "../pages/LedgerEntries/CustomerRefund/SelectCustomer";
import OfferModule from "../pages/Offer";
import SearchFrameStock from "../pages/SearchStock/SearchFrameStock";
import CustomerPayment from "../pages/LedgerEntries/CustomerPayment/CustomerPayment";
import CustomerPaymentList from "../pages/LedgerEntries/CustomerPayment/CustomerPaymentList";
import CustomerPaymentView from "../pages/LedgerEntries/CustomerPayment/CustomerPaymentView";
import CRMainList from "../pages/LedgerEntries/CustomerRefund/CRMainList";
import CRView from "../pages/LedgerEntries/CustomerRefund/CRView";
import SearchAccessory from "../pages/SearchStock/SearchAccessory";
import OpticalLensStock from "../pages/SearchStock/OpticalLensStock";
import OfferMainPage from "../pages/Offer/MainPage/OfferMainPage";
import OrderReport from "../pages/Reports/OrderReport";
import SalesReport from "../pages/Reports/SalesReport";
import PurchaseReturnReport from "../pages/Reports/PurchaseReturnReport";
import PurchaseReport from "../pages/Reports/PurchaseReport";
import CLMaster from "../pages/ContactLensMaster/CLMaster";
import CLMain from "../pages/ContactLensMaster/CLMain";
import CompanySettings from "../pages/companySettings/CompanySettings";
import { GRNDCProvider } from "../features/GRNDcContext";
import GRNDcMain from "../pages/GRN DC/GRNDcMain";
import { GRNDCListPage } from "../pages/GRN DC/GRNListPage";
import { GRNDCViewPage } from "../pages/GRN DC/GRNDCView";
import SalesReturnReport from "../pages/Reports/SalesReturnReport";
import AuditReport from "../pages/Reports/AuditReport";
import ProfitReport from "../pages/Reports/ProfileReport";
import LoyaltySummary from "../pages/Reports/LoyaltySummary";
import EmailTemplates from "../pages/EmailTemplates/EmailTemplates";
import WhatsappTemplates from "../pages/EmailTemplates/WhatsappTemplates";
import PurchaseOrderReport from "../pages/Reports/PurchaseOrderReport";
import STINReport from "../pages/Reports/STINReport";
import STOUTReport from "../pages/Reports/STOUTReport";

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
          <PermissionRoute module="Order" action="view">
            <ErrorBoundary>
              <OrderList />
            </ErrorBoundary>
          </PermissionRoute>
        ),
      },
      {
        path: "add-order",
        element: (
          <PermissionRoute module="Order" action="create">
            <ErrorBoundary>
              <TotalOrder />
            </ErrorBoundary>
          </PermissionRoute>
        ),
      },
      {
        path: "add-order/view-order",
        element: (
          <PermissionRoute module="Order" action="view">
            <ErrorBoundary>
              <OrderView />
            </ErrorBoundary>
          </PermissionRoute>
        ),
      },
      {
        path: "prescription",
        element: (
          <PermissionRoute module="Prescription" action="view">
            <ErrorBoundary>
              <Prescription />
            </ErrorBoundary>
          </PermissionRoute>
        ),
      },
      {
        path: "prescription/create",
        element: (
          <PermissionRoute module="Prescription" action="create">
            <ErrorBoundary>
              <EditPrescription />
            </ErrorBoundary>
          </PermissionRoute>
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
        path: "purchase-order/",
        element: (
          <PermissionRoute module="Purchase Order" action="view">
            <PurchaseOrderMainPage />
          </PermissionRoute>
        ),
      },
      {
        path: "purchase-order/view",
        element: (
          <PermissionRoute module="Purchase Order" action="view">
            <POViewPage />
          </PermissionRoute>
        ),
      },
      {
        path: "invoice",
        element: (
          <PermissionRoute module="Invoice" action="view">
            <InvoiceList />
          </PermissionRoute>
        ),
      },
      {
        path: "invoice/view",
        element: (
          <PermissionRoute module="Invoice" action="view">
            <InvoiceView />
          </PermissionRoute>
        ),
      },
      {
        path: "invoice/create",
        element: (
          <PermissionRoute module="Invoice" action="create">
            <CustomerSelect />
          </PermissionRoute>
        ),
      },
      {
        path: "sales-return",
        element: (
          <PermissionRoute module="SalesReturn" action="view">
            <SalesList />
          </PermissionRoute>
        ),
      },
      {
        path: "sales-return/view",
        element: (
          <PermissionRoute module="SalesReturn" action="view">
            <SalesView />
          </PermissionRoute>
        ),
      },
      {
        path: "sales-return/create",
        element: (
          <PermissionRoute module="SalesReturn" action="create">
            <TotalSales />
          </PermissionRoute>
        ),
      },
      {
        path: "stock-transfer",
        element: (
          <PermissionRoute module="StockTransfer" action="view">
            <ErrorBoundary>
              <StockTransferOut />
            </ErrorBoundary>
          </PermissionRoute>
        ),
      },
      {
        path: "stock-transfer/view",
        element: (
          <PermissionRoute module="StockTransfer" action="view">
            <ErrorBoundary>
              <StockTransferView />
            </ErrorBoundary>
          </PermissionRoute>
        ),
      },
      {
        path: "stock-transfer/create",
        element: (
          <PermissionRoute module="StockTransfer" action="create">
            <ErrorBoundary>
              <StockTransfer />
            </ErrorBoundary>
          </PermissionRoute>
        ),
      },
      {
        path: "purchase-return/create",
        element: (
          <PermissionRoute module="Purchase-Return" action="create">
            <TotalPurchaseReturn />
          </PermissionRoute>
        ),
      },
      {
        path: "purchase-return",
        element: (
          <PermissionRoute module="Purchase-Return" action="view">
            <PurchaseReturn />
          </PermissionRoute>
        ),
      },
      {
        path: "purchase-return/view",
        element: (
          <PermissionRoute module="Purchase-Return" action="view">
            <PurchaseReturnView />
          </PermissionRoute>
        ),
      },
      {
        path: "stock-transferin",
        element: (
          <PermissionRoute module="StockTranserIn" action="view">
            <StockTransferIn />
          </PermissionRoute>
        ),
      },
      {
        path: "stock-transferin/view",
        element: (
          <PermissionRoute module="StockTranserIn" action="view">
            <StockTransferInView />
          </PermissionRoute>
        ),
      },
      {
        path: "stock-transferin/create",
        element: (
          <PermissionRoute module="StockTranserIn" action="create">
            <TotalStockTransferIn />
          </PermissionRoute>
        ),
      },
      {
        path: "grn/create",
        element: (
          // <PermissionRoute module="GRN" action="view">
          <GRNProvider>
            <GRNMain />
          </GRNProvider>
          // </PermissionRoute>
        ),
      },
      { path: "grn/", element: <GRNListPage /> },
      { path: "grn/view", element: <GRNViewPage /> },

      {
        path: "grn-dc/create",
        element: (
          // <PermissionRoute module="GRN" action="view">
          <GRNDCProvider>
            <GRNDcMain />
          </GRNDCProvider>
          // </PermissionRoute>
        ),
      },
      { path: "grn-dc/", element: <GRNDCListPage /> },
      { path: "grn-dc/view", element: <GRNDCViewPage /> },

      {
        path: "gift-voucher",
        element: <NewGVMain />,
      },
      {
        path: "newgv/create",
        element: <NewGV />,
      },
      {
        path: "activate-gv",
        element: <ActiveteGV />,
      },
      {
        path: "customer-refund/create",
        element: <SelectCustomer />,
      },
      {
        path: "customer-refund",
        element: <CRMainList />,
      },
      {
        path: "customer-refund/view",
        element: <CRView />,
      },
      {
        path: "offer/create",
        element: <OfferModule />,
      },
      {
        path: "offer",
        element: <OfferMainPage />,
      },
      {
        path: "search-stock/frame",
        element: <SearchFrameStock />,
      },
      {
        path: "search-stock/accessory",
        element: <SearchAccessory />,
      },
      {
        path: "search-stock/optical-lens",
        element: <OpticalLensStock />,
      },
      {
        path: "customer-payment/create",
        element: <CustomerPayment />,
      },
      {
        path: "customer-payment",
        element: <CustomerPaymentList />,
      },
      {
        path: "customer-payment/view",
        element: <CustomerPaymentView />,
      },
      {
        path: "order-report",
        element: <OrderReport />,
      },
      {
        path: "sales-report",
        element: <SalesReport />,
      },
      {
        path: "sales-return-report",
        element: <SalesReturnReport />,
      },
      {
        path: "purchase-return-report",
        element: <PurchaseReturnReport />,
      },
      {
        path: "purchase-report",
        element: <PurchaseReport />,
      },
      {
        path: "audit-report",
        element: <AuditReport />,
      },
      {
        path: "profit-report",
        element: <ProfitReport />,
      },
      {
        path: "purchase-order-report",
        element: <PurchaseOrderReport />,
      },
      {
        path: "stin-report",
        element: <STINReport />,
      },
      {
        path: "stout-report",
        element: <STOUTReport />,
      },
      {
        path: "contact-lens-master",
        element: <CLMain />,
      },
      {
        path: "contact-lens-master/create",
        element: <CLMaster />,
      },
      {
        path: "contact-lens-master/:id",
        element: <CLMaster />,
      },
      {
        path: "location-settings",
        element: <CompanySettings />,
      },
      {
        path: "loyalty-summary",
        element: <LoyaltySummary />,
      },
      {
        path: "email-templates",
        element: <EmailTemplates />,
      },
      {
        path: "whatsapp-templates",
        element: <WhatsappTemplates />,
      }
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
