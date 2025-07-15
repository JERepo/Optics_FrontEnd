import React, { useState, useMemo } from "react";
import { FiSearch, FiPlus, FiEdit2, FiEye, FiCreditCard } from "react-icons/fi";

import { useNavigate } from "react-router";
import Toggle from "../../components/ui/Toggle";
import { Table, TableCell, TableRow } from "../../components/Table";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import HasPermission from "../../components/HasPermission";
import Button from "../../components/ui/Button";
import {
  useDeActivateMutation,
  useGetAllVendorQuery,
} from "../../api/vendorApi";
import { useSelector } from "react-redux";

const Vendor = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const locale = navigator.language || navigator.languages[0] || "en-IN";

  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const { data, isLoading } = useGetAllVendorQuery();
  const [deActivate, { isLoading: isDeActivating }] = useDeActivateMutation();

  const customers = useMemo(() => {
    if (!data?.data) return [];

    return data?.data?.data
      .map((customer) => ({
        id: customer.Id,
        name: customer.VendorName,
        phone: customer.MobNumber,
        emailId: customer.Email,
        billingMethod: customer.BillingMethod,
        enabled: customer.IsActive === 1,
      }))
      .filter((customer) => {
        const query = searchQuery.toLowerCase();
        return (
          customer.name.toLowerCase().includes(query) ||
          customer.emailId.toLowerCase().includes(query)
        );
      });
  }, [data, searchQuery, isLoading]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPools = customers.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(customers.length / pageSize);

  const requestToggle = (poolId, status) => {
    setSelectedCustomerId(poolId);
    setCurrentStatus(status);
    setIsModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    try {
      await deActivate({
        id: selectedCustomerId,
        appId: user.Id,
        payload: { IsActive: currentStatus ? 0 : 1 },
      }).unwrap();
    } catch (error) {
      console.error("Toggle error:", error);
    } finally {
      setIsModalOpen(false);
      setSelectedCustomerId(null);
      setCurrentStatus(null);
    }
  };

  const handleEdit = (poolId) => {
    navigate(`edit/${poolId}`);
  };

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="text-3xl text-neutral-700 font-semibold">Vendor</div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 border-2 border-neutral-300 rounded-md px-3 w-full sm:w-[250px] h-10 bg-white">
            <FiSearch className="text-neutral-500 text-lg" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none text-sm text-neutral-700 placeholder-neutral-400 bg-transparent"
            />
          </div>
          <HasPermission module="Brand group" action="create">
            <Button
              icon={FiPlus}
              iconPosition="left"
              className="bg-primary/90 text-neutral-50 hover:bg-primary/70 transition-all whitespace-nowrap"
              onClick={() => navigate("create")}
            >
              Add vendor
            </Button>
          </HasPermission>
        </div>
      </div>

      <Table
        columns={[
          "S.No",
          "Vendor Name",

          "Phone No",
          "Email id",
          "billing method",
          "Action",
        ]}
        data={paginatedPools}
        renderRow={(pool, index) => (
          <TableRow key={pool.id}>
            <TableCell className="text-sm font-medium text-neutral-900">
              {startIndex + index + 1}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.name}
            </TableCell>

            <TableCell className="text-sm text-neutral-500">
              {pool.phone}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.emailId}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.billingMethod}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <HasPermission module="Customer" action="view">
                  <FiEye
                    onClick={() => navigate(`view/${pool.id}`)}
                    className="text-xl cursor-pointer"
                  />
                </HasPermission>
                <HasPermission module="Customer" action="edit">
                  <button
                    onClick={() => handleEdit(pool.id)}
                    className="text-neutral-600 hover:text-primary transition-colors"
                    aria-label="Edit"
                  >
                    <FiEdit2 size={18} />
                  </button>
                </HasPermission>

                {/* Only show toggle if enabled field is available */}
                <HasPermission module="Customer" action="deactivate">
                  <Toggle
                    enabled={pool.enabled}
                    onToggle={() => requestToggle(pool.id, pool.enabled)}
                  />
                </HasPermission>
              </div>
            </TableCell>
          </TableRow>
        )}
        emptyMessage={
          isLoading
            ? "Loading vendors..."
            : searchQuery
            ? "No vendors match your search criteria"
            : "No vendors found. Click 'Add vendors' to create one."
        }
        pagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        totalItems={customers.length}
      />
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmToggle}
        title={`Are you sure you want to ${
          currentStatus ? "deactivate" : "activate"
        } this pool?`}
        message={`This will ${
          currentStatus ? "deactivate" : "activate"
        } the pool. You can change it again later.`}
        confirmText={currentStatus ? "Deactivate" : "Activate"}
        danger={currentStatus}
        isLoading={isDeActivating}
      />
    </div>
  );
};

export default Vendor;
