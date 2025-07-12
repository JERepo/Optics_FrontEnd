import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { FiPlus } from "react-icons/fi";

import Button from "../../../components/ui/Button";
import UserTable from "../../../components/Admin/UserTable";
import Loader from "../../../components/ui/Loader";
import Pagination from "../../../components/Admin/Pagination";
import FilterBar from "../../../components/Admin/FilterBar";
import {
  useDeactiveUserMutation,
  useGetAllRolesQuery,
  useGetAllUserDataQuery,
  useUpdateUserManagementMutation,
  useUpdateUserStatusMutation,
} from "../../../api/roleManagementApi";
import toast from "react-hot-toast";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import HasPermission from "../../../components/HasPermission";

const UserManagement = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const { data: usersData, isLoading, refetch } = useGetAllUserDataQuery();
  const { data: allRoles, isLoading: isAllRolesLoading } =
    useGetAllRolesQuery();
  const [updateUserStatus] = useUpdateUserStatusMutation();
  const [updateUserManagement, { isLoading: isUserUpdating }] =
    useUpdateUserManagementMutation();
  const [deactiveUser, { isLoading: isRoleDeActivateLoading }] =
    useDeactiveUserMutation();

  const users = useMemo(() => {
    if (!usersData?.data || !allRoles?.data) return [];

    return usersData.data.map((user) => {
      const matchedRole = allRoles.data.find((r) => r.Id === user.UserType);
      return {
        id: user.Id,
        name: user.FullName,
        username: user.UserName,
        email: user.Email,
        phone: user.MobileNumber,
        active: user.IsActive === 1,
        role: matchedRole ? matchedRole.UserType : "Unknown",
        roleId: user.UserType,
      };
    });
  }, [usersData, allRoles]);

  const roleOptions = useMemo(() => {
    return ["All Roles", ...(allRoles?.data?.map((r) => r.UserType) || [])];
  }, [allRoles]);

  const { filteredUsers, totalPages, paginatedUsers } = useMemo(() => {
    const filtered = users.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery);

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && user.active) ||
        (statusFilter === "Inactive" && !user.active);

      const matchesRole =
        roleFilter === "All Roles" || user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });

    const total = Math.ceil(filtered.length / usersPerPage);
    const paginated = filtered.slice(
      (currentPage - 1) * usersPerPage,
      currentPage * usersPerPage
    );

    return {
      filteredUsers: filtered,
      totalPages: total,
      paginatedUsers: paginated,
    };
  }, [users, searchQuery, statusFilter, roleFilter, currentPage]);

  const handleEditUser = (user) => {
    navigate(`edit/${user.id}`);
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    try {
      if (selectedUser.active) {
        await deactiveUser({ id: selectedUser.id }).unwrap();
        toast.success("User deactivated successfully");
      } else {
        await updateUserStatus({
          id: selectedUser.id,
          data: { IsActive: 1 },
        }).unwrap();
        toast.success("User activated successfully");
      }
      refetch();
    } catch (err) {
      console.error("Failed to toggle user status:", err);
      toast.error("Failed to update status");
    } finally {
      setShowModal(false);
      setSelectedUser(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setRoleFilter("All Roles");
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading || isAllRolesLoading)
    return <Loader message="Loading users..." />;

  return (
    <div className="max-w-7xl">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
          <h1 className="text-2xl font-bold">User Management</h1>
          <HasPermission module="User Management" action="create">
            <Button
              icon={FiPlus}
              onClick={() => navigate("create-user")}
              className="bg-blue-600 text-white"
            >
              Add User
            </Button>
          </HasPermission>
        </div>

        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={["All", "Active", "Inactive"]}
          roleFilter={roleFilter}
          onRoleChange={setRoleFilter}
          roleOptions={roleOptions}
          onReset={resetFilters}
        />

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <UserTable
            users={paginatedUsers}
            onEdit={handleEditUser}
            onToggleStatus={(user) => {
              setSelectedUser(user);
              setShowModal(true);
            }}
            navigate={navigate}
          />
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            className="mt-4"
          />
        )}
        <ConfirmationModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
          onConfirm={handleToggleStatus}
          title="Confirm Status Change"
          message={`Are you sure you want to ${
            selectedUser?.active ? "deactivate" : "activate"
          } the user "${selectedUser?.name}"?`}
          isLoading={isRoleDeActivateLoading}
        />
      </div>
    </div>
  );
};

export default UserManagement;
