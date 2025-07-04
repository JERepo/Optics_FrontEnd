import { FiUsers, FiSettings, FiUserCheck } from "react-icons/fi";
import {
  IoPeopleOutline,
  IoSettingsOutline,
  IoPersonOutline,
  IoHomeOutline,
  IoConstructOutline,
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
        module: "brand",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Variation Master",
        path: "/settings/accessories",
        module: "otherproductvariation",
        icon: IoConstructOutline, // Suggests building/setup
      },
      {
        name: "Accessory Master",
        path: "/settings/accessories-master",
        module: "Otherproduct Master",
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
    ],
  },
];
