import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FiEye, FiPlus, FiPrinter, FiSearch } from "react-icons/fi";
import { TextField } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import Button from "../../components/ui/Button";
import { useOrder } from "../../features/OrderContext";
import { Table, TableCell, TableRow } from "../../components/Table";
import { enGB } from "date-fns/locale";
import Loader from "../../components/ui/Loader";
import { useSelector } from "react-redux";
import {
  useGetAllInvoiceQuery,
  useLazyPrintPdfQuery,
} from "../../api/InvoiceApi";
import HasPermission from "../../components/HasPermission";
import toast from "react-hot-toast";

const getOrderStatus = (status) => {
  const types = {
    1: "Confirmed",
    2: "Partially Cancelled",
    3: "Cancelled",
  };
  return types[status] || "Draft";
};

const InvoiceList = () => {
  const navigate = useNavigate();
  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const { goToStep, updateSelectedOrderDetails } = useOrder();

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [printingId, setPrintingId] = useState(null);

  const { data: allOrders, isLoading: isAllOrdersLoading } =
    useGetAllInvoiceQuery();
  const [generatePrint, { isFetching: isPrinting }] = useLazyPrintPdfQuery();

  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate, searchQuery]);

  const Orders = useMemo(() => {
    if (!allOrders) return [];

    let filtered = allOrders;

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
      filtered = filtered.filter((invoice) => {
        const query = searchQuery.toLowerCase();

        const customerName =
          invoice.CustomerMaster?.CustomerName?.toLowerCase() || "";
        const patientName = invoice.Patient?.CustomerName?.toLowerCase() || "";
        const patientMobile =
          invoice.CustomerMaster?.MobNumber?.toLowerCase() || "";
        const invoiceNo = String(invoice.InvoiceNo)?.toLowerCase() || "";

        return (
          customerName.includes(query) ||
          patientName.includes(query) ||
          patientMobile.includes(query) ||
          invoiceNo.includes(query)
        );
      });
    }

    return filtered.map((invoice) => ({
      id: invoice.Id,
      invoice: invoice,
      prefix: invoice.InvoicePrefix,
      invoiceDate: new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(invoice.InvoiceDate)),
      invoiceNo: invoice.InvoiceNo,
      customerName: invoice.CustomerMaster.CustomerName,
      patientName: invoice.Patient.CustomerName,
      mobileNo: invoice.Patient.MobNumber,
      qty: invoice.TotalQty,
      amount: invoice.TotalValue,
      status: getOrderStatus(invoice.Status),
      CompanyID :invoice?.CompanyID
    }))
    .filter((order) =>  hasMultipleLocations.includes(order.CompanyID));
  }, [allOrders, fromDate, toDate, searchQuery]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = Orders.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(Orders.length / pageSize);

  const totalOrders = allOrders?.length || 0;
  const filteredOrders = Orders.length;
  const today = new Date();

  const handleViewinvoice = (invoice) => {
    updateSelectedOrderDetails(invoice);
    navigate(`/invoice/view?invoiceId=${invoice}`);
  };

  const handlePrint = async (item) => {
    console.log("item",item)
    setPrintingId(item.Id);

    try {
      const blob = await generatePrint({
        id: item.Id,
      }).unwrap();

      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" })
      );
       const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_${item.InvoiceNo} (${item.InvoicePrefix}${item.InvoiceNo}).pdf`
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
            <h1 className="text-2xl font-bold text-gray-900">Invoice List</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track all your invoices
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
                Invoice Details
              </h2>

              <div className="relative flex items-center w-full sm:w-64">
                <FiSearch className="absolute left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <HasPermission module="Invoice" action="create">
                <Button
                  icon={FiPlus}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto justify-center"
                  onClick={() => {
                    goToStep(1);
                    navigate("/invoice/create");
                  }}
                >
                  From Order
                </Button>
              </HasPermission>
              {/* <HasPermission module="Invoice" action="create">
                <Button
                  icon={FiPlus}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto justify-center"
                  onClick={() => {
                    goToStep(1);
                    navigate("/add-order");
                  }}
                >
                  DC Invoice
                </Button>
              </HasPermission> */}
            </div>
          </div>

          <Table
            columns={[
              "S.No",
              "invoice date",
              "invoice no",
              "patient name",
              "customer name",

              "mobile no",
              "qty",
              "amount",
              "status",
              "action",
            ]}
            data={paginatedOrders}
            renderRow={(invoice, index) => (
              <TableRow key={invoice.id}>
                <TableCell>{startIndex + index + 1}</TableCell>
                <TableCell>{invoice.invoiceDate}</TableCell>
                <TableCell>{`${invoice.prefix ? invoice.prefix : "NA"}/${
                  invoice.invoiceNo
                }`}</TableCell>
                <TableCell>{invoice.patientName}</TableCell>
                <TableCell>{invoice.customerName}</TableCell>
                <TableCell>{invoice.mobileNo}</TableCell>
                <TableCell>{invoice.qty}</TableCell>
                <TableCell>₹{invoice.amount}</TableCell>
                <TableCell>{invoice.status}</TableCell>
                <TableCell className="flex gap-2">
                  <button
                    onClick={() => handleViewinvoice(invoice.id)}
                    className="flex items-center  text-lg font-medium rounded-md "
                    title="View"
                  >
                    <FiEye className="" />
                  </button>
                  <button
                    className="flex items-center justify-center  text-lg font-medium rounded-md text-green-600 "
                    onClick={() => handlePrint(invoice.invoice)}
                  >
                    {printingId === invoice?.id ? (
                      <Loader color="black" />
                    ) : (
                      <div className="flex items-center">
                        <FiPrinter title="Print" />
                      </div>
                    )}
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
            totalItems={filteredOrders}
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;
