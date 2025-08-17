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
    modelNo,
    colourCode,
    size,
    dBL,
    templeLength,
    productName,
    batchBarCode,
  } = order;

  const clean = (val) =>
    val == null || val === "undefined" || val === "null"
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
    const line1 = joinNonEmpty([
      clean(brandName),
      clean(modelNo),
      clean(colourCode),
    ]);
    const line2 = joinNonEmpty(
      [clean(size), clean(dBL), clean(templeLength)],
      "-"
    );
    const cat = category === 1 ? "Optical Frame" : "Sunglass";

    return joinNonEmpty(
      [
        line1,
        line2,
        cat,
        clean(barcode) && `Barcode: ${clean(barcode)}`,
        clean(hSN) && `HSN: ${clean(hSN)}`,
      ],
      "\n"
    );
  }

  // Sunglasses / Variation items (ProductType 2)
  if (productType === 2) {
    return joinNonEmpty(
      [
        joinNonEmpty([clean(brandName), clean(productName)]),
        clean(specs?.variation) && `Variation: ${clean(specs?.variation)}`,
        clean(specs?.barcode) && `Barcode: ${clean(specs?.barcode)}`,
        clean(hSN) && `HSN: ${clean(hSN)}`,
      ],
      "\n"
    );
  }

  // Contact lenses (ProductType 3)
  if (productType === 3) {
    const specsList = joinNonEmpty(
      [
        cleanPower(specs?.sphericalPower) &&
          `SPH: ${cleanPower(specs?.sphericalPower)}`,
        cleanPower(specs?.cylindricalPower) &&
          `CYL: ${cleanPower(specs?.cylindricalPower)}`,
        clean(specs?.axis) && `Axis: ${clean(specs?.axis)}`,
        cleanPower(specs?.additional) &&
          `Add: ${cleanPower(specs?.additional)}`,
      ],
      ", "
    );

    return joinNonEmpty(
      [
        joinNonEmpty([clean(brandName), clean(productName)]),
        specsList,
        clean(specs?.color) && `Color: ${clean(specs?.color)}`,
        clean(batchBarCode || barcode) &&
          `Barcode: ${clean(batchBarCode || barcode)}`,
        (batchCode || expiry) &&
          `Batch Code: ${batchCode || "-"} | Expiry: ${
            expiry ? expiry.split("-").reverse().join("/") : "-"
          }`,
        clean(hSN) && `HSN: ${clean(hSN)}`,
      ],
      "\n"
    );
  }

  // Ophthalmic lenses (ProductType 0)
  if (productType === 0) {
    const olLine = joinNonEmpty([
      clean(brandName),
      clean(focality),
      clean(familyName),
      clean(designName),
      index ? `1.${index}` : "",
      clean(coatingName),
      clean(treatmentName),
    ]);

    const formatPower = (eye) =>
      joinNonEmpty(
        [
          cleanPower(eye?.sphericalPower) &&
            `SPH: ${cleanPower(eye?.sphericalPower)}`,
          cleanPower(eye?.addition) && `Add: ${cleanPower(eye?.addition)}`,
          clean(eye?.diameter) && `Dia: ${clean(eye?.diameter)}`,
        ],
        ", "
      );

    const rightParts = formatPower(specs?.powerDetails?.right || {});
    const leftParts = formatPower(specs?.powerDetails?.left || {});
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
        clean(specs?.addOn?.addOnName) &&
          `Addon: ${clean(specs?.addOn?.addOnName)}`,
        clean(specs?.tint?.tintName) && `Tint: ${clean(specs?.tint?.tintName)}`,
        clean(barcode) && `Barcode: ${clean(barcode)}`,
        clean(hSN) && `HSN: ${clean(hSN)}`,
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
  const {
    selectedPatient,
    findGSTPercentage,
    calculateGST,
    salesDraftData,
    prevSalesStep,
    goToSalesStep,
  } = useOrder();

  const {
    data: finalProducts,
    isLoading: isProductsLoading,
    refetch,
  } = useGetSavedSalesReturnQuery(
    { id: salesDraftData?.Id },
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

  const handleDelete = (id) => {
    if (id && !itemsToDelete.includes(id)) {
      setItemsToDelete((prev) => [...prev, id]);
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
    <div className="max-w-7xl">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Customer Info Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Sales Return Details
            </h2>
            <div className="flex items-center gap-4">
            <Button onClick={() => goToSalesStep(2)}>Add</Button>
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
        <div className="overflow-x-auto">
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
                productName: item.ProductDetails?.productName,
                barcode: item.ProductDetails?.barcode,
                colourCode: item.ProductDetails?.colour,
                size: item.ProductDetails?.Size,
                hSN: item.ProductDetails?.hsncode,
                specs: item.ProductDetails?.PowerSpecs
                  ? {
                      sphericalPower: item.ProductDetails.PowerSpecs.Sph,
                      cylindricalPower: item.ProductDetails.PowerSpecs.Cyl,
                      axis: item.ProductDetails.PowerSpecs.Axis,
                      additional: item.ProductDetails.PowerSpecs.Add,
                    }
                  : {},
                fittingPrice: item.FittingCharges,
                fittingGSTPercentage: item.GSTPercentage,
              };

              return (
                <TableRow key={item.SalesReturnDetailId || index}>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell>{item.InvoiceNo ?? ""}</TableCell>
                  <TableCell className="text-center">
                    {getShortTypeName(item.ProductType)}
                  </TableCell>
                  <TableCell>
                    <div className="whitespace-pre-wrap break-words max-w-xs">
                      {getProductName(mappedOrder)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{parseFloat(item.SRP || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{parseFloat(item.ReturnPricePerUnit || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹
                    {
                      calculateGST(
                        parseFloat(item.ReturnPricePerUnit || 0) *
                          parseInt(item.ReturnQty || 0),
                        parseFloat(item.GSTPercentage || 0)
                      ).gstAmount
                    }
                  </TableCell>
                  <TableCell className="text-center">
                    {item.ReturnQty || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{parseFloat(item.TotalAmount || 0)}
                  </TableCell>
                  <TableCell>
                    <Button
                      className="px-3 py-1"
                      onClick={() => handleDelete(item.id)}
                      icon={FiTrash2}
                    >
                      Delete
                    </Button>
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

        {/* Totals Section */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-xs">
              <span className="text-sm text-gray-500">Total Quantity</span>
              <span className="text-lg font-semibold">
                {formattedTotals.totalQty}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-xs">
              <span className="text-sm text-gray-500">Total GST</span>
              <span className="text-lg font-semibold">
                ₹{formattedTotals.totalGST}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-xs">
              <span className="text-sm text-gray-500">Basic Value</span>
              <span className="text-lg font-semibold">
                ₹{formattedTotals.totalBasicValue}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-xs">
              <span className="text-sm text-gray-500">Total Return Value</span>
              <span className="text-lg font-semibold">
                ₹{formattedTotals.totalReturnValue}
              </span>
            </div>
          </div>
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
