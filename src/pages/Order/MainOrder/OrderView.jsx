import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  useCancelOrderMutation,
  useGenerateInvoiceFromOrderMutation,
  useGetOrderViewByIdQuery,
  useGetSavedOrderDetailsQuery,
  useItemCancelMutation,
  useLazyGenerateOpticalLensReceiptQuery,
  useLazyGetAdvanceAmtQuery,
  useLazyGetOLOrderDataQuery,
  useLazyPrintPdfQuery,
  useUpdateOLOrderDataMutation,
} from "../../../api/orderApi";
import { useOrder } from "../../../features/OrderContext";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { FiEye, FiFileText, FiPrinter, FiTrash2, FiX } from "react-icons/fi";
import { format } from "date-fns";
import Button from "../../../components/ui/Button";
import Loader from "../../../components/ui/Loader";
import { formatINR } from "../../../utils/formatINR";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { ErrorDisplayModal } from "../../../components/ErrorsDisplay";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import HasPermission from "../../../components/HasPermission";
import Modal from "../../../components/ui/Modal";
import OTPScreen from "../../../components/OTPScreen";
import { getErrorMessage } from "../../../utils/helpers";
import { motion, AnimatePresence } from "framer-motion";
import { EyeIcon } from "lucide-react";

// 0- Order Placed  1- GRN Done 2- Partial Invoice 3- Invoice Completed 4- Cancelled 5- PO Raised 6- Stock Allocation Done for OL
export const getOrderStatus = (statusCode) => {
  const statusMap = {
    0: "Order Placed",
    1: "GRN Done",
    2: "Partial Invoice",
    3: "Invoice Completed",
    4: "Cancelled",
    5: "PO Raised",
    6: "Stock Allocation Done for OL",
  };

  return statusMap[statusCode] || "Unknown Status";
};

const OrderView = ({ isFamily = false, orderFamilyId }) => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { calculateGST } = useOrder();
  const { user, hasMultipleLocations } = useSelector((state) => state.auth);
  const params = new URLSearchParams(search);
  const isViewPage = location.pathname.includes("/view");
  const orderId = params.get("orderId");
  const effectiveOrderId = orderId || orderFamilyId;

  const [errors, setErrors] = useState(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState(null);
  const [isCancelOrder, setIsCancelOrder] = useState(false);
  const [generalWarning, setGeneralWarning] = useState(false);
  const [openInvoiceWarning, setOpenInvoiceWarning] = useState(false);
  const [InvoiceWarnings, setInvoiceWarnings] = useState([]);

  const [olOrderDataInfo, setOlOrderDateInfo] = useState([]);
  const [olOrderDataInfoModel, setOLOrderDataInfoModel] = useState(false);


  const [printingId, setPrintingId] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [byPassInvoice, setByPassInvoice] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [showOtpOrder, setShowOtpOrder] = useState(false);

  const [otpValue, setOtpValue] = useState(null);
  const [selectedDiscountItem, setSelectedDiscountItem] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [CancelOrderConfirmWarning, setIsCancelOrderConfirmWarning] =
    useState(false);
  const [CancelItemConfirmWarning, setIsCancelItemConfirmWarning] =
    useState(false);
  const [generateInvoiceWarning, setIsGenerateInvoiceWarning] = useState(false);

  const { data: orderDetails, isLoading } = useGetSavedOrderDetailsQuery(
    { orderId: effectiveOrderId },
    { skip: !effectiveOrderId }
  );
  const { data: customerDataById, isLoading: isViewLoading } =
    useGetOrderViewByIdQuery({ id: effectiveOrderId });
  const [cancelItem, { isLoading: isItemCancelling }] = useItemCancelMutation();
  const [cancelOrder, { isLoading: isOrderCancelling }] =
    useCancelOrderMutation();
  const [generateInvoice, { isLoading: isInvoiceGenerating }] =
    useGenerateInvoiceFromOrderMutation();
  const [getAdvanceAmt, { isFetching: isAdvanceFetching }] =
    useLazyGetAdvanceAmtQuery();
  const [generateOLPrint, { isFetching: isPrinting }] =
    useLazyGenerateOpticalLensReceiptQuery();

  const [generatePrint, { isFetching: isPrintingPdf }] = useLazyPrintPdfQuery();

  const getTypeName = (id) => {
    const types = { 1: "F/S", 2: "ACC", 3: "CL" };
    return types[id] || "OL";
  };

  const [getOLOrderData, { isError, data, error }] =
    useLazyGetOLOrderDataQuery();

  const [triggerOLDetailsUpdate] = useUpdateOLOrderDataMutation();

  const [isUpdating, setIsUpdating] = useState(false);

  console.log("olOrderDataInfo?.data?.", olOrderDataInfo);
  // State for editable fields
  const [formData, setFormData] = useState({
    ConsumerCard: "",
    Engraving: "",
    DOB: null,
    PantoAngle: "",
    BowAngle: "",
    FrameFit: "",
    DistanceNear: "",
    RPD: "",
    RVH: "",
    RBVD: "",
    LPD: "",
    LVH: "",
    LBVD: "",
    RET: "",
    RCT: "",
    ROptima: "",
    LET: "",
    LCT: "",
    LOptima: "",
    FrameLength: "",
    FrameHeight: "",
    FrameDBL: "",
    RightSphericalPower: "",
    RightCylinderPower: "",
    RightAxis: "",
    RightAddition: "",
    LeftSphericalPower: "",
    LeftCylinderPower: "",
    LeftAxis: "",
    LeftAddition: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    if (date === null || date === "") {
      // Set to null for database
      setFormData(prev => ({
        ...prev,
        DOB: null
      }));
    } else {
      // Format valid date
      const formattedDate = format(date, 'yyyy-MM-dd');
      setFormData(prev => ({
        ...prev,
        DOB: formattedDate
      }));
    }
  };

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      console.log("formData -- update", formData);
      console.log("olOrderDataInfo -- update", olOrderDataInfo);

      // Call your update API here
      await triggerOLDetailsUpdate({
        orderDetailId: olOrderDataInfo?.OrderDetailsId,
        ...formData
      }).unwrap();

      // For now, just show success message
      toast.success("Additional lens details updated successfully!");

      // Close modal after successful update
      setOLOrderDataInfoModel(false);
      setOlOrderDateInfo([]);
    } catch (error) {
      console.error('Update error:', error);
      toast.error("Failed to update additional lens details");
    } finally {
      setIsUpdating(false);
    }
  };

  // Update the handleOrderDetailsView function to set formData
  const handleOrderDetailsView = async (item) => {
    setOlOrderDateInfo([]);
    setOLOrderDataInfoModel(true);

    console.log("mabdka item - ", item);
    try {
      const olOrderData = await getOLOrderData(item.OrderDetailId).unwrap();

      if (!olOrderData || (Array.isArray(olOrderData) && olOrderData.length === 0)) {
        toast.error('No data found for this Order details.');
        setOlOrderDateInfo([]);
      } else {
        setOlOrderDateInfo(olOrderData.data);
        setFormData({
          ConsumerCard: olOrderData.data?.ConsumerCard || "",
          Engraving: olOrderData.data?.Engraving || "",
          DOB: olOrderData.data?.DOB || null,
          PantoAngle: olOrderData.data?.PantoAngle || "",
          BowAngle: olOrderData.data?.BowAngle || "",
          FrameFit: olOrderData.data?.FrameFit || "",
          DistanceNear: olOrderData.data?.DistanceNear || "",
          RPD: olOrderData.data?.RPD || "",
          RVH: olOrderData.data?.RVH || "",
          RBVD: olOrderData.data?.RBVD || "",
          LPD: olOrderData.data?.LPD || "",
          LVH: olOrderData.data?.LVH || "",
          LBVD: olOrderData.data?.LBVD || "",
          RET: olOrderData.data?.RET || "",
          RCT: olOrderData.data?.RCT || "",
          ROptima: olOrderData.data?.ROptima || "",
          LET: olOrderData.data?.LET || "",
          LCT: olOrderData.data?.LCT || "",
          LOptima: olOrderData.data?.LOptima || "",
          FrameLength: olOrderData.data?.FrameLength || "",
          FrameHeight: olOrderData.data?.FrameHeight || "",
          FrameDBL: olOrderData.data?.FrameDBL || "",
          RightSphericalPower: olOrderData.data?.RightSphericalPower || "",
          RightCylinderPower: olOrderData.data?.RightCylinderPower || "",
          RightAxis: olOrderData.data?.RightAxis || "",
          RightAddition: olOrderData.data?.RightAddition || "",
          LeftSphericalPower: olOrderData.data?.LeftSphericalPower || "",
          LeftCylinderPower: olOrderData.data?.LeftCylinderPower || "",
          LeftAxis: olOrderData.data?.LeftAxis || "",
          LeftAddition: olOrderData.data?.LeftAddition || "",
        });
        toast.success('Order details loaded successfully.');
      }
    } catch (err) {
      console.error('OL order fetch error:', err);
      toast.error(
        err?.data?.message ||
        'Unable to load optical lens data. Please try again later.'
      );
      setOlOrderDateInfo([]);
    }
  };

  const formatValue = (val) =>
    val !== null && val !== undefined && val !== "" ? val : "N/A";

  const getProductName = (item) => {
    const {
      typeid,
      ProductName,
      Size,
      Barcode,
      PatientName,
      PowerSpecs,
      Variation,
      Specs,
      Colour,
      Category,
      Tint,
      AddOns,
      FittingPrice,
    } = item;

    const clean = (val) => {
      if (
        val === null ||
        val === undefined ||
        val === "undefined" ||
        val === "null" ||
        val === "N/A"
      ) {
        return "";
      }
      return val;
    };

    const formatPowerValue = (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return val;
      return num > 0 ? `+${val}` : val;
    };

    // For Frame (typeid = 1)
    if (typeid === 1) {
      const lines = [
        ProductName,
        Size ? `Size: ${Size}` : "",
        Category === 0 ? "Category: Optical Frame" : "Category: Sunglasses",
        Barcode ? `Barcode: ${Barcode}` : "",
        PatientName ? `Patient Name: ${PatientName}` : "",
      ];
      return lines.filter(Boolean).join("\n");
    }

    // For Accessories (typeid = 2)
    if (typeid === 2) {
      const lines = [
        ProductName,
        Variation ? `Variation: ${Variation}` : "",
        Barcode ? `Barcode: ${Barcode}` : "",
        PatientName ? `Patient Name: ${PatientName}` : "",
      ];
      return lines.filter(Boolean).join("\n");
    }

    // For Contact Lens (typeid = 3)
    if (typeid === 3) {
      const specs = PowerSpecs
        ? PowerSpecs.split(",")
          .map((s) => {
            const [key, val] = s.split(":");
            const cleanedValue =
              val && !["null", "undefined"].includes(val.trim())
                ? formatPowerValue(val.trim())
                : "";
            return cleanedValue ? `${key.trim()}: ${cleanedValue}` : "";
          })
          .filter(Boolean)
          .join(", ")
        : "";

      const lines = [
        ProductName,
        specs,
        clean(Colour) ? `Colour: ${Colour}` : "",
        Barcode ? `Barcode: ${Barcode}` : "",
        PatientName ? `Patient Name: ${PatientName}` : "",
      ];
      return lines.filter(Boolean).join("\n");
    }

    // For Optical Lens (typeid = 0)
    if (typeid === 0) {
      const tintName = clean(Tint?.name);
      const addOns = AddOns?.map((a) => clean(a.name)).filter(Boolean);

      const specsLines = (Specs || [])
        .map((spec) => {
          const side = clean(spec.side);
          const sph = clean(spec.sph);
          const cyl = clean(spec.cyl);
          const axis = clean(spec.axis);
          const addition = clean(spec.addition);

          const powerValues = [];
          if (sph) powerValues.push(`SPH ${formatPowerValue(sph)}`);
          if (cyl) powerValues.push(`CYL ${formatPowerValue(cyl)}`);
          if (axis) powerValues.push(`Axis ${formatPowerValue(axis)}`);
          if (addition) powerValues.push(`Add ${formatPowerValue(addition)}`);

          return powerValues.length ? `${side}: ${powerValues.join(", ")}` : "";
        })
        .filter(Boolean)
        .join("\n");

      const lines = [
        clean(ProductName),
        specsLines,
        tintName ? `Tint: ${tintName}` : "",
        addOns?.length > 0 ? `AddOn: ${addOns.join(", ")}` : "",
        clean(FittingPrice) ? `Fitting Price: ${FittingPrice}` : "",
        PatientName ? `Patient Name: ${clean(PatientName)}` : "",
      ];

      return lines.filter(Boolean).join("\n");
    }

    return "";
  };

  const totalQty = orderDetails?.reduce(
    (sum, item) => sum + (parseInt(item.OrderQty) || 0),
    0
  );

  const totalGST = orderDetails?.reduce((sum, item) => {
    const gstInfo = calculateGST(
      parseFloat(item.DiscountedSellingPrice * item.OrderQty),
      item.TaxPercentage
    );

    const fittingPrice = parseFloat(item.FittingPrice || 0);
    const fittingGst = parseFloat(item.FittingGSTPercentage || 0);
    const totalFitting = fittingPrice * (fittingGst / 100);

    return sum + totalFitting + (parseFloat(gstInfo.gstAmount) || 0);
  }, 0);

  const grandTotal = orderDetails?.reduce((sum, item) => {
    const price = parseFloat(item.Total || 0);
    const fittingPrice = parseFloat(item.FittingPrice || 0);
    const fittingGst = parseFloat(item.FittingGSTPercentage || 0);
    const totalFitting = fittingPrice * (fittingGst / 100);

    const fittingPlusPrice = totalFitting + price + fittingPrice;

    return sum + (fittingPlusPrice || 0);
  }, 0);

  const advanceAmount = orderDetails?.reduce(
    (sum, item) => sum + (parseFloat(item.AdvanceAmount) || 0),
    0
  );
  const balanceAmount = grandTotal - advanceAmount;

  const handleConfirmWarnings = async () => {
    try {
      const payload = {
        proceedAfterWarnings: true,
        applicationUserId: user.Id,
      };
      if (otpValue) {
        payload.otp = otpValue;
      }
      const res = await cancelItem({ id: selectedItemId, payload }).unwrap();
      toast.success("Item cancelled successfully");
      setSelectedItemId(null);
      setIsWarningOpen(false);
      setIsCancelItemConfirmWarning(false);
      setWarningMessage("");
      setShowOtp(false);
    } catch (error) {
      console.log(error);
    }
  };
  const handleConfirmWarningsForOrder = async () => {
    try {
      const payload = {
        proceedAfterWarnings: true,
        applicationUserId: user.Id,
      };
      if (otpValue) {
        payload.otp = otpValue;
      }
      const res = await cancelOrder({
        id: parseInt(effectiveOrderId),
        payload,
      }).unwrap();
      toast.success("Order cancelled successfully");
      setSelectedItemId(null);
      setIsCancelOrder(false);
      setWarningMessage("");
      setIsCancelOrderConfirmWarning(false);
      setShowOtpOrder(false);
    } catch (error) {
      console.log(error);
      toast.error(getErrorMessage(error));
    }
  };
  const handleCancelItem = async () => {
    try {
      const payload = {
        proceedAfterWarnings: false,
        applicationUserId: user.Id,
      };

      const res = await cancelItem({ id: selectedItemId, payload }).unwrap();

      if (res?.otpRequired) {
        setSelectedDiscountItem(selectedItemId);
        setIsCancelItemConfirmWarning(false);
        setShowOtp(true);
        return;
      }
      if (res?.status == "warning") {
        setWarningMessage(res?.warnings[0]);
        setIsCancelItemConfirmWarning(false);
        setIsWarningOpen(true);
      }
      setIsCancelItemConfirmWarning(false);
      toast.success("Item Cancelled Successfully!");
    } catch (error) {
      console.log(error);
      toast.error(error?.data?.message || "Item already cancelled");
    }
  };
  const handleCancelOrder = async () => {
    setSelectedItemId(effectiveOrderId);

    try {
      const payload = {
        proceedAfterWarnings: false,
        applicationUserId: user.Id,
      };

      const res = await cancelOrder({
        id: parseInt(effectiveOrderId),
        payload,
      }).unwrap();
      if (res?.otpRequired) {
        setSelectedDiscountItem(effectiveOrderId);
        setIsCancelOrderConfirmWarning(false);
        setShowOtpOrder(true);
        return;
      }
      if (res?.status == "warning") {
        setWarningMessage(res?.warnings[0]);
        setIsCancelOrderConfirmWarning(false);
        setIsCancelOrder(true);

        return;
      }
      setIsCancelOrderConfirmWarning(false);
      toast.success("Order cancelled successfully");
    } catch (error) {
      console.log(error);
      toast.error(error?.data?.message || "Order already cancelled");
      setIsCancelOrderConfirmWarning(false);
    }
  };
  const handleGenerateInvoiceConfirm = async (order) => {
    const discountedSellingPrice =
      parseFloat(order?.DiscountedSellingPrice) || 0;
    const orderQty = parseFloat(order?.OrderQty) || 0;
    const fittingPrice = parseFloat(order?.FittingPrice) || 0;
    const fittingGST = parseFloat(order?.FittingGSTPercentage) || 0;
    const advance = parseFloat(order?.AdvanceAmount) || 0;

    const totalFittingGST = fittingPrice * (fittingGST / 100);
    const totalvalue =
      discountedSellingPrice * orderQty + totalFittingGST + fittingPrice;
    const payload = {
      invoiceItems: [
        {
          orderDetailId: order.OrderDetailId,
          batchCode: null,
          toBillQty: order.OrderQty,
          srp: 0,
          discountedSellingPrice: order.DiscountedSellingPrice,
          invoicePrice: order.DiscountedSellingPrice,
          AdvanceAmountused: order.AdvanceAmount || 0,
        },
      ],
      locationId: parseInt(hasMultipleLocations[0]),
      customerId: customerDataById?.data.data?.CustomerMaster?.Id,
      patientId: customerDataById?.data.data?.PatientID,

      invoiceByMethod: 1,
      invoiceName: 0,
      invoiceRemarks: null,
      totalQty: order.OrderQty,
      totalGSTValue: parseFloat(
        calculateGST(
          parseFloat(order.DiscountedSellingPrice),
          parseFloat(order.TaxPercentage)
        ).gstAmount
      ),
      totalValue: totalvalue,
      // roundOff: 0.0,

      applicationUserId: user.Id,
      balanceAmount: 0,
      bypassCreditCheck: true,
      creditBilling:
        customerDataById?.data.data?.CustomerMaster?.CreditBilling === 1, // true or false
    };

    try {
      const res = await generateInvoice({ payload }).unwrap();
      // if()
      toast.success("Invoice Generated successfully!");
      setSelectedOrder(null);
      setIsGenerateInvoiceWarning(false);
      setOpenInvoiceWarning(false);
    } catch (error) {
      console.log(error);
      setErrors(
        Array.isArray(error?.data?.validationErrors)
          ? error?.data?.validationErrors
          : typeof errors === "string"
            ? [error?.data?.validationErrors]
            : []
      );
      setIsGenerateInvoiceWarning(false);
      setErrorModalOpen(true);
      setOpenInvoiceWarning(false);
      return;
    }
  };
  const handleGenerateInvoice = async (order) => {
    setSelectedOrder(order);
    const discountedSellingPrice =
      parseFloat(order?.DiscountedSellingPrice) || 0;
    const orderQty = parseFloat(order?.OrderQty) || 0;
    const fittingPrice = parseFloat(order?.FittingPrice) || 0;
    const fittingGST = parseFloat(order?.FittingGSTPercentage) || 0;
    const advance = parseFloat(order?.AdvanceAmount) || 0;

    const totalFittingGST = fittingPrice * (fittingGST / 100);
    const totalvalue =
      discountedSellingPrice * orderQty + totalFittingGST + fittingPrice;
    const payload = {
      invoiceItems: [
        {
          orderDetailId: order.OrderDetailId,
          batchCode: null,
          toBillQty: order.OrderQty,
          srp: 0,
          discountedSellingPrice: order.DiscountedSellingPrice,
          invoicePrice: order.DiscountedSellingPrice,
          AdvanceAmountused: order.AdvanceAmount || 0,
        },
      ],
      locationId: parseInt(hasMultipleLocations[0]),
      customerId: customerDataById?.data.data?.CustomerMaster?.Id,
      patientId: customerDataById?.data.data?.PatientID,

      invoiceByMethod: 1,
      invoiceName: 0,
      invoiceRemarks: null,
      totalQty: order.OrderQty,
      totalGSTValue: parseFloat(
        calculateGST(
          parseFloat(order.DiscountedSellingPrice),
          parseFloat(order.TaxPercentage)
        ).gstAmount
      ),
      totalValue: totalvalue,
      // roundOff: 0.0,

      applicationUserId: user.Id,
      balanceAmount: 0,
      bypassCreditCheck: false,
      creditBilling:
        customerDataById?.data.data?.CustomerMaster?.CreditBilling === 1, // true or false
    };

    try {
      const res = await generateInvoice({ payload }).unwrap();
      console.log(res);
      if (res?.warning) {
        setIsGenerateInvoiceWarning(false);
        setInvoiceWarnings(res?.warnings || []);
        setOpenInvoiceWarning(true);
        return;
      }
      toast.success("Invoice Generated successfully!");
      setIsGenerateInvoiceWarning(false);
      setSelectedOrder(null);
    } catch (error) {
      setErrors(
        Array.isArray(error?.data?.validationErrors)
          ? error?.data?.validationErrors
          : typeof errors === "string"
            ? [error?.data?.validationErrors]
            : []
      );
      setIsGenerateInvoiceWarning(false);
      setErrorModalOpen(true);
      setSelectedOrder(null);
      setOpenInvoiceWarning(false);

      return;
    }
  };
  const getOrderMainStatus = (status) => {
    const types = {
      1: "Confirmed",
      2: "Partially Invoiced",
      3: "Invoiced",
      4: "Cancelled",
    };
    return types[status] || "Draft";
  };
  const handleOtpComplete = (otp) => {
    setOtpValue(otp);
  };

  const columns = [
    "S.No",
    "Type",
    "Product name",
    "Qty",
    "Rate",
    "Discount",
    "GST",
  ];

  if (
    Number(customerDataById?.data?.data?.CustomerMaster?.CreditBilling) === 0
  ) {
    columns.push("Advance Amount", "Balance Amount");
  }

  columns.push("Total", "Status");
  if (!isFamily) {
    columns.push("Action");
  }

  const handlePrintPdf = async (item) => {
    setPrintingId(item.id);

    try {
      const blob = await generatePrint({
        effectiveOrderId: item.Id,
      }).unwrap();

      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `OrderConfirmation_${item.OrderNo} (${item.OrderPrefix}/${item.OrderNo}).pdf`;
      document.body.appendChild(link);
      link.click();
      // clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error);
      toast.error(
        "Unable to print the order please try again after some time!"
      );
    } finally {
      setPrintingId(null);
    }
  };

  const handlePrint = async (item) => {
    setPrintingId(item.OrderDetailId);

    try {
      const blob = await generateOLPrint({
        orderDetailid: item.OrderDetailId,
        companyId: parseInt(hasMultipleLocations[0]),
      }).unwrap();

      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" })
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = `JobOrder_${item.SlNo} (${customerDataById?.data.data?.OrderPrefix}/${customerDataById?.data.data?.OrderNo}/OrderDEtailSlNo).pdf`;
      document.body.appendChild(link);
      link.click();
      // clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error);
      toast.error(
        "Unable to print the optical lens please try again after some time!"
      );
    } finally {
      setPrintingId(null);
    }
  };

  // console.log("dd",selectedDiscountItem)
  if (isViewLoading || isLoading) {
    return (
      <div>
        <Loader color="black" />
      </div>
    );
  }
  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-5">
          <div className="text-neutral-800 text-2xl font-semibold">
            Order Details
          </div>
          <div className="flex items-center gap-3">
            {orderDetails?.every((item) => item.Status !== 4) &&
              !isFamily &&
              customerDataById?.data.data?.Status !== 4 && (
                <HasPermission module="Order" action={["deactivate"]}>
                  <Button
                    variant="danger"
                    onClick={() => setIsCancelOrderConfirmWarning(true)}
                    size="md"
                    isLoading={isOrderCancelling}
                    disabled={isOrderCancelling || isItemCancelling}
                    className="opacity-70"
                  >
                    Cancel Order
                  </Button>
                </HasPermission>
              )}

            {!isFamily && (
              <Button variant="outline" onClick={() => navigate("/order")}>
                Back
              </Button>
            )}
            {!isFamily && (
              <Button
                onClick={() => handlePrintPdf(customerDataById?.data.data)}
                icon={FiPrinter}
                isLoading={printingId == customerDataById?.data.data.Id}
              ></Button>
            )}
          </div>
        </div>
        {/* Order Details */}
        <div className="grid grid-cols-3 gap-3">
          <Info
            label="Order No"
            value={`${customerDataById?.data.data.OrderPrefix}/${customerDataById?.data.data.OrderNo}`}
          />
          <Info
            label="Order Date"
            value={
              customerDataById?.data.data?.OrderPlacedDate
                ? format(
                  new Date(customerDataById?.data.data?.OrderPlacedDate),
                  "dd/MM/yyyy"
                )
                : ""
            }
          />

          <Info
            label="Status"
            value={getOrderMainStatus(customerDataById?.data.data?.Status)}
          />
          <Info
            label="Customer Name"
            value={customerDataById?.data.data?.CustomerMaster?.CustomerName}
          />
          <Info
            label="Customer No"
            value={customerDataById?.data.data?.CustomerMaster?.MobNumber}
          />
          {customerDataById?.data.data?.CustomerMaster?.BillAddress1 && (
            <Info
              label="Customer Address"
              value={
                (customerDataById?.data.data?.CustomerMaster?.BillAddress1 ||
                  customerDataById?.data.data?.CustomerMaster?.BillAddress2) &&
                customerDataById?.data.data?.CustomerMaster?.BillCity &&
                `${customerDataById?.data.data?.CustomerMaster?.BillAddress1 ??
                ""
                } ${customerDataById?.data.data?.CustomerMaster?.BillAddress2 ??
                ""
                } ${customerDataById?.data.data?.CustomerMaster?.BillCity ?? ""
                }`
              }
            />
          )}
          <Info
            label="Sales Person"
            value={customerDataById?.data.data?.SalesPerson?.PersonName}
          />
          <Info
            label="Order Reference"
            value={customerDataById?.data.data?.OrderReference || "N/A"}
          />
        </div>

        {/* Product Table */}
        <div className="mt-10">
          <Table
            freeze={true}
            expand={true}
            name="Product name"
            columns={columns}
            data={orderDetails}
            renderRow={(order, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{getTypeName(order?.typeid)}</TableCell>
                <TableCell className="">
                  <div className="whitespace-pre-wrap">
                    {getProductName(order)}
                  </div>
                </TableCell>
                <TableCell>{formatValue(order?.OrderQty)}</TableCell>
                <TableCell>₹{formatINR(order?.Rate)}</TableCell>
                <TableCell>
                  <div className="flex flex-col items-center">
                    <div>
                      ₹{order?.DiscountValue ? `${order.DiscountValue}` : 0}
                    </div>
                    <div>({order.DiscountPercentage || 0}%)</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex  flex-col">
                    <div>
                      ₹
                      {formatINR(
                        parseFloat(
                          calculateGST(
                            parseFloat(order.DiscountedSellingPrice),
                            parseFloat(order.TaxPercentage)
                          ).gstAmount
                        )
                      )}
                    </div>
                    <div>({order.TaxPercentage}%)</div>
                  </div>
                </TableCell>
                {customerDataById?.data?.data?.CustomerMaster?.CreditBilling ===
                  0 && (
                    <>
                      <TableCell>₹{formatINR(order?.AdvanceAmount)}</TableCell>
                      <TableCell>
                        ₹
                        {formatINR(
                          order?.DiscountedSellingPrice * order.OrderQty +
                          parseFloat(order.FittingPrice || 0) *
                          (parseFloat(order.FittingGSTPercentage || 0) /
                            100) +
                          parseFloat(order.FittingPrice || 0) -
                          (order.AdvanceAmount || 0)
                        )}
                      </TableCell>
                    </>
                  )}

                <TableCell>
                  ₹
                  {formatINR(
                    order?.DiscountedSellingPrice * order.OrderQty +
                    parseFloat(order.FittingPrice || 0) *
                    (parseFloat(order.FittingGSTPercentage || 0) / 100) +
                    parseFloat(order.FittingPrice || 0)
                  )}
                </TableCell>
                <TableCell>{getOrderStatus(order.Status)}</TableCell>
                {!isFamily && (
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      {order.Status !== 3 && (
                        <HasPermission module="Order" action={["create"]}>
                          <Button
                            size="sm"
                            icon={FiFileText}
                            onClick={() => {
                              setIsGenerateInvoiceWarning(true);
                              setSelectedOrder(order);
                            }}
                            // onClick={() => {handleGenerateInvoice(order);setSelectedOrder(order)}}
                            title="Generate Invoice"
                            isLoading={isInvoiceGenerating}
                          ></Button>
                        </HasPermission>
                      )}
                      {order.Status !== 4 && (
                        <HasPermission module="Order" action="deactivate">
                          <Button
                            variant="danger"
                            onClick={() => {
                              setIsCancelItemConfirmWarning(true);
                              setSelectedItemId(order.OrderDetailId);
                            }}
                            // onClick={() => handleCancelItem(order.OrderDetailId)}
                            className="opacity-70"
                            size="sm"
                            isLoading={
                              selectedItemId === order.OrderDetailId
                                ? isItemCancelling
                                : false
                            }
                            disabled={isOrderCancelling || isItemCancelling}
                            title="Cancel Item"
                            icon={FiX}
                          >
                            {/* Cancel Item */}
                          </Button>
                        </HasPermission>
                      )}
                      {order.typeid === 0 && (
                        <>
                          <button
                            className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            onClick={() => handlePrint(order)}
                          >
                            {printingId === order?.OrderDetailId ? (
                              <Loader color="black" />
                            ) : (
                              <div className="flex items-center">
                                <FiPrinter className="mr-1.5" />
                              </div>
                            )}
                          </button>
                          <button
                            className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            onClick={() => handleOrderDetailsView(order)}
                          >
                            {printingId === order?.OrderDetailId ? (
                              <Loader color="black" />
                            ) : (
                              <div className="flex items-center">
                                <EyeIcon className="h-4 w-4" />
                              </div>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )}
            emptyMessage={isLoading ? "Loading..." : "No data available"}
          />
        </div>

        {/* Summary Section */}
        {orderDetails && (
          <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex justify-between">
              <Info
                label="Comment"
                value={customerDataById?.data.data?.Comment || "N/A"}
              />
              <div className="flex gap-30 justify-end">
                <div className="flex flex-col">
                  <span className="text-neutral-700 font-semibold text-lg">
                    Total Qty
                  </span>
                  <span className="text-neutral-600 text-xl font-medium">
                    {totalQty || "0"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-neutral-700 font-semibold text-lg">
                    Total GST
                  </span>
                  <span className="text-neutral-600 text-xl font-medium">
                    ₹{formatINR(totalGST) || "0"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-neutral-700 font-semibold text-lg">
                    Total Basic Value
                  </span>
                  <span className="text-neutral-600 text-xl font-medium">
                    ₹
                    {formatINR(parseFloat(grandTotal) - parseFloat(totalGST)) ||
                      "0"}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col">
                    <span className="text-neutral-700 font-semibold text-lg">
                      Total Amount
                    </span>
                    <span className="text-neutral-600 text-xl font-medium">
                      ₹
                      {formatINR(
                        Number(
                          grandTotal +
                          parseFloat(
                            customerDataById?.data?.data?.RoundOff || 0
                          )
                        )
                      ) || "0"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-neutral-700 font-semibold text-lg">
                      Round Off
                    </span>
                    <span className="text-neutral-600 text-xl font-medium">
                      ₹
                      {formatINR(
                        Number(customerDataById?.data?.data?.RoundOff)
                      ) || "0"}
                    </span>
                  </div>

                  {customerDataById?.data.data?.CustomerMaster
                    ?.CreditBilling === 0 && (
                      <div className="flex flex-col">
                        <span className="text-neutral-700 font-semibold text-lg">
                          Total Advance Amount
                        </span>
                        <span className="text-neutral-600 text-xl font-medium">
                          ₹{formatINR(Number(advanceAmount?.toFixed(2))) || "0"}
                        </span>
                      </div>
                    )}
                  {customerDataById?.data.data?.CustomerMaster
                    ?.CreditBilling === 0 && (
                      <div className="flex flex-col">
                        <span className="text-neutral-700 font-semibold text-lg">
                          Total Balance Amount
                        </span>
                        <span className="text-neutral-600 text-xl font-medium">
                          ₹{formatINR(Number(balanceAmount?.toFixed(2))) || "0"}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Modal isOpen={showOtp} onClose={() => setShowOtp(false)}>
        <OTPScreen
          length={6}
          onComplete={handleOtpComplete}
          autoFocus={true}
          // disabled={isLoading}
          type="number"
          placeholder="*"
          className="mb-6"
        />
        <div className="grid grid-cols-2 w-full gap-5">
          <Button variant="outline" onClick={() => setShowOtp(false)}>
            Clear & Close
          </Button>
          <Button
            onClick={() => handleConfirmWarnings(selectedDiscountItem)}
            isLoading={isItemCancelling}
            disabled={isItemCancelling}
          >
            Submit
          </Button>
        </div>
      </Modal>
      <Modal isOpen={showOtpOrder} onClose={() => setShowOtpOrder(false)}>
        <OTPScreen
          length={6}
          onComplete={handleOtpComplete}
          autoFocus={true}
          // disabled={isLoading}
          type="number"
          placeholder="*"
          className="mb-6"
        />
        <div className="grid grid-cols-2 w-full gap-5">
          <Button variant="outline" onClick={() => setShowOtpOrder(false)}>
            Clear & Close
          </Button>
          <Button
            onClick={() => handleConfirmWarningsForOrder(selectedDiscountItem)}
            isLoading={isOrderCancelling}
            disabled={isOrderCancelling}
          >
            Submit
          </Button>
        </div>
      </Modal>
      <ErrorDisplayModal
        title="Error Generating Invoice"
        errors={errors}
        open={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
      />
      <ConfirmationModal
        isOpen={isWarningOpen}
        onClose={() => setIsWarningOpen(false)}
        onConfirm={handleConfirmWarnings}
        title="Cancel Item Warning!"
        message={warningMessage}
        confirmText="Yes, Proceed"
        cancelText="Cancel"
        danger={false}
        isLoading={isItemCancelling}
      />
      <ConfirmationModal
        isOpen={isCancelOrder}
        onClose={() => setIsCancelOrder(false)}
        onConfirm={handleConfirmWarningsForOrder}
        title="Cancel Order Warning!"
        message={warningMessage}
        confirmText="Yes, Proceed"
        cancelText="Cancel"
        danger={false}
        isLoading={isOrderCancelling}
      />
      <ConfirmationModal
        isOpen={generalWarning}
        onClose={() => setGeneralWarning(false)}
        onConfirm={handleConfirmWarningsForOrder}
        title="Warning!"
        message={warningMessage}
        confirmText="Yes, Proceed"
        cancelText="Cancel"
        danger={false}
        isLoading={isOrderCancelling}
      />
      <ConfirmationModal
        isOpen={openInvoiceWarning}
        onClose={() => setOpenInvoiceWarning(false)}
        onConfirm={() => handleGenerateInvoiceConfirm(selectedOrder)}
        title="Warning!"
        message={
          <div className="space-y-2">
            {InvoiceWarnings?.map((item, index) => (
              <p key={index} className="text-neutral-700">
                {item}
              </p>
            ))}
          </div>
        }
        confirmText="Yes, Proceed"
        cancelText="Cancel"
        danger={false}
        isLoading={isInvoiceGenerating}
      />
      <ConfirmationModal
        isOpen={CancelOrderConfirmWarning}
        onClose={() => setIsCancelOrderConfirmWarning(false)}
        onConfirm={handleCancelOrder}
        title="Warning!"
        message="Are you sure you want to cancel the Order?"
        confirmText="Yes, Proceed"
        cancelText="Cancel"
        danger={false}
        isLoading={isOrderCancelling}
      />
      <ConfirmationModal
        isOpen={CancelItemConfirmWarning}
        onClose={() => setIsCancelItemConfirmWarning(false)}
        onConfirm={handleCancelItem}
        title="Warning!"
        message="Are you sure you want to cancel this Product?"
        confirmText="Yes, Proceed"
        cancelText="Cancel"
        danger={false}
        isLoading={isItemCancelling}
      />
      <ConfirmationModal
        isOpen={generateInvoiceWarning}
        onClose={() => setIsGenerateInvoiceWarning(false)}
        onConfirm={() => handleGenerateInvoice(selectedOrder)}
        title="Warning!"
        message="Are you sure you want to Generate Invoice from Order?"
        confirmText="Yes, Proceed"
        cancelText="Cancel"
        danger={false}
        isLoading={isInvoiceGenerating}
      />



      {/* Additional Lens Details – Animated Modal */}

      {olOrderDataInfoModel && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 30 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50"
              >
                <h3 className="text-xl font-bold text-neutral-800">
                  Additional Lens Details
                </h3>
                <button
                  onClick={() => {
                    setOLOrderDataInfoModel(false);
                    setOlOrderDateInfo([]);
                  }}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <FiX className="w-5 h-5 text-neutral-600" />
                </button>
              </motion.div>

              {/* Body */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6"
              >
                {Object.keys(olOrderDataInfo).length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader color="black" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {(() => {
                      console.log("olOrderDataInfo", olOrderDataInfo);
                      const d = olOrderDataInfo;

                      const fmt = (v) => (v == null || v === "" ? "" : v);


                      return (
                        <>
                          <ConsumerData
                            formData={formData}
                            handleInputChange={handleInputChange}
                            handleDateChange={handleDateChange}
                          />
                          <IndividualLensData formData={formData} handleInputChange={handleInputChange} handleDateChange={handleDateChange} />
                          <CentrationData formData={formData} handleInputChange={handleInputChange} handleDateChange={handleDateChange} />
                          <ThicknessOptions formData={formData} handleInputChange={handleInputChange} handleDateChange={handleDateChange} />
                          <FrameData formData={formData} handleInputChange={handleInputChange} handleDateChange={handleDateChange} />
                          {/* <PowerSpecs formData={formData} handleInputChange={handleInputChange} handleDateChange={handleDateChange} /> */}
                        </>
                      );
                    })()}
                  </div>
                )}
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50"
              >
                <button
                  onClick={() => {
                    setOLOrderDataInfoModel(false);
                    setOlOrderDateInfo([]);
                  }}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <Loader color="white" size="sm" />
                      Updating...
                    </>
                  ) : (
                    'Update'
                  )}
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

// Reusable Info Block
const Info = ({ label, value }) => (
  <div className="flex flex-col">
    <div className="text-neutral-700 font-semibold text-lg">{label}</div>
    <div className="text-neutral-600">
      {value !== null && value !== undefined && value !== "" ? value : "N/A"}
    </div>
  </div>
);


/** ──────────────────────────────────────
 *  Re-usable tiny components for the modal
 *  ────────────────────────────────────── */

const ConsumerData = ({ formData, handleInputChange, handleDateChange }) => (
  <Section title="Consumer Data">
    <div className="space-y-4 flex-row">
      <div className="space-y-3 grid grid-cols-3 gap-8">
        <EditableInputRow
          label="Consumer Card"
          name="ConsumerCard"
          value={formData.ConsumerCard}
          onChange={handleInputChange}
        />
        <EditableInputRow
          label="Engraving"
          name="Engraving"
          value={formData.Engraving}
          onChange={handleInputChange}
        />
        <DatePickerRow
          label="DOB"
          value={formData.DOB}
          onChange={handleDateChange}
        />
      </div>
    </div>
  </Section>
);

const IndividualLensData = ({ formData, handleInputChange }) => (
  <Section title="Individual Lens Data">
    <div className="grid grid-cols-4 gap-4">
      <EditableInputRow
        label="Panto Angle"
        name="PantoAngle"
        value={formData.PantoAngle}
        onChange={handleInputChange}
      />
      <EditableInputRow
        label="Bow Angle"
        name="BowAngle"
        value={formData.BowAngle}
        onChange={handleInputChange}
      />
      <EditableInputRow
        label="Frame Fit"
        name="FrameFit"
        value={formData.FrameFit}
        onChange={handleInputChange}
      />
      <EditableInputRow
        label="Distance Near"
        name="DistanceNear"
        value={formData.DistanceNear}
        onChange={handleInputChange}
      />
    </div>
  </Section>
);

const CentrationData = ({ formData, handleInputChange }) => (
  <div>
    <Section title="Centration Data">
      <div className="space-y-4">
        {/* Right Eye Row */}
        <div className="grid grid-cols-4 gap-4 items-start">
          <div className="flex items-center gap-2">
            Right :
          </div>
          <EditableInputField
            label="Pupillary Distance (PD)"
            name="RPD"
            value={formData.RPD}
            onChange={handleInputChange}
          />
          <EditableInputField
            label="Viewing Height"
            name="RVH"
            value={parseFloat(formData.RVH).toFixed(2)}
            onChange={handleInputChange}
          />
          <EditableInputField
            label="BVD"
            name="RBVD"
            value={formData.RBVD}
            onChange={handleInputChange}
          />
          <div></div>
        </div>

        {/* Left Eye Row */}
        <div className="grid grid-cols-4 gap-4 items-start">
          <div className="flex items-center gap-2">
            Left :
          </div>
          <EditableInputField
            label="Pupillary Distance (PD)"
            name="LPD"
            value={formData.LPD}
            onChange={handleInputChange}
          />
          <EditableInputField
            label="Viewing Height"
            name="LVH"
            value={parseFloat(formData.LVH).toFixed(2)}
            onChange={handleInputChange}
          />
          <EditableInputField
            label="BVD"
            name="LBVD"
            value={formData.LBVD}
            onChange={handleInputChange}
          />
          <div></div>
        </div>
      </div>
    </Section>
  </div>
);

const ThicknessOptions = ({ formData, handleInputChange }) => (
  <Section title="Thickness Options">
    <div className="space-y-4">
      {/* Right Eye Row */}
      <div className="grid grid-cols-4 gap-4 items-start">
        <div className="flex items-center gap-2">
          Right :
        </div>
        <EditableInputField
          label="Edge Thickness (ET)"
          name="RET"
          value={formData.RET}
          onChange={handleInputChange}
        />
        <EditableInputField
          label="Center Thickness (CT)"
          name="RCT"
          value={formData.RCT}
          onChange={handleInputChange}
        />
        <EditableInputField
          label="Optima"
          name="ROptima"
          value={formData.ROptima}
          onChange={handleInputChange}
        />
      </div>

      {/* Left Eye Row */}
      <div className="grid grid-cols-4 gap-4 items-start">
        <div className="flex items-center gap-2">
          Left :
        </div>
        <EditableInputField
          label="Edge Thickness (ET)"
          name="LET"
          value={formData.LET}
          onChange={handleInputChange}
        />
        <EditableInputField
          label="Center Thickness (CT)"
          name="LCT"
          value={formData.LCT}
          onChange={handleInputChange}
        />
        <EditableInputField
          label="Optima"
          name="LOptima"
          value={formData.LOptima}
          onChange={handleInputChange}
        />
      </div>
    </div>
  </Section>
);

const FrameData = ({ formData, handleInputChange }) => (
  <Section title="Frame Data">
    <div className="grid grid-cols-3 gap-4">
      <EditableInputRow
        label="Length"
        name="FrameLength"
        value={formData.FrameLength}
        onChange={handleInputChange}
      />
      <EditableInputRow
        label="Height"
        name="FrameHeight"
        value={formData.FrameHeight}
        onChange={handleInputChange}
      />
      <EditableInputRow
        label="DBL"
        name="FrameDBL"
        value={formData.FrameDBL}
        onChange={handleInputChange}
      />
    </div>
  </Section>
);

const PowerSpecs = ({ formData, handleInputChange }) => (
  <Section title="Power Specification">
    <div className="space-y-4">
      {/* Right Eye Row */}
      <div className="grid grid-cols-6 gap-4 items-start">
        <div className="flex items-center gap-2">
          Right :
        </div>
        <EditableInputField
          label="SPH"
          name="RightSphericalPower"
          value={formData.RightSphericalPower}
          onChange={handleInputChange}
        />
        <EditableInputField
          label="CYL"
          name="RightCylinderPower"
          value={formData.RightCylinderPower}
          onChange={handleInputChange}
        />
        <EditableInputField
          label="Axis"
          name="RightAxis"
          value={formData.RightAxis}
          onChange={handleInputChange}
        />
        <EditableInputField
          label="Add"
          name="RightAddition"
          value={formData.RightAddition}
          onChange={handleInputChange}
        />
        <div></div>
      </div>

      {/* Left Eye Row */}
      <div className="grid grid-cols-6 gap-4 items-start">
        <div className="flex items-center gap-2">
          Left :
        </div>
        <EditableInputField
          label="SPH"
          name="LeftSphericalPower"
          value={formData.LeftSphericalPower}
          onChange={handleInputChange}
        />
        <EditableInputField
          label="CYL"
          name="LeftCylinderPower"
          value={formData.LeftCylinderPower}
          onChange={handleInputChange}
        />
        <EditableInputField
          label="Axis"
          name="LeftAxis"
          value={formData.LeftAxis}
          onChange={handleInputChange}
        />
        <EditableInputField
          label="Add"
          name="LeftAddition"
          value={formData.LeftAddition}
          onChange={handleInputChange}
        />
        <div></div>
      </div>
    </div>
  </Section>
);


const Section = ({ title, children }) => (
  <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-white shadow-sm">
    <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
      {title}
    </h3>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const EditableInputRow = ({ label, name, value, onChange }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <input
        value={value || ""}
        name={name}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>
  </div>
);

const EditableInputField = ({ label, name, value, onChange }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <input
        value={value || ""}
        name={name}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>
  </div>
);

const DatePickerRow = ({ label, value, onChange }) => {
  const [dateValue, setDateValue] = useState(value ? new Date(value) : null);

  const handleDateChange = (e) => {
    const dateValue = e.target.value;

    if (dateValue === "") {
      // If date is cleared, send null instead of invalid date
      onChange(null);
    } else {
      // If date is selected, send the valid date
      onChange(new Date(dateValue));
    }
  };

  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="date"
          value={value || ""}
          onChange={(e) => {
            const newDate = e.target.value ? new Date(e.target.value) : null;
            handleDateChange(newDate);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
    </div>
  );
};

export default OrderView;
