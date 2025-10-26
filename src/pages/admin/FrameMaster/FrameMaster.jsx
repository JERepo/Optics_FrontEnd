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
import Button from "../../../components/ui/Button";
import { useNavigate } from "react-router";
import { Table, TableRow, TableCell } from "../../../components/Table";
import Toggle from "../../../components/ui/Toggle";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import HasPermission from "../../../components/HasPermission";
import {
  useDeActivateMutation,
  useGetAllFrameMasterQuery,
} from "../../../api/frameMasterApi";

const FrameMaster = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "ModelNo",
    direction: "asc",
  });
  const [brandFilter, setBrandFilter] = useState(null);
  const [isBrandPopupOpen, setIsBrandPopupOpen] = useState(false);
  const locale = navigator.language || navigator.languages[0] || "en-GB";

  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: allAccessories, isLoading } = useGetAllFrameMasterQuery();
  const [deActivate, { isLoading: isDeActivating }] = useDeActivateMutation();

  const accessories = useMemo(() => {
    if (!allAccessories?.data) return [];

    let processed = allAccessories.data.map((acc) => ({
      id: acc.Id,
      BrandName: acc.Brand.BrandName,
      ModelNo: acc.ModelNo,
      RimType: acc.FrameRimType.FrameRimTypeName,
      RimShape: acc.FrameShapeMaster?.ShapeName,
      createdAt: new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }).format(new Date(acc.CreatedDate)),
      enabled: acc.IsActive === 1,
    }));

    // Apply brand name filter
    if (brandFilter) {
      processed = processed.filter(
        (pool) => pool.BrandName.toLowerCase() === brandFilter.toLowerCase()
      );
    }

    // Apply sorting
    if (sortConfig.key === "ModelNo") {
      processed.sort((a, b) => {
        const modelA = a.ModelNo.toLowerCase().trim();
        const modelB = b.ModelNo.toLowerCase().trim();
        return sortConfig.direction === "asc"
          ? modelA.localeCompare(modelB, locale, { sensitivity: "base" })
          : modelB.localeCompare(modelA, locale, { sensitivity: "base" });
      });
    }

    return processed.filter((frame) => {
      const query = searchQuery?.toLocaleLowerCase();
      return (
        frame.BrandName.toLocaleLowerCase().includes(query) ||
        frame.ModelNo.toLocaleLowerCase().includes(query)
      );
    });
  }, [allAccessories, brandFilter, sortConfig, locale,searchQuery]);

  // Get unique brand names for filter
  const uniqueBrands = useMemo(() => {
    if (!allAccessories?.data) return [];
    return [
      ...new Set(allAccessories.data.map((acc) => acc.Brand.BrandName)),
    ].sort((a, b) => a.localeCompare(b, locale, { sensitivity: "base" }));
  }, [allAccessories, locale]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPools = accessories.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(accessories.length / pageSize);

  // Handlers
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleBrandFilter = (brand) => {
    setBrandFilter(brand);
    setIsBrandPopupOpen(false);
  };

  const toggleBrandPopup = () => {
    setIsBrandPopupOpen((prev) => !prev);
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

  if (isLoading) return <h1>Loading...</h1>;

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="text-3xl text-neutral-700 font-semibold">
          Frame Master
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
          <HasPermission module="Frame Master" action="create">
            <Button
              icon={FiPlus}
              iconPosition="left"
              className="bg-primary/90 text-neutral-50 hover:bg-primary/70 transition-all whitespace-nowrap"
              onClick={() => {
                navigate("create");
                window.location.reload();
              }}
            >
              Add Frame Master
            </Button>
          </HasPermission>
        </div>
      </div>

      <Table
        columns={[
          "S.No",
          { content: "Brand Name", renderHeader: true },
          { content: "Model No", renderHeader: true },
          "Rim Type",
          "Rim Shape",
          "Created On",
          "",
        ]}
        renderHeader={(column) => {
          if (column.content === "Brand Name") {
            return (
              <div className="relative flex items-center gap-2">
                <span className="text-sm">{column.content}</span>
                <IoFilter
                  onClick={toggleBrandPopup}
                  className="cursor-pointer text-neutral-500 hover:text-primary"
                />
                {isBrandPopupOpen && (
                  <div className="absolute top-8 left-0 bg-white border border-neutral-200 rounded-md shadow-lg z-10 p-4 w-[600px]">
                    <div className="grid grid-cols-4 gap-2">
                      {uniqueBrands.map((brand) => (
                        <div
                          key={brand}
                          onClick={() => handleBrandFilter(brand)}
                          className="px-2 py-1 hover:bg-neutral-100 cursor-pointer text-sm truncate hover:rounded-sm"
                        >
                          {brand}
                        </div>
                      ))}
                    </div>
                    <div
                      onClick={() => handleBrandFilter(null)}
                      className="px-2 py-1 mt-2 hover:bg-neutral-100 cursor-pointer border-t text-sm text-center"
                    >
                      Clear Filter
                    </div>
                  </div>
                )}
              </div>
            );
          }

          if (column.content === "Model No") {
            return (
              <div className="flex items-center gap-2">
                <span className="text-sm">{column.content}</span>
                <button
                  onClick={() => handleSort("ModelNo")}
                  className="focus:outline-none"
                >
                  {sortConfig.key === "ModelNo" &&
                  sortConfig.direction === "asc" ? (
                    <FiArrowUp className="text-neutral-500 hover:text-primary" />
                  ) : (
                    <FiArrowDown className="text-neutral-500 hover:text-primary" />
                  )}
                </button>
              </div>
            );
          }

          return column.content || column;
        }}
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
              {pool.ModelNo}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.RimType}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.RimShape}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.createdAt}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <HasPermission module="Frame Master" action="view">
                  <FiEye
                    onClick={() => navigate(`view/${pool.id}`)}
                    className="text-xl cursor-pointer"
                    title="View"
                  />
                </HasPermission>
                <HasPermission module="Frame Master" action="edit">
                 <button
                    onClick={() => handleEdit(pool.id)}
                    className="text-neutral-600 hover:text-primary transition-colors"
                    aria-label="Edit"
                    title="Edit"
                  >
                    <FiEdit2 size={18} />
                  </button>
                </HasPermission>
                <HasPermission module="Frame Master" action="deactivate">
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
            ? "Loading frames..."
            : searchQuery
            ? "No frames match your search criteria"
            : "No frames found. Click 'Add frame' to create one."
        }
        pagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        totalItems={accessories.length}
      />
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmToggle}
        title={`Are you sure you want to ${
          currentStatus ? "deactivate" : "activate"
        } this Frame Master?`}
        message={`This will ${
          currentStatus ? "deactivate" : "activate"
        } the Frame Master. You can change it again later.`}
        confirmText={currentStatus ? "Deactivate" : "Activate"}
        danger={currentStatus}
        isLoading={isDeActivating}
      />
    </div>
  );
};

export default FrameMaster;
