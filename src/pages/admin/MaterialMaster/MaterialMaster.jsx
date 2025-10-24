import React, { useState, useMemo } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiEye,
  FiArrowDown,
  FiArrowUp,
} from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { useNavigate } from "react-router";
import { Table, TableRow, TableCell } from "../../../components/Table";
import Toggle from "../../../components/ui/Toggle";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import HasPermission from "../../../components/HasPermission";
import {
  useDeActivateMutation,
  useGetAllmaterialsQuery,
} from "../../../api/materialMaster";

const MaterialMaster = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const locale = navigator.language || navigator.languages[0] || "en-IN";
  const [sortOrder, setSortOrder] = useState("asc");

  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useGetAllmaterialsQuery();
  const [deActivate, { isLoading: isDeActivating }] = useDeActivateMutation();
  

  const brands = useMemo(() => {
    if (!data) return [];

    let processed = data.map((brand) => ({
      id: brand.Id,
      name: brand.MaterialName,
      applicableFor: brand.MaterialFor == 0 ? "Frame" : "Contact Lens",
      createdAt: new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }).format(new Date(brand.CreatedDate)),
      enabled: brand.IsActive,
    }));
    // Sort by createdAtRaw based on sortOrder
    processed.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.name.localeCompare(b.name); // A-Z
      } else {
        return b.name.localeCompare(a.name); // Z-A
      }
    });

     if (searchQuery) {
      processed = processed.filter((brand) =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return processed;
  }, [data, searchQuery, sortOrder]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPools = brands.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(brands.length / pageSize);

  const requestToggle = (poolId, status) => {
    setSelectedBrandId(poolId);
    setCurrentStatus(status);
    setIsModalOpen(true);
  };
  // Toggle sort order
  const handleSortToggle = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
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
          Material Master
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
          <HasPermission module="Material Master" action="create">
            <Button
              icon={FiPlus}
              iconPosition="left"
              className="bg-primary/90 text-neutral-50 hover:bg-primary/70 transition-all whitespace-nowrap"
              onClick={() => navigate("create")}
            >
              Add Material Master
            </Button>
          </HasPermission>
        </div>
      </div>

      <Table
        columns={["S.No", "material name", "Applicable for", "created on", ""]}
        renderHeader={(column) => {
          if (column === "material name") {
            return (
              <div className="flex items-center gap-2">
                {column}
                <button
                  onClick={handleSortToggle}
                  className="focus:outline-none"
                >
                  {sortOrder === "asc" ? (
                    <FiArrowDown className="text-neutral-500" />
                  ) : (
                    <FiArrowUp className="text-neutral-500" />
                  )}
                </button>
              </div>
            );
          }
          return column;
        }}
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
              {pool.applicableFor}
            </TableCell>

            <TableCell className="text-sm text-neutral-500">
              {pool.createdAt}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <HasPermission module="Material Master" action="view">
                  <FiEye
                    onClick={() => navigate(`view/${pool.id}`)}
                    className="text-xl cursor-pointer"
                    title="View"
                  />
                </HasPermission>
                <HasPermission module="Material Master" action="edit">
                 <button
                    onClick={() => handleEdit(pool.id)}
                    className="text-neutral-600 hover:text-primary transition-colors"
                    aria-label="Edit"
                    title="Edit"
                  >
                    <FiEdit2 size={18} />
                  </button>
                </HasPermission>

                {/* Only show toggle if enabled field is available */}
                <HasPermission module="Material Master" action="deactivate">
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
            ? "Loading..."
            : searchQuery
            ? "No material master match your search criteria"
            : "No material master found. Click 'Add Material Master' to create one."
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
        } this Material Master?`}
        message={`This will ${
          currentStatus ? "deactivate" : "activate"
        } the Material Master. You can change it again later.`}
        confirmText={currentStatus ? "Deactivate" : "Activate"}
        danger={currentStatus}
        isLoading={isDeActivating}
      />
    </div>
  );
};

export default MaterialMaster;
