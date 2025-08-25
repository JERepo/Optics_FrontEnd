import React, { useState } from "react";
import { useOrder } from "../../../features/OrderContext";
import { Table, TableCell, TableRow } from "../../../components/Table";
import {
  useCompleteSaleRetunMutation,
  useGetSavedSalesReturnQuery,
} from "../../../api/salesReturnApi";
import Button from "../../../components/ui/Button";
import Textarea from "../../../components/Form/Textarea";
import { useNavigate } from "react-router";
import { FiTrash2 } from "react-icons/fi";
import { formatINR } from "../../../utils/formatINR";
import toast from "react-hot-toast";

const getProductName = (order) => {
  const {
    productType,
    ProductType,
    productDetails,
    fittingPrice,
    fittingGSTPercentage,
    batchCode,
    expiry,
  } = order;

  const detail = Array.isArray(productDetails)
    ? productDetails[0]
    : productDetails;

  if (!detail) return "";

  const clean = (val) =>
    val == null || val === "undefined" || val === "null" || val === ""
      ? ""
      : String(val).trim();

  const cleanPower = (val) => {
    const cleaned = clean(val);
    if (!cleaned) return "";
    const num = parseFloat(cleaned);
    return isNaN(num) ? "" : num >= 0 ? `+${num}` : `${num}`;
  };

  const joinNonEmpty = (arr, sep = " ") => arr.filter(Boolean).join(sep);

  // Frames (ProductType 1)
  if (productType === 1) {
    const line1 = clean(detail.productName);
    const line2 = clean(detail.Size?.Size);
    const cat = "Optical Frame";

    return joinNonEmpty(
      [
        line1,
        line2 && `Size: ${line2}`,
        cat && `Category: ${cat}`,
        clean(detail.barcode) && `Barcode: ${clean(detail.barcode)}`,
        clean(detail.hsncode) && `HSN: ${clean(detail.hsncode)}`,
      ],
      "\n"
    );
  }

  // Accessories / Variation (ProductType 2)
  if (productType === 2) {
    return joinNonEmpty(
      [
        clean(detail.productName),
        clean(detail.Variation) && `Variation: ${clean(detail.Variation.Variation)}`,
        clean(detail.barcode) && `Barcode: ${clean(detail.barcode)}`,
        clean(detail.hsncode) && `HSN: ${clean(detail.hsncode)}`,
      ],
      "\n"
    );
  }

  // Contact Lens (ProductType 3)
  if (productType === 3) {
    const specsList = joinNonEmpty(
      [
        cleanPower(detail.specs?.sphericalPower) &&
          `SPH: ${cleanPower(detail.specs?.sphericalPower)}`,
        cleanPower(detail.specs?.cylindricalPower) &&
          `CYL: ${cleanPower(detail.specs?.cylindricalPower)}`,
        clean(detail.specs?.axis) && `Axis: ${clean(detail.specs?.axis)}`,
        cleanPower(detail.specs?.additional) &&
          `Add: ${cleanPower(detail.specs?.additional)}`,
      ],
      ", "
    );

    return joinNonEmpty(
      [
        joinNonEmpty([clean(detail.brandName), clean(detail.productName)]),
        specsList,
        clean(detail.specs?.color) && `Color: ${clean(detail.specs?.color)}`,
        clean(detail.specs?.barcode || detail.barcode) &&
          `Barcode: ${clean(detail.specs?.barcode || detail.barcode)}`,
        (batchCode || expiry) &&
          `Batch Code: ${batchCode || "-"} | Expiry: ${
            expiry ? expiry.split("-").reverse().join("/") : "-"
          }`,
        clean(detail.hSN || detail.hsncode) &&
          `HSN: ${clean(detail.hSN || detail.hsncode)}`,
      ],
      "\n"
    );
  }

  // Ophthalmic Lenses (ProductType 0)
  if (productType === 0) {
    const olLine = clean(detail.productName);

    const formatPower = (eye) =>
      joinNonEmpty(
        [
          cleanPower(eye?.Spherical) && `SPH: ${cleanPower(eye?.Spherical)}`,
          cleanPower(eye?.Add) && `Add: ${cleanPower(eye?.Add)}`,
          clean(eye?.Diameter) && `Dia: ${clean(eye?.Diameter)}`,
        ],
        ", "
      );

    const rightParts = formatPower(detail.Specs || {});
    const leftParts = ""; // no separate left/right in this response

    const powerLine = joinNonEmpty(
      [rightParts && `R: ${rightParts}`, leftParts && `L: ${leftParts}`],
      "\n"
    );

    let fittingLine = "";
    const fitPrice = parseFloat(fittingPrice);
    const gstPerc = parseFloat(fittingGSTPercentage);
    if (!isNaN(fitPrice) && !isNaN(gstPerc) && fitPrice > 0) {
      fittingLine = `Fitting Price: ₹${(fitPrice * (1 + gstPerc / 100)).toFixed(
        2
      )}`;
    }

    return joinNonEmpty(
      [
        olLine,
        powerLine,
        clean(detail.colour) && `Color: ${detail.colour}`,
        clean(detail.barcode) && `Barcode: ${clean(detail.barcode)}`,
        clean(detail.hsncode) && `HSN: ${clean(detail.hsncode)}`,
        fittingLine,
      ],
      "\n"
    );
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

const CompleteSalesReturn = () => {
  const [comment, setComment] = useState("");
  const navigate = useNavigate();
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  const {
    selectedPatient,
    calculateGST,
    salesDraftData,
    prevSalesStep,
    goToSalesStep,
    customerSalesId,
  } = useOrder();

  const {
    data: finalProducts,
    isLoading: isProductsLoading,
  } = useGetSavedSalesReturnQuery(
    { id: salesDraftData?.Id, locationId: customerSalesId.locationId },
    { skip: !selectedPatient }
  );
  const [completeSales, { isLoading: isCompleteSalesLoading }] =
    useCompleteSaleRetunMutation();

  // Calculate totals
  const totals = finalProducts?.data?.reduce(
    (acc, item) => {
      if (itemsToDelete.includes(item.id)) return acc;

      const returnQty = parseInt(item.ReturnQty) || 0;
      const returnPrice = parseFloat(item.ReturnPricePerUnit) || 0;
      const gstPercentage = parseFloat(item.GSTPercentage) || 0;

      const gst = calculateGST(returnPrice * returnQty, gstPercentage);

      return {
        totalQty: acc.totalQty + returnQty,
        totalGST: acc.totalGST + (parseFloat(gst.gstAmount) || 0),

        totalReturnValue:
          acc.totalReturnValue + (parseFloat(item.TotalAmount) || 0),
      };
    },
    { totalQty: 0, totalGST: 0, totalReturnValue: 0 }
  );

  const formattedTotals = {
    totalQty: totals?.totalQty || 0,
    totalGST: totals ? totals.totalGST.toFixed(2) : "0.00",
    totalBasicValue: totals
      ? totals.totalReturnValue - totals.totalGST
      : "0.00",
    totalReturnValue: totals ? totals.totalReturnValue.toFixed(2) : "0.00",
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      const payload = { delete: [id] };
      await completeSales({ id: salesDraftData.Id, payload }).unwrap();
      setDeletingId(null);
      toast.success("Deleted successfully");
    } catch (error) {
      console.error("Delete failed:", error);
      setDeletingId(null);
    }
  };

  const handleCompleteSalesReturn = async () => {
    try {
      if (!finalProducts?.data || finalProducts.data.length === 0) {
        alert("No items to process for sales return.");
        return;
      }

      const payload = {
        delete: itemsToDelete,
        comment: comment.trim() || null,
        CNQty: totals.totalQty,
        CNGST: parseFloat(totals.totalGST),
        CNTotal: parseFloat(totals.totalReturnValue),
        creditBilling: "No",
      };

      await completeSales({ id: salesDraftData.Id, payload }).unwrap();
      setItemsToDelete([]);
      setComment("");
      navigate("/sales-return");
    } catch (error) {
      console.error("Failed to complete sales return:", error);
    }
  };
  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Customer Info Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Sales Return Details
            </h2>
            <div className="flex items-center gap-4">
              <Button onClick={() => goToSalesStep(2)}>Add Product</Button>
              <Button variant="outline" onClick={() => prevSalesStep()}>
                Back
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Patient Name</span>
              <span className="font-medium">
                {selectedPatient?.CustomerName || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Customer Name</span>
              <span className="font-medium">
                {selectedPatient?.mainCustomerObject?.CustomerName || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Mobile Number</span>
              <span className="font-medium">
                {selectedPatient?.MobNumber || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="">
          <Table
            expand={true}
            columns={[
              "S.No",
              "Invoice no",
              "Type",
              "Product Details",
              "SRP",
              "Return Price",
              "GST Amt",
              "Qty",
              "Total Amount",
              "Action",
            ]}
            data={finalProducts?.data?.filter(
              (item) => !itemsToDelete.includes(item.id)
            )}
            renderRow={(item, index) => {
              const mappedOrder = {
                productType: item.ProductType,
                productDetails: item.ProductDetails,
                fittingPrice: item.FittingCharges,
                fittingGSTPercentage: item.GSTPercentage,
                batchCode: item.BatchCode,
                expiry: item.ExpiryDate,
              };

              return (
                <TableRow key={item.SalesReturnDetailId || index}>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell>{}</TableCell>
                  <TableCell className="text-center">
                    {getShortTypeName(item.ProductType)}
                  </TableCell>
                  <TableCell>
                    <div className="whitespace-pre-wrap break-words max-w-xs">
                      {getProductName(mappedOrder)}
                    </div>
                  </TableCell>
                  <TableCell >
                    ₹{parseFloat(item.SRP || 0)}
                  </TableCell>
                  <TableCell >
                    ₹{parseFloat(item.ReturnPricePerUnit || 0)}
                  </TableCell>
                  <TableCell >
                    ₹
                    {
                      calculateGST(
                        ((item.ReturnPricePerUnit) *
                          (item.ReturnQty)),
                        parseFloat(item.GSTPercentage || 0)
                      ).gstAmount
                    }
                  </TableCell>
                  <TableCell className="text-center">
                    {item.ReturnQty || 0}
                  </TableCell>
                  <TableCell >
                    ₹{parseFloat(item.TotalAmount || 0)}
                  </TableCell>
                  <TableCell>
                    <Button
                      isLoading={deletingId === item.id}
                      disabled={deletingId === item.id}
                      color="white"
                      className="px-3 py-1"
                      onClick={() => handleDelete(item.id)}
                      icon={FiTrash2}
                    ></Button>
                  </TableCell>
                </TableRow>
              );
            }}
            emptyMessage={
              isProductsLoading
                ? "Loading products..."
                : "No products found for return"
            }
          />
        </div>

        <div className="flex gap-10 justify-end mt-5 p-6">
          <div className="flex gap-3">
            <span className="text-xl font-semibold items-center">
              Total Qty: {formattedTotals.totalQty}
            </span>
            <span className="text-xl font-semibold items-center">
              Total GST: ₹{formattedTotals.totalGST}
            </span>
          </div>

          <span className="text-xl font-semibold items-center">
            Basic Value: ₹{formatINR(formattedTotals.totalBasicValue)}
          </span>
          <span className="text-xl font-semibold items-center">
            Total Return Value: ₹{formatINR(formattedTotals.totalReturnValue)}
          </span>
        </div>

        <Textarea
          className="p-6"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          label="Comment"
        />
        {/* Action Buttons */}
        {finalProducts?.data.filter((p) => !itemsToDelete.includes(p.id))
          .length > 0 && (
          <div className="p-4 border-t border-gray-200 flex justify-end gap-4">
            <Button
              variant="primary"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm"
              onClick={handleCompleteSalesReturn}
              disabled={isCompleteSalesLoading || !finalProducts?.data?.length}
            >
              {isCompleteSalesLoading
                ? "Processing..."
                : "Complete Sales Return"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteSalesReturn;
