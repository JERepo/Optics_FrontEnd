import React, { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import { motion } from "framer-motion";
import { Table, TableCell, TableRow } from "../../components/Table";
import { EyeClosedIcon, EyeIcon, PrinterIcon, RefreshCcw } from "lucide-react";
import { useLazyGetAccessoryStockQuery } from "../../api/searchStock";
import toast from "react-hot-toast";

const toTitleCase = (str) =>
  str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const buildQueryParams = ({ brandName, ProductName, barcode, variation }) => {
  const add = (key, value) =>
    `${key}=${value !== undefined && value !== null && value !== "" ? encodeURIComponent(value) : ""}`;

  const params = [
    add("brandName", brandName),
    add("ProductName", ProductName),
    add("barcode", barcode),
    add("variation", variation),
  ];

  return `?${params.join("&")}`;
};

const SearchAccessory = () => {
  const [columnSearchTerms, setColumnSearchTerms] = useState({
    "s.no": "",
    "brand name": "",
    "product name": "",
    "barcode": "",
    "variation": "",
    "mrp": "",
    "stock": "",
  });

  const [searchData, setSearchData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);

  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [triggerFetchAccessoryStock, { isLoading, data: apiData, error: apiError }] =
    useLazyGetAccessoryStockQuery();

  // Fetch accessories from API with current search terms
  const fetchAccessories = useCallback(async (searchTerms) => {
    setError(null);

    try {
      const queryString = buildQueryParams({
        brandName: searchTerms["brand name"],
        ProductName: searchTerms["product name"],
        barcode: searchTerms["barcode"],
        variation: searchTerms["variation"],
      });

      console.log("Fetching with params:", queryString); // Debug log

      const result = await triggerFetchAccessoryStock(queryString).unwrap();

      if (result.status === "success" && result.data) {
        setSearchData(result.data);
      } else {
        setSearchData([]);
      }
      toast.success("Data fetched successfully");
    } catch (err) {
      console.error("Error fetching accessories:", err);
      toast.error(err?.data?.error || err?.message || "Failed to fetch data");
      setSearchData([]);
    }
  }, [triggerFetchAccessoryStock]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((searchTerms) => {
      fetchAccessories(searchTerms);
    }, 500),
    [fetchAccessories]
  );

  // Initial load
  useEffect(() => {
    fetchAccessories(columnSearchTerms);
  }, []);

  // Reset current page when search data changes (e.g., after a new search)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchData]);

  // Handle search input changes
  const handleColumnSearch = (column, value) => {
    const updatedTerms = {
      ...columnSearchTerms,
      [column]: value,
    };
    setColumnSearchTerms(updatedTerms);
    debouncedSearch(updatedTerms);
  };

  // Clear all filters and reload
  const handleClearFilters = () => {
    const clearedTerms = Object.keys(columnSearchTerms).reduce((acc, key) => {
      acc[key] = "";
      return acc;
    }, {});
    setColumnSearchTerms(clearedTerms);

    // Immediately fetch with cleared filters
    setTimeout(() => {
      const clearedQueryString = buildQueryParams({
        brandName: "",
        ProductName: "",
        barcode: "",
        variation: "",
      });
      triggerFetchAccessoryStock(clearedQueryString)
        .unwrap()
        .then((result) => {
          if (result.status === "success" && result.data) {
            setSearchData(result.data);
            toast.success("Data fetched successfully");
          }
        })
        .catch((err) => {
          console.error("Error clearing filters:", err);
          toast.error(err?.data?.error || "Failed to clear filters");
        });
    }, 100);
  };

  const renderHeader = (column) => (
    <div className="flex flex-col">
      {toTitleCase(column)}
      {column !== "action" &&
        column !== "s.no" &&
        column !== "stock" &&
        column !== "mrp" && (
          <div className="relative mt-1">
            <input
              type="text"
              placeholder={`Search ${toTitleCase(column)}...`}
              className="w-full pl-2 pr-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={columnSearchTerms[column]}
              onChange={(e) => handleColumnSearch(column, e.target.value)}
            />
          </div>
        )}
    </div>
  );

  // Calculate paginated data
  const totalPages = Math.ceil(searchData.length / itemsPerPage);
  const paginatedData = searchData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-2xl shadow-xl p-6"
    >
      <div className="items-center mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl lg:text-4xl font-bold text-[#000060] mb-2">
            Accessory Stock
          </h1>
          <Button
            onClick={handleClearFilters}
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCcw className={isLoading ? "animate-spin" : ""} />
            Clear Filters
          </Button>
        </div>
        <p className="text-gray-600 text-sm mt-2">
          Search results: {searchData.length} items found
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Error: {error}
        </div>
      )}

      <div className="mt-6 relative">
        <h3 className="text-lg font-semibold mb-4">Accessory Items</h3>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading accessories...</p>
            </div>
          </div>
        )}
        <Table
          expand={true}
          columns={[
            "s.no",
            "brand name",
            "product name",
            "barcode",
            "variation",
            "mrp",
            "stock",
            "action",
          ]}
          data={paginatedData || []}
          renderHeader={renderHeader}
          renderRow={(item, index) => (
            <TableRow key={item.DetailId || index}>
              <TableCell>
                {(currentPage - 1) * itemsPerPage + index + 1}
              </TableCell>
              <TableCell>{item.BrandName || "-"}</TableCell>
              <TableCell>{item.ProductName || "-"}</TableCell>
              <TableCell>{item.Barcode || "-"}</TableCell>
              <TableCell>{item.Variation || "-"}</TableCell>
              <TableCell>
                {item.OPMRP ? `₹${parseFloat(item.OPMRP).toFixed(2)}` : "-"}
              </TableCell>
              <TableCell>
                <span
                  className={`font-semibold ${item.Quantity > 10
                    ? "text-green-600"
                    : item.Quantity > 0
                      ? "text-yellow-600"
                      : "text-red-600"
                    }`}
                >
                  {item.Quantity !== undefined ? item.Quantity : 0}
                </span>
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  <EyeIcon className="w-4 h-4"/>
                </Button>
                <Button variant="outline" size="sm">
                  <PrinterIcon className="w-4 h-4"/>
                </Button>
              </TableCell>
            </TableRow>
          )}
          emptyMessage={isLoading ? "Loading..." : "No data found"}
          pagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={itemsPerPage}
          onPageSizeChange={setItemsPerPage}
          totalItems={paginatedData}
        />
        {/* {searchData.length > 0 && (
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              variant="outline"
              disabled={currentPage === 1 || isLoading}
            >
              Previous
            </Button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              variant="outline"
              disabled={currentPage === totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        )} */}
      </div>
    </motion.div>
  );
};

export default SearchAccessory;