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
  FiAperture,
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
    name: "Customer",
    icon: IoPersonOutline,
    module: "Customer",
    path: "/customer",
  },
  {
    name: "Prescription",
    icon: FiFilePlus,
    module: "Prescription",
    path: "/prescription",
  },
  {
    name: "Order",
    icon: FiBox,
    module: "Order",
    path: "/order",
  },

  {
    name: "Invoice",
    icon: FiFileText,
    module: "Invoice",
    path: "/invoice",
  },
  // Search stock
  {
    name: "Search Stock",
    icon: FiPackage,
    module: ["Frame-Stock", "Accessory-Stock", "CL-Stock"],
    subItems: [
      {
        name: "Frame",
        path: "search-stock/frame",
        module: "Frame-Stock",
        icon: IoConstructOutline,
      },
      {
        name: "Accessories",
        path: "search-stock/accessory",
        module: "Accessory-Stock",
        icon: IoConstructOutline,
      },
      {
        name: "Contact Lens",
        path: "search-stock/contact-lens",
        module: "CL-Stock",
        icon: IoConstructOutline,
      },
    ],
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
    name: "GRN",
    icon: FiArrowRightCircle,
    module: ["GRN"],
    // path: "/grn/",
    subItems: [
      {
        name: "New GRN",
        path: "/grn/",
        module: "GRN",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Convert DC",
        path: "/grn-dc",
        module: "GRN DC",
        icon: IoConstructOutline, // Suggests building/setup
      },
    ],
  },
  {
    name: "Purchase Return",
    icon: FiFileMinus,
    module: "Purchase-Return",
    path: "/purchase-return",
  },

  {
    name: "Vendor",
    icon: FiShoppingBag,
    module: "Vendor",
    path: "/vendor",
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
        path: "/stock-transfer-in",
        module: "StockTranserIn",
        icon: IoConstructOutline,
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
        path: "/audit",
        module: "Audit",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Profit Report",
        path: "profit",
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
        name: "Stock Transfer In Report",
        path: "stin-report",
        module: "stin-report",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Stock Transfer Out Report",
        path: "stout-report",
        module: "stout-report",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Loyalty Summary",
        icon: IoConstructOutline,
        module: "loyalty-summary",
        path: "/loyalty-summary",
      },
      {
        name: "Stock Ageing Report",
        icon: IoConstructOutline,
        module: "Stock-Ageing",
        path: "/stock-ageing",
      },
      {
        name: "Payment Collection Report",
        icon: IoConstructOutline,
        module: "Daily-Payment-Report",
        path: "/daily-payments",
      },
      {
        name: "Customer Family Report",
        icon: IoConstructOutline,
        module: "Customer-Family-History",
        path: "/customer-family-history",
      },
    ],
  },
  {
    name: "Contact-Lens-Details",
    icon: FiArrowRightCircle,
    module: "Contact-Lens-Details",
    path: "/cl-batch-details",
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
      {
        name: "Vendor Payment",
        icon: IoConstructOutline,
        module: "Vendor-Payment",
        path: "/vendor-payment",
      },
    ],
  },

  {
    name: "Product Master",
    icon: IoOptionsSharp,
    module: "Product Master",
    subItems: [
      {
        name: "Brand",
        path: "/brands",
        module: "Brand",
        icon: IoConstructOutline, // Suggests building/setup
      },

      {
        name: "Frame Master",
        path: "/frame-main",
        module: "Frame Master",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Accessory Master",
        path: "/other-products",
        module: "Accessory Master",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Contact Lens Master",
        icon: IoConstructOutline,
        module: "CLMaster",
        path: "/cl-master",
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
        path: "/customer-groups",
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
      {
        name: "Brand Group",
        path: "/brandgroup",
        module: "Brand group",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Brand Category",
        path: "/brand-category",
        module: "Brand catagory",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Variation Master",
        path: "/other-product-variation",
        module: "Variation Master",
        icon: IoConstructOutline, // Suggests building/setup
      },

      {
        name: "Frame Shape Master",
        path: "/shape-master",
        module: "Shape Master",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Season Master",
        path: "/season-master",
        module: "Season Master",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Material Master",
        path: "/material-master",
        module: "Material Master",
        icon: IoConstructOutline, // Suggests building/setup
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
        path: "/role-privileges",
      },
      {
        name: "Pool Creation",
        path: "/pool",
        module: "Pool",
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
      {
        name: "Location Settings",
        icon: IoConstructOutline,
        module: "Location-setting",
        path: "/location-settings",
      },
    ],
  },
];
