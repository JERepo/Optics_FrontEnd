import React, { useState, useMemo } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiEye,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { useNavigate } from "react-router";
import { Table, TableRow, TableCell } from "../../../components/Table";
import Toggle from "../../../components/ui/Toggle";

import { PoolCat } from "../../../utils/constants/PoolCategory";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import HasPermission from "../../../components/HasPermission";
import {
  useDeActivateMutation,
  useGetAllBrandGroupsQuery,
} from "../../../api/brandGroup";

const BrandGroup = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const locale = navigator.language || navigator.languages[0] || "en-IN";

  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  const { data, isLoading } = useGetAllBrandGroupsQuery();
  const [deActivate, { isLoading: isDeActivating }] = useDeActivateMutation();

  const brands = useMemo(() => {
    if (!data?.data) return [];

    let processed = data.data.map((brand) => ({
      id: brand.Id,
      name: brand.BrandGroupName,

      createdAt: new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }).format(new Date(brand.CreatedDate)),
      enabled: brand.IsActive,
    }));
    if (sortConfig.key === "name") {
      processed.sort((a, b) => {
        const nameA = a.name.toLowerCase().trim();
        const nameB = b.name.toLowerCase().trim();
        return sortConfig.direction === "asc"
          ? nameA.localeCompare(nameB, "en", { sensitivity: "base" })
          : nameB.localeCompare(nameA, "en", { sensitivity: "base" });
      });
    }

    return processed;
  }, [data, searchQuery,sortConfig]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPools = brands.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(brands.length / pageSize);

  const handleSort = (name) => {
    setSortConfig((prev) => ({
      ...prev,
      direction: prev.key === name && prev.direction === "asc" ? "desc" : "asc",
    }));
  };
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
          Brand Group
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
          <HasPermission module="Brand group" action="create">
            <Button
              icon={FiPlus}
              iconPosition="left"
              className="bg-primary/90 text-neutral-50 hover:bg-primary/70 transition-all whitespace-nowrap"
              onClick={() => navigate("create")}
            >
              Add Brand Group
            </Button>
          </HasPermission>
        </div>
      </div>

      <Table
        columns={["S.No", "Brand Group", "created on", ""]}
        data={paginatedPools}
        renderHeader={(column) => {
          if (column === "Brand Group") {
            return (
              <div className="flex items-center gap-2">
                <span>{column}</span>
                <button onClick={() => handleSort("name")}>
                  {sortConfig.key === "name" &&
                  sortConfig.direction === "asc" ? (
                    <FiArrowUp className="text-neutral-500 hover:text-primary" />
                  ) : (
                    <FiArrowDown className="text-neutral-500 hover:text-primary" />
                  )}
                </button>
              </div>
            );
          }
          return column;
        }}
        renderRow={(pool, index) => (
          <TableRow key={pool.id}>
            <TableCell className="text-sm font-medium text-neutral-900">
              {startIndex + index + 1}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.name}
            </TableCell>

            <TableCell className="text-sm text-neutral-500">
              {pool.createdAt}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <HasPermission module="Brand group" action="view">
                  <FiEye
                    onClick={() => navigate(`view/${pool.id}`)}
                    className="text-xl cursor-pointer"
                  />
                </HasPermission>
                <HasPermission module="Brand group" action="edit">
                  <button
                    onClick={() => handleEdit(pool.id)}
                    className="text-neutral-600 hover:text-primary transition-colors"
                    aria-label="Edit"
                  >
                    <FiEdit2 size={18} />
                  </button>
                </HasPermission>

                {/* Only show toggle if enabled field is available */}
                <HasPermission module="Brand group" action="deactivate">
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
            ? "Loading groups..."
            : searchQuery
            ? "No groups match your search criteria"
            : "No groups found. Click 'Add Pool' to create one."
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

export default BrandGroup;
