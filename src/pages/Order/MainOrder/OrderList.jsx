import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FiEye, FiPlus, FiPrinter, FiSearch } from "react-icons/fi";
import { TextField } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import Button from "../../../components/ui/Button";
import { useOrder } from "../../../features/OrderContext";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { useGetAllOrdersQuery, useLazyPrintPdfQuery } from "../../../api/orderApi";
import { enGB } from "date-fns/locale";
import Loader from "../../../components/ui/Loader";
import { useSelector } from "react-redux";
import HasPermission from "../../../components/HasPermission";
import toast from "react-hot-toast";

const OrderList = () => {
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
    useGetAllOrdersQuery();
  const [generatePrint, { isFetching: isPrinting }] = useLazyPrintPdfQuery();

  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate, searchQuery]);

  const Orders = useMemo(() => {
    if (!allOrders?.data?.data) return [];

    let filtered = allOrders.data.data;

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

    return filtered.map((order) => ({
      id: order.Id,
      order: order,
      orderNo: order.OrderNo,
      OrderPrefix: order.OrderPrefix,
      orderDate: new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(order.OrderPlacedDate)),

      customerName: order.CustomerMaster?.CustomerName,
      patientName: order.CustomerContactDetail?.CustomerName,
      mobileNo: order.CustomerContactDetail?.MobNumber,
      orderValue: order.TotalValue,
      totalQty: order.TotalQty,
      Status: order.Status,
    }));
    // .filter((order) => order.CompanyId == hasMultipleLocations[0]);
  }, [allOrders, fromDate, toDate, searchQuery]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = Orders.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(Orders.length / pageSize);

  const totalOrders = allOrders?.data?.data?.length || 0;
  const filteredOrders = Orders.length;
  const today = new Date();

  const handleViewOrder = (order) => {
    updateSelectedOrderDetails(order);
    navigate(`/add-order/view-order?orderId=${order.Id}`);
  };

  const getOrderStatus = (status) => {
    const types = {
      1: "Confirmed",
      2: "Partially Invoiced",
      3: "Invoiced",
      4: "Cancelled",
    };
    return types[status] || "Draft";
  };

  const handlePrint = async (item) => {
    setPrintingId(item.id);
    console.log("ite", item);

    try {
      const blob = await generatePrint({
       orderId : item.id
      }).unwrap();

      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `OrderConfirmation_${item.order.OrderNo} (${item.order.OrderPrefix}/${item.order.OrderNo}).pdf`;
      document.body.appendChild(link);
      link.click();
      // clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error);
      toast.error(
        "Unable to print the order please try again after some time!"
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
            <h1 className="text-2xl font-bold text-gray-900">Order List</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track all your orders
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Total Orders", value: totalOrders },
              { label: "Filtered Orders", value: filteredOrders },
              {
                label: "Completion Rate",
                value: totalOrders
                  ? `${Math.round((filteredOrders / totalOrders) * 100)}%`
                  : "0%",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white p-4 rounded-lg shadow-xs border border-gray-100"
              >
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
            ))}
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
                Order Details
              </h2>

              <div className="relative flex items-center w-full sm:w-64">
                <FiSearch className="absolute left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <HasPermission module="Order" action={["create"]}>
                <Button
                  icon={FiPlus}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto justify-center"
                  onClick={() => {
                    goToStep(1);
                    navigate("/add-order");
                  }}
                >
                  New Order
                </Button>
              </HasPermission>
            </div>
          </div>

          <Table
            columns={[
              "S.No",
              "Order No",
              "Date",
              "Patient Name",
              "Customer Name",
              "Mobile No",
              "Order Qty",
              "Order Value",
              "Status",
              "Action",
            ]}
            data={paginatedOrders}
            renderRow={(order, index) => (
              <TableRow key={order.id}>
                <TableCell>{startIndex + index + 1}</TableCell>
                <TableCell>{`${order.OrderPrefix}/${order.orderNo} `}</TableCell>
                <TableCell>{order.orderDate}</TableCell>
                <TableCell>{order.patientName}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{order.mobileNo}</TableCell>
                <TableCell>{order.totalQty}</TableCell>
                <TableCell>{order.orderValue}</TableCell>
                <TableCell>{getOrderStatus(order.Status)}</TableCell>
                <TableCell className="flex gap-2">
                  <button
                    onClick={() => handleViewOrder(order.order)}
                    className="flex items-center  text-lg font-medium rounded-md "
                    title="View"
                  >
                    <FiEye className="" />
                  </button>
                  <button
                    className="flex items-center justify-center  text-lg font-medium rounded-md text-green-600 "
                    onClick={() => handlePrint(order)}
                  >
                    {printingId === order?.id ? (
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

export default OrderList;
