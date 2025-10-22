import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { format } from "date-fns";
import Button from "../../../components/ui/Button";
import Loader from "../../../components/ui/Loader";
import { formatINR } from "../../../utils/formatINR";
import { useGetStockTransferOutByIdQuery } from "../../../api/stockTransfer";
import { useSelector } from "react-redux";
import {
  useGetPRByIdQuery,
  useGetPRDataForViewQuery,
  useLazyPrintPdfQuery,
} from "../../../api/purchaseReturn";
import {
  useCreateEInvoiceMutation,
  useGetEInvoiceDataQuery,
} from "../../../api/InvoiceApi";
import toast from "react-hot-toast";
import { useGetLocationByIdQuery } from "../../../api/roleManagementApi";
import { useGetCompanyIdQuery } from "../../../api/customerApi";
import HasPermission from "../../../components/HasPermission";
import { FiPrinter } from "react-icons/fi";

const getProductName = (item) => {
  const type = item.ProductType;
  const detail = item ? item.ProductDetails : {};
  const {
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
    hsncode,
    colour,
    brandName,
    HSN,
    ExpiryDate,
  } = detail;

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
  if (type === 1) {
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
  if (type === 2) {
    const lines = [
      ProductName || productName,
      Variation ? `Variation: ${Variation.Variation}` : "",
      barcode ? `Barcode: ${barcode}` : "",
      clean(hsncode || HSN) ? `HSN: ${hsncode || HSN}` : "",
    ];
    return lines.filter(Boolean).join("\n");
  }

  // For Contact Lens (type = 3)
  if (type === 3) {
    const batchCode = detail?.Stock[0]?.BatchCode ?? "";

    const expiry = clean(detail?.Stock[0]?.Expiry) ?? "";

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
      expiry && `Expiry: ${expiry.split("-").reverse().join("/")}`,
      clean(hsncode || HSN) ? `HSN: ${hsncode || HSN}` : "",
    ];

    return lines.filter(Boolean).join("\n");
  }

  return "";
};

const getStockOutPrice = (item) => {
  if (item.ProductType === 3) {
    if (item.ProductDetails.CLBatchCode === 0) {
      return parseFloat(item.ProductDetails.price?.MRP || 0);
    }

    const stockCheck = Array.isArray(item.ProductDetails.Stock)
      ? item.ProductDetails.Stock[0].MRP
      : item.ProductDetails.Stock.MRP;
    return stockCheck;
  } else if (item.ProductType === 1) {
    return parseFloat(item.ProductDetails.Stock.MRP);
  } else if (item.ProductType === 2) {
    return parseFloat(item.ProductDetails.Stock.OPMRP);
  }

  return 0;
};
const PurchaseReturnView = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { hasMultipleLocations, user } = useSelector((state) => state.auth);
  const params = new URLSearchParams(search);
  const PR = params.get("purchaseId");
  const [InvoiceEnabled, setInvoiceEnabled] = useState(true);
  const [printingId, setPrintingId] = useState(null);

  const { data: PRDetails, isLoading } = useGetPRByIdQuery(PR, {
    skip: !PR,
  });
  const { data: PRMainDetails, isLoading: mainDetailsLoading } =
    useGetPRDataForViewQuery({
      id: PR,
      locationId: parseInt(hasMultipleLocations[0]),
    });

  const [createInvoice, { isLoading: isInvoiceCreating }] =
    useCreateEInvoiceMutation();
  const { data: eInvoiceData, isLoading: isEInvoiceLoading } =
    useGetEInvoiceDataQuery({ id: parseInt(PR), type: "purchaseReturn" });
  const { data: locationById } = useGetLocationByIdQuery(
    { id: parseInt(hasMultipleLocations[0]) },
    { skip: !parseInt(hasMultipleLocations[0]) }
  );
  const companyId = locationById?.data?.data.Id;

  const { data: companySettings } = useGetCompanyIdQuery(
    { id: companyId },
    { skip: !companyId }
  );
  const [generatePrint, { isFetching: isPrinting }] = useLazyPrintPdfQuery();
  const EInvoiceEnable = companySettings?.data?.data.EInvoiceEnable;
  const InvInvoiceEnable = companySettings?.data?.data.DNEInvoiceEnable;
  const getShortTypeName = (id) => {
    if (id === null || id === undefined) return;
    if (id === 1) return "F/S";
    if (id === 2) return "ACC";
    if (id === 3) return "CL";
    if (id === 0) return "OL";
    return "";
  };

  const totals = (PRMainDetails?.details || []).reduce(
    (acc, item) => {
      const qty = item.DNQty || 0;
      const unitPrice = parseFloat(item.DNPrice) || 0;
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
    totalReturnValue: formatINR(totals.totalReturnValue + (parseFloat(PRDetails?.data?.data?.RoundOff) || 0)),
  };
  const getEInvoiceData = async () => {
    const eInvoicePayload = {
      recordId: parseInt(PR) ?? null,
      type: "purchaseReturn",
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
      toast.error(
        error?.data?.error?.message ||
          error?.data?.error?.createdRecord?.ErrorMessage ||
          "E-Invoice Not enabled for this customer"
      );
    }
  };
  const handlePrint = async (item) => {
    setPrintingId(item.Id);

    try {
      const blob = await generatePrint({
        prId: PR,
        companyId: parseInt(hasMultipleLocations[0]),
      }).unwrap();

      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `DebittNote_${item.DNNo} (${item.DNPrefix}${item.DNNo}).pdf`;
      document.body.appendChild(link);
      link.click();
      // clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error);
      toast.error(
        "Unable to print the stock transfer out please try again after some time!"
      );
    } finally {
      setPrintingId(null);
    }
  };

  if (isLoading) {
    return <Loader color="black" />;
  }
  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl font-medium text-neutral-700">
            View Purchase Return Details
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/purchase-return")}
            >
              Back
            </Button>
            <Button
              onClick={() => handlePrint(PRDetails?.data.data)}
              icon={FiPrinter}
              isLoading={printingId == PRDetails?.data.data.Id}
            ></Button>
          </div>
        </div>
        {/* Order Details */}
        <div className="grid grid-cols-3 gap-3">
          <Info
            label="Vendor Name"
            value={PRDetails?.data.data.Vendor.VendorName}
          />

          {PRDetails?.data.data.Vendor.TAXRegisteration === 1 && (
            <>
              <Info label="GST No:" value={PRDetails?.data.data.Vendor.TAXNo} />

              <Info
                label="PAN Number"
                value={PRDetails?.data.data.Vendor.PANNumber}
              />

              <Info
                label="Address"
                value={
                  (PRDetails?.data.data.Vendor.Address1 &&
                    PRDetails?.data.data.Vendor.Landmark) ||
                  (PRDetails?.data.data.Vendor.City &&
                    `${PRDetails?.data.data.Vendor.Address1} ${PRDetails?.data.data.Vendor.Landmark} ${PRDetails?.data.data.Vendor.City}`)
                }
              />
            </>
          )}
        </div>

        {/* Product Table */}
        <div className="mt-5">
          <Table
            expand={true}
            columns={[
              "s.no",
              "Product type",
              "supplier order no",
              "Product Details",
              "srp",
              "return qty",
              "return price",
              "gst/unit",
              "total price",
            ]}
            data={PRMainDetails?.details || []}
            renderRow={(item, index) => (
              <TableRow key={item.ID}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{getShortTypeName(item.ProductType)}</TableCell>
                <TableCell></TableCell>
                <TableCell className="whitespace-pre-wrap">
                  {getProductName(item)}
                </TableCell>
                <TableCell>₹{formatINR(getStockOutPrice(item))}</TableCell>
                <TableCell>{item.DNQty}</TableCell>
                <TableCell>₹{item.DNPrice}</TableCell>
                <TableCell>
                  ₹
                  {formatINR(
                    parseFloat(item.DNPrice) *
                      (parseFloat(item.ProductTaxPercentage) / 100)
                  )}
                  ({parseFloat(item.ProductTaxPercentage)}%)
                </TableCell>

                <TableCell>
                  ₹
                  {formatINR(
                    parseFloat(parseFloat(item.DNPrice) * item.DNQty) +
                      parseFloat(item.DNPrice) *
                        ((parseFloat(item.ProductTaxPercentage) / 100) *
                          item.DNQty)
                  )}
                </TableCell>
              </TableRow>
            )}
          />
        </div>

        {/* Summary Section */}
        {PRMainDetails?.details && (
          <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200 justify-end">
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
                  Round Off
                </span>
                <span className="text-neutral-600 text-xl font-medium">
                  ₹{PRDetails?.data.data?.RoundOff}
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
        )}
        {PRDetails?.data.data.Vendor.TAXRegisteration === 1 &&
          EInvoiceEnable === 1 &&
          InvInvoiceEnable === 1 && (
            <div className="mt-10">
              <div className="bg-white rounded-sm shadow-sm p-4">
                <div className="flex justify-between items-center mb-5">
                  <div className="text-neutral-700 text-xl font-semibold ">
                    E-Invoice Details
                  </div>
                  <div>
                    <HasPermission module="Purchase-Return" action="deactivate">
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
                        Generate E-Invoice
                      </Button>
                    </HasPermission>
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

export default PurchaseReturnView;
