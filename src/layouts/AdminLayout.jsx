import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminNavbar from "../components/AdminNavbar";

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-gray-100 min-h-screen">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`flex-1 transition-all duration-500 ${
          isCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        <div className="flex flex-col">
          <AdminNavbar />
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
