import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FiEye, FiPlus, FiSearch } from "react-icons/fi";
import { TextField } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import Button from "../../components/ui/Button";
import { Table, TableCell, TableRow } from "../../components/Table";
import { enGB } from "date-fns/locale";
import Loader from "../../components/ui/Loader";
import { useGetPOviewQuery } from "../../api/purchaseOrderApi";
import { Plus, PlusCircle, Search } from "lucide-react";
import { useSelector } from "react-redux";

export function PurchaseOrderMainPage() {
    const navigate = useNavigate();
    const { user, hasMultipleLocations } = useSelector((state) => state.auth);

    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data: poResponse, isLoading: isAllPoLoading } = useGetPOviewQuery();
    const allPo = poResponse?.data?.data || [];
    console.log("poResponse -------- ", poResponse);

    useEffect(() => {
        setCurrentPage(1);
    }, [fromDate, toDate, searchQuery]);

    const getOrderStatus = (status) => {
        const types = {
            // 0: "Draft",
            1: "Approval Pending",
            2: "PO Confirmed",
            // 3: "Completed",
            // 4: "Cancelled",
        };
        return types[status] || "Unknown";
    };

    const purchaseOrders = useMemo(() => {
        if (!allPo || allPo.length === 0) return [];

        console.log("allPo ------------ ", allPo);

        let filtered = [...allPo];

        // Filter by date range
        if (fromDate) {
            filtered = filtered.filter(
                (po) => new Date(po.CreatedOn) >= fromDate
            );
        }

        if (toDate) {
            filtered = filtered.filter(
                (po) => new Date(po.CreatedOn) <= toDate
            );
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter((po) => {
                const query = searchQuery.toLowerCase();
                const vendorName = po.Vendor?.VendorName?.toLowerCase() || "";
                const poNumber = String(po.PONo)?.toLowerCase() || "";
                const poReference = po.POReferenceNo?.toLowerCase() || "";
                const vendorMobile = po.Vendor?.MobNumber?.toLowerCase() || "";

                return (
                    vendorName.includes(query) ||
                    poNumber.includes(query) ||
                    poReference.includes(query) ||
                    vendorMobile.includes(query)
                );
            });
        }

        // Sort by CreatedOn in descending order (latest first)
        filtered.sort((a, b) => new Date(b.CreatedOn) - new Date(a.CreatedOn));

        return filtered.map((po) => ({
            id: po.Id,
            poDate: new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }).format(new Date(po.PODate)),
            poPrefix: po.POPrefix,
            poNo: po.PONo,
            againstOrder: po.AgainstOrder,
            applicationUser: po.ApplicationUserId,
            createdCompanyID: po.CreatedCompanyID,
            vendorName: po.Vendor?.VendorName || "N/A",
            vendorMobile: po.Vendor?.MobNumber || "N/A",
            status: getOrderStatus(po.Status),
            totalQty: po.TotalQty,
            totalValue: po.TotalValue,
            totalGrossValue: po.TotalBasicValue,
            totalGSTValue: po.TotalGSTValue,
            createdOn: po.CreatedOn,
            poReference: po.POReferenceNo || "N/A",
            shipToCompany: po.ShipToCompanyID,
            vendor: po.Vendor
        }));
    }, [allPo, fromDate, toDate, searchQuery]);

    const startIndex = (currentPage - 1) * pageSize;
    const paginatedOrders = purchaseOrders.slice(startIndex, startIndex + pageSize);
    const totalPages = Math.ceil(purchaseOrders.length / pageSize);

    const handleViewPO = (poId, poData) => {
        navigate(`/purchase-order/view`, {
            state: {
                poData: poData // pass entire PO data if needed
            }
        });
    };

    const handleCreatePO = () => {
        navigate("/purchase-order/create");
    };

    if (isAllPoLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader color="black" width="w-10" height="h-10" />
            </div>
        );
    }

    return (
        <div className="max-w-8xl">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Purchase Order List</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage and track all your purchase orders in one place.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
                    <LocalizationProvider
                        dateAdapter={AdapterDateFns}
                        adapterLocale={enGB}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <DatePicker
                                label="From Date"
                                value={fromDate}
                                onChange={setFromDate}
                                maxDate={new Date()}
                                inputFormat="dd/MM/yyyy"
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        size="small"
                                        fullWidth
                                        variant="outlined"
                                    />
                                )}
                            />
                            <DatePicker
                                label="To Date"
                                value={toDate}
                                onChange={setToDate}
                                minDate={fromDate}
                                maxDate={new Date()}
                                inputFormat="dd/MM/yyyy"
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        size="small"
                                        fullWidth
                                        variant="outlined"
                                    />
                                )}
                            />
                            <div className="grid grid-cols-2 gap-3 items-center">
                                <button
                                    className="flex gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                                    onClick={() => { }}
                                >
                                    <Search />
                                    Apply Filters
                                </button>
                                <button
                                    onClick={() => {
                                        setFromDate(null);
                                        setToDate(null);
                                        setSearchQuery("");
                                    }}
                                    variant="outline"
                                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </LocalizationProvider>
                </div>

                {/* Table */}
                <div className="px-6 py-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                        <div className="flex items-center gap-5">
                            <h2 className="text-lg font-medium text-gray-900">
                                Purchase Order Details
                            </h2>

                            <div className="relative flex items-center w-full sm:w-64">
                                <FiSearch className="absolute left-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search PO..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <button
                                icon={FiPlus}
                                className="flex gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                                onClick={handleCreatePO}
                            >
                                <Plus />
                                Create Purchase Order
                            </button>
                        </div>
                    </div>

                    <Table
                        columns={[
                            "S.No",
                            "PO No.",
                            "PO Date",
                            "Vendor Name",
                            "Mobile",
                            "Status",
                            "Total Qty",
                            "Total Net Value",
                            "Actions"
                        ]}
                        data={paginatedOrders}
                        renderRow={(po, index) => (
                            <TableRow key={po.id}>
                                <TableCell>{startIndex + index + 1}</TableCell>
                                <TableCell>{`${po.poPrefix}/${po.poNo}`}</TableCell>
                                <TableCell>{po.poDate}</TableCell>
                                <TableCell>{po.vendorName}</TableCell>
                                <TableCell>{po.vendorMobile}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${po.status === "Confirmed" ? "bg-green-100 text-green-800" :
                                        po.status === "Draft" ? "bg-gray-100 text-gray-800" :
                                            po.status === "Cancelled" ? "bg-red-100 text-red-800" :
                                                "bg-blue-100 text-blue-800"
                                        }`}>
                                        {po.status}
                                    </span>
                                </TableCell>
                                <TableCell>{po.totalQty}</TableCell>
                                <TableCell>₹{parseFloat(po.totalValue).toFixed(2)}</TableCell>
                                <TableCell>
                                    <button
                                        onClick={() => handleViewPO(po.id, po)}
                                        className="flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <FiEye className="mr-1.5" />
                                        View
                                    </button>
                                </TableCell>
                            </TableRow>
                        )}
                        emptyMessage={
                            isAllPoLoading
                                ? "Loading purchase orders..."
                                : "No purchase orders found."
                        }
                        pagination={true}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        pageSize={pageSize}
                        onPageSizeChange={setPageSize}
                        totalItems={purchaseOrders.length}
                    />
                </div>
            </div>
        </div>
    );
}