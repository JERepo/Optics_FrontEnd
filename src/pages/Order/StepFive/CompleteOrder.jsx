import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useOrder } from "../../../features/OrderContext";
import Button from "../../../components/ui/Button";
import {
  FiArrowLeft,
  FiPlus,
  FiUser,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiClipboard,
} from "react-icons/fi";
import { Table, TableCell, TableRow } from "../../../components/Table";
import {
  useCompleteOrderFinalMutation,
  useGetSavedOrderDetailsQuery,
} from "../../../api/orderApi";
import Loader from "../../../components/ui/Loader";
import Input from "../../../components/Form/Input";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import toast from "react-hot-toast";

// Helper functions
const formatNumber = (num) => {
  return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
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

const DiscountDisplay = ({ item }) => {
  const discountValue = item.DiscountValue || 0;
  const discountPercentage = item.DiscountPercentage || 0;

  return (
    <div className="text-xs bg-green-50 px-2 py-1 rounded text-green-700">
      Discount: ₹{formatNumber(discountValue)} (
      {formatNumber(discountPercentage)}%)
    </div>
  );
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
      Color
    } = item;
    const clean = (val) => {
      if (
        val === null ||
        val === undefined ||
        val === "undefined" ||
        val === "null"
      ) {
        return "";
      }
      return val;
    };
    // For Frame (typeid = 1)
    if (typeid === 1) {
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

    if (typeid === 0) {
      const specsLines = (Specs || [])
        .map((spec) => {
          const side = clean(spec.side);
          const sph = clean(spec.sph);
          const cyl = clean(spec.cyl);
          const axis = clean(spec.axis);
          const addition = clean(spec.addition);

          return `${side}: SPH ${sph}, CYL ${cyl}, Axis ${axis}, Add ${addition}`;
        })
        .join("\n");

      return `${clean(ProductName)}\n${specsLines}\n${clean(Barcode)}${
        PatientName ? `\n${clean(PatientName)}` : ""
      }`;
    }

    return "";
  };

const AdvanceAmountInput = ({
  orderDetailId,
  totalAmount,
  advancedAmounts,
  setAdvancedAmounts,
}) => {
  const handlePasteAmount = () => {
    setAdvancedAmounts((prev) => ({
      ...prev,
      [orderDetailId]: totalAmount,
    }));
  };
  const handleAdvanceAmount = (e) => {
    const { value } = e.target;
    if (parseFloat(value) < 0 || parseFloat(value) > totalAmount) {
      toast.error("Please Enter Valid Advance amount");
      return;
    }
    setAdvancedAmounts((prev) => ({
      ...prev,
      [orderDetailId]: e.target.value,
    }));
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        value={advancedAmounts[orderDetailId] || ""}
        onChange={handleAdvanceAmount}
        className="w-24"
        min="0"
        max={totalAmount}
      />
      <FiClipboard
        className="cursor-pointer text-blue-500 hover:text-blue-700"
        onClick={handlePasteAmount}
      />
    </div>
  );
};

const OrderSummary = ({
  totalQty,
  totalGST,
  totalAmount,
  totalAdvance,
  balanceAmount,
}) => (
  <div className="mt-6 border-t border-gray-200 pt-4 px-4">
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
      <div className="flex flex-col">
        <span className="text-gray-500">Total Qty</span>
        <span className="font-semibold text-lg">{formatNumber(totalQty)}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-gray-500">Total GST</span>
        <span className="font-semibold text-lg">
          ₹{formatNumber(totalGST.toFixed(2))}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-gray-500">Total Amount</span>
        <span className="font-semibold text-xl">
          ₹{formatNumber(totalAmount.toFixed(2))}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-gray-500">Total Advance</span>
        <span className="font-semibold text-lg">
          ₹{formatNumber(totalAdvance.toFixed(2))}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-gray-500">Balance Amount</span>
        <span className="font-semibold text-xl">
          ₹{formatNumber(balanceAmount.toFixed(2))}
        </span>
      </div>
    </div>
  </div>
);

const CompleteOrder = () => {
  const navigate = useNavigate();
  const {
    goToStep,
    customerDetails,
    draftData,
    currentStep,
    customerId,
    updatePaymentDetails,
  } = useOrder();
  const [advancedAmounts, setAdvancedAmounts] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: savedOrders, isLoading: savedOrdersLoading } =
    useGetSavedOrderDetailsQuery({ orderId: customerId.orderId });
  const [updateFinalOrder, { isLoading: isFinalOrderLoading }] =
    useCompleteOrderFinalMutation();

  const handleBack = () => goToStep(currentStep - 1);
  const handleAddProduct = () => goToStep(2);

  const calculateTotals = () => {
    if (!savedOrders || savedOrders.length === 0) {
      return { totalQty: 0, totalGST: 0, totalAmount: 0 };
    }

    return savedOrders.reduce(
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

  const calculateAdvanceSummary = () => {
    let totalAdv = 0;
    let balance = 0;

    if (savedOrders?.length) {
      savedOrders.forEach((item) => {
        const adv = parseFloat(advancedAmounts[item.OrderDetailId]) || 0;
        totalAdv += adv;
        balance += parseFloat(item.Total) - adv;
      });
    }

    return { totalAdvance: totalAdv, balanceAmount: balance };
  };

  const { totalAdvance, balanceAmount } = calculateAdvanceSummary();
  const { totalQty, totalGST, totalAmount } = calculateTotals();

  const submitFinalOrder = async () => {
    const payload = {
      CompanyId: customerId.companyId,
      TotalQty: totalQty,
      TotalGSTValue: totalGST,
      TotalValue: totalAmount,
    };
    if (totalAdvance > 0) {
      // const AdvanceAmount =
      updatePaymentDetails({ ...payload, totalAdvance, advancedAmounts });
      goToStep(6);
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        CompanyId: customerId.companyId,
        TotalQty: totalQty,
        TotalGSTValue: totalGST,
        TotalValue: totalAmount,
      };
      await updateFinalOrder({ orderId: customerId.orderId, payload }).unwrap();

      toast.success("Successfully updated the products");

      navigate("/order-list");
    } catch (error) {
      toast.error("Please try again after some time or try re-load the page!");
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const handleCompleteOrder = () => {
    if (totalAdvance === 0) {
      setShowConfirmModal(true);
    } else {
      const payload = {
        CompanyId: customerId.companyId,
        TotalQty: totalQty,
        TotalGSTValue: totalGST,
        TotalValue: totalAmount,
      };

      updatePaymentDetails({ ...payload, totalAdvance, advancedAmounts });
      goToStep(6);
    }
  };

  if (savedOrdersLoading) return <Loader />;

  return (
    <div className="max-w-7xl">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header Section */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Order Summary
                <span className=" ml-2">(Step {currentStep})</span>
              </h1>
              <p className="text-gray-500 mt-1">
                Review and confirm order details
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                icon={FiArrowLeft}
                variant="outline"
                onClick={handleBack}
                className="w-full sm:w-auto"
              >
                Back
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
                "Product Details",
                "Qty",
                "Rate",
                "Discount",
                "GST",
                "Total",
                "Advance",
              ]}
              data={savedOrders || []}
              renderRow={(item, index) => {
                const { gstAmount, taxPercentage } = calculateGST(
                  item.DiscountedSellingPrice,
                  item.TaxPercentage
                );

                return (
                  <TableRow key={item.SlNo}>
                    <TableCell>{item.SlNo}</TableCell>
                    <TableCell>{getShortTypeName(item.typeid)}</TableCell>
                    <TableCell>
                     <div
                        className="text-sm"
                        style={{
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                        }}
                      >
                        {getProductName(item)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {formatNumber(item.OrderQty)}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{formatNumber(item.Rate)}
                    </TableCell>
                    <TableCell>
                      <DiscountDisplay item={item} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div>₹{formatNumber(gstAmount)}</div>
                      <div className="text-xs">({taxPercentage}%)</div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{formatNumber(item.Total)}
                    </TableCell>
                    <TableCell>
                      <AdvanceAmountInput
                        orderDetailId={item.OrderDetailId}
                        totalAmount={parseFloat(item.Total)}
                        advancedAmounts={advancedAmounts}
                        setAdvancedAmounts={setAdvancedAmounts}
                      />
                    </TableCell>
                  </TableRow>
                );
              }}
              emptyMessage={
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No orders found</p>
                  <Button
                    icon={FiPlus}
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleAddProduct}
                  >
                    Add Product
                  </Button>
                </div>
              }
            />
          </div>

          {/* Order Summary */}
          {savedOrders?.length > 0 && (
            <>
              <OrderSummary
                totalQty={totalQty}
                totalGST={totalGST}
                totalAmount={totalAmount}
                totalAdvance={totalAdvance}
                balanceAmount={balanceAmount}
              />

              {/* Action Button */}
              <div className="flex justify-end mt-6">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-lg"
                  onClick={handleCompleteOrder}
                >
                  {totalAdvance === 0 ? "Complete Order" : "Collect Payment"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={submitFinalOrder}
        title="Total Advance warning"
        message="Do you want to process the order without taking an advance?"
        confirmText="Yes, Proceed"
        cancelText="Cancel"
        danger={false}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default CompleteOrder;
