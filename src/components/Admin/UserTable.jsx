import React from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";
import Button from "../../components/ui/Button";
import Toggle from "../ui/Toggle";
import HasPermission from "../HasPermission";

const UserTable = ({ users, onEdit, onToggleStatus, loading, navigate }) => {
  if (loading) {
    return (
      <div className="p-4 text-gray-500 text-center">Loading users...</div>
    );
  }

  if (!users.length) {
    return <div className="p-4 text-center text-gray-500">No users found.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            {[
              "Name",
              "Email",
              "Phone",
              "Username",
              "Role",
              "Status",
              "Actions",
            ].map((heading) => (
              <th
                key={heading}
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${
                  heading === "Actions" ? "text-right" : "text-left"
                }`}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                  {user.name.charAt(0)}
                </div>
                <span className="ml-4 text-sm font-medium text-gray-900">
                  {user.name}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{user.phone}</td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {user.username}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                    user.role === "Administrator"
                      ? "bg-purple-100 text-purple-800"
                      : user.role === "Editor"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                <span
                  className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                    user.active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end space-x-2">
                  <HasPermission module="User Management" action="view">
                    <FiEye
                      onClick={() => navigate(`view/${user.id}`)}
                      className="text-xl cursor-pointer"
                    />
                  </HasPermission>
                  <HasPermission module="User Management" action="edit">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(user)}
                    >
                      <FiEdit2 />
                    </Button>
                  </HasPermission>
                  <HasPermission module="User Management" action="deactivate">
                    <Toggle
                      enabled={user.active}
                      onToggle={() => onToggleStatus(user)}
                    />
                  </HasPermission>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
