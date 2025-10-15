import React, { useState, useMemo, useEffect } from "react";
import { useOrder } from "../../../features/OrderContext";
import {
  FiArrowLeft,
  FiTrash2,
  FiPlus,
  FiInfo,
  FiSave,
  FiCheck,
  FiX,
  FiEdit2,
} from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { Autocomplete, TextField } from "@mui/material";
import Input from "../../../components/Form/Input";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { useGetAllPaymentMachinesQuery } from "../../../api/paymentMachineApi";
import { useSelector } from "react-redux";
import { useGetAllBankMastersQuery } from "../../../api/bankMasterApi";
import { useGetAllBankAccountsQuery } from "../../../api/BankAccountDetailsApi";
import { toast } from "react-hot-toast";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { isBefore, isAfter, subDays, startOfDay, format } from "date-fns";

import { useNavigate } from "react-router";
import { formatINR } from "../../../utils/formatINR";
import Textarea from "../../../components/Form/Textarea";
import Checkbox from "../../../components/Form/Checkbox";
import {
  useGetPODetailsQuery,
  useSaveAdvanceAmountMutation,
} from "../../../api/vendorPayment";

const methods = [
  { value: 1, type: "Cash" },
  // { value: 2, type: "Card" },
  // { value: 3, type: "UPI" },
  { value: 4, type: "Cheque" },
  { value: 5, type: "Bank Transfer" },
];

const VendorCollectPOAdvace = ({
  totalValue,
  amountToPay,
  selectedPatient,
  companyId,
  collectPayment,
  againstPO,
}) => {
  const navigate = useNavigate();
  const {
    goToStep,
    currentStep,
    paymentDetails,
    fullPayments,
    setFullPayments,
  } = useOrder();

  const { hasMultipleLocations, user } = useSelector((state) => state.auth);
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
  });
  const [errors, setErrors] = useState({});
  const [advanceRefceNo, setAdvanceRefNo] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editMode, setEditMode] = useState({});
  const [items, setItems] = useState([]);
  const [againstPONext, setAgainstPONext] = useState(false);

  const { data: paymentMachine } = useGetAllPaymentMachinesQuery();
  const { data: allbanks } = useGetAllBankMastersQuery();
  const { data: bankAccountDetails } = useGetAllBankAccountsQuery();
  const [saveFinalPayment, { isLoading: isFinalSaving }] =
    useSaveAdvanceAmountMutation();
  const { data: poDetails } = useGetPODetailsQuery(
    {
      vendorId: selectedPatient?.Id,
      companyId: parseInt(hasMultipleLocations[0]),
    },
    { skip: !selectedPatient || !againstPO }
  );
  const updatedDetails = useMemo(() => {
    const total = totalValue || 0;
    const advance = amountToPay || 0;

    const poAdvance = againstPONext
      ? items
          .filter((it) => selectedProducts.includes(it.Id))
          .reduce((sum, it) => sum + parseFloat(it.AmountToPay || 0), 0)
      : 0;

    const totalPaid = fullPaymentDetails.reduce(
      (sum, p) => sum + parseFloat(p.Amount || 0),
      0
    );

    const remainingToPay = Number(
      Math.max(poAdvance - totalPaid, 0).toFixed(2)
    );

    return {
      TotalAmount: total,
      AdvanceAmount: advance,
      BalanceAmount: total - advance,
      RemainingToPay: remainingToPay,
      // expose the raw poAdvance for debugging / future use
      PoAdvance: poAdvance,
    };
  }, [
    totalValue,
    amountToPay,
    againstPONext,
    items, // <-- added
    selectedProducts, // <-- added
    fullPaymentDetails, // <-- keep
  ]);
  const filteredCardPaymentMachines = paymentMachine?.data.data.filter(
    (p) =>
      p.MachineType === 0 &&
      p.IsActive === 1 &&
      p.CompanyLinks?.some((link) =>
        hasMultipleLocations.includes(link.CompanyID)
      )
  );
  const filteredUpiPaymentMachines = paymentMachine?.data.data.filter(
    (p) =>
      p.MachineType === 1 &&
      p.IsActive === 1 &&
      p.CompanyLinks?.some((link) =>
        hasMultipleLocations.includes(link.CompanyID)
      )
  );

  const filteredBankAccounts = bankAccountDetails?.data.data.filter(
    (b) =>
      b.IsActive === 1 &&
      b.LinkedCompanies.some((link) =>
        hasMultipleLocations.includes(link.CompanyID)
      )
  );
  const handleSelectAllProducts = (e) => {
    if (e.target.checked) {
      const allOrderIds = items.map((order) => order.Id);
      setSelectedProducts(allOrderIds);
    } else {
      setSelectedProducts([]);
    }
  };
  const handleProductSelection = (order) => {
    setSelectedProducts((prev) => {
      if (prev.includes(order.Id)) {
        return prev.filter((Id) => Id !== order.Id);
      }
      return [...prev, order.Id];
    });
  };
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
  useEffect(() => {
    if (againstPO && poDetails?.data) {
      const formattedItems = poDetails.data.map((item) => ({
        ...item,
        TotalAmount: parseFloat(item.TotalAmount),
        AmountDue: parseFloat(item.AmountDue),
        AmountToPay: parseFloat(item.AmountToPay),
      }));
      setItems(formattedItems);
    }
  }, [poDetails, againstPO]);
  useEffect(() => {
    if (selectedPaymentMethod && updatedDetails.RemainingToPay > 0) {
      setNewPayment((prev) => ({
        ...prev,
        Amount: Number(updatedDetails.RemainingToPay.toFixed(2)),
      }));
    }
  }, [selectedPaymentMethod, updatedDetails.RemainingToPay]);
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
    if (item.AmountDue > 0) {
      if (newPrice > item.AmountDue) {
        toast.error("Amount to Pay cannot exceed Amount Due!");
        return;
      }
      if (newPrice < 0) {
        toast.error("Amount to Pay cannot be negative!");
        return;
      }
    }

    // Case 2: Negative due (refund/credit)
    if (item.AmountDue < 0) {
      if (newPrice > 0) {
        toast.error("Refund amount cannot be greater than 0!");
        return;
      }
      if (newPrice < item.AmountDue) {
        toast.error(`Refund amount cannot be less than ${item.AmountDue}`);
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
  const preparePaymentsStructure = () => {
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
        default:
          return type.toLowerCase();
      }
    };

    fullPaymentDetails.forEach((payment) => {
      const typeKey = normalizeType(payment.Type || "");
      const amount = parseFloat(payment.Amount);
      if (isNaN(amount)) return;

      if (typeKey === "cash") {
        payments.cash = (payments.cash || 0) + amount;
        return;
      }

      if (!payments[typeKey]) {
        payments[typeKey] = { amount: 0 };
      }

      payments[typeKey].amount += amount;

      switch (typeKey) {
        case "card":
          payments[typeKey].PaymentMachineID = payment.PaymentMachineID;
          payments[typeKey].ApprCode = payment.RefNo;
          if (payment.EMI) {
            payments[typeKey].EMI = payment.EMI;
            payments[typeKey].EMIMonths = parseInt(payment.EMIMonths);
            payments[typeKey].EMIBank = payment.EMIBank;
          }
          break;
        case "upi":
          payments[typeKey].PaymentMachineID = payment.PaymentMachineID;
          break;
        case "cheque":
          payments[typeKey].BankMasterID = payment.BankMasterID;
          payments[typeKey].ChequeNo = payment.ChequeDetails;
          payments[typeKey].ChequeDate = payment.ChequeDate
            ? format(new Date(payment.ChequeDate), "yyyy-MM-dd")
            : null;
          break;
        case "bank":
          payments[typeKey].BankAccountID = payment.BankAccountID || null;
          payments[typeKey].ReferenceNo = payment.RefNo || "";
          break;
      }
    });

    return payments;
  };
  const handleSave = async () => {
    if (
      selectedPatient?.CreditBilling === 0 &&
      (!advanceRefceNo || advanceRefceNo.trim() === "")
    ) {
      toast.error("Please enter advance reference no!");
      return;
    }
    if (
      selectedPatient?.CreditBilling === 0 &&
      (!remarks || remarks.trim() === "")
    ) {
      toast.error("Please enter advance remarks!");
      return;
    }

    const finalStructure = {
      companyId: parseInt(hasMultipleLocations[0]),
      CreatedBy: user.Id,
      vendorId: selectedPatient?.Id,
      poIds: selectedProducts,
      advanceAmount: fullPaymentDetails.reduce(
        (sum, item) => sum + parseFloat(item.Amount),
        0
      ),
      payments: preparePaymentsStructure(),
      refdetail: advanceRefceNo || "",
      remarks: remarks,
      creditBilling: parseInt(selectedPatient?.CreditBilling),
      againstPO: againstPO,
    };

    try {
      await saveFinalPayment({ payload: finalStructure }).unwrap();
      toast.success("Advance taken Successfully");
      navigate("/customer-payment");
    } catch (error) {
      toast.error("Please try again!");
    }
  };
  const handleAddPayment = () => {
    const validationErrors = {};

    if (!selectedPaymentMethod)
      validationErrors.method = "Please select a payment method";
    if (!newPayment.Amount || isNaN(newPayment.Amount)) {
      validationErrors.amount = "Please enter a valid amount";
    } else if (
      !collectPayment &&
      Number(parseFloat(newPayment.Amount).toFixed(2)) >
        Number(parseFloat(updatedDetails.RemainingToPay).toFixed(2))
    ) {
      validationErrors.amount = "Amount cannot exceed remaining balance";
    }

    switch (selectedPaymentMethod) {
      case 2:
        if (!newPayment.PaymentMachineID)
          validationErrors.paymentMachine = "Please select a payment machine";
        if (!newPayment.RefNo)
          validationErrors.refNo = "Approval code is required";
        break;
      case 3:
        if (!newPayment.PaymentMachineID)
          validationErrors.paymentMachine = "Please select a payment machine";
        break;
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

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      toast.error("Please fill all required fields");
      return;
    }

    setFullPaymentDetails((prev) => [...prev, newPayment]);
    setFullPayments((prev) => [...prev, newPayment]);
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
  const handleDeletePayment = (index) => {
    setFullPaymentDetails((prev) => prev.filter((_, i) => i !== index));
    toast.success("Payment removed successfully!");
  };
  const totalReceivable = items.reduce((sum, item) => {
    if (selectedProducts.includes(item.Id)) {
      const amount = item.AmountDue;
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
    <div className="">
      <div className="max-w-8xl">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            {againstPO && (
              <Table
                className="mt-5"
                columns={[
                  "#",
                  "doc no",
                  "doc date",
                  "total amount",
                  "amount due",
                  "amount to pay",
                ]}
                data={items || []}
                renderHeader={(column) => {
                  if (column === "#") {
                    const allSelected =
                      items?.length > 0 &&
                      selectedProducts.length === items.length;
                    return (
                      <div className="flex items-center gap-1">
                        {column}
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={handleSelectAllProducts}
                          className="h-3 w-3"
                          disabled={againstPONext}
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
                        disabled={againstPONext}
                      />
                    </TableCell>
                    <TableCell>{item.DocNo}</TableCell>
                    <TableCell>
                      {format(new Date(item.DocDate), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>₹{item.TotalAmount}</TableCell>
                    <TableCell>₹{formatINR(item.AmountDue)}</TableCell>
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
                  </TableRow>
                )}
              />
            )}
            {items.length > 0 && againstPO && (
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

            <div className="flex justify-end mt-5">
              <Button onClick={() => setAgainstPONext(true)}>Next</Button>
            </div>

            {againstPONext && (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Payment Summary
                  </h1>
                  <p className="text-gray-500 mt-1">
                    Review your payment details
                  </p>
                </div>
              </div>
            )}

            {/* Summary Cards - Only show if collectPayment is false */}
            {againstPONext && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-gray-500 text-sm font-medium capitalize">
                    Remaining Amount To Pay
                  </div>
                  <div className="text-2xl font-semibold mt-2 text-neutral-700">
                    ₹{formatINR(updatedDetails.RemainingToPay)}
                  </div>
                </div>
              </div>
            )}

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
                      "Payment Machine",
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
                        <TableCell>{item.PaymentMachine || "-"}</TableCell>
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
            {againstPONext && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <FiPlus className="text-blue-500" />
                  Add Payment Method
                </h2>

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
                          (p) => p.value === selectedPaymentMethod
                        ) || null
                      }
                      onChange={(_, newValue) => {
                        setSelectedPaymentMethod(newValue?.value || null);
                        setNewPayment((prev) => ({
                          ...prev,
                          Type: newValue?.type || "",
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

                {/* Method-Specific Forms */}
                <MethodForm
                  method={selectedPaymentMethod}
                  newPayment={newPayment}
                  setNewPayment={setNewPayment}
                  errors={errors}
                  setErrors={setErrors}
                  cardMachines={filteredCardPaymentMachines}
                  UPIMachine={filteredUpiPaymentMachines}
                  banks={allbanks?.data.data || []}
                  accounts={filteredBankAccounts}
                />

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleAddPayment}
                    className="flex items-center gap-2"
                  >
                    <FiPlus /> Add Payment
                  </Button>
                </div>

                {!collectPayment &&
                  updatedDetails.RemainingToPay > 0 &&
                  fullPaymentDetails.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                      <FiInfo className="text-yellow-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-yellow-800">
                          Outstanding Balance
                        </p>
                        <p className="text-yellow-700">
                          There's still ₹
                          {updatedDetails.RemainingToPay.toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                            }
                          )}{" "}
                          remaining. Please add another payment method.
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-5 w-full">
              <Textarea
                label="Advance Reference No *"
                value={advanceRefceNo || ""}
                onChange={(e) => setAdvanceRefNo(e.target.value)}
              />
              <Textarea
                label="Advance Remarks *"
                value={remarks || ""}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            {fullPaymentDetails.length > 0 && (
              <div className="mt-4 flex justify-end">
                <Button
                  isLoading={isFinalSaving}
                  disabled={isFinalSaving}
                  onClick={handleSave}
                  className="flex items-center gap-2"
                >
                  Complete Vendor Payment
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MethodForm = ({
  method,
  newPayment,
  setNewPayment,
  errors,
  setErrors,
  UPIMachine,
  cardMachines,
  banks,
  accounts,
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
      new Map(accounts?.map((item) => [item.AccountNumber, item])).values()
    );
  }, [accounts]);

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {method === 1 && commonAmountInput}

        {method === 3 && (
          <>
            <Autocomplete
              options={UPIMachine || []}
              getOptionLabel={(option) => option.MachineName || ""}
              value={
                UPIMachine?.find((p) => p.Id === newPayment.PaymentMachineID) ||
                null
              }
              onChange={(_, newValue) => {
                setNewPayment((prev) => ({
                  ...prev,
                  PaymentMachine: newValue?.MachineName || "",
                  PaymentMachineID: newValue?.Id || null,
                }));
                setErrors((prev) => ({ ...prev, paymentMachine: "" }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Payment Machine *"
                  size="small"
                  error={!!errors.paymentMachine}
                  helperText={errors.paymentMachine}
                />
              )}
              fullWidth
            />
            {commonAmountInput}
          </>
        )}

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
      </div>
    </div>
  );
};

export default VendorCollectPOAdvace;
