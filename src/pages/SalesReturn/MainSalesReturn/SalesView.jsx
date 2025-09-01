import React from "react";
import { useLocation, useNavigate } from "react-router";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { format } from "date-fns";
import Button from "../../../components/ui/Button";
import Loader from "../../../components/ui/Loader";
import {
  useGetMainSalesByIdQuery,
  useGetSalesReturnByIdQuery,
} from "../../../api/salesReturnApi";
import { useOrder } from "../../../features/OrderContext";
import { formatINR } from "../../../utils/formatINR";
import { useSelector } from "react-redux";

const formatNumber = (num) => {
  return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
};

const SalesView = () => {
  const { calculateGST } = useOrder();
  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const salesId = params.get("salesId");

  const { data: salesDetails, isLoading } = useGetMainSalesByIdQuery(
    { id: salesId, locationId: parseInt(hasMultipleLocations[0]) },
    { skip: !salesId }
  );
  const { data: customerDataById, isLoading: isViewLoading } =
    useGetSalesReturnByIdQuery({ id: salesId });

  const getTypeName = (id) => {
    const types = { 1: "F/S", 2: "ACC", 3: "CL" };
    return types[id] || "OL";
  };

  const getProductName = (item) => {
    const typeid = item.ProductType;
    const details = Array.isArray(item.ProductDetails)
      ? item.ProductDetails[0]
      : item.ProductDetails || {};
    const brandName = details?.brandName;
    const ProductName = details?.productName || details?.productDescName || "";
    const Barcode = details?.barcode;
    const Hsncode = details?.hSN || details.HSN;
    const Colour = details?.colour;
    const Tint = details.tint?.tintName || "";
    const addOn = details.addOn?.addOnName;
    
    const clean = (val) => {
      if (
        val == null ||
        val === "undefined" ||
        val === "null" ||
        val === "N/A" ||
        (typeof val === "string" && val.trim() === "")
      )
        return "";
      return String(val).trim();
    };

    const cleanPower = (val) => {
      const cleaned = clean(val);
      if (!cleaned) return "";
      const num = parseFloat(cleaned);
      if (isNaN(num)) return cleaned;
      return num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
    };

    const lines = [];

    // Add Product Name
    if (clean(ProductName)) lines.push(`${ProductName}`);

    // Common fields for all types
    if (typeid === 1) {
      // Frame
      const Size = details.Size.Size;
      if (clean(Size))
        lines.push(
          `Size: ${clean(Size)}-${clean(details.dBL)}-${clean(
            details.templeLength
          )}`
        );
    } else if (typeid === 2) {
      // Accessories
      const Variation = details.Variation;
      if (clean(Variation)) lines.push(`Variation: ${clean(Variation)}`);
    } else if (typeid === 3) {
      // Contact Lens
      const PowerSpecs = details.PowerSpecs || {};
      const batchcode = Array.isArray(details?.Stock)
      ? details?.Stock[0].BatchCode
      : details?.Stock.BatchCode;
    const expiry = Array.isArray(details?.Stock)
      ? details?.Stock[0].Expiry
      : details?.Stock.Expiry;
      const specsParts = [];
      if (PowerSpecs.Sph != null)
        specsParts.push(`Sph: ${cleanPower(PowerSpecs.Sph)}`);
      if (PowerSpecs.Cyl != null)
        specsParts.push(`Cyl: ${cleanPower(PowerSpecs.Cyl)}`);
      if (PowerSpecs.Axis != null)
        specsParts.push(`Axis: ${clean(PowerSpecs.Axis)}`);
      if (PowerSpecs.Add != null)
        specsParts.push(`Add: ${cleanPower(PowerSpecs.Add)}`);
      if (specsParts.length) lines.push(specsParts.join(" "));
      if (clean(batchcode && expiry))
        lines.push(
          `BatchCode: ${batchcode} | Expiry: ${expiry
            .split("-")
            .reverse()
            .join("/")}`
        );
    } else if (typeid === 0) {
      // Optical Lenses
      const powerDetails = details.specs?.powerDetails || {};
      const specsLines = [];

      const formatLens = (side, data) => {
        if (!data) return "";
        const parts = [];
        if (side) parts.push(side);
        if (data.sphericalPower)
          parts.push(`SPH: ${cleanPower(data.sphericalPower)}`);
        if (data.cylinder) parts.push(`CYL: ${cleanPower(data.cylinder)}`);
        if (data.axis) parts.push(`Axis: ${clean(data.axis)}`);
        if (data.addition) parts.push(`Add: ${cleanPower(data.addition)}`);
        if (data.diameter) parts.push(`Dia: ${clean(data.diameter)}`);
        return parts.join(" ");
      };

      if (powerDetails.right)
        specsLines.push(formatLens("Right", powerDetails.right));
      if (powerDetails.left)
        specsLines.push(formatLens("Left", powerDetails.left));

      if (specsLines.length) lines.push(...specsLines);

      // Add coating/treatment/family etc.
      const family = clean(details.familyName);
      const design = clean(details.designName);
      const coating = clean(details.coatingName);
      const treatment = clean(details.treatmentName);
      const extra = [family, design, coating, treatment]
        .filter(Boolean)
        .join(" ");
      if (extra) lines.push(extra);

      // Add tint & add-on
      const tint =
        details.specs?.tint?.tintName || clean(details.tint?.tintName);
      if (tint) lines.push(`Tint: ${tint}`);

      const addOnName =
        details.specs?.addOn?.addOnName || clean(details.addOn?.addOnName);
      if (addOnName) lines.push(`AddOn: ${addOnName}`);
    }

    // Add common fields: Barcode, HSN, Colour, Tint, PatientName
    // if(clean(productName))
    if (clean(Barcode)) lines.push(`Barcode: ${clean(Barcode)}`);
    if (clean(Hsncode)) lines.push(`HSN: ${clean(Hsncode)}`);
    if (clean(Colour)) lines.push(`Colour: ${clean(Colour)}`);
    if (clean(Tint)) lines.push(`Tint: ${clean(Tint)}`);

    return lines.join("\n");
  };

  // Calculate summary values
  const totalQty = salesDetails?.data.reduce(
    (sum, item) => sum + (parseInt(item.ReturnQty) || 0),
    0
  );
  const grandTotal = salesDetails?.data.reduce((sum, item) => {
    const price = parseFloat(item.TotalAmount || 0);
    const fittingPrice = parseFloat(item.FittingCharges || 0);
    const gstPercentage = parseFloat(item.GSTPercentage) || 0;
    const returnQty = parseInt(item.ReturnQty) || 0;
    const returnPrice = parseFloat(item.ReturnPricePerUnit) || 0;
    const gst = calculateGST(returnPrice * returnQty, gstPercentage);
    return sum + price + fittingPrice + parseFloat(gst.gstAmount);
  }, 0);

  if (isViewLoading || isLoading) {
    return (
      <div>
        <Loader color="black" />
      </div>
    );
  }

  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-3">
          <div className="text-2xl text-neutral-700 font-semibold">View Sales Return Details</div>
          <div>
            <Button variant="outline" onClick={() => navigate("/sales-return")}>
              Back
            </Button>
          </div>
        </div>
        {/* Order Details */}
        <div className="grid grid-cols-3 gap-3">
          <Info
            label="Patient Name"
            value={customerDataById?.data.CustomerContactDetail.CustomerName}
          />
          <Info
            label="Customer Name"
            value={customerDataById?.data.CustomerMaster?.CustomerName}
          />
          <Info
            label="Patient Mobile"
            value={customerDataById?.data.CustomerContactDetail?.MobNumber}
          />

          {customerDataById?.data.CustomerMaster?.TAXRegisteration === 1 && (
            <>
              <div className="flex gap-1">
                <strong>GST No:</strong>{" "}
                {customerDataById?.data.CustomerMaster?.TAXNo}
              </div>
              <Info
                label="Customer Address"
                value={`${
                  customerDataById?.data?.CustomerMaster?.BillAddress1 ?? ""
                } ${
                  customerDataById?.data?.CustomerMaster?.BillAddress2 ?? ""
                } ${customerDataById?.data?.CustomerMaster?.BillCity ?? ""}`}
              />
            </>
          )}

          {customerDataById?.data.CustomerMaster?.CreditBilling === 1 && (
            <>
              <div className="flex gap-1">
                <strong>Credit Billing:</strong> Yes
              </div>
              <div className="flex gap-1">
                <strong>Credit Limit Available:</strong>
                {parseFloat(
                  customerDataById?.data.CustomerMaster?.CreditLimit
                ).toLocaleString()}
              </div>
            </>
          )}
        </div>

        {/* Product Table */}
        <div className="mt-10">
          <Table
            expand={true}
            name="Product name"
            columns={[
              "s.no",
              "invoice no",
              "product type",
              "product details",
              "return price",
              "gst amount",
              "return qty",
              "total fitting charges",
              "total amount",
            ]}
            data={salesDetails?.data}
            renderRow={(s, index) => (
              <TableRow>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  {s.InvoiceMain && (
                    <div>
                      {s.InvoiceMain?.InvoicePrefix}/{s.InvoiceMain?.InvoiceNo}
                    </div>
                  )}
                </TableCell>
                <TableCell>{getTypeName(s.ProductType)}</TableCell>
                <TableCell>
                  <div className="whitespace-pre-wrap">{getProductName(s)}</div>
                </TableCell>
                <TableCell>₹{formatINR(s.ReturnPricePerUnit)}</TableCell>
                <TableCell>
                  ₹
                  {formatINR(
                    calculateGST(
                      parseFloat(s.ReturnPricePerUnit),
                      parseFloat(s.GSTPercentage)
                    ).gstAmount
                  )}
                  (
                  {
                    calculateGST(
                      parseFloat(s.ReturnPricePerUnit),
                      parseFloat(s.GSTPercentage)
                    ).taxPercentage
                  }
                  %)
                </TableCell>
                <TableCell>{s.ReturnQty}</TableCell>
                <TableCell>₹{formatINR(s.FittingCharges ?? 0)}</TableCell>
                <TableCell>
                  ₹
                  {parseFloat(
                    (s.TotalAmount || 0) +
                      parseFloat(
                        calculateGST(
                          s.ReturnPricePerUnit * s.ReturnQty,
                          parseFloat(s.GSTPercentage || 0)
                        ).gstAmount
                      )
                  )}
                </TableCell>
              </TableRow>
            )}
            emptyMessage={isLoading ? "Loading..." : "No data available"}
          />
        </div>

        {/* Summary Section */}
        {salesDetails && (
          <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200 justify-end">
            <div className="flex justify-end gap-10">
              <div className="flex flex-col">
                <span className="text-neutral-700 font-semibold text-lg">
                  Total Qty
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  {formatNumber(totalQty) || "0"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-700 font-semibold text-lg">
                  Total Amount
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  ₹{formatINR(Number(grandTotal?.toFixed(2))) || "0"}
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

export default SalesView;
