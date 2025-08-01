import React, { useState, useMemo } from "react";
import { FiSearch, FiPlus, FiEdit2, FiEye } from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { useNavigate } from "react-router";
import { Table, TableRow, TableCell } from "../../../components/Table";
import Toggle from "../../../components/ui/Toggle";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import HasPermission from "../../../components/HasPermission";
import {
  useDeActivateMutation,
  useGetAllBankAccountsQuery,
} from "../../../api/BankAccountDetailsApi";
import { useGetAllBankMastersQuery } from "../../../api/bankMasterApi";

const accountType = [
  { value: 0, label: "Savings" },
  { value: 1, label: "Current" },
  { value: 2, label: "OD" },
];

const BankAccountDetails = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const locale = navigator.language || navigator.languages[0] || "en-IN";

  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useGetAllBankAccountsQuery();
  const [deActivate, { isLoading: isDeActivating }] = useDeActivateMutation();
  const { data: allBanks } = useGetAllBankMastersQuery();

  const brands = useMemo(() => {
    if (!data?.data) return [];

    return data.data.data
      .map((brand) => ({
        id: brand.Id,
        name: allBanks?.data.data.find((b) => b.Id === brand.BankMasterID)
          .BankName,
        number: brand.AccountNo,
        type: accountType.find((a) => a.value === brand.Type).label,
        createdAt: new Intl.DateTimeFormat(locale, {
          year: "numeric",
          month: "short",
          day: "2-digit",
        }).format(new Date(brand.CreatedDate)),
        enabled: brand.IsActive,
      }))
      .filter((master) => {
        const query = searchQuery?.toLocaleLowerCase();
        return (
          master.name.toLocaleLowerCase().includes(query) ||
          master.number.toLocaleLowerCase().includes(query) ||
          master.type.toLocaleLowerCase().includes(query)
        );
      });
  }, [data, searchQuery]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPools = brands.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(brands.length / pageSize);

  const requestToggle = (poolId, status) => {
    setSelectedBrandId(poolId);
    setCurrentStatus(status);
    setIsModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    try {
      await deActivate({
        id: selectedBrandId,
        payload: { IsActive: currentStatus ? 0 : 1 },
      }).unwrap();
    } catch (error) {
      console.error("Toggle error:", error);
    } finally {
      setIsModalOpen(false);
      setSelectedBrandId(null);
      setCurrentStatus(null);
    }
  };

  const handleEdit = (poolId) => {
    navigate(`edit/${poolId}`);
  };

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="text-3xl text-neutral-700 font-semibold">
          Bank Account Details
        </div>
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
          <HasPermission module="Bank Account Details" action="create">
            <Button
              icon={FiPlus}
              iconPosition="left"
              className="bg-primary/90 text-neutral-50 hover:bg-primary/70 transition-all whitespace-nowrap"
              onClick={() => navigate("create")}
            >
              Add Bank Account Details
            </Button>
          </HasPermission>
        </div>
      </div>

      <Table
        columns={[
          "S.No",
          "Bank name",
          "Account number",
          "Account type",
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
              {pool.number}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.type}
            </TableCell>

            <TableCell>
              <div className="flex items-center gap-3">
                <HasPermission module="Bank Account Details" action="view">
                  <FiEye
                    onClick={() => navigate(`view/${pool.id}`)}
                    className="text-xl cursor-pointer"
                  />
                </HasPermission>
                <HasPermission module="Bank Account Details" action="edit">
                  <button
                    onClick={() => handleEdit(pool.id)}
                    className="text-neutral-600 hover:text-primary transition-colors"
                    aria-label="Edit"
                  >
                    <FiEdit2 size={18} />
                  </button>
                </HasPermission>

                {/* Only show toggle if enabled field is available */}
                <HasPermission
                  module="Bank Account Details"
                  action="deactivate"
                >
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
            ? "Loading accounts..."
            : searchQuery
            ? "No accounts match your search criteria"
            : "No account found. Click 'Add account' to create one."
        }
        pagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        totalItems={brands.length}
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

export default BankAccountDetails;
