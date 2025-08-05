import React from "react";
import { useLocation, useNavigate } from "react-router";
import { useGetSavedOrderDetailsQuery } from "../../../api/orderApi";
import { useOrder } from "../../../features/OrderContext";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { FiTrash2 } from "react-icons/fi";
import { format } from "date-fns";
import Button from "../../../components/ui/Button";

const formatNumber = (num) => {
  return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
};

const OrderView = () => {
  const { selectedOrderDetails } = useOrder();
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const orderId = params.get("orderId");

  const { data: orderDetails, isLoading } = useGetSavedOrderDetailsQuery(
    { orderId },
    { skip: !orderId }
  );
  console.log("selected order details", selectedOrderDetails);
  console.log("order details", orderDetails);
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
          <Info label="Order No" value={selectedOrderDetails?.OrderNo} />
          <Info
            label="Order Date"
            value={
              selectedOrderDetails?.OrderPlacedDate
                ? format(
                    new Date(selectedOrderDetails?.OrderPlacedDate),
                    "dd/MM/yyyy"
                  )
                : ""
            }
          />

          <Info
            label="Status"
            value={getOrderStatus(selectedOrderDetails?.Status)}
          />
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
            value={`${selectedOrderDetails?.CustomerMaster?.BillAddress1} ${selectedOrderDetails?.CustomerMaster?.BillAddress2} ${selectedOrderDetails?.CustomerMaster?.BillCity}`}
          />
          <Info
            label="Sales Person"
            value={selectedOrderDetails?.SalesPerson?.PersonName}
          />
          <Info
            label="Order Reference"
            value={selectedOrderDetails?.OrderReference || "N/A"}
          />
         
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
