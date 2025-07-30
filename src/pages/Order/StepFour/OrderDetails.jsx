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
} from "react-icons/fi";
import { Table, TableCell, TableRow } from "../../../components/Table";
import {
  useApplyAccessoryDiscountMutation,
  useApplyContactLensDiscountMutation,
  useApplyFrameDiscountMutation,
  useGetSavedOrderDetailsQuery,
  useRemoveAccessoryDiscountMutation,
  useRemoveContactLensDiscountMutation,
  useRemoveFrameDiscountMutation,
  useRemoveOrderMutation,
} from "../../../api/orderApi";
import Loader from "../../../components/ui/Loader";
import toast from "react-hot-toast";

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
  isApplyingDiscount,
  isRemovingDiscount,
}) => {
  const result = discountResults[item.OrderDetailId];
  const hasDiscount = !!result && result.value > 0;
  const error =
    discountTypes[item.OrderDetailId] === 2 &&
    discountInputs[item.OrderDetailId] > 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {!hasDiscount && (
          <div className="flex gap-2">
            <div className="flex gap-2">
              <input
                type="radio"
                name={`discount-${item.OrderDetailId}`}
                value="1"
                checked={discountTypes[item.OrderDetailId] === 1}
                onChange={(e) =>
                  onTypeChange(item.OrderDetailId, e.target.value)
                }
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
                onChange={(e) =>
                  onTypeChange(item.OrderDetailId, e.target.value)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm">%</span>
            </div>
          </div>
        )}
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
                  onChange={(e) =>
                    onInputChange(item.OrderDetailId, e.target.value)
                  }
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
                  onChange={(e) =>
                    onInputChange(item.OrderDetailId, e.target.value)
                  }
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
          <div className="flex gap-3">
            {hasDiscount && (
              <div className="text-xs bg-green-50 px-2 py-1 rounded flex-nowrap text-green-700">
                <div>
                  Discount: ₹{formatNumber(item.DiscountValue || result.value)}{" "}
                  ({formatNumber(item.DiscountPercentage || 0)}%)
                </div>
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRemoveDiscount(item.OrderDetailId)}
                disabled={isRemovingDiscount}
                className="shrink-0 relative"
                title="Remove Discount"
              >
                {isRemovingDiscount ? (
                  <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-gray-500 rounded-full" />
                ) : (
                  <FiX size={14} />
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const OrderDetails = () => {
  const { goToStep, customerDetails, draftData, currentStep, customerId,setSubStep } =
    useOrder();

  // State for discount management
  const [discountTypes, setDiscountTypes] = useState({});
  const [discountResults, setDiscountResults] = useState({});
  const [discountInputs, setDiscountInputs] = useState({});
  const [applyingDiscounts, setApplyingDiscounts] = useState({});
  const [removingDiscounts, setRemovingDiscounts] = useState({});
  const [deletingItems, setDeletingItems] = useState({});
  const [comment, setComment] = useState("");

  // API queries
  const { data: savedOrders, isLoading: savedOrdersLoading } =
    useGetSavedOrderDetailsQuery({ orderId: customerId.orderId });
  const [applyFrameDiscount] = useApplyFrameDiscountMutation();
  const [removeFrameDiscount] = useRemoveFrameDiscountMutation();
  const [removeOrder, { isLoading: isRemoveLoading }] =
    useRemoveOrderMutation();
  const [applyAccessoryDiscount] = useApplyAccessoryDiscountMutation();
  const [removeAccessoryDiscount] = useRemoveAccessoryDiscountMutation();
  const [applyContactDiscount] = useApplyContactLensDiscountMutation();
  const [removeContactDiscount] = useRemoveContactLensDiscountMutation();


  const handleBack = () => goToStep(currentStep - 1);
  const handleAddProduct = () => {
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

  const handleApplyDiscount = async (item) => {
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

    // Select correct mutation based on typeid
    let mutation;
    if (typeid === 1) mutation = applyFrameDiscount;
    else if (typeid === 2) mutation = applyAccessoryDiscount;
    else if (typeid === 3) mutation = applyContactDiscount;
    else return; // Handle unknown types if needed

    try {
      const response = await mutation({
        locationId: customerId.locationId,
        orderId: customerId.orderId,
        detailId: OrderDetailId,
        payload,
      }).unwrap();

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
    } catch (error) {
      console.error("Discount apply error:", error);
    } finally {
      setApplyingDiscounts((prev) => {
        const newState = { ...prev };
        delete newState[OrderDetailId];
        return newState;
      });
    }
  };

  const handleRemoveDiscount = async (orderDetailId) => {
    const item = savedOrders?.find((x) => x.OrderDetailId === orderDetailId);
    if (!item) return;

    const { typeid } = item;

    setRemovingDiscounts((prev) => ({ ...prev, [orderDetailId]: true }));

    // Select correct mutation based on typeid
    let mutation;
    if (typeid === 1) mutation = removeFrameDiscount;
    else if (typeid === 2) mutation = removeAccessoryDiscount;
    else if (typeid === 3) mutation = removeContactDiscount;
    else return;

    try {
      await mutation({
        orderId: customerId.orderId,
        detailId: orderDetailId,
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
      console.log("Delete error:", error);
    } finally {
      setDeletingItems((prev) => {
        const newState = { ...prev };
        delete newState[orderDetailId];
        return newState;
      });
    }
  };

  const getShortTypeName = (id) => {
    if (!id) return;

    if (id === 1) {
      return "F/S";
    } else if (id === 2) {
      return "ACC";
    } else if (id === 3) {
      return "CL";
    } else {
      return "OL";
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
    } = item;
    console.log(`variation ${typeid} :`, PowerSpecs);
    // For Frame (typeid = 1)
    if (typeid === 1) {
      // Example: RAY-BAN F12345 BLK
      const nameLine = ProductName || "";
      const sizeLine = Size ? `${Size}` : "";
      const barcodeLine = Barcode || "";
      // const frameType = "OpticalFrame/Sunglass";
      const patientLine = PatientName ? `\n${PatientName}` : "";
      return `${nameLine}\n${sizeLine}\n${barcodeLine}\n${patientLine}`;
    }

    // For Accessories (typeid = 2)
    if (typeid === 2) {
      const nameLine = ProductName || "";

      const barcodeLine = Barcode || "";
      const patientLine = PatientName ? `\n${PatientName}` : "";

      return `${nameLine}\n${Variation}\n${barcodeLine}${patientLine}`;
    }

    // For Contact Lens (typeid = 3)
    if (typeid === 3) {
      const nameLine = ProductName || "";

      const specs = PowerSpecs
        ? PowerSpecs.split(",")
            .map((s) => {
              const [key, val] = s.split(":");
              const cleanedValue =
                val && !["null", "undefined"].includes(val.trim())
                  ? val.trim()
                  : "";
              return `${key.trim()}: ${cleanedValue}`;
            })
            .join(", ")
        : "";

      const barcodeLine = Barcode || "";
      const patientLine = PatientName ? `\n${PatientName}` : "";

      return `${nameLine}\n${specs}\n${barcodeLine}${patientLine}`;
    }

    return "";
  };

  // Calculate totals for summary row
  const calculateTotals = () => {
    if (!savedOrders || savedOrders?.length === 0) {
      return { totalQty: 0, totalGST: 0, totalAmount: 0 };
    }

    return savedOrders?.reduce(
      (acc, item) => {
        const qty = parseInt(item.OrderQty);
        const total = parseFloat(item.Total);
        const { gstAmount } = calculateGST(
          item.DiscountedSellingPrice,
          item.TaxPercentage
        );
        const gst = parseFloat(gstAmount);

        return {
          totalQty: acc.totalQty + qty,
          totalGST: acc.totalGST + gst * qty,
          totalAmount: acc.totalAmount + total,
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
  return (
    <div className="max-w-7xl">
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
                onClick={() => goToStep(2)}
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
          <div className="overflow-x-auto px-4">
            <Table
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
                      <pre
                        className="text-sm"
                        style={{
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                        }}
                      >
                        {getProductName(item)}
                      </pre>
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
                        isApplyingDiscount={
                          !!applyingDiscounts[item.OrderDetailId]
                        }
                        isRemovingDiscount={
                          !!removingDiscounts[item.OrderDetailId]
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div>₹{formatNumber(result.gstAmount)}</div>
                      <div>({result.taxPercentage}%)</div>
                    </TableCell>
                    <TableCell>₹{formatNumber(item.Total)}</TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                );
              }}
              emptyMessage="No orders found. Click 'Add Product' to create one."
              pagination={false}
            />
          </div>

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
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Total Amount:</span>
                  <span className="font-semibold text-3xl">
                    ₹{formatNumber(totalAmount.toFixed(2))}
                  </span>
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
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
