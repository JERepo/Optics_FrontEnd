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
import { useGetAllOrdersQuery } from "../../../api/orderApi";

const OrderList = () => {
  const navigate = useNavigate();
  const { goToStep, updateSelectedOrderDetails } = useOrder();

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: allOrders, isLoading: isAllOrdersLoading } =
    useGetAllOrdersQuery();

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
        const customerName =
          order.CustomerMaster?.CustomerName?.toLowerCase() || "";
        const patientName =
          order.CustomerContactDetail?.CustomerName?.toLowerCase() || "";
        const patientMobile =
          order.CustomerContactDetail?.MobNumber?.toLowerCase() || "";

        return (
          customerName.includes(query) ||
          patientName.includes(query) ||
          patientMobile.includes(query)
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
      status: order.Status,
    }));
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
// Status	tinyint(3) unsigned		NOT NULL	0- Draft 1- Confirmed 2- Partially Invoiced 3- Invoiced 4- Cancelled																				
  return (
    <div className="max-w-7xl">
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
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={setFromDate}
                maxDate={today}
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
                maxDate={today}
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
                <TableCell>{`${order.orderNo} ${order.OrderPrefix}`}</TableCell>
                <TableCell>{order.orderDate}</TableCell>
                <TableCell>{order.patientName}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{order.mobileNo}</TableCell>
                <TableCell>{order.totalQty}</TableCell>
                <TableCell>{order.orderValue}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      order.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : order.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => handleViewOrder(order.order)}
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
            totalItems={filteredOrders}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderList;
