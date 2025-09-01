import React, { useState } from "react";
import { useOrder } from "../../../features/OrderContext";
import { Table, TableCell, TableRow } from "../../../components/Table";

import Button from "../../../components/ui/Button";
import Textarea from "../../../components/Form/Textarea";
import { useNavigate } from "react-router";
import { FiTrash2 } from "react-icons/fi";
import { formatINR } from "../../../utils/formatINR";

import toast from "react-hot-toast";
import Loader from "../../../components/ui/Loader";
import {
  useDeleteUpdatePRMutation,
  useGetPurchaseDetailsQuery,
} from "../../../api/purchaseReturn";
import { useSelector } from "react-redux";

const getProductName = (item) => {
  const type = item.ProductType;
  const detail = item ? item.ProductDetails : {};
  const {
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
    productName,
    barcode,
    hsncode,
    colour,
    brandName,
    HSN,
  } = detail;

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
  if (type === 1) {
    const lines = [
      productName,
      Size ? `Size: ${Size.Size}` : "",
      Category === 0 ? "Category: Optical Frame" : "Category: Sunglasses",
      barcode ? `Barcode: ${barcode}` : "",
      clean(hsncode || HSN) ? `HSN: ${hsncode || HSN}` : "",
    ];
    return lines.filter(Boolean).join("\n");
  }

  // For Accessories (ProductType = 2)
  if (type === 2) {
    const lines = [
      ProductName || productName,
      Variation ? `Variation: ${Variation.Variation}` : "",
      barcode ? `Barcode: ${barcode}` : "",
      clean(hsncode || HSN) ? `HSN: ${hsncode || HSN}` : "",
    ];
    return lines.filter(Boolean).join("\n");
  }

  // For Contact Lens (type = 3)
  if (type === 3) {
    const specs = PowerSpecs
      ? [
          PowerSpecs.Sph ? `Sph: ${clean(PowerSpecs.Sph)}` : "",
          PowerSpecs.Cyl ? `Cyl: ${clean(PowerSpecs.Cyl)}` : "",
          PowerSpecs.Axis ? `Axis: ${clean(PowerSpecs.Axis)}` : "",
          PowerSpecs.Add ? `Add: ${clean(PowerSpecs.Add)}` : "",
        ]
          .filter(Boolean)
          .join(", ")
      : "";

    const lines = [
      (ProductName || brandName) && `${brandName} ${productName}`,
      specs ? `${specs}` : "",
      clean(colour) ? `Colour: ${clean(colour)}` : "",
      barcode ? `Barcode: ${barcode}` : "",
      clean(item.BatchCode) ? `BatchCode: ${item.BatchCode}` : "",
      clean(hsncode || HSN) ? `HSN: ${hsncode || HSN}` : "",
    ];

    return lines.filter(Boolean).join("\n");
  }

  // For Optical Lens (type = 0)
  if (type === 0) {
    const tintName = clean(Tint?.name) || "";
    const addOns = AddOns?.map((a) => clean(a.name)).filter(Boolean) || [];

    const specsLines = (Array.isArray(Specs) ? Specs : [{ ...Specs }])
      .map((spec) => {
        const side = clean(spec?.side);
        const sph = clean(spec?.sph || spec.Spherical);
        const cyl = clean(spec?.cyl || spec.Cylinder);
        const dia = clean(spec.Diameter);
        const axis = clean(spec?.axis);
        const addition = clean(spec?.addition);

        const powerValues = [];
        if (sph) powerValues.push(`SPH ${formatPowerValue(sph)}`);
        if (cyl) powerValues.push(`CYL ${formatPowerValue(cyl)}`);
        if (dia) powerValues.push(`Dia ${formatPowerValue(dia)}`);
        if (axis) powerValues.push(`Axis ${formatPowerValue(axis)}`);
        if (addition) powerValues.push(`Add ${formatPowerValue(addition)}`);

        return powerValues.join(", ");
      })
      .filter(Boolean)
      .join("\n");

    const lines = [
      clean(
        (ProductName || productName) &&
          brandName &&
          `${brandName} ${productName}`
      ),
      specsLines,
      clean(barcode) && `Color: ${colour}`,
      clean(hsncode || HSN) && `HSN: ${hsncode || HSN}`,
      tintName ? `Tint: ${tintName}` : "",
      addOns?.length > 0 ? `AddOn: ${addOns.join(", ")}` : "",
      clean(FittingPrice) ? `Fitting Price: ${FittingPrice}` : "",
    ];

    return lines.filter(Boolean).join("\n");
  }

  return "";
};

const getShortTypeName = (id) => {
  if (id === null || id === undefined) return;
  if (id === 1) return "F/S";
  if (id === 2) return "ACC";
  if (id === 3) return "CL";
  if (id === 0) return "OL";
  return "";
};

const getStockOutPrice = (item) => {
  if (item.ProductType === 3) {
    if (item.ProductDetails.CLBatchCode === 0) {
      return parseFloat(item.ProductDetails.price?.MRP || 0);
    }

    const stockCheck = Array.isArray(item.ProductDetails.Stock)
      ? item.ProductDetails.Stock[0].MRP
      : item.ProductDetails.Stock.MRP;
    return stockCheck;
  } else if (item.ProductType === 1) {
    return parseFloat(item.ProductDetails.Stock.FrameSRP);
  } else if (item.ProductType === 2) {
    return parseFloat(item.ProductDetails.Stock.OPMRP);
  }

  return 0;
};
const getPurchaseValue = (item) => {
  if (item.ProductType === 3) {
    if (item.ProductDetails.CLBatchCode === 0) {
      return parseFloat(item.ProductDetails.price?.BuyingPrice || 0);
    }

    const stockCheck = Array.isArray(item.ProductDetails.Stock)
      ? item.ProductDetails.Stock[0].BuyingPrice
      : item.ProductDetails.Stock.BuyingPrice;
    return stockCheck;
  } else if (item.ProductType === 1) {
    return parseFloat(item.ProductDetails.Stock.BuyingPrice);
  } else if (item.ProductType === 2) {
    return parseFloat(item.ProductDetails.Stock.BuyingPrice);
  }

  return 0;
};

const CompleteStockTransfer = () => {
  const [comment, setComment] = useState("");
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [deletingId, setDeletingId] = useState(null);

  const {
    prevPurchaseStep,
    goToPurchaseStep,
    customerPurchase,
    purchaseDraftData,
  } = useOrder();

  const { data: purchaseDetails, isLoading: isPurchaseDetailsLoading } =
    useGetPurchaseDetailsQuery({
      mainId: purchaseDraftData.Id || purchaseDraftData[0].Id,
      locationId: customerPurchase.locationId,
    });

  const [updatePR, { isLoading: isPRUpdating }] = useDeleteUpdatePRMutation();

  const handleDeleteItem = async (id) => {
    setDeletingId(id);
    try {
      // const payload = {
      //   STOutMainId: purchaseDraftData.ID || purchaseDraftData[0].ID,
      //   FromCompanyId: customerPurchase.locationId,
      //   Comment: comment,
      //   delete: [id],
      // };
      const payload = {
        delete: [id], // Array of PurchaseReturnDetail IDs to delete (optional)
      };
      await updatePR({
        prId: purchaseDraftData.Id,
        userId: user.Id,
        locationId: customerPurchase.locationId,
        payload,
      }).unwrap();
      toast.success("Deleted successfully");
    } catch (error) {
      toast.error(error?.data.message);
    }
  };

  const totals = (purchaseDetails?.details || []).reduce(
    (acc, item) => {
      const qty = item.DNQty || 0;
      const unitPrice = getPurchaseValue(item);
      const gstRate = parseFloat(item.ProductTaxPercentage) / 100;

      const basicValue = unitPrice * qty;
      const gst = unitPrice * qty * gstRate;
      const returnTotal = basicValue + gst;

      acc.totalQty += qty;
      acc.totalGST += gst;
      acc.totalBasicValue += basicValue;
      acc.totalReturnValue += returnTotal;

      return acc;
    },
    { totalQty: 0, totalGST: 0, totalBasicValue: 0, totalReturnValue: 0 }
  );

  console.log(totals);
  const formattedTotals = {
    totalQty: totals.totalQty,
    totalGST: formatINR(totals.totalGST),
    totalBasicValue: formatINR(totals.totalBasicValue),
    totalReturnValue: formatINR(totals.totalReturnValue),
  };
  const handleSaveStockTransferOut = async () => {
    try {
      const payload = {
        comment: comment,
        TotalQty: totals.totalQty,
        TotalGST: totals.totalGST,
        TotalBasicValue: totals.totalBasicValue,
        TotalValue: totals.totalReturnValue,
      };

      await updatePR({
        prId: purchaseDraftData.Id || purchaseDraftData[0].Id,
        userId: user.Id,
        locationId: customerPurchase.locationId,
        payload,
      }).unwrap();
      console.log(payload);
      toast.success("Purchase return successfully updated");
      navigate("/purchase-return");
    } catch (error) {
      toast.error(error?.data.message);
    }
  };

  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Customer Info Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Purchase Return Details
            </h2>
            <div className="flex items-center gap-4">
              <Button onClick={() => goToPurchaseStep(2)}>Add Product</Button>
              <Button variant="outline" onClick={() => prevPurchaseStep()}>
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="p-6">
          <Table
            columns={[
              "s.no",
              "Product type",
              "supplier order no",
              "product details",
              "srp",
              "return qty",
              "return product price",
              "gst/unit",
              "return total price",
              "action",
            ]}
            data={purchaseDetails?.details || []}
            renderRow={(item, index) => (
              <TableRow key={item.ID}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{getShortTypeName(item.ProductType)}</TableCell>
                <TableCell></TableCell>
                <TableCell className="whitespace-pre-wrap">
                  {getProductName(item)}
                </TableCell>
                <TableCell>
                  ₹{formatINR(getStockOutPrice(item))}{" "}
                  
                </TableCell>

                <TableCell>{item.DNQty}</TableCell>

                <TableCell>
                  ₹{formatINR(getPurchaseValue(item) * item.DNQty)}{" "}
                 
                </TableCell>

                <TableCell>
                  ₹
                  {formatINR(
                    getPurchaseValue(item) *
                      (parseFloat(item.ProductTaxPercentage) / 100)
                  )}{" "}
                 ({parseFloat(item.ProductTaxPercentage)}%)
                </TableCell>

                <TableCell>
                  ₹
                  {formatINR(
                    getPurchaseValue(item) * item.DNQty +
                      getPurchaseValue(item) *
                        item.DNQty *
                        (parseFloat(item.ProductTaxPercentage) / 100)
                  )}
                </TableCell>

                <TableCell>
                  <button
                    onClick={() => handleDeleteItem(item.Id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    {deletingId === item.Id && isPRUpdating ? (
                      <Loader color="black" />
                    ) : (
                      <FiTrash2 />
                    )}
                  </button>
                </TableCell>
              </TableRow>
            )}
            emptyMessage={
              isPurchaseDetailsLoading ? "Loading..." : "No data found"
            }
          />
        </div>
        {purchaseDetails?.details?.length > 0 && (
          <div className="flex gap-10 justify-end mt-5 p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-6">
              <span className="text-lg font-semibold">
                Total Qty: {formattedTotals.totalQty}
              </span>
              <span className="text-lg font-semibold">
                Total GST: ₹{formattedTotals.totalGST}
              </span>
              <span className="text-lg font-semibold">
                Total Basic Value: ₹{formattedTotals.totalBasicValue}
              </span>
              <span className="text-lg font-semibold">
                Total Amount: ₹{formattedTotals.totalReturnValue}
              </span>
            </div>
          </div>
        )}
        {purchaseDetails?.details?.length > 0 && (
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
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSaveStockTransferOut}
                isLoading={isPRUpdating}
                disabled={isPRUpdating}
              >
                Complete Purchase Return
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteStockTransfer;
