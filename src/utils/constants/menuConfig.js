import {
  FiUsers,
  FiSettings,
  FiUserCheck,
  FiShoppingBag,
  FiFileText,
  FiClipboard,
  FiBox,
  FiRepeat,
  FiPackage,
  FiFilePlus,
  FiArrowRightCircle,
  FiCornerUpLeft,
  FiFileMinus,
  FiGift,
  FiRotateCcw,
  FiTag,
  FiBook,
  FiBarChart2,
  FiMapPin,
  FiGrid,
} from "react-icons/fi";
import {
  IoPeopleOutline,
  IoSettingsOutline,
  IoPersonOutline,
  IoHomeOutline,
  IoConstructOutline,
  IoPeopleSharp,
  IoSettingsSharp,
  IoOptionsSharp,
  IoBriefcaseOutline,
} from "react-icons/io5";
import { MdOutlineAdminPanelSettings } from "react-icons/md";

export const menuItems = [
   {
    name: "Dashboard",
    icon: FiGrid,
    module: "Dashboard",
    path: "/dashboard",
  },
  
  {
    name: "Product Master",
    icon: IoOptionsSharp,
    module: "Product Master",
    subItems: [
      {
        name: "Brand Group",
        path: "/settings/brand-group",
        module: "Brand group",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Frame Master",
        path: "/settings/frame-master",
        module: "Frame Master",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Accessory Master",
        path: "/settings/accessories-master",
        module: "Accessory Master",
        icon: IoConstructOutline, // Suggests building/setup
      },
    ],
  },
  {
    name: "Other Masters",
    icon: IoOptionsSharp,
    module: "Other Masters",
    subItems: [
      {
        name: "Customer Group",
        icon: IoPeopleOutline,
        module: "Customer Group",
        path: "/customer-group",
      },
      {
        name: "Sales Person",
        icons: IoBriefcaseOutline,
        module: "Sales Person",
        path: "/sales",
      },
      {
        name: "Bank Master",
        icons: IoBriefcaseOutline,
        module: "Bank Master",
        path: "/bank-master",
      },
      {
        name: "Bank Account Details",
        icons: IoBriefcaseOutline,
        module: "Bank Account Details",
        path: "/bank-account-details",
      },
      {
        name: "Payment Machine",
        icons: IoBriefcaseOutline,
        module: "Payment Machine",
        path: "/payment-machine",
      },
    ],
  },
  {
    name: "Settings",
    icon: IoSettingsOutline, // General settings icon
    module: "Settings",
    subItems: [
      {
        name: "User Management",
        icon: IoPeopleOutline, // Represents a group of users
        module: "User Management",
        path: "/user-management",
      },
      {
        name: "Role Management",
        icon: MdOutlineAdminPanelSettings, // More precise for roles/permissions
        module: "Role Management",
        path: "/role-management",
      },
      {
        name: "Pool Creation",
        path: "/settings/pool-creation",
        module: "Pool",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Brand Category",
        path: "/settings/brand-category",
        module: "Brand catagory",
        icon: IoConstructOutline, // Suggests building/setup
      },

      {
        name: "Brand",
        path: "/settings/brand",
        module: "Brand",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Variation Master",
        path: "/settings/accessories",
        module: "Variation Master",
        icon: IoConstructOutline, // Suggests building/setup
      },

      {
        name: "Frame Shape Master",
        path: "/settings/frameshape-master",
        module: "Shape Master",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Season Master",
        path: "/settings/season-master",
        module: "Season Master",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Material Master",
        path: "/settings/material-master",
        module: "Material Master",
        icon: IoConstructOutline, // Suggests building/setup
      },
       {
        name: "Email Templates",
        path: "/email-templates",
        module: "communication",
        icon: IoConstructOutline, // Suggests building/setup
      },
       {
        name: "Whatsapp Templates",
        path: "/whatsapp-templates",
        module: "communication",
        icon: IoConstructOutline, // Suggests building/setup
      },

    ],
  },

  {
    name: "Customer",
    icon: IoPersonOutline,
    module: "Customer",
    path: "/customer",
  },
  {
    name: "Vendor",
    icon: FiShoppingBag,
    module: "Vendor",
    path: "/vendor",
  },
  {
    name: "Order",
    icon: FiBox,
    module: "Order",
    path: "/order-list",
  },
  {
    name: "Prescription",
    icon: FiFilePlus,
    module: "Prescription",
    path: "/prescription",
  },
  {
    name: "Invoice",
    icon: FiFileText,
    module: "Invoice",
    path: "/invoice",
  },
  {
    name: "Sales Return",
    icon: FiClipboard,
    module: "SalesReturn",
    path: "/sales-return",
  },
  {
    name: "Purchase Order",
    icon: FiPackage,
    module: "Purchase Order",
    path: "/purchase-order/",
    // subItems: [
    //   {
    //     name: "Add PO",
    //     path: "/purchase-order/create",
    //     module: "Purchase Order",
    //     icon: IoConstructOutline, // Suggests building/setup
    //   },
    //   {
    //     name: "Approve PO",
    //     path: "/purchase-order/approve",
    //     module: "Purchase Order",
    //     icon: IoConstructOutline, // Suggests building/setup
    //   },
    // ],
  },

  {
    name: "Stock Transfer",
    icon: FiRepeat,
    module: ["StockTranserIn", "StockTransfer"],
    subItems: [
      {
        name: "Stock Transfer Out",
        path: "/stock-transfer",
        module: "StockTransfer",
        icon: IoConstructOutline,
      },
      {
        name: "Stock Transfer In",
        path: "/stock-transferin",
        module: "StockTranserIn",
        icon: IoConstructOutline,
      },
    ],
  },
  {
    name: "GRN",
    icon: FiArrowRightCircle,
    module: "GRN",
    path: "/grn/",
    // subItems: [
    //   {
    //     name: "Add GRN",
    //     path: "/grn/create",
    //     module: "GRN",
    //     icon: IoConstructOutline, // Suggests building/setup
    //   }
    // ],
  },
  {
    name: "GRN DC",
    icon: FiArrowRightCircle,
    module: "GRN DC",
    path: "/grn-dc",
    // subItems: [
    //   {
    //     name: "Add GRN",
    //     path: "/grn/create",
    //     module: "GRN",
    //     icon: IoConstructOutline, // Suggests building/setup
    //   }
    // ],
  },
  {
    name: "Purchase Return",
    icon: FiFileMinus,
    module: "Purchase-Return",
    path: "/purchase-return",
  },
  {
    name: "Gift Voucher",
    icon: FiGift,
    module: "Gift-Voucher",
    subItems: [
      {
        name: "New GV",
        path: "gift-voucher",
        module: "Gift-Voucher",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Activate GV",
        path: "activate-gv",
        module: "Gift-Voucher",
        icon: IoConstructOutline, // Suggests building/setup
      },
    ],
  },
  {
    name: "Reports",
    icon: FiBarChart2,
    module: ["order-report", "sales-report"],
    subItems: [
      {
        name: "Order Report",
        path: "order-report",
        module: "Order-Report",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Sales Report",
        path: "sales-report",
        module: "Sales-Report",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Sales Return Report",
        path: "sales-return-report",
        module: "Sales-Return-Report",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Purchase Return Report",
        path: "purchase-return-report",
        module: "Purchase-Return-Report",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Purchase Report",
        path: "purchase-report",
        module: "Purchase-Report",
        icon: IoConstructOutline, // Suggests building/setup
      },
       {
        name: "Audit Report",
        path: "audit-report",
        module: "Audit",
        icon: IoConstructOutline, // Suggests building/setup
      },
       {
        name: "Profit Report",
        path: "profit-report",
        module: "Profit",
        icon: IoConstructOutline, // Suggests building/setup
      },
        {
        name: "Purchase Order Report",
        path: "purchase-order-report",
        module: "Purchase-Order-Report",
        icon: IoConstructOutline, // Suggests building/setup
      },
        {
        name: "Profit Report",
        path: "stin-report",
        module: "stin-report",
        icon: IoConstructOutline, // Suggests building/setup
      },
        {
        name: "stout-report",
        path: "profit-report",
        module: "stout-report",
        icon: IoConstructOutline, // Suggests building/setup
      },
    ],
  },

  {
    name: "Offer",
    icon: FiTag,
    module: "Offer",
    path: "/offer",
  },
  {
    name: "Ledger Entries",
    icon: FiBook,
    module: "Customer-Payment",
    subItems: [
      {
        name: "Customer Payment",
        path: "customer-payment",
        module: "Customer-Payment",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Customer Refund",
        icon: IoConstructOutline,
        module: "Customer-Refund",
        path: "/customer-refund",
      },
    ],
  },
   {
    name: "Location Settings",
    icon: FiMapPin,
    module: "Location-setting",
    path: "/location-settings",
  },
];
