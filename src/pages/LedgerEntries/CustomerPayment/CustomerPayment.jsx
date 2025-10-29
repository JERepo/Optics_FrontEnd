import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import {
  useGetAllCompanyLocationsQuery,
  useGetAllCustomersQuery,
  useGetCompanyIdQuery,
} from "../../../api/customerApi";
import Button from "../../../components/ui/Button";
import { Autocomplete, TextField } from "@mui/material";
import { useGetLocationByIdQuery } from "../../../api/roleManagementApi";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { useLazyGetCustomerPaymentQuery } from "../../../api/customerPayment";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { formatINR } from "../../../utils/formatINR";
import {
  FiArrowLeft,
  FiCheck,
  FiEdit2,
  FiRefreshCw,
  FiSearch,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
import Modal from "../../../components/ui/Modal";
import Checkbox from "../../../components/Form/Checkbox";
import PaymentEntries from "./PaymentEntries";
import CollectAdvance from "./CollectAdvace";
import Loader from "../../../components/ui/Loader";
import { useGetCustomerContactDetailsQuery } from "../../../api/orderApi";

const CustomerPayment = () => {
  const navigate = useNavigate();
  const { user, hasMultipleLocations } = useSelector((state) => state.auth);
  const [input, setInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editMode, setEditMode] = useState({});
  const [items, setItems] = useState([]);
  const [nextClicked, setNextClicked] = useState(false);
  const [collectPayment, setCollectPayment] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    name: "",
    mobileNo: "",
    customerName: "",
  });
  const {
    data: customersResp,
    isLoading,
    isFetching,
  } = useGetAllCustomersQuery();
  const { data: allCompanies } = useGetAllCompanyLocationsQuery();
  const { data: locationById } = useGetLocationByIdQuery(
    { id: parseInt(hasMultipleLocations[0]) },
    { skip: !parseInt(hasMultipleLocations[0]) }
  );
  const companyId = locationById?.data?.data.Id;

  const { data: companySettings } = useGetCompanyIdQuery(
    { id: companyId },
    { skip: !companyId }
  );
  const CustomerPoolID = companySettings?.data?.data.CustomerPoolID;
  const allCompanyIds = allCompanies?.data?.data
    .filter((item) => item.CustomerPoolID == CustomerPoolID)
    .map((item) => item.CompanyId);

  const [getPayments, { isFetching: isPaymentsLoading }] =
    useLazyGetCustomerPaymentQuery();
  const { data: contactResp, refetch: refetchPatient } =
    useGetCustomerContactDetailsQuery({
      companyId: parseInt(hasMultipleLocations[0]),
    });

  // Initialize editMode and set originalAmountToPay for each item
  useEffect(() => {
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      items.forEach((item, index) => {
        if (!newEditMode[index]) {
          newEditMode[index] = {
            BuyingPrice: false,
            originalAmountToPay: item.AmountToPay, // Always take Amount
          };
        }
      });
      return newEditMode;
    });
  }, [items]);

  const allCus = useMemo(() => {
    if (!customersResp?.data?.data || !contactResp?.data) return [];

    const contacts = contactResp.data; // flat array of contacts
    const customers = customersResp.data.data; // array of customers

    // Create a flat list where each contact is merged with its customer
    const combinedList = contacts.map((contact) => {
      const customer = customers.find((c) => c.Id === contact.CustomerMasterID);
      if (!customer) return null;

      return {
        ...customer,
        CustomerContactDetails: [contact], // only that one contact
      };
    });

    // Remove any nulls (if customer was not found)
    return combinedList.filter(Boolean);
  }, [customersResp, contactResp]);

  const handleFilterChange = (e, field) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }));
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setInput("");
    setFilters({ name: "", mobileNo: "", customerName: "" });
    setCurrentPage(1);
  };
  const handleCustomerSelect = (customerWithContact) => {
    console.log("cco", customerWithContact);
    const patient = customerWithContact.CustomerContactDetails?.[0];

    if (!patient) {
      toast.error("No patient (contact) found for selected customer.");
      return;
    }
    setSelectedCustomer(customerWithContact);
  };
  const filteredData = allCus.filter((c) => {
    const customerName = (c.CustomerName || "").toLowerCase();

    const firstContact = c.CustomerContactDetails[0] || {};
    const patientName = (firstContact.CustomerName || "").toLowerCase();
    const mobileNo = (firstContact.MobNumber || "").toLowerCase();

    const matchesMainSearch =
      !input ||
      customerName.includes(input.toLowerCase()) ||
      patientName.includes(input.toLowerCase()) ||
      mobileNo.includes(input.toLowerCase());

    const matchesPatientName = patientName.includes(filters.name.toLowerCase());
    const matchesMobile = mobileNo.includes(filters.mobileNo.toLowerCase());
    const matchesCustomerName = customerName.includes(
      filters.customerName.toLowerCase()
    );

    return (
      matchesMainSearch &&
      matchesPatientName &&
      matchesMobile &&
      matchesCustomerName
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
  // Fetch payments and initialize AmountToPay to Amount
  const handleFetch = async () => {
    try {
      const res = await getPayments({
        companyId: parseInt(hasMultipleLocations[0]),
        customerId: selectedCustomer?.Id,
      }).unwrap();
      if (res?.data?.length > 0) {
        // Initialize AmountToPay to Amount (Amount Due) for each item
        const updatedItems = res.data.map((item) => ({
          ...item,
          AmountToPay: item.Invoice
            ? item.AmountToPay ?? item.Amount
            : -(item.AmountToPay ?? item.Amount),
          Amount: item.Invoice
            ? item.AmountToPay ?? item.Amount
            : -(item.AmountToPay ?? item.Amount),
        }));
        setItems(updatedItems);
        setCollectPayment(false);

        toast.success("Payment Details Fetched Successfully!");
      } else {
        toast.error("No payment details found!");
        setItems([]);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch payment details.");
    }
  };

  const toggleEditMode = (index, field, action = "toggle") => {
    setEditMode((prev) => {
      const key = index;
      const currentMode = prev[key]?.[field];
      const item = items[index];

      if (field === "BuyingPrice" && !currentMode) {
        // Entering edit mode
        return {
          ...prev,
          [key]: {
            ...prev[key],
            [field]: true,
            originalAmountToPay: item.AmountToPay,
          },
        };
      }

      if (currentMode && action === "cancel") {
        // Cancel edit: restore original AmountToPay
        setItems((prevItems) =>
          prevItems.map((i, idx) =>
            idx === index
              ? { ...i, AmountToPay: prev[key].originalAmountToPay }
              : i
          )
        );
      }

      return {
        ...prev,
        [key]: {
          ...prev[key],
          [field]: !currentMode,
          originalAmountToPay: prev[key]?.originalAmountToPay,
        },
      };
    });
  };

  const handleSellingPriceChange = (index, price) => {
    const newPrice = Number(price);
    const item = items[index];

    if (isNaN(newPrice)) return;

    // Case 1: Positive due (receivable)
    if (item.Amount > 0) {
      if (newPrice > item.Amount) {
        toast.error("Amount to Pay cannot exceed Amount Due!");
        return;
      }
      if (newPrice < 0) {
        toast.error("Amount to Pay cannot be negative!");
        return;
      }
    }

    // Case 2: Negative due (refund/credit)
    if (item.Amount < 0) {
      if (newPrice > 0) {
        toast.error("Refund amount cannot be greater than 0!");
        return;
      }
      if (newPrice < item.Amount) {
        toast.error(`Refund amount cannot be less than ${item.Amount}`);
        return;
      }
    }

    // ✅ Update if valid
    setItems((prev) =>
      prev.map((i, idx) =>
        idx === index ? { ...i, AmountToPay: newPrice } : i
      )
    );
  };

  const handleProductSelection = (order) => {
    setSelectedProducts((prev) => {
      if (prev.includes(order.Id)) {
        return prev.filter((Id) => Id !== order.Id);
      }
      return [...prev, order.Id];
    });
  };

  const handleSelectAllProducts = (e) => {
    if (e.target.checked) {
      const allOrderIds = items.map((order) => order.Id);
      setSelectedProducts(allOrderIds);
    } else {
      setSelectedProducts([]);
    }
  };

  const handleCollectPayment = () => {
    setNextClicked(true);
  };
  const handleCollectAdvance = (e) => {
    setCollectPayment(e.target.checked);
    setItems([]);
  };
  const totalReceivable = items.reduce((sum, item) => {
    if (selectedProducts.includes(item.Id)) {
      const amount = item.Invoice
        ? parseFloat(item.Amount)
        : -parseFloat(item.Amount);
      return sum + amount;
    }
    return sum;
  }, 0);

  const totalSelectedValue = items.reduce((sum, item) => {
    if (selectedProducts.includes(item.Id)) {
      const amountToPay = parseFloat(item.AmountToPay);
      return sum + amountToPay;
    }
    return sum;
  }, 0);

  return (
    <div>
      <div className="max-w-8xl p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="">
         {!selectedCustomer && <div className="text-xl font-semibold text-neutral-700 mb-4 flex flex-col">
            Patient Information
          </div>}
          {selectedCustomer && (
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <div className="text-neutral-700 text-lg font-semibold">
                  Patient Name:{" "}
                  {selectedCustomer?.CustomerContactDetails[0]?.CustomerName}
                </div>
                <div className="text-neutral-700 text-lg font-semibold">
                  Customer Name: {selectedCustomer?.CustomerName}
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  handleRefresh();
                  setSelectedCustomer(null);
                  setItems([]);
                  setCollectPayment(false);
                }}
              >
                Back
              </Button>
            </div>
          )}
        </div>
        {!selectedCustomer && (
          <div>
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
                  className="w-full pl-10 pr-24 py-2.5 border border-gray-300 rounded-lg focus:outline-none rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button className="cursor-pointer absolute right-2 bg-neutral-300 hover:bg-neutral-400 text-neutral-700 px-4 py-1.5 rounded-md text-sm font-medium transition-colors">
                  Search
                </button>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => navigate("/customer-payment")}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-neutral-700 hover:bg-gray-50 text-sm"
                >
                  <FiArrowLeft />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleRefresh}
                  className=" flex items-center gap-2 px-3 py-2 bg-neutral-300 hover:bg-neutral-400 text-neutral-700 rounded-lg text-sm"
                >
                  <FiRefreshCw />
                  <span className="text-neutral-700">Refresh</span>
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
                  renderRow={(customer, index) => (
                    <TableRow key={customer.id} className="hover:bg-gray-50">
                      <TableCell className="px-4 py-3 text-sm">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        {customer.CustomerContactDetails[0]?.CustomerName}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        {customer.CustomerContactDetails[0]?.MobNumber}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        {customer.CustomerName}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        <Button
                          // isLoading={loadingCustomerId === customer.Id}
                          onClick={() => handleCustomerSelect(customer)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-xs font-medium"
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                  headerClassName="bg-gray-100"
                  rowClassName="border-b border-gray-200 last:border-0"
                  emptyMessage="No Patients found matching your search"
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
        )}
        {selectedCustomer && (
          <div className="flex justify-between mt-5 items-center">
            <div className="text-lg text-neutral-900">
              <Checkbox
                checked={collectPayment}
                onChange={handleCollectAdvance}
                label="Collect Advance"
              />
            </div>

            <Button
              onClick={handleFetch}
              isLoading={isPaymentsLoading}
              disabled={isPaymentsLoading}
            >
              Fetch Details
            </Button>
          </div>
        )}

        {items.length > 0 && !collectPayment && (
          <Table
            className="mt-5"
            columns={[
              "#",
              "doc no",
              "dr/cr",
              "doc date",
              "total amount",
              "amount due",
              "amount to pay",
              "location",
            ]}
            data={items || []}
            renderHeader={(column) => {
              if (column === "#") {
                const allSelected =
                  items?.length > 0 && selectedProducts.length === items.length;
                return (
                  <div className="flex items-center gap-1">
                    {column}
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAllProducts}
                      className="h-3 w-3"
                      disabled={nextClicked}
                    />
                  </div>
                );
              }
              return <>{column}</>;
            }}
            renderRow={(item, index) => (
              <TableRow key={item.Id}>
                <TableCell>
                  <input
                    type="checkbox"
                    onChange={() => handleProductSelection(item)}
                    className="h-5 w-5"
                    checked={selectedProducts.includes(item.Id)}
                    disabled={nextClicked}
                  />
                </TableCell>
                <TableCell>
                  {item.Invoice
                    ? `${item.Invoice?.InvoicePrefix}/${item.Invoice?.InvoiceNo}`
                    : `${item.salesMaster?.CNPrefix}/${item.salesMaster?.CNNo}`}
                </TableCell>
                <TableCell>{item.Invoice ? "DR" : "CR"}</TableCell>
                <TableCell>
                  {item.Invoice
                    ? format(new Date(item.Invoice?.InvoiceDate), "dd/MM/yyyy")
                    : format(new Date(item.salesMaster?.CNDate), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>
                  ₹
                  {item.Invoice
                    ? item.Invoice?.TotalValue
                    : item.salesMaster?.CNTotal}
                </TableCell>
                <TableCell>₹{formatINR(item.Amount)}</TableCell>
                <TableCell>
                  {editMode[index]?.BuyingPrice ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={item.AmountToPay || ""}
                        onChange={(e) =>
                          handleSellingPriceChange(index, e.target.value)
                        }
                        className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="Enter price"
                      />
                      <button
                        onClick={() =>
                          toggleEditMode(index, "BuyingPrice", "save")
                        }
                        className="text-neutral-400 transition"
                        title="Save"
                      >
                        <FiCheck size={18} />
                      </button>
                      <button
                        onClick={() =>
                          toggleEditMode(index, "BuyingPrice", "cancel")
                        }
                        className="text-neutral-400 transition"
                        title="Cancel"
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      ₹{formatINR(item.AmountToPay)}
                      <button
                        onClick={() => toggleEditMode(index, "BuyingPrice")}
                        className="text-neutral-400 transition"
                        title="Edit Price"
                      >
                        <FiEdit2 size={14} />
                      </button>
                    </div>
                  )}
                </TableCell>
                <TableCell>{item.location?.LocationName}</TableCell>
              </TableRow>
            )}
          />
        )}

        {items.length > 0 && !collectPayment && (
          <div className="flex gap-10 justify-end mt-5 p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-6">
              <span className="text-lg font-semibold">
                Total Receivable: ₹{formatINR(totalReceivable)}
              </span>
              <span className="text-lg font-semibold">
                Total Amount to Pay: ₹{formatINR(totalSelectedValue)}
              </span>
            </div>
          </div>
        )}

        {selectedProducts?.length > 0 && totalSelectedValue > 0 && (
          <div className="mt-5 flex justify-end">
            <Button onClick={handleCollectPayment}>Next</Button>
          </div>
        )}

        <Modal
          isOpen={nextClicked && !collectPayment}
          onClose={() => setNextClicked(false)}
          width="max-w-5xl"
        >
          <div>
            <PaymentEntries
              totalValue={totalReceivable || 0}
              amountToPay={totalSelectedValue || 0}
              selectedPatient={selectedCustomer || 0}
              companyId={parseInt(hasMultipleLocations[0])}
              items={items.filter((i) => selectedProducts.includes(i.Id))}
            />
          </div>
        </Modal>
        {collectPayment && (
          <div className="mt-5">
            <CollectAdvance
              totalValue={totalReceivable || 0}
              amountToPay={totalSelectedValue || 0}
              selectedPatient={selectedCustomer || 0}
              companyId={parseInt(hasMultipleLocations[0])}
              items={items}
              collectPayment={collectPayment}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPayment;
