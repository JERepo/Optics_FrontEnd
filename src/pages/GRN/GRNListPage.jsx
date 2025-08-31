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
import { useGetAllGRNmainQuery } from "../../api/grnApi";

export function GRNListPage() {
    const navigate = useNavigate();
    const { user, hasMultipleLocations } = useSelector((state) => state.auth);

    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data: grnResponse, isLoading: isAllGrnLoading } = useGetAllGRNmainQuery();
    const allGrn = grnResponse?.data?.data || [];
    console.log("grnResponse -------- ", grnResponse);

    useEffect(() => {
        setCurrentPage(1);
    }, [fromDate, toDate, searchQuery]);

    const getOrderStatus = (status) => {
        const types = {
            // 0: "Draft",
            1: "Approval Pending",
            2: "GRN Confirmed",
            // 3: "Completed",
            // 4: "Cancelled",
        };
        return types[status] || "Unknown";
    };

    const purchaseOrders = useMemo(() => {
        if (!allGrn || allGrn.length === 0) return [];

        console.log("allGrn ------------ ", allGrn);

        let filtered = [...allGrn];

        // Filter by date range
        if (fromDate) {
            filtered = filtered.filter(
                (grn) => new Date(grn.CreatedOn) >= fromDate
            );
        }

        if (toDate) {
            filtered = filtered.filter(
                (grn) => new Date(grn.CreatedOn) <= toDate
            );
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter((grn) => {
                const query = searchQuery.toLowerCase();
                const vendorName = grn.Vendor?.VendorName?.toLowerCase() || "";
                const grnNumber = String(grn.grnNo)?.toLowerCase() || "";
                const grnReference = grn.grnReferenceNo?.toLowerCase() || "";
                const vendorMobile = grn.Vendor?.MobNumber?.toLowerCase() || "";

                return (
                    vendorName.includes(query) ||
                    grnNumber.includes(query) ||
                    grnReference.includes(query) ||
                    vendorMobile.includes(query)
                );
            });
        }

        return filtered.map((grn) => ({
            id: grn.Id,
            grnDate: new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }).format(new Date(grn.GRNDate)),
            GRNPrefix: grn.GRNPrefix,
            GRNNo: grn.GRNNo,
            againstOrder: grn.AgainstOrder,
            VendorDocNo: grn.VendorDocNo,
            VendorDocDate: grn.VendorDocDate,
            GRNType: grn.GRNType,
            applicationUser: grn.ApplicationUserId,
            AgainstPO: grn.AgainstPO,
            CompanyID: grn.CompanyID,
            vendorName: grn.Vendor?.VendorName || "N/A",
            vendorMobile: grn.Vendor?.MobNumber || "N/A",
            status: getOrderStatus(grn.Status),
            totalQty: grn.TotalQty,
            totalValue: grn.TotalValue,
            createdOn: grn.CreatedOn,
            grnReference: grn.grnReferenceNo || "N/A",
            shipToCompany: grn.ShipToCompanyID,
            vendor: grn.Vendor
        }));
    }, [allGrn, fromDate, toDate, searchQuery]);

    const startIndex = (currentPage - 1) * pageSize;
    const paginatedOrders = purchaseOrders.slice(startIndex, startIndex + pageSize);
    const totalPages = Math.ceil(purchaseOrders.length / pageSize);

    const handleViewGRN = (grnId, grnData) => {
        navigate(`/grn/view`, {
            state: {
                grnData: grnData // pass entire GRN data if needed
            }
        });
    };

    const handleCreateGRN = () => {
        navigate("/grn/create");
    };

    if (isAllGrnLoading) {
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
                        <h1 className="text-2xl font-bold text-gray-900">GRN List</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage and track all your GRN orders in one place.
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
                                GRN Order Details
                            </h2>

                            <div className="relative flex items-center w-full sm:w-64">
                                <FiSearch className="absolute left-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search GRN..."
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
                                onClick={handleCreateGRN}
                            >
                                <Plus />
                                Create GRN Order
                            </button>
                        </div>
                    </div>

                    <Table
                        columns={[
                            "S.No",
                            "GRN No.",
                            "Document No.",
                            "Document Date",
                            "GRN Date",
                            "Document type",
                            "Vendor Name",
                            "Against PO",
                            "Total Qty",
                            "Total Net Value",
                            "Actions"
                        ]}
                        data={paginatedOrders}
                        renderRow={(grn, index) => (
                            <TableRow key={grn.id}>
                                <TableCell>{startIndex + index + 1}</TableCell>
                                <TableCell>{`${grn.GRNPrefix}/${grn.GRNNo}`}</TableCell>
                                <TableCell>{grn.VendorDocNo}</TableCell>
                                <TableCell>{grn.VendorDocDate}</TableCell>
                                <TableCell>{grn.grnDate}</TableCell>
                                <TableCell>{grn.GRNType === 0 ? 'Invoice' : 'DC'}</TableCell>
                                <TableCell>{grn.vendorName}</TableCell>
                                <TableCell>{grn.AgainstPO === 1 ? 'Yes' : 'No'}</TableCell>
                                <TableCell>{grn.totalQty}</TableCell>
                                <TableCell>₹{parseFloat(grn.totalValue).toFixed(2)}</TableCell>
                                <TableCell>
                                    <button
                                        onClick={() => handleViewGRN(grn.id, grn)}
                                        className="flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <FiEye className="mr-1.5" />
                                        View
                                    </button>
                                </TableCell>
                            </TableRow>
                        )}
                        emptyMessage={
                            isAllGrnLoading
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