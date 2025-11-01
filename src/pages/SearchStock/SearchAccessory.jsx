import React, { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import { motion } from "framer-motion";
import { Table, TableCell, TableRow } from "../../components/Table";
import { EyeClosedIcon, EyeIcon, PrinterIcon, RefreshCcw } from "lucide-react";
import { useLazyGetAccessoryStockQuery, useLazySyncAccQuery } from "../../api/searchStock";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useGetAllLocationsQuery } from "../../api/roleManagementApi";
import Modal from "../../components/ui/Modal";
import { useLazyGetStockHistoryQuery } from "../../api/vendorPayment";
import { FiActivity, FiEye, FiTag } from "react-icons/fi";
import {
  useLazyPrintLabelsAccQuery,
  useLazyPrintLabelsQuery,
} from "../../api/reportApi";
import { useLazyGetAccOtherLocationStockQuery } from "../../api/accessoriesMaster";

const toTitleCase = (str) =>
  str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const buildQueryParams = ({
  brandName,
  ProductName,
  barcode,
  variation,
  location,
  page,
  requiredRow,
}) => {
  const add = (key, value) =>
    value !== undefined && value !== null && value !== ""
      ? `${key}=${encodeURIComponent(value)}`
      : null;

  const params = [
    add("brandName", brandName),
    add("ProductName", ProductName),
    add("barcode", barcode),
    add("variation", variation),
    add("location", location),
    add("page", page),
    add("requiredRow", requiredRow),
  ].filter(Boolean); 

  return params.length ? `?${params.join("&")}` : "";
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


  const [itemsPerPage, setItemsPerPage] = useState(50);

  const [triggerFetchAccessoryStock, { isLoading }] =
    useLazyGetAccessoryStockQuery();
  const [getlabels, { isFetching: isLabelsFetching }] =
    useLazyPrintLabelsAccQuery();
  const [getStockHistory, { data: stockData }] = useLazyGetStockHistoryQuery();
  const [triggerSync] = useLazySyncAccQuery();

    const [getOtherLocationStock, { data: otherStockData }] =
      useLazyGetAccOtherLocationStockQuery();
  const [stockId, setstockId] = useState(null);
  const [printId, setprintId] = useState(null);
    const [otherstockId, othersetstockId] = useState(null);
    const [otherStockOpen, setOtherStockOpen] = useState(false);

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
    const handleOtherStockHistory = async (id) => {
      othersetstockId(id);
      try {
        const res = await getOtherLocationStock({
          companyId: selectedLocation
            ? selectedLocation
            : parseInt(hasMultipleLocations[0]),
          // companyId : 1,
          detailId: id,
        }).unwrap();
        if (!res?.data?.length) {
          toast.error("View access to other locations stock is not allowed");
          return;
        }
        setOtherStockOpen(true);
        othersetstockId(null);
      } catch (error) {
        console.log(error);
        othersetstockId(null);
        setOtherStockOpen(false);
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
          location: selectedLocation, // will now be up-to-date
          page: page,
          requiredRow: pageSize,
        });

        console.log("Fetching with location:", selectedLocation); // Debug

        const result = await triggerFetchAccessoryStock(queryString).unwrap();

        if (result.status === "success" && result.data) {
          setSearchData(result.data);
          setTotalItems(result.total || 0);
        } else {
          setSearchData([]);
          setTotalItems(0);
        }
      } catch (err) {
        console.error("Error fetching accessories:", err);
        // toast.error(err?.data?.error || err?.message || "Failed to fetch data");
        setSearchData([]);
        setTotalItems(0);
      }
    },
    [triggerFetchAccessoryStock, selectedLocation]
  );

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerms, page, pageSize) => {
        fetchAccessories(searchTerms, page, pageSize);
      }, 500),
    [fetchAccessories]
  );

  // Trigger fetch when location changes
  useEffect(() => {
    if (selectedLocation) {
      setCurrentPage(1);
      fetchAccessories(columnSearchTerms, 1, itemsPerPage);
    }
  }, [selectedLocation, fetchAccessories, columnSearchTerms, itemsPerPage]);


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
  const handleClearFilters = async () => {

    // Sync Acc trigger
    await triggerSync();

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
        <div className="flex justify-end">
          <p className="italic text-sm text-red-300"> Please Refresh to get the latest stock data!</p>
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
              <TableCell>
                {item.Quantity !== undefined ? item.Quantity : 0}
              </TableCell>

              <TableCell className="flex gap-2 ">
                <Button
                  icon={FiEye}
                  size="xs"
                  variant="outline"
                    title="Other Location Stock"
                  onClick={() => handleOtherStockHistory(item.DetailId)}
                  isLoading={otherstockId === item.DetailId}
                  loadingText=""
                ></Button>
                <Button
                  size="xs"
                  variant="outline"
                  title="Barcode Label Printing"
                  icon={FiTag}
                  onClick={() => handleLabels(item.DetailId)}
                  isLoading={printId === item.DetailId}
                  loadingText=""
                ></Button>
                {/* <Button variant="outline" size="xs">
                  <PrinterIcon className="w-4 h-4" />
                </Button> */}
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
       <Modal
        isOpen={otherStockOpen}
        onClose={() => setOtherStockOpen(false)}
        width="max-w-3xl"
      >
        <div className="my-5 mx-3">
          <div className="my-5 text-lg text-neutral-800 font-semibold">
           Other Location Accessory Stock List
          </div>
      
          <Table
            expand={true}
            freeze={true}
            columns={["S.No", "Location Name", "Stock"]}
            data={otherStockData?.data || []}
            renderRow={(item, index) => (
              <TableRow key={item.locationId}>
                <TableCell>{index + 1}</TableCell>
                  <TableCell>{`${item.companyName} (${item.locationName})`}</TableCell>
                <TableCell>
                  {item.stock?.LocationQuantity ?? 0}
                </TableCell>
              </TableRow>
            )}
          />
       {otherStockData?.data?.[0]?.stock && (
      <div className="mt-6 p-4 border rounded-2xl bg-gray-50">
        <div className="text-lg font-semibold mb-3 text-neutral-700">
          Accessory Details
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-neutral-900">
          <p><strong className="font-medium">Brand:</strong> {otherStockData.data[0].stock.BrandName}</p>
          <p><strong className="font-medium">Product Name:</strong> {otherStockData.data[0].stock.ProductName}</p>
          <p><strong className="font-medium">Product Code:</strong> {otherStockData.data[0].stock.ProductCode}</p>
          <p><strong className="font-medium">Variation:</strong> {otherStockData.data[0].stock.VariationName}</p>
          <p><strong className="font-medium">SKU Code:</strong> {otherStockData.data[0].stock.SKUCode}</p>
          <p><strong className="font-medium">Barcode:</strong> {otherStockData.data[0].stock.Barcode}</p>
          <p><strong className="font-medium">HSN:</strong> {otherStockData.data[0].stock.HSN}</p>
          <p><strong className="font-medium">Type:</strong> 
            {otherStockData.data[0].stock.OtherProductType === 0 ? "Accessory" : "Other"}
          </p>

        </div>
      </div>
    )}
          
        </div>
      </Modal>
    </motion.div>
  );
};

export default SearchAccessory;
