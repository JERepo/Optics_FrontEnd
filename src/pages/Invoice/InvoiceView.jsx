import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Table, TableCell, TableRow } from "../../components/Table";
import { format } from "date-fns";
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import {
  useCreateEInvoiceMutation,
  useGetEInvoiceDataQuery,
  useGetInvoiceByIdQuery,
  useGetInvoiceDetailsQuery,
} from "../../api/InvoiceApi";
import { formatINR } from "../../utils/formatINR";
import { useSelector } from "react-redux";
import { useGetLocationByIdQuery } from "../../api/roleManagementApi";
import { useGetCompanyIdQuery } from "../../api/customerApi";

const getProductName = (order) => {
  const product = order?.productDetails?.[0];
  if (!product) return "";

  const { ProductType, FittingPrice, FittingGSTPercentage } = order;

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

  // Frame
  if (ProductType === 1) {
    const name = clean(product.productDescName);
    const specDetails = clean(product.specs);
    const barcodeVal = clean(product.barcode);
    const hsn = clean(product.hSN);
    const cat =
      order.InvoiceMain?.InvoiceType === 0 ? "Optical Frame" : "Sunglass";

    const line1 = [name].filter(Boolean).join(" ");
    const line2 = [specDetails].filter(Boolean).join("-");

    return [
      line1,
      line2 && `Size: ${line2}`,
      cat && `Category: ${cat}`,
      barcodeVal && `Barcode: ${barcodeVal}`,
      hsn && `HSN: ${hsn}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  // Accessory
  if (ProductType === 2) {
    const name = clean(product.productDescName);
    const variation = clean(product.specs?.variation);
    const barcodeVal = clean(product.specs?.barcode || product.barcode);
    const hsn = clean(product.hSN);

    return [
      [name].filter(Boolean).join(" "),
      variation && `Variation: ${variation}`,
      barcodeVal && `Barcode: ${barcodeVal}`,
      hsn && `HSN: ${hsn}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  // Contact Lens
  if (ProductType === 3) {
    const name = clean(product.productDescName);
    const hsn = clean(product.hSN);
    const barcodeVal = clean(product.barcode);
    const color = clean(product.specs?.color);
    const batchCode = clean(product.stock[0]?.batchCode);
    const expiry = clean(product.stock[0]?.cLBatchExpiry);

    const sph = cleanPower(product.specs?.sphericalPower);
    const cyld = cleanPower(product.specs?.cylindricalPower);
    const axis = clean(product.specs?.axis);
    const addl = cleanPower(product.specs?.additional);

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
      color && `Color: ${color}`,
      barcodeVal && `Barcode: ${barcodeVal}`,
      batchCode && `Batch Code: ${batchCode || "-"}`,
      expiry && `Expiry: ${expiry.split("-").reverse().join("/")}`,
      hsn && `HSN: ${hsn}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  // Optical Lens
  if (ProductType === 0) {
    const olLine = [product.productDescName]
      .map(clean)
      .filter(Boolean)
      .join(" ");

    const right = product.specs?.powerDetails?.right || {};
    const left = product.specs?.powerDetails?.left || {};

    const rightParts = [
      cleanPower(right.sphericalPower) &&
        `SPH: ${cleanPower(right.sphericalPower)}`,
      cleanPower(right.addition) && `Add: ${cleanPower(right.addition)}`,
    ].filter(Boolean);

    const leftParts = [
      cleanPower(left.sphericalPower) &&
        `SPH: ${cleanPower(left.sphericalPower)}`,
      cleanPower(left.addition) && `Add: ${cleanPower(left.addition)}`,
    ].filter(Boolean);

    const powerLine = [
      rightParts.length > 0 ? `R: ${rightParts.join(", ")}` : "",
      leftParts.length > 0 ? `L: ${leftParts.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const addOnLine =
      clean(product.specs?.addOn?.addOnName) &&
      `Addon: ${clean(product.specs?.addOn?.addOnName)}`;
    const tintLine =
      clean(product.specs?.tint?.tintName) &&
      `Tint: ${clean(product.specs?.tint?.tintName)}`;
    const barcodeLine =
      clean(product.barcode) && `Barcode: ${clean(product.barcode)}`;
    const hsnLine = clean(product.hSN) && `HSN: ${clean(product.hSN)}`;

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

      fittingLine,
      hsnLine,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return "";
};

const InvoiceView = () => {
  const { hasMultipleLocations, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const invoiceId = params.get("invoiceId");

  const [InvoiceEnabled, setInvoiceEnabled] = useState(true);

  const { data: invoiceDetails, isLoading } = useGetInvoiceByIdQuery(
    { id: invoiceId },
    { skip: !invoiceId }
  );

  const { data: invoiceDetailsById, isLoading: isViewLoading } =
    useGetInvoiceDetailsQuery({
      detailId: invoiceId,
      locationId: parseInt(hasMultipleLocations[0]),
    });
  const { data: eInvoiceData, isLoading: isEInvoiceLoading } =
    useGetEInvoiceDataQuery({ id: invoiceId }); //

  const [createInvoice, { isLoading: isInvoiceCreating }] =
    useCreateEInvoiceMutation();

  const { data: locationById } = useGetLocationByIdQuery(
    { id: parseInt(hasMultipleLocations[0]) },
    { skip: !parseInt(hasMultipleLocations[0]) }
  );
  const companyId = locationById?.data?.data.Id;

  const { data: companySettings } = useGetCompanyIdQuery(
    { id: companyId },
    { skip: !companyId }
  );
  const EInvoiceEnable = companySettings?.data?.data.EInvoiceEnable;
  const InvInvoiceEnable = companySettings?.data?.data.INVEInvoiceEnable;

  const getTypeName = (id) => {
    const types = { 1: "F/S", 2: "ACC", 3: "CL" };
    return types[id] || "OL";
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

    return (
      sum +
      (invoicePrice * qty +
        (item.ProductType == 0 ? parseFloat(fittingPrice) : 0))
    );
  }, 0);

  const gstAmount = invoiceDetailsById?.reduce((sum, item) => {
    const price = parseFloat(item.InvoicePrice) || 0;
    const qty = parseInt(item.InvoiceQty) || 0;
    const taxPercent = parseFloat(item.TaxPercent) || 0;
    const fittingPrice = parseFloat(item.FittingPrice || 0);
    const fittingGST = parseFloat(item.FittingGSTPercentage || 0);
    const totalFittinPrice = fittingPrice * (fittingGST / 100);

    const { gstAmount } = calculateGST(price * qty, taxPercent);
    return (
      sum +
        parseFloat(gstAmount) +
        (item.ProductType == 0 ? totalFittinPrice : 0) || 0
    );
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

  const getEInvoiceData = async () => {
    const eInvoicePayload = {
      recordId: parseInt(invoiceId) ?? null,
      type: "invoice",
    };
    try {
      await createInvoice({
        companyId: parseInt(hasMultipleLocations[0]),
        userId: user.Id,
        payload: eInvoicePayload,
      }).unwrap();
      setInvoiceEnabled(false);
    } catch (error) {
      setInvoiceEnabled(true);
      console.log(error);
    }
  };

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
            Invoice Details
          </div>
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
                <TableCell>{`${invoice.OrderDetail?.OrderMaster.OrderPrefix}/${invoice.OrderDetail?.OrderMaster?.OrderNo}/${invoice.InvoiceSlNo}`}</TableCell>
                <TableCell>{getTypeName(invoice?.ProductType)}</TableCell>
                <TableCell>
                  <div className="whitespace-pre-wrap">
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
                      parseFloat(invoice.InvoicePrice) +
                      (invoice.ProductType === 0
                        ? parseFloat(invoice.FittingPrice)
                        : 0)
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
        {invoiceDetails?.CustomerMaster?.TAXRegisteration === 1 &&
          EInvoiceEnable === 1 &&
          InvInvoiceEnable === 1 && (
            <div className="mt-10">
              <div className="bg-white rounded-sm shadow-sm p-4">
                <div className="flex justify-between items-center mb-5">
                  <div className="text-neutral-700 text-xl font-semibold ">
                    E-Invoice Details
                  </div>
                  <div>
                    <Button
                      onClick={getEInvoiceData}
                      isLoading={isInvoiceCreating}
                      disabled={
                        isInvoiceCreating ||
                        (eInvoiceData?.data?.data?.length > 0 &&
                          eInvoiceData.data.data[
                            eInvoiceData.data.data.length - 1
                          ]?.ErrorCode === "200") ||
                        (eInvoiceData?.data?.data?.length > 0 &&
                          eInvoiceData.data.data[0]?.ErrorCode === "200")
                      }
                    >
                      Generate Invoice
                    </Button>
                  </div>
                </div>
                <div>
                  <Table
                    columns={["S.No", "E-Invoice Date", "status"]}
                    data={eInvoiceData?.data.data}
                    renderRow={(ei, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {ei?.CreatedOn
                            ? format(new Date(ei.CreatedOn), "dd/MM/yyyy")
                            : ""}
                        </TableCell>
                        <TableCell>{ei.ErrorMessage}</TableCell>
                      </TableRow>
                    )}
                    emptyMessage={
                      isEInvoiceLoading ? "Loading..." : "No data available"
                    }
                  />
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
