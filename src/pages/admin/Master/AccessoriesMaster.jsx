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
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import HasPermission from "../../../components/HasPermission";
import {
  useDeActivateMainMutation,
  useGetAllMasterQuery,
} from "../../../api/accessoriesMaster";

const AccessoriesMaster = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortOrder, setSortOrder] = useState("newToOld");
  const locale = navigator.language || navigator.languages[0] || "en-GB";

  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: allAccessories, isLoading, error } = useGetAllMasterQuery();
  const [deActivate, { isLoading: isDeActivating }] =
    useDeActivateMainMutation();

  const accessories = useMemo(() => {
    if (!allAccessories?.data) return [];

    let sortedAccessories = allAccessories?.data.map((acc) => ({
      id: acc.Id,
      BrandName: acc.Brand.BrandName,
      ProductName: acc.ProductName,
      code: acc.HSN,
      createdAt: new Intl.DateTimeFormat(locale, {
         day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(acc.CreatedDate)),
      createdAtRaw: new Date(acc.CreatedDate),
      enabled: acc.IsActive === 1,
    }));

    // Sort by createdAtRaw based on sortOrder
    sortedAccessories.sort((a, b) => {
      if (sortOrder === "newToOld") {
        return b.createdAtRaw - a.createdAtRaw; // Newest first
      } else {
        return a.createdAtRaw - b.createdAtRaw; // Oldest first
      }
    });

    return sortedAccessories.filter((frame) => {
      const query = searchQuery?.toLocaleLowerCase();
      return (
        frame.BrandName.toLocaleLowerCase().includes(query) ||
        frame.ProductName.toLocaleLowerCase().includes(query)
      );
    });
  }, [allAccessories, sortOrder,searchQuery]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPools = accessories.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(accessories.length / pageSize);

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

  // Toggle sort order
  const handleSortToggle = () => {
    setSortOrder(sortOrder === "newToOld" ? "oldToNew" : "newToOld");
  };

  if (isLoading) return <h1>Loading...</h1>;
  if (error) return <h1>Error</h1>;

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="text-3xl text-neutral-700 font-semibold">
          Accessories
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
          <HasPermission module="Accessory Master" action="create">
            <Button
              icon={FiPlus}
              iconPosition="left"
              className="bg-primary/90 text-neutral-50 hover:bg-primary/70 transition-all whitespace-nowrap"
              onClick={() => {
                navigate("create");
                window.location.reload();
              }}
            >
              Add Accessory
            </Button>
          </HasPermission>
        </div>
      </div>

      <Table
        columns={[
          "S.No",
          "Brand Name",
          "Product Name",
          <div className="flex items-center gap-2">
            Created On
            <button onClick={handleSortToggle} className="focus:outline-none">
              {sortOrder === "newToOld" ? (
                <FiArrowDown className="text-neutral-500" />
              ) : (
                <FiArrowUp className="text-neutral-500" />
              )}
            </button>
          </div>,
          "",
        ]}
        data={paginatedPools}
        renderRow={(pool, index) => (
          <TableRow key={pool.id}>
            <TableCell className="text-sm font-medium text-neutral-900">
              {startIndex + index + 1}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.BrandName}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.ProductName}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.createdAt}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <HasPermission module="Accessory Master" action="view">
                  <FiEye
                    onClick={() => navigate(`view/${pool.id}`)}
                    className="text-xl cursor-pointer"
                    title="View"
                  />
                </HasPermission>
                <HasPermission module="Accessory Master" action="edit">
                 <button
                    onClick={() => handleEdit(pool.id)}
                    className="text-neutral-600 hover:text-primary transition-colors"
                    aria-label="Edit"
                    title="Edit"
                  >
                    <FiEdit2 size={18} />
                  </button>
                </HasPermission>
                <HasPermission module="Accessory Master" action="deactivate">
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
            ? "Loading accessories..."
            : searchQuery
            ? "No accessories match your search criteria"
            : "No accessories found. Click 'Add accessories' to create one."
        }
        pagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        totalItems={allAccessories.length}
      />
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmToggle}
        title={`Are you sure you want to ${
          currentStatus ? "deactivate" : "activate"
        } this Accessory Master?`}
        message={`This will ${
          currentStatus ? "deactivate" : "activate"
        } the Accessory Master. You can change it again later.`}
        confirmText={currentStatus ? "Deactivate" : "Activate"}
        danger={currentStatus}
        isLoading={isDeActivating}
      />
    </div>
  );
};

export default AccessoriesMaster;
