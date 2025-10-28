import React, { useEffect, useState, useMemo } from "react"; // Added useMemo
import {
  FiSearch,
  FiUser,
  FiEdit2,
  FiEye,
  FiTrash2,
  FiPlus,
  FiShield,
  FiLoader,
} from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useCreateRoleMutation,
  useGetAllPageNameQuery,
  useGetPageByIdQuery,
  useUpdatePrevilageMutation,
} from "../../../api/roleManagementApi";
import { toast } from "react-hot-toast";
import { hasPermission } from "../../../utils/permissionUtils";
import { useSelector } from "react-redux";
import HasPermission from "../../../components/HasPermission";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import { CheckCheckIcon, CheckCircle2Icon } from "lucide-react";

const PagePermissions = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEnabled = location.pathname.includes("/view");
  const isNew = !id;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { isLoading, data } = useGetPageByIdQuery(id, { skip: isNew });
  const { data: pageNames, isLoading: pageNamesLoading } =
    useGetAllPageNameQuery();

  const [updatePrevilage, { isLoading: isUpdatingRole }] =
    useUpdatePrevilageMutation();
  const [createRole, { isLoading: isCreatingRoleLoading }] =
    useCreateRoleMutation();

  const [formState, setFormState] = useState({
    name: "",
    permissions: {},
  });

  const filteredPageNames = useMemo(() => {
    if (!pageNames?.data) return [];
    return pageNames.data.filter((page) =>
      page.PageName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pageNames?.data, searchTerm]);

  useEffect(() => {
    if (!isNew && data?.data && pageNames?.data) {
      const roleData = data.data;
      const allPages = pageNames.data;

      const permissionsMap = {};

      allPages.forEach((page) => {
        const pageId = page.Id;
        const matchingPage = roleData.find((p) => p.PageId === pageId);

        const perms = {
          view: false,
          create: false,
          edit: false,
          deactivate: false,
        };

        if (matchingPage) {
          matchingPage.Privileges.forEach((priv) => {
            const key = priv.PrivilegeName.toLowerCase();
            perms[key] = true;
          });
        }

        permissionsMap[String(pageId)] = perms;
      });

      setFormState({
        name: roleData[0]?.UserType || "",
        permissions: permissionsMap,
      });
    }
  }, [data, pageNames, isNew]);

  useEffect(() => {
    if (isNew && pageNames?.data) {
      const permissionsMap = {};
      pageNames.data.forEach((page) => {
        const pageId = page.Id;
        permissionsMap[String(pageId)] = {
          view: false,
          create: false,
          edit: false,
          deactivate: false,
        };
      });

      setFormState((prev) => ({
        ...prev,
        permissions: permissionsMap,
      }));
    }
  }, [isNew, pageNames]);

  const handlePermissionChange = (pageId, permKey) => {
    const pageKey = String(pageId);
    setFormState((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [pageKey]: {
          ...prev.permissions[pageKey],
          [permKey]: !prev.permissions[pageKey][permKey],
        },
      },
    }));
  };


  const handleSelectAll = () => {
    if (!pageNames?.data) return;

    // Check if all permissions are currently selected
    const allSelected = pageNames.data.every((page) => {
      const pageId = String(page.Id);
      const perms = formState.permissions[pageId];
      return perms?.view && perms?.create && perms?.edit && perms?.deactivate;
    });

    // Toggle: if all are selected, deselect all; otherwise select all
    const newPermissions = {};
    pageNames.data.forEach((page) => {
      const pageId = String(page.Id);
      newPermissions[pageId] = {
        view: !allSelected,
        create: !allSelected,
        edit: !allSelected,
        deactivate: !allSelected,
      };
    });

    setFormState((prev) => ({
      ...prev,
      permissions: newPermissions,
    }));
  };

  const handleSubmit = async () => {
    if (isNew && !formState.name.trim()) {
      toast.error("Role is missing");
      return;
    }

    if (!pageNames?.data) return;

    const permission = pageNames.data.map((page) => {
      const pageId = String(page.Id);
      const currentPerms = formState.permissions[pageId] || {};
      const selectedPrivileges = [];

      const privilegeMap = {
        view: 1,
        create: 2,
        edit: 3,
        deactivate: 4,
      };

      Object.entries(currentPerms).forEach(([key, value]) => {
        if (value && privilegeMap[key]) {
          selectedPrivileges.push(privilegeMap[key]);
        }
      });

      return {
        PageId: parseInt(pageId),
        Privileges: selectedPrivileges,
      };
    });

    const payload = {
      UserType: formState.name,
      permission,
    };

    try {
      if (isNew) {
        await createRole({ payload }).unwrap();
        toast.success("Role created successfully!");
      } else {
        await updatePrevilage({ id, formData: payload }).unwrap();
        toast.success("Role updated successfully!");
      }
      navigate("/role-management");
    } catch (err) {
      console.error("Operation failed:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (isLoading || (isNew && pageNamesLoading)) return <h1>Loading...</h1>;

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold text-neutral-700">
          {isNew
            ? "Add New Role"
            : isEnabled
              ? "View All Permissions:"
              : `Edit Permissions:`}
        </h2>
        {!isNew && !isEnabled && (
          <div className="flex items-center gap-2 border border-neutral-300 rounded-md px-3 w-[250px] h-10 bg-white">
            <FiSearch className="text-neutral-500 text-lg" />
            <input
              type="text"
              placeholder="Search pages..."
              className="w-full text-sm text-neutral-700 placeholder-neutral-400 bg-transparent outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} // New: Handle search
            />
          </div>
        )}
      </div>

      {isNew && (
        <div className="mt-6">
          <label className="block mb-1 text-md text-gray-600 font-medium">
            Role Name
          </label>
          <input
            type="text"
            className="border border-gray-300 rounded-md px-3 py-2 w-sm text-sm"
            value={formState.name}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold text-neutral-700">
            Page Permissions
          </h3>

          {/* Select All / Deselect All button */}
          {!isEnabled && (
            <HasPermission module="Role Management" action="edit">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex items-center gap-1.5"
              >
                <CheckCheckIcon className="text-sm" />
                {(() => {
                  // Determine if **every** permission for **every** page is checked
                  const allChecked =
                    pageNames?.data?.length > 0 &&
                    pageNames.data.every((page) => {
                      const pid = String(page.Id);
                      const p = formState.permissions[pid];
                      return p?.view && p?.create && p?.edit && p?.deactivate;
                    });

                  return allChecked ? "Deselect All" : "Select All";
                })()}
              </Button>
            </HasPermission>
          )}
        </div>

        <PermissionTable
          data={filteredPageNames.map((page) => ({
            Id: page.Id,
            Name: page.PageName,
            PageId: page.Id,
            PageName: page.PageName,
          }))}
          permissions={formState.permissions}
          onPermissionToggle={handlePermissionChange}
          isNew={isNew}
          isEnabled={isEnabled}
          searchTerm={searchTerm}
        />
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        {!isEnabled && (
          <HasPermission module="Role Management" action="edit">
            <Button
              icon={
                isNew
                  ? isCreatingRoleLoading
                    ? "Creating"
                    : FiPlus
                  : isUpdatingRole
                    ? "Updating"
                    : FiPlus
              }
              iconPosition="left"
              onClick={() => {
                setConfirmAction(() => handleSubmit);
                setIsModalOpen(true);
              }}
              disabled={isCreatingRoleLoading || isUpdatingRole}
            >
              {isNew
                ? isCreatingRoleLoading
                  ? "Creating..."
                  : "Create Role"
                : isUpdatingRole
                  ? "Updating..."
                  : "Update Role"}
            </Button>
          </HasPermission>
        )}
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => {
          setIsModalOpen(false);
          confirmAction?.();
        }}
        title={isNew ? "Create Role?" : "Update Role?"}
        message={
          isNew
            ? "Are you sure you want to create this role with the selected permissions?"
            : "Are you sure you want to update this role's permissions?"
        }
        confirmText={isNew ? "Create" : "Update"}
        cancelText="Cancel"
        danger={false}
        isLoading={isCreatingRoleLoading || isUpdatingRole}
      />
    </div>
  );
};

export default PagePermissions;

const PermissionTable = ({
  data,
  permissions,
  onPermissionToggle,
  isNew,
  isEnabled,
  searchTerm, // New: Prop for searchTerm
}) => {
  const headers = [
    { key: "create", label: "Create", icon: <FiPlus /> },
    { key: "edit", label: "Edit", icon: <FiEdit2 /> },
    { key: "view", label: "View", icon: <FiEye /> },
    { key: "deactivate", label: "Deactivate", icon: <FiShield /> },
  ];
  const access = useSelector((state) => state.auth?.access);

  // New: Updated empty state based on search
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        {searchTerm ? `No pages found for "${searchTerm}"` : "No pages available"}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
      <table className="w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr className="flex">
            <TableHeader
              icon={<FiUser />}
              label="Page Name"
              width="1/3"
              align="left"
            />
            {headers.map((header) => (
              <TableHeader
                key={header.key}
                icon={header.icon}
                label={header.label}
              />
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((page) => {
            const pageId = String(page.PageId);
            const pageName = page.PageName;

            return (
              <tr
                key={pageId}
                className="flex hover:bg-gray-50 transition-colors"
              >
                <td className="w-1/3 px-6 py-4 text-sm font-medium text-gray-800">
                  {pageName}
                </td>
                {headers.map((header) => (
                  <td
                    key={`${pageId}-${header.key}`}
                    className="w-1/6 px-4 py-4 flex items-center justify-center"
                  >
                    <input
                      type="checkbox"
                      checked={permissions?.[pageId]?.[header.key] || false}
                      onChange={() => onPermissionToggle(pageId, header.key)}
                      disabled={
                        !hasPermission(access, "Role Management", "edit") ||
                        isEnabled
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const TableHeader = ({ icon, label, width = "1/6", align = "center" }) => {
  const justifyClass =
    align === "left" ? "justify-start pl-6" : "justify-center";
  return (
    <th
      className={`w-${width} px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center ${justifyClass}`}
    >
      {icon}
      <span className="ml-1">{label}</span>
    </th>
  );
};