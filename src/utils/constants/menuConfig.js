import {
  FiUsers,
  FiSettings,
  FiUserCheck,
} from "react-icons/fi";
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
    ],
  },
];
