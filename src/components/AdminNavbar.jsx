import { FiSearch, FiUser } from "react-icons/fi";
import { useSelector } from "react-redux";

const AdminNavbar = () => {
  const user = useSelector(state => state.auth.user)
  return (
    <header className="bg-white  p-4.5 flex items-center justify-between">
      <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-64">
        <FiSearch className="text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent border-none outline-none w-full text-sm"
        />
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
            <FiUser />
          </div>
          <span className="text-sm font-medium">{user.FullName}</span>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
