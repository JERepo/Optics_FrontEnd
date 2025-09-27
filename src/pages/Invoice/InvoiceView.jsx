import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Table, TableCell, TableRow } from "../../components/Table";
import { format } from "date-fns";
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import {
  useCancelInvoiceMutation,
  useCreateEInvoiceMutation,
  useGetEInvoiceDataQuery,
  useGetInvoiceByIdQuery,
  useGetInvoiceDetailsQuery,
  useGetPaymentDetailsQuery,
} from "../../api/InvoiceApi";
import { formatINR } from "../../utils/formatINR";
import { useSelector } from "react-redux";
import { useGetLocationByIdQuery } from "../../api/roleManagementApi";
import { useGetCompanyIdQuery } from "../../api/customerApi";
import toast from "react-hot-toast";
import Modal from "../../components/ui/Modal";
import Radio from "../../components/Form/Radio";
import HasPermission from "../../components/HasPermission";

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

const PaymentTypes = {
  1: "Cash",
  2: "Card",
  3: "UPI",
  4: "Cheque",
  5: "Bank Transfer",
  6: "Advance",
  7: "Gift Voucher",
};

const InvoiceView = () => {
  const { hasMultipleLocations, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const invoiceId = params.get("invoiceId");

  const [InvoiceEnabled, setInvoiceEnabled] = useState(true);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelDisabled, setIsCancelDisabled] = useState(false);
  const [carry, setCarry] = useState(null);

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
    useGetEInvoiceDataQuery({ id: invoiceId, type: "invoice" }); //

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

  const { data: paymentDetails } = useGetPaymentDetailsQuery({
    id: parseInt(invoiceId),
  });
  const [cancelInvoice, { isLoading: isCancelling }] =
    useCancelInvoiceMutation();

  const getTypeName = (id) => {
    const types = { 1: "F/S", 2: "ACC", 3: "CL" };
    return types[id] || "OL";
  };
  const getPricing = (order) => {
    if (
      order.productType === 0 ||
      order.productType === 1 ||
      order.productType === 2
    ) {
      return order.pricing?.mrp || 0;
    } else if (order.productType === 3) {
      if (order.cLBatchCode === 0) {
        return order.priceMaster?.mrp || 0;
      } else if (order.cLBatchCode === 1) {
        return order.stock[0]?.mrp;
      }
      return 0;
    } else {
      return 0;
    }
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
    const fittingGst = parseFloat(item.FittingGSTPercentage || 0);
    const FittingAmt = fittingPrice * (fittingGst / 100);
    return (
      sum +
      FittingAmt +
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
      2: "Partially Cancelled",
      3: "Cancelled",
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
      toast.error(
        error?.data?.error?.message ||
          error?.data?.error?.createdRecord?.ErrorMessage ||
          "E-Invoice Not enabled for this customer"
      );
    }
  };
  function canCancelInvoice(invoiceDateStr) {
    const invoiceDate = new Date(invoiceDateStr);
    const now = new Date();

    const diffMs = now - invoiceDate;
    const diffMinutes = diffMs / (1000 * 60);

    // 23 hours 55 minutes = 1435 minutes
    const limitMinutes = 23 * 60 + 55;

    if (invoiceDetails?.Status === 3) {
      return { allowed: false, message: "Invoice already cancelled!" };
    } else if (diffMinutes <= limitMinutes) {
      return { allowed: true, message: "Invoice cancellation allowed." };
    } else {
      return {
        allowed: false,
        message: "Invoice Cancellation is only allowed within 24 hours.",
      };
    }
  }
  const isUPIBankAvl = paymentDetails?.data?.receiptDetails?.some(
    (item) => item.Type === 3 || item.Type === 5
  );

  useEffect(() => {
    setCarry(isUPIBankAvl ? 1 : 0);
  }, [isUPIBankAvl, paymentDetails]);

  const handleCancelInvoice = async () => {
    if (invoiceDetails?.CustomerMaster?.CreditBilling === 0) {
      const result = canCancelInvoice(invoiceDetails?.InvoiceDate);
      if (result.allowed) {
        setIsCancelOpen(true);
      } else {
        toast.error(result.message);
        return;
      }
    } else if (invoiceDetails?.CustomerMaster?.CreditBilling === 1) {
      const result = canCancelInvoice(invoiceDetails?.InvoiceDate);
      if (result.allowed) {
        setIsCancelOpen(true);
      } else {
        toast.error(result.message);
        return;
      }
      try {
        const payload = {
          InvoiceMainId: parseInt(invoiceId) ?? null,
          CustomerMasterID: invoiceDetails?.CustomerMaster?.Id ?? null,
          locationId: parseInt(hasMultipleLocations[0]),
        };

        const res = await cancelInvoice({ payload }).unwrap();
        toast.success("Invoice Cancelled Successfully");
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleUpdateCanceInvoice = async () => {
    const payload = {
      InvoiceMainId: parseInt(invoiceId) ?? null,
      CustomerMasterID: invoiceDetails?.CustomerMaster?.Id ?? null,

      locationId: parseInt(hasMultipleLocations[0]),
    };

    if (carry === 0) {
      payload.selectedrefund =
        paymentDetails?.data?.receiptDetails?.map((item) => item.Type) || [];
    } else if (carry === 1) {
      payload.selectedCarryForwardTypes =
        paymentDetails?.data?.receiptDetails?.map((item) => item.Type) || [];
    }
    try {
      const payload = {
        InvoiceMainId: parseInt(invoiceId) ?? null,
        CustomerMasterID: invoiceDetails?.CustomerMaster?.Id ?? null,
        locationId: parseInt(hasMultipleLocations[0]),
      };

      const res = await cancelInvoice({ payload }).unwrap();
      toast.success("Invoice Cancelled Successfully");
      setIsCancelOpen(false);
    } catch (error) {
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
  console.log("ni",invoiceDetails)

  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-3">
          <div className="text-neutral-800 text-2xl font-semibold">
            Invoice Details
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate("/invoice")}>
              Back
            </Button>
            {invoiceDetails?.InvoiceType === 0 &&
              invoiceDetails?.Status !== 3 && (
                <HasPermission module="Invoice" action="deactivate">
                  <Button
                    variant="danger"
                    onClick={handleCancelInvoice}
                    disabled={cancelDisabled}
                    isLoading={!isCancelOpen ? isCancelling : false}
                  >
                    Cancel Invoice
                  </Button>
                </HasPermission>
              )}
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
            data={invoiceDetailsById || []}
            renderRow={(invoice, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{`${invoice.OrderDetail?.OrderMaster.OrderPrefix}/${invoice.OrderDetail?.OrderMaster?.OrderNo}/${invoice.OrderDetail?.OrderDetailSlNo}`}</TableCell>
                <TableCell>{getTypeName(invoice?.ProductType)}</TableCell>
                <TableCell>
                  <div className="whitespace-pre-wrap">
                    {getProductName(invoice)}
                  </div>
                </TableCell>
                <TableCell>
                  ₹
                  {formatINR(
                    getPricing(
                      Array.isArray(invoice?.productDetails?.length > 0)
                        ? invoice?.productDetails[0]
                        : invoice?.productDetails || []
                    )
                  )}
                </TableCell>
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
                        ? parseFloat(invoice.FittingPrice || 0)
                        : 0) +
                      parseFloat(invoice.FittingPrice || 0) *
                        (parseFloat(invoice.FittingGSTPercentage || 0) / 100)
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
                    <HasPermission module="Invoice" action={["create", "edit"]}>
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
                    data={eInvoiceData?.data.data || []}
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

        <Modal
          isOpen={isCancelOpen}
          onClose={() => setIsCancelOpen(false)}
          width="max-w-2xl"
        >
          <div className=" ">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Payment Options
            </h2>

            {/* Type Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Refund Type
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    carry === 0
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  } ${isUPIBankAvl ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => setCarry(0)}
                >
                  <div className="flex items-center h-5">
                    <input
                      id="refund-option"
                      name="refund-type"
                      type="radio"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      checked={carry === 0}
                      onChange={() => setCarry(0)}
                      disabled={isUPIBankAvl}
                    />
                  </div>
                  <div className="ml-3 flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      Refund
                    </span>
                  </div>
                </div>

                <div
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    carry === 1
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                  onClick={() => setCarry(1)}
                >
                  <div className="flex items-center h-5">
                    <input
                      id="carry-forward-option"
                      name="refund-type"
                      type="radio"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      checked={carry === 1}
                      onChange={() => setCarry(1)}
                    />
                  </div>
                  <div className="ml-3 flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      Carry Forward
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Payment Methods
              </h3>

              {paymentDetails?.data?.receiptDetails?.length > 0 ? (
                <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                  {paymentDetails.data.receiptDetails.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-medium mr-3">
                          {index + 1}
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                          {PaymentTypes[item.Type]}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-neutral-700">
                        ₹{item.Amount.toLocaleString()}
                      </div>
                    </div>
                  ))}

                  {/* Total row */}
                  <div className="p-4 flex items-center justify-between bg-gray-100">
                    <div className="text-sm font-medium text-gray-700">
                      Total
                    </div>
                    <div className="text-lg font-bold text-neutral-700">
                      ₹
                      {paymentDetails.data.receiptDetails
                        .reduce((sum, item) => sum + parseFloat(item.Amount), 0)
                        .toLocaleString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No payment details available</p>
                </div>
              )}
            </div>

            {/* Cancel Invoice Button */}
            <HasPermission module="Invoice" action="deactivate">
              <div className="flex justify-end">
                <Button
                  variant="danger"
                  onClick={handleUpdateCanceInvoice}
                  isLoading={isCancelling}
                  disabled={isCancelling}
                >
                  Cancel Invoice
                </Button>
              </div>
            </HasPermission>
          </div>
        </Modal>
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
