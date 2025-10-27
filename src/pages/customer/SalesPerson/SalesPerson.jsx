import React, { useState, useMemo } from "react";
import { FiSearch, FiPlus, FiEdit2, FiEye, FiCreditCard } from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { useNavigate } from "react-router";
import { Table, TableRow, TableCell } from "../../../components/Table";
import Toggle from "../../../components/ui/Toggle";

import { PoolCat } from "../../../utils/constants/PoolCategory";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import HasPermission from "../../../components/HasPermission";
import {
  useDeActivateMutation,
  useGetAllSalesPersonsQuery,
} from "../../../api/salesPersonApi";
import { IoFilter } from "react-icons/io5";
import { format } from "date-fns";

const SalesType = [
  { value: 0, label: "Sales Person" },
  { value: 1, label: "Optometrist" },
  { value: 2, label: "Others" },
];

const SalesPerson = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const locale = navigator.language || navigator.languages[0] || "en-GB";

  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [isCategoryPopupOpen, setIsCategoryPopupOpen] = useState(false);

  //   const { data, isLoading } = useGetAllBrandGroupsQuery();
  //   const [deActivate, { isLoading: isDeActivating }] = useDeActivateMutation();
  const { data, isLoading } = useGetAllSalesPersonsQuery();
  const [deActivate, { isLoading: isDeActivating }] = useDeActivateMutation();

  const brands = useMemo(() => {
    if (!data?.data) return [];

    let processed = data.data.data
      .map((brand) => ({
        id: brand.Id,
        name: brand.PersonName,
        type: SalesType.find((s) => s.value === brand.Type).label,
        createdAt: format(new Date(brand.CreatedDate), 'dd/MM/yyyy'),
        enabled: brand.IsActive,
      }))
      .filter((customer) => {
        const query = searchQuery.toLowerCase();
        return (
          customer.name.toLowerCase().includes(query) ||
          customer.type.toLowerCase().includes(query)
        );
      });

    if (categoryFilter) {
      processed = processed.filter(
        (brand) =>
        
          brand.type.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    return processed
  }, [data, searchQuery,categoryFilter]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPools = brands.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(brands.length / pageSize);

  const requestToggle = (poolId, status) => {
    setSelectedBrandId(poolId);
    setCurrentStatus(status);
    setIsModalOpen(true);
  };

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category);
    setIsCategoryPopupOpen(false);
  };

  const toggleCategoryPopup = () => {
    setIsCategoryPopupOpen((prev) => !prev);
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
          Sales Person
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
              Add Sales Person
            </Button>
          </HasPermission>
        </div>
      </div>

      <Table
        columns={["S.No", "Person Name", "Type", "Action"]}
        data={paginatedPools}
        renderHeader={(column) => {
          if (column === "Type") {
            return (
              <div className="relative flex items-center gap-2">
                <span>{column}</span>
                <IoFilter
                  onClick={toggleCategoryPopup}
                  className="cursor-pointer text-neutral-500 hover:text-primary"
                />
                {isCategoryPopupOpen && (
                  <div className="absolute top-8 right-16 bg-white border border-neutral-200 rounded-md shadow-lg z-10">
                    {["Sales Person", "Optometrist", "Others"].map((cat) => (
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
              {pool.type}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <HasPermission module="Brand group" action="view">
                  <FiEye
                    onClick={() => navigate(`view/${pool.id}`)}
                    className="text-xl cursor-pointer"
                    title="View"
                  />
                </HasPermission>
                <HasPermission module="Brand group" action="edit">
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
            ? "Loading sales person..."
            : searchQuery
            ? "No sales person match your search criteria"
            : "No sales person found. Click 'Add sales person' to create one."
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
        } this Sales Person?`}
        message={`This will ${
          currentStatus ? "deactivate" : "activate"
        } the Sales Person. You can change it again later.`}
        confirmText={currentStatus ? "Deactivate" : "Activate"}
        danger={currentStatus}
        isLoading={isDeActivating}
      />
    </div>
  );
};

export default SalesPerson;
