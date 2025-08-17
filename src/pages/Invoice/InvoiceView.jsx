import React from "react";
import { useLocation, useNavigate } from "react-router";
import { Table, TableCell, TableRow } from "../../components/Table";
import { FiTrash2 } from "react-icons/fi";
import { format } from "date-fns";
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import {
  useGetInvoiceByIdQuery,
  useGetInvoiceDetailsQuery,
} from "../../api/InvoiceApi";
import { formatINR } from "../../utils/formatINR";

const InvoiceView = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const invoiceId = params.get("invoiceId");

  const { data: invoiceDetails, isLoading } = useGetInvoiceByIdQuery(
    { id: invoiceId },
    { skip: !invoiceId }
  );

  const { data: invoiceDetailsById, isLoading: isViewLoading } =
    useGetInvoiceDetailsQuery({ detailId: invoiceId });

  const getTypeName = (id) => {
    const types = { 1: "F/S", 2: "ACC", 3: "CL" };
    return types[id] || "OL";
  };



  const getProductName = (order) => {
    const {
      ProductType,

      FittingPrice,
      FittingGSTPercentage,

      ProductDetails,
    } = order;

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
      return String(val).trim();
    };

    const cleanPower = (val) => {
      const cleaned = clean(val);
      if (!cleaned) return "";
      const num = parseFloat(cleaned);
      if (isNaN(num)) return "";
      return num >= 0 ? `+${num.toFixed(2)}` : `${num.toFixed(2)}`;
    };

    if (ProductType === 1) {
      const name = clean(ProductDetails.productName);
      const specDetails = clean(ProductDetails.specs);
      const barcodeVal = clean(ProductDetails.barcode);
      const hsn = clean(ProductDetails.hsncode);
      const cat =
        order.InvoiceMain?.InvoiceType === 0 ? "Optical Frame" : "Sunglass";

      const line1 = [name].filter(Boolean).join(" ");
      const line2 = [specDetails].filter(Boolean).join("-");

      return [
        line1,
        line2,
        cat,
        barcodeVal && `Barcode: ${barcodeVal}`,
        hsn && `HSN: ${hsn}`,
      ]
        .filter(Boolean)
        .join("\n");
    }

    if (ProductType === 2) {
      const name = clean(ProductDetails.productName);
      const variation = clean(ProductDetails.specs);
      const barcodeVal = clean(ProductDetails.barcode);
      const hsn = clean(ProductDetails.hsncode);

      return [
        [name].filter(Boolean).join(" "),
        variation && `Variation: ${variation}`,
        barcodeVal && `Barcode: ${barcodeVal}`,
        hsn && `HSN: ${hsn}`,
      ]
        .filter(Boolean)
        .join("\n");
    }

    if (ProductType === 3) {
      const name = clean(order.ProductDetails.productName);
      const hsn = clean(order.ProductDetails.hSN);
      const barcodeVal = clean(order.ProductDetails.barcode);
      const batchCode = clean(order.ProductDetails.BatchCode);

      // parse specs string into object
      const specsObj = {};
      if (typeof order.ProductDetails.specs === "string") {
        order.ProductDetails.specs.split(",").forEach((pair) => {
          let [key, value] = pair.split(":").map((s) => s.trim());
          if (value === "null") value = null;
          specsObj[key] = value;
        });
      }

      const sph = cleanPower(specsObj.Sph);
      const cyld = cleanPower(specsObj.Cyld);
      const axis = clean(specsObj.Axis);
      const addl = cleanPower(specsObj.Add);
      const clr = clean(order.colour);

      const specsList = [
        sph && `SPH: ${sph}`,
        cyld && `CYL: ${cyld}`,
        axis && `Axis: ${axis}`,
        addl && `Add: ${addl}`,
      ]
        .filter(Boolean)
        .join(", ");

      return [
        name,
        specsList,
        clr && `Color: ${clr}`,
        barcodeVal && `Barcode: ${barcodeVal}`,
        batchCode && `Batch Code: ${batchCode || "-"}`,
        hsn && `HSN: ${hsn}`,
      ]
        .filter(Boolean)
        .join("\n");
    }

    if (ProductType === 0) {
      const olLine = [order.ProductDetails.productName]
        .map(clean)
        .filter(Boolean)
        .join(" ");

      const right = ProductDetails.Specs?.find((p) => p.side === "R") || {};
      const left = ProductDetails.Specs?.find((p) => p.side === "L") || {};

      const rightParts = [
        cleanPower(right.sph) && `SPH: ${cleanPower(right.sph)}`,
        cleanPower(right.addition) && `Add: ${cleanPower(right.addition)}`,
      ].filter(Boolean);

      const leftParts = [
        cleanPower(left.sph) && `SPH: ${cleanPower(left.sph)}`,
        cleanPower(left.addition) && `Add: ${cleanPower(left.addition)}`,
      ].filter(Boolean);

      const powerLine = [
        rightParts.length > 0 ? `R: ${rightParts.join(", ")}` : "",
        leftParts.length > 0 ? `L: ${leftParts.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const addOnLine =
        clean(ProductDetails?.AddOns?.[0]?.addOnName) &&
        `Addon: ${clean(ProductDetails?.AddOns?.[0]?.addOnName)}`;
      const tintLine =
        clean(ProductDetails?.Tint) && `Tint: ${clean(ProductDetails?.Tint)}`;
      const barcodeLine =
        clean(ProductDetails.barcode) &&
        `Barcode: ${clean(ProductDetails.barcode)}`;
      const hsnLine =
        clean(ProductDetails.hsncode) &&
        `HSN: ${clean(ProductDetails.hsncode)}`;

      let fittingLine = "";
      const fitPrice = parseFloat(FittingPrice);
      const gstPerc = parseFloat(FittingGSTPercentage);
      if (!isNaN(fitPrice) && !isNaN(gstPerc) && fitPrice > 0) {
        const totalFitting = (fitPrice * (1 + gstPerc / 100)).toFixed(2);
        fittingLine = `Fitting Price: ₹${totalFitting}`;
      }

      return [
        olLine,
        powerLine,
        addOnLine,
        barcodeLine,
        tintLine,
        hsnLine,
        fittingLine,
      ]
        .filter(Boolean)
        .join("\n");
    }

    return "";
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
  // Calculate summary values
  const totalQty = invoiceDetailsById?.reduce(
    (sum, item) => sum + (parseInt(item.InvoiceQty) || 0),
    0
  );
  const grandTotal = invoiceDetailsById?.reduce((sum, item) => {
    const invoicePrice = parseFloat(item.InvoicePrice || 0);
    const qty = parseFloat(item.InvoiceQty || 0);
    const fittingPrice = parseFloat(item.FittingPrice || 0);
    const fittingGST = parseFloat(item.FittingGSTPercentage || 0)
    const totalFittinPrice = calculateGST(fittingPrice,fittingGST).gstAmount

    return sum + ((invoicePrice * qty) + parseFloat(totalFittinPrice));
  }, 0);

  const gstAmount = invoiceDetailsById?.reduce((sum, item) => {
    const price = parseFloat(item.InvoicePrice) || 0;
    const qty = parseInt(item.InvoiceQty) || 0;
    const taxPercent = parseFloat(item.TaxPercent) || 0;

    const { gstAmount } = calculateGST(price * qty, taxPercent);
    return sum + parseFloat(gstAmount) || 0;
  }, 0);

  const getOrderStatus = (status) => {
    const types = {
      1: "Confirmed",
      2: "Partially Invoiced",
      3: "Invoiced",
      4: "Cancelled",
    };
    return types[status] || "Draft";
  };

  if (isViewLoading || isLoading) {
    return (
      <div>
        <Loader color="black" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-3">
          <div className="text-neutral-800 text-2xl font-semibold">Invoice Details</div>
          <div>
            <Button variant="outline" onClick={() => navigate("/invoice")}>
              Back
            </Button>
          </div>
        </div>
        {/* Order Details */}
        <div className="grid grid-cols-3 gap-3">
          <Info
            label="Invoice No"
            value={`${
              invoiceDetails?.InvoicePrefix
                ? invoiceDetails?.InvoicePrefix
                : "NA"
            }/${invoiceDetails?.InvoiceNo}`}
          />
          <Info
            label="Invoice Date"
            value={
              invoiceDetails?.InvoiceDate
                ? format(new Date(invoiceDetails?.InvoiceDate), "dd/MM/yyyy")
                : ""
            }
          />
          <Info label="Status" value={getOrderStatus(invoiceDetails?.Status)} />
          <Info
            label="Customer Name"
            value={invoiceDetails?.CustomerMaster?.CustomerName}
          />
          <Info
            label="Patient Name"
            value={invoiceDetails?.Patient?.CustomerName}
          />

          <Info
            label="Patient Mobile No"
            value={invoiceDetails?.Patient?.MobNumber}
          />
        </div>

        {/* Product Table */}
        <div className="mt-10">
          <Table
            columns={[
              "S.No",
              "order no",
              "product type",
              "product details",
              "srp",
              "invoice price",
              "invoice qty",
              "total amount",
            ]}
            data={invoiceDetailsById}
            renderRow={(invoice, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{`${invoice.OrderMaster?.OrderPrefix}/${invoice.OrderMaster?.OrderNo}/${invoice.InvoiceSlNo}`}</TableCell>
                <TableCell>{getTypeName(invoice?.ProductType)}</TableCell>
                <TableCell className="">
                  <div
                    className="text-sm"
                    style={{
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                    }}
                  >
                    {getProductName(invoice)}
                  </div>
                </TableCell>
                <TableCell>₹{formatINR(parseFloat(invoice.SRP))}</TableCell>
                <TableCell>
                  ₹{formatINR(parseFloat(invoice.InvoicePrice))}
                </TableCell>
                <TableCell>{invoice.InvoiceQty}</TableCell>
                <TableCell>
                  ₹
                  {formatINR(
                    parseFloat(invoice.InvoiceQty) *
                      parseFloat(invoice.InvoicePrice)
                  )}
                </TableCell>
              </TableRow>
            )}
            emptyMessage={isLoading ? "Loading..." : "No data available"}
          />
        </div>

        {/* Summary Section */}
        {invoiceDetails && (
          <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200 flex justify-end">
            <div className="grid md:grid-cols-3 gap-5">
              <div className="flex flex-col">
                <span className="text-neutral-700 font-semibold text-lg">
                  Total Qty
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  {totalQty || "0"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-700 font-semibold text-lg">
                 Total GST
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  ₹{formatINR(gstAmount) || "0"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-700 font-semibold text-lg">
                  Total Amount
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  ₹{formatINR(grandTotal) || "0"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable Info Block
const Info = ({ label, value }) => (
  <div className="flex flex-col">
    <div className="text-neutral-700 font-semibold text-lg">{label}</div>
    <div className="text-neutral-600">
      {value !== null && value !== undefined && value !== "" ? value : "N/A"}
    </div>
  </div>
);

export default InvoiceView;
