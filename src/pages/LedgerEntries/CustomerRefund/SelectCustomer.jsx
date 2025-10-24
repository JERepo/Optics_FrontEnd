import React, { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCheck,
  FiEdit2,
  FiInfo,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router";
import { useGetAllCustomersQuery } from "../../../api/customerApi";
import { useGetCustomerContactDetailsQuery } from "../../../api/orderApi";
import { Table, TableCell, TableRow } from "../../../components/Table";
import Button from "../../../components/ui/Button";
import {
  useCreateCustomerRefundMutation,
  useLazyGetAdvanceDataQuery,
} from "../../../api/customerRefund";
import { useSelector } from "react-redux";
import Checkbox from "../../../components/Form/Checkbox";
import { format, isAfter, isBefore, startOfDay, subDays } from "date-fns";
import toast from "react-hot-toast";
import { formatINR } from "../../../utils/formatINR";
import { Autocomplete, TextField } from "@mui/material";
import { useGetAllBankMastersQuery } from "../../../api/bankMasterApi";
import { useGetAllBankAccountsQuery } from "../../../api/BankAccountDetailsApi";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Input from "../../../components/Form/Input";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import NewGV from "../../GiftVoucher/NewGV/NewGV";
import Modal from "../../../components/ui/Modal";
import { useCreateGiftVoucherForRefundMutation } from "../../../api/giftVoucher";

const methods = [
  { value: 1, type: "Cash" },
  { value: 4, type: "Cheque" },
  { value: 5, type: "Bank Transfer" },
  { value: 7, type: "Gift Voucher" },
];

const SelectCustomer = () => {
  // local state
  const navigate = useNavigate();
  const { user, hasMultipleLocations } = useSelector((state) => state.auth);
  const [input, setInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editMode, setEditMode] = useState({});
  const [advanceItems, setAdvanceItems] = useState([]);
  const [amountsSelected, setAmountsSelected] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [fullPaymentDetails, setFullPaymentDetails] = useState([]);
  const [newPayment, setNewPayment] = useState({
    Type: "",
    RefNo: "",
    PaymentMachine: "",
    PaymentMachineID: null,
    BankName: "",
    BankMasterID: null,
    ChequeDetails: "",
    ChequeDate: null,
    AccountNumber: "",
    BankAccountID: null,
    Amount: "",
    EMI: false,
    EMIMonths: null,
    EMIBank: null,
    GVCode: null,
    GVMasterID: null,
    GVData: null,
  });
  const [errors, setErrors] = useState({});
  const [remainingRefundAmt, setRemainingRefundAmt] = useState(0);
  const [collectGiftAmount, setCollectGiftAmount] = useState(false);

  const [filters, setFilters] = useState({
    name: "",
    mobileNo: "",
    customerName: "",
  });
  const hasSearchInput =
    input || filters.name || filters.mobileNo || filters.customerName;

  // API quaries
  const {
    data: customersResp,
    isLoading,
    isFetching,
  } = useGetAllCustomersQuery();

  const { data: contactResp, refetch: refetchPatient } =
    useGetCustomerContactDetailsQuery({
      companyId: parseInt(hasMultipleLocations[0]),
    });
  const [
    getAdvanceAmount,
    { data: advanceData, isFetching: isAdvanceFetching },
  ] = useLazyGetAdvanceDataQuery();
  const { data: allbanks } = useGetAllBankMastersQuery();
  const { data: bankAccountDetails } = useGetAllBankAccountsQuery();
  const [createRefund, { isLoading: isRefundCreating }] =
    useCreateCustomerRefundMutation();

  const [createGVForRefund, { isLoading: isGVRefundLoading }] =
    useCreateGiftVoucherForRefundMutation();
  //   data change on actions

  useEffect(() => {
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      advanceItems.forEach((item, index) => {
        const key = index;
        if (!newEditMode[key]) {
          newEditMode[key] = {
            refundAmount: false,
            originalPrice: item.refundAmount,
          };
        }
      });
      return newEditMode;
    });
  }, [advanceItems]);

  useEffect(() => {
    if (selectedPaymentMethod && remainingRefundAmt > 0) {
      setNewPayment((prev) => ({
        ...prev,
        Amount: Number(remainingRefundAmt.toFixed(2)),
      }));
    }
  }, [selectedPaymentMethod, remainingRefundAmt]);

  useEffect(() => {
    const totalPaid = fullPaymentDetails.reduce((sum, payment) => {
      const amt = parseFloat(payment.Amount);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    const initialRefund = advanceItems
      ?.filter((item) => selectedProducts.includes(item.Id))
      .reduce((sum, item) => sum + parseFloat(item.refundAmount || 0), 0);

    setRemainingRefundAmt(
      Number(Math.max(initialRefund - totalPaid, 0).toFixed(2))
    );
  }, [fullPaymentDetails, advanceItems, selectedProducts]);

  //   data manipulation
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

  const handleRefresh = () => {
    setInput("");
    setFilters({ name: "", mobileNo: "", customerName: "" });
    setCurrentPage(1);
  };

  const handleCustomerSelect = async (customerWithContact) => {
    setSelectedCustomer(customerWithContact);
    try {
      const res = await getAdvanceAmount({
        customerId: customerWithContact?.Id,
        companyId: parseInt(hasMultipleLocations[0]),
      }).unwrap();

      if (Array.isArray(res?.data?.advances)) {
        const updatedItems = res.data.advances.map((adv) => ({
          ...adv,
          refundAmount: adv.BalanceAmount,
        }));

        setAdvanceItems(updatedItems);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleProductSelection = (ad) => {
    setSelectedProducts((prev) => {
      if (prev.includes(ad)) {
        return prev.filter((id) => id !== ad);
      }
      return [...prev, ad];
    });
  };
  const toggleEditMode = (id, index, field, action = "toggle") => {
    setEditMode((prev) => {
      const key = index;
      const currentMode = prev[key]?.[field];
      const item = advanceItems.find((i, idx) => idx === index);

      if (field === "refundAmount" && !currentMode) {
        return {
          ...prev,
          [key]: {
            ...prev[key],
            [field]: !currentMode,
            originalPrice: item.refundAmount,
          },
        };
      }

      if (currentMode && action === "cancel") {
        if (field === "refundAmount") {
          setAdvanceItems((prevItems) =>
            prevItems.map((i, idx) =>
              idx === index
                ? { ...i, refundAmount: prev[key].originalPrice }
                : i
            )
          );
        }
      }

      return {
        ...prev,
        [key]: {
          ...prev[key],
          [field]: !currentMode,
          originalPrice: prev[key]?.originalPrice,
        },
      };
    });
  };
  const handleSellingPriceChange = (barcode, price, index) => {
    const item = advanceItems.find((i, idx) => idx === index);
    const newPrice = Number(price);

    if (newPrice > item.BalanceAmount) {
      toast.error("Refund Amount must not exceed Balance amount!");
      return;
    }

    setAdvanceItems((prev) =>
      prev.map((i, idx) =>
        idx === index ? { ...i, refundAmount: newPrice } : i
      )
    );
  };
  const handleDeletePayment = (index) => {
    setFullPaymentDetails((prev) => prev.filter((_, i) => i !== index));
    toast.success("Payment removed successfully!");
  };
  const handleSelectAllProducts = (e) => {
    if (e.target.checked) {
      const allOrderIds = advanceItems.map((order) => order.Id);
      setSelectedProducts(allOrderIds);
    } else {
      setSelectedProducts([]);
    }
  };
  console.log(fullPaymentDetails, selectedPaymentMethod,newPayment);
  const handleAddPayment = () => {
    const validationErrors = {};

    if (!selectedPaymentMethod)
      validationErrors.method = "Please select a payment method";
    if (!newPayment.Amount || isNaN(newPayment.Amount)) {
      validationErrors.amount = "Please enter a valid amount";
    } else if (
      Number(parseFloat(newPayment.Amount).toFixed(2)) >
      Number(parseFloat(remainingRefundAmt).toFixed(2))
    ) {
      validationErrors.amount = "Amount cannot exceed remaining balance";
    }
    if (Object.keys(validationErrors).length) {
  setErrors(validationErrors);
  toast.error("Please fill all required fields");
  return;
}
    const isDuplicatePayment = (conditionFn) => {
      return fullPaymentDetails.some(conditionFn);
    };

    switch (selectedPaymentMethod) {
      case 4:
        if (!newPayment.BankMasterID)
          validationErrors.bankName = "Please select a bank";
        if (!newPayment.ChequeDetails)
          validationErrors.chequeDetails = "Cheque number is required";
        if (!newPayment.ChequeDate) {
          validationErrors.chequeDate = "Cheque date is required";
        } else {
          const today = startOfDay(new Date());
          const minDate = subDays(today, 90);
          const selectedDate = startOfDay(new Date(newPayment.ChequeDate));

          if (isBefore(selectedDate, minDate)) {
            validationErrors.chequeDate =
              "Cheque date must be within the last 90 days or in the future";
          }
        }
        break;
      case 5:
        if (!newPayment.BankAccountID)
          validationErrors.accountNumber = "Please select an account";
        if (!newPayment.RefNo)
          validationErrors.refNo = "Reference number is required";
        break;
    }
    if (selectedPaymentMethod === 4) {
      const isChequeDuplicate = isDuplicatePayment(
        (payment) =>
          payment.BankMasterID === newPayment.BankMasterID &&
          payment.ChequeDetails?.trim().toLowerCase() ===
            newPayment.ChequeDetails?.trim().toLowerCase()
      );
      if (isChequeDuplicate) {
        toast.error("This cheque (bank + cheque number) already exists");
        return;
      }
    }

    if (selectedPaymentMethod === 5) {
      const isBankDuplicate = isDuplicatePayment(
        (payment) =>
          payment.BankAccountID === newPayment.BankAccountID &&
          payment.RefNo?.trim().toLowerCase() ===
            newPayment.RefNo?.trim().toLowerCase()
      );
      if (isBankDuplicate) {
        toast.error("This bank transfer (account + reference) already exists");
        return;
      }
    }
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      toast.error("Please fill all required fields");
      return;
    }

    setFullPaymentDetails((prev) => [...prev, newPayment]);
    // setRemainingRefundAmt(
    //   (prev) => parseFloat(prev) - parseFloat(newPayment.Amount || 0)
    // );
    setNewPayment({
      Type: "",
      RefNo: "",
      PaymentMachine: "",
      PaymentMachineID: null,
      BankName: "",
      BankMasterID: null,
      ChequeDetails: "",
      ChequeDate: null,
      AccountNumber: "",
      BankAccountID: null,
      Amount: "",
      EMI: false,
      EMIMonths: null,
      EMIBank: null,
    });
    setSelectedPaymentMethod(null);
    setErrors({});
    toast.success("Payment added successfully!");
  };
  const handleAddGiftAmount = (data) => {
    setCollectGiftAmount(false);
    if (data?.submit) {
      const { submit, ...restData } = data;
      setFullPaymentDetails((prev) => [
        ...prev,
        {
          Type: selectedPaymentMethod.type || "Gift Voucher",
          Amount: data.amount,
          GVCode: data.GVCode,
          GVData: restData,
        },
      ]);
    }
    setSelectedPaymentMethod(null);
  };
  const preparePaymentsStructure = (updatedPayments) => {
    const payments = {};

    const normalizeType = (type) => {
      switch (type.toLowerCase()) {
        case "bank transfer":
          return "bank";
        case "cheque":
          return "cheque";
        case "upi":
          return "upi";
        case "card":
          return "card";
        case "cash":
          return "cash";
        case "advance":
          return "advance";
        case "gift voucher":
          return "giftVoucher";
        default:
          return type.toLowerCase();
      }
    };

    updatedPayments.forEach((payment) => {
      const typeKey = normalizeType(payment.Type || "");
      const amount = parseFloat(payment.Amount);
      if (isNaN(amount)) return;

      if (typeKey === "cash") {
        payments.cash = (payments.cash || 0) + amount;
        return;
      }

      if (typeKey === "giftVoucher") {
        payments.giftVoucher = {
          amount,
          GVMasterID: payment.GVMasterID ?? null,
        };
        return;
      }

      if (!payments[typeKey]) payments[typeKey] = [];

      const entry = { amount };

      switch (typeKey) {
        case "card":
          entry.PaymentMachineID = payment.PaymentMachineID;
          entry.ApprCode = payment.RefNo;
          if (payment.EMI) {
            entry.EMI = payment.EMI;
            entry.EMIMonths = parseInt(payment.EMIMonths);
            entry.EMIBank = payment.EMIBank;
          }
          break;

        case "upi":
          entry.PaymentMachineID = payment.PaymentMachineID;
          entry.ReferenceNo = payment.RefNo || "";
          break;

        case "cheque":
          entry.BankMasterID = payment.BankMasterID;
          entry.ChequeNo = payment.ChequeDetails;
          entry.ChequeDate = payment.ChequeDate
            ? format(new Date(payment.ChequeDate), "yyyy-MM-dd")
            : null;
          break;

        case "bank":
          entry.BankAccountID = payment.BankAccountID || null;
          entry.ReferenceNo = payment.RefNo || "";
          break;

        case "advance":
          entry.advanceId = payment.advanceId;
          break;
      }

      payments[typeKey].push(entry);
    });

    return payments;
  };

  const handleCreateRefund = async () => {
    if (remainingRefundAmt > 0) {
      toast.error("Please cover the remaining balance before saving.");
      return;
    }

    if (fullPaymentDetails.length === 0 && remainingRefundAmt > 0) {
      toast.error("Please add at least one payment method.");
      return;
    }

    try {
      let updatedPayments = [...fullPaymentDetails];
      const gvDetails = fullPaymentDetails
        .filter((item) => item.Type === "Gift Voucher")
        .map((item, index) => ({ ...item.GVData, index, GVCode: item.GVCode }));

      if (gvDetails.length > 0) {
        for (const gv of gvDetails) {
          try {
            const res = await createGVForRefund({
              payload: { ...gv, customerId: selectedCustomer?.Id },
            }).unwrap();

            updatedPayments = updatedPayments.map((p) =>
              p.GVCode == gv.GVCode
                ? { ...p, GVMasterID: res?.data?.ID ?? null }
                : p
            );
          } catch (error) {
            console.error("GV creation failed", error);
            toast.error(
              error?.data?.message ||
                error?.data.error ||
                "Failed to create Gift Voucher"
            );
            return;
          }
        }

        // Update state after the loop
        setFullPaymentDetails(updatedPayments);
      }

      const payload = {
        customerId: selectedCustomer?.Id,
        companyId: parseInt(hasMultipleLocations[0]),
        advanceId: advanceItems
          ?.filter((item) => selectedProducts.includes(item.Id))
          .map((item) => ({
            id: item.Id,
            amount: parseFloat(item.refundAmount),
          })),
        applicationUserId: user.Id,
        remarks: "",
        payments: {
          totalAmount: -advanceItems
            ?.filter((item) => selectedProducts.includes(item.Id))
            .reduce((sum, item) => sum + parseFloat(item.refundAmount || 0), 0),
          ...preparePaymentsStructure(updatedPayments), // Use updatedPayments directly
        },
      };
      console.log("payload", payload);

      await createRefund({ payload }).unwrap();
      toast.success("Customer refund successfully generated!");
      navigate("/customer-refund");
    } catch (error) {
      console.error("Refund error", error);
      toast.error(
        error?.data?.error ||
          error?.error ||
          "Something went wrong while generating Customer refund!"
      );
    }
  };

  const filteredBankAccounts = bankAccountDetails?.data.data.filter(
    (b) =>
      b.IsActive === 1 &&
      b.LinkedCompanies.some((link) =>
        hasMultipleLocations.includes(link.CompanyID)
      )
  );

  return (
    <div>
      <div className="max-w-8xl p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        {!selectedCustomer && (
          <div>
            <div className="mb-6 pb-4 border-b border-gray-200">
              <span className="text-lg font-medium text-gray-800">
                Select Patient
              </span>
            </div>

            {/* Content Title */}
            <div className="text-xl font-semibold text-gray-800 mb-5">
              Patient Information
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
                  onClick={() => navigate("/customer-refund")}
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
                    "Patient name",
                    "Patient Mobile no",
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
        {selectedCustomer && !amountsSelected && (
          <div>
            <div>
              <div className=" pb-4 flex justify-end">
                {/* <span className="text-xl font-medium text-gray-800">
                  Total Advance Amount: ₹{" "}
                  {formatINR(
                    advanceItems.reduce(
                      (sum, item) => sum + parseFloat(item.AdvanceAmount || 0),
                      0
                    )
                  )}
                </span> */}
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setSelectedProducts([]);
                  }}
                >
                  Back
                </Button>
              </div>
              <div>
                <Table
                  columns={[
                    "#",
                    "date",
                    "remark",
                    "document no",
                    "advance amount",
                    "balance amount",
                    "refund amount",
                  ]}
                  data={advanceItems || []}
                  renderHeader={(column) => {
                    if (column == "#") {
                      const allSelected =
                        advanceItems?.length > 0 &&
                        selectedProducts.length === advanceItems.length;
                      return (
                        <div className="flex items-center gap-1">
                          {column}
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={handleSelectAllProducts}
                            className="h-3 w-3"
                          />
                        </div>
                      );
                    }
                    return <>{column}</>;
                  }}
                  renderRow={(item, index) => (
                    <TableRow key={item.Id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          type="checkbox"
                          className="h-5 w-5"
                          onChange={() => handleProductSelection(item.Id)}
                          checked={selectedProducts.includes(item.Id)}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        {item.AdvanceDate &&
                          format(new Date(item.AdvanceDate), "dd/MM/yyy")}
                      </TableCell>
                      <TableCell>{item.Remarks}</TableCell>
                      <TableCell>{item.ReferenceDetails}</TableCell>
                      <TableCell> ₹{formatINR(item.AdvanceAmount)}</TableCell>
                      <TableCell> ₹{formatINR(item.BalanceAmount)}</TableCell>
                      <TableCell>
                        {editMode[index]?.refundAmount ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={item.refundAmount || ""}
                              onChange={(e) =>
                                handleSellingPriceChange(
                                  null,
                                  e.target.value,
                                  index
                                )
                              }
                              className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                              placeholder="Enter price"
                            />
                            <button
                              onClick={() =>
                                toggleEditMode(
                                  null,
                                  index,
                                  "refundAmount",
                                  "save"
                                )
                              }
                              className="text-neutral-400 transition"
                              title="Save"
                            >
                              <FiCheck size={18} />
                            </button>
                            <button
                              onClick={() =>
                                toggleEditMode(
                                  null,
                                  index,
                                  "refundAmount",
                                  "cancel"
                                )
                              }
                              className="text-neutral-400 transition"
                              title="Cancel"
                            >
                              <FiX size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            ₹{formatINR(item.refundAmount)}
                            <button
                              onClick={() =>
                                toggleEditMode(null, index, "refundAmount")
                              }
                              className="text-neutral-400 transition"
                              title="Edit Refund amount"
                            >
                              <FiEdit2 size={14} />
                            </button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                  emptyMessage={
                    isAdvanceFetching ? "Loading" : "No advance data available"
                  }
                />
                {selectedProducts?.length > 0 && (
                  <div className="mt-5 flex justify-end">
                    <Button
                      onClick={() => {
                        const totalRefund = advanceItems
                          ?.filter((item) => selectedProducts.includes(item.Id))
                          .reduce(
                            (sum, item) =>
                              sum + parseFloat(item.refundAmount || 0),
                            0
                          );

                        setRemainingRefundAmt(totalRefund);
                        setAmountsSelected(true);
                      }}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {amountsSelected && (
          <div>
            <div className=" pb-4 flex justify-between">
              <span className="text-xl font-medium text-gray-800">
                Total Refund Amount Remaining
                {selectedProducts?.length > 0 && ":₹"}
                {formatINR(remainingRefundAmt)}
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  setAmountsSelected(false);
                  setFullPaymentDetails([]);
                }}
              >
                Back
              </Button>
            </div>

            {/* Payment Entries */}
            {fullPaymentDetails?.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  Payment Entries
                </h2>
                <div className="rounded-lg">
                  <Table
                    columns={[
                      "Type",
                      "Amount",
                      "Ref No",
                      "GV Code",
                      "Bank Name",
                      "Cheque Details",
                      "Account Number",
                      "Action",
                    ]}
                    data={fullPaymentDetails}
                    renderRow={(item, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell>{item.Type}</TableCell>
                        <TableCell className="font-medium">
                          ₹
                          {Number(item.Amount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>{item.RefNo || "-"}</TableCell>
                        <TableCell>{item.GVCode || "-"}</TableCell>
                        <TableCell>{item.BankName || "-"}</TableCell>
                        <TableCell>
                          {item.ChequeDetails ? (
                            <>
                              {item.ChequeDetails}
                              <br />
                              Cheque Date:{" "}
                              {item.ChequeDate
                                ? format(
                                    new Date(item.ChequeDate),
                                    "dd-MM-yyyy"
                                  )
                                : "-"}
                            </>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{item.AccountNumber || "-"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            onClick={() => handleDeletePayment(index)}
                            className="text-red-500 hover:text-red-700"
                            icon={FiTrash2}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  />
                </div>
              </div>
            )}
            {/* Add Payment Method */}
            <div className="mt-8">
              {!parseFloat(remainingRefundAmt) <= 0 && (
                <>
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="text-lg text-neutral-700 font-medium">
                      Choose Payment Method
                    </div>
                    <div className="w-full md:w-1/3">
                      <Autocomplete
                        options={methods}
                        getOptionLabel={(option) => option.type}
                        value={
                          methods.find(
                            (p) => p.value == selectedPaymentMethod
                          ) || null
                        }
                        onChange={(_, newValue) => {
                          if (newValue?.value === 7) {
                            const g = fullPaymentDetails?.find(
                              (item) => item.GVData
                            );
                            if (g) {
                              toast.error(
                                "Gift Voucher can be added only once!"
                              );
                              return;
                            }
                            setCollectGiftAmount(true);
                          }
                          setSelectedPaymentMethod(newValue?.value || null);
                          setNewPayment((prev) => ({
                            ...prev,
                            Type: newValue?.type || "",
                            RefNo: "",
                            PaymentMachine: "",
                            PaymentMachineID: null,
                            BankName: "",
                            BankMasterID: null,
                            ChequeDetails: "",
                            ChequeDate: null,
                            AccountNumber: "",
                            BankAccountID: null,
                            Amount: "",
                            EMI: false,
                            EMIMonths: null,
                            EMIBank: null,
                            GVCode: null,
                            GVMasterID: null,
                            GVData: null,
                          }));
                          setErrors({});
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Select Payment method"
                            size="small"
                            error={!!errors.method}
                            helperText={errors.method}
                          />
                        )}
                        fullWidth
                      />
                    </div>
                  </div>
                </>
              )}
              {/* Method-Specific Forms */}
              {remainingRefundAmt > 0 && (
                <MethodForm
                  method={selectedPaymentMethod}
                  newPayment={newPayment}
                  setNewPayment={setNewPayment}
                  errors={errors}
                  setErrors={setErrors}
                  banks={allbanks?.data.data || []}
                  accounts={filteredBankAccounts}
                  collectGiftAmount={collectGiftAmount}
                  handleAddGiftAmount={handleAddGiftAmount}
                  remainingRefundAmt={remainingRefundAmt}
                />
              )}
              {remainingRefundAmt > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleAddPayment}
                    className="flex items-center gap-2"
                  >
                    <FiPlus /> Add Payment
                  </Button>
                </div>
              )}

              {remainingRefundAmt <= 0 && fullPaymentDetails.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button
                    className="flex items-center gap-2"
                    onClick={handleCreateRefund}
                    isLoading={isRefundCreating}
                    disabled={isRefundCreating}
                  >
                    Complete Customer Refund
                  </Button>
                </div>
              )}

              {remainingRefundAmt > 0 && fullPaymentDetails.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                  <FiInfo className="text-yellow-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-800">
                      Outstanding Balance
                    </p>
                    <p className="text-yellow-700">
                      There's still ₹
                      {remainingRefundAmt.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      remaining. Please add another payment method.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectCustomer;

const MethodForm = ({
  method,
  newPayment,
  setNewPayment,
  errors,
  setErrors,
  banks,
  accounts,
  collectGiftAmount,
  handleAddGiftAmount,
  remainingRefundAmt,
}) => {
  if (!method) return null;

  const handleInputChange = (key) => (e) =>
    setNewPayment((prev) => ({ ...prev, [key]: e.target.value }));

  const commonAmountInput = (
    <Input
      label="Amount *"
      type="number"
      value={newPayment.Amount}
      onChange={handleInputChange("Amount")}
      error={errors.amount}
    />
  );

  const uniqueAccounts = useMemo(() => {
    return Array.from(
      new Map(accounts?.map((item) => [item.AccountNo, item])).values()
    );
  }, [accounts]);

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {method === 1 && commonAmountInput}

        {method === 4 && (
          <>
            <Autocomplete
              options={banks}
              getOptionLabel={(option) => option.BankName || ""}
              value={
                banks.find((b) => b.Id === newPayment.BankMasterID) || null
              }
              onChange={(_, newValue) => {
                setNewPayment((prev) => ({
                  ...prev,
                  BankName: newValue?.BankName || "",
                  BankMasterID: newValue?.Id || null,
                }));
                setErrors((prev) => ({ ...prev, bankName: "" }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Bank *"
                  size="small"
                  error={!!errors.bankName}
                  helperText={errors.bankName}
                />
              )}
              fullWidth
            />
            <Input
              label="Cheque Number *"
              value={newPayment.ChequeDetails}
              onChange={(e) =>
                setNewPayment((prev) => ({
                  ...prev,
                  ChequeDetails: e.target.value,
                }))
              }
              error={errors.chequeDetails}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Cheque Date *"
                value={newPayment.ChequeDate}
                onChange={(date) => {
                  const today = startOfDay(new Date());
                  const minDate = subDays(today, 90);

                  if (date && isBefore(date, minDate)) {
                    setErrors((prev) => ({
                      ...prev,
                      chequeDate:
                        "Cheque date must be within the last 90 days or in the future",
                    }));
                  } else {
                    setErrors((prev) => ({ ...prev, chequeDate: "" }));
                    setNewPayment((prev) => ({
                      ...prev,
                      ChequeDate: date,
                    }));
                  }
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    error: !!errors.chequeDate,
                    helperText: errors.chequeDate,
                  },
                }}
                minDate={subDays(new Date(), 90)}
              />
            </LocalizationProvider>
            {commonAmountInput}
          </>
        )}

        {method === 5 && (
          <>
            <Autocomplete
              options={uniqueAccounts}
              getOptionLabel={(option) =>
                option?.Bank?.BankName && option?.AccountNo
                  ? `${option.Bank.BankName} (${option.AccountNo})`
                  : ""
              }
              value={
                accounts?.find((acc) => acc.Id === newPayment.BankAccountID) ||
                null
              }
              onChange={(_, newValue) => {
                setNewPayment((prev) => ({
                  ...prev,
                  AccountNumber: newValue?.AccountNo || "",
                  BankName: newValue?.Bank?.BankName || "",
                  BankAccountID: newValue?.Id || null,
                }));
                setErrors((prev) => ({ ...prev, accountNumber: "" }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Account Number *"
                  size="small"
                  error={!!errors.accountNumber}
                  helperText={errors.accountNumber}
                />
              )}
              fullWidth
            />
            <Input
              label="Reference Number *"
              value={newPayment.RefNo}
              onChange={handleInputChange("RefNo")}
              error={errors.refNo}
            />
            {commonAmountInput}
          </>
        )}
        {method === 7 && (
          <Modal
            isOpen={collectGiftAmount}
            onClose={handleAddGiftAmount}
            width="max-w-4xl"
          >
            <NewGV
              collectGiftAmount={collectGiftAmount}
              handleAddGiftAmount={handleAddGiftAmount}
              remainingRefundAmt={remainingRefundAmt}
            />
          </Modal>
        )}
      </div>
    </div>
  );
};
