import { FiSearch, FiUser, FiLogOut, FiMapPin } from "react-icons/fi";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const AdminNavbar = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear localStorage (including persist:auth)
    localStorage.removeItem("persist:auth");
    localStorage.clear();
    
    // Optional: Dispatch a logout action if using Redux
    // dispatch(logoutAction());
    
    // Redirect to login
    navigate("/login");
    
    // Optional: Force refresh to reset app state
    window.location.reload();
  };

  return (
    <header className="bg-white p-4 flex items-center justify-between shadow-sm">
      {/* Search Bar */}
      <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-64">
        <FiSearch className="text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent border-none outline-none w-full text-sm"
        />
      </div>

      {/* Right Side: Location + User + Logout */}
      <div className="flex items-center space-x-6">
        {/* Location Badge */}
        <div className="flex items-center space-x-1 bg-blue-50 px-3 py-1 rounded-full">
          <FiMapPin className="text-blue-500" />
          <span className="text-sm text-blue-700 font-medium">Hyderabad</span>
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
            className="flex items-center space-x-1 text-gray-600 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <FiLogOut />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;