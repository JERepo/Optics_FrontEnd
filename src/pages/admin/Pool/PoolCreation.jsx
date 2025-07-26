import React, { useState, useMemo } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiEye,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { IoFilter } from "react-icons/io5";
import { useNavigate } from "react-router";

import Button from "../../../components/ui/Button";
import Toggle from "../../../components/ui/Toggle";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import HasPermission from "../../../components/HasPermission";
import { Table, TableRow, TableCell } from "../../../components/Table";
import {
  useDeActivateMutation,
  useGetAllPoolQuery,
} from "../../../api/poolApi";
import { PoolCat } from "../../../utils/constants/PoolCategory";

const PoolCreation = () => {
  const navigate = useNavigate();
  const locale = "en";

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [isCategoryPopupOpen, setIsCategoryPopupOpen] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useGetAllPoolQuery();
  const [deActivate, { isLoading: isDeActivating }] = useDeActivateMutation();

  const pools = useMemo(() => {
    if (!data?.data) return [];

    let processed = data.data.map((pool) => ({
      id: pool.Id,
      name: pool.PoolName?.trim() || "",
      category:
        PoolCat.find((p) => p.Id == pool.PoolCategory)?.PoolCategory ||
        "Unknown",
      createdAt: new Intl.DateTimeFormat("en-IN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }).format(new Date(pool.CreatedDate)),
      enabled: pool.IsActive,
    }));

    if (categoryFilter) {
      processed = processed.filter(
        (pool) => pool.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    if (sortConfig.key === "name") {
      processed.sort((a, b) => {
        const nameA = a.name.toLowerCase().trim();
        const nameB = b.name.toLowerCase().trim();
        return sortConfig.direction === "asc"
          ? nameA.localeCompare(nameB, locale, { sensitivity: "base" })
          : nameB.localeCompare(nameA, locale, { sensitivity: "base" });
      });
    }

    return processed;
  }, [data, sortConfig, categoryFilter]);

  const filteredPools = pools.filter(
    (pool) =>
      pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPools = filteredPools.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(filteredPools.length / pageSize);

  // Handlers
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category);
    setIsCategoryPopupOpen(false);
  };

  const toggleCategoryPopup = () => {
    setIsCategoryPopupOpen((prev) => !prev);
  };

  const requestToggle = (id, status) => {
    setSelectedPoolId(id);
    setCurrentStatus(status);
    setIsModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    try {
      await deActivate({
        id: selectedPoolId,
        payload: { IsActive: currentStatus ? 0 : 1 },
      }).unwrap();
    } catch (err) {
      console.error("Toggle error:", err);
    } finally {
      setIsModalOpen(false);
      setSelectedPoolId(null);
      setCurrentStatus(null);
    }
  };

  const handleEdit = (id) => {
    navigate(`edit/${id}`);
  };

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl text-neutral-700 font-semibold">
          Pool Creation
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 border-2 border-neutral-300 rounded-md px-3 w-full sm:w-[250px] h-10 bg-white">
            <FiSearch className="text-neutral-500 text-lg" />
            <input
              type="text"
              placeholder="Search pools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none text-sm text-neutral-700 placeholder-neutral-400 bg-transparent"
            />
          </div>
          <HasPermission module="Pool" action="create">
            <Button
              icon={FiPlus}
              iconPosition="left"
              className="bg-primary/90 text-white hover:bg-primary/70 transition-all"
              onClick={() => navigate("create")}
            >
              Add Pool
            </Button>
          </HasPermission>
        </div>
      </div>

      <Table
        columns={["S.No", "Pool Category", "Pool Name", "Created On", ""]}
        data={paginatedPools}
        renderHeader={(column) => {
          if (column === "Pool Category") {
            return (
              <div className="relative flex items-center gap-2">
                <span>{column}</span>
                <IoFilter
                  onClick={toggleCategoryPopup}
                  className="cursor-pointer text-neutral-500 hover:text-primary"
                />
                {isCategoryPopupOpen && (
                  <div className="absolute top-8 left-0 bg-white border border-neutral-200 rounded-md shadow-lg z-10">
                    {["Vendor", "Customer", "Stock"].map((cat) => (
                      <div
                        key={cat}
                        onClick={() => handleCategoryFilter(cat)}
                        className="px-4 py-2 hover:bg-neutral-100 cursor-pointer"
                      >
                        {cat}
                      </div>
                    ))}
                    <div
                      onClick={() => handleCategoryFilter(null)}
                      className="px-4 py-2 hover:bg-neutral-100 cursor-pointer border-t"
                    >
                      Clear Filter
                    </div>
                  </div>
                )}
              </div>
            );
          }

          if (column === "Pool Name") {
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
            <TableCell className="text-sm text-neutral-900">
              {startIndex + index + 1}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.category}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.name}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.createdAt}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <HasPermission module="Pool" action="view">
                  <FiEye
                    onClick={() => navigate(`view/${pool.id}`)}
                    className="text-xl cursor-pointer"
                  />
                </HasPermission>
                <HasPermission module="Pool" action="edit">
                  <button onClick={() => handleEdit(pool.id)}>
                    <FiEdit2 size={18} />
                  </button>
                </HasPermission>
                <HasPermission module="Pool" action="deactivate">
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
            ? "Loading pools..."
            : searchQuery || categoryFilter
            ? "No pools match your search or filter criteria"
            : "No pools found. Click 'Add Pool' to create one."
        }
        pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        totalItems={filteredPools.length}
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

export default PoolCreation;
