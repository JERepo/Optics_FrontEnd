import React from "react";
import { useLocation, useNavigate } from "react-router";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { format } from "date-fns";
import Button from "../../../components/ui/Button";
import Loader from "../../../components/ui/Loader";
import { formatINR } from "../../../utils/formatINR";
import { useGetStockTransferOutByIdQuery } from "../../../api/stockTransfer";
import { useSelector } from "react-redux";

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
    productName,
    barcode,
    ProductType,
    hsncode,
    colour,
    brandName,
    BatchCode,
    HSN,
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
    const cleaned = clean(val);
    if (!cleaned) return "";
    const num = parseFloat(cleaned);
    if (isNaN(num)) return "";
    return num >= 0 ? `+${num.toFixed(2)}` : `${num.toFixed(2)}`;
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
    const batchCode = item.Stock[0]?.BatchCode;

    const expiry = item.Stock[0]?.Expiry;
    const specs = PowerSpecs
      ? [
          PowerSpecs.Sph ? `Sph: ${formatPowerValue(PowerSpecs.Sph)}` : "",
          PowerSpecs.Cyl ? `Cyl: ${formatPowerValue(PowerSpecs.Cyl)}` : "",
          PowerSpecs.Axis ? `Axis: ${formatPowerValue(PowerSpecs.Axis)}` : "",
          PowerSpecs.Add ? `Add: ${formatPowerValue(PowerSpecs.Add)}` : "",
        ]
          .filter(Boolean)
          .join(", ")
      : "";

    const lines = [
      ProductName || productName,
      specs ? `${specs}` : "",
      clean(colour) ? `Colour: ${clean(colour)}` : "",
      barcode ? `Barcode: ${barcode}` : "",
      clean(batchCode) ? `BatchCode: ${batchCode}` : "",
      clean(expiry) ? `Expiry: ${expiry.split("-").reverse().join("/")}` : "",
      clean(hsncode || HSN) ? `HSN: ${hsncode || HSN}` : "",
    ];

    return lines.filter(Boolean).join("\n");
  }

  // For Optical Lens (ProductType = 0)
  if (ProductType === 0) {
    const tintName = clean(Tint?.name) || "";
    const addOns = AddOns?.map((a) => clean(a.name)).filter(Boolean) || [];

    let specsLines = "";

    // Handle PowerSpecs (array)
    if (Array.isArray(PowerSpecs) && PowerSpecs.length) {
      specsLines = PowerSpecs.map((spec) => {
        const side = clean(spec?.side);
        const sph = clean(spec?.sph);
        const cyl = clean(spec?.cyl);
        const axis = clean(spec?.axis);
        const addition = clean(spec?.addition);

        const powerValues = [];
        if (sph) powerValues.push(`SPH ${formatPowerValue(sph)}`);
        if (cyl) powerValues.push(`CYL ${formatPowerValue(cyl)}`);
        if (axis) powerValues.push(`Axis ${formatPowerValue(axis)}`);
        if (addition) powerValues.push(`Add ${formatPowerValue(addition)}`);

        return powerValues.length
          ? `${side ? side + ": " : ""}${powerValues.join(", ")}`
          : "";
      })
        .filter(Boolean)
        .join("\n");
    }

    // Handle Specs (single object)
    if (!specsLines && Specs && typeof Specs === "object") {
      const diameter = clean(Specs.Diameter);
      const spherical = clean(Specs.Spherical);
      const cylinder = clean(Specs.Cylinder);

      const specsValues = [];
      if (spherical) specsValues.push(`SPH ${formatPowerValue(spherical)}`);
      if (diameter) specsValues.push(`Dia ${formatPowerValue(diameter)}`);
      if (cylinder) specsValues.push(`CYL ${formatPowerValue(cylinder)}`);

      specsLines = specsValues.join(", ");
    }

    const lines = [
      clean(productName && productName),
      specsLines,
      // clean(colour) && `Color: ${colour}`,
      // clean(barcode) && `Barcode: ${barcode}`,
      clean(hsncode || HSN) && `HSN: ${hsncode || HSN}`,
      tintName ? `Tint: ${tintName}` : "",
      addOns?.length > 0 ? `AddOn: ${addOns.join(", ")}` : "",
      clean(FittingPrice) ? `Fitting Price: ${FittingPrice}` : "",
    ];

    return lines.filter(Boolean).join("\n");
  }

  return "";
};

const getStockOutPrice = (item) => {
  if (!item) {
    return 0;
  }

  if (item.ProductType === 3) {
    if (item.CLBatchCode === 0) {
      return parseFloat(item.price?.BuyingPrice || 0);
    } else if (item.CLBatchCode === 1) {
      if (Array.isArray(item.Stock)) {
        return item.Stock[0].BuyingPrice || 0;
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
        return item.Stock[0].BuyingPrice || 0;
      } else if (item.Stock && typeof item.Stock === "object") {
        return parseFloat(item.Stock.BuyingPrice || 0);
      }
    }

    return parseFloat(item.Stock?.BuyingPrice || 0);
  }

  return 0;
};
const getStockOutMRP = (item) => {
  if (!item) {
    return 0;
  }

  if (item.ProductType === 3) {
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
  if (item.ProductType === 1) {
    return parseFloat(item.Stock?.FrameSRP || 0);
  }
  if (item.ProductType === 2) {
    return parseFloat(item.Stock?.OPMRP || 0);
  }
  if (item.ProductType === 0) {
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
const StockTransferView = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const params = new URLSearchParams(search);
  const stockOut = params.get("stockOutId");

  const { data: stockDetails, isLoading } = useGetStockTransferOutByIdQuery({
    mainId: stockOut,
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

  if (isLoading) {
    return <Loader color="black" />;
  }
  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl font-medium text-neutral-700">
            View Stock Transfer Out Details
          </div>
          <div>
            <Button
              variant="outline"
              onClick={() => navigate("/stock-transfer")}
            >
              Back
            </Button>
          </div>
        </div>
        {/* Order Details */}
        <div className="grid grid-cols-3 gap-3">
          <Info
            label="From Location Name"
            value={stockDetails?.data?.result?.FromCompany?.LocationName}
          />
          <Info
            label="To Location Name"
            value={stockDetails?.data?.result?.ToCompany?.LocationName}
          />
          <Info
            label="Date"
            value={
              stockDetails?.data?.result?.STOutCreateDate
                ? format(
                    new Date(stockDetails.data.result.STOutCreateDate),
                    "dd/MM/yyyy"
                  )
                : ""
            }
          />
          <Info
            label="Stock Out No"
            value={`${stockDetails?.data?.result?.STOutPrefix}/${stockDetails?.data?.result?.STOutNo}`}
          />
        </div>

        {/* Product Table */}
        <div className="mt-5">
          <Table
            columns={[
              "s.no",
              "type",
              "Product name",
              "mrp",
              "transfer price",
              "gst",
              "stock out qty",
              "Avl qty",
              "total amount",
            ]}
            data={stockDetails?.data?.result.details || []}
            renderRow={(item, index) => (
              <TableRow key={item.ID}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{getShortTypeName(item.ProductType)}</TableCell>
                <TableCell className="whitespace-pre-wrap">
                  {getProductName(item)}
                </TableCell>
                <TableCell>₹{formatINR(getStockOutMRP(item))}</TableCell>
                <TableCell>₹{formatINR(getStockOutPrice(item))}</TableCell>
                <TableCell>
                  ₹
                  {formatINR(
                    (getStockOutPrice(item) * item.STQtyOut) *
                      (parseFloat(item.ProductTaxPercentage) / 100)
                  )}
                  ({item.ProductTaxPercentage}%)
                </TableCell>

                <TableCell>{item.STQtyOut}</TableCell>
                <TableCell>
                  {Array.isArray(item.Stock)
                    ? item.Stock[0].Quantity
                    : item.Stock.Quantity}
                </TableCell>
                <TableCell>
                  ₹
                  {formatINR(
                    getStockOutPrice(item) * item.STQtyOut +
                      (getStockOutPrice(item) *
                        (parseFloat(item.ProductTaxPercentage) / 100) *
                        item.STQtyOut)
                  )}
                </TableCell>
              </TableRow>
            )}
          />
        </div>

        {/* Summary Section */}
        {stockDetails?.data?.result && (
          <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200 justify-end">
            <div className="flex justify-end gap-10">
              <div className="flex flex-col">
                <span className="text-neutral-700 font-semibold text-lg">
                  Total Qty
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  {stockDetails?.data?.result?.details.reduce(
                    (sum, item) => sum + item.STQtyOut,
                    0
                  )}
                </span>
              </div>
              {/* summation of (Buying Price * Qty*GST %) */}
              <div className="flex flex-col">
                <span className="text-neutral-700 font-semibold text-lg">
                  Total GST
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  ₹
                  {formatINR(
                    stockDetails?.data?.result?.details.reduce(
                      (sum, item) =>
                        sum +
                        (getStockOutPrice(item) * item.STQtyOut) *
                          (parseFloat(item.ProductTaxPercentage) / 100),
                      0
                    )
                  ) || "0"}
                </span>
              </div>
              {/* Buying Price*Qty + Buying Price * Qty*GST % */}
              <div className="flex flex-col">
                <span className="text-neutral-700 font-semibold text-lg">
                  Total Amount
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  ₹
                  {formatINR(
                    stockDetails?.data?.result?.details.reduce(
                      (sum, item) =>
                        sum +
                        (item.STQtyOut * getStockOutPrice(item)) +
                        (getStockOutPrice(item) * item.STQtyOut) *
                          (parseFloat(item.ProductTaxPercentage) / 100),
                      0
                    )
                  ) || "0"}
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

export default StockTransferView;
