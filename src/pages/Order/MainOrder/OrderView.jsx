import React from "react";
import { useLocation } from "react-router";
import { useGetSavedOrderDetailsQuery } from "../../../api/orderApi";
import { useOrder } from "../../../features/OrderContext";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { FiTrash2 } from "react-icons/fi";

const formatNumber = (num) => {
  return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
};

const OrderView = () => {
  const { selectedOrderDetails } = useOrder();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const orderId = params.get("orderId");

  const { data: orderDetails, isLoading } = useGetSavedOrderDetailsQuery(
    { orderId },
    { skip: !orderId }
  );

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
        val === "null"
      ) {
        return "";
      }
      return val;
    };
    // For Frame (typeid = 1)
    if (typeid === 1) {
      const nameLine = ProductName || "";
      const sizeLine = Size ? `${Size}` : "";
      const barcodeLine = Barcode || "";
      const patientLine = PatientName ? `\n${PatientName}` : "";
      return `${nameLine}\n${sizeLine}\n${barcodeLine}\n${patientLine}`;
    }

    // For Accessories (typeid = 2)
    if (typeid === 2) {
      const nameLine = ProductName || "";
      const barcodeLine = Barcode || "";
      const patientLine = PatientName ? `\n${PatientName}` : "";
      return `${nameLine}\n${Variation}\n${barcodeLine}${patientLine}`;
    }

    // For Contact Lens (typeid = 3)
    if (typeid === 3) {
      const nameLine = ProductName || "";
      const specs = PowerSpecs
        ? PowerSpecs.split(",")
            .map((s) => {
              const [key, val] = s.split(":");
              const cleanedValue =
                val && !["null", "undefined"].includes(val.trim())
                  ? val.trim()
                  : "";
              return `${key.trim()}: ${cleanedValue}`;
            })
            .join(", ")
        : "";
      const barcodeLine = Barcode || "";
      const patientLine = PatientName ? `\n${PatientName}` : "";
      return `${nameLine}\n${specs}\n${barcodeLine}${patientLine}`;
    }

    if (typeid === 0) {
      const specsLines = (Specs || [])
        .map((spec) => {
          const side = clean(spec.side);
          const sph = clean(spec.sph);
          const cyl = clean(spec.cyl);
          const axis = clean(spec.axis);
          const addition = clean(spec.addition);
          return `${side}: SPH ${sph}, CYL ${cyl}, Axis ${axis}, Add ${addition}`;
        })
        .join("\n");
      return `${clean(ProductName)}\n${specsLines}\n${clean(Barcode)}${
        PatientName ? `\n${clean(PatientName)}` : ""
      }`;
    }

    return "";
  };

  // Calculate summary values
  const totalQty = orderDetails?.reduce(
    (sum, item) => sum + (parseInt(item.OrderQty) || 0),
    0
  );
  const grandTotal = orderDetails?.reduce(
    (sum, item) =>
      sum + (parseFloat(item.DiscountedSellingPrice * item.OrderQty) || 0),
    0
  );
  const advanceAmount = orderDetails?.reduce(
    (sum, item) => sum + (parseFloat(item.orderValue) || 0),
    0
  );
  const balanceAmount = grandTotal - advanceAmount;

  return (
    <div className="max-w-7xl">
      <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6">
        {/* Order Details */}
        <div className="grid grid-cols-3 gap-3">
          <Info label="Order No" value={selectedOrderDetails?.OrderNo} />
          <Info label="Order Date" value={selectedOrderDetails?.CreatedOn} />
          <Info label="Status" value="Partially Invoiced" />
          <Info
            label="Customer Name"
            value={selectedOrderDetails?.CustomerMaster?.CustomerName}
          />
          <Info
            label="Customer No"
            value={selectedOrderDetails?.CustomerMaster?.MobNumber}
          />
          <Info
            label="Customer Address"
            value="Plot No. A-21,A-22,A-43,A-44, HARDOI, UTTAR PRADESH"
          />
          <Info
            label="Sales Person"
            value={selectedOrderDetails?.SalesPerson?.PersonName}
          />
          <Info
            label="Order Reference"
            value={selectedOrderDetails?.OrderReference || "N/A"}
          />
          <Info label="Order By" value="Srinivas" />
        </div>

        {/* Product Table */}
        <div className="mt-10">
          <Table
            columns={columns}
            data={orderDetails}
            renderRow={(order, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{getTypeName(order?.typeid)}</TableCell>
                <TableCell className="">
                  <pre
                    className="text-sm"
                    style={{
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                      gap: "10px",
                    }}
                  >
                    {getProductName(order)}
                  </pre>
                </TableCell>
                <TableCell>{formatValue(order?.OrderQty)}</TableCell>
                <TableCell>{formatValue(order?.Rate)}</TableCell>
                <TableCell>
                  {order?.DiscountValue
                    ? `${order.DiscountValue}(${order.DiscountPercentage})`
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
                <TableCell>{formatValue(order?.orderValue)}</TableCell>
                <TableCell>{formatValue(order?.orderValue)}</TableCell>
              </TableRow>
            )}
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
                  ₹{formatNumber(grandTotal?.toFixed(2)) || "0"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-700 font-semibold text-lg">
                  Advance Amount
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  ₹{formatNumber(advanceAmount?.toFixed(2)) || "0"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-700 font-semibold text-lg">
                  Balance Amount
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  ₹{formatNumber(balanceAmount?.toFixed(2)) || "0"}
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

export default OrderView;
