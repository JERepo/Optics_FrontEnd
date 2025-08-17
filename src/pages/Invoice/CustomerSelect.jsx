import React, { useEffect, useState } from "react";
import { useGetCustomerContactDetailsQuery } from "../../api/orderApi";
import { Autocomplete, TextField } from "@mui/material";
import {
  useGetCompanyIdQuery,
  useGetCustomerByIdQuery,
} from "../../api/customerApi";
import Loader from "../../components/ui/Loader";
import {
  useGenerateInvoiceMutation,
  useGetAllOrderMasterQuery,
  useGetPatientsQuery,
  useGetProductDetailsMutation,
  useLazyGetBatchDetailsQuery,
  useSaveBatchDetailsMutation,
} from "../../api/InvoiceApi";
import { useSelector } from "react-redux";
import Radio from "../../components/Form/Radio";
import Input from "../../components/Form/Input";
import Button from "../../components/ui/Button";
import { Table, TableCell, TableRow } from "../../components/Table";
import Modal from "../../components/ui/Modal";
import { useGetLocationByIdQuery } from "../../api/roleManagementApi";
import {
  FiCheck,
  FiEdit,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { formatINR } from "../../utils/formatINR";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import PaymentFlow from "../Order/StepSix/PaymentFlow";
import { useOrder } from "../../features/OrderContext";
import { format } from "date-fns";
import Textarea from "../../components/Form/Textarea";

const getShortTypeName = (id) => {
  if (id === null || id === undefined) return;
  if (id === 1) return "F/S";
  if (id === 2) return "ACC";
  if (id === 3) return "CL";
  if (id === 0) return "OL";
  return "";
};

const getProductName = (order) => {
  const {
    productType,
    brandName,
    focality,
    familyName,
    designName,
    index,
    coatingName,
    treatmentName,
    specs,
    hSN,
    category,
    barcode,
    fittingPrice,
    fittingGSTPercentage,
    batchCode,
    expiry,
  } = order;

  const clean = (val) => {
    if (
      val === null ||
      val === undefined ||
      val === "undefined" ||
      val === "null"
    ) {
      return "";
    }
    return String(val).trim();
  };

  const cleanPower = (val) => {
    const cleaned = clean(val);
    if (!cleaned) return "";
    const num = parseFloat(cleaned);
    if (isNaN(num)) return "";
    return num >= 0 ? `+${num}` : `${num}`;
  };

  if (productType === 1) {
    const brand = clean(order.brandName);
    const model = clean(order.modelNo);
    const color = clean(order.colourCode);
    const size = clean(order.size);
    const dbl = clean(order.dBL);
    const temple = clean(order.templeLength);
    const barcode = clean(order.barcode);
    const hsn = clean(order.hSN);
    const cat = category === 1 ? "Optical Frame" : "Sunglass";

    const line1 = [brand, model, color].filter(Boolean).join(" ");
    const line2 = [size, dbl, temple].filter(Boolean).join("-");

    return [
      line1,
      line2,
      cat,
      barcode && `Barcode: ${barcode}`,
      hsn && `HSN: ${hsn}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (productType === 2) {
    const brand = clean(order.brandName);
    const name = clean(order.productName);
    const variation = clean(specs?.variation);
    const barcode = clean(specs?.barcode);
    const hsn = clean(order.hSN);

    return [
      [brand, name].filter(Boolean).join(" "),
      variation && `Variation: ${variation}`,
      barcode && `Barcode: ${barcode}`,
      hsn && `HSN: ${hsn}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (productType === 3) {
    const name = clean(order.productName);
    const brand = clean(order.brandName);
    const hsn = clean(order.hSN);
    const barcode = clean(order.batchBarCode || order.barcode);

    const sph = cleanPower(specs?.sphericalPower);
    const cyld = cleanPower(specs?.cylindricalPower);
    const axis = clean(specs?.axis);
    const addl = cleanPower(specs?.additional);
    const clr = clean(specs?.color);

    const specsList = [
      sph && `SPH: ${sph}`,
      cyld && `CYL: ${cyld}`,
      axis && `Axis: ${axis}`,
      addl && `Add: ${addl}`,
    ]
      .filter(Boolean)
      .join(", ");

    return [
      [brand, name].filter(Boolean).join(" "),
      specsList,
      clr && `Color: ${clr}`,
      barcode && `Barcode: ${barcode}`,
      (batchCode || expiry) &&
        `Batch Code: ${batchCode || "-"} | Expiry: ${
          expiry ? expiry.split("-").reverse().join("/") : "-"
        }`,
      hsn && `HSN: ${hsn}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (productType === 0) {
    const olLine = [
      brandName,
      focality,
      familyName,
      designName,
      index ? `1.${index}` : "",
      coatingName,
      treatmentName,
    ]
      .map(clean)
      .filter(Boolean)
      .join(" ");

    const right = specs?.powerDetails?.right || {};
    const left = specs?.powerDetails?.left || {};

    const rightParts = [
      cleanPower(right.sphericalPower) &&
        `SPH: ${cleanPower(right.sphericalPower)}`,
      cleanPower(right.addition) && `Add: ${cleanPower(right.addition)}`,
      clean(right.diameter) && `Dia: ${clean(right.diameter)}`,
    ].filter(Boolean);

    const leftParts = [
      cleanPower(left.sphericalPower) &&
        `SPH: ${cleanPower(left.sphericalPower)}`,
      cleanPower(left.addition) && `Add: ${cleanPower(left.addition)}`,
      clean(left.diameter) && `Dia: ${clean(left.diameter)}`,
    ].filter(Boolean);

    const powerLine = [
      rightParts.length > 0 ? `R: ${rightParts.join(", ")}` : "",
      leftParts.length > 0 ? `L: ${leftParts.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const addOnLine =
      clean(specs?.addOn?.addOnName) &&
      `Addon: ${clean(specs?.addOn?.addOnName)}`;
    const tintLine =
      clean(specs?.tint?.tintName) && `Tint: ${clean(specs?.tint?.tintName)}`;
    const barcodeLine = clean(barcode) && `Barcode: ${clean(barcode)}`;
    const hsnLine = clean(hSN) && `HSN: ${clean(hSN)}`;

    let fittingLine = "";
    const fitPrice = parseFloat(fittingPrice);
    const gstPerc = parseFloat(fittingGSTPercentage);
    if (!isNaN(fitPrice) && !isNaN(gstPerc) && fitPrice > 0) {
      const totalFitting = (fitPrice * (1 + gstPerc / 100)).toFixed(2);
      fittingLine = `Fitting Price: ₹${totalFitting}`;
    }

    return [olLine, powerLine, addOnLine, tintLine, hsnLine, fittingLine]
      .filter(Boolean)
      .join("\n");
  }

  return "";
};

const CustomerSelect = () => {
  const navigate = useNavigate();
  const {
    updatePaymentDetails,
    customerId,
    setCustomerId,
    fullPayments,
    setFullPayments,
  } = useOrder();

  const { hasMultipleLocations, user } = useSelector((state) => state.auth);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [billInTheName, setBillInTheName] = useState(0);
  const [isNextClicked, setIsNextClicked] = useState(false);
  const [isBatchCodeOpen, setIsBatchCodeOpen] = useState(false);
  const [localProductData, setLocalProductData] = useState([]);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editMode, setEditMode] = useState({}); // { [index]: { sellingPrice: false, toBillQty: false } }
  const [editValues, setEditValues] = useState({});
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedOrderForBatch, setSelectedOrderForBatch] = useState(null);
  const [collectPayment, setCollectPayment] = useState(false);
  const [invoiceNote, setInvoiceNote] = useState("");
  const [totalBatchData, setTotalBatchData] = useState(null);
  const [loadingIndex, setLoadingIndex] = useState(null);

  const { data: contactResp, isLoading: isPatientLoading } =
    useGetPatientsQuery({
      companyId: hasMultipleLocations[0],
    });

  const { data: locationById } = useGetLocationByIdQuery({
    id: hasMultipleLocations[0],
  });
  const companyId = locationById?.data?.data.Id;
  const { data: companySettings } = useGetCompanyIdQuery(
    { id: companyId },
    { skip: !companyId }
  );
  const { data: customerData, isLoading: isCustomerLoading } =
    useGetCustomerByIdQuery(
      { id: selectedPatient?.CustomerMasterID },
      { skip: !selectedPatient?.CustomerMasterID }
    );

  const {
    data: allMaster,
    isLoading: isMasterLoading,
    refetch,
  } = useGetAllOrderMasterQuery(
    { patientId: selectedPatient?.Id },
    { skip: !selectedPatient?.Id }
  );

  const [generateInvoice, { isLoading: isGenerateInvoice }] =
    useGenerateInvoiceMutation();
  const [getBatches, { data: batchDetails, isFetching: isBatchesFetching }] =
    useLazyGetBatchDetailsQuery();
  const [
    getProductDetails,
    { data: productData, isLoading: isProductDataLoading },
  ] = useGetProductDetailsMutation();

  const handleRefresh = async () => {
    try {
      setFullPayments([]);
      updatePaymentDetails(null);
      setLocalProductData([]);
      setSelectedProducts([]);
      setIsBatchCodeOpen(false);
      setSelectedOrderForBatch(null);
      setEditingOrderId(null);
      setEditingField(null);
      setEditValue("");

      await refetch();

      if (masterIds.length) {
        const payload = {
          masterId: masterIds,
          productType: null,
          locationId: parseInt(hasMultipleLocations[0]),
        };
        await getProductDetails({ payload }).unwrap();
      }
    } catch (error) {
      console.error("Error during refresh:", error);
      toast.error("Failed to refresh data");
    }
  };

  useEffect(() => {
    if (productData) {
      const updatedProductData = productData.map((order) => ({
        ...order,
        toBillQty: order.orderQty - order.billedQty - order.cancelledQty,
        sellingPrice: order.discountedSellingPrice || 0,
        totalValue:
          (order.discountedSellingPrice || 0) *
          (order.orderQty - order.billedQty - order.cancelledQty),
        batchData: order.batchData || [],
        availableQty:
          order.stock?.reduce(
            (sum, stockItem) => sum + (stockItem.quantity || 0),
            0
          ) || 0,
      }));
      setLocalProductData(updatedProductData);
    }
  }, [productData]);

  const masterIds = [
    ...new Set(allMaster?.data?.orders?.map((o) => o.OrderMasterId) || []),
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (masterIds.length) {
          const payload = {
            masterId: masterIds,
            productType: null,
            locationId: parseInt(hasMultipleLocations[0]),
          };
          await getProductDetails({ payload }).unwrap();
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, [allMaster]);

  useEffect(() => {
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      localProductData.forEach((_, index) => {
        if (!newEditMode[index]) {
          newEditMode[index] = { sellingPrice: false, toBillQty: false };
        }
      });
      return newEditMode;
    });
    setEditValues((prev) => {
      const newEditValues = { ...prev };
      localProductData.forEach((order, index) => {
        if (!newEditValues[index]) {
          newEditValues[index] = {
            sellingPrice: order.sellingPrice.toString(),
            toBillQty: order.toBillQty.toString(),
          };
        }
      });
      return newEditValues;
    });
  }, [localProductData]);

  const allowedStatusesByType = {
    0: [0, 1, 2, 6], // OL
    1: [0, 1, 2], // Frame
    2: [0, 1, 2], // Accessory
    3: [0, 1, 2], // CL
  };

  const handleGetBatches = async (order, index) => {
    setLoadingIndex(index);
    try {
      const res = await getBatches({
        clBatchId: order.cLDetailId,
        locationId: hasMultipleLocations[0],
      }).unwrap();

      setTotalBatchData(res?.data);
      setIsBatchCodeOpen(true);
      setSelectedOrderForBatch({ ...order, index });
    } catch (error) {
      setTotalBatchData(null);
      toast.error(error?.data?.error || "Something went wrong");
    }
  };

  const filteredProducts = localProductData?.filter((order) => {
    const { productType, orderMasterStatus, orderDetailStatus, stock } = order;
    if (orderMasterStatus !== 1) return false;
    const allowedStatuses = allowedStatusesByType[productType] || [];
    const isAllowedStatus = allowedStatuses.includes(orderDetailStatus);
    const hasStockInLocation = stock?.some(
      (s) => s.locationId === hasMultipleLocations[0] && s.quantity > 0
    );
    return isAllowedStatus && hasStockInLocation;
  });

  const toggleEditMode = (index, field) => {
    setEditMode((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: !prev[index]?.[field],
      },
    }));
  };
  const handleSelectAndNext = () => {
    setCustomerId({
      companyId: selectedPatient?.CustomerMaster?.CompanyID,
      locationId: selectedPatient?.CustomerMaster?.CompanyID,
      customerId: selectedPatient?.CustomerMaster?.Id,
    });
    setIsNextClicked(true);
  };

  const saveEdit = (index, field) => {
    const value = editValues[index]?.[field]?.trim();
    const order = localProductData[index];
    const numericValue = parseFloat(value);

    if (value === "" || isNaN(numericValue)) {
      toast.error(
        `${
          field === "sellingPrice" ? "Selling Price" : "To Bill Qty"
        } must be a valid number`
      );
      return;
    }
    if (numericValue < 0) {
      toast.error(
        `${
          field === "sellingPrice" ? "Selling Price" : "To Bill Qty"
        } cannot be negative`
      );
      return;
    }
    if (
      field === "sellingPrice" &&
      order.advanceAmount > 0 &&
      numericValue < order.advanceAmount
    ) {
      toast.error("Selling Price cannot be less than advance amount");
      return;
    }
    if (field === "toBillQty") {
      const maxToBillQty =
        order.orderQty - order.billedQty - order.cancelledQty;
      if (numericValue > maxToBillQty) {
        toast.error(`To Bill Qty cannot exceed ${maxToBillQty}`);
        return;
      }
      if (order.productType === 3 && order.batchData?.length) {
        const totalBatchQty = order.batchData.reduce(
          (sum, item) => sum + Number(item.availableQty),
          0
        );
        if (numericValue !== totalBatchQty) {
          toast.error(
            `To Bill Qty (${numericValue}) must match total batch quantity (${totalBatchQty})`
          );
          return;
        }
      }
    }

    setLocalProductData((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]: numericValue,
              totalValue:
                (field === "sellingPrice" ? numericValue : item.sellingPrice) *
                (field === "toBillQty" ? numericValue : item.toBillQty),
            }
          : item
      )
    );
    setEditMode((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: false,
      },
    }));
  };

  const cancelEdit = (index, field) => {
    setEditMode((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: false,
      },
    }));
    // Reset edit value to original
    setEditValues((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: localProductData[index][field].toString(),
      },
    }));
  };

  const getAvalQty = (order) => {
    if (order.productType === 0) {
      return order.pricing?.quantity || 0;
    } else if (order.productType === 3) {
      return order.availableQty || 0;
    } else {
      return 0;
    }
  };

  const getPricing = (order) => {
    if (
      order.productType === 0 ||
      order.productType === 1 ||
      order.productType === 2
    ) {
      return order.pricing.mrp || 0;
    } else if (order.productType === 3) {
      const totalMrp = order.stock?.reduce(
        (sum, p) => sum + parseFloat(p.mrp || 0),
        0
      );

      return totalMrp || 0;
    } else {
      return 0;
    }
  };

  const handleKeyPress = (e, order, index) => {
    console.log("order", order);
    // if(order.advanceAmount === null || order.advanceAmount === 0){

    // }
    if (e.key === "Enter") {
      handleEditSave(order, index);
    }
  };

  const handleProductSelection = (order, index) => {
    setSelectedProducts((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      return [...prev, index];
    });
  };

  const handleSelectAllProducts = (e) => {
    if (e.target.checked) {
      const allIndexes = localProductData?.map((_, idx) => idx);
      setSelectedProducts(allIndexes);
    } else {
      setSelectedProducts([]);
    }
  };

  const validateBatchCodes = () => {
    const missingBatchCodes = selectedProducts.filter((index) => {
      const order = localProductData[index];
      return (
        order.productType === 3 &&
        order.cLBatchCode === 1 &&
        !order.batchData?.length
      );
    });
    return missingBatchCodes.length === 0;
  };
  const calculateGST = (sellingPrice, taxPercentage) => {
    const price = parseFloat(sellingPrice);
    const taxRate = parseFloat(taxPercentage) / 100;
    const gstAmount = price - price / (1 + taxRate);
    return {
      gstAmount: isNaN(gstAmount) ? 0 : gstAmount.toFixed(2),
      taxPercentage: isNaN(taxPercentage)
        ? 0
        : parseFloat(taxPercentage).toFixed(2),
    };
  };

  const totalAmount = selectedProducts.reduce((sum, index) => {
    const order = localProductData[index];
    return parseFloat(sum + order.toBillQty * order.sellingPrice);
  }, 0);

  const totalAdvance = selectedProducts.reduce((sum, index) => {
    const order = localProductData[index];
    return sum + (parseFloat(order.advanceAmount) || 0);
  }, 0);

  const totalQty = selectedProducts.reduce((sum, index) => {
    const order = localProductData[index];
    return sum + (order.toBillQty || 0);
  }, 0);

  const totalGst = selectedProducts.reduce((sum, index) => {
    const order = localProductData[index];
    const gstInfo = calculateGST(
      order.toBillQty * order.sellingPrice,
      order.taxPercentage
    );
    return parseFloat(sum + parseFloat(gstInfo.gstAmount || 0));
  }, 0);

  const totalPaid = fullPayments?.reduce(
    (sum, payment) => sum + (parseFloat(payment.Amount) || 0),
    0
  );

  const totalBalance =
    totalPaid > 0
      ? totalAmount - totalPaid - totalAdvance
      : totalAmount - totalAdvance;

  const handleCollectPayment = () => {
    if (!validateBatchCodes()) {
      toast.error("Please add BatchCodes for all the selected Contact Lens");
      return;
    }

    const payload = {
      CompanyId: customerId.companyId,
      TotalQty: totalQty,
      TotalGSTValue: totalGst,
      TotalValue: totalAmount,
      totalAdvance: totalBalance,
      advance: totalAdvance,
    };
    console.log("new payment details", payload);
    updatePaymentDetails({ ...payload });
    if (totalBalance > 0) {
      setCollectPayment(true);
    }
  };

  const handleDeletePayment = (index) => {
    setFullPayments((prev) => prev.filter((_, i) => i !== index));
    toast.success("Payment removed successfully!");
    const payload = {
      CompanyId: customerId.companyId,
      TotalQty: totalQty,
      TotalGSTValue: totalGst,
      TotalValue: totalAmount,
      totalAdvance: totalBalance,
      advance: totalAdvance,
    };

    updatePaymentDetails({ ...payload });
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
        case "advance":
          return "advance";
        default:
          return type.toLowerCase();
      }
    };

    fullPayments.forEach((payment) => {
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

  const handleGenerateInvoice = async () => {
    const filteredSelected = localProductData?.filter((_, index) =>
      selectedProducts.includes(index)
    );
    const invoiceItems = filteredSelected?.map((item) => {
      return {
        orderDetailId: item.orderDetailId,
        batchCode: item.batchData[0]?.batchCode || null,
        toBillQty: item.toBillQty,
        srp: parseFloat(getPricing(item)),
        invoicePrice: parseFloat(item.sellingPrice) || null,
        discountedSellingPrice: parseFloat(item.discountedSellingPrice) || null,
        AdvanceAmountused: parseFloat(item.advanceAmount) || null,
      };
    });
    const payload = {
      invoiceItems,
      locationId: parseInt(hasMultipleLocations[0]),
      customerId: selectedPatient.CustomerMaster?.Id,
      patientId: selectedPatient?.Id,
      invoiceByMethod: 0,
      invoiceName: parseInt(billInTheName),
      invoiceRemarks: invoiceNote,
      totalQty: totalQty,
      totalGSTValue: totalGst,
      totalValue: totalAmount,
      roundOff: 0.0,
      balanceAmount: 0,
      applicationUserId: user.Id,
      creditBilling:
        selectedPatient?.CustomerMaster?.CreditBilling === 1 ? true : false,
    };

    if (payload.creditBilling) {
      payload.payments = preparePaymentsStructure();
    }

    try {
      const response = await generateInvoice({ payload }).unwrap();
      toast.success(response?.message);
      setFullPayments([]);
      updatePaymentDetails(null);
      navigate("/invoice");
    } catch (error) {
      console.error(error);
      const errors = error?.data.errors;
      if (errors?.length > 0) {
        errors.forEach((err) => {
          toast.error(err);
        });
      }
    }
  };

  return (
    <div className="max-w-7xl">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          {!isNextClicked && (
            <div className="flex justify-between">
              <div className="w-1/2">
                <Autocomplete
                  options={contactResp?.data?.patients || []}
                  getOptionLabel={(option) =>
                    `${option.CustomerName} (${option.MobNumber})`
                  }
                  value={
                    contactResp?.data?.patients.find(
                      (master) =>
                        master.CustomerMasterID ===
                        selectedPatient?.CustomerMasterID
                    ) || null
                  }
                  onChange={(_, newValue) =>
                    setSelectedPatient(newValue || null)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select by Patient name or mobile"
                      size="medium"
                    />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.CustomerMasterID === value.CustomerMasterID
                  }
                  loading={isPatientLoading}
                  fullWidth
                />
              </div>
              <div>
                <Button variant="outline" onClick={() => navigate("/invoice")}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {isCustomerLoading && <Loader color="black" />}
          {!isNextClicked &&
            !isCustomerLoading &&
            selectedPatient &&
            customerData && (
              <div className="p-6 grid grid-cols-5 gap-4 text-sm">
                <div className="flex gap-1">
                  <strong>Patient Name:</strong> {selectedPatient.CustomerName}
                </div>
                <div className="flex gap-1">
                  <strong>Customer Name:</strong>
                  {customerData?.data?.data?.CustomerName}
                </div>
                <div className="flex gap-1">
                  <strong>Mobile Number:</strong>
                  {customerData?.data?.data?.MobNumber}
                </div>
                {customerData?.data?.data?.TAXRegisteration === 1 && (
                  <>
                    <div className="flex gap-1">
                      <strong>GST No:</strong> {customerData?.data?.data?.TAXNo}
                    </div>
                    <div className="flex gap-1">
                      <strong>Address:</strong>
                      {`${customerData?.data?.data.BillAddress1} ${customerData?.data?.data.BillAddress2} ${customerData?.data?.data.BillCity}`}
                    </div>
                  </>
                )}
                {customerData?.data?.data?.BillingMethod === 1 && (
                  <div className="flex gap-1">
                    <strong>Billing Method:</strong> Delivery Challan(DC)
                  </div>
                )}
                {customerData?.data?.data?.CreditBilling === 1 && (
                  <>
                    <div className="flex gap-1">
                      <strong>Credit Billing:</strong> Yes
                    </div>
                    <div className="flex gap-1">
                      <strong>Credit Limit Available:</strong>
                      {parseFloat(
                        customerData?.data?.data?.CreditLimit
                      ).toLocaleString()}
                    </div>
                  </>
                )}
                <div className="flex items-center gap-3 flex-grow col-span-2">
                  <label>Bill in the name:</label>
                  <div className="flex items-center gap-3">
                    <Radio
                      name="bill"
                      label="Patient Name"
                      value="0"
                      checked={billInTheName === 0}
                      onChange={() => setBillInTheName(0)}
                    />
                    <Radio
                      name="bill"
                      label="Customer Name"
                      value="1"
                      checked={billInTheName === 1}
                      onChange={() => setBillInTheName(1)}
                    />
                  </div>
                </div>
              </div>
            )}

          {selectedPatient && !isNextClicked && !isCustomerLoading && (
            <div className="flex justify-end">
              <Button onClick={handleSelectAndNext}>Select & Next</Button>
            </div>
          )}

          {isNextClicked && (
            <div>
              <div>
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex gap-1">
                      <strong>Patient Name:</strong>
                      {selectedPatient?.CustomerName}
                    </div>
                    <div className="flex gap-1">
                      <strong>Customer Name:</strong>
                      {customerData?.data?.data?.CustomerName}
                    </div>
                    <div className="flex gap-1">
                      <strong>Mobile Number:</strong>{" "}
                      {selectedPatient?.MobNumber}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end mb-3">
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FiRefreshCw className="text-base" />
                    Refresh
                  </Button>
                  <Button
                    onClick={() => {
                      setIsNextClicked(false);
                      updatePaymentDetails(null);
                      setFullPayments([]);
                    }}
                    variant="outline"
                  >
                    Back
                  </Button>
                </div>
              </div>
              <Table
                expand={true}
                name="Product Details"
                columns={[
                  "Select",
                  "S.NO",
                  "Order No.",
                  "Product Type",
                  "Product Details",
                  "SRP",
                  "Selling Price",
                  "Order Qty",
                  "To Bill Qty",
                  "Avl Qty",
                  "Total Amount",
                  "Advance",
                  "Balance",
                  "Action",
                ]}
                freeze={true}
                data={localProductData}
                renderHeader={(column) => {
                  if (column === "Select") {
                    const allSelected =
                      localProductData?.length > 0 &&
                      selectedProducts.length === localProductData.length;
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
                  return (
                    <span
                      className={
                        column === "Selling Price" || column === "To Bill Qty"
                          ? "min-w-[150px] inline-block"
                          : ""
                      }
                    >
                      {column}
                    </span>
                  );
                }}
                renderRow={(order, index) => (
                  <TableRow key={index} className="text-[13px]">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(index)}
                        onChange={() => handleProductSelection(order, index)}
                        className="h-5 w-5"
                      />
                    </TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{`${order.orderPrefix}/${order.orderNo}/${order.slNo}`}</TableCell>
                    <TableCell>{getShortTypeName(order.productType)}</TableCell>
                    <TableCell>
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                        }}
                      >
                        {getProductName(order)}
                      </div>
                    </TableCell>
                    <TableCell>
                      ₹
                      {order.batchData?.length > 0
                        ? order.mrp
                        : formatINR(getPricing(order))}
                    </TableCell>
                    <TableCell className="min-w-[150px]">
                      {editMode[index]?.sellingPrice ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editValues[index]?.sellingPrice || ""}
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                [index]: {
                                  ...prev[index],
                                  sellingPrice: e.target.value,
                                },
                              }))
                            }
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(index, "sellingPrice")}
                            className="text-neutral-400 transition"
                            title="Save"
                          >
                            <FiCheck size={18} />
                          </button>
                          <button
                            onClick={() => cancelEdit(index, "sellingPrice")}
                            className="text-neutral-400 transition"
                            title="Cancel"
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">
                            ₹{formatINR(order.sellingPrice) || 0}
                          </span>
                          {companySettings?.data?.data?.EditInvoicePrice ===
                            1 && (
                            <button
                              onClick={() =>
                                toggleEditMode(index, "sellingPrice")
                              }
                              className="text-neutral-400 hover:text-neutral-600 transition"
                              title="Edit Price"
                            >
                              <FiEdit2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{order.orderQty}</TableCell>
                    <TableCell className="min-w-[150px]">
                      {editMode[index]?.toBillQty ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={editValues[index]?.toBillQty || ""}
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                [index]: {
                                  ...prev[index],
                                  toBillQty: e.target.value,
                                },
                              }))
                            }
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(index, "toBillQty")}
                            className="text-neutral-400 transition"
                            title="Save"
                          >
                            <FiCheck size={18} />
                          </button>
                          <button
                            onClick={() => cancelEdit(index, "toBillQty")}
                            className="text-neutral-400 transition"
                            title="Cancel"
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">
                            {order.toBillQty}
                          </span>
                          <button
                            onClick={() => toggleEditMode(index, "toBillQty")}
                            className="text-neutral-400 hover:text-neutral-600 transition"
                            title="Edit Quantity"
                          >
                            <FiEdit2 size={14} />
                          </button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getAvalQty(order)}</TableCell>
                    <TableCell>
                      {formatINR(order.toBillQty * order.sellingPrice)}
                    </TableCell>
                    <TableCell>
                      ₹{formatINR(order.advanceAmount) || 0}
                    </TableCell>
                    <TableCell>
                      ₹
                      {formatINR(
                        order.toBillQty * order.sellingPrice -
                          (order.advanceAmount || 0),
                        true
                      )}
                    </TableCell>
                    <TableCell>
                      {order.productType === 3 &&
                        order.cLBatchCode === 1 &&
                        !order.batchData?.length &&
                        selectedProducts.includes(index) && (
                          <button
                            onClick={() => handleGetBatches(order, index)}
                            className="bg-black hover:bg-primary-600 text-white py-2 px-4 rounded transition-colors duration-200 flex items-center gap-2 shadow-sm hover:shadow-md text-sm font-medium"
                          >
                            {isBatchesFetching && index === loadingIndex ? (
                              "Loading..."
                            ) : (
                              <div className="flex items-center gap-2">
                                <FiPlus className="text-base" />
                                Batch Code
                              </div>
                            )}
                          </button>
                        )}
                    </TableCell>
                  </TableRow>
                )}
                emptyMessage={`${
                  isProductDataLoading ? "Loading..." : "No data found"
                }`}
              />
              {/* Payment Entries */}
              {fullPayments.length > 0 && !collectPayment && (
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
                      data={fullPayments}
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
                              className="text-neutral-400"
                              icon={FiTrash2}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    />
                  </div>
                </div>
              )}
              <PaymentDetails
                isOpen={collectPayment}
                onClose={() => setCollectPayment(false)}
                collectPayment={collectPayment}
              />

              <div className="flex justify-end mt-4 gap-2">
                {selectedProducts.length > 0 && (
                  <div className="flex gap-10">
                    <div className="flex gap-3">
                      <span className="text-xl font-semibold">
                        Total Qty: {formatINR(totalQty)}
                      </span>
                      <span className="text-xl font-semibold">
                        Total GST: ₹{formatINR(totalGst)}
                      </span>
                    </div>
                    <div>
                      <div className="flex flex-col gap-3">
                        <span className="text-xl font-semibold">
                          Total Amount: ₹{formatINR(totalAmount)}
                        </span>
                        <span className="text-xl font-semibold">
                          Total Advance: ₹{formatINR(totalAdvance)}
                        </span>
                        <span className="text-xl font-semibold">
                          Total Balance: ₹{formatINR(totalBalance, true)}
                        </span>
                      </div>
                      <div className="mt-5">
                        {selectedPatient?.CustomerMaster?.CreditBilling ===
                          0 && (
                          <>
                            {totalBalance > 0 && (
                              <Button onClick={handleCollectPayment}>
                                Collect Payment
                              </Button>
                            )}
                          </>
                        )}

                        {(totalBalance === 0 ||
                          selectedPatient?.CustomerMaster?.CreditBilling ===
                            1) && (
                          <Button
                            onClick={handleGenerateInvoice}
                            isLoading={isGenerateInvoice}
                            disabled={isGenerateInvoice}
                          >
                            {customerData?.data?.data?.BillingMethod === 1
                              ? "Generate DC"
                              : "Generate Invoice"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {isNextClicked && (
            <div className="mt-5">
              <Textarea
                label="Comments"
                value={invoiceNote}
                onChange={(e) => setInvoiceNote(e.target.value)}
              />
            </div>
          )}

          <BatchCode
            isOpen={isBatchCodeOpen}
            onClose={() => {
              setIsBatchCodeOpen(false);
              setSelectedOrderForBatch(null);
            }}
            batchDetails={totalBatchData}
            selectedOrder={selectedOrderForBatch}
            locations={hasMultipleLocations}
            setLocalProductData={setLocalProductData}
            setSelectedProducts={setSelectedProducts}
          />
        </div>
      </div>
    </div>
  );
};

const BatchCode = ({
  isOpen,
  onClose,
  batchDetails,
  selectedOrder,
  locations,
  setLocalProductData,
  setSelectedProducts,
}) => {
  const [batchData, setBatchData] = useState({
    isBatchSelectorEnter: 0,
    batchCode: null,
    barcode: null,
    expiryDate: null,
    avlQty: null,
    toBillQty: 1,
    batchData: [],
  });

  const [saveBatchDetails, { isLoading: isBatchDetailsSaving }] =
    useSaveBatchDetailsMutation();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBatchData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveBatch = () => {
    const {
      batchCode,
      expiryDate,
      toBillQty,
      avlQty,
      barcode,
      batchData: existingData,
    } = batchData;

    const matchedBatch = batchData?.batches?.find(
      (item) => item.CLBatchBarCode === barcode
    );

    if (!matchedBatch) {
      toast.error("Invalid batch selected");
      return;
    }

    if (Number(toBillQty) > Number(avlQty)) {
      toast.error("To Bill Qty cannot be greater than Available Qty");
      return;
    }

    const isDuplicate = existingData.some(
      (item) => item.batchCode === batchCode
    );
    if (isDuplicate) {
      toast.error("Same Batchcode cannot be added again");
      return;
    }

    setBatchData((prev) => ({
      ...prev,
      batchData: [
        ...prev.batchData,
        {
          batchCode,
          expiryDate,
          toBillQty,
          barcode,
          avlQty,
          mrp: matchedBatch.CLMRP,
          sellingPrice: matchedBatch.SellingPrice,
        },
      ],
      barcode: null,
      batchCode: null,
      expiryDate: null,
      avlQty: null,
      toBillQty: 1,
    }));
  };

  const handleSaveFinalBatch = async () => {
    const totalBatchQty = batchData.batchData.reduce(
      (sum, item) => sum + Number(item.toBillQty),
      0
    );

    if (totalBatchQty > selectedOrder?.toBillQty) {
      toast.error(
        `Total batch quantity (${totalBatchQty}) cannot exceed product's To Bill Qty (${selectedOrder?.toBillQty})`
      );
      return;
    }

    const payload = {
      CLDetailId: selectedOrder?.cLDetailId,
      batches: batchData.batchData.map((item) => ({
        BatchCode: item.batchCode,
        ExpiryDate: item.expiryDate,
        AvlQty: item.avlQty,
        ToBillQty: item.toBillQty,
      })),
    };

    try {
      const response = await saveBatchDetails({
        orderDetailedId: selectedOrder?.orderDetailId,
        locationId: locations[0],
        payload,
      }).unwrap();

      setLocalProductData((prev) => {
        const newProductData = prev.filter(
          (_, idx) => idx !== selectedOrder.index
        );
        const batchProducts = response.map((batch, idx) => ({
          ...prev[selectedOrder.index],
          orderNo: prev[selectedOrder.index].orderNo,
          productName: batch.ProductName.split(" ").slice(1).join(" "),
          hSN: batch.HSN,
          discountedSellingPrice: batch.DiscountedSellingPrice,
          orderQty: batch.OrderQty,
          batchCode: batch.BatchCode,
          batchBarCode: batch.BatchBarCode,
          expiry: batch.Expiry,
          mrp: batch.MRP,
          availableQty: batch.AvailableQty,
          toBillQty: batch.ToBillQty,
          totalValue: batch.RowTotal,
          advanceAmount: batch.AdvanceUsed,
          balance: batch.BalanceAtRow,
          orderDetailId: prev[selectedOrder.index].orderDetailId,
          productType: 3,
          batchData: [
            {
              batchCode: batch.BatchCode,
              batchBarCode: batch.BatchBarCode,
              expiry: batch.Expiry,
              mrp: batch.MRP,
              availableQty: batch.AvailableQty,
              toBillQty: batch.ToBillQty,
            },
          ],
        }));

        newProductData.splice(selectedOrder.index, 0, ...batchProducts);
        return newProductData;
      });

      setSelectedProducts((prev) => {
        const filteredIndices = prev.filter((i) => i !== selectedOrder.index);
        const newIndices = response.map((_, idx) => selectedOrder.index + idx);
        return [...new Set([...filteredIndices, ...newIndices])];
      });

      setBatchData({
        isBatchSelectorEnter: 0,
        batchCode: null,
        barcode: null,
        expiryDate: null,
        avlQty: null,
        toBillQty: 1,
        batchData: [],
      });
      toast.success("Batch details added successfully");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Radio
            label="Select Batch Code"
            name="isBatchSelectorEnter"
            value="0"
            checked={batchData.isBatchSelectorEnter == 0}
            onChange={handleChange}
          />
          <Radio
            label="Enter BatchBar Code"
            name="isBatchSelectorEnter"
            value="1"
            checked={batchData.isBatchSelectorEnter == 1}
            onChange={handleChange}
          />
        </div>

        <div className="w-1/2">
          <Autocomplete
            value={
              batchDetails?.batches?.find(
                (item) => item.CLBatchBarCode === batchData.barcode
              ) || null
            }
            options={batchDetails?.batches || []}
            getOptionLabel={(option) => option.CLBatchBarCode || ""}
            onChange={(_, newValue) =>
              setBatchData((prev) => ({
                ...prev,
                barcode: newValue?.CLBatchBarCode || null,
                batchCode: newValue?.CLBatchCode || null,
                expiryDate: newValue?.ExpiryDate || null,
                avlQty: newValue?.Quantity || null,
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select Batch Code"
                size="small"
              />
            )}
            isOptionEqualToValue={(item, value) =>
              item.CLBatchBarCode === value.CLBatchBarCode
            }
            fullWidth
          />
        </div>

        {batchData.barcode && (
          <>
            {batchData.expiryDate && (
              <div className="flex gap-6 items-center">
                <div>
                  <span className="font-semibold">Expiry Date:</span>{" "}
                  {batchData.expiryDate.split("-").reverse().join("/")}
                </div>
                <div>
                  <span className="font-semibold">MRP:</span> ₹
                  {batchData?.batches?.find(
                    (b) => b.CLBatchBarCode === batchData.barcode
                  )?.CLMRP || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Selling Price:</span> ₹
                  {batchData?.batches?.find(
                    (b) => b.CLBatchBarCode === batchData.barcode
                  )?.SellingPrice || "N/A"}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <Input
                label="Avl. Qty"
                value={batchData.avlQty || ""}
                placeholder="Avl Qty"
                disabled
              />
              <Input
                label="To Bill Qty"
                type="number"
                value={batchData.toBillQty}
                onChange={(e) =>
                  setBatchData((prev) => ({
                    ...prev,
                    toBillQty: e.target.value,
                  }))
                }
              />
              <Button onClick={handleSaveBatch}>Save</Button>
            </div>
          </>
        )}

        {batchData.batchData.length > 0 && (
          <>
            <div>
              <Table
                columns={["Batch Code", "To Bill Qty", "Action"]}
                data={batchData.batchData}
                renderRow={(row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.batchCode}</TableCell>
                    <TableCell>{row.toBillQty}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setBatchData((prev) => ({
                            ...prev,
                            batchData: prev.batchData.filter(
                              (_, i) => i !== index
                            ),
                          }))
                        }
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveFinalBatch}
                isLoading={isBatchDetailsSaving}
                disabled={isBatchDetailsSaving}
              >
                Submit
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

const PaymentDetails = ({ isOpen, onClose, collectPayment }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} width="max-w-5xl">
      <PaymentFlow collectPayment={collectPayment} onClose={onClose} />
    </Modal>
  );
};

export default CustomerSelect;
