import React, { useState } from "react";
import { useOrder } from "../../../features/OrderContext";
import { Table, TableCell, TableRow } from "../../../components/Table";

import Button from "../../../components/ui/Button";
import Textarea from "../../../components/Form/Textarea";
import { useNavigate } from "react-router";
import { FiTrash2 } from "react-icons/fi";
import { formatINR } from "../../../utils/formatINR";
import {
  useDeleteUpdateSTKInMutation,
  useGetStockInDetailsQuery,
} from "../../../api/stockTransfer";
import toast from "react-hot-toast";
import Loader from "../../../components/ui/Loader";
import { useSelector } from "react-redux";

const getProductName = (data) => {
  const item = { ...data.ProductDetails, ...data };
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
    productName,
    barcode,
    ProductType,
    hsncode,
    colour,
    brandName,
    HSN,
    BatchCode,
    CLBatchCode,
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
  if (ProductType === 1) {
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
  if (ProductType === 2) {
    const lines = [
      ProductName || productName,
      Variation ? `Variation: ${Variation.Variation}` : "",
      barcode ? `Barcode: ${barcode}` : "",
      clean(hsncode || HSN) ? `HSN: ${hsncode || HSN}` : "",
    ];
    return lines.filter(Boolean).join("\n");
  }

  // For Contact Lens (ProductType = 3)
  if (ProductType === 3) {
    const batchcode = item?.Stock[0]?.BatchCode ?? null;
    const expiry = item?.Stock[0]?.Expiry ?? null;
    const specs = PowerSpecs
      ? [
          PowerSpecs.Sph ? `Sph: ${formatPowerValue(PowerSpecs.Sph)}` : "",
          PowerSpecs.Cyl ? `Cyl: ${formatPowerValue(PowerSpecs.Cyl)}` : "",
          PowerSpecs.Axis ? `Axis: ${formatPowerValue(PowerSpecs.Axis)}` : "",
          PowerSpecs.Add ? `Add: ${formatPowerValue(PowerSpecs.Add)}` : "",
        ]
          .filter(Boolean)
          .join(", ")
      : "";

    const lines = [
      productName,
      specs ? `${specs}` : "",
      clean(colour) ? `Colour: ${clean(colour)}` : "",
      barcode ? `Barcode: ${barcode}` : "",
      clean(batchcode) && CLBatchCode === 1 ? `BatchCode: ${batchcode}` : "",
      clean(expiry) &&
        CLBatchCode === 1 &&
        `Expiry: ${expiry.split("-").reverse().join("/")}`,
      clean(hsncode || HSN) ? `HSN: ${hsncode || HSN}` : "",
    ];

    return lines.filter(Boolean).join("\n");
  }

  // For Optical Lens (ProductType = 0)
  if (ProductType === 0) {
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
      clean((ProductName || productName) && `${productName}`),
      specsLines,
      tintName ? `Tint: ${tintName}` : "",
      addOns?.length > 0 ? `AddOn: ${addOns.join(", ")}` : "",
      clean(FittingPrice) ? `Fitting Price: ${FittingPrice}` : "",
      clean(hsncode || HSN) && `HSN: ${hsncode || HSN}`,
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

const getStockOutPrice = (data) => {
  const item = { ...data.ProductDetails, ...data };
  if (!item) {
    return 0;
  }

  if (item.ProductType === 3) {
    if (item.CLBatchCode === 0) {
      return parseFloat(item.price?.BuyingPrice || 0);
    } else if (item.CLBatchCode === 1) {
      if (Array.isArray(item.Stock)) {
        return item.Stock[0].BuyingPrice || 0;
      } else if (item.Stock && typeof item.Stock === "object") {
        return parseFloat(item.Stock.BuyingPrice || 0);
      }
    }

    return parseFloat(item.Stock?.BuyingPrice || 0);
  }
  if (item.ProductType === 1) {
    return parseFloat(item.Stock?.BuyingPrice || 0);
  }
  if (item.ProductType === 2) {
    return parseFloat(item.Stock?.BuyingPrice || 0);
  }
  if (item.ProductType === 0) {
    if (item.CLBatchCode === 0) {
      return parseFloat(item.price?.BuyingPrice || 0);
    } else if (item.CLBatchCode === 1) {
      if (Array.isArray(item.Stock)) {
        return item.Stock[0].BuyingPrice || 0;
      } else if (item.Stock && typeof item.Stock === "object") {
        return parseFloat(item.Stock.BuyingPrice || 0);
      }
    }

    return parseFloat(item.Stock?.BuyingPrice || 0);
  }
  return 0;
};

const CompleteStockTransferIn = () => {
  const { user } = useSelector((state) => state.auth);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);

  const {
    customerStockTransferIn,
    currentStockTransferInStep,
    stockTransferInDraftData,
    goToStockTransferInStep,
    prevStockTransferInStep,
    selectedStockTransferInProduct,
    updateCurrentSTINStep,
  } = useOrder();

  const { data: stockDetails, isLoading: isStockDetailsLoading } =
    useGetStockInDetailsQuery({
      mainId: stockTransferInDraftData.ID,
      locationId: customerStockTransferIn.locationId,
    });
  console.log("stock data", stockDetails);
  const [updateStockTI, { isLoading: isUpdating }] =
    useDeleteUpdateSTKInMutation();

  const handleDeleteItem = async (id) => {
    setDeletingId(id);
    try {
      const payload = {
        STInMainId: stockTransferInDraftData.ID ?? null,
        ApplicationUserID: user.Id,
        companyId: customerStockTransferIn.locationId,
        Comment: comment,
        delete: [id],
      };
      await updateStockTI({ payload }).unwrap();
      toast.success("Deleted successfully");
    } catch (error) {
      toast.error(error?.data.error.message);
    }
  };

  const totals = (stockDetails?.data?.StockTransferInDetails || []).reduce(
    (acc, item) => {
      const qty = item.STQtyIn || 0;
      const unitPrice = parseFloat(item.TransferPrice);
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

  const formattedTotals = {
    totalQty: totals.totalQty,
    totalGST: formatINR(totals.totalGST),
    totalBasicValue: formatINR(totals.totalBasicValue),
    totalReturnValue: formatINR(totals.totalReturnValue),
  };
  const handleSaveStockTransferOut = async () => {
    try {
      const payload = {
        STInMainId: stockTransferInDraftData.ID ?? null,
        ApplicationUserID: user.Id ?? null,
        companyId: customerStockTransferIn.locationId ?? null,
        totalQtyIn: parseInt(totals.totalQty) ?? null,
        totalGSTValueIn: parseFloat(totals.totalGST) ?? null,
        totalBasicValueIn: parseFloat(totals.totalBasicValue) ?? null,
        totalValueIn: parseFloat(totals.totalReturnValue) ?? null,
        Comment: comment ?? null,
      };

      await updateStockTI({ payload }).unwrap();
      toast.success("Stock TransferIn successfully updated");
      navigate("/stock-transfer-in");
      updateCurrentSTINStep(1);
    } catch (error) {
      console.log(error);
      toast.error(error?.data.message);
    }
  };
  console.log(stockDetails);
  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Customer Info Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Stock TransferIn Details
            </h2>
            <div className="flex items-center gap-4">
              <Button onClick={() => goToStockTransferInStep(2)}>
                Add Product
              </Button>
              <Button
                variant="outline"
                onClick={() => prevStockTransferInStep()}
              >
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
              "type",
              "product details",
              "transfer price",
              "pending qty",
              "transfer in qty",
              "gst",
              "total amount",
              "action",
            ]}
            data={stockDetails?.data?.StockTransferInDetails}
            renderRow={(item, index) => (
              <TableRow key={item.ID}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{getShortTypeName(item.ProductType)}</TableCell>
                <TableCell className="whitespace-pre-wrap">
                  {getProductName(item)}
                </TableCell>
                <TableCell>₹{formatINR(item.TransferPrice)}</TableCell>
                <TableCell>{item.PendingQty || 0}</TableCell>
                <TableCell>{item.STQtyIn}</TableCell>

                <TableCell>
                  ₹
                  {formatINR(
                    parseFloat(item.TransferPrice) *
                      (parseFloat(item.ProductTaxPercentage) / 100)
                  )}
                  ({parseFloat(item.ProductTaxPercentage)}%)
                </TableCell>

                <TableCell>
                  ₹
                  {/* {formatINR(
                    getStockOutPrice(item) * item.STQtyIn +
                      getStockOutPrice(item) *
                        (parseFloat(item.ProductTaxPercentage) / 100)
                  )} */}
                  {formatINR(
                    parseFloat(item.TransferPrice) * item.STQtyIn +
                      parseFloat(item.TransferPrice) *
                        (parseFloat(item.ProductTaxPercentage) / 100) *
                        item.STQtyIn
                  )}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => handleDeleteItem(item.ID)}
                    className="text-red-500 hover:text-red-700"
                  >
                    {deletingId === item.ID && isUpdating ? (
                      <Loader color="black" />
                    ) : (
                      <FiTrash2 />
                    )}
                  </button>
                </TableCell>
              </TableRow>
            )}
            emptyMessage={
              isStockDetailsLoading ? "Loading..." : "No data found"
            }
          />
        </div>
        {stockDetails?.data?.StockTransferInDetails?.length > 0 && (
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
        {stockDetails?.data?.StockTransferInDetails?.length > 0 && (
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
                isLoading={isUpdating}
                disabled={isUpdating}
              >
                Complete StockTransferIn
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteStockTransferIn;
