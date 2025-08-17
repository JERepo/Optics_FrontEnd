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

const formatNumber = (num) => {
  return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
};

const SalesView = () => {
  const { calculateGST } = useOrder();
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const salesId = params.get("salesId");

  const { data: salesDetails, isLoading } = useGetMainSalesByIdQuery(
    { id: salesId },
    { skip: !salesId }
  );
  const { data: customerDataById, isLoading: isViewLoading } =
    useGetSalesReturnByIdQuery({ id: salesId });

  const getTypeName = (id) => {
    const types = { 1: "F/S", 2: "ACC", 3: "CL" };
    return types[id] || "OL";
  };

  const formatValue = (val) =>
    val !== null && val !== undefined && val !== "" ? val : "N/A";

  const getProductName = (item) => {
    const typeid = item.ProductType;
    const details = item.ProductDetails || {};
    const ProductName = details.productName;
    const Barcode = details.barcode;
    const Hsncode = details.hsncode;
    const Colour = details.colour;
    const Tint = details.Tint;
    const PatientName = details.PatientName; // May not be present

    const clean = (val) => {
      if (
        val == null ||
        val === "undefined" ||
        val === "null" ||
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
    if (clean(ProductName)) lines.push(clean(ProductName));

    // Common fields for all types
    if (typeid === 1) {
      // Frame
      const Size = details.Size;
      if (clean(Size)) lines.push(`Size: ${clean(Size)}`);
    } else if (typeid === 2) {
      // Accessories
      const Variation = details.Variation;
      if (clean(Variation)) lines.push(`Variation: ${clean(Variation)}`);
    } else if (typeid === 3) {
      // Contact Lens
      const PowerSpecs = details.PowerSpecs || {};
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
    } else if (typeid === 0) {
      // Lenses
      const Specs = details.Specs || [];
      if (Specs.length > 0) {
        const specsLines = Specs.map((spec) => {
          const side = clean(spec.side);
          const sph = cleanPower(spec.sph);
          const cyl = cleanPower(spec.cyl);
          const axis = clean(spec.axis);
          const addition = cleanPower(spec.addition);
          const parts = [];
          if (side) parts.push(side);
          if (sph) parts.push(`SPH: ${sph}`);
          if (cyl) parts.push(`CYL: ${cyl}`);
          if (axis) parts.push(`Axis: ${axis}`);
          if (addition) parts.push(`Add: ${addition}`);
          return parts.join(" ");
        }).filter(Boolean);
        if (specsLines.length) lines.push(...specsLines);
      }
      const AddOns = details.AddOns || [];
      if (AddOns.length) lines.push(`AddOns: ${AddOns.map(clean).join(", ")}`);
    }

    // Add common fields: Barcode, HSN, Colour, Tint, PatientName
    if (clean(Barcode)) lines.push(`Barcode: ${clean(Barcode)}`);
    if (clean(Hsncode)) lines.push(`HSN: ${clean(Hsncode)}`);
    if (clean(Colour)) lines.push(`Colour: ${clean(Colour)}`);
    if (clean(Tint)) lines.push(`Tint: ${clean(Tint)}`);
    if (clean(PatientName)) lines.push(`Patient: ${clean(PatientName)}`);

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
    return sum + price + fittingPrice;
  }, 0);

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
          <div></div>
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
                value={`${customerDataById?.data?.CustomerMaster?.BillAddress1} ${customerDataById?.data?.CustomerMaster?.BillAddress2} ${customerDataById?.data?.CustomerMaster?.BillCity}`}
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
                <TableCell>{s.InvoiceNo ?? "-"}</TableCell>
                <TableCell>{getTypeName(s.ProductType)}</TableCell>
                <TableCell>
                  <div className="whitespace-pre-wrap break-words max-w-xs">
                    {getProductName(s)}
                  </div>
                </TableCell>
                <TableCell>{s.ReturnPricePerUnit}</TableCell>
                <TableCell>
                  {calculateGST(
                    parseFloat(s.ReturnPricePerUnit),
                    parseFloat(s.GSTPercentage)
                  ).gstAmount}
                </TableCell>
                <TableCell>{s.ReturnQty}</TableCell>
                <TableCell>{s.FittingCharges ?? 0}</TableCell>
                <TableCell>{s.TotalAmount}</TableCell>
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
                  ₹{formatNumber(Number(grandTotal?.toFixed(2))) || "0"}
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
