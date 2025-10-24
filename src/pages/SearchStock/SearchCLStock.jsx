import React, { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import { motion } from "framer-motion";
import { Table, TableCell, TableRow } from "../../components/Table";
import { EyeClosedIcon, EyeIcon, PrinterIcon, RefreshCcw } from "lucide-react";
import { useLazyGetAllCLStockQuery, useLazyGetCLStockQuery } from "../../api/searchStock";
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

const buildQueryParams = ({ BrandName, ProductName, Colour, SphericalPower, CylindricalPower, Axis, Addition, Barcode, page, requiredRow }) => {
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
        "Color": "",
        "Sp Power": "",
        "Cyl Power": "",
        "Axis": "",
        "Addition": "",
        "barcode": "",
        "Batch Code": "",
        "Expiry Date": "",
        "MRP": "",
        "Stock": ""
    });

    const [searchData, setSearchData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [error, setError] = useState(null);

    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [triggerFetchCLStock, { isLoading: isBarcodeLoading }] =
        useLazyGetCLStockQuery();

    const [triggerFetchAllCLStock, { isLoading: isAllLoading }] =
        useLazyGetAllCLStockQuery();

    // Determine which loading state to use based on active tab
    const isLoading = activeTab === "all" ? isAllLoading : isBarcodeLoading;

    // Fetch data based on active tab
    const fetchData = useCallback(async (searchTerms, tab = activeTab, page = currentPage, pageSize = itemsPerPage) => {
        setSearchData([]);
        setError(null);

        try {
            const queryString = buildQueryParams({
                BrandName: searchTerms["brand name"],
                ProductName: searchTerms["product name"],
                Colour: searchTerms["Color"],
                SphericalPower: searchTerms["Sp Power"],
                CylindricalPower: searchTerms["Cyl Power"],
                Axis: searchTerms["Axis"],
                Addition: searchTerms["Addition"],
                Barcode: searchTerms["barcode"],
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
                toast.success("Data fetched successfully");
            } else {
                setSearchData([]);
                setTotalItems(0);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error(err?.data?.error || err?.message || "Failed to fetch data");
            setSearchData([]);
            setTotalItems(0);
        }
    }, [triggerFetchCLStock, triggerFetchAllCLStock, activeTab, currentPage, itemsPerPage]);

    // Debounced search function
    const debouncedSearch = useMemo(
        () => debounce((searchTerms, tab, page, pageSize) => {
            fetchData(searchTerms, tab, page, pageSize);
        }, 500),
        [fetchData]
    );

    // Initial load
    useEffect(() => {
        fetchData(columnSearchTerms, activeTab, 1, itemsPerPage);
    }, []);

    // Fetch data when tab changes
    useEffect(() => {
        setCurrentPage(1);
        fetchData(columnSearchTerms, activeTab, 1, itemsPerPage);
    }, [activeTab]);

    // Fetch data when page changes
    useEffect(() => {
        fetchData(columnSearchTerms, activeTab, currentPage, itemsPerPage);
    }, [currentPage]);

    // Fetch data when page size changes
    useEffect(() => {
        setCurrentPage(1);
        fetchData(columnSearchTerms, activeTab, 1, itemsPerPage);
    }, [itemsPerPage]);

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
                BrandName: "",
                ProductName: "",
                Colour: "",
                SphericalPower: "",
                CylindricalPower: "",
                Axis: "",
                Addition: "",
                Barcode: "",
                page: 1,
                requiredRow: itemsPerPage
            });

            const fetchFunction = activeTab === "all"
                ? triggerFetchAllCLStock
                : triggerFetchCLStock;

            setSearchData([]);

            fetchFunction(clearedQueryString)
                .unwrap()
                .then((result) => {
                    if (result.status === true && result.data) {
                        setSearchData(result.data);
                        setTotalItems(result.total || 0);
                        console.log("Response - ", result);
                        toast.success("Data fetched successfully");
                    }
                })
                .catch((err) => {
                    console.error("Error clearing filters:", err);
                    toast.error(err?.data?.error || "Failed to clear filters");
                });
        }, 100);
    };

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
        // Clear search terms when switching tabs
        // const clearedTerms = Object.keys(columnSearchTerms).reduce((acc, key) => {
        //     acc[key] = "";
        //     return acc;
        // }, {});
        // setColumnSearchTerms(clearedTerms);
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    // Handle page size change
    const handlePageSizeChange = (newSize) => {
        setItemsPerPage(newSize);
    };

    const renderHeader = (column) => (
        <div className="flex flex-col">
            {toTitleCase(column)}
            {column !== "action" &&
                column !== "s.no" &&
                column !== "stock" &&
                column !== "mrp" &&
                column !== "batch code" &&
                column !== "expiry date" && (
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
                "Color",
                "Sp Power",
                "Cyl Power",
                "Axis",
                "Addition",
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
                "Color",
                "Sp Power",
                "Cyl Power",
                "Axis",
                "Addition",
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
        if (activeTab === "all") {
            return (
                <TableRow key={item.DetailId || index}>
                    <TableCell>
                        {((currentPage - 1) * itemsPerPage) + index + 1}
                    </TableCell>
                    <TableCell>{item.BrandName || "-"}</TableCell>
                    <TableCell>{item.ProductName || "-"}</TableCell>
                    <TableCell>{item.Colour || "-"}</TableCell>
                    <TableCell>{item.SphericalPower || "-"}</TableCell>
                    <TableCell>{item.CylindricalPower || "-"}</TableCell>
                    <TableCell>{item.Axis || "-"}</TableCell>
                    <TableCell>{item.Addition || "-"}</TableCell>
                    <TableCell>{item.Barcode || "-"}</TableCell>
                    <TableCell>{item.CLBatchCode || "-"}</TableCell>
                    <TableCell>{item.CLBatchExpiry || "-"}</TableCell>
                    <TableCell>
                        {item.CLMRP ? `₹${parseFloat(item.CLMRP).toFixed(2)}` : "-"}
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
                <TableRow key={item.DetailId || index}>
                    <TableCell>
                        {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
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
                        Contact Lens Stock
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
                <div className="flex gap-4 mb-4">
                    <Button
                        onClick={() => handleTabChange("all")}
                        variant={activeTab === "all" ? "default" : "outline"}
                        disabled={isLoading}
                    >
                        All
                    </Button>
                    <Button
                        onClick={() => handleTabChange("barcode")}
                        variant={activeTab === "barcode" ? "default" : "outline"}
                        disabled={isLoading}
                    >
                        Barcode Specific
                    </Button>
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
            </div>
        </motion.div>
    );
};

export default SearchContactLens;