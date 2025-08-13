import React from "react";
import { useLocation, useNavigate } from "react-router";
import {
  useGetOrderViewByIdQuery,
  useGetSavedOrderDetailsQuery,
} from "../../../api/orderApi";
import { useOrder } from "../../../features/OrderContext";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { FiTrash2 } from "react-icons/fi";
import { format } from "date-fns";
import Button from "../../../components/ui/Button";
import Loader from "../../../components/ui/Loader";

const formatNumber = (num) => {
  return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
};

const SalesView = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const orderId = params.get("orderId");

  const { data: orderDetails, isLoading } = useGetSavedOrderDetailsQuery(
    { orderId },
    { skip: !orderId }
  );
  const { data: customerDataById, isLoading: isViewLoading } =
    useGetSalesViewByIdQuery({ id: orderId });

  const getTypeName = (id) => {
    const types = { 1: "F/S", 2: "ACC", 3: "CL" };
    return types[id] || "OL";
  };

  const formatValue = (val) =>
    val !== null && val !== undefined && val !== "" ? val : "N/A";

  const columns = [
    "S.No",
    "Type",
    "Product name",
    "Quantity",
    "Rate",
    "Discount",
    "GST",
    "Total",
    "Advance amount",
    "Balance amount",
  ];

  const getProductName = (item) => {
    const {
      typeid,
      ProductName,
      Size,
      Barcode,
      PatientName,
      PowerSpecs,
      Variation,
      Specs,
    } = item;

    const clean = (val) => {
      if (
        val === null ||
        val === undefined ||
        val === "undefined" ||
        val === "null" ||
        (typeof val === "string" && val.trim() === "")
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

    const lines = [];

    // Frame (typeid = 1)
    if (typeid === 1) {
      if (clean(ProductName)) lines.push(clean(ProductName));
      if (clean(Size)) lines.push(clean(Size));
      if (clean(Barcode)) lines.push(clean(Barcode));
      if (clean(PatientName)) lines.push(clean(PatientName));
      return lines.join("\n");
    }

    // Accessories (typeid = 2)
    if (typeid === 2) {
      if (clean(ProductName)) lines.push(clean(ProductName));
      if (clean(Variation)) lines.push(clean(Variation));
      if (clean(Barcode)) lines.push(clean(Barcode));
      if (clean(PatientName)) lines.push(clean(PatientName));
      return lines.join("\n");
    }

    // Contact Lens (typeid = 3)
    if (typeid === 3) {
      if (clean(ProductName)) lines.push(clean(ProductName));
      if (PowerSpecs) {
        const specs = PowerSpecs.split(",")
          .map((s) => {
            const [key, val] = s.split(":");
            const power = cleanPower(val);
            return power ? `${key.trim()}: ${power}` : "";
          })
          .filter(Boolean)
          .join(" "); // space-separated
        if (specs) lines.push(specs);
      }
      if (clean(Barcode)) lines.push(clean(Barcode));
      if (clean(PatientName)) lines.push(clean(PatientName));
      return lines.join("\n");
    }

    // Lenses or other (typeid = 0)
    if (typeid === 0) {
      if (clean(ProductName)) lines.push(clean(ProductName));
      if (Array.isArray(Specs) && Specs.length > 0) {
        const specsLines = Specs.map((spec) => {
          const side = clean(spec.side); // Keep L: or R:
          const sph = cleanPower(spec.sph);
          const cyl = cleanPower(spec.cyl);
          const axis = clean(spec.axis);
          const addition = cleanPower(spec.addition);

          const parts = [];
          if (side) parts.push(side); // Now keeps L: or R:
          if (sph) parts.push(`SPH: ${sph}`);
          if (cyl) parts.push(`CYL: ${cyl}`);
          if (axis) parts.push(`Axis: ${axis}`);
          if (addition) parts.push(`Add: ${addition}`);

          return parts.join(" "); // space-separated
        }).filter(Boolean);

        if (specsLines.length) lines.push(specsLines.join("\n"));
      }
      if (clean(Barcode)) lines.push(clean(Barcode));
      if (clean(PatientName)) lines.push(clean(PatientName));
      return lines.join("\n");
    }

    return "";
  };

  // Calculate summary values
  const totalQty = orderDetails?.reduce(
    (sum, item) => sum + (parseInt(item.OrderQty) || 0),
    0
  );
  const grandTotal = orderDetails?.reduce((sum, item) => {
    const price = parseFloat(item.Total || 0);
    const fittingPrice = parseFloat(item.FittingPrice || 0);

    return sum + (price + fittingPrice);
  }, 0);
  const advanceAmount = orderDetails?.reduce(
    (sum, item) => sum + (parseFloat(item.AdvanceAmount) || 0),
    0
  );
  const balanceAmount = grandTotal - advanceAmount;

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

  console.log("ss", customerDataById?.data);
  return (
    <div className="max-w-7xl">
      <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-3">
          <div></div>
          <div>
            <Button variant="outline" onClick={() => navigate("/order-list")}>
              Back
            </Button>
          </div>
        </div>
        {/* Order Details */}
        <div className="grid grid-cols-3 gap-3">
          <Info
            label="Order No"
            value={`${customerDataById?.data.data.OrderPrefix}/${customerDataById?.data.data.OrderNo}`}
          />
          <Info
            label="Order Date"
            value={
              customerDataById?.data.data?.OrderPlacedDate
                ? format(
                    new Date(customerDataById?.data.data?.OrderPlacedDate),
                    "dd/MM/yyyy"
                  )
                : ""
            }
          />

          <Info
            label="Status"
            value={getOrderStatus(customerDataById?.data.data?.Status)}
          />
          <Info
            label="Customer Name"
            value={customerDataById?.data.data?.CustomerMaster?.CustomerName}
          />
          <Info
            label="Customer No"
            value={customerDataById?.data.data?.CustomerMaster?.MobNumber}
          />
          <Info
            label="Customer Address"
            value={`${customerDataById?.data.data?.CustomerMaster?.BillAddress1} ${customerDataById?.data.data?.CustomerMaster?.BillAddress2} ${customerDataById?.data.data?.CustomerMaster?.BillCity}`}
          />
          <Info
            label="Sales Person"
            value={customerDataById?.data.data?.SalesPerson?.PersonName}
          />
          <Info
            label="Order Reference"
            value={customerDataById?.data.data?.OrderReference || "N/A"}
          />
        </div>

        {/* Product Table */}
        <div className="mt-10">
          <Table
            expand={true}
            name="Product name"
            columns={columns}
            data={orderDetails}
            renderRow={(order, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{getTypeName(order?.typeid)}</TableCell>
                <TableCell className="">
                  <div
                    className="text-sm"
                    style={{
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                    }}
                  >
                    {getProductName(order)}
                  </div>
                </TableCell>
                <TableCell>{formatValue(order?.OrderQty)}</TableCell>
                <TableCell>{formatValue(order?.Rate)}</TableCell>
                <TableCell>
                  {order?.DiscountValue
                    ? `${order.DiscountValue}(${order.DiscountPercentage}%)`
                    : 0}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div>₹{formatNumber(order.DiscountedSellingPrice)}</div>
                    <div>({order.taxPercentage}%)</div>
                  </div>
                </TableCell>
                <TableCell>
                  {formatValue(order?.DiscountedSellingPrice * order.OrderQty)}
                </TableCell>
                <TableCell>{formatValue(order?.AdvanceAmount)}</TableCell>
                <TableCell>
                  {formatValue(
                    order?.DiscountedSellingPrice * order.OrderQty -
                      order.AdvanceAmount
                  )}
                </TableCell>
              </TableRow>
            )}
            emptyMessage={isLoading ? "Loading..." : "No data available"}
          />
        </div>

        {/* Summary Section */}
        {orderDetails && (
          <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  Grand Total
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  ₹{formatNumber(Number(grandTotal?.toFixed(2))) || "0"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-700 font-semibold text-lg">
                  Advance Amount
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  ₹{formatNumber(Number(advanceAmount?.toFixed(2))) || "0"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-700 font-semibold text-lg">
                  Balance Amount
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  ₹{formatNumber(Number(balanceAmount?.toFixed(2))) || "0"}
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
