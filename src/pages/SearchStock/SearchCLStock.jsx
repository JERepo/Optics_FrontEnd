import React, { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import { motion } from "framer-motion";
import { Table, TableCell, TableRow } from "../../components/Table";
import { EyeClosedIcon, EyeIcon, PrinterIcon, RefreshCcw } from "lucide-react";
import { useLazyGetAllCLStockQuery, useLazyGetCLStockQuery, useLazySyncClQuery } from "../../api/searchStock";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useGetAllLocationsQuery } from "../../api/roleManagementApi";
import Modal from "../../components/ui/Modal";
import { useLazyGetStockHistoryQuery } from "../../api/vendorPayment";
import { FiActivity } from "react-icons/fi";

const toTitleCase = (str) =>
  str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const buildQueryParams = ({ BrandName, ProductName, Colour, SphericalPower, CylindricalPower, Axis, Addition, Barcode, location, page, requiredRow }) => {
    const add = (key, value) =>
        `${key}=${value !== undefined && value !== null && value !== "" ? encodeURIComponent(value) : ""}`;

    const params = [
        add("BrandName", BrandName),
        add("ProductName", ProductName),
        add("Colour", Colour),
        add("SphericalPower", SphericalPower),
        add("CylindricalPower", CylindricalPower),
        add("Axis", Axis),
        add("Addition", Addition),
        add("Barcode", Barcode),
        add("location", location),
        add("page", page),
        add("requiredRow", requiredRow)
    ];

  return `?${params.join("&")}`;
};

const SearchContactLens = () => {
  const [activeTab, setActiveTab] = useState("all"); // "all" or "barcode"

    const [columnSearchTerms, setColumnSearchTerms] = useState({
        "brand name": "",
        "product name": "",
        "Colour": "",
        "Sph Power": "",
        "Cyl Power": "",
        "Axis": "",
        "Add Power": "",
        "barcode": "",
        "Batch Code": "",
        "Expiry Date": "",
        "MRP": "",
        "Stock": ""
    });

  const { data: allLocations } = useGetAllLocationsQuery();

    const [searchData, setSearchData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

  const { user, hasMultipleLocations } = useSelector((state) => state.auth);
  // User assigned locations
  const hasLocation = allLocations?.data
    ? allLocations?.data?.filter((loc) => hasMultipleLocations.includes(loc.Id))
    : [];

  console.log("hasMultipleLocations ----- ", hasMultipleLocations);
  console.log("user ----- ", user);
  console.log("hasLocation ----- ", hasLocation);

    const [itemsPerPage, setItemsPerPage] = useState(50);

  // Auto select location if it has only 1.
  useEffect(() => {
    if (hasLocation?.length === 1) {
      setSelectedLocation(hasLocation[0].Id.toString());
    }
  }, [hasLocation]);

    const [triggerFetchCLStock] = useLazyGetCLStockQuery();
    const [triggerFetchAllCLStock] = useLazyGetAllCLStockQuery();
    const [triggerClSync] = useLazySyncClQuery();

    // Fetch data based on active tab
    const fetchData = useCallback(async (searchTerms, tab, page, pageSize) => {
        setIsLoading(true);
        setError(null);

        try {
            const queryString = buildQueryParams({
                BrandName: searchTerms["brand name"],
                ProductName: searchTerms["product name"],
                Colour: searchTerms["Colour"],
                SphericalPower: searchTerms["Sph Power"],
                CylindricalPower: searchTerms["Cyl Power"],
                Axis: searchTerms["Axis"],
                Addition: searchTerms["Add Power"],
                Barcode: searchTerms["barcode"],
                location: selectedLocation,
                page: page,
                requiredRow: pageSize
            });

        console.log(`Fetching ${tab} tab with params:`, queryString);

        let result;
        if (tab === "all") {
          result = await triggerFetchAllCLStock(queryString).unwrap();
        } else {
          result = await triggerFetchCLStock(queryString).unwrap();
        }

            if (result.status === true && result.data) {
                setSearchData(result.data);
                setTotalItems(result.total || 0);
                console.log("Response - ", result);
            } else {
                setSearchData([]);
                setTotalItems(0);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error(err?.data?.error || err?.message || "Failed to fetch data");
            setSearchData([]);
            setTotalItems(0);
        } finally {
            setIsLoading(false);
        }
    }, [triggerFetchCLStock, triggerFetchAllCLStock, selectedLocation]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerms, tab, page, pageSize) => {
        fetchData(searchTerms, tab, page, pageSize);
      }, 500),
    [fetchData]
  );

    // Initial load - only fetch once on mount when location is available
    useEffect(() => {
        if (selectedLocation) {
            fetchData(columnSearchTerms, activeTab, 1, itemsPerPage);
        }
    }, [selectedLocation]);

    // Fetch data when page changes (but not on mount)
    useEffect(() => {
        if (currentPage !== 1 && selectedLocation) {
            fetchData(columnSearchTerms, activeTab, currentPage, itemsPerPage);
        }
    }, [currentPage]);

  // Handle search input changes
  const handleColumnSearch = (column, value) => {
    const updatedTerms = {
      ...columnSearchTerms,
      [column]: value,
    };
    setColumnSearchTerms(updatedTerms);
    setCurrentPage(1);
    debouncedSearch(updatedTerms, activeTab, 1, itemsPerPage);
  };

    // Clear all filters and reload
    const handleClearFilters = async () => {

        // Sync CL trigger
        await triggerClSync();

        const clearedTerms = Object.keys(columnSearchTerms).reduce((acc, key) => {
            acc[key] = "";
            return acc;
        }, {});
        setColumnSearchTerms(clearedTerms);
        setCurrentPage(1);

        // Fetch with cleared filters
        fetchData(clearedTerms, activeTab, 1, itemsPerPage);
    };

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);

        // Clear search terms when switching tabs
        const clearedTerms = Object.keys(columnSearchTerms).reduce((acc, key) => {
            acc[key] = "";
            return acc;
        }, {});
        setColumnSearchTerms(clearedTerms);

        // Fetch data with cleared filters for new tab
        fetchData(clearedTerms, tab, 1, itemsPerPage);
    };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

    // Handle page size change
    const handlePageSizeChange = (newSize) => {
        setItemsPerPage(newSize);
        setCurrentPage(1);
        fetchData(columnSearchTerms, activeTab, 1, newSize);
    };

    const renderHeader = (column) => (
        <div className="flex flex-col">
            {toTitleCase(column)}
            {column !== "action" &&
                column !== "s.no" &&
                column !== "Stock" &&
                column !== "MRP" &&
                column !== "batch code" &&
                column !== "Expiry date" && (
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

    // Get columns based on active tab
    const getColumns = () => {
        if (activeTab === "all") {
            return [
                "s.no",
                "brand name",
                "product name",
                "Colour",
                "Sph Power",
                "Cyl Power",
                "Axis",
                "Add Power",
                "barcode",
                "Batch Code",
                "Expiry Date",
                "MRP",
                "Stock",
                "action",
            ];
        } else {
            return [
                "s.no",
                "brand name",
                "product name",
                "Colour",
                "Sph Power",
                "Cyl Power",
                "Axis",
                "Add Power",
                "barcode",
                "MRP",
                "Stock",
                "action",
            ];
        }
    };

  console.log("searchData ", searchData);

  // Calculate total pages based on server response
  const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Render row based on active tab
    const renderRow = (item, index) => {
        // Calculate correct serial number
        const serialNo = ((currentPage - 1) * itemsPerPage) + index + 1;

        if (activeTab === "all") {
            return (
                <TableRow key={`${item.DetailId}-${index}`}>
                    <TableCell>{serialNo}</TableCell>
                    <TableCell>{item.BrandName || "-"}</TableCell>
                    <TableCell>{item.ProductName || "-"}</TableCell>
                    <TableCell>{item.Colour || "-"}</TableCell>
                    <TableCell>{item.SphericalPower || "-"}</TableCell>
                    <TableCell>{item.CylindricalPower || "-"}</TableCell>
                    <TableCell>{item.Axis || "-"}</TableCell>
                    <TableCell>{item.Addition || "-"}</TableCell>
                    <TableCell>{item.Barcode || "-"}</TableCell>
                    <TableCell>{item.CLBatchCode || "-"}</TableCell>
                    <TableCell>
                        {item.CLBatchExpiry
                            ? item.CLBatchExpiry.split('-').reverse().join('-')
                            : "-"
                        }
                    </TableCell>
                    <TableCell>
                        {item.CLMRP ? `₹${parseFloat(item.CLMRP).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>{item.Quantity !== undefined ? item.Quantity : 0}</TableCell>
                    <TableCell>
                        <Button variant="outline" size="sm">
                            <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                            <PrinterIcon className="w-4 h-4" />
                        </Button>
                    </TableCell>
                </TableRow>
            );
        } else {
            return (
                <TableRow key={`${item.DetailId}-${index}`}>
                    <TableCell>{serialNo}</TableCell>
                    <TableCell>{item.BrandName || "-"}</TableCell>
                    <TableCell>{item.ProductName || "-"}</TableCell>
                    <TableCell>{item.Colour || "-"}</TableCell>
                    <TableCell>{item.SphericalPower || "-"}</TableCell>
                    <TableCell>{item.CylindricalPower || "-"}</TableCell>
                    <TableCell>{item.Axis || "-"}</TableCell>
                    <TableCell>{item.Addition || "-"}</TableCell>
                    <TableCell>{item.Barcode || "-"}</TableCell>
                    <TableCell>
                        {item.CLMRP ? `₹${parseFloat(item.CLMRP).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>{item.Quantity !== undefined ? item.Quantity : 0}</TableCell>
                    <TableCell>
                        <Button variant="outline" size="sm">
                            <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                            <PrinterIcon className="w-4 h-4" />
                        </Button>
                    </TableCell>
                </TableRow>
            );
        }
    };

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
            Contact Lens Stock
          </h1>
          <div className="flex gap-4">
            {hasLocation && hasLocation.length > 1 && (
              <div className="flex items-center space-x-6 mb-6">
                <label className="text-sm font-medium text-gray-700">
                  Select Location:
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a location</option>
                  {hasLocation.map((loc) => (
                    <option key={loc.Id} value={loc.Id}>
                      {loc.LocationName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button
              onClick={handleClearFilters}
              variant="outline"
              disabled={isLoading}
            >
              <RefreshCcw className={isLoading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        </div>
        <p className="text-gray-600 text-sm mt-2">
          Search results: {totalItems} items found
        </p>
      </div>

      <div className="mt-6 relative">
        <h3 className="text-lg font-semibold mb-4">Contact Lens Items</h3>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading contact lens...</p>
            </div>
          </div>
        )}

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => handleTabChange("all")}
                        disabled={isLoading}
                        className={`
            relative px-6 py-3 font-medium text-sm transition-all duration-200
            ${activeTab === "all"
                                ? "text-blue-600 border-t-2 border-l border-r border-blue-600 rounded-t-lg -mb-px bg-blue-200"
                                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-b border-transparent rounded-t-lg bg-blue-100"
                            }
            disabled:opacity-50 disabled:cursor-not-allowed
        `}
                    >
                        <span className="flex items-center gap-2">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            With BatchCode + Expiry
                        </span>
                        {activeTab === "all" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                        )}
                    </button>

                    <button
                        onClick={() => handleTabChange("barcode")}
                        disabled={isLoading}
                        className={`
            relative px-6 py-3 font-medium text-sm transition-all duration-200
            ${activeTab === "barcode"
                                ? "text-blue-600 border-t-2 border-l border-r border-blue-600 rounded-t-lg -mb-px bg-blue-200"
                                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-b border-transparent rounded-t-lg bg-blue-100"
                            }
            disabled:opacity-50 disabled:cursor-not-allowed
        `}
                    >
                        <span className="flex items-center gap-2">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            Summary
                        </span>
                        {activeTab === "barcode" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                        )}
                    </button>

                    {/* Empty space to complete the border */}
                    <div className="flex-1 border-b border-gray-200"></div>
                </div>

        <Table
          expand={true}
          columns={getColumns()}
          data={searchData || []}
          renderHeader={renderHeader}
          renderRow={renderRow}
          emptyMessage={isLoading ? "Loading..." : "No data found"}
          pagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          pageSize={itemsPerPage}
          onPageSizeChange={handlePageSizeChange}
          totalItems={totalItems}
        />
        <Modal
          isOpen={stockOpen}
          onClose={() => setStockOpen(false)}
          width="max-w-4xl"
        >
          <div className="my-5 mx-3">
            <div className="my-5 text-lg text-neutral-800 font-semibold">
              Transaction History
            </div>
            <Table
              expand={true}
              freeze={true}
              columns={[
                "s.no",
                "transaction date",
                "grn qty",
                "stin qty",
                "sr qty",
                "salesqty",
                "stout qty",
                "pr qty",
              ]}
              data={stockData?.data || []}
              renderRow={(item, index) => {
                return (
                  <TableRow key={item.DetailId}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {item?.TransactionDate?.split("-").reverse().join("/")}
                    </TableCell>
                    <TableCell>{item?.GRNQty}</TableCell>
                    <TableCell>{item?.STInQty}</TableCell>
                    <TableCell>{item?.SRQty}</TableCell>
                    <TableCell>{item?.SalesQty}</TableCell>
                    <TableCell>{item?.STOutQty}</TableCell>
                    <TableCell>{item?.PRQty}</TableCell>
                  </TableRow>
                );
              }}
            />
          </div>
        </Modal>
      </div>
    </motion.div>
  );
};

export default SearchContactLens;
