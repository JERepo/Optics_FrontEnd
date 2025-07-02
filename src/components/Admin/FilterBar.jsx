import React from "react";
import Button from "../ui/Button";
import { FiSearch } from "react-icons/fi";

const FilterBar = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusOptions,
  roleFilter,
  onRoleChange,
  roleOptions,
  onReset,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm mb-1">Search</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full border border-gray-300 rounded py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Role</label>
          <select
            value={roleFilter}
            onChange={(e) => onRoleChange(e.target.value)}
            className="w-full border border-gray-300 rounded py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="self-end">
          <Button
            variant="outline"
            onClick={onReset}
            className="w-full border-gray-300 hover:bg-gray-50"
          >
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;