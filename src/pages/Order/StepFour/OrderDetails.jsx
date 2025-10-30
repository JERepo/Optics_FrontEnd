import React, { useState } from "react";
import { useOrder } from "../../../features/OrderContext";
import Button from "../../../components/ui/Button";
import {
  FiArrowLeft,
  FiPlus,
  FiUser,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiSend,
  FiTrash2,
  FiPercent,
  FiDollarSign,
  FiX,
  FiShoppingCart,
  FiTag,
  FiSearch,
} from "react-icons/fi";
import { Table, TableCell, TableRow } from "../../../components/Table";
import {
  useApplyOfferType4Mutation,
  useGetOfferByMainIdQuery,
  useGetOfferCodeDetailsMutation,
  useGetOfferDetailsQuery,
  useGetSavedOrderDetailsQuery,
  useMainApplyDiscountMutation,
  useMainApplyRemoveDiscountMutation,
  useRemoveOfferType3Mutation,
  useRemoveOfferType4Mutation,
  useRemoveOrderMutation,
} from "../../../api/orderApi";
import Loader from "../../../components/ui/Loader";
import toast from "react-hot-toast";
import { isValidNumericInput } from "../../../utils/isValidNumericInput";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/Form/Input";
import { useSelector } from "react-redux";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import OTPScreen from "../../../components/OTPScreen";

// Format number with commas
const formatNumber = (num) => {
  return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
};

const DiscountInput = ({
  item,
  discountTypes,
  discountInputs,
  discountResults,
  onTypeChange,
  onInputChange,
  onApply,
  onRemoveDiscount,
  onRemoveOffer,
  isApplyingDiscount,
  isRemovingDiscount,
  isRemovingOffer,
  offerData,
  savedOrders,
}) => {
  const fittingPrice = parseFloat(item.FittingPrice) || 0;
  const fittingGst = parseFloat(item.FittingGSTPercentage) || 0;
  const toalSum = item.Total + fittingPrice + fittingPrice * (fittingGst / 100);
  const result = discountResults[item.OrderDetailId];
  const hasDiscount = !!result && result.value > 0;
  const error =
    discountTypes[item.OrderDetailId] === 2 &&
    discountInputs[item.OrderDetailId] > 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3 flex-col">
        {!hasDiscount && (
          <div className="flex gap-2">
            <div className="flex gap-2">
              <input
                type="radio"
                name={`discount-${item.OrderDetailId}`}
                value="1"
                checked={discountTypes[item.OrderDetailId] === 1}
                onChange={(e) => {
                  onTypeChange(item.OrderDetailId, e.target.value);
                  onInputChange(item.OrderDetailId, "");
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm">Value</span>
            </div>
            <div className="flex gap-2">
              <input
                type="radio"
                name={`discount-${item.OrderDetailId}`}
                value="2"
                checked={discountTypes[item.OrderDetailId] === 2}
                onChange={(e) => {
                  onTypeChange(item.OrderDetailId, 2);
                  onInputChange(item.OrderDetailId, ""); // reset input value
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm">%</span>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          {!hasDiscount && (
            <div className="flex-1 min-w-[60px]">
              {discountTypes[item.OrderDetailId] === 1 && (
                <div className="relative">
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    className="border pl-6 pr-2 py-1 rounded text-sm w-full"
                    placeholder="0.00"
                    value={discountInputs[item.OrderDetailId] || ""}
                    onChange={(e) => {
                      let value = parseFloat(e.target.value) || 0;
                      if (!isValidNumericInput(value)) return;
                      if (value > toalSum) {
                        value = toalSum;
                      }
                      onInputChange(item.OrderDetailId, value);
                    }}
                    min={0}
                    max={toalSum}
                  />
                </div>
              )}
              {discountTypes[item.OrderDetailId] === 2 && (
                <div className="relative">
                  <input
                    type="number"
                    className={`border px-2 py-1 rounded text-sm w-full pr-6 border-neutral-400 ${
                      error ? "border-red-500" : ""
                    }`}
                    placeholder="0"
                    value={discountInputs[item.OrderDetailId] || ""}
                    onChange={(e) => {
                      let value = parseFloat(e.target.value) || 0;
                      if (!isValidNumericInput(value)) return;
                      if (value > 100) {
                        value = 100;
                      }
                      onInputChange(item.OrderDetailId, value);
                    }}
                    max="100"
                    min="0"
                  />
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                    %
                  </span>
                </div>
              )}
            </div>
          )}
          {discountTypes[item.OrderDetailId] && (
            <div className="flex gap-3 items-center">
              {hasDiscount && (
                <div className="text-xs bg-green-50 px-2 py-1 rounded flex-nowrap text-green-700 items-start flex flex-col gap-1">
                  <div>
                    Discount: ₹
                    {formatNumber(item.DiscountValue || result.value)} (
                    {formatNumber(item.DiscountPercentage || 0)}%)
                  </div>
                  {item.offer && <div>Offer Code: {item.offer.offerCode}</div>}
                </div>
              )}

              {!hasDiscount ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onApply(item)}
                  disabled={
                    !discountInputs[item.OrderDetailId] ||
                    isApplyingDiscount ||
                    error
                  }
                  className="shrink-0 relative"
                  title="Apply Discount"
                >
                  {isApplyingDiscount ? (
                    <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-gray-500 rounded-full" />
                  ) : (
                    <FiSend size={14} />
                  )}
                </Button>
              ) : (
                <div>
                  {savedOrders?.every(
                    (item) => item.offer?.offerType !== 4
                  ) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        item.offer
                          ? onRemoveOffer(item.OrderDetailId)
                          : onRemoveDiscount(item.OrderDetailId)
                      }
                      disabled={
                        item.offer ? isRemovingOffer : isRemovingDiscount
                      }
                      className="shrink-0 relative"
                      title={item.offer ? "Remove Offer" : "Remove Discount"}
                    >
                      {item.offer ? (
                        isRemovingOffer ? (
                          <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-gray-500 rounded-full" />
                        ) : (
                          <FiX size={14} />
                        )
                      ) : isRemovingDiscount ? (
                        <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-gray-500 rounded-full" />
                      ) : (
                        <FiX size={14} />
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OrderDetails = () => {
  const {
    goToStep,
    customerDetails,
    draftData,
    currentStep,
    customerId,
    setSubStep,
  } = useOrder();

  const { user, hasMultipleLocations } = useSelector((state) => state.auth);
  // State for discount management
  const [discountTypes, setDiscountTypes] = useState({});
  const [discountResults, setDiscountResults] = useState({});
  const [discountInputs, setDiscountInputs] = useState({});
  const [applyingDiscounts, setApplyingDiscounts] = useState({});
  const [removingDiscounts, setRemovingDiscounts] = useState({});
  const [removingOffers, setRemovingOffers] = useState({});
  const [deletingItems, setDeletingItems] = useState({});
  const [comment, setComment] = useState("");
  const [openOffer, setOfferOpen] = useState(false);
  const [openOffer4, setOffer4] = useState(false);
  const [offerCode, setOfferCode] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);
  const [offerDetails, setOfferDetails] = useState(null);
  const [showOfferWarning, setShowOfferWarning] = useState(false);
  const [offer4Warning, setOffer4Warning] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpValue, setOtpValue] = useState(null);
  const [selectedDiscountItem, setSelectedDiscountItem] = useState(null);
  const [goBackOfferWarning, setGoBackOfferRemoveWarning] = useState(false);

  // API queries
  const { data: savedOrders, isLoading: savedOrdersLoading } =
    useGetSavedOrderDetailsQuery({ orderId: customerId.orderId });

  const [removeOrder, { isLoading: isRemoveLoading }] =
    useRemoveOrderMutation();
  const [applyOffer, { isLoading: isOfferApplying }] =
    useGetOfferCodeDetailsMutation();
  const { data: allOfferDetails } = useGetOfferDetailsQuery(
    {
      userId: parseInt(user.Id),
    },
    { skip: !parseInt(user.Id) }
  );

  const [removeOfferType3, { isLoading: isOfferRemoving }] =
    useRemoveOfferType3Mutation();
  const [removeOfferType4, { isLoading: isOfferType4Removing }] =
    useRemoveOfferType4Mutation();
  const [applyOffer4, { isLoading: isOffer4Applying }] =
    useApplyOfferType4Mutation();
  const [applyDiscount] = useMainApplyDiscountMutation();
  const [removeDiscount] = useMainApplyRemoveDiscountMutation();

  const handleBack = () => goToStep(currentStep - 1);
  const handleAddProduct = () => {
    if (
      savedOrders?.length &&
      savedOrders?.every((item) => item.offer?.offerType === 4)
    ) {
      toast.error("Please Remove the Offers to add Products!");
      return;
    }
    goToStep(2);
    // setSubStep(1)
  };

  const handleDiscountTypeChange = (orderDetailId, value) => {
    setDiscountTypes((prev) => ({
      ...prev,
      [orderDetailId]: Number(value),
    }));
  };

  const handleDiscountInputChange = (orderDetailId, value) => {
    const numericValue = value === "" ? "" : parseFloat(value);
    if (discountTypes[orderDetailId] === 2 && numericValue > 100) {
      return;
    }
    setDiscountInputs((prev) => ({
      ...prev,
      [orderDetailId]: value,
    }));
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
  const resetOtpStates = () => {
    setOtpValue(null);
    setSelectedDiscountItem(null);
  };
  const handleApplyDiscount = async (item) => {
    setSelectedDiscountItem(item);
    const { OrderDetailId, TaxPercentage, DiscountedSellingPrice, typeid } =
      item;
    const discountType = discountTypes[OrderDetailId];
    const input = parseFloat(discountInputs[OrderDetailId]);

    if (isNaN(input)) return;
    if (discountType === 2 && input > 100) return;

    setApplyingDiscounts((prev) => ({ ...prev, [OrderDetailId]: true }));

    const payload = {
      type: discountType === 1 ? "value" : "percent",
      value: input,
    };
    if (otpValue != null && showOtp) {
      payload.otp = parseInt(otpValue);
    }

    try {
      const response = await applyDiscount({
        locationId: customerId.locationId,
        orderId: customerId.orderId,
        detailId: OrderDetailId,
        productType: typeid,
        payload,
      }).unwrap();

      if (response?.otpRequired) {
        setSelectedDiscountItem(item);
        setOtpValue(null);
        setShowOtp(true);
        return;
      }
      const newPrice = parseFloat(response?.newPrice) || DiscountedSellingPrice;
      const { gstAmount, taxPercentage } = calculateGST(
        newPrice,
        TaxPercentage
      );

      setDiscountResults((prev) => ({
        ...prev,
        [OrderDetailId]: {
          value: input,
          percent: gstAmount,
          taxPercentage,
        },
      }));
      resetOtpStates();
      setShowOtp(false);
    } catch (error) {
      console.error("Discount apply error:", error);
      toast.error(
        error?.data.message ||
          error?.message ||
          "Somehting went wrong while applying discount, please try again later"
      );
      setOtpValue(null);
    } finally {
      setApplyingDiscounts((prev) => {
        const newState = { ...prev };
        delete newState[OrderDetailId];
        return newState;
      });
    }
  };
  const handleOtpComplete = (otp) => {
    setOtpValue(otp);
  };

  const handleRemoveDiscount = async (orderDetailId) => {
    const item = savedOrders?.find((x) => x.OrderDetailId === orderDetailId);
    if (!item) return;

    const { typeid } = item;

    setRemovingDiscounts((prev) => ({ ...prev, [orderDetailId]: true }));

    try {
      await removeDiscount({
        orderId: customerId.orderId,
        detailId: orderDetailId,
        productType: typeid,
      }).unwrap();

      setDiscountResults((prev) => {
        const newResults = { ...prev };
        delete newResults[orderDetailId];
        return newResults;
      });

      setDiscountInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[orderDetailId];
        return newInputs;
      });

      setDiscountTypes((prev) => {
        const newTypes = { ...prev };
        delete newTypes[orderDetailId];
        return newTypes;
      });
    } catch (error) {
      console.error("Remove discount error:", error);
    } finally {
      setRemovingDiscounts((prev) => {
        const newState = { ...prev };
        delete newState[orderDetailId];
        return newState;
      });
    }
  };
  console.log("saved or", savedOrders);
  const handleRemoveOfferType3 = async (orderDetailId) => {
    setRemovingOffers((prev) => ({ ...prev, [orderDetailId]: true }));
    try {
      await removeOfferType3({
        payload: { orderDetailId: orderDetailId },
      }).unwrap();
      toast.success("Offer removed successfully");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to remove offer");
    } finally {
      setRemovingOffers((prev) => {
        const newState = { ...prev };
        delete newState[orderDetailId];
        return newState;
      });
    }
  };

  const handleRemoveOfferType4 = async () => {
    try {
      await removeOfferType4({
        payload: {
          offerCode: savedOrders[0]?.offer.offerCode,
          orderId: customerId.orderId,
        },
      }).unwrap();
      toast.success("Offer removed successfully");
      setGoBackOfferRemoveWarning(false);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to remove offer");
    } finally {
      setOfferDetails(null);
    }
  };
  const handleDeleteItem = async (orderDetailId) => {
    setDeletingItems((prev) => ({ ...prev, [orderDetailId]: true }));
    try {
      const payload = {
        delete: [orderDetailId],
        comment: comment || null,
      };
      await removeOrder({
        orderId: customerId.orderId,
        payload,
      }).unwrap();
      toast.success("Product removed Successfully");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeletingItems((prev) => {
        const newState = { ...prev };
        delete newState[orderDetailId];
        return newState;
      });
    }
  };

  const getShortTypeName = (id) => {
    if (id === null || id === undefined) return;

    if (id === 1) {
      return "F/S";
    } else if (id === 2) {
      return "ACC";
    } else if (id === 3) {
      return "CL";
    } else if (id === 0) {
      return "OL";
    } else {
      return;
    }
  };

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
  const getTotal = (item) => {
    if (item.typeid === 0) {
      const fittingPrice = parseFloat(item.FittingPrice) || 0;
      const fittingGSTPercentage = parseFloat(item.FittingGSTPercentage) || 0;

      const sum =
        (parseFloat(item.Total) || 0) +
        fittingPrice +
        fittingPrice * (fittingGSTPercentage / 100);
      return sum;
    }

    return parseFloat(item.Total) || 0;
  };

  // Calculate totals for summary row
  const calculateTotals = () => {
    if (!savedOrders || savedOrders.length === 0) {
      return { totalQty: 0, totalGST: 0, totalAmount: 0 };
    }

    return savedOrders.reduce(
      (acc, item) => {
        const qty = parseInt(item.OrderQty) || 0;
        const total = parseFloat(item.Total) || 0;

        // GST
        const { gstAmount } = calculateGST(
          item.DiscountedSellingPrice || 0,
          item.TaxPercentage || 0
        );
        const gst = parseFloat(gstAmount) || 0;

        // Fitting values (safe defaults)
        const fittingPrice = parseFloat(item.FittingPrice) || 0;
        const fittingGSTPercentage = parseFloat(item.FittingGSTPercentage) || 0;

        // Fitting GST amount
        const fittingGST = fittingPrice * (fittingGSTPercentage / 100);

        return {
          totalQty: acc.totalQty + qty,
          totalGST:
            acc.totalGST + gst * qty + (item.typeid == 0 ? fittingGST : 0),
          totalAmount:
            acc.totalAmount +
            total +
            (item.typeid == 0 ? fittingGST + fittingPrice : 0),
        };
      },
      { totalQty: 0, totalGST: 0, totalAmount: 0 }
    );
  };

  const { totalQty, totalGST, totalAmount } = calculateTotals();

  const handleOrderSaveAndNext = async () => {
    try {
      const payload = {
        delete: [],
        comment: comment || null,
      };
      await removeOrder({
        orderId: customerId.orderId,
        payload,
      }).unwrap();

      goToStep(5);
    } catch (error) {
      console.log("Please try again after some time");
    }
  };

  const handleOfferCheckConfirm = async () => {
    if (!offerCode) {
      toast.error("Please Enter the OfferCode");
      return;
    }
    const payload = {
      forceApply: true,
      offerCode: offerCode,
      orderDetailId: orderDetails?.OrderDetailId,
      locationId: parseInt(hasMultipleLocations[0]),
      ApplicationUserId: user.Id,
    };

    try {
      const res = await applyOffer({ payload }).unwrap();
      setOfferDetails(res?.data);
      setOfferOpen(false);
      toast.success("Offer applied successfully");
      setOfferCode("");
    } catch (error) {
      console.log(error);
      toast.error(
        error?.data.message ||
          error?.message ||
          "Somehting went wrong while applying discount, please try again later"
      );
    } finally {
      setShowOfferWarning(false);
      setOfferCode("");
    }
  };

  const handleOfferCodeSubmit = async (e) => {
    if (!showOtp) {
      e.preventDefault();
    }
    if (!offerCode) {
      toast.error("Please Enter the OfferCode");
      return;
    }

    const payload = {
      forceApply: false,
      offerCode: offerCode,
      orderDetailId: orderDetails?.OrderDetailId,
      locationId: parseInt(hasMultipleLocations[0]),
      ApplicationUserId: user.Id,
    };
    if (otpValue && showOtp) {
      payload.otp = otpValue;
    }
    try {
      const res = await applyOffer({ payload }).unwrap();
      if (res?.otpRequired) {
        setSelectedDiscountItem(orderDetails);
        setOtpValue(null);
        setShowOtp(true);
        return;
      }
      if (res?.warning) {
        setOfferDetails(res);
        setShowOfferWarning(true);
        setOfferOpen(false);
        // setOfferCode("");
      } else {
        setOfferDetails(res?.data);
        setOfferOpen(false);
        toast.success("Offer applied successfully");
        setOfferCode("");
      }
      resetOtpStates();
      setShowOtp(false);
    } catch (error) {
      console.log(error);
      toast.error(
        error?.data?.message || "No Offer Applicable on this product"
      );
      setOfferOpen(false);
      if (!showOtp) {
        setOfferCode("");
      }
    }
  };

  const handleOfferCheckConfirm4 = async (e) => {
    e.preventDefault();

    if (!offerCode) {
      toast.error("Please Enter the OfferCode");
      return;
    }

    const payload = {
      forceApply: true,
      offerCode: offerCode,
      orderMasterId: customerId.orderId,
      totalOrderValue: parseFloat(totalAmount),
      ApplicationUserId: user.Id,
    };

    try {
      const res = await applyOffer4({ payload }).unwrap();

      if (res?.warning) {
        setOfferDetails(res);
        setShowOfferWarning(true);
        setOffer4(false);
        // setOfferCode("");
      } else {
        setOfferDetails(res?.data);
        setOffer4(false);
        toast.success("Offer applied successfully");
        setOfferCode("");
      }
    } catch (error) {
      console.log(error);
      toast.error(
        error?.data?.message ||
          error?.messgae ||
          "No Offer Applicable on this product"
      );
      setOffer4(false);
      setOfferCode("");
    }
  };
  const handleCheckAppl = () => {
    const isValid = savedOrders?.find((item) => item.offer);
    if (isValid) {
      toast.error(
        "Item Level Offer has been applied please remove them to add this offer"
      );
      return;
    }
    setOffer4(true);
  };
  const handleOfferCodeSubmit4 = async (e) => {
    e.preventDefault();

    if (!offerCode) {
      toast.error("Please Enter the OfferCode");
      return;
    }

    const payload = {
      forceApply: false,
      offerCode: offerCode,
      orderMasterId: customerId.orderId,
      totalOrderValue: parseFloat(totalAmount),
      ApplicationUserId: user.Id,
    };
    if (otpValue && showOtp) {
      payload.otp = otpValue;
    }
    try {
      const res = await applyOffer4({ payload }).unwrap();
      if (res?.otpRequired) {
        setSelectedDiscountItem({ isType4: true }); // Flag for type 4
        setOtpValue(null);
        setShowOtp(true);
        return;
      }
      if (res?.warning) {
        setOfferDetails(res);
        setShowOfferWarning(true);
        setOffer4(false);
        // setOfferCode("");
      } else {
        setOfferDetails(res?.data);
        setOffer4(false);
        toast.success("Offer applied successfully");
        setOfferCode("");
      }
      resetOtpStates();
      setShowOtp(false);
    } catch (error) {
      console.log(error);
      toast.error(
        error?.data?.message || "No Offer Applicable on this product"
      );
      setOffer4(false);
      setOfferCode("");
    }
  };
  const getOtpModalTitle = () => {
    if (selectedDiscountItem?.isType4) {
      return "Secure Verification for Order-Level Offer Approval";
    }

    // If offer-related (has an offerCode or is manually opened from offer modal)
    if (
      orderDetails &&
      selectedDiscountItem?.OrderDetailId === orderDetails?.OrderDetailId &&
      orderDetails?.offer
    ) {
      return "Secure Verification for Item-Level Offer Approval";
    }

    // Default to discount
    return "Secure Verification for Discount Approval";
  };

  const offerType4ValueCheck = savedOrders?.reduce(
    (sum, item) => sum + parseFloat(item.DiscountValue),
    0
  );

  const handleOrderBack = async () => {
    if (
      savedOrders?.length &&
      savedOrders?.every((item) => item.offer?.offerType === 4)
    ) {
      setGoBackOfferRemoveWarning(true);
      return;
    }
    goToStep(3);
  };

  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header Section */}
        <div className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Order Details <span className="">(Step {currentStep})</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Review and add products to the order
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <Button
                icon={FiArrowLeft}
                variant="outline"
                onClick={handleOrderBack}
                className="w-full sm:w-auto"
              >
                Back
              </Button>
              <Button
                icon={FiPlus}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                onClick={handleAddProduct}
              >
                Add Product
              </Button>
            </div>
          </div>
          {/* Customer Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-5">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <FiUser className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Customer Name
                </p>
                <p className="text-base font-medium text-gray-900">
                  {customerDetails.CustomerName || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-full text-green-600">
                <FiPhone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Mobile Number
                </p>
                <p className="text-base font-medium text-gray-900">
                  {customerDetails.MobNumber || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                <FiMapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-base font-medium text-gray-900">
                  {customerDetails.BillAddress1 || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                <FiFileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Order Reference
                </p>
                <p className="text-base font-medium text-gray-900">
                  {draftData?.OrderReference || "Not specified"}
                </p>
              </div>
            </div>
          </div>
          {/* Order Items Table */}

          <Table
            freeze={true}
            columns={[
              "S.NO",
              "Type",
              "Product Name",
              "Qty",
              "Rate",
              "Discount",
              "GST",
              "Total",
              "Action",
            ]}
            data={savedOrders || []}
            renderRow={(item, index) => {
              const discountType =
                item.DiscountType || discountTypes[item.OrderDetailId];
              const discountValue =
                item.DiscountType === 1
                  ? item.DiscountValue
                  : item.DiscountPercentage;

              const hasDiscount = discountType && discountValue > 0;

              const result = calculateGST(
                item.DiscountedSellingPrice,
                item.TaxPercentage
              );

              return (
                <TableRow key={item.SlNo}>
                  <TableCell>{item.SlNo}</TableCell>
                  <TableCell>{getShortTypeName(item.typeid)}</TableCell>
                  <TableCell>
                    <div className="whitespace-pre-wrap">
                      {getProductName(item)}
                    </div>
                  </TableCell>
                  <TableCell>{formatNumber(item.OrderQty)}</TableCell>
                  <TableCell>₹{formatNumber(item.Rate)}</TableCell>
                  <TableCell>
                    <DiscountInput
                      item={item}
                      discountTypes={{
                        ...discountTypes,
                        [item.OrderDetailId]: discountType,
                      }}
                      discountInputs={{
                        ...discountInputs,
                        [item.OrderDetailId]:
                          discountValue || discountInputs[item.OrderDetailId],
                      }}
                      discountResults={{
                        ...discountResults,
                        [item.OrderDetailId]: hasDiscount
                          ? {
                              value: discountValue,
                              ...result,
                            }
                          : result,
                      }}
                      onTypeChange={handleDiscountTypeChange}
                      onInputChange={handleDiscountInputChange}
                      onApply={handleApplyDiscount}
                      onRemoveDiscount={handleRemoveDiscount}
                      onRemoveOffer={handleRemoveOfferType3}
                      isApplyingDiscount={
                        !!applyingDiscounts[item.OrderDetailId]
                      }
                      isRemovingDiscount={
                        !!removingDiscounts[item.OrderDetailId]
                      }
                      isRemovingOffer={!!removingOffers[item.OrderDetailId]}
                      offerData={allOfferDetails?.data?.data}
                      savedOrders={savedOrders}
                    />
                  </TableCell>
                  <TableCell>
                    <div>₹{formatNumber(result.gstAmount)}</div>
                    <div>({result.taxPercentage}%)</div>
                  </TableCell>
                  <TableCell>₹{formatNumber(getTotal(item))}</TableCell>
                  <TableCell>
                    {!item.offer && (
                      <div className="flex items-center gap-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Remove item"
                          onClick={() => handleDeleteItem(item.OrderDetailId)}
                          disabled={deletingItems[item.OrderDetailId]}
                        >
                          {deletingItems[item.OrderDetailId] ? (
                            <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-gray-500 rounded-full" />
                          ) : (
                            <FiTrash2 size={14} />
                          )}
                        </Button>

                        <Button
                          icon={FiTag}
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setOfferOpen(true);
                            setOrderDetails(item);
                          }}
                        ></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            }}
            emptyMessage={
              savedOrdersLoading
                ? "Loading..."
                : "No orders found. Click 'Add Product' to create one."
            }
            pagination={false}
          />

          <Modal
            isOpen={openOffer}
            onClose={() => setOfferOpen(false)}
            width="max-w-4xl"
          >
            <div className="">
              <form onSubmit={handleOfferCodeSubmit} className="space-y-2">
                <div className="flex flex-col gap-3">
                  <label
                    htmlFor="barcode"
                    className="text-sm font-medium text-gray-700"
                  >
                    Enter OfferCode
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex items-center">
                      <input
                        id="offerCode"
                        type="text"
                        value={offerCode}
                        onChange={(e) => setOfferCode(e.target.value)}
                        placeholder="Scan or enter barcode"
                        className="w-[400px] pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                      />
                      <FiSearch className="absolute left-3 text-gray-400" />
                    </div>

                    <Button type="submit" isLoading={isOfferApplying}>
                      Apply Offer
                    </Button>
                  </div>
                </div>
              </form>
              {offerDetails?.computed && (
                <div className="mt-5">
                  {/* <div className="flex gap-3 items-center mt-5">
                    <Input
                      label={
                        offerDetails?.rule.DiscountType === 0
                          ? "Discount Percentage"
                          : "Discounted Value"
                      }
                      value={
                        offerDetails?.rule.DiscountType === 0
                          ? `${offerDetails?.rule?.DiscountPerct}(%)`
                          : offerDetails?.rule?.DiscountValue
                      }
                      readOnly
                    />
                    <Input
                      label="Unit Rate"
                      value={offerDetails?.computed?.finalUnitPrice}
                      readOnly
                    />
                    <Input
                      label="Discounted Amount"
                      value={offerDetails?.computed?.offerDiscountAmount}
                    />
                  </div> */}
                  {/* <div>
                    <Button onClick={handleApplyOffer}>Apply Offer</Button>
                  </div> */}
                </div>
              )}
            </div>
          </Modal>
          <Modal
            isOpen={showOtp}
            onClose={() => {
              resetOtpStates();
              setShowOtp(false);
            }}
          >
            <OTPScreen
              length={6}
              onComplete={handleOtpComplete}
              autoFocus={true}
              // disabled={isLoading}
              type="number"
              placeholder="*"
              className="mb-6"
              title={getOtpModalTitle()}
              showClear={true}
            />

            <div className="grid grid-cols-2 w-full gap-5">
              <Button
                variant="outline"
                onClick={() => {
                  setShowOtp(false);
                  setOtpValue(null);
                  setSelectedDiscountItem(null);
                }}
              >
                Clear & Close
              </Button>
              <Button
                isLoading={
                  !!applyingDiscounts[selectedDiscountItem?.OrderDetailId] ||
                  isOfferApplying ||
                  isOffer4Applying
                }
                onClick={() => {
                  // setShowOtp(false);
                  if (selectedDiscountItem?.OrderDetailId) {
                    // Discount or type 3 retry
                    if (
                      selectedDiscountItem.OrderDetailId ===
                      orderDetails?.OrderDetailId
                    ) {
                      handleOfferCodeSubmit();
                    } else {
                      handleApplyDiscount(selectedDiscountItem);
                    }
                  } else if (selectedDiscountItem?.isType4) {
                    handleOfferCodeSubmit4();
                  }
                }}
              >
                Submit
              </Button>
            </div>
          </Modal>
          <Modal
            isOpen={openOffer4}
            onClose={() => setOffer4(false)}
            width="max-w-4xl"
          >
            <div className="">
              <form onSubmit={handleOfferCodeSubmit4} className="space-y-2">
                <div className="flex flex-col gap-3">
                  <label
                    htmlFor="barcode"
                    className="text-sm font-medium text-gray-700"
                  >
                    Enter OfferCode
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex items-center">
                      <input
                        id="offerCode"
                        type="text"
                        value={offerCode}
                        onChange={(e) => setOfferCode(e.target.value)}
                        placeholder="Scan or enter barcode"
                        className="w-[400px] pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                      />
                      <FiSearch className="absolute left-3 text-gray-400" />
                    </div>

                    <Button type="submit" isLoading={isOffer4Applying}>
                      Apply Offer
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </Modal>
          {/* Order Summary */}
          {savedOrders?.length > 0 && (
            <div className="mt-6 border-gray-200 pt-4 px-4">
              <div className="flex flex-col sm:flex-row justify-end gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Total Qty:</span>
                  <span className="font-semibold text-xl">
                    {formatNumber(totalQty)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Total GST:</span>
                  <span className="font-semibold text-2xl">
                    ₹{formatNumber(totalGST.toFixed(2))}
                  </span>
                </div>
                <div className="flex items-end gap-1">
                  <div className="flex items-center gap-2 relative">
                    <span className="text-gray-500">Total Amount:</span>
                    <span className="font-semibold text-3xl">
                      ₹{formatNumber(totalAmount.toFixed(2))}
                    </span>
                    <div className="absolute -top-[60%] right-0 text-[11px] bg-green-50 px-2 py-1 rounded flex-nowrap text-green-700 font-medium">
                      {savedOrders?.every((item) => item.offer?.offerType === 4)
                        ? `OfferCode: ${savedOrders[0]?.offer.offerCode}`
                        : ""}
                    </div>
                  </div>

                  <div>
                    {savedOrders?.length > 0 &&
                    savedOrders?.every(
                      (item) => item.offer?.offerType === 4
                    ) ? (
                      <Button
                        size="xs"
                        variant="outline"
                        className="shrink-0 relative"
                        title={"Remove Offer"}
                        onClick={handleRemoveOfferType4}
                      >
                        <div>
                          {isOfferType4Removing ? (
                            <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-gray-500 rounded-full" />
                          ) : (
                            <FiX size={14} />
                          )}
                        </div>
                      </Button>
                    ) : (
                      <Button
                        icon={FiTag}
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          handleCheckAppl();
                        }}
                      ></Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {savedOrders?.length > 0 && (
            <div>
              {/* Comment Section */}
              <div className="p-4">
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Comment
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="p-4 flex justify-end">
                <Button
                  isLoading={isRemoveLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleOrderSaveAndNext}
                >
                  Save & Next
                </Button>
              </div>
            </div>
          )}

          <ConfirmationModal
            isOpen={showOfferWarning}
            onClose={() => setShowOfferWarning(false)}
            onConfirm={handleOfferCheckConfirm}
            title="Offer Discount warning!"
            message={offerDetails?.message}
            confirmText="Yes, Proceed"
            cancelText="Cancel"
            danger={false}
            isLoading={isOfferApplying}
          />
          <ConfirmationModal
            isOpen={offer4Warning}
            onClose={() => setOffer4Warning(false)}
            onConfirm={handleOfferCheckConfirm4}
            title="Offer Discount warning!"
            message={offerDetails?.message}
            confirmText="Yes, Proceed"
            cancelText="Cancel"
            danger={false}
            isLoading={isOffer4Applying}
          />
          <ConfirmationModal
            isOpen={goBackOfferWarning}
            onClose={() => setGoBackOfferRemoveWarning(false)}
            onConfirm={handleRemoveOfferType4}
            title="Offer Removal warning!"
            message="If you Go Back the Applied Offers will be removed automatically!"
            confirmText="Yes, Proceed"
            cancelText="Cancel"
            danger={false}
            isLoading={isOfferType4Removing}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
