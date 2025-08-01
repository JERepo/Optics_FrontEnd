import React, { useState, useEffect, useMemo } from "react";
import { useOrder } from "../../../features/OrderContext";
import { FiArrowLeft, FiTrash2, FiPlus, FiInfo, FiSave } from "react-icons/fi";
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
import { useSaveFinalPaymentMutation } from "../../../api/orderApi";
import { useNavigate } from "react-router";

const methods = [
  { value: 1, type: "Cash" },
  { value: 2, type: "Card" },
  { value: 3, type: "UPI" },
  { value: 4, type: "Cheque" },
  { value: 5, type: "Bank Transfer" },
  { value: 6, type: "Advance" },
];

const PaymentFlow = () => {
  const navigate = useNavigate();
  const { goToStep, currentStep, paymentDetails, customerId } = useOrder();
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

  const updatedDetails = useMemo(() => {
    const total = paymentDetails?.TotalValue || 0;
    const advance = paymentDetails?.totalAdvance || 0;

    const totalPaid = fullPaymentDetails.reduce((sum, payment) => {
      const amt = parseFloat(payment.Amount);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    const remainingToPay = Math.max(advance - totalPaid, 0);

    return {
      TotalAmount: total,
      AdvanceAmount: advance,
      BalanceAmount: total - advance,
      RemainingToPay: remainingToPay,
    };
  }, [paymentDetails, fullPaymentDetails]);

  console.log("up", updatedDetails);

  const { data: paymentMachine } = useGetAllPaymentMachinesQuery();
  const { data: allbanks } = useGetAllBankMastersQuery();
  const { data: bankAccountDetails } = useGetAllBankAccountsQuery();
  const [saveFinalPayment, { isLoading, isFinalSaving }] =
    useSaveFinalPaymentMutation();

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

  useEffect(() => {
    if (selectedPaymentMethod && updatedDetails.RemainingToPay > 0) {
      setNewPayment((prev) => ({
        ...prev,
        Amount: updatedDetails.RemainingToPay.toString(),
      }));
    }
  }, [selectedPaymentMethod, updatedDetails.RemainingToPay]);

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
        case "advance":
          return "advance";
        default:
          return type.toLowerCase();
      }
    };

    fullPaymentDetails.forEach((payment) => {
      const typeKey = normalizeType(payment.Type || "");
      const amount = parseFloat(payment.Amount);
      if (isNaN(amount)) return;

      if (typeKey === "cash") {
        // Cash should be a single numeric value
        payments.cash = (payments.cash || 0) + amount;
        return;
      }

      // Initialize only if not cash
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
        case "advance":
          payments[typeKey].CustomerAdvanceIDs =
            payment.CustomerAdvanceIDs || [];
          break;
      }
    });

    return payments;
  };

  const handleSave = async () => {
    if (updatedDetails.RemainingToPay > 0) {
      toast.error("Please cover the remaining balance before saving.");
      return;
    }

    if (fullPaymentDetails.length === 0 && updatedDetails.TotalAmount > 0) {
      toast.error("Please add at least one payment method.");
      return;
    }

    const finalStructure = {
      CompanyID: customerId.locationId,
      CreatedBy: user.Id,
      totalQty: paymentDetails.TotalQty,
      totalGST: paymentDetails.TotalGSTValue,
      totalValue: updatedDetails.TotalAmount,

      AdvanceAmount: Object.entries(paymentDetails.advancedAmounts).map(
        ([key, value]) => ({
          detailid: Number(key),
          Amount: Number(value),
        })
      ),

      payments: preparePaymentsStructure(),
    };

    console.log("Final saving structure:", finalStructure);

    try {
      await saveFinalPayment({
        orderId: customerId.orderId,
        payload: finalStructure,
      }).unwrap();
      toast.success("Payment created successfully");
      navigate("/order-list");
    } catch (error) {
      console.log("error");
      toast.error("Please try again!");
    }
  };

  const handleAddPayment = () => {
    const validationErrors = {};

    if (!selectedPaymentMethod)
      validationErrors.method = "Please select a payment method";
    if (!newPayment.Amount || isNaN(newPayment.Amount)) {
      validationErrors.amount = "Please enter a valid amount";
    } else if (Number(newPayment.Amount) > updatedDetails.RemainingToPay) {
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

          if (isBefore(selectedDate, minDate) || isAfter(selectedDate, today)) {
            validationErrors.chequeDate =
              "Cheque date must be within the past 90 days";
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

  return (
    <div className="">
      <div className="max-w-7xl">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Payment Summary{" "}
                  <span className="ml-2 text-gray-500">
                    (Step {currentStep})
                  </span>
                </h1>
                <p className="text-gray-500 mt-1">
                  Review your payment details
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  icon={FiArrowLeft}
                  variant="outline"
                  onClick={() => goToStep(currentStep - 1)}
                >
                  Back
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(updatedDetails).map(([key, value]) => (
                <div
                  key={key}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="text-gray-500 text-sm font-medium capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className="text-2xl font-semibold mt-2 text-neutral-700">
                    ₹
                    {value?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Entries */}
            {fullPaymentDetails.length > 0 && (
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
            <div className="mt-8">
              {!parseInt(updatedDetails.RemainingToPay) <= 0 && (
                <>
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
                </>
              )}
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

              {updatedDetails.RemainingToPay > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleAddPayment}
                    className="flex items-center gap-2"
                  >
                    <FiPlus /> Add Payment
                  </Button>
                </div>
              )}
              {updatedDetails.RemainingToPay <= 0 &&
                fullPaymentDetails.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      isLoading={isFinalSaving}
                      disabled={isFinalSaving}
                      onClick={handleSave}
                      className="flex items-center gap-2"
                    >
                      Complete Order
                    </Button>
                  </div>
                )}

              {updatedDetails.RemainingToPay > 0 &&
                fullPaymentDetails.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                    <FiInfo className="text-yellow-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-800">
                        Outstanding Balance
                      </p>
                      <p className="text-yellow-700">
                        There's still ₹
                        {updatedDetails.RemainingToPay.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        remaining. Please add another payment method.
                      </p>
                    </div>
                  </div>
                )}
            </div>
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

        {method === 2 && (
          <>
            <Autocomplete
              options={cardMachines || []}
              getOptionLabel={(option) => option.MachineName || ""}
              value={
                cardMachines?.find(
                  (p) => p.Id === newPayment.PaymentMachineID
                ) || null
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
            <Input
              label="Approval Code *"
              value={newPayment.RefNo}
              onChange={handleInputChange("RefNo")}
              error={errors.refNo}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newPayment.EMI}
                onChange={(e) =>
                  setNewPayment((prev) => ({
                    ...prev,
                    EMI: e.target.checked,
                    EMIMonths: e.target.checked ? prev.EMIMonths : null,
                    EMIBank: e.target.checked ? prev.EMIBank : null,
                  }))
                }
              />
              <label>EMI</label>
            </div>
            {newPayment.EMI && (
              <>
                <Input
                  label="EMI Months"
                  type="number"
                  value={newPayment.EMIMonths || ""}
                  onChange={handleInputChange("EMIMonths")}
                />
                <Autocomplete
                  options={banks}
                  getOptionLabel={(option) => option.BankName || ""}
                  value={banks.find((b) => b.Id === newPayment.EMIBank) || null}
                  onChange={(_, newValue) =>
                    setNewPayment((prev) => ({
                      ...prev,
                      BankName: newValue?.BankName || null,
                      EMIBank: newValue?.Id || null,
                    }))
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="EMI Bank *" size="small" />
                  )}
                  fullWidth
                />
              </>
            )}
            {commonAmountInput}
          </>
        )}

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

export default PaymentFlow;
