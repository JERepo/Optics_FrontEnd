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
import {
  useGetAllStockOutDetailsQuery,
  useGetStockLocationsQuery,
  useLazyPrintPdfQuery,
} from "../../../api/stockTransfer";
import { formatINR } from "../../../utils/formatINR";
import HasPermission from "../../../components/HasPermission";
import toast from "react-hot-toast";

const getStatus = (status) => {
  const types = {
    1: "Confirmed",
    2: "Cancelled",
    3: "Partial Stock",
    4: "Stock Transfer In Complete",
  };
  return types[status] || "Draft";
};

const StockTransferOut = () => {
  const navigate = useNavigate();
  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const { goToStockStep } = useOrder();
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

  const { data: allStockOut, isLoading: isStockLoading } =
    useGetAllStockOutDetailsQuery();
      const [generatePrint, { isFetching: isPrinting }] =
        useLazyPrintPdfQuery();

  const StockOut = useMemo(() => {
    if (!allStockOut?.data) return [];

    let filtered = allStockOut.data;

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

      filtered = filtered.filter((sto) => {
        const toCompany = (
          allLocations?.data?.data.find((item) => item.Id === sto.ToCompanyId)
            .DisplayName || ""
        ).toLowerCase();
        const fromCompany = (
          allLocations?.data?.data.find((item) => item.Id === sto.FromCompanyId)
            .DisplayName || ""
        ).toLowerCase();

        return toCompany.includes(query) || fromCompany.includes(query);
      });
    }

    return filtered
      .map((s) => ({
        id: s.ID,
        ton: `${s.STOutPrefix}/${s.STOutNo}`,
        date: new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(new Date(s.STOutCreateDate)),
        toCompany: allLocations?.data?.data.find(
          (item) => item.Id === s.ToCompanyId
        )?.DisplayName,
        fromCompany: allLocations?.data?.data.find(
          (item) => item.Id === s.FromCompanyId
        )?.DisplayName,
        totalQty: s.TotalQtyOut,
        totalValue: s.TotalValueOut,
        FromCompanyId: s.FromCompanyId,
        ToCompanyId: s.ToCompanyId,
        STOutCreateDate: s.STOutCreateDate,
        status: getStatus(s.Status),
        s
      }))
      .filter(
        (order) => order.FromCompanyId === parseInt(hasMultipleLocations[0])
      )
      .sort(
        (a, b) => new Date(b.STOutCreateDate) - new Date(a.STOutCreateDate)
      );
  }, [allStockOut, fromDate, toDate, searchQuery, allLocations]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = StockOut.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(StockOut.length / pageSize);
  const today = new Date();

  const handleViewSalesReturn = (id) => {
    navigate(`/stock-transfer/view?stockOutId=${id}`);
  };
  const handlePrint = async (item) => {
    setPrintingId(item.id);

    try {
      const blob = await generatePrint({
        mainId: item.id,
        companyId: parseInt(hasMultipleLocations[0]),
      }).unwrap();

      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `StockOut_${item.s.STOutNo} (${item.s.STOutPrefix}/${item.s.STOutNo}).pdf`;
      document.body.appendChild(link);
      link.click();
      // clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error);
      toast.error(
        "Unable to print the stock transfer out please try again after some time!"
      );
    } finally {
      setPrintingId(null);
    }
  };
  if (isStockLoading) {
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
            <h1 className="text-2xl font-bold text-gray-900">Stock Transfer</h1>
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
                Stock Transfer Out
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
              <HasPermission module="StockTransfer" action="create">
                <Button
                  icon={FiPlus}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto justify-center"
                  onClick={() => {
                    goToStockStep(1);
                    navigate("/stock-transfer/create");
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
              "S.No",
              "transfer out no",
              "date",
              "from company",
              "to company",
              "total qty",
              "total value",
              "status",
              "action",
            ]}
            data={paginatedOrders}
            renderRow={(item, index) => (
              <TableRow key={item.id}>
                <TableCell>{startIndex + index + 1}</TableCell>
                <TableCell>{item.ton}</TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.fromCompany}</TableCell>
                <TableCell>{item.toCompany}</TableCell>
                <TableCell>{item.totalQty}</TableCell>
                <TableCell>₹{formatINR(item.totalValue)}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell className="flex gap-2">
                  <button
                    onClick={() => handleViewSalesReturn(item.id)}
className="flex items-center  text-lg font-medium rounded-md "
                    title="View"                  >
                    <FiEye className="" />
                  </button>
                  <button
                    className="flex items-center justify-center  text-lg font-medium rounded-md text-green-600 "
                    onClick={() => handlePrint(item)}
                  >
                    {printingId === item?.id ? (
                      <Loader color="black" />
                    ) : (
                      <div className="flex items-center">
                        <FiPrinter  />
                      </div>
                    )}
                  </button>
                </TableCell>
              </TableRow>
            )}
            emptyMessage={
              isStockLoading
                ? "Loading stock out transfer..."
                : "No stock out transfer out match the filters."
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

export default StockTransferOut;
