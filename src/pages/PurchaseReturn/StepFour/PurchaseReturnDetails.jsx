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
import { useCreateEInvoiceMutation } from "../../../api/InvoiceApi";
import { useGetLocationByIdQuery } from "../../../api/roleManagementApi";
import { useGetCompanyIdQuery } from "../../../api/customerApi";

const getProductName = (item) => {
  const type = item.ProductType;

  console.log("item --", item);
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
    // BatchCode,
    CLBatchCode,
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
    const cleaned = clean(val);
    if (!cleaned) return "";
    const num = parseFloat(cleaned);
    if (isNaN(num)) return "";
    return num >= 0 ? `+${num.toFixed(2)}` : `${num.toFixed(2)}`;
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
  if (type === 3) {
    const barcode = clean(detail.barcode);
    const expiry = clean(detail.Stock[0]?.Expiry);
    const batchcode = clean(detail.BatchCode);
    let specsObj = {};

    // handle string or object
    if (typeof PowerSpecs === "string") {
      PowerSpecs.split(",").forEach((pair) => {
        let [key, value] = pair.split(":").map((s) => s.trim());
        if (value === "null") value = null;
        specsObj[key] = value;
      });
    } else if (typeof PowerSpecs === "object" && PowerSpecs !== null) {
      specsObj = PowerSpecs;
    }

    // Now you can safely access
    const sph = formatPowerValue(specsObj.Sph);
    const cyld = formatPowerValue(specsObj.Cyl);
    const axis = clean(specsObj.Axis);
    const addl = formatPowerValue(specsObj.Add);
    const clr = clean(colour || Colour);

    const specsList = [
      sph && `SPH: ${sph}`,
      cyld && `CYL: ${cyld}`,
      axis && `Axis: ${axis}`,
      addl && `Add: ${addl}`,
    ]
      .filter(Boolean)
      .join(", ");

    return [
      productName,
      specsList,
      barcode && `Barcode: ${barcode}`,
      (item?.BatchCode && CLBatchCode) ? `Batch Code: ${item?.BatchCode || "-"}` : ``,
      (expiry && CLBatchCode) ? `Expiry : ${expiry.split("-").reverse().join("/")}` : ``,
      HSN && `HSN: ${HSN}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (type === 0) {
    const detailsArray = Array.isArray(detail) ? detail : [detail];

    return detailsArray
      .map((d) => {
        const olLine = clean(d.productDescName);

        // AddOns & Tint
        const addonNames = d.specs?.addOn?.addOnName;
        const tintName = d.specs?.tint?.tintName;

        // Power formatting
        const joinNonEmpty = (arr, sep = " ") => arr.filter(Boolean).join(sep);
        const formatPower = (eye) =>
          joinNonEmpty(
            [
              formatPowerValue(eye?.sphericalPower) &&
              `SPH: ${formatPowerValue(eye?.sphericalPower)}`,
              formatPowerValue(eye?.addition) &&
              `Add: ${formatPowerValue(eye?.addition)}`,
              clean(eye?.diameter) && `Dia: ${clean(eye?.diameter)}`,
            ],
            ", "
          );

        const pd = d?.specs?.powerDetails || {};
        const rightParts = formatPower(pd.right || {});
        const leftParts = formatPower(pd.left || {});
        const powerLine = joinNonEmpty(
          [rightParts && `R: ${rightParts}`, leftParts && `L: ${leftParts}`],
          "\n"
        );

        // Fitting price
        let fittingLine = "";
        const fitPrice = parseFloat(item?.FittingReturnPrice || 0);
        const gstPerc = parseFloat(item?.FittingTaxPercentage || 0);
        if (!isNaN(fitPrice) && !isNaN(gstPerc) && fitPrice > 0) {
          fittingLine = `Fitting Price: ₹${(
            fitPrice *
            (1 + gstPerc / 100)
          ).toFixed(2)}`;
        }

        return joinNonEmpty(
          [
            olLine,
            powerLine,
            addonNames && `AddOn: ${addonNames}`,
            tintName && `Tint: ${tintName}`,
            fittingLine,
            clean(d.hSN) && `HSN: ${clean(d.hSN)}`,
          ],
          "\n"
        );
      })
      .join("\n\n"); // join multiple products if array
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
      return parseFloat(item?.ProductDetails?.price?.MRP || 0);
    }

    const stockCheck = Array.isArray(item.ProductDetails.Stock)
      ? item?.ProductDetails?.Stock[0]?.MRP
      : item?.ProductDetails?.Stock?.MRP;
    return stockCheck;
  } else if (item.ProductType === 1) {
    return parseFloat(item?.ProductDetails?.Stock?.MRP);
  } else if (item.ProductType === 2) {
    return parseFloat(item?.ProductDetails?.Stock?.OPMRP);
  } else if (item.ProductType === 0) {
    return parseFloat(item?.ProductDetails[0]?.pricing?.mrp || null);
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
  const { user, hasMultipleLocations } = useSelector((state) => state.auth);
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
  const [createInvoice, { isLoading: isInvoiceCreating }] =
    useCreateEInvoiceMutation();
  const { data: locationById } = useGetLocationByIdQuery(
    { id: parseInt(hasMultipleLocations[0]) },
    { skip: !parseInt(hasMultipleLocations[0]) }
  );
  const companyId = locationById?.data?.data.Id;

  const { data: companySettings } = useGetCompanyIdQuery(
    { id: companyId },
    { skip: !companyId }
  );
  const EInvoiceEnable = companySettings?.data?.data.EInvoiceEnable;
  const InvInvoiceEnable = companySettings?.data?.data.DNEInvoiceEnable;

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
        vendorId: customerPurchase?.customerData?.Id,
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
      const unitPrice = parseFloat(item.DNPrice);
      const gstRate = parseFloat(item.ProductTaxPercentage) / 100;

      const fittingPrice = parseFloat(item.FittingReturnPrice || 0);
      const fgst = parseFloat(item.FittingTaxPercentage || 0);
      const fittingTotal = fittingPrice * (fgst / 100);

      const basicValue = (unitPrice * qty) + fittingPrice;
      const gst = unitPrice * qty * gstRate + fittingTotal;
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
        vendorId: customerPurchase?.customerData?.Id,
        payload,
      }).unwrap();
      const eInvoicePayload = {
        recordId: purchaseDraftData.Id ?? null,
        type: "purchaseReturn",
      };
      if (
        customerPurchase?.customerData?.TAXRegisteration === 1 &&
        InvInvoiceEnable === 1 &&
        EInvoiceEnable === 1
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
              "return price",
              "gst/unit",
              "return total price",
              "action",
            ]}
            data={purchaseDetails?.details || []}
            renderRow={(item, index) => (
              <TableRow key={item.ID}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{getShortTypeName(item.ProductType)}</TableCell>
                <TableCell>{item.VendorOrderNo}</TableCell>
                <TableCell className="whitespace-pre-wrap">
                  {getProductName(item)}
                </TableCell>
                <TableCell>₹{formatINR(getStockOutPrice(item))} </TableCell>

                <TableCell>{item.DNQty}</TableCell>

                <TableCell>₹{formatINR(item.DNPrice)} </TableCell>

                <TableCell>
                  ₹
                  {formatINR(
                    parseFloat(item.DNPrice) *
                    (parseFloat(item.ProductTaxPercentage) / 100)
                  )}{" "}
                  ({parseFloat(item.ProductTaxPercentage)}%)
                </TableCell>

                <TableCell>
                  ₹
                  {formatINR(
                    parseFloat(item.DNPrice) * item.DNQty + parseFloat(item?.FittingReturnPrice || 0) +
                    parseFloat(item.DNPrice) *
                    item.DNQty *
                    (parseFloat(item.ProductTaxPercentage) / 100) +
                    parseFloat(item.FittingReturnPrice || 0) *
                    (parseFloat(item.FittingTaxPercentage || 0) / 100)
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
                isLoading={isPRUpdating || isInvoiceCreating}
                disabled={isPRUpdating || isInvoiceCreating}
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
