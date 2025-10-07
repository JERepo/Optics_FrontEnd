import React, { useMemo, useState } from "react";
import { Table, TableCell, TableRow } from "../../components/Table";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { useGetAllCustomersQuery } from "../../api/customerApi";
import { FiArrowLeft, FiRefreshCw, FiSearch } from "react-icons/fi";
import Button from "../../components/ui/Button";

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

  console.log(selectedCustomer);
  return (
    <div>
      <div className="max-w-8xl p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <div>
          {!selectedCustomer && (
            <div>
              <div className="mb-6 pb-4 border-b border-gray-200">
                <span className="text-lg font-medium text-gray-800">
                  Step 1: Select Customer
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
                    onClick={() => navigate("/order-list")}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                  >
                    <FiArrowLeft size={16} />
                    <span>Back</span>
                  </button>
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

          <div>
            <div>
              {" "}
              <span className="text-lg font-medium text-gray-800">
                Loyalty Summary
              </span>
            </div>

          {/* Customer details */}
            <div className="mt-5">   
                <div>
                    <span className="text-md font-medium text-gray-800">Customer Name:</span> {selectedCustomer.CustomerName}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltySummary;
