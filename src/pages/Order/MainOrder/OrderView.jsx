import React, { useEffect } from "react";
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
import { formatINR } from "../../../utils/formatINR";

const OrderView = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { calculateGST } = useOrder();
  const params = new URLSearchParams(search);
  const orderId = params.get("orderId");

  const { data: orderDetails, isLoading } = useGetSavedOrderDetailsQuery(
    { orderId },
    { skip: !orderId }
  );
  const { data: customerDataById, isLoading: isViewLoading } =
    useGetOrderViewByIdQuery({ id: orderId });

  const getTypeName = (id) => {
    const types = { 1: "F/S", 2: "ACC", 3: "CL" };
    return types[id] || "OL";
  };

  const formatValue = (val) =>
    val !== null && val !== undefined && val !== "" ? val : "N/A";

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
      Colour,
      Category,
      Tint,
      AddOns,
      FittingPrice,
    } = item;

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
      return val;
    };

    const formatPowerValue = (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return val;
      return num > 0 ? `+${val}` : val;
    };

    // For Frame (typeid = 1)
    if (typeid === 1) {
      const lines = [
        ProductName,
        Size ? `Size: ${Size}` : "",
        Category === 0 ? "Category: Optical Frame" : "Category: Sunglasses",
        Barcode ? `Barcode: ${Barcode}` : "",
        PatientName ? `Patient Name: ${PatientName}` : "",
      ];
      return lines.filter(Boolean).join("\n");
    }

    // For Accessories (typeid = 2)
    if (typeid === 2) {
      const lines = [
        ProductName,
        Variation ? `Variation: ${Variation}` : "",
        Barcode ? `Barcode: ${Barcode}` : "",
        PatientName ? `Patient Name: ${PatientName}` : "",
      ];
      return lines.filter(Boolean).join("\n");
    }

    // For Contact Lens (typeid = 3)
    if (typeid === 3) {
      const specs = PowerSpecs
        ? PowerSpecs.split(",")
            .map((s) => {
              const [key, val] = s.split(":");
              const cleanedValue =
                val && !["null", "undefined"].includes(val.trim())
                  ? formatPowerValue(val.trim())
                  : "";
              return cleanedValue ? `${key.trim()}: ${cleanedValue}` : "";
            })
            .filter(Boolean)
            .join(", ")
        : "";

      const lines = [
        ProductName,
        specs,
        clean(Colour) ? `Colour: ${Colour}` : "",
        Barcode ? `Barcode: ${Barcode}` : "",
        PatientName ? `Patient Name: ${PatientName}` : "",
      ];
      return lines.filter(Boolean).join("\n");
    }

    // For Optical Lens (typeid = 0)
    if (typeid === 0) {
      const tintName = clean(Tint?.name);
      const addOns = AddOns?.map((a) => clean(a.name)).filter(Boolean);

      const specsLines = (Specs || [])
        .map((spec) => {
          const side = clean(spec.side);
          const sph = clean(spec.sph);
          const cyl = clean(spec.cyl);
          const axis = clean(spec.axis);
          const addition = clean(spec.addition);

          const powerValues = [];
          if (sph) powerValues.push(`SPH ${formatPowerValue(sph)}`);
          if (cyl) powerValues.push(`CYL ${formatPowerValue(cyl)}`);
          if (axis) powerValues.push(`Axis ${formatPowerValue(axis)}`);
          if (addition) powerValues.push(`Add ${formatPowerValue(addition)}`);

          return powerValues.length ? `${side}: ${powerValues.join(", ")}` : "";
        })
        .filter(Boolean)
        .join("\n");

      const lines = [
        clean(ProductName),
        specsLines,
        tintName ? `Tint: ${tintName}` : "",
        addOns?.length > 0 ? `AddOn: ${addOns.join(", ")}` : "",
        clean(FittingPrice) ? `Fitting Price: ${FittingPrice}` : "",
        PatientName ? `Patient Name: ${clean(PatientName)}` : "",
      ];

      return lines.filter(Boolean).join("\n");
    }

    return "";
  };

  const totalQty = orderDetails?.reduce(
    (sum, item) => sum + (parseInt(item.OrderQty) || 0),
    0
  );

  const totalGST = orderDetails?.reduce((sum, item) => {
    const gstInfo = calculateGST(
      parseFloat(item.DiscountedSellingPrice * item.OrderQty),
      item.TaxPercentage
    );

    const fittingPrice = parseFloat(item.FittingPrice || 0);
    const fittingGst = parseFloat(item.FittingGSTPercentage || 0);
    const totalFitting = fittingPrice * (fittingGst / 100);

    return sum + totalFitting + (parseFloat(gstInfo.gstAmount) || 0);
  }, 0);

  const grandTotal = orderDetails?.reduce((sum, item) => {
    const price = parseFloat(item.Total || 0);
    const fittingPrice = parseFloat(item.FittingPrice || 0);
    const fittingGst = parseFloat(item.FittingGSTPercentage || 0);
    const totalFitting = fittingPrice * (fittingGst / 100);

    const fittingPlusPrice = totalFitting + price + fittingPrice;

    return sum + (fittingPlusPrice || 0);
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

  const columns = [
    "S.No",
    "Type",
    "Product name",
    "Qty",
    "Rate",
    "Discount",
    "GST",
  ];

  if (
    Number(customerDataById?.data?.data?.CustomerMaster?.CreditBilling) === 0
  ) {
    columns.push("Advance Amount", "Balance Amount");
  }

  columns.push("Total");
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
          <div className="text-neutral-800 text-2xl font-semibold">
            Order Details
          </div>
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
          {customerDataById?.data.data?.CustomerMaster?.BillAddress1 && (
            <Info
              label="Customer Address"
              value={`${customerDataById?.data.data?.CustomerMaster?.BillAddress1} ${customerDataById?.data.data?.CustomerMaster?.BillAddress2} ${customerDataById?.data.data?.CustomerMaster?.BillCity}`}
            />
          )}
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
          freeze={true}
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
                   className="whitespace-pre-wrap"
                  >
                    {getProductName(order)}
                  </div>
                </TableCell>
                <TableCell>{formatValue(order?.OrderQty)}</TableCell>
                <TableCell>₹{formatINR(order?.Rate)}</TableCell>
                <TableCell>
                  ₹
                  {order?.DiscountValue
                    ? `${order.DiscountValue}(${order.DiscountPercentage}%)`
                    : 0}
                </TableCell>
                <TableCell>
                  <div className="flex  flex-col">
                    <div>
                      ₹
                      {formatINR(
                        parseFloat(
                          calculateGST(
                            parseFloat(order.DiscountedSellingPrice) *
                              parseFloat(order.OrderQty),
                            parseFloat(order.TaxPercentage)
                          ).gstAmount
                        ) 
                      )}
                    </div>
                    <div>({order.TaxPercentage}%)</div>
                  </div>
                </TableCell>
                {customerDataById?.data?.data?.CustomerMaster?.CreditBilling ===
                  0 && (
                  <>
                    <TableCell>₹{formatINR(order?.AdvanceAmount)}</TableCell>
                    <TableCell>
                      ₹
                      {formatINR(
                        order?.DiscountedSellingPrice * order.OrderQty +
                          parseFloat(order.FittingPrice || 0) *
                            (parseFloat(order.FittingGSTPercentage || 0) /
                              100) +
                          parseFloat(order.FittingPrice || 0) -
                          (order.AdvanceAmount || 0)
                      )}
                    </TableCell>
                  </>
                )}

                <TableCell>
                  ₹
                  {formatINR(
                    order?.DiscountedSellingPrice * order.OrderQty +
                      parseFloat(order.FittingPrice || 0) *
                        (parseFloat(order.FittingGSTPercentage || 0) / 100) +
                      parseFloat(order.FittingPrice || 0)
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
            <div className="flex gap-30 justify-end">
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
                  ₹{formatINR(totalGST) || "0"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-700 font-semibold text-lg">
                  Total Basic Value
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  ₹
                  {formatINR(parseFloat(grandTotal) - parseFloat(totalGST)) ||
                    "0"}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                  <span className="text-neutral-700 font-semibold text-lg">
                    Total Amount
                  </span>
                  <span className="text-neutral-600 text-xl font-medium">
                    ₹{formatINR(Number(grandTotal)) || "0"}
                  </span>
                </div>
                {customerDataById?.data.data?.CustomerMaster?.CreditBilling ===
                  0 && (
                  <div className="flex flex-col">
                    <span className="text-neutral-700 font-semibold text-lg">
                      Total Advance Amount
                    </span>
                    <span className="text-neutral-600 text-xl font-medium">
                      ₹{formatINR(Number(advanceAmount?.toFixed(2))) || "0"}
                    </span>
                  </div>
                )}
                {customerDataById?.data.data?.CustomerMaster?.CreditBilling ===
                  0 && (
                  <div className="flex flex-col">
                    <span className="text-neutral-700 font-semibold text-lg">
                      Total Balance Amount
                    </span>
                    <span className="text-neutral-600 text-xl font-medium">
                      ₹{formatINR(Number(balanceAmount?.toFixed(2))) || "0"}
                    </span>
                  </div>
                )}
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
