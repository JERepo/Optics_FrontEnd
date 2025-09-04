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

const getProductNameForNo = (order, referenceApplicable) => {
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
    const productName = clean(` ${clean(detail.productName)}`);
    const size = clean(detail.Size?.Size);
    const cat = "Optical Frame";

    return joinNonEmpty(
      [
        productName && productName,
        size && `Size: ${size}`,
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
    const productName = clean(` ${clean(detail.productName)}`);
    return joinNonEmpty(
      [
        productName && productName,
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
    const bc = detail?.Stock[0]?.BatchCode ?? "";

    const ex = detail?.Stock[0]?.Expiry ?? "";
    // in the sales return PowerSpecs only
    const specsList = joinNonEmpty(
      [
        cleanPower(detail.PowerSpecs?.Sph) &&
          `SPH: ${cleanPower(detail.PowerSpecs?.Sph)}`,
        cleanPower(detail.PowerSpecs?.Cyl) &&
          `CYL: ${cleanPower(detail.PowerSpecs?.Cyl)}`,
        clean(detail.PowerSpecs?.Axis) &&
          `Axis: ${clean(detail.PowerSpecs?.Axis)}`,
        cleanPower(detail.PowerSpecs?.Add) &&
          `Add: ${cleanPower(detail.PowerSpecs?.Add)}`,
      ],
      ", "
    );
   

    return joinNonEmpty(
      [
        joinNonEmpty([
          referenceApplicable === 1 && `${clean(detail.brandName)}`,
          clean(detail.productName),
        ]),
        specsList,
        clean(detail.colour) && `Color: ${clean(detail.colour)}`,
        clean(detail.barcode) && `Barcode: ${clean(detail.barcode)}`,
        (clean(bc || detail.BatchCode) || clean(ex || detail.ExpiryDate)) &&
          `Batch Code: ${bc || detail.BatchCode || "-"} | Expiry: ${
            ex || detail.ExpiryDate
              ? ex.split("-").reverse().join("/") ||
                detail.ExpiryDate.split("-").reverse().join("/")
              : "-"
          }`,
        clean(detail.HSN) && `HSN: ${clean(detail.HSN)}`,
      ],
      "\n"
    );
  }

  // Ophthalmic Lenses (ProductType 0)
  if (productType === 0) {
    // ${detail.treatmentName} ${detail.coatingName}
    const olLine = clean(detail.productName);
    // AddOns
    const addonNames =
      referenceApplicable === 0
        ? Array.isArray(AddOnData)
          ? AddOnData?.map((item) => clean(item.name?.split(" - ₹")[0])).filter(
              Boolean
            )
          : ""
        : Array.isArray(detail.addOn)
        ? detail.addOn?.map((item) => clean(item.addOnName)).filter(Boolean)
        : "";
   
    const singlePower = detail?.Specs;

    const singlePowerData = joinNonEmpty([
      cleanPower(singlePower?.Spherical) && `SPH: ${singlePower?.Spherical},`,
      cleanPower(singlePower?.Cylinder) && `Cyl: ${singlePower?.Cylinder},`,
      cleanPower(singlePower?.Diameter) && `Dia: ${singlePower?.Diameter}`,
    ]);

  
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
        olLine && olLine,
        singlePowerData,
        fittingLine,
        addonNames && `AddOn: ${addonNames}`,
        clean(detail.HSN) && `HSN: ${clean(clean(detail.HSN))}`,
      ],
      "\n"
    );
  }

  return "";
};
const getProductNameForYes = (order, referenceApplicable) => {
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
    const productName = clean(` ${clean(detail.productDescName)}`);
    const size = clean(detail.size);
    const dbL = clean(detail.dBL);
    const templeLength = clean(detail.templeLength);

    const cat = "Optical Frame";

    return joinNonEmpty(
      [
        productName && productName,
        size && dbL && templeLength && `Size: ${size}-${dbL}-${templeLength}`,
        cat && `Category: ${cat}`,
        clean(detail.barcode) && `Barcode: ${clean(detail.barcode)}`,
        clean(detail.hSN) && `HSN: ${clean(detail.hSN)}`,
      ],
      "\n"
    );
  }

  // Accessories / Variation (ProductType 2)
  if (productType === 2) {
    const productName = clean(` ${clean(detail.productDescName)}`);
    return joinNonEmpty(
      [
        productName && productName,
        clean(detail.specs?.variation || detail.variationName) &&
          `Variation: ${detail.specs?.variation || detail.variationName}`,
        clean(detail.barcode) && `Barcode: ${clean(detail.barcode)}`,
        clean(detail.hsncode || detail.hSN || detail.HSN) &&
          `HSN: ${clean(detail.hsncode || detail.hSN || detail.HSN)}`,
      ],
      "\n"
    );
  }

  // Contact Lens (ProductType 3)
  if (productType === 3) {
    const bc = detail?.stock[0]?.batchCode ?? "";

    const ex = detail?.stock[0]?.Expiry ?? "";
    
    const specListYes = joinNonEmpty(
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
       clean(detail.productDescName) && detail.productDescName,
        specListYes,
        clean(detail.colour) && `Color: ${clean(detail.colour)}`,
        clean(detail.barcode) && `Barcode: ${clean(detail.barcode)}`,
        (clean(bc || detail.BatchCode) || clean(ex || detail.ExpiryDate)) &&
          `Batch Code: ${bc || detail.BatchCode || "-"} | Expiry: ${
            ex || detail.ExpiryDate
              ? ex.split("-").reverse().join("/") ||
                detail.ExpiryDate.split("-").reverse().join("/")
              : "-"
          }`,
        clean(detail.HSN) && `HSN: ${clean(detail.HSN)}`,
      ],
      "\n"
    );
  }

  // Optical Lenses (ProductType 0)
  if (productType === 0) {
    const olLine = clean(detail.productDescName);
    // AddOns
    const addonNames = detail.specs?.addOn?.addOnName;
    const tintName = detail.specs?.tint?.tintName;

    // for yes
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
        olLine && olLine,
        powerLine,
        // clean(detail.barcode) && `Barcode: ${clean(detail.barcode)}`,
        addonNames && `AddOn: ${addonNames}`,
        tintName && `Tint: ${tintName}`,
        fittingLine,
        clean(detail.hSN) && `HSN: ${clean(clean(detail.hSN))}`,
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
    referenceApplicable,
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

      const fittingPrice = parseFloat(item?.FittingCharges || 0);
      const fittingGst = parseFloat(item?.FittingGSTPercentage || 0);
      const fittingValue = fittingPrice * (fittingGst / 100);

      const gst = calculateGST(returnPrice * returnQty, gstPercentage);

      return {
        totalQty: acc.totalQty + returnQty,
        totalGST:
          acc.totalGST + (parseFloat(gst.gstAmount) || 0) + fittingValue,

        totalReturnValue:
          acc.totalReturnValue +
          (parseFloat(item.TotalAmount) || 0) +
          fittingPrice +
          fittingValue,
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
                      {referenceApplicable === 0
                        ? getProductNameForNo(mappedOrder, referenceApplicable)
                        : getProductNameForYes(
                            mappedOrder,
                            referenceApplicable
                          )}
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
                      parseFloat(item.ReturnPricePerUnit * item.ReturnQty) +
                        parseFloat(
                          item.ProductType === 0
                            ? parseFloat(
                                (item.FittingCharges || 0) *
                                  ((item.FittingGSTPercentage || 0) / 100)
                              )
                            : 0
                        ) +
                        parseFloat(item.FittingCharges || 0)
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
