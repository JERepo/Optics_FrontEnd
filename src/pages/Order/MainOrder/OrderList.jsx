import React from "react";
import { useNavigate } from "react-router";
import { FiPlus, FiSearch } from "react-icons/fi";
import { TextField } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import Button from "../../../components/ui/Button";
import { useOrder } from "../../../features/OrderContext";
import { Table, TableCell, TableRow } from "../../../components/Table";

const OrderList = () => {
  const navigate = useNavigate();
  const { goToStep } = useOrder();

  const [fromDate, setFromDate] = React.useState(null);
  const [toDate, setToDate] = React.useState(null);

  const totalOrders = 427;
  const filteredOrders = 125;
  const today = new Date();

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
          <Button
            icon={FiPlus}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto justify-center"
            onClick={() => navigate("/orders/new")}
          >
            New Order
          </Button>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Total Orders", value: totalOrders },
              { label: "Filtered Orders", value: filteredOrders },
              {
                label: "Completion Rate",
                value: `${Math.round((filteredOrders / totalOrders) * 100)}%`,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white p-4 rounded-lg shadow-xs border border-gray-100"
              >
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">{stat.value}</p>
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
                  <TextField {...params} size="small" fullWidth variant="outlined" />
                )}
              />
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={setToDate}
                minDate={fromDate}
                maxDate={today}
                renderInput={(params) => (
                  <TextField {...params} size="small" fullWidth variant="outlined" />
                )}
              />
              <Button
                icon={FiSearch}
                className="bg-blue-600 hover:bg-blue-700 h-10 w-full md:w-auto justify-center"
                onClick={() => console.log("Search with dates:", { fromDate, toDate })}
              >
                Apply Filters
              </Button>
            </div>
          </LocalizationProvider>
        </div>

        {/* Table */}
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <h2 className="text-lg font-medium text-gray-900">Order Details</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex items-center w-full sm:w-64">
                <FiSearch className="absolute left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
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
              "Sales Person",
              "Order Qty",
              "Order Value",
              "Status",
              "Action",
            ]}
            data={[]}
            renderRow={(order, index) => (
              <TableRow key={order.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{order.orderNo}</TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell>{order.patientName}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{order.mobileNo}</TableCell>
                <TableCell>{order.salesPerson}</TableCell>
                <TableCell>{order.orderQty}</TableCell>
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
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View
                  </button>
                </TableCell>
              </TableRow>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderList;
