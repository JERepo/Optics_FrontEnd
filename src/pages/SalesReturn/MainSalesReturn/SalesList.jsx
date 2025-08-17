import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FiEye, FiPlus, FiSearch } from "react-icons/fi";

import Button from "../../../components/ui/Button";
import { useOrder } from "../../../features/OrderContext";
import { Table, TableCell, TableRow } from "../../../components/Table";

import Loader from "../../../components/ui/Loader";
import { useSelector } from "react-redux";
import { useGetAllSalesReturnQuery } from "../../../api/salesReturnApi";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { enGB } from "date-fns/locale";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TextField } from "@mui/material";

const SalesList = () => {
  const navigate = useNavigate();
  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const { goToSalesStep } = useOrder();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate, searchQuery]);

  const { data: allSalesReturn, isLoading: isAllOrdersLoading } =
    useGetAllSalesReturnQuery();

  const Sales = useMemo(() => {
    if (!allSalesReturn?.data) return [];

    let filtered = allSalesReturn.data;

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
        const customerName = String(
          order.CustomerMaster?.CustomerName || ""
        ).toLowerCase();
        const patientName = String(
          order.CustomerContactDetail?.CustomerName || ""
        ).toLowerCase();
        const patientMobile = String(
          order.CustomerContactDetail?.MobNumber || ""
        ).toLowerCase();
        const orderNo = String(order.OrderNo || "").toLowerCase();

        return (
          customerName.includes(query) ||
          patientName.includes(query) ||
          patientMobile.includes(query) ||
          orderNo.includes(query)
        );
      });
    }

    return filtered.map((s) => ({
      id: s.Id,
      saleRtnNo: `${s.CNPrefix}/${s.CNNo}`,
      date: new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(s.CNDate)),

      patientName: s.CustomerContactDetail?.CustomerName,
      customerName: s.CustomerMaster.CustomerName,
      patientMobile: s.CustomerContactDetail.MobNumber,
      totalQty: s.CNQty,
      totalPrice: s.CNTotal,
    }));
    // .filter((order) => order.CompanyId == hasMultipleLocations[0]);
  }, [allSalesReturn, fromDate, toDate, searchQuery]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = Sales.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(Sales.length / pageSize);
  const today = new Date();

  const handleViewSalesReturn = (id) => {
    navigate(`/sales-return/view?salesId=${id}`);
  };

  if (isAllOrdersLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader color="black" width="w-10" height="h-10" />
      </div>
    );
  }
  return (
    <div className="max-w-7xl">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Return</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track all your sales returns
            </p>
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
                Sales Return
              </h2>

              <div className="relative flex items-center w-full sm:w-64">
                <FiSearch className="absolute left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sales return..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                icon={FiPlus}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto justify-center"
                onClick={() => {
                  goToSalesStep(1);
                  navigate("/sales-return/create");
                }}
              >
                Add
              </Button>
            </div>
          </div>

          <Table
            expand={true}
            columns={[
              "S.No",
              "Sales Rtn no",
              "sales rtn date",
              "patient name",
              "customer name",
              "mobile no",
              "total return qty",
              "total return price",
              "action",
            ]}
            data={paginatedOrders}
            renderRow={(s, index) => (
              <TableRow key={s.id}>
                <TableCell>{startIndex + index + 1}</TableCell>
                <TableCell>{s.saleRtnNo}</TableCell>
                <TableCell>{s.date}</TableCell>
                <TableCell>{s.patientName}</TableCell>
                <TableCell>{s.customerName}</TableCell>
                <TableCell>{s.patientMobile}</TableCell>
                <TableCell>{s.totalQty}</TableCell>
                <TableCell>₹{s.totalPrice}</TableCell>

                <TableCell>
                  <button
                    onClick={() => handleViewSalesReturn(s.id)}
                    className="flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiEye className="mr-1.5" />
                    View
                  </button>
                </TableCell>
              </TableRow>
            )}
            emptyMessage={
              isAllOrdersLoading
                ? "Loading orders..."
                : "No orders match the filters."
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

export default SalesList;
