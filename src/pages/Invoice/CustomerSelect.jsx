import React, { useEffect, useState } from "react";
import { useGetCustomerContactDetailsQuery } from "../../api/orderApi";
import { Autocomplete, TextField } from "@mui/material";
import {
  useGetCompanyIdQuery,
  useGetCustomerByIdQuery,
} from "../../api/customerApi";
import Loader from "../../components/ui/Loader";
import {
  useGetAllOrderMasterQuery,
  useGetPatientsQuery,
  useGetProductDetailsMutation,
  useLazyGetBatchDetailsQuery,
} from "../../api/InvoiceApi";
import { useSelector } from "react-redux";
import Radio from "../../components/Form/Radio";
import Input from "../../components/Form/Input";
import Button from "../../components/ui/Button";
import { Table, TableCell, TableRow } from "../../components/Table";
import Modal from "../../components/ui/Modal";
import { useGetLocationByIdQuery } from "../../api/roleManagementApi";
import { FiEdit } from "react-icons/fi";
import { formatINR } from "../../utils/formatINR";
import toast from "react-hot-toast";

const getShortTypeName = (id) => {
  if (id === null || id === undefined) return;
  if (id === 1) return "F/S";
  if (id === 2) return "ACC";
  if (id === 3) return "CL";
  if (id === 0) return "OL";
  return "";
};

const getProductName = (order) => {
  const {
    productType,
    brandName,
    focality,
    familyName,
    designName,
    index,
    coatingName,
    treatmentName,
    specs,
    hSN,
    barcode,
    fittingPrice,
    fittingGSTPercentage,
  } = order;

  const clean = (val) => {
    if (
      val === null ||
      val === undefined ||
      val === "undefined" ||
      val === "null"
    ) {
      return "";
    }
    return String(val).trim();
  };

  if (productType === 1) {
    const brand = clean(order.brandName);
    const model = clean(order.modelNo);
    const color = clean(order.colourCode);
    const size = clean(order.size);
    const dbl = clean(order.dBL);
    const temple = clean(order.templeLength);
    const barcode = clean(order.barcode);
    const hsn = clean(order.hSN);

    const line1 = `${[brand, model, color].filter(Boolean).join(" ")}`;
    const line2 = [size, dbl, temple].filter(Boolean).join("-");
    const line3 = "OpticalFrame/Sunglass";

    return [line1, line2, line3, `Barcode: ${barcode}`, `HSN: ${hsn}`]
      .filter(Boolean)
      .join("\n");
  }

  if (productType === 2) {
    const brand = clean(order.brandName);
    const name = clean(order.productName);
    const variation = clean(specs?.variation);
    const barcode = clean(specs?.barcode);
    const hsn = clean(order.hSN);

    return [
      `${brand} ${name}`.trim(),
      `Variation: ${variation}`,
      
      `Barcode: ${barcode}`,
      `HSN: ${hsn}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (productType === 3) {
    const name = clean(order.productName);
    const brandName = clean(order.brandName)
    const hsn = clean(order.hSN);
    const barcode = clean(order.barcode);

    const sph = clean(specs?.sphericalPower);
    const cyld = clean(specs?.cylindricalPower);
    const axis = clean(specs?.axis);
    const addl = clean(specs?.additional);
    const clr = clean(specs?.color);

    const specsList = [
      `SPH: ${sph}`,
      `CYL: ${cyld}`,
      `Axis: ${axis}`,
      `Add: ${addl}`,
      `Clr: ${clr}`,
    ].join(", ");

    return [`${name} ${brandName}`, specsList, `Barcode: ${barcode}`, `HSN: ${hsn}`]
      .filter(Boolean)
      .join("\n");
  }

  if (productType === 0) {
    const olLine = `${[
      brandName,
      focality,
      familyName,
      designName,
      index ? `1.${index}` : "",
      coatingName,
      treatmentName,
    ]
      .map(clean)
      .filter(Boolean)
      .join(" ")}`;

    const right = specs?.powerDetails?.right || {};
    const left = specs?.powerDetails?.left || {};

    const rightPower = [
      `R:`,
      `SPH: ${clean(right.sphericalPower)}`,
      `Add: ${clean(right.addition)}`,
      `Dia: ${clean(right.diameter)}`,
    ].join(", ");

    const leftPower = [
      `L:`,
      `SPH: ${clean(left.sphericalPower)}`,
      `Add: ${clean(left.addition)}`,
      `Dia: ${clean(left.diameter)}`,
    ].join(", ");

    const powerLine = `${rightPower}\n${leftPower}`;

    const addOnLine = `Addon: ${clean(specs?.addOn?.addOnName)}`;
    const tintLine = `Tint: ${clean(specs?.tint?.tintName)}`;
    const barcodeLine = `Barcode: ${clean(barcode)}`;
    const hsnLine = `HSN: ${clean(hSN)}`;

    let fittingLine = "";
    const fitPrice = parseFloat(fittingPrice);
    const gstPerc = parseFloat(fittingGSTPercentage);
    if (!isNaN(fitPrice) && !isNaN(gstPerc) && fitPrice > 0) {
      const totalFitting = (fitPrice * (1 + gstPerc / 100)).toFixed(2);
      fittingLine = `Fitting Price: ₹${totalFitting}`;
    }

    return [
      olLine,
      powerLine,
      addOnLine,
      tintLine,
      barcodeLine,
      hsnLine,
      fittingLine,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return "";
};

const CustomerSelect = () => {
  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [billInTheName, setBillInTheName] = useState(0);
  const [isNextClicked, setIsNextClicked] = useState(false);
  const [isBatchCodeOpen, setIsBatchCodeOpen] = useState(false);
  const [localProductData, setLocalProductData] = useState([]);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedOrderForBatch, setSelectedOrderForBatch] = useState(null);
  console.log(selectedProducts)

  const { data: contactResp, isLoading: isPatientLoading } =
    useGetPatientsQuery({
      companyId: hasMultipleLocations[0],
    });

  const { data: locationById } = useGetLocationByIdQuery({
    id: hasMultipleLocations[0],
  });
  const companyId = locationById?.data?.data.Id;
  const { data: companySettings } = useGetCompanyIdQuery(
    { id: companyId },
    { skip: !companyId }
  );
  const { data: customerData, isLoading: isCustomerLoading } =
    useGetCustomerByIdQuery(
      { id: selectedPatient?.CustomerMasterID },
      { skip: !selectedPatient?.CustomerMasterID }
    );

  const { data: allMaster, isLoading: isMasterLoading } =
    useGetAllOrderMasterQuery(
      { patientId: selectedPatient?.Id },
      { skip: !selectedPatient?.Id }
    );

  const [getBatches, { data: batchDetails, isFetching: isBatchesFetching }] =
    useLazyGetBatchDetailsQuery();
  const [
    getProductDetails,
    { data: productData, isLoading: isProductDataLoading },
  ] = useGetProductDetailsMutation();

  useEffect(() => {
    if (productData) {
      const updatedProductData = productData.map((order) => ({
        ...order,
        toBillQty: order.orderQty - order.billedQty - order.cancelledQty,
        sellingPrice: order.discountedSellingPrice || 0,
        totalValue:
          (order.discountedSellingPrice || 0) *
          (order.orderQty - order.billedQty - order.cancelledQty),
        batchData: [], // Initialize batchData for each product
      }));
      setLocalProductData(updatedProductData);
    }
  }, [productData]);

  const masterIds = [
    ...new Set(allMaster?.data?.orders?.map((o) => o.OrderMasterId) || []),
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (masterIds.length) {
          const payload = {
            masterId: masterIds,
            productType: null,
            locationId: parseInt(hasMultipleLocations[0]),
          };
          await getProductDetails({ payload }).unwrap();
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, [allMaster]);

  const allowedStatusesByType = {
    0: [0, 1, 2, 6], // OL
    1: [0, 1, 2], // Frame
    2: [0, 1, 2], // Accessory
    3: [0, 1, 2], // CL
  };

  const filteredProducts = localProductData?.filter((order) => {
    const { productType, orderMasterStatus, orderDetailStatus, stock } = order;
    if (orderMasterStatus !== 1) return false;
    const allowedStatuses = allowedStatusesByType[productType] || [];
    const isAllowedStatus = allowedStatuses.includes(orderDetailStatus);
    const hasStockInLocation = stock?.some(
      (s) => s.locationId === hasMultipleLocations[0] && s.quantity > 0
    );
    return isAllowedStatus && hasStockInLocation;
  });

  const handleEditStart = (order, field, index) => {
    console.log("editing starting at", field, index);
    setEditingOrderId(index);
    setEditingField(field);
    setEditValue(
      field === "sellingPrice"
        ? order.sellingPrice.toString()
        : order.toBillQty.toString()
    );
  };

  const handleEditChange = (e) => {
    const value = e.target.value;
    setEditValue(value);
    // Validate on change to provide immediate feedback
    if (value === "") {
      toast.error(
        `${
          editingField === "sellingPrice" ? "Selling Price" : "To Bill Qty"
        } cannot be empty`
      );
      return;
    }
    if (isNaN(value) || Number(value) < 0) {
      toast.error(
        editingField === "sellingPrice"
          ? "Selling Price must be a non-negative number"
          : "To Bill Qty must be a non-negative number"
      );
    }
  };

  const handleEditSave = (order, index) => {
    const value = editValue.trim();
    if (value === "" || isNaN(value)) {
      toast.error(
        editingField === "sellingPrice"
          ? "Selling Price must be a valid number"
          : "To Bill Qty must be a valid number"
      );
      return;
    }

    const numericValue = parseFloat(value);
    if (numericValue < 0) {
      toast.error(
        editingField === "sellingPrice"
          ? "Selling Price cannot be negative"
          : "To Bill Qty cannot be negative"
      );
      return;
    }

    if (editingField === "toBillQty") {
      const maxToBillQty =
        order.orderQty - order.billedQty - order.cancelledQty;
      if (numericValue > maxToBillQty) {
        toast.error(`To Bill Qty cannot exceed ${maxToBillQty}`);
        return;
      }
    }

    setLocalProductData((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [editingField]: numericValue,
              totalValue:
                (editingField === "sellingPrice"
                  ? numericValue
                  : item.sellingPrice) *
                (editingField === "toBillQty" ? numericValue : item.toBillQty),
            }
          : item
      )
    );

    setEditingOrderId(null);
    setEditingField(null);
    setEditValue("");
  };

  const getAvalQty = (order) => {
    if (order.productType === 0) {
      return order.pricing?.quantity;
    } else if (order.productType === 3) {
      const quantity = order.stock?.reduce(
        (sum, stockItem) => sum + (stockItem.quantity || 0),
        0
      );
      return quantity;
    } else {
      return 0;
    }
  };

  const handleKeyPress = (e, order, index) => {
    if (e.key === "Enter") {
      handleEditSave(order, index);
    }
  };

  const handleProductSelection = (order, index) => {
    setSelectedProducts((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      return [...prev, index];
    });
  };

  return (
    <div className="max-w-7xl">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          {!isNextClicked && (
            <div className="w-1/2">
              <Autocomplete
                options={contactResp?.data?.patients || []}
                getOptionLabel={(option) =>
                  `${option.CustomerName} ${option.MobNumber}`
                }
                value={
                  contactResp?.data?.patients.find(
                    (master) =>
                      master.CustomerMasterID ===
                      selectedPatient?.CustomerMasterID
                  ) || null
                }
                onChange={(_, newValue) => setSelectedPatient(newValue || null)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select by Customer name or mobile"
                    size="medium"
                  />
                )}
                isOptionEqualToValue={(option, value) =>
                  option.CustomerMasterID === value.CustomerMasterID
                }
                loading={isPatientLoading}
                fullWidth
              />
            </div>
          )}

          {isCustomerLoading && <Loader color="black" />}
          {!isNextClicked &&
            !isCustomerLoading &&
            selectedPatient &&
            customerData && (
              <div className="p-6 grid grid-cols-5 gap-4 text-sm">
                <div>
                  <strong>Patient Name:</strong> {selectedPatient.CustomerName}
                </div>
                <div>
                  <strong>Customer Name:</strong>
                  {customerData?.data?.data?.CustomerName}
                </div>
                <div>
                  <strong>Mobile Number:</strong>
                  {customerData?.data?.data?.MobNumber}
                </div>
                {customerData?.data?.data?.TAXRegisteration === 1 && (
                  <>
                    <div>
                      <strong>GST No:</strong> {customerData?.data?.data?.TAXNo}
                    </div>
                    <div>
                      <strong>Address:</strong>
                      {`${customerData?.data?.data.BillAddress1} ${customerData?.data?.data.BillAddress2} ${customerData?.data?.data.BillCity}`}
                    </div>
                  </>
                )}
                {customerData?.data?.data?.BillingMethod === 1 && (
                  <div>
                    <strong>Billing Method:</strong> Delivery Challan(DC)
                  </div>
                )}
                {customerData?.data?.data?.CreditBilling === 1 && (
                  <>
                    <div>
                      <strong>Credit Billing:</strong> Yes
                    </div>
                    <div>
                      <strong>Credit Limit Available:</strong>
                      {parseFloat(
                        customerData?.data?.data?.CreditLimit
                      ).toLocaleString()}
                    </div>
                  </>
                )}
                <div className="flex items-center gap-3 flex-grow col-span-2">
                  <label>Bill in the name:</label>
                  <div className="flex items-center gap-3">
                    <Radio
                      name="bill"
                      label="Patient Name"
                      value="0"
                      checked={billInTheName === 0}
                      onChange={() => setBillInTheName(0)}
                    />
                    <Radio
                      name="bill"
                      label="Customer Name"
                      value="1"
                      checked={billInTheName === 1}
                      onChange={() => setBillInTheName(1)}
                    />
                  </div>
                </div>
              </div>
            )}

          {selectedPatient && !isNextClicked && !isCustomerLoading && (
            <div className="flex justify-end">
              <Button onClick={() => setIsNextClicked(true)}>
                Select & Next
              </Button>
            </div>
          )}

          {isNextClicked && (
            <div>
              <div className="flex justify-between items-center mb-10">
                <div className="grid grid-cols-5 gap-4 text-sm">
                  <div>
                    <strong>Patient Name:</strong>
                    {selectedPatient?.CustomerName}
                  </div>
                  <div>
                    <strong>Customer Name:</strong>
                    {customerData?.data?.data?.CustomerName}
                  </div>
                  <div>
                    <strong>Mobile Number:</strong> {selectedPatient?.MobNumber}
                  </div>
                </div>
                <Button
                  onClick={() => setIsNextClicked(false)}
                  variant="outline"
                >
                  Back
                </Button>
              </div>
              <Table
                columns={[
                  "Select",
                  "S.NO",
                  "Order No.",
                  "Product Type",
                  "Product Details",
                  "SRP",
                  "Selling Price",
                  "Order Qty",
                  "To Bill Qty",
                  "Avl Qty",
                  "Total Amount",
                  "Advance",
                  "Balance",
                  "Action",
                ]}
                freeze={true}
                data={localProductData}
                renderRow={(order, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(index)}
                        onChange={() => handleProductSelection(order, index)}
                        className="h-5 w-5"
                      />
                    </TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{`${order.orderPrefix}/${order.orderNo}/${order.slNo}`}</TableCell>
                    <TableCell>{getShortTypeName(order.productType)}</TableCell>
                    <TableCell>
                      <div
                        className="text-[13px]"
                        style={{
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                        }}
                      >
                        {getProductName(order)}
                      </div>
                    </TableCell>
                    <TableCell>{formatINR(order.pricing?.mrp) || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingOrderId === index &&
                        editingField === "sellingPrice" ? (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editValue}
                            onChange={handleEditChange}
                            onBlur={() => handleEditSave(order, index)}
                            onKeyPress={(e) => handleKeyPress(e, order, index)}
                            className="w-20 p-1 border rounded"
                            autoFocus
                          />
                        ) : (
                          <>
                            <span>{formatINR(order.sellingPrice) || 0}</span>
                            {companySettings?.data?.data?.EditInvoicePrice ===
                              1 && (
                              <FiEdit
                                className="cursor-pointer text-gray-600"
                                onClick={() =>
                                  handleEditStart(order, "sellingPrice", index)
                                }
                              />
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-[12px]">
                      {order.orderQty}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingOrderId === index &&
                        editingField === "toBillQty" ? (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={editValue}
                            onChange={handleEditChange}
                            onBlur={() => handleEditSave(order, index)}
                            onKeyPress={(e) => handleKeyPress(e, order, index)}
                            className="w-20 p-1 border rounded"
                            autoFocus
                          />
                        ) : (
                          <>
                            <span>{order.toBillQty}</span>
                            <FiEdit
                              className="cursor-pointer text-gray-600"
                              onClick={() =>
                                handleEditStart(order, "toBillQty", index)
                              }
                            />
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getAvalQty(order)}</TableCell>
                    <TableCell>
                      {formatINR(order.toBillQty * order.sellingPrice)}
                    </TableCell>
                    <TableCell>{formatINR(order.advanceAmount) || 0}</TableCell>
                    <TableCell>
                      {formatINR(
                        order.toBillQty * order.sellingPrice -
                          (order.advanceAmount || 0),
                        true
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => {
                          setIsBatchCodeOpen(true);
                          setSelectedOrderForBatch({ ...order, index });
                          getBatches({
                            clBatchId: order.cLDetailId,
                            locationId: hasMultipleLocations[0],
                          });
                        }}
                      >
                        Add Batch Code
                      </button>
                    </TableCell>
                  </TableRow>
                )}
                emptyMessage={`${
                  isProductDataLoading ? "Loading..." : "No data found"
                }`}
              />
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => {
                    // Add your invoice generation logic here using selectedProducts
                    console.log("Selected products for invoicing:", selectedProducts.map(i => localProductData[i]));
                  }}
                  disabled={selectedProducts.length === 0}
                >
                  Generate Invoice
                </Button>
              </div>
            </div>
          )}

          <BatchCode
            isOpen={isBatchCodeOpen}
            onClose={() => {
              setIsBatchCodeOpen(false);
              setSelectedOrderForBatch(null);
            }}
            batchDetails={batchDetails}
            selectedOrder={selectedOrderForBatch}
            updateProductBatchData={(index, newBatchData) => {
              setLocalProductData((prev) =>
                prev.map((item, idx) =>
                  idx === index ? { ...item, batchData: newBatchData } : item
                )
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerSelect;

const BatchCode = ({ isOpen, onClose, batchDetails, selectedOrder, updateProductBatchData }) => {
  const [batchData, setBatchData] = useState({
    isBatchSelectorEnter: 0,
    batchCode: null,
    barcode: null,
    expiryDate: null,
    avlQty: null,
    toBillQty: 1,
    batchData: [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBatchData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveBatch = () => {
    const {
      batchCode,
      expiryDate,
      toBillQty,
      avlQty,
      barcode,
      batchData: existingData,
    } = batchData;

    // Validation: To Bill Qty <= Available Qty
    if (Number(toBillQty) > Number(avlQty)) {
      toast.error("To Bill Qty cannot be greater than Available Qty");
      return;
    }

    // Validation: Prevent duplicate batchCode
    const isDuplicate = existingData.some(
      (item) => item.batchCode === batchCode
    );
    if (isDuplicate) {
      toast.error("Same Batchcode cannot be added again");
      return;
    }

    // Add batch and reset relevant fields
    setBatchData((prev) => ({
      ...prev,
      batchData: [
        ...prev.batchData,
        { batchCode, expiryDate, toBillQty, barcode },
      ],
      barcode: null,
      batchCode: null,
      expiryDate: null,
      avlQty: null,
      toBillQty: 1,
    }));
  };

  const handleSaveFinalBatch = () => {
    const totalBatchQty = batchData.batchData.reduce(
      (sum, item) => sum + Number(item.toBillQty),
      0
    );
    
    if (totalBatchQty >= selectedOrder?.toBillQty) {
      toast.error(
        `Total batch quantity (${totalBatchQty}) cannot exceed product's To Bill Qty (${selectedOrder?.toBillQty})`
      );
      return;
    }

    // Update the product's batchData
    updateProductBatchData(selectedOrder?.index, batchData.batchData);

    // Here you would typically make an API call to save the batch data
    // For example:
    // await saveBatchData({
    //   orderId: selectedOrder?.id,
    //   batchData: batchData.batchData,
    //   locationId: hasMultipleLocations[0],
    // });

    toast.success("Batch codes saved successfully");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Radio
            label="Select Batch Code"
            name="isBatchSelectorEnter"
            value="0"
            checked={batchData.isBatchSelectorEnter == 0}
            onChange={handleChange}
          />
          <Radio
            label="Enter BatchBar Code"
            name="isBatchSelectorEnter"
            value="1"
            checked={batchData.isBatchSelectorEnter == 1}
            onChange={handleChange}
          />
        </div>

        <div className="w-1/2">
          <Autocomplete
            value={
              batchDetails?.data?.batches?.find(
                (item) => item.CLBatchBarCode === batchData.barcode
              ) || null
            }
            options={batchDetails?.data?.batches || []}
            getOptionLabel={(option) => option.CLBatchBarCode || ""}
            onChange={(_, newValue) =>
              setBatchData((prev) => ({
                ...prev,
                barcode: newValue?.CLBatchBarCode || null,
                batchCode: newValue?.CLBatchCode || null,
                expiryDate: newValue?.ExpiryDate || null,
                avlQty: newValue?.Quantity || null,
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select Batch Code"
                size="small"
              />
            )}
            isOptionEqualToValue={(item, value) =>
              item.CLBatchBarCode === value.CLBatchBarCode
            }
            fullWidth
          />
        </div>

        {batchData.barcode && (
          <>
            <div>
              <Input
                label="Expiry date"
                value={
                  batchData.expiryDate
                    ? batchData.expiryDate.split("-").reverse().join("/")
                    : ""
                }
                disabled
              />
            </div>

            <div className="flex items-center gap-4">
              <Input
                label="Avl. Qty"
                value={batchData.avlQty || ""}
                placeholder="Avl Qty"
                disabled
              />
              <Input
                label="To Bill Qty"
                type="number"
                value={batchData.toBillQty}
                onChange={(e) =>
                  setBatchData((prev) => ({
                    ...prev,
                    toBillQty: e.target.value,
                  }))
                }
              />
              <Button onClick={handleSaveBatch}>Save</Button>
            </div>

            <div>
              <Table
                columns={["batch code", "expiry date", "to bill qty", "action"]}
                data={batchData.batchData}
                renderRow={(row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.batchCode}</TableCell>
                    <TableCell>{row.expiryDate}</TableCell>
                    <TableCell>{row.toBillQty}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setBatchData((prev) => ({
                            ...prev,
                            batchData: prev.batchData.filter(
                              (_, i) => i !== index
                            ),
                          }))
                        }
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveFinalBatch}>Submit</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};