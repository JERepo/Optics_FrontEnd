import React, { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import { motion } from "framer-motion";
import { Table, TableCell, TableRow } from "../../components/Table";
import { EyeClosedIcon, EyeIcon, PrinterIcon, RefreshCcw } from "lucide-react";
import { useLazyGetAccessoryStockQuery } from "../../api/searchStock";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useGetAllLocationsQuery } from "../../api/roleManagementApi";
import Modal from "../../components/ui/Modal";
import { useLazyGetStockHistoryQuery } from "../../api/vendorPayment";
import { FiActivity, FiTag } from "react-icons/fi";
import { useLazyPrintLabelsQuery } from "../../api/reportApi";

const toTitleCase = (str) =>
  str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const buildQueryParams = ({ brandName, ProductName, barcode, variation, location, page, requiredRow }) => {
  const add = (key, value) =>
    `${key}=${
      value !== undefined && value !== null && value !== ""
        ? encodeURIComponent(value)
        : ""
    }`;

  const params = [
    add("brandName", brandName),
    add("ProductName", ProductName),
    add("barcode", barcode),
    add("variation", variation),
    add("location", location),
    add("page", page),
    add("requiredRow", requiredRow),
  ];

  return `?${params.join("&")}`;
};

const SearchAccessory = () => {
  const [columnSearchTerms, setColumnSearchTerms] = useState({
    "s.no": "",
    "brand name": "",
    "product name": "",
    barcode: "",
    variation: "",
    mrp: "",
    stock: "",
  });

  const [searchData, setSearchData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [stockOpen, setStockOpen] = useState(false);

  const { data: allLocations } = useGetAllLocationsQuery();

  const { user, hasMultipleLocations } = useSelector((state) => state.auth);

  // User assigned locations
  const hasLocation = allLocations?.data
    ? allLocations?.data?.filter((loc) => hasMultipleLocations.includes(loc.Id))
    : [];

  console.log("hasMultipleLocations ----- ", hasMultipleLocations);
  console.log("user ----- ", user);
  console.log("hasLocation ----- ", hasLocation);


  const [itemsPerPage, setItemsPerPage] = useState(50);

  const [triggerFetchAccessoryStock, { isLoading }] =
    useLazyGetAccessoryStockQuery();
  const [getlabels, { isFetching: isLabelsFetching }] =
    useLazyPrintLabelsQuery();
  const [getStockHistory, { data: stockData }] = useLazyGetStockHistoryQuery();
  const [stockId, setstockId] = useState(null);
  const [printId, setprintId] = useState(null);

  const handleLabels = async (detailId) => {
    setprintId(detailId);
    try {
      const blob = await getlabels({
        frameDetailId: detailId,
        companyId: parseInt(hasMultipleLocations[0]),
      }).unwrap();

      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" })
      );
      const newWindow = window.open(url);
      if (newWindow) {
        newWindow.onload = () => {
          newWindow.focus();
          newWindow.print();
        };
      }
      setprintId(null);
    } catch (error) {
      console.log(error);
      toast.error(
        "Unable to print the frame label please try again after some time!"
      );
      setprintId(null);
    }
  };
  const handleStockHistory = async (id) => {
    setstockId(id);
    try {
      await getStockHistory({
        companyId: selectedLocation
          ? selectedLocation
          : parseInt(hasMultipleLocations[0]),
        productType: 3,
        detailId: id,
      }).unwrap();
      setStockOpen(true);
      setstockId(null);
    } catch (error) {
      console.log(error);
      setstockId(null);
      setStockOpen(false);
    }
  };

  // Auto select location if it has only 1.
  useEffect(() => {
    if (hasLocation?.length === 1) {
      setSelectedLocation(hasLocation[0].Id.toString());
    }
  }, [hasLocation]);

  // Fetch accessories from API with current search terms
  const fetchAccessories = useCallback(
    async (searchTerms, page, pageSize) => {
      setError(null);

      try {
        const queryString = buildQueryParams({
          brandName: searchTerms["brand name"],
          ProductName: searchTerms["product name"],
          barcode: searchTerms["barcode"],
          variation: searchTerms["variation"],
          location: selectedLocation,
          page: page,
          requiredRow: pageSize,
        });

        console.log("Fetching with params:", queryString); // Debug log

        const result = await triggerFetchAccessoryStock(queryString).unwrap();

      if (result.status === "success" && result.data) {
        setSearchData(result.data);
        setTotalItems(result.total || 0);
        // toast.success("Data fetched successfully");
      } else {
        setSearchData([]);
        setTotalItems(0);
      }
    } catch (err) {
      console.error("Error fetching accessories:", err);
      toast.error(err?.data?.error || err?.message || "Failed to fetch data");
      setSearchData([]);
      setTotalItems(0);
    }
  }, [triggerFetchAccessoryStock]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerms, page, pageSize) => {
        fetchAccessories(searchTerms, page, pageSize);
      }, 500),
    [fetchAccessories]
  );

  // Initial load
  useEffect(() => {
    fetchAccessories(columnSearchTerms, 1, itemsPerPage);
  }, []); // Empty dependency array - only run once on mount

  // Fetch data when page changes (but not on initial mount)
  useEffect(() => {
    // Skip if it's the initial render (page 1)
    if (currentPage !== 1 || searchData.length > 0) {
      fetchAccessories(columnSearchTerms, currentPage, itemsPerPage);
    }
  }, [currentPage]); // Only currentPage dependency

  // Fetch data when page size changes
  useEffect(() => {
    setCurrentPage(1);
    fetchAccessories(columnSearchTerms, 1, itemsPerPage);
  }, [itemsPerPage]); // Only itemsPerPage dependency

  // Handle search input changes
  const handleColumnSearch = (column, value) => {
    const updatedTerms = {
      ...columnSearchTerms,
      [column]: value,
    };
    setColumnSearchTerms(updatedTerms);
    setCurrentPage(1); // Reset to page 1 when searching
    debouncedSearch(updatedTerms, 1, itemsPerPage);
  };

  // Clear all filters and reload
  const handleClearFilters = () => {
    const clearedTerms = Object.keys(columnSearchTerms).reduce((acc, key) => {
      acc[key] = "";
      return acc;
    }, {});
    setColumnSearchTerms(clearedTerms);
    setCurrentPage(1);

    // Immediately fetch with cleared filters
    setTimeout(() => {
      const clearedQueryString = buildQueryParams({
        brandName: "",
        ProductName: "",
        barcode: "",
        variation: "",
        location: selectedLocation,
        page: 1,
        requiredRow: itemsPerPage,
      });
      triggerFetchAccessoryStock(clearedQueryString)
        .unwrap()
        .then((result) => {
          if (result.status === "success" && result.data) {
            setSearchData(result.data);
            setTotalItems(result.total || 0);
            console.log("Response - ", result);
            // toast.success("Data fetched successfully");
          }
        })
        .catch((err) => {
          console.error("Error clearing filters:", err);
          toast.error(err?.data?.error || "Failed to clear filters");
        });
    }, 100);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    console.log("Changing to page:", newPage);
    setCurrentPage(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    console.log("Changing page size to:", newSize);
    setItemsPerPage(newSize);
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

  // Calculate total pages based on server response
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (isLoading && searchData.length === 0) {
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
          data={searchData || []}
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
              {/* <TableCell>
                <span
                  className={`font-semibold ${
                    item.Quantity > 10
                      ? "text-green-600"
                      : item.Quantity > 0
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {item.Quantity !== undefined ? item.Quantity : 0}
                </span>
              </TableCell> */}
              <TableCell>{item.Quantity !== undefined ? item.Quantity : 0}</TableCell>

              <TableCell>
                <Button variant="outline" size="sm">
                  <EyeIcon className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="xs">
                  <PrinterIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  title="Transaction History"
                  icon={FiActivity}
                  onClick={() => handleStockHistory(item.DetailId)}
                  isLoading={stockId === item.DetailId}
                  loadingText=""
                ></Button>
              </TableCell>
            </TableRow>
          )}
          emptyMessage={isLoading ? "Loading..." : "No data found"}
          pagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          pageSize={itemsPerPage}
          onPageSizeChange={handlePageSizeChange}
          totalItems={totalItems}
        />
      </div>
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
    </motion.div>
  );
};

export default SearchAccessory;
