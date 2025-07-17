import { FiUsers, FiSettings, FiUserCheck, FiShoppingBag } from "react-icons/fi";
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
    name: "Settings",
    icon: IoSettingsOutline, // General settings icon
    module: "Settings",
    subItems: [
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
        name: "Brand Group",
        path: "/settings/brand-group",
        module: "Brand group",
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
        name: "Accessory Master",
        path: "/settings/accessories-master",
        module: "Accessory Master",
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
        name: "Frame Master",
        path: "/settings/frame-master",
        module: "Frame Master",
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
        name : "Sales Person",
        icons : IoBriefcaseOutline,
        module : "Sales Person",
        path : "/sales"
      },
       {
        name : "Bank Master",
        icons : IoBriefcaseOutline,
        module : "Bank Master",
        path : "/bank-master"
      },
       {
        name : "Bank Account Details",
        icons : IoBriefcaseOutline,
        module : "Bank Account Details",
        path : "/bank-account-details"
      },
       {
        name : "Payment Machine",
        icons : IoBriefcaseOutline,
        module : "Payment Machine",
        path : "/payment-machine"
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
];
