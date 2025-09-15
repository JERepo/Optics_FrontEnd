import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FiEye, FiPlus, FiSearch } from "react-icons/fi";
import { TextField } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import Button from "../../../components/ui/Button";
import { useOrder } from "../../../features/OrderContext";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { enGB } from "date-fns/locale";
import Loader from "../../../components/ui/Loader";
import { useGetAllCRQuery } from "../../../api/customerRefund";

const CRMainList = () => {
  const navigate = useNavigate();
  const { goToStep,  } = useOrder();

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: allCp, isLoading: isAllOrdersLoading } =
    useGetAllCRQuery();

  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate, searchQuery]);

  const customerPayments = useMemo(() => {
    if (!allCp?.data?.data) return [];

    let filtered = allCp?.data?.data;

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

    // if (searchQuery) {
    //   filtered = filtered.filter((invoice) => {
    //     const query = searchQuery.toLowerCase();

    //     const customerName =
    //       invoice.CustomerMaster?.CustomerName?.toLowerCase() || "";
    //     const patientName = invoice.Patient?.CustomerName?.toLowerCase() || "";
    //     const patientMobile =
    //       invoice.CustomerMaster?.MobNumber?.toLowerCase() || "";
    //     const invoiceNo = String(invoice.InvoiceNo)?.toLowerCase() || "";

    //     return (
    //       customerName.includes(query) ||
    //       patientName.includes(query) ||
    //       patientMobile.includes(query) ||
    //       invoiceNo.includes(query)
    //     );
    //   });
    // }

    return filtered.map((c) => ({
        id:c.Id,
        customerName:c.CustomerMaster?.CustomerName,
        mobile:c?.CustomerMaster?.MobNumber,
        amount :c.Amount
    }));
    // .filter((order) => order.CompanyID === parseInt(hasMultipleLocations[0]));
  }, [allCp, fromDate, toDate, searchQuery]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = customerPayments.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(customerPayments.length / pageSize);

  const totalOrders = customerPayments.length || 0;
  const filteredOrders = customerPayments.length;
  const today = new Date();

  const handleViewinvoice = (id) => {
    // updateSelectedOrderDetails(invoice);
    navigate(`/customer-refund/view?crId=${id}`);
  };


  if (isAllOrdersLoading) {
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
            <h1 className="text-2xl font-bold text-gray-900">Customer Refund</h1>
            {/* <p className="text-sm text-gray-500 mt-1">
              Manage and track all your invoices
            </p> */}
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
                Customer Refund
              </h2>

              <div className="relative flex items-center w-full sm:w-64">
                <FiSearch className="absolute left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search ..."
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
                  goToStep(1);
                  navigate("/customer-refund/create");
                }}
              >
                Add Customer Refund
              </Button>
             
            </div>
          </div>

          <Table
            columns={[
              "S.No",
              "customer name",
              "mobile",
              "amount",
              "action",
            ]}
            data={paginatedOrders}
            renderRow={(item, index) => (
              <TableRow key={item.id}>
                <TableCell>{startIndex + index + 1}</TableCell>
                <TableCell>{item.customerName}</TableCell>
                <TableCell>{item.mobile}</TableCell>
                <TableCell>₹{Math.abs(parseFloat(item.amount))}</TableCell>
                <TableCell>
                  <button
                    onClick={() => handleViewinvoice(item.id)}
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
                ? "Loading customers..."
                : "No customer payments match the filters."
            }
            pagination={true}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalItems={filteredOrders}
          />
        </div>
      </div>
    </div>
  );
};

export default CRMainList;
