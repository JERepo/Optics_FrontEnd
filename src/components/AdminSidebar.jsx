import React, { useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { GoSidebarExpand } from "react-icons/go";
import { FiSearch, FiLayers } from "react-icons/fi";
import { IoMdArrowDropdown, IoMdArrowDropright } from "react-icons/io";
import { menuItems } from "../utils/constants/menuConfig";
import { useSelector } from "react-redux";
import { hasPermission } from "../utils/permissionUtils";

const AdminSidebar = ({ isCollapsed, setIsCollapsed }) => {
  const [openDropdowns, setOpenDropdowns] = useState([]);
  const { access } = useSelector((state) => state.auth);
  const dropdownRefs = useRef({});
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMenuItems = menuItems
    .map((item) => {
      if (item.subItems) {
        const permittedSubItems = item.subItems.filter((sub) =>
          hasPermission(access, sub.module, "view")
        );

        if (!permittedSubItems.length) return null;

        // Apply search filter
        const filteredSubItems = permittedSubItems.filter((sub) =>
          sub.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // If searchQuery is empty, return all permitted subItems
        if (searchQuery.trim() === "") {
          return { ...item, subItems: permittedSubItems };
        }

        // Include this menu if its name or any subitem matches
        if (
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          filteredSubItems.length
        ) {
          return {
            ...item,
            subItems: filteredSubItems,
          };
        }

        return null;
      }

      // For top-level items without subItems
      if (!hasPermission(access, item.module, "view")) return null;

      if (
        searchQuery.trim() === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return item;
      }

      return null;
    })
    .filter(Boolean);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setOpenDropdowns([]);
    }
  };

  const toggleDropdown = (menuName) => {
    setOpenDropdowns((prev) =>
      prev.includes(menuName)
        ? prev.filter((name) => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isDropdownOpen = (name) => openDropdowns.includes(name);

  return (
    <div
      className={`fixed h-screen bg-primary border-r border-neutral-200 flex flex-col transition-all duration-500 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-50/40 bg-primary">
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "gap-3"
            }`}
          >
            <div className="w-10 h-10 bg-blue-100 flex justify-center items-center rounded-lg text-blue-600">
              <FiLayers className="text-lg" />
            </div>
            {!isCollapsed && (
              <div>
                <div className="font-medium text-neutral-100">Optics Admin</div>
                <div className="text-xs text-neutral-100">Administrator</div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="w-8 h-8 bg-neutral-100 hover:bg-neutral-400 hover:text-neutral-50 cursor-pointer rounded-lg text-neutral-600 flex items-center justify-center transition-all duration-200"
            >
              <GoSidebarExpand />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-neutral-50/40">
          <div className="flex items-center bg-neutral-100 hover:bg-neutral-200 rounded-lg px-3 py-2">
            <>
              <FiSearch className="text-neutral-500 mr-2" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-sm placeholder-neutral-400"
              />
            </>
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-3">
        {isCollapsed && (
          <div className="flex justify-center items-center py-3">
            <button
              onClick={toggleSidebar}
              className="w-8 h-8 bg-neutral-200/60 hover:bg-neutral-400/80 rounded-lg text-neutral-700 flex items-center justify-center transition-all duration-200 cursor-pointer"
            >
              <GoSidebarExpand />
            </button>
          </div>
        )}

        <ul className="space-y-1">
          {filteredMenuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={index} className="px-3">
                {item.path ? (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center py-2 px-3 rounded-lg transition-colors group ${
                        isActive
                          ? "bg-neutral-400/65 text-neutral-100"
                          : "hover:bg-neutral-400/60 text-neutral-100"
                      } ${isCollapsed ? "justify-center" : ""}`
                    }
                  >
                    <Icon
                      className={`text-lg ${
                        isCollapsed ? "" : "mr-3"
                      } transition-all duration-200`}
                    />
                    {!isCollapsed && (
                      <span className="text-neutral-100">{item.name}</span>
                    )}
                  </NavLink>
                ) : (
                  <div>
                    <div
                      onClick={() => toggleDropdown(item.name)}
                      className={`flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-colors group ${
                        isDropdownOpen(item.name)
                          ? "bg-neutral-400/60 text-blue-600"
                          : "hover:bg-neutral-400/60 text-neutral-100"
                      } ${isCollapsed ? "justify-center" : ""}`}
                    >
                      <div
                        className={`flex items-center ${
                          isCollapsed ? "justify-center" : ""
                        }`}
                      >
                        <Icon
                          className={`text-lg  text-neutral-100 ${
                            isCollapsed ? "" : "mr-3"
                          } transition-all`}
                        />
                        {!isCollapsed && (
                          <span className="text-neutral-100">{item.name}</span>
                        )}
                      </div>

                      {!isCollapsed && (
                        <IoMdArrowDropdown
                          className={`transition-transform text-neutral-100 ${
                            isDropdownOpen(item.name) ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>

                    {/* Submenu */}
                    <div
                      ref={(el) => {
                        if (el) dropdownRefs.current[item.name] = el;
                      }}
                      style={{
                        height:
                          isDropdownOpen(item.name) && !isCollapsed
                            ? `${
                                dropdownRefs.current[item.name]?.scrollHeight
                              }px`
                            : "0px",
                        overflow: "hidden",
                        transition: "height 0.4s ease, opacity 0.3s ease",
                        opacity:
                          isDropdownOpen(item.name) && !isCollapsed ? 1 : 0,
                      }}
                    >
                      <ul className="ml-9 mt-1 space-y-1">
                        {item.subItems?.map((sub, subIndex) => (
                          <li key={subIndex}>
                            <NavLink
                              to={sub.path}
                              className={({ isActive }) =>
                                `flex items-center py-2 px-3 rounded-lg text-sm transition-colors ${
                                  isActive
                                    ? "bg-neutral-400/65 text-neutral-100"
                                    : "hover:bg-neutral-400/60 text-neutral-100"
                                }`
                              }
                            >
                              <IoMdArrowDropright className="mr-2 text-sm" />
                              {sub.name}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default AdminSidebar;
