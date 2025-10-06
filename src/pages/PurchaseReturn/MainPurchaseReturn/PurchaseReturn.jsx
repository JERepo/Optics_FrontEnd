import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FiEye, FiPlus, FiPrinter, FiSearch } from "react-icons/fi";

import Button from "../../../components/ui/Button";
import { useOrder } from "../../../features/OrderContext";
import { Table, TableCell, TableRow } from "../../../components/Table";

import Loader from "../../../components/ui/Loader";
import { useSelector } from "react-redux";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { enGB } from "date-fns/locale";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TextField } from "@mui/material";
import { useGetStockLocationsQuery } from "../../../api/stockTransfer";
import {
  useGetAllPRQuery,
  useLazyPrintPdfQuery,
} from "../../../api/purchaseReturn";
import { formatINR } from "../../../utils/formatINR";
import { format } from "date-fns";
import HasPermission from "../../../components/HasPermission";
import toast from "react-hot-toast";

const getStatus = (status) => {
  if (status == 0) {
    return "Draft";
  } else if (status == 1) {
    return "Confirmed";
  } else if (status === 3) {
    return "Cancelled";
  }
  return "UNKNOWN";
};

const PurchaseReturn = () => {
  const navigate = useNavigate();
  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const { goToPurchaseStep } = useOrder();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [printingId, setPrintingId] = useState(null);

  const { data: allLocations, isLoading: isLocationsLoading } =
    useGetStockLocationsQuery({
      locationId: parseInt(hasMultipleLocations[0]),
    });
  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate, searchQuery]);

  const { data: PRDetails, isLoading: isPRDetailsLoading } = useGetAllPRQuery();
  const [generatePrint, { isFetching: isPrinting }] = useLazyPrintPdfQuery();

  const StockOut = useMemo(() => {
    if (!PRDetails?.data?.data) return [];

    let filtered = PRDetails.data.data;

    if (fromDate) {
      filtered = filtered.filter(
        (order) => new Date(order.CreatedOn) >= fromDate
      );
    }

    if (toDate) {
      filtered = filtered.filter(
        (order) => new Date(order.CreatedOn) <= toDate
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();

      filtered = filtered.filter((order) => {
        const vendorName = String(order.Vendor.VendorName || "").toLowerCase();
        const mobile = String(
          order.CustomerContactDetail?.MobNumber || ""
        ).toLowerCase();

        return vendorName.includes(query) || mobile.includes(query);
      });
    }

    return filtered
      .map((s) => ({
        id: s.Id,
        pn: s.DNNo,
        p: s,
        date: s?.PurchaseReturnDate
          ? format(new Date(s.PurchaseReturnDate), "dd/MM/yyyy")
          : "",

        name: s.Vendor.VendorName,
        totalQty: s.TotalQty,
        totalPrice: s.TotalValue,
        status: getStatus(s.Status),
        CompanyId: s.CompanyId,
        PurchaseReturnDate: s.PurchaseReturnDate,
      }))
      .filter((order) => order.CompanyId == hasMultipleLocations[0])
      .sort(
        (a, b) =>
          new Date(b.PurchaseReturnDate) - new Date(a.PurchaseReturnDate)
      );
  }, [PRDetails, fromDate, toDate, searchQuery]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = StockOut.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(StockOut.length / pageSize);
  const today = new Date();

  const handleViewSalesReturn = (id) => {
    navigate(`/purchase-return/view?purchaseId=${id}`);
  };
  const handlePrint = async (item) => {
    setPrintingId(item.id);

    try {
      const blob = await generatePrint({
        prId: item.id,
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
    } catch (error) {
      console.log(error);
      toast.error(
        "Unable to print the stock transfer out please try again after some time!"
      );
    } finally {
      setPrintingId(null);
    }
  };
  if (isPRDetailsLoading) {
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
            <h1 className="text-2xl font-bold text-gray-900">
              Purchase Return
            </h1>
          </div>
        </div>
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
                maxDate={today}
                inputFormat="dd/MM/yyyy"
                renderInput={(params) => (
                  <TextField
                    inputProps={{
                      ...params.inputProps,
                      placeholder: "dd/MM/yyyy",
                    }}
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
                maxDate={today}
                inputFormat="dd/MM/yyyy"
                renderInput={(params) => (
                  <TextField
                    inputProps={{
                      ...params.inputProps,
                      placeholder: "dd/MM/yyyy",
                    }}
                    placeholder="dd/MM/yyyy"
                    size="small"
                    fullWidth
                    variant="outlined"
                  />
                )}
              />
              <div className="grid grid-cols-2 gap-3 items-center">
                <Button
                  icon={FiSearch}
                  className="bg-blue-600 hover:bg-blue-700 h-10 w-full md:w-auto justify-center"
                  onClick={() => {}}
                >
                  Apply Filters
                </Button>
                <Button
                  onClick={() => {
                    setFromDate(null);
                    setToDate(null);
                    setSearchQuery("");
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </LocalizationProvider>
        </div>
        {/* Table */}
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <div className="flex items-center gap-5">
              <h2 className="text-lg font-medium text-gray-900">
                Purchase Return
              </h2>
              <div className="relative flex items-center w-full sm:w-64">
                <FiSearch className="absolute left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <HasPermission module="Purchase-Return" action="create">
                <Button
                  icon={FiPlus}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto justify-center"
                  onClick={() => {
                    goToPurchaseStep(1);
                    navigate("/purchase-return/create");
                  }}
                >
                  Add
                </Button>
              </HasPermission>
            </div>
          </div>

          <Table
            expand={true}
            columns={[
              "s.no",
              "pur rtn no",
              "pur rtn date",
              "vendor name",
              "total qty",
              "total price",
              "status",
              "action",
            ]}
            data={paginatedOrders}
            renderRow={(item, index) => (
              <TableRow key={item.id}>
                <TableCell>{startIndex + index + 1}</TableCell>
                <TableCell>{`${item.p.DNPrefix}/${item.pn}`}</TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.name}</TableCell>

                <TableCell>{item.totalQty}</TableCell>
                <TableCell>₹{formatINR(item.totalPrice)}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell className="flex gap-2">
                  <button
                    onClick={() => handleViewSalesReturn(item.id)}
                    className="flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiEye className="mr-1.5" />
                    View
                  </button>
                  <button
                    className="flex items-center justify-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    onClick={() => handlePrint(item)}
                  >
                    {printingId === item?.id ? (
                      <Loader color="black" />
                    ) : (
                      <div className="flex items-center">
                        <FiPrinter />
                      </div>
                    )}
                  </button>
                </TableCell>
              </TableRow>
            )}
            emptyMessage={
              isPRDetailsLoading
                ? "Loading purchase return data..."
                : "No purchase return match the filters."
            }
            pagination={true}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalItems={paginatedOrders}
          />
        </div>
      </div>
    </div>
  );
};

export default PurchaseReturn;
