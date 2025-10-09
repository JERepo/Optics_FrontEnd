import React, { useMemo, useState } from "react";
import { Table, TableCell, TableRow } from "../../components/Table";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import {
  useGetAllCustomersQuery,
  useGetLoyaltySummaryQuery,
} from "../../api/customerApi";
import { FiArrowLeft, FiRefreshCw, FiSearch } from "react-icons/fi";
import Button from "../../components/ui/Button";
import {
  FiUser,
  FiCreditCard,
  FiAward,
  FiDollarSign,
  FiFileText,
} from "react-icons/fi";
import { MdCurrencyRupee } from "react-icons/md";

const LoyaltySummary = () => {
  const navigate = useNavigate();
  const { user, hasMultipleLocations } = useSelector((state) => state.auth);
  const [input, setInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const {
    data: customersResp,
    isLoading,
    isFetching,
  } = useGetAllCustomersQuery();

  const {
    data: loyaltySummary,
    isSuccess,
    isError,
    error,
    isLoading: isSummaryLoading,
    isFetching: loyaltyFetching,
  } = useGetLoyaltySummaryQuery(
    {
      customerId: selectedCustomer?.Id,
    },
    { 
      skip: !selectedCustomer,
      refetchOnMountOrArgChange: true, 
    }
  );

  //   data manipulation
  const allCus = useMemo(() => {
    if (!customersResp?.data?.data) return [];

    const customers = customersResp.data.data; // array of customers

    // Remove any nulls (if customer was not found)
    return customers;
  }, [customersResp]);

  const [filters, setFilters] = useState({
    name: "",
    mobileNo: "",
    customerName: "",
  });
  const hasSearchInput =
    input || filters.name || filters.mobileNo || filters.customerName;

  const filteredData = allCus.filter((c) => {
    const customerName = (c.CustomerName || "").toLowerCase();

    const matchesMainSearch =
      !input || customerName.includes(input.toLowerCase());

    const matchesCustomerName = customerName.includes(
      filters.customerName.toLowerCase()
    );

    return matchesMainSearch && matchesCustomerName;
  });
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCustomers = filteredData.slice(
    startIndex,
    startIndex + pageSize
  );
  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleRefresh = () => {
    setInput("");
    setFilters({ name: "", mobileNo: "", customerName: "" });
    setCurrentPage(1);
  };

  const handleCustomerSelect = async (customerWithContact) => {
    setSelectedCustomer(customerWithContact);
  };
  return (
    <div>
      <div className="max-w-8xl p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <div>
          {!selectedCustomer && (
            <div>
              <div className="mb-6 pb-4 border-b border-gray-200">
                <span className="text-lg font-medium text-gray-800">
                  Select Customer
                </span>
              </div>

              {/* Content Title */}
              <div className="text-xl font-semibold text-gray-800 mb-5">
                Customer Information
              </div>

              {/* Search and Actions Container */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Search Input */}
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <FiSearch size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name or mobile number..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full pl-10 pr-28 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-gray-50 text-gray-800 placeholder-gray-500"
                  />
                  <button className="absolute inset-y-0 right-0 m-1 px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium transition-colors">
                    Search
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium"
                  >
                    <FiRefreshCw size={16} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {hasSearchInput && !isLoading && !isFetching && (
                <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 shadow-sm p-4">
                  <Table
                    columns={[
                      "S.No",
                      "Customer name",
                      "customer Mobile no",
                      "Action",
                    ]}
                    data={paginatedCustomers}
                    renderRow={(customer, index) => (
                      <TableRow key={customer.id} className="hover:bg-gray-50">
                        <TableCell className="px-4 py-3 text-sm">
                          {startIndex + index + 1}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm">
                          {customer.CustomerName}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm">
                          {customer?.MobNumber}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm">
                          <Button
                            onClick={() => handleCustomerSelect(customer)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-xs font-medium"
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  />
                </div>
              )}
            </div>
          )}

          {selectedCustomer ? (
            (isSummaryLoading || loyaltyFetching) ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 my-5">
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Loading Loyalty Summary
                  </h3>
                  <p className="text-gray-500">Please wait...</p>
                </div>
              </div>
            ) : (loyaltySummary?.data && isSuccess) ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 my-5">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-800">
                      Loyalty Summary
                    </h2>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCustomer(null);
                      handleRefresh();
                    }}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400"
                  >
                    <FiArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                      <FiUser className="w-4 h-4" />
                      Customer Name
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      {selectedCustomer?.CustomerName}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                      <FiCreditCard className="w-4 h-4" />
                      Loyalty No
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      {loyaltySummary?.data[0]?.loyaltyNo}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                      <FiAward className="w-4 h-4" />
                      Points Balance
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      {loyaltySummary?.data[0]?.pointsBalance}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-0 text-sm font-medium text-gray-600">
                      <MdCurrencyRupee className="w-4 h-4" />
                      Points Value
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      ₹{loyaltySummary?.data[0]?.pointValue}
                    </p>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <FiFileText className="w-4 h-4 text-gray-600" />
                      <h3 className="font-medium text-gray-800">
                        Transaction History
                      </h3>
                    </div>
                  </div>
                  <Table
                    columns={["Date", "Points Value", "Remarks"]}
                    data={loyaltySummary?.data}
                    renderRow={(s, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <TableCell className="py-3 px-4 font-medium text-gray-700">
                          {s.date.split("-").reverse().join("/")}
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-800">
                            ₹{s.pointValue}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-gray-600">
                          {s.remarks}
                        </TableCell>
                      </TableRow>
                    )}
                  />
                </div>
              </div>
            ) : (
              /* No Data State - Only shows when selectedCustomer exists but no loyalty data */
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 my-5">
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <div className="w-24 h-24 mb-4 text-gray-300">
                    <FiUser className="w-full h-full" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No Loyalty Summary Found
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    No loyalty program data is available for{" "}
                    <span className="font-semibold text-gray-700">
                      {selectedCustomer?.CustomerName}
                    </span>
                    . This customer may not be enrolled in the loyalty program
                    or has no transaction history.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCustomer(null)}
                      className="flex items-center gap-2"
                    >
                      <FiArrowLeft className="w-4 h-4" />
                      Back to Customers
                    </Button>
                    <Button
                      className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                      onClick={() => navigate("/customer")}
                    >
                      <FiAward className="w-4 h-4" />
                      Enroll in Loyalty Program
                    </Button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoyaltySummary;