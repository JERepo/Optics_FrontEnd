import {
  FiSearch,
  FiUser,
  FiLogOut,
  FiMapPin,
  FiChevronDown,
} from "react-icons/fi";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useGetAllLocationsQuery } from "../api/roleManagementApi";

const AdminNavbar = () => {
  const {user,hasMultipleLocations} = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { data: allLocations, isLoading: isLocationsLoading } =
    useGetAllLocationsQuery();

  const [selectedLocation, setSelectedLocation] = useState(null);
 useEffect(() => {
  if (allLocations?.data?.length && hasMultipleLocations?.length) {
    const firstAllowed = allLocations?.data.find((loc) =>
      hasMultipleLocations.includes(Number(loc.Id))
    );
    setSelectedLocation(firstAllowed || null);
  }
}, [allLocations?.data, hasMultipleLocations]);


  const handleLogout = () => {
    localStorage.removeItem("persist:auth");
    localStorage.clear();
    navigate("/login");
    window.location.reload();
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setIsLocationOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLocationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white p-4 flex items-center justify-end shadow-sm">
      <div className="flex items-center space-x-6">
        {/* Location Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsLocationOpen(!isLocationOpen)}
            className="flex items-center space-x-1 bg-blue-50 px-3 py-2 rounded-full transition-all duration-200 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <FiMapPin className="text-blue-500" />
            <span className="text-sm text-blue-700 font-medium">
              {selectedLocation?.LocationName}
            </span>
            <FiChevronDown
              className={`text-blue-500 transition-transform duration-200 ${
                isLocationOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isLocationOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-999 border border-gray-100 animate-fadeIn ">
              <div className="py-1">
                {allLocations?.data?.filter((loc) => hasMultipleLocations?.includes(Number(loc.Id))).map((location) => (
                  <button
                    key={location.Id}
                    onClick={() => handleLocationSelect(location)}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                      selectedLocation.Id === location.Id
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {location.LocationName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <FiUser />
            </div>
            <span className="text-sm font-medium">{user.FullName}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 text-gray-600 hover:text-red-500 transition-colors duration-200 p-1 rounded hover:bg-red-50"
            title="Logout"
          >
            <FiLogOut />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out forwards;
          }
        `}
      </style>
    </header>
  );
};

export default AdminNavbar;
