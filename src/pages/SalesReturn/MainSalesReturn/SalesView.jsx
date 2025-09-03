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

  const getProductNameForNo = (order, referenceApplicable = 0) => {
    console.log("coming in no")
    const {
      productType,
      ProductType,
      ProductDetails,
      fittingPrice,
      fittingGSTPercentage,
      batchCode,
      expiry,
      Spherical,
      Cylinder,
      Diameter,
      AddOnData,
    } = order;

    const detail = Array.isArray(ProductDetails)
      ? ProductDetails[0]
      : ProductDetails;

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
    if (order.ProductType === 1) {
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

    // Accessories / Variation (order.ProductType 2)
    if (order.ProductType === 2) {
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

    // Contact Lens (order.ProductType 3)
    if (order.ProductType === 3) {
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
          joinNonEmpty([clean(detail.productName)]),
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

    // Ophthalmic Lenses (order.ProductType 0)
    if (order.ProductType === 0) {
      // ${detail.treatmentName} ${detail.coatingName}
      const olLine = clean(detail.productName);
      // AddOns
      const addonNames =
        referenceApplicable === 0
          ? Array.isArray(AddOnData)
            ? AddOnData?.map((item) =>
                clean(item.name?.split(" - ₹")[0])
              ).filter(Boolean)
            : ""
          : Array.isArray(detail.addOn)
          ? detail.addOn?.map((item) => clean(item.addOnName)).filter(Boolean)
          : "";
      // for yes
      // const formatPower = (eye) =>
      //   joinNonEmpty(
      //     [
      //       cleanPower(eye?.sphericalPower) &&
      //         `SPH: ${cleanPower(eye?.sphericalPower)}`,
      //       cleanPower(eye?.addition) && `Add: ${cleanPower(eye?.addition)}`,
      //       clean(eye?.diameter) && `Dia: ${clean(eye?.diameter)}`,
      //     ],
      //     ", "
      //   );

      // for No
      // const pd = detail?.Specs || {};

      // const rightParts = formatPower(pd.right || {});
      // const leftParts = formatPower(pd.left || {});
      const singlePower = detail?.Specs;

      const singlePowerData = joinNonEmpty([
        cleanPower(singlePower?.Spherical) && `SPH: ${singlePower?.Spherical},`,
        cleanPower(singlePower?.Cylinder) && `Cyl: ${singlePower?.Cylinder},`,
        cleanPower(singlePower?.Diameter) && `Dia: ${singlePower?.Diameter}`,
      ]);

      // const powerLine = joinNonEmpty(
      //   [rightParts && `R: ${rightParts}`, leftParts && `L: ${leftParts}`],
      //   "\n"
      // );

      let fittingLine = "";
      const fitPrice = parseFloat(fittingPrice);
      const gstPerc = parseFloat(fittingGSTPercentage);
      if (!isNaN(fitPrice) && !isNaN(gstPerc) && fitPrice > 0) {
        fittingLine = `Fitting Price: ₹${(
          fitPrice *
          (1 + gstPerc / 100)
        ).toFixed(2)}`;
      }

      return joinNonEmpty(
        [
          olLine && olLine,
          singlePowerData,
          clean(detail.barcode) && `Barcode: ${clean(detail.barcode)}`,
          fittingLine,
          addonNames && `AddOn: ${addonNames}`,
          clean(detail.HSN) && `HSN: ${clean(clean(detail.HSN))}`,
        ],
        "\n"
      );
    }

    return "";
  };
  const getProductNameForYes = (order) => {
    console.log("coming in yes also")
    const {
      productType,
      ProductType,
      ProductDetails,
      FittingCharges,
      FittingGSTPercentage,
      batchCode,
      expiry,
      Spherical,
      Cylinder,
      Diameter,
      AddOnData,
    } = order;

    const detail = Array.isArray(ProductDetails)
      ? ProductDetails[0]
      : ProductDetails;

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
    console.log("type", order);
    // Frames (ProductType 1)
    if (order.ProductType === 1) {
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

    // Accessories / Variation (order.ProductType 2)
    if (order.ProductType === 2) {
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

    // Contact Lens (order.ProductType 3)
    if (order.ProductType === 3) {
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
          clean(detail.HSN || detail.hSN) &&
            `HSN: ${clean(detail.HSN || detail.hSN)}`,
        ],
        "\n"
      );
    }

    // Optical Lenses (order.ProductType 0)
    if (order.ProductType === 0) {
      const olLine = clean(detail.productDescName);
      // AddOns
      const addonNames = detail.specs?.addOn?.addOnName;
      const tintName = detail.tint?.tintName;

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
      const fitPrice = parseFloat(FittingCharges);
      const gstPerc = parseFloat(FittingGSTPercentage);
      if (!isNaN(fitPrice) && !isNaN(gstPerc) && fitPrice > 0) {
        fittingLine = `Fitting Price: ₹${(
          fitPrice *
          (1 + gstPerc / 100)
        ).toFixed(2)}`;
      }

      return joinNonEmpty(
        [
          olLine && olLine,
          powerLine,
          clean(detail.barcode) && `Barcode: ${clean(detail.barcode)}`,
          addonNames && `AddOn: ${addonNames}`,
          fittingLine,
          clean(detail.hSN) && `HSN: ${clean(clean(detail.hSN))}`,
        ],
        "\n"
      );
    }

    return "";
  };

  // Calculate summary values
  const totalQty = salesDetails?.data.reduce(
    (sum, item) => sum + (parseInt(item.ReturnQty) || 0),
    0
  );
  const grandTotal = salesDetails?.data.reduce((sum, item) => {
    const price = parseFloat(item.TotalAmount || 0);
    const fittingPrice = parseFloat(item.FittingCharges || 0);
    const gst = parseFloat(item.FittingGSTPercentage || 0);
    const fittingGst = fittingPrice * (gst / 100);
    return sum + price + fittingPrice + fittingGst;
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
          <div className="text-2xl text-neutral-700 font-semibold">
            View Sales Return Details
          </div>
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
                  <div className="whitespace-pre-wrap">
                    {s.InvoiceMain && s.InvoiceDetails
                      ? getProductNameForYes(s)
                      : getProductNameForNo(s)}
                  </div>
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
                  {formatINR(
                    parseFloat(s.ReturnPricePerUnit * s.ReturnQty) +
                      parseFloat(
                        s.ProductType === 0
                          ? parseFloat(
                              (s.FittingCharges || 0) *
                                ((s.FittingGSTPercentage || 0) / 100)
                            )
                          : 0
                      ) +
                      parseFloat(s.FittingCharges || 0)
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
