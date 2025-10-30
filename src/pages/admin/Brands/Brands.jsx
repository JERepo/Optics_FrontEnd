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
  useDeActivateMutation,
  useGetAllBrandsQuery,
} from "../../../api/brandsApi";
import { IoFilter } from "react-icons/io5";
import { format } from 'date-fns';


const Brands = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const locale = navigator.language || navigator.languages[0] || "en-GB";

  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [isCategoryPopupOpen, setIsCategoryPopupOpen] = useState(false);

  const { data, isLoading } = useGetAllBrandsQuery();
  const [deActivate, { isLoading: isDeActivating }] = useDeActivateMutation();

  const getBrandActive = (data) => {
    if (!data) return "N/A";

    const activeCategories = [];

    if (data.FrameActive === 1) activeCategories.push("F/S");
    if (data.ContactLensActive === 1) activeCategories.push("CL");
    if (data.OpticalLensActive === 1) activeCategories.push("OL");
    if (data.OthersProductsActive === 1) activeCategories.push("ACC");

    return activeCategories.length > 0 ? activeCategories.join(", ") : "N/A";
  };

  const brands = useMemo(() => {
    if (!data) return [];

    let processed = data.map((brand) => {
      const category = getBrandActive(brand);
      return {
        id: brand.Id,
        name: brand.BrandName,
        brandActive: brand,
        category,
        createdAt: format(new Date(brand.CreatedDate), 'dd/MM/yyyy'),
        enabled: brand.IsActive === 1,
      };
    });

    // if (categoryFilter) {
    //   processed = processed.filter(
    //     (brand) =>
    //       brand.category &&
    //       brand.category.toLowerCase() === categoryFilter.toLowerCase()
    //   );
    // }
    if (categoryFilter) {
      processed = processed.filter((brand) =>
        brand.category && brand.category.includes(categoryFilter)
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

    if (searchQuery) {
      processed = processed.filter((brand) =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return processed;
  }, [data, searchQuery, categoryFilter, sortConfig]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBrands = brands.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(brands.length / pageSize);

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

  const requestToggle = (poolId, status) => {
    setSelectedBrandId(poolId);
    setCurrentStatus(status);
    setIsModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    try {
      await deActivate({
        id: selectedBrandId,
        payload: { isActive: currentStatus ? 0 : 1 },
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
        <div className="text-3xl text-neutral-700 font-semibold">Brands</div>
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
          <HasPermission module="Brand" action="create">
            <Button
              icon={FiPlus}
              iconPosition="left"
              className="bg-primary/90 text-neutral-50 hover:bg-primary/70 transition-all whitespace-nowrap"
              onClick={() => navigate("create")}
            >
              Add Brands
            </Button>
          </HasPermission>
        </div>
      </div>

      <Table
        columns={["S.No", "Brand Name", "Brand active for", "created on", ""]}
        data={paginatedBrands}
        renderHeader={(column) => {
          if (column === "Brand active for") {
            return (
              <div className="relative flex items-center gap-2">
                <span>{column}</span>
                <IoFilter
                  onClick={toggleCategoryPopup}
                  className="cursor-pointer text-neutral-500 hover:text-primary"
                />
                {isCategoryPopupOpen && (
                  <div className="absolute top-8 right-16 bg-white border border-neutral-200 rounded-md shadow-lg z-10">
                    {["F/S", "OL", "CL", "ACC"].map((cat) => (
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

          if (column === "Brand Name") {
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
              {getBrandActive(pool.brandActive)}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.createdAt}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <HasPermission module="Brand" action="view">
                  <FiEye
                    onClick={() => navigate(`view/${pool.id}`)}
                    className="text-xl cursor-pointer"
                    title="View"
                  />
                </HasPermission>
                <HasPermission module="Brand" action="edit">
                  <button
                    onClick={() => handleEdit(pool.id)}
                    className="text-neutral-600 hover:text-primary transition-colors"
                    aria-label="Edit"
                    title="Edit"
                  >
                    <FiEdit2 size={18} />
                  </button>
                </HasPermission>
                <HasPermission module="Brand" action="deactivate">
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
            ? "Loading brands..."
            : searchQuery
              ? "No brands match your search criteria"
              : "No brands found. Click 'Add brands' to create one."
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
        title={`Are you sure you want to ${currentStatus ? "deactivate" : "activate"
          } this Brands?`}
        message={`This will ${currentStatus ? "deactivate" : "activate"
          } the Brands. You can change it again later.`}
        confirmText={currentStatus ? "Deactivate" : "Activate"}
        danger={currentStatus}
        isLoading={isDeActivating}
      />
    </div>
  );
};

export default Brands;
