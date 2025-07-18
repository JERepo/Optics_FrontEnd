import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiRefreshCw,
  FiUserPlus,
  FiArrowLeft,
  FiFilter,
} from "react-icons/fi";
import { Table, TableCell, TableRow } from "../../../components/Table";
import Loader from "../../../components/ui/Loader";
import Select from "../../../components/Form/Select";
import { useGetAllCustomersQuery } from "../../../api/customerApi";
import { useGetAllSalesPersonsQuery } from "../../../api/salesPersonApi";
import Input from "../../../components/Form/Input";

const AddOrder = () => {
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [filters, setFilters] = useState({
    name: "",
    mobileNo: "",
    customerName: "",
  });

  const {
    data: allCustomers,
    isLoading,
    isFetching,
  } = useGetAllCustomersQuery();
  const allCus = allCustomers?.data.data || [];

  const handleFilterChange = (e, field) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }));
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setInput("");
    setFilters({ name: "", mobileNo: "", customerName: "" });
    setCurrentPage(1);
  };

  const handleCustomerSelect = (customer) => setSelectedCustomer(customer);
  const onBack = () => setSelectedCustomer(null);

  const filteredData = allCus.filter((c) => {
    const name = (c.CustomerName || "").toLowerCase();
    const contactNames = (c.CustomerContactDetails || [])
      .map((d) => d.CustomerName)
      .join(" ")
      .toLowerCase();
    const combinedNames = `${name} ${contactNames}`;
    const mobile = (c.MobNumber || "").toLowerCase();
    const customerName = (c.CustomerName || "").toLowerCase();

    const matchesMainSearch =
      !input ||
      combinedNames.includes(input.toLowerCase()) ||
      mobile.includes(input.toLowerCase());

    const matchesNameFilter = combinedNames.includes(
      filters.name.toLowerCase()
    );
    const matchesMobileFilter = mobile.includes(filters.mobileNo.toLowerCase());
    const matchesCustomerNameFilter = customerName.includes(
      filters.customerName.toLowerCase()
    );

    return (
      matchesMainSearch &&
      matchesNameFilter &&
      matchesMobileFilter &&
      matchesCustomerNameFilter
    );
  });

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCustomers = filteredData.slice(
    startIndex,
    startIndex + pageSize
  );
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const hasSearchInput =
    input || filters.name || filters.mobileNo || filters.customerName;

  const renderFilterInput = (field, label) => (
    <div className="flex flex-col space-y-1">
      <span className="font-medium text-gray-700">{label}</span>
      <div className="relative">
        <input
          type="text"
          placeholder="Filter..."
          value={filters[field]}
          onChange={(e) => handleFilterChange(e, field)}
          className="w-full px-2 py-2.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        <FiFilter className="absolute right-2 top-2 text-gray-400 text-xs" />
      </div>
    </div>
  );

  return (
    <>
      {!selectedCustomer ? (
        <div className="max-w-6xl p-6 bg-white rounded-lg shadow-md pb-6">
          <div className="mb-6">
            <span className="text-lg font-semibold text-blue-600">
              Step 1: Select Customer
            </span>
          </div>

          <div className="text-xl font-semibold text-neutral-700 mb-4">
            Customer Information
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-grow flex items-center">
              <div className="absolute left-3 text-gray-400">
                <FiSearch />
              </div>
              <input
                type="text"
                placeholder="Search by name or mobile number..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full pl-10 pr-24 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="cursor-pointer absolute right-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors">
                Search
              </button>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => navigate("/order")}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
              >
                <FiArrowLeft />
                <span>Back</span>
              </button>
              <button
                onClick={handleRefresh}
                className=" flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                <FiRefreshCw />
                <span className="text-neutral-50">Refresh</span>
              </button>
              <button
                onClick={() => navigate("/customers/new")}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
              >
                <FiUserPlus />
                <span className="text-neutral-50">New Customer</span>
              </button>
            </div>
          </div>

          {(isLoading || isFetching) && (
            <div className="flex justify-center items-center">
              <Loader />
            </div>
          )}

          {hasSearchInput && !isLoading && !isFetching && (
            <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 shadow-sm p-4">
              <Table
                columns={[
                  "S.No",
                  "Patient name",
                  "Mobile no",
                  "Customer name",
                  "Action",
                ]}
                data={paginatedCustomers}
                renderHeader={(col) => {
                  if (col === "Patient name")
                    return renderFilterInput("name", col);
                  if (col === "Mobile no")
                    return renderFilterInput("mobileNo", col);
                  if (col === "Customer name")
                    return renderFilterInput("customerName", col);
                  return (
                    <span className="font-medium text-gray-700">{col}</span>
                  );
                }}
                renderRow={(customer, index) => (
                  <TableRow key={customer.id} className="hover:bg-gray-50">
                    <TableCell className="px-4 py-3 text-sm">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {customer.CustomerName || "N/A"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {customer.MobNumber || "N/A"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {customer.CustomerName || "N/A"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleCustomerSelect(customer)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-xs font-medium"
                      >
                        Select
                      </button>
                    </TableCell>
                  </TableRow>
                )}
                headerClassName="bg-gray-100"
                rowClassName="border-b border-gray-200 last:border-0"
                emptyMessage="No customers found matching your search"
                pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                totalItems={filteredData.length}
              />
            </div>
          )}
        </div>
      ) : (
        <StepB selectedCustomer={selectedCustomer} onBack={onBack} />
      )}
    </>
  );
};

export default AddOrder;

const StepB = ({ selectedCustomer, onBack }) => {
  const [orderReference, setOrderReference] = useState("");
  const [selectedSalesPerson, setSelectedSalesPerson] = useState("");
  const { data: salesPersons, isLoading: isSalesPersonsLoading } =
    useGetAllSalesPersonsQuery();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-blue-600 mb-4">
        Step 1: Customer Details
      </h2>

      <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Customer Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Detail label="Customer Name" value={selectedCustomer.CustomerName} />
          <Detail
            label="Mobile Number"
            value={`${selectedCustomer.MobileISDCode} ${selectedCustomer.MobNumber}`}
          />
          <Detail
            label="Billing Method"
            value={selectedCustomer.BillingMethod === 0 ? "Cash" : "Credit"}
          />
          <Detail label="GST Number" value={selectedCustomer.TAXNo} />
          <Detail
            label="Credit Billing"
            value={selectedCustomer.CreditBilling === 0 ? "No" : "Yes"}
          />
        </div>

        {selectedCustomer.BillAddress1 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">Address</p>
            <p className="font-medium">
              {selectedCustomer.BillAddress1}
              {selectedCustomer.BillAddress2 &&
                `, ${selectedCustomer.BillAddress2}`}
              {selectedCustomer.BillCity && `, ${selectedCustomer.BillCity}`}
              {selectedCustomer.BillPin && ` - ${selectedCustomer.BillPin}`}
            </p>
          </div>
        )}
      </div>

      <h3 className="text-lg font-medium text-gray-800 mb-4">Order Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {isSalesPersonsLoading ? (
          <Loader />
        ) : (
          <Select
            label="Sales Person"
            value={selectedSalesPerson}
            onChange={(e) => setSelectedSalesPerson(e.target.value)}
            options={salesPersons?.data.data}
            optionLabel="PersonName"
            optionValue="Id"
            defaultOption="Select Sales person"
          />
        )}

        <div>
          <Input
            label="Order Reference"
            type="text"
            value={orderReference}
            onChange={(e) => setOrderReference(e.target.value)}
            placeholder="Enter order reference"
          />
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={() => console.log("Proceed to next step")}
          className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          Next
        </button>
      </div>
    </div>
  );
};

// Reusable Detail Display Component
const Detail = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium">{value || "N/A"}</p>
  </div>
);
