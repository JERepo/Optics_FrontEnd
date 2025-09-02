import React, { useState } from "react";
import { useOrder } from "../../../features/OrderContext";
import { Table, TableCell, TableRow } from "../../../components/Table";
import {
  useCompleteSaleReturnMutation,
  useGetSavedSalesReturnQuery,
} from "../../../api/salesReturnApi";
import Button from "../../../components/ui/Button";
import Textarea from "../../../components/Form/Textarea";
import { useNavigate } from "react-router";
import { FiTrash2 } from "react-icons/fi";
import { formatINR } from "../../../utils/formatINR";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const getProductName = (order) => {
  const {
    productType,
    ProductType,
    productDetails,
    fittingPrice,
    fittingGSTPercentage,
    batchCode,
    expiry,
    Spherical,
    Cylinder,
    Diameter,
    AddOnData,
  } = order;

  const detail = Array.isArray(productDetails)
    ? productDetails[0]
    : productDetails;

  if (!detail) return "";

  const clean = (val) =>
    val == null ||
    val === "undefined" ||
    val === "null" ||
    val === "" ||
    val === "N/A"
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
    const line1 = clean(
      ` ${clean(detail.productName || detail.productDescName)}`
    );
    const line2 = clean(detail.Size?.Size) || clean(detail.specs);
    const cat = "Optical Frame";

    return joinNonEmpty(
      [
        line1,
        line2 && `Size: ${line2}`,
        cat && `Category: ${cat}`,
        clean(detail.barcode) && `Barcode: ${clean(detail.barcode)}`,
        clean(detail.hsncode || detail.hSN || detail.HSN) &&
          `HSN: ${clean(detail.hsncode || detail.hSN || detail.HSN)}`,
      ],
      "\n"
    );
  }

  // Accessories / Variation (ProductType 2)
  if (productType === 2) {
     const line1 = clean(
      ` ${clean(detail.productName || detail.productDescName)}`
    );
    return joinNonEmpty(
      [
        clean(line1),
        clean(`${detail.productDescName}`),
        clean(detail.Variation?.Variation || detail.variationName) &&
          `Variation: ${detail.Variation?.Variation || detail.variationName}`,
        clean(detail.barcode) && `Barcode: ${clean(detail.barcode)}`,
        clean(detail.hsncode || detail.hSN || detail.HSN) &&
          `HSN: ${clean(detail.hsncode || detail.hSN || detail.HSN)}`,
      ],
      "\n"
    );
  }

  // Contact Lens (ProductType 3)
  if (productType === 3) {
    const bc = detail.CLBatchCode === 1 ? detail.Stock[0].BatchCode : null;
    const ex = detail.CLBatchCode === 1 ? detail.Stock[0].Expiry : null;
// in the sales return PowerSpecs only
    const specsList = joinNonEmpty(
      [
        cleanPower(detail.PowerSpecs?.Sph) &&
          `SPH: ${cleanPower(detail.PowerSpecs?.Sph)}`,
        cleanPower(detail.PowerSpecs?.Cyl) &&
          `CYL: ${cleanPower(detail.PowerSpecs?.Cyl)}`,
        clean(detail.PowerSpecs?.Axis) && `Axis: ${clean(detail.PowerSpecs?.Axis)}`,
        cleanPower(detail.PowerSpecs?.Add) &&
          `Add: ${cleanPower(detail.PowerSpecs?.Add)}`,
      ],
      ", "
    );

    return joinNonEmpty(
      [
        joinNonEmpty([clean(detail.productName)]),
        specsList,
        clean(detail.specs?.color || detail.colour) &&
          `Color: ${clean(detail.specs?.color || detail.colour)}`,
        clean(detail.specs?.barcode || detail.barcode) &&
          `Barcode: ${clean(detail.specs?.barcode || detail.barcode)}`,
        (clean(bc || detail.BatchCode) || clean(ex || detail.ExpiryDate)) &&
          `Batch Code: ${bc || detail.BatchCode || "-"} | Expiry: ${
            ex || detail.ExpiryDate
              ? ex.split("-").reverse().join("/") ||
                detail.ExpiryDate.split("-").reverse().join("/")
              : "-"
          }`,
        clean(detail.hSN || detail.hsncode || detail.HSN) &&
          `HSN: ${clean(detail.hSN || detail.hsncode || detail.HSN)}`,
      ],
      "\n"
    );
  }

  // Ophthalmic Lenses (ProductType 0)
  if (productType === 0) {
    const olLine = clean(`${detail.productName} ${detail.treatmentName} ${detail.coatingName}`);
    // AddOns
    const addonNames = Array.isArray(AddOnData)
      ? AddOnData?.map((item) => clean(item.name?.split(" - ₹")[0])).filter(
          Boolean
        )
      : "";
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

    const pd = detail?.specs?.powerDetails || {};
    const rightParts = formatPower(pd.right || {});
    const leftParts = formatPower(pd.left || {});

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
        // clean(detail.colour) && `Color: ${detail.colour}`,
        clean(detail.barcode) && `Barcode: ${clean(detail.barcode)}`,

        fittingLine,
        addonNames,
        clean(detail.hSN || detail.hsncode || detail.HSN) &&
          `HSN: ${
            clean(detail.hSN) || clean(detail.hsncode) || clean(detail.HSN)
          }`,
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
const getStockOutMRP = (data) => {
  const productType = data.ProductType;
  const item = Array.isArray(data.ProductDetails)
    ? data.ProductDetails[0]
    : data.ProductDetails;

  if (productType === 3) {
    if (item.CLBatchCode === 0) {
      return parseFloat(item.price?.MRP || 0);
    } else if (item.CLBatchCode === 1) {
      if (Array.isArray(item.Stock)) {
        return item.Stock[0].MRP || 0;
      } else if (item.Stock && typeof item.Stock === "object") {
        return parseFloat(item.Stock.MRP || 0);
      }
    }

    return parseFloat(item.Stock?.MRP || 0);
  }
  if (productType === 1) {
    return parseFloat(item.Stock?.FrameSRP || 0);
  }
  if (productType === 2) {
    return parseFloat(item.Stock?.OPMRP || 0);
  }
  if (productType === 0) {
    if (item.CLBatchCode === 0) {
      return parseFloat(item.price?.MRP || 0);
    } else if (item.CLBatchCode === 1) {
      if (Array.isArray(item.Stock)) {
        return item.Stock[0].MRP || 0;
      } else if (item.Stock && typeof item.Stock === "object") {
        return parseFloat(item.Stock.MRP || 0);
      }
    }

    return parseFloat(item.Stock?.MRP || 0);
  }

  return 0;
};
const CompleteSalesReturn = () => {
  const { user } = useSelector((state) => state.auth);
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

  const { data: finalProducts, isLoading: isProductsLoading } =
    useGetSavedSalesReturnQuery(
      { id: salesDraftData?.Id, locationId: customerSalesId.locationId },
      { skip: !selectedPatient }
    );
  const [completeSales, { isLoading: isCompleteSalesLoading }] =
    useCompleteSaleReturnMutation();
  // Calculate totals
  const totals = finalProducts?.data?.reduce(
    (acc, item) => {
      if (itemsToDelete.includes(item.id)) return acc;

      const returnQty = parseInt(item.ReturnQty) || 0;
      const returnPrice = parseFloat(item.ReturnPricePerUnit) || 0;
      const gstPercentage = parseFloat(item.GSTPercentage) || 0;

      const fittingPrice = parseFloat(item?.FittingCharges || 0)
      const fittingGst = parseFloat(item?.FittingGSTPercentage || 0)
      const fittingValue = fittingPrice * (fittingGst /100);

      const gst = calculateGST(returnPrice * returnQty, gstPercentage);

      return {
        totalQty: acc.totalQty + returnQty,
        totalGST: acc.totalGST + (parseFloat(gst.gstAmount) || 0) + fittingValue,

        totalReturnValue:
          acc.totalReturnValue +
          (parseFloat(item.TotalAmount) || 0) +
          fittingPrice + fittingValue
          // +
          // parseFloat(gst.gstAmount),
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
  console.log("patient", selectedPatient);
  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      const payload = { delete: [id] };
      await completeSales({
        id: salesDraftData.Id,
        userId: user.Id,
        locationId: customerSalesId.locationId,
        payload,
      }).unwrap();
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
        delete: [],
        comment: comment.trim() || null,
        CNQty: totals.totalQty,
        CNGST: parseFloat(totals.totalGST),
        CNTotal: parseFloat(totals.totalReturnValue),
        creditBilling: selectedPatient?.mainCustomerObject?.CreditBilling,
      };

      await completeSales({
        id: salesDraftData.Id,
        userId: user.Id,
        locationId: customerSalesId.locationId,
        payload,
      }).unwrap();
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
              "return Qty",
              "return Total Amount",
              "Action",
            ]}
            data={finalProducts?.data || []}
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
                  <TableCell>
                    {item.InvoiceMain && (
                      <div>
                        {item.InvoiceMain.InvoicePrefix}/
                        {item.InvoiceMain.InvoiceNo}/
                        {item.ProductDetails[0].slNo}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {getShortTypeName(item.ProductType)}
                  </TableCell>
                  <TableCell>
                    <div className="whitespace-pre-wrap">
                      {getProductName(mappedOrder)}
                    </div>
                  </TableCell>
                  <TableCell>₹{parseFloat(item.SRP)}</TableCell>
                  <TableCell>
                    ₹{parseFloat(item.ReturnPricePerUnit || 0)}
                  </TableCell>
                  <TableCell>
                    ₹
                    {
                      calculateGST(
                        item.ReturnPricePerUnit,
                        parseFloat(item.GSTPercentage || 0)
                      ).gstAmount
                    }
                    (
                    {
                      calculateGST(
                        item.ReturnPricePerUnit,
                        parseFloat(item.GSTPercentage || 0)
                      ).taxPercentage
                    }
                    % )
                  </TableCell>
                  <TableCell className="text-center">
                    {item.ReturnQty || 0}
                  </TableCell>
                  <TableCell>
                    ₹
                    {formatINR(
                      parseFloat(
                        item.ReturnPricePerUnit * item.ReturnQty
                       
                      ) +
                        parseFloat(
                          item.ProductType === 0
                            ? parseFloat(
                                (item.FittingCharges || 0) *
                                  ((item.FittingGSTPercentage || 0) / 100)
                              )
                            : 0
                        )
                        + parseFloat(item.FittingCharges || 0)
                    )}
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
