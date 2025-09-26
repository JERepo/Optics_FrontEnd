import React, { useEffect, useMemo, useState } from "react";
import { useGetCustomerContactDetailsQuery } from "../../api/orderApi";
import { Autocomplete, TextField } from "@mui/material";
import {
  useGetCompanyIdQuery,
  useGetCustomerByIdQuery,
} from "../../api/customerApi";
import Loader from "../../components/ui/Loader";
import {
  useCreateEInvoiceMutation,
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
import ConfirmationModal from "../../components/ui/ConfirmationModal";

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
      line2 && `Size: ${line2}`,
      cat && `Category: ${cat}`,
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
    const barcode = clean(order.barcode);
    const batchCode = clean(order.batchData[0]?.batchCode);

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
      const totalFitting = fitPrice * (gstPerc / 100);
      fittingLine = `Fitting Price: ₹${totalFitting + fitPrice}`;
    }

    return [olLine, powerLine, addOnLine, tintLine, hsnLine, fittingLine]
      .filter(Boolean)
      .join("\n");
  }

  return "";
};

const getSRP = (item) => {
  if (!item) {
    return 0;
  }

  if (item.productType === 3) {
    if (item.cLBatchCode === 0) {
      return item.priceMaster?.mrp;
    } else if (item.cLBatchCode === 1) {
      return item.stock[0]?.mrp;
    }
    return 0;
  }

  if (item.productType === 1) {
    if (item.cLBatchCode === 0) {
      return item.pricing.mrp;
    }
    return 0;
  }
  if (item.productType === 2) {
    if (item.cLBatchCode === 0) {
      return item.pricing.mrp;
    }
    return 0;
  }

  if (item.productType === 0) {
    if (item.cLBatchCode === 0) {
      return item.pricing.mrp;
    }
    return 0;
  }
};

const CustomerSelect = () => {
  const navigate = useNavigate();
  const {
    updatePaymentDetails,
    customerId,
    setCustomerId,
    fullPayments,
    setFullPayments,
    setFullPaymentDetails,
    updateFullPayments,
  } = useOrder();
  const { hasMultipleLocations, user } = useSelector((state) => state.auth);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [billInTheName, setBillInTheName] = useState(0);
  const [isNextClicked, setIsNextClicked] = useState(false);
  const [isBatchCodeOpen, setIsBatchCodeOpen] = useState(false);
  const [localProductData, setLocalProductData] = useState([]);
  const [editMode, setEditMode] = useState({}); // { [orderDetailId]: { sellingPrice: false, toBillQty: false } }
  const [editValues, setEditValues] = useState({});
  const [selectedProducts, setSelectedProducts] = useState([]); // Store orderDetailId instead of indices
  const [selectedOrderForBatch, setSelectedOrderForBatch] = useState(null);
  const [collectPayment, setCollectPayment] = useState(false);
  const [invoiceNote, setInvoiceNote] = useState("");
  const [totalBatchData, setTotalBatchData] = useState(null);
  const [loadingOrderId, setLoadingOrderId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showConfirmModalInvoice, setShowConfirmInvoiceModal] = useState(false);
  const [showByPassCheck, setShowByPassModal] = useState(false);
  const [creditDays, setCreditDays] = useState(0);

  const { data: contactResp, isLoading: isPatientLoading } =
    useGetPatientsQuery({ companyId: hasMultipleLocations[0] });
  const { data: locationById } = useGetLocationByIdQuery({
    id: hasMultipleLocations[0],
  });
  const companyId = locationById?.data?.data.Id;
  const { data: companySettings } = useGetCompanyIdQuery(
    { id: companyId },
    { skip: !companyId }
  );
  const EInvoiceEnable = companySettings?.data?.data.EInvoiceEnable;
  const InvInvoiceEnable = companySettings?.data?.data.INVEInvoiceEnable;
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
  const [createInvoice, { isLoading: isInvoiceCreating }] =
    useCreateEInvoiceMutation();

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    return localProductData.filter((order) => {
      const {
        productType,
        orderMasterStatus,
        orderDetailStatus,
        stock,
        pricing,
        companyId,
      } = order;
      if (orderMasterStatus !== 1) return false;
      const allowedStatusesByType = {
        0: [1, 2, 6], // OL
        1: [0, 1, 2], // Frame
        2: [0, 1, 2], // Accessory
        3: [0, 1, 2], // CL
      };
      const allowedStatuses = allowedStatusesByType[productType] || [];
      const isAllowedStatus = allowedStatuses.includes(orderDetailStatus);

      let hasStock = false;
      if (productType === 3) {
        hasStock = stock?.some(
          (s) =>
            companyId === parseInt(hasMultipleLocations[0]) &&
            parseInt(s.quantity) > 0
        );
      } else {
        hasStock =
          pricing?.quantity > 0 &&
          companyId === parseInt(hasMultipleLocations[0]);
      }

      return isAllowedStatus && hasStock;
    });
  }, [localProductData, hasMultipleLocations]);
  // Initialize product data
  useEffect(() => {
    if (productData) {
      const updatedProductData = productData.map((order) => ({
        ...order,
        toBillQty: order.orderQty - order.billedQty - order.cancelledQty,
        sellingPrice:
          order.cLBatchCode === 0 && order.productType === 3
            ? order.priceMaster?.sellingPrice
            : order.discountedSellingPrice || 0,
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

  useEffect(() => {
    updateFullPayments([]);
  }, []);

  // Fetch products when master IDs change
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
  }, [allMaster, getProductDetails, hasMultipleLocations]);

  // Initialize editMode and editValues
  useEffect(() => {
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      localProductData.forEach((order) => {
        if (!newEditMode[order.orderDetailId]) {
          newEditMode[order.orderDetailId] = {
            sellingPrice: false,
            toBillQty: false,
          };
        }
      });
      return newEditMode;
    });
    setEditValues((prev) => {
      const newEditValues = { ...prev };
      localProductData.forEach((order) => {
        if (!newEditValues[order.orderDetailId]) {
          newEditValues[order.orderDetailId] = {
            sellingPrice: order.sellingPrice.toString(),
            toBillQty: order.toBillQty.toString(),
          };
        }
      });
      return newEditValues;
    });
  }, [localProductData]);

  const handleRefresh = async () => {
    try {
      setFullPayments([]);
      updatePaymentDetails(null);
      setLocalProductData([]);
      setSelectedProducts([]);
      setIsBatchCodeOpen(false);
      setSelectedOrderForBatch(null);
      const payload = {
        masterId: masterIds,
        productType: null,
        locationId: parseInt(hasMultipleLocations[0]),
      };
      await getProductDetails({ payload }).unwrap();
    } catch (error) {
      console.error("Error during refresh:", error);
      toast.error("Failed to refresh data");
    }
  };

  const handleGetBatches = async (order) => {
    setLoadingOrderId(order.orderDetailId);
    try {
      const res = await getBatches({
        clBatchId: order.cLDetailId,
        locationId: hasMultipleLocations[0],
      }).unwrap();
      setTotalBatchData(res?.data);
      setIsBatchCodeOpen(true);
      setSelectedOrderForBatch(order);
    } catch (error) {
      setTotalBatchData(null);
      toast.error(error?.data?.error || "Something went wrong");
    } finally {
      setLoadingOrderId(null);
    }
  };

  const toggleEditMode = (orderDetailId, field) => {
    setEditMode((prev) => ({
      ...prev,
      [orderDetailId]: {
        ...prev[orderDetailId],
        [field]: !prev[orderDetailId]?.[field],
      },
    }));
  };

  const saveEdit = (orderDetailId, field) => {
    const value = editValues[orderDetailId]?.[field]?.trim();
    const order = localProductData.find(
      (item) => item.orderDetailId === orderDetailId
    );
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
      numericValue * order.toBillQty - order.advanceAmount < 0
    ) {
      toast.error("Balance Amount cannot be negative!");
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
      prev.map((item) =>
        item.orderDetailId === orderDetailId
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
      [orderDetailId]: {
        ...prev[orderDetailId],
        [field]: false,
      },
    }));
  };

  const cancelEdit = (orderDetailId, field) => {
    setEditMode((prev) => ({
      ...prev,
      [orderDetailId]: {
        ...prev[orderDetailId],
        [field]: false,
      },
    }));
    setEditValues((prev) => ({
      ...prev,
      [orderDetailId]: {
        ...prev[orderDetailId],
        [field]: localProductData
          .find((item) => item.orderDetailId === orderDetailId)
          [field].toString(),
      },
    }));
  };

  const getAvalQty = (order) => {
    if (
      order.productType === 0 ||
      order.productType === 1 ||
      order.productType === 2
    ) {
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
      return order.pricing?.mrp || 0;
    } else if (order.productType === 3) {
      if (order.cLBatchCode === 0) {
        return order.priceMaster?.mrp || 0;
      } else if (order.cLBatchCode === 1) {
        return order.stock[0]?.mrp;
      }
      return 0;
    } else {
      return 0;
    }
  };

  const handleProductSelection = (order) => {
    setSelectedProducts((prev) => {
      if (prev.includes(order.orderDetailId)) {
        return prev.filter((id) => id !== order.orderDetailId);
      }
      return [...prev, order.orderDetailId];
    });
  };
  const handleSelectAllProducts = (e) => {
    if (e.target.checked) {
      const allOrderIds = filteredProducts.map((order) => order.orderDetailId);
      setSelectedProducts(allOrderIds);
    } else {
      setSelectedProducts([]);
    }
  };
  const handleClickNext = () => {
    setCustomerId({
      companyId: selectedPatient?.CustomerMaster?.CompanyID,
      locationId: selectedPatient?.CustomerMaster?.CompanyID,
      customerId: selectedPatient?.CustomerMaster?.Id,
    });
    if (
      customerData?.data?.data?.CreditBilling === 1 &&
      parseFloat(customerData?.data?.data?.CustomerCreditLimit) <= 0
    ) {
      setShowConfirmModal(true);
    } else {
      setIsNextClicked(true);
    }
  };

  const validateBatchCodes = () => {
    return selectedProducts.every((orderDetailId) => {
      const orders = localProductData.filter(
        (item) => item.orderDetailId === orderDetailId
      );

      // All orders for this orderDetailId must be valid
      return orders.every(
        (order) =>
          !(
            order.productType === 3 &&
            order.cLBatchCode === 1 &&
            (!order.batchData || order.batchData.length === 0)
          )
      );
    });
  };

  const validateCLStockEntries = () => {
    return selectedProducts.every((orderDetailId) => {
      const orders = localProductData.filter(
        (item) => item.orderDetailId === orderDetailId
      );

      // All orders for this orderDetailId must be valid
      return orders.every(
        (order) =>
          !(
            order?.productType === 3 &&
            order?.cLBatchCode === 0 &&
            (!order?.stock || order?.stock.length === 0)
          )
      );
    });
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

  const totalAmount = selectedProducts.reduce((sum, orderDetailId) => {
    const orders = localProductData.filter(
      (item) => item.orderDetailId === orderDetailId
    );

    const productAmount = orders.reduce((batchSum, order) => {
      let amount = (order?.toBillQty || 0) * (order?.sellingPrice || 0);

      if (order.productType === 0 && order.fittingPrice) {
        const fittingPrice = parseFloat(order.fittingPrice) || 0;
        const fGst = parseFloat(order.fittingGSTPercentage) || 0;
        const totalF = fittingPrice * (fGst / 100) + fittingPrice;
        amount += totalF;
      }

      return batchSum + amount;
    }, 0);

    return sum + productAmount;
  }, 0);

  const totalAdvance = selectedProducts.reduce((sum, orderDetailId) => {
    const orders = localProductData.filter(
      (item) => item.orderDetailId === orderDetailId
    );
    return (
      sum +
      orders.reduce(
        (batchSum, order) => batchSum + (parseFloat(order?.advanceAmount) || 0),
        0
      )
    );
  }, 0);

  const totalQty = selectedProducts.reduce((sum, orderDetailId) => {
    const orders = localProductData.filter(
      (item) => item.orderDetailId === orderDetailId
    );
    return (
      sum +
      orders.reduce((batchSum, order) => batchSum + (order?.toBillQty || 0), 0)
    );
  }, 0);

  const totalGst = selectedProducts.reduce((sum, orderDetailId) => {
    const orders = localProductData.filter(
      (item) => item.orderDetailId === orderDetailId
    );

    const productGst = orders.reduce((batchSum, order) => {
      const gstInfo = calculateGST(
        (order?.toBillQty || 0) * (order?.sellingPrice || 0),
        order?.taxPercentage
      );

      let gstAmount = parseFloat(gstInfo.gstAmount || 0);

      if (
        order.productType === 0 &&
        order.fittingPrice &&
        order.fittingGSTPercentage
      ) {
        gstAmount +=
          parseFloat(order.fittingPrice) *
          (parseFloat(order.fittingGSTPercentage) / 100);
      }

      return batchSum + gstAmount;
    }, 0);

    return sum + productGst;
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
      toast.error(
        "Please add BatchCode details for the selected CL products to complete invoicing"
      );
      return;
    }
    if (!validateCLStockEntries()) {
      toast.error("Stock entry does not exist. Please do GRN first");
      return;
    }
    // Validate identifiers across all products, not just selected
    const identifiers = localProductData
      .map((x) => x.identifier)
      .filter(Boolean);

    for (const id of identifiers) {
      const groupItems = localProductData.filter((x) => x.identifier === id);
      const selectedGroupItems = groupItems.filter((x) =>
        selectedProducts.includes(x.orderDetailId)
      );

      if (
        selectedGroupItems.length > 0 &&
        selectedGroupItems.length < groupItems.length
      ) {
        // Find first missing item’s row number
        const missingItem = groupItems.find(
          (x) => !selectedProducts.includes(x.orderDetailId)
        );

        const idx = filteredProducts.findIndex(
          (x) => x.orderDetailId === missingItem.orderDetailId
        );
        if (idx === -1) {
          continue;
        }

        const missingIndex = idx + 1;

        if (groupItems.some((x) => x.productType === 1)) {
          // Frame + Lens case
          toast.error(
            `Frame in Item No ${missingIndex} should also be invoiced along with the lens`
          );
        } else {
          // Optical Lens split case
          toast.error(
            `Both the lens should be invoiced together (missing Item No ${missingIndex})`
          );
        }
        return;
      }
    }
    const payload = {
      CompanyId: customerId.companyId,
      TotalQty: totalQty,
      TotalGSTValue: totalGst,
      TotalValue: totalAmount,
      totalAdvance: totalBalance,
      advance: totalAdvance,
    };
    updatePaymentDetails(payload);
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
    updatePaymentDetails(payload);
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
        case "gift voucher":
          return "giftVoucher";
        default:
          return type.toLowerCase();
      }
    };
    fullPayments.forEach((payment) => {
      const typeKey = normalizeType(payment.Type || "");
      const amount = parseFloat(payment.Amount);
      if (isNaN(amount)) return;
      if (typeKey === "cash") {
        payments.cash = (payments.cash || 0) + amount;
        return;
      }
       if (typeKey === "advance") {
        if (!payments.advance) payments.advance = [];
        payments.advance.push({
          advanceId: payment.advanceId,
          amount: amount,
        });
        return;
      }

      if (typeKey === "giftVoucher") {
        if (!payments.giftVoucher) payments.giftVoucher = [];
        payments.giftVoucher.push({
          GVCode: payment.GVCode || null,
          amount: amount,
        });
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
        // case "giftVoucher":
        //   payments[typeKey].GVCode = payment.GVCode || null;
        //   break;
        // case "advance":
        //   payments[typeKey].CustomerAdvanceIDs =
        //     payment.CustomerAdvanceIDs || [];
        //   break;
        // case "advance":
        //   payments[typeKey].advanceId = payment.advanceId;
        //   break;
      }
    });
    return payments;
  };
  const handleGenerateInvoiceCreditYes = () => {
    if (
      selectedPatient.CustomerMaster.CreditBilling === 1 &&
      parseFloat(
        selectedPatient.CustomerMaster.CustomerCreditLimit.CreditLimitAvl
      ) < totalAmount
    ) {
      setShowConfirmInvoiceModal(true);
      return;
    } else {
      handleGenerateInvoice();
    }
  };

  const handleByPassCheck = () => {};

  const handleGenerateInvoice = async () => {
    if (!validateBatchCodes()) {
      toast.error(
        "Please add BatchCode details for the selected CL products to complete invoicing"
      );
      return;
    }
    if (!validateCLStockEntries()) {
      toast.error("Stock entry does not exist. Please do GRN first");
      return;
    }

    // Validate identifiers across all products, not just selected
    const identifiers = localProductData
      .map((x) => x.identifier)
      .filter(Boolean);

    for (const id of identifiers) {
      const groupItems = localProductData.filter((x) => x.identifier === id);
      const selectedGroupItems = groupItems.filter((x) =>
        selectedProducts.includes(x.orderDetailId)
      );

      if (
        selectedGroupItems.length > 0 &&
        selectedGroupItems.length < groupItems.length
      ) {
        // Find first missing item’s row number
        const missingItem = groupItems.find(
          (x) => !selectedProducts.includes(x.orderDetailId)
        );

        const idx = filteredProducts.findIndex(
          (x) => x.orderDetailId === missingItem.orderDetailId
        );
        if (idx === -1) {
          continue;
        }

        const missingIndex = idx + 1;

        if (groupItems.some((x) => x.productType === 1)) {
          // Frame + Lens case
          toast.error(
            `Frame in Item No ${missingIndex} should also be invoiced along with the lens`
          );
        } else {
          // Optical Lens split case
          toast.error(
            `Both the lens should be invoiced together (missing Item No ${missingIndex})`
          );
        }
        return;
      }
    }

    const filteredSelected = localProductData.filter((item) =>
      selectedProducts.includes(item.orderDetailId)
    );

    // const CL = localProductData.filter(
    //     (item) =>
    //       item.productType === 3 && selectedProducts.includes(item.orderDetailId)
    //   );

    //   const total = CL.reduce((sum, item) => sum + item.toBillQty, 0);
    const invoiceItems = filteredSelected.map((item) => ({
      orderDetailId: item.orderDetailId,
      batchCode: item.batchData[0]?.batchCode || null,
      toBillQty: item.toBillQty,
      srp: parseFloat(getPricing(item)),
      invoicePrice: parseFloat(item.sellingPrice) || null,
      discountedSellingPrice: parseFloat(item.discountedSellingPrice) || null,
      AdvanceAmountused: parseFloat(item.advanceAmount) || null,
    }));
    const payload = {
      invoiceItems,
      locationId: parseInt(hasMultipleLocations[0]),
      customerId: selectedPatient.CustomerMaster?.Id,
      patientId: selectedPatient?.Id,
      invoiceByMethod: 1,
      invoiceName: parseInt(billInTheName),
      invoiceRemarks: invoiceNote,
      totalQty: totalQty,
      totalGSTValue: totalGst,
      totalValue: totalAmount,
      // roundOff: 0.0,
      balanceAmount: totalAmount - totalAdvance,
      applicationUserId: user.Id,
      // bypassCreditCheck :
      creditBilling: selectedPatient?.CustomerMaster?.CreditBilling,
    };
    if (payload.creditBilling === 0) {
      payload.payments = preparePaymentsStructure();
    }

    //  customerData use this
    try {
      const response = await generateInvoice({ payload }).unwrap();
      const eInvoicePayload = {
        recordId: response?.invoicemainid ?? null,
        type: "invoice",
      };
      if (
        customerData?.data?.data?.TAXRegisteration === 1 &&
        EInvoiceEnable === 1 &&
        InvInvoiceEnable === 1
      ) {
        try {
          await createInvoice({
            companyId: parseInt(hasMultipleLocations[0]),
            userId: user.Id,
            payload: eInvoicePayload,
          }).unwrap();
        } catch (error) {
          console.log(error);
        }
      }
      toast.success(response?.message);
      setFullPayments([]);
      updatePaymentDetails(null);
      navigate("/invoice");
    } catch (error) {
      console.error(error);
      const errors = error?.data?.errors;
      if (errors?.length > 0) {
        errors.forEach((err) => toast.error(err));
      }
    }
  };
  return (
    <div className="max-w-8xl">
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
                        customerData?.data?.data?.CustomerCreditLimit
                          .CreditLimitAvl
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
              <Button onClick={handleClickNext}>Select & Next</Button>
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
                data={filteredProducts}
                renderHeader={(column) => {
                  if (column === "Select") {
                    const allSelected =
                      filteredProducts?.length > 0 &&
                      selectedProducts.length === filteredProducts.length;
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
                renderRow={(order, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(order.orderDetailId)} // Use orderDetailId instead of index
                        onChange={() => handleProductSelection(order)} // Remove unused index parameter
                        className="h-5 w-5"
                        disabled={
                          (selectedProducts.includes(order.orderDetailId) &&
                            order.batchData.length > 0) ||
                          fullPayments?.length > 0
                        }
                      />
                    </TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{`${order.orderPrefix}/${order.orderNo}/${order.slNo}`}</TableCell>
                    <TableCell>{getShortTypeName(order.productType)}</TableCell>
                    <TableCell>
                      <div className="whitespace-pre-wrap">
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
                      {editMode[order.orderDetailId]?.sellingPrice ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              editValues[order.orderDetailId]?.sellingPrice ||
                              ""
                            }
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                [order.orderDetailId]: {
                                  ...prev[order.orderDetailId],
                                  sellingPrice: e.target.value,
                                },
                              }))
                            }
                            onKeyPress={(e) =>
                              handleKeyPress(e, order.orderDetailId)
                            } // Update this if handleKeyPress is defined
                            className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              saveEdit(order.orderDetailId, "sellingPrice")
                            }
                            className="text-neutral-400 transition"
                            title="Save"
                          >
                            <FiCheck size={18} />
                          </button>
                          <button
                            onClick={() =>
                              cancelEdit(order.orderDetailId, "sellingPrice")
                            }
                            className="text-neutral-400 transition"
                            title="Cancel"
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          ₹{formatINR(order.sellingPrice) || 0}
                          {companySettings?.data?.data?.EditInvoicePrice ===
                            1 && (
                            <button
                              onClick={() =>
                                toggleEditMode(
                                  order.orderDetailId,
                                  "sellingPrice"
                                )
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
                    <TableCell className="text-center">
                      {order.orderQty}
                    </TableCell>
                    <TableCell className="text-center">
                      {order.toBillQty}
                    </TableCell>
                    <TableCell className="text-center">
                      {getAvalQty(order)}
                    </TableCell>
                    <TableCell>
                      {formatINR(
                        order.toBillQty * order.sellingPrice +
                          (order.productType === 0
                            ? parseFloat(order.fittingPrice) *
                                parseFloat(order.fittingGSTPercentage / 100) +
                              parseFloat(order.fittingPrice)
                            : 0)
                      )}
                    </TableCell>

                    <TableCell>
                      ₹{formatINR(order.advanceAmount) || 0}
                    </TableCell>
                    <TableCell>
                      ₹
                      {formatINR(
                        order.toBillQty * order.sellingPrice +
                          (order.productType === 0
                            ? parseFloat(
                                parseFloat(order.fittingPrice) *
                                  parseFloat(order.fittingGSTPercentage / 100) +
                                  parseFloat(order.fittingPrice) || 0
                              )
                            : 0) -
                          (order.advanceAmount || 0),
                        true
                      )}
                    </TableCell>

                    <TableCell>
                      {order.productType === 3 &&
                        order.cLBatchCode === 1 &&
                        !order.batchData?.length &&
                        selectedProducts.includes(order.orderDetailId) && (
                          <button
                            onClick={() => handleGetBatches(order, index)}
                            className="bg-black hover:bg-primary-600 text-white py-2 px-4 rounded transition-colors duration-200 flex items-center gap-2 shadow-sm hover:shadow-md text-sm font-medium"
                          >
                            <div className="flex items-center gap-2">
                              <FiPlus className="text-base" />
                              Batch Code
                            </div>
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
              {fullPayments?.length > 0 && !collectPayment && (
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
                selectedPatient={selectedPatient}
                companyId={parseInt(hasMultipleLocations[0])}
              />

              <div className="flex justify-end mt-4 gap-2">
                {selectedProducts.length > 0 && (
                  <div className="flex gap-10">
                    <div className="flex gap-3">
                      <span className="text-xl font-semibold items-center">
                        Total Qty: {totalQty}
                      </span>
                      <span className="text-xl font-semibold items-center">
                        Total GST: ₹{formatINR(totalGst)}
                      </span>
                    </div>
                    <div>
                      <div className="flex flex-col gap-3">
                        <span className="text-xl font-semibold items-center">
                          Total Amount: ₹{formatINR(totalAmount)}
                        </span>
                        <span className="text-xl font-semibold items-center">
                          Total Advance: ₹{formatINR(totalAdvance)}
                        </span>
                        <span className="text-xl font-semibold items-center">
                          Total Balance: ₹{formatINR(totalBalance, true)}
                        </span>
                      </div>
                      <div className="mt-5">
                        {selectedPatient?.CustomerMaster?.CreditBilling === 0 &&
                          parseFloat(totalBalance.toFixed(2)) > 0 && (
                            <Button onClick={handleCollectPayment}>
                              Collect Payment
                            </Button>
                          )}
                        {(parseFloat(totalBalance.toFixed(2)) === 0 ||
                          selectedPatient?.CustomerMaster?.CreditBilling ===
                            1) && (
                          <Button
                            onClick={handleGenerateInvoiceCreditYes}
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
          <ConfirmationModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={() => {
              setIsNextClicked(true);
              setShowConfirmModal(false);
            }}
            title="Credit Limit Warning!"
            message="Sufficient Credit Limit is not available for the customer. Do you wish to continue?"
            confirmText="Yes, Proceed"
            cancelText="Cancel"
            danger={false}
          />
          <ConfirmationModal
            isOpen={showConfirmModalInvoice}
            onClose={() => setShowConfirmInvoiceModal(false)}
            onConfirm={() => {
              setShowConfirmInvoiceModal(false);
              handleGenerateInvoice();
            }}
            title="Credit Limit Warning!"
            message="Sufficient Credit Limit is not available for the customer. Do you wish to continue?"
            confirmText="Yes, Proceed"
            cancelText="Cancel"
            danger={false}
          />
          <ConfirmationModal
            isOpen={showByPassCheck}
            onClose={() => setShowByPassModal(false)}
            onConfirm={() => {
              setShowByPassModal(false);
              handleGenerateInvoice();
            }}
            title="Credit Check!"
            message={`There are invoices which have crossed ${creditDays} days. Do you still wish to continue?`}
            confirmText="Yes, Proceed"
            cancelText="Cancel"
            danger={false}
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
    const matchedBatch = batchDetails?.batches?.find(
      (item) => item.CLBatchBarCode === barcode
    );
    const totalBatchQty =
      batchData.batchData.reduce(
        (sum, item) => sum + Number(item.toBillQty),
        0
      ) + Number(toBillQty);

    if (!matchedBatch) {
      toast.error("Invalid batch selected");
      return;
    }
    if (Number(toBillQty) > Number(avlQty)) {
      toast.error("To Bill Qty cannot be greater than Available Qty");
      return;
    }
    if (Number(totalBatchQty) > Number(selectedOrder?.toBillQty)) {
      toast.error("Total To Bill Qty cannot exceed the selected To Bill Qty");
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
          toBillQty: Number(toBillQty),
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
    if (Number(totalBatchQty) !== Number(selectedOrder?.toBillQty)) {
      toast.error("Total To Bill Qty must equal the selected To Bill Qty");
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
        // remove the old entry for this orderDetailId
        const filtered = prev.filter(
          (item) => item.orderDetailId !== selectedOrder.orderDetailId
        );

        // create multiple product entries from response
        const newProducts = response.map((batch) => ({
          ...selectedOrder,
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
          batchCode: batch.BatchCode,
          batchBarCode: batch.BatchBarCode,
          expiry: batch.Expiry,
          mrp: batch.MRP,
          sellingPrice: batch.DiscountedSellingPrice,
          discountedSellingPrice: batch.DiscountedSellingPrice,
          availableQty: batch.AvailableQty,
          toBillQty: batch.ToBillQty,
          rowTotal: batch.RowTotal,
          advanceAmount: batch.AdvanceUsed,
        }));

        return [...filtered, ...newProducts];
      });

      toast.success("Batch details added successfully");
      setBatchData({
        isBatchSelectorEnter: 0,
        batchCode: null,
        barcode: null,
        expiryDate: null,
        avlQty: null,
        toBillQty: 1,
        batchData: [],
      });
      onClose();
    } catch (error) {
      console.error("Error saving batch details:", error);
      toast.error(error.message || "Failed to save batch details");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <h4>Total To Bill Qty: {selectedOrder?.toBillQty}</h4>
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
                  {batchDetails?.batches?.find(
                    (b) => b.CLBatchBarCode === batchData.barcode
                  )?.CLMRP || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Selling Price:</span> ₹
                  {batchDetails?.batches?.find(
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

const PaymentDetails = ({
  isOpen,
  onClose,
  collectPayment,
  selectedPatient,
  companyId,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} width="max-w-5xl">
      <PaymentFlow
        collectPayment={collectPayment}
        onClose={onClose}
        selectedPatient={selectedPatient}
        companyId={companyId}
      />
    </Modal>
  );
};

export default CustomerSelect;
