import { FiSearch } from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { FiPlus } from "react-icons/fi";
import { FiEdit2, FiTrash2, FiShield, FiUser, FiEye } from "react-icons/fi";
import roleEmpty from "../../../assets/role-empty-3.png";
import { Link, useNavigate } from "react-router";
import Loader from "../../../components/ui/Loader";
import {
  useDeactiveRoleMutation,
  useGetAllPagesQuery,
  useUpdateRoleMutation,
} from "../../../api/roleManagementApi";
import { useSelector } from "react-redux";
import HasPermission from "../../../components/HasPermission";
import { useState } from "react";
import Toggle from "../../../components/ui/Toggle";
import toast from "react-hot-toast";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";

const RoleManagement = () => {
  const navigate = useNavigate();
  const { isLoading, data, isError, refetch } = useGetAllPagesQuery();
  const [enabled, setEnabled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const roles = useSelector((state) => state.auth.roles);
  const [deactiveRole, { isLoading: isRoleDeActivateLoading }] =
    useDeactiveRoleMutation();
  const [updateRole] = useUpdateRoleMutation();

  if (isLoading) return <Loader />;
  if (isError) return "Got some error";

  const isEmpty = data.data?.length === 0;

  const handleToggleStatus = async () => {
    if (!selectedRole) return;
    try {
      if (selectedRole.IsActive) {
        await deactiveRole({ id: selectedRole.Id }).unwrap();
        toast.success("Role deactivated successfully");
      } else {
        await updateRole({
          id: selectedRole.Id,
          data: { IsActive: 1 },
        }).unwrap();
        toast.success("Role activated successfully");
      }
      refetch();
    } catch (error) {
      console.error("Failed to toggle role status", error);
      // Access the error message from the API response
      const errorMessage = error?.data?.error || error?.error || "Failed to update role status";
      toast.error(errorMessage);
    } finally {
      setShowModal(false);
      setSelectedRole(null);
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="text-3xl text-neutral-700 font-semibold">
          Role Management
        </div>
        <div className="flex gap-5 items-center">
          <div className="flex items-center gap-2 border-2 border-neutral-300 rounded-md px-3 w-[250px] h-10 bg-white">
            <FiSearch className="text-neutral-500 text-lg" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full outline-none text-sm text-neutral-700 placeholder-neutral-400 bg-transparent"
            />
          </div>
          <div>
            <HasPermission module="Role Management" action="create">
              <Button
                icon={FiPlus}
                iconPosition="left"
                variant=""
                className="bg-primary/90 text-neutral-50 cursor-pointer hover:bg-primary/70 transition-all"
                onClick={() => navigate("add-role")}
              >
                Add Role
              </Button>
            </HasPermission>
          </div>
        </div>
      </div>

      {/* table section to manage the actions according to the role*/}
      {isEmpty && (
        <div className="flex flex-col gap-3 justify-center items-center p-20">
          <img src={roleEmpty} className="bg-transparent w-[400px]" />
          <Button
            icon={FiPlus}
            iconPosition="left"
            variant=""
            className="bg-primary/90 text-neutral-50 cursor-pointer hover:bg-primary/70 transition-all w-[200px]"
            onClick={() => navigate("add-role")}
          >
            Add Role
          </Button>
        </div>
      )}
      {!isEmpty && (
        <RoleManagementTable
          roles={data.data}
          navigate={navigate}
          onRequestToggle={(role) => {
            setSelectedRole(role);
            setShowModal(true);
          }}
        />
      )}
      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleToggleStatus}
        title="Confirm Status Change"
        message={`Are you sure you want to ${selectedRole?.IsActive ? "deactivate" : "activate"
          } the role "${selectedRole?.UserType}"?`}
        isLoading={isRoleDeActivateLoading}
      />
    </div>
  );
};

export default RoleManagement;

const RoleManagementTable = ({
  roles,
  navigate,
  setEnabled,
  enabled,
  onRequestToggle,
}) => {
  return (
    <div className="mt-7">
      <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="flex justify-between items-center">
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center"
              >
                <FiUser className="mr-1 text-xl" /> Role Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <FiEdit2 className="inline mr-1 text-xl" /> Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((role) => (
              <tr
                key={role.id}
                className="flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 flex items-center">
                  {role.icon} {role.UserType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                  <div className="flex gap-2 items-center">
                    <HasPermission module="Role Management" action="view">
                      <FiEye
                        onClick={() => navigate(`view/${role.Id}`)}
                        className="text-xl cursor-pointer"
                      />
                    </HasPermission>
                    <HasPermission module="Role Management" action="edit">
                      <button
                        className="px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition flex items-center cursor-pointer"
                        aria-label="Edit role"
                        onClick={() => navigate(`edit-role/${role.Id}`)}
                      >
                        <FiEdit2 className="mr-1" />
                      </button>
                    </HasPermission>

                    <HasPermission module="Role Management" action="edit">
                      <Toggle
                        enabled={role.IsActive}
                        onToggle={() => onRequestToggle(role)}
                        className="cursor-pointer"
                      />
                    </HasPermission>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
