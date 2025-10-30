import React from "react";
import { useLocation, useNavigate } from "react-router";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { format } from "date-fns";
import Button from "../../../components/ui/Button";
import Loader from "../../../components/ui/Loader";
import { formatINR } from "../../../utils/formatINR";
import { useGetStockInByIdQuery } from "../../../api/stockTransfer";
import { useSelector } from "react-redux";

const getProductName = (data) => {
  const item = { ...data.ProductDetails, ...data };
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
    productName,
    barcode,
    ProductType,
    hsncode,
    colour,
    brandName,
    HSN,
    BatchCode,
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
  if (ProductType === 1) {
    const lines = [
      productName,
      Size ? `Size: ${Size.Size}` : "",
      Category === 0 ? "Category: Optical Frame" : "Category: Sunglasses",
      barcode ? `Barcode: ${barcode}` : "",
      clean(hsncode || HSN) ? `HSN: ${hsncode || HSN}` : "",
    ];
    return lines.filter(Boolean).join("\n");
  }

  // For Accessories (ProductType = 2)
  if (ProductType === 2) {
    const lines = [
      ProductName || productName,
      Variation ? `Variation: ${Variation.Variation}` : "",
      barcode ? `Barcode: ${barcode}` : "",
      clean(hsncode || HSN) ? `HSN: ${hsncode || HSN}` : "",
    ];
    return lines.filter(Boolean).join("\n");
  }

  // For Contact Lens (ProductType = 3)
  if (ProductType === 3) {
    const batchcode = item?.Stock[0]?.BatchCode ?? null;
    const expiry = item?.Stock[0]?.Expiry ?? null;
    const specs = PowerSpecs
      ? [
          PowerSpecs.Sph ? `Sph: ${clean(PowerSpecs.Sph)}` : "",
          PowerSpecs.Cyl ? `Cyl: ${clean(PowerSpecs.Cyl)}` : "",
          PowerSpecs.Axis ? `Axis: ${clean(PowerSpecs.Axis)}` : "",
          PowerSpecs.Add ? `Add: ${clean(PowerSpecs.Add)}` : "",
        ]
          .filter(Boolean)
          .join(", ")
      : "";

    const lines = [
      ProductName || productName,
      specs ? `${specs}` : "",
      clean(colour) ? `Colour: ${clean(colour)}` : "",
      barcode ? `Barcode: ${barcode}` : "",
      clean(batchcode) ? `BatchCode: ${batchcode}` : "",
      clean(expiry) && `Expiry: ${expiry.split("-").reverse().join("/")}`,
      clean(hsncode || HSN) ? `HSN: ${hsncode || HSN}` : "",
    ];

    return lines.filter(Boolean).join("\n");
  }

  // For Optical Lens (ProductType = 0)
  if (ProductType === 0) {
    const tintName = clean(Tint?.name) || "";
    const addOns = AddOns?.map((a) => clean(a.name)).filter(Boolean) || [];

    const specsLines = (Array.isArray(Specs) ? Specs : [{ ...Specs }])
      .map((spec) => {
        const side = clean(spec?.side);
        const sph = clean(spec?.sph || spec.Spherical);
        const cyl = clean(spec?.cyl || spec.Cylinder);
        const dia = clean(spec.Diameter);
        const axis = clean(spec?.axis);
        const addition = clean(spec?.addition);

        const powerValues = [];
        if (sph) powerValues.push(`SPH ${formatPowerValue(sph)}`);
        if (cyl) powerValues.push(`CYL ${formatPowerValue(cyl)}`);
        if (dia) powerValues.push(`Dia ${formatPowerValue(dia)}`);
        if (axis) powerValues.push(`Axis ${formatPowerValue(axis)}`);
        if (addition) powerValues.push(`Add ${formatPowerValue(addition)}`);

        return powerValues.join(", ");
      })
      .filter(Boolean)
      .join("\n");

    const lines = [
      clean((ProductName || productName) && `${productName || ProductName}`),
      specsLines,
      tintName ? `Tint: ${tintName}` : "",
      addOns?.length > 0 ? `AddOn: ${addOns.join(", ")}` : "",
      clean(FittingPrice) ? `Fitting Price: ${FittingPrice}` : "",
      clean(hsncode || HSN) && `HSN: ${hsncode || HSN}`,
    ];

    return lines.filter(Boolean).join("\n");
  }

  return "";
};

const getStockOutPrice = (data) => {
  const item = { ...data.ProductDetails, ...data };
  if (!item) {
    return 0;
  }

  if (item.ProductType === 3) {
    if (item.CLBatchCode === 0) {
      return parseFloat(item.price?.BuyingPrice || 0);
    } else if (item.CLBatchCode === 1) {
      if (Array.isArray(item.Stock)) {
        return item.Stock[0]?.BuyingPrice || 0;
      } else if (item.Stock && typeof item.Stock === "object") {
        return parseFloat(item.Stock.BuyingPrice || 0);
      }
    }

    return parseFloat(item.Stock?.BuyingPrice || 0);
  }
  if (item.ProductType === 1) {
    return parseFloat(item.Stock?.BuyingPrice || 0);
  }
  if (item.ProductType === 2) {
    return parseFloat(item.Stock?.BuyingPrice || 0);
  }
  if (item.ProductType === 0) {
    if (item.CLBatchCode === 0) {
      return parseFloat(item.price?.BuyingPrice || 0);
    } else if (item.CLBatchCode === 1) {
      if (Array.isArray(item.Stock)) {
        return item.Stock[0]?.BuyingPrice || 0;
      } else if (item.Stock && typeof item.Stock === "object") {
        return parseFloat(item.Stock.BuyingPrice || 0);
      }
    }

    return parseFloat(item.Stock?.BuyingPrice || 0);
  }
  return 0;
};
const StockTransferInView = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const params = new URLSearchParams(search);
  const stockIn = params.get("stockInId");

  const { data: stockDetails, isLoading } = useGetStockInByIdQuery({
    mainId: stockIn,
    locationId: parseInt(hasMultipleLocations[0]),
  });

  const getShortTypeName = (id) => {
    if (id === null || id === undefined) return;
    if (id === 1) return "F/S";
    if (id === 2) return "ACC";
    if (id === 3) return "CL";
    if (id === 0) return "OL";
    return "";
  };
  const statusMap = {
    0: "Draft",
    1: "Completed",
    2: "Cancelled",
  };
  const totals = (stockDetails?.data?.StockTransferInDetails || []).reduce(
    (acc, item) => {
      const qty = item.STQtyIn || 0;
      const unitPrice = parseFloat(item.TransferPrice) || 0;
      const gstRate = parseFloat(item.ProductTaxPercentage) / 100;

      const basicValue = unitPrice * qty;
      const gst = unitPrice * qty * gstRate;
      const returnTotal = basicValue + gst;

      acc.totalQty += qty;
      acc.totalGST += gst;
      acc.totalBasicValue += basicValue;
      acc.totalReturnValue += returnTotal;

      return acc;
    },
    { totalQty: 0, totalGST: 0, totalBasicValue: 0, totalReturnValue: 0 }
  );

  const formattedTotals = {
    totalQty: totals.totalQty,
    totalGST: formatINR(totals.totalGST),
    totalBasicValue: formatINR(totals.totalBasicValue),
    totalReturnValue: formatINR(totals.totalReturnValue),
  };
  if (isLoading) {
    return <Loader color="black" />;
  }
  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl font-medium text-neutral-700">
            View Stock Transfer In Details
          </div>
          <div>
            <Button
              variant="outline"
              onClick={() => navigate("/stock-transfer-in")}
            >
              Back
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Info
            label="STIN No"
            value={`${stockDetails?.data?.STInPrefix}/${stockDetails?.data?.STInNo}`}
          />
          <Info
            label="From Location"
            value={`${stockDetails?.data?.Company?.CompanyName || ""} ${stockDetails?.data?.Company?.BillingAddress1 ?? ""} ${
              stockDetails?.data?.Company?.BillingCity ?? ""
            } ${stockDetails?.data?.Company?.BillingZipCode ?? ""}`}
          />
          <Info
            label="Address"
            value={
              stockDetails?.data?.STInCreateDate
                ? format(
                    new Date(stockDetails?.data?.STInCreateDate),
                    "dd/MM/yyyy"
                  )
                : ""
            }
          />
          <Info
            label="Date"
            value={
              stockDetails?.data?.STInCreateDate
                ? format(
                    new Date(stockDetails.data.STInCreateDate),
                    "dd/MM/yyyy"
                  )
                : ""
            }
          />
          <Info
            label="Status"
            value={statusMap[stockDetails?.data?.Status] || "Unknown"}
          />

          
        </div>

        {/* Product Table */}
        <div className="mt-5">
          <Table
            columns={[
              "s.no",
              "type",
              "product name",
              "transfer price",
              "pending qty",
              "transfer in qty",
              "gst",
              "total amount",
            ]}
            data={stockDetails?.data?.StockTransferInDetails}
            renderRow={(item, index) => (
              <TableRow key={item.ID}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{getShortTypeName(item.ProductType)}</TableCell>
                <TableCell className="whitespace-pre-wrap">
                  {getProductName(item)}
                </TableCell>
                <TableCell>₹{formatINR(item.TransferPrice)}</TableCell>
                <TableCell>{item.PendingQty || 0}</TableCell>
                <TableCell>{item.STQtyIn}</TableCell>

                <TableCell>
                  ₹
                  {formatINR(
                    parseFloat(item.TransferPrice) *
                      (parseFloat(item.ProductTaxPercentage) / 100)
                  )}
                  ({parseFloat(item.ProductTaxPercentage)}%)
                </TableCell>

                <TableCell>
                  ₹
                  {formatINR(
                    parseFloat(item.TransferPrice) * item.STQtyIn +
                      parseFloat(item.TransferPrice) *
                        (parseFloat(item.ProductTaxPercentage) / 100) *
                        item.STQtyIn
                  )}
                </TableCell>
              </TableRow>
            )}
          />
        </div>

        {/* Summary Section */}
        {stockDetails?.data?.StockTransferInDetails?.length > 0 && (
          <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200 ">
            <div className="flex justify-between">
              <Info label="Comments" value={stockDetails?.data?.Comment || ""} />
            <div className="flex justify-end gap-10">
              <div className="flex flex-col">
                <span className="text-neutral-700 font-semibold text-lg">
                  Total Qty
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  {formattedTotals.totalQty}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-700 font-semibold text-lg">
                  Total GST
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  ₹{formattedTotals.totalGST}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-700 font-semibold text-lg">
                  Total Amount
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  ₹{formattedTotals.totalReturnValue}
                </span>
              </div>
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

export default StockTransferInView;
