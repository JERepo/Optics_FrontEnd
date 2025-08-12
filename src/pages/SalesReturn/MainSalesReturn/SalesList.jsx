import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FiEye, FiPlus, FiSearch } from "react-icons/fi";

import Button from "../../../components/ui/Button";
import { useOrder } from "../../../features/OrderContext";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { useGetAllOrdersQuery } from "../../../api/orderApi";

import Loader from "../../../components/ui/Loader";
import { useSelector } from "react-redux";

const SalesList = () => {
  const navigate = useNavigate();
  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const { goToSalesStep } = useOrder();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: allOrders, isLoading: isAllOrdersLoading } =
    useGetAllOrdersQuery();

  const Sales = useMemo(() => {
    if (!allOrders?.data?.data) return [];

    let filtered = allOrders.data.data;

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
  }, [allOrders,  searchQuery]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = Sales.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(Sales.length / pageSize);

  const totalOrders = allOrders?.data?.data?.length || 0;
  const filteredOrders = Sales.length;
  const today = new Date();

 

  const getOrderStatus = (status) => {
    const types = {
      1: "Confirmed",
      2: "Partially Invoiced",
      3: "Invoiced",
      4: "Cancelled",
    };
    return types[status] || "Draft";
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
            columns={[
              "S.No",
              "Sale Rtn no",
              "sale rtn date",
              "customer name",
              "mobile no",
              "total qty",
              "total price",
              "action",
            ]}
            data={[]}
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
                <TableCell>
                  <button
                    // onClick={() => handleViewOrder(order.order)}
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

export default SalesList;
