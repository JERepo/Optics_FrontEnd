import React, { useEffect, useState } from "react";
import { FiArrowLeft, FiCheck, FiX, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useOrder } from "../../../features/OrderContext";
import Button from "../../../components/ui/Button";
import { Autocomplete, TableCell, TextField } from "@mui/material";
import {
  useGetOlSupplierNoQuery,
  useSavePurchaseReturnProductMutation,
} from "../../../api/purchaseReturn";
import { useSelector } from "react-redux";
import Input from "../../../components/Form/Input";
import toast from "react-hot-toast";
import { formatINR } from "../../../utils/formatINR";
import { Table, TableRow } from "../../../components/Table";

const getProductName = (order) => {
  const {
    productType,
    ProductType,
    productDetails,
    fittingPrice,
    fittingGSTPercentage,
    batchCode,
    expiry,
    Spherical,
    Cylinder,
    Diameter,
    AddOnData,
    returnFittingPrice
  } = order;

  const detail = Array.isArray(productDetails)
    ? productDetails[0]
    : productDetails?.ProductDetails;

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

  // Ophthalmic Lenses (order.ProductType 0)
  if (order.ProductType === 0) {
    const olLine = clean(detail.productName);
    // AddOns
    const addonNames = Array.isArray(AddOnData)
      ? AddOnData?.map((item) => clean(item.name?.split(" - ₹")[0])).filter(
          Boolean
        )
      : Array.isArray(detail.addOn)
      ? detail.addOn?.map((item) => clean(item.addOnName)).filter(Boolean)
      : "";

    const singlePower = detail?.Specs;

    const singlePowerData = joinNonEmpty([
      cleanPower(singlePower?.Spherical) && `SPH: ${singlePower?.Spherical},`,
      cleanPower(singlePower?.Cylinder) && `Cyl: ${singlePower?.Cylinder},`,
      cleanPower(singlePower?.Diameter) && `Dia: ${singlePower?.Diameter}`,
    ]);

    let fittingLine = "";
    const fitPrice = parseFloat(returnFittingPrice);
    const gstPerc = parseFloat(fittingGSTPercentage);
    if (!isNaN(fitPrice) && !isNaN(gstPerc) && fitPrice > 0) {
      fittingLine = `Fitting Price: ₹${(fitPrice * (1 + gstPerc / 100)).toFixed(
        2
      )}`;
    }

    return joinNonEmpty(
      [
        olLine && olLine,
        singlePowerData,
        fittingLine,
        addonNames && `AddOn: ${addonNames}`,
        clean(detail.HSN) && `HSN: ${clean(detail.HSN)}`,
      ],
      "\n"
    );
  }

  return "";
};

const OpticalLens = () => {
  const {
    selectedPurchaseProduct,
    prevPurchaseStep,
    goToPurchaseStep,
    customerPurchase,
    purchaseDraftData,
    currentPurchaseStep,
  } = useOrder();
  const { user, hasMultipleLocations } = useSelector((state) => state.auth);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [editMode, setEditMode] = useState({});
  const [items, setItems] = useState([]);
  const [lensData, setLensData] = useState({
    supplier: null,
    returnProductPrice: "",
    returnFittingPrice: "",
    returnQty: "",
  });

  const { data: supplerNo, isLoading: isNumsLoading } = useGetOlSupplierNoQuery(
    {
      vendorId: customerPurchase?.customerData?.Id,
      companyId: parseInt(hasMultipleLocations[0]),
    }
  );
  const [savePR, { isLoading: isPurchaseReturnLoading }] =
    useSavePurchaseReturnProductMutation();

  useEffect(() => {
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      items.forEach((item, index) => {
        if (!newEditMode[index]) {
          newEditMode[index] = {
            BuyingPrice: false,
            qty: false,
            originalPrice: item.returnPrice,
            originalQty: item.returnQty,
          };
        }
      });
      return newEditMode;
    });
  }, [items]);

  const toggleEditMode = (index, field, action = "toggle") => {
    setEditMode((prev) => {
      const currentMode = prev[index]?.[field];
      const item = items[index];

      if (field === "BuyingPrice" && !currentMode) {
        return {
          ...prev,
          [index]: {
            ...prev[index],
            [field]: !currentMode,
            originalPrice: item.returnPrice,
          },
        };
      }

      if (field === "qty" && !currentMode) {
        return {
          ...prev,
          [index]: {
            ...prev[index],
            [field]: !currentMode,
            originalQty: item.returnQty,
          },
        };
      }

      if (currentMode && action === "cancel") {
        if (field === "BuyingPrice") {
          setItems((prevItems) =>
            prevItems.map((i, idx) =>
              idx === index
                ? { ...i, returnPrice: prev[index].originalPrice }
                : i
            )
          );
        } else if (field === "qty") {
          setItems((prevItems) =>
            prevItems.map((i, idx) =>
              idx === index ? { ...i, returnQty: prev[index].originalQty } : i
            )
          );
        }
      }

      return {
        ...prev,
        [index]: {
          ...prev[index],
          [field]: !currentMode,
          originalPrice: prev[index]?.originalPrice,
          originalQty: prev[index]?.originalQty,
        },
      };
    });
  };

  const handleQtyChange = (barcode, qty, index) => {
    const newQty = Number(qty);
    const avlQty = Number(items[index].GRNQty);
    if (newQty > avlQty) {
      toast.error("Return quantity cannot exceed available quantity!");
      return;
    }
    // if (newQty <= 0) {
    //   toast.error("Return quantity must be greater than 0!");
    //   return;
    // }
    setItems((prev) =>
      prev.map((i, idx) => (idx === index ? { ...i, returnQty: newQty } : i))
    );
  };

  const handleSellingPriceChange = (barcode, price, index) => {
    const newPrice = Number(price);
    const item = items[index];
    if (newPrice > item.GRNPrice) {
      toast.error("Return price cannot exceed GRN price!");
      return;
    }
    if (newPrice < 0) {
      toast.error("Return price cannot be negative!");
      return;
    }
    setItems((prev) =>
      prev.map((i, idx) =>
        idx === index ? { ...i, returnPrice: newPrice } : i
      )
    );
  };
const formatProductDetails = (product) => {
  if (!product) return "";

  const clean = (val) => (val ? String(val).trim() : "");
  const formatPowerValue = (v) => (v ? `${v}` : "");

  const productName = clean(product.productName);
  const brandName = clean(product.brandName);
  const colour = clean(product.colour);
  const barcode = clean(product.barcode);
  const hsn = clean(product.HSN);

  const specs = product.Specs
    ? [
        product.Specs.Spherical
          ? `Sph: ${formatPowerValue(product.Specs.Spherical)}`
          : "",
        product.Specs.Cylinder
          ? `Cyl: ${formatPowerValue(product.Specs.Cylinder)}`
          : "",
        product.Specs.Diameter
          ? `Dia: ${formatPowerValue(product.Specs.Diameter)}`
          : "",
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const stock = product.Stock || {};
  const batchCode = clean(stock.BatchCode);
  const expiry = clean(stock.Expiry);

  // Build final one-line string
  return [
    productName,
    specs,
    barcode && `Barcode: ${barcode}`,
    batchCode && `Batch: ${batchCode}`,
    expiry && `Expiry: ${expiry}`,
    hsn && `HSN: ${hsn}`,
  ]
    .filter(Boolean)
    .join("  ");
};

  const handleDelete = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      delete newEditMode[index];
      return newEditMode;
    });
  };

  const handleAddItem = () => {
    if (!selectedVendor) {
      toast.error("Please select a supplier order number!");
      return;
    }
    if (!lensData.returnProductPrice || !lensData.returnQty) {
      toast.error("Please enter return product price and quantity!");
      return;
    }

    const exist = items.find(
      (item) => item.VendorOrderNo == selectedVendor?.VendorOrderNo
    );
    if (exist) {
      toast.error("Item already exist!");
      return;
    }
    const returnPrice = Number(lensData.returnProductPrice);
    const returnQty = Number(lensData.returnQty);
    const returnFittingPrice = Number(lensData.returnFittingPrice) || 0;

    if (returnPrice > selectedVendor.GRNPrice) {
      toast.error("Return product price cannot exceed GRN price!");
      return;
    }
    if (returnQty > selectedVendor.GRNQty) {
      toast.error("Return quantity cannot exceed available quantity!");
      return;
    }
    if (returnPrice < 0 || returnQty <= 0 || returnFittingPrice < 0) {
      toast.error("Return price and quantity must be valid numbers!");
      return;
    }

    const newItem = {
      ...selectedVendor,
      returnPrice,
      returnQty,
      returnFittingPrice,
      ProductType: 0,
      fittingPrice: selectedVendor.FittingPrice || 0,
      fittingGSTPercentage: selectedVendor.FittingGSTPercentage || 0,
      TaxPercent: selectedVendor.TaxPercent || 0,
    };

    setItems((prev) => [...prev, newItem]);
    // Reset form
    setLensData({
      supplier: null,
      returnProductPrice: "",
      returnFittingPrice: "",
      returnQty: "",
    });
    setSelectedVendor(null);
  };
  const handleSaveData = async () => {
    if (!Array.isArray(items) || items.length === 0) {
      console.warn("No details to save");
      return;
    }
    console.log("items", items);
    try {
      const payload = {
        products: items.map((item) => {
          return {
            PRMainId: purchaseDraftData.Id,
            ProductType: 0,
            FrameDetailId: null,
            AccessoryDetailId: null,
            ContactLensDetailId: null,
            OpticalLensDetailId: item.OpticalLensDetailId ?? null,
            BatchCode: null,
            DNQty: item.returnQty,
            DNPrice: parseFloat(item.returnPrice),
            ProductTaxPercentage: parseFloat(item.TaxPercent),
            VendorOrderNo:item.VendorOrderNo,
            FittingReturnPrice :item.returnFittingPrice,
            FittingTaxPercentage :parseFloat(item.fittingGSTPercentage),
            ApplicationUserId: user.Id,
          };
        }),
      };
      console.log(payload);
      await savePR({ payload }).unwrap();
      toast.success("Optical lens Purchase return successfully added!");
      goToPurchaseStep(4);
    } catch (error) {
      toast.error(error?.data.error);
    }
  };

  console.log(selectedVendor,lensData)
  return (
    <div>
      <div className="max-w-8xl h-auto">
        <div className="bg-white rounded-xl shadow-sm p-2">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Step {currentPurchaseStep}: {selectedPurchaseProduct.label}
                </h1>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => prevPurchaseStep()}
                  icon={FiArrowLeft}
                  variant="outline"
                >
                  Back
                </Button>
                <Button>Refresh</Button>
              </div>
            </div>

            <div>
              {items.length > 0 && (
                <div className="my-5">
                  <Table
                    columns={[
                      "S.No",
                      "Product Type",
                      "Supplier Order No",
                      "Product Details",
                      "SRP",
                      "Return Qty",
                      "Return Product Price",
                      "GST/Unit",
                      "Total Price",
                      "Action",
                    ]}
                    data={items || []}
                    renderRow={(item, index) => (
                      <TableRow key={`${item.Barcode}-${index}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>OL</TableCell>
                        <TableCell>{item.VendorOrderNo}</TableCell>
                        <TableCell className="whitespace-pre-wrap">
                          {getProductName(item)}
                        </TableCell>
                        <TableCell>₹0</TableCell>
                        <TableCell>
                          {editMode[index]?.qty ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={item.returnQty}
                                onChange={(e) =>
                                  handleQtyChange(
                                    item.Barcode,
                                    e.target.value,
                                    index
                                  )
                                }
                                className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                min="1"
                              />
                              <button
                                onClick={() =>
                                  toggleEditMode(index, "qty", "save")
                                }
                                className="text-neutral-400 transition"
                                title="Save"
                              >
                                <FiCheck size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  toggleEditMode(index, "qty", "cancel")
                                }
                                className="text-neutral-400 transition"
                                title="Cancel"
                              >
                                <FiX size={18} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {item.returnQty}
                              <button
                                onClick={() => toggleEditMode(index, "qty")}
                                className="text-neutral-400 transition"
                                title="Edit Quantity"
                              >
                                <FiEdit2 size={14} />
                              </button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editMode[index]?.BuyingPrice ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={item.returnPrice || ""}
                                onChange={(e) =>
                                  handleSellingPriceChange(
                                    item.Barcode,
                                    e.target.value,
                                    index
                                  )
                                }
                                className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                placeholder="Enter price"
                              />
                              <button
                                onClick={() =>
                                  toggleEditMode(index, "BuyingPrice", "save")
                                }
                                className="text-neutral-400 transition"
                                title="Save"
                              >
                                <FiCheck size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  toggleEditMode(index, "BuyingPrice", "cancel")
                                }
                                className="text-neutral-400 transition"
                                title="Cancel"
                              >
                                <FiX size={18} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              ₹{formatINR(item.returnPrice)}
                              <button
                                onClick={() =>
                                  toggleEditMode(index, "BuyingPrice")
                                }
                                className="text-neutral-400 transition"
                                title="Edit Price"
                              >
                                <FiEdit2 size={14} />
                              </button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          ₹
                          {formatINR(
                            (item.returnPrice * (item.TaxPercent / 100)) 
                          )}
                        </TableCell>
                        <TableCell>
                          ₹
                          {formatINR(
                            item.returnQty *
                              (item.returnPrice +
                                (item.returnPrice * item.TaxPercent) / 100)
                          )}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleDelete(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 />
                          </button>
                        </TableCell>
                      </TableRow>
                    )}
                  />
                </div>
              )}
            </div>
            {items.length > 0 && (
              <div className="flex justify-end mt-6">
                <Button
                  type="submit"
                  isLoading={isPurchaseReturnLoading}
                  disabled={isPurchaseReturnLoading}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700"
                  onClick={handleSaveData}
                >
                  Save & Continue
                </Button>
              </div>
            )}
            <div>
              <div className="my-5">
                <Autocomplete
                  options={supplerNo?.data?.data || []}
                  getOptionLabel={(option) => option.VendorOrderNo || ""}
                  value={
                    supplerNo?.data?.data.find(
                      (brand) => brand.Id === lensData.supplier
                    ) || null
                  }
                  onChange={(_, newValue) => {
                    setLensData((prev) => ({
                      ...prev,
                      supplier: newValue?.Id,
                      returnProductPrice: newValue?.GRNPrice || "",
                      returnFittingPrice: newValue?.FittingPrice || "0",
                      returnQty: newValue?.GRNQty || "",
                    }));
                    setSelectedVendor(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Supplier Order No"
                      placeholder="Search or select Supplier Order No"
                      size="small"
                    />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.Id === value.Id
                  }
                  loading={isNumsLoading}
                />
              </div>
              {selectedVendor && 
              <div className="grid grid-cols-3 gap-5 my-5">
                <Input
                  className="col-span-3"
                  label="Product Name"
                  value={formatProductDetails(selectedVendor?.productDetails?.ProductDetails) || ""}
                  readOnly
                  disabled
                />
                <Input
                  label="Total Product Price"
                  value={(selectedVendor?.GRNPrice * selectedVendor.GRNQty) || ""}
                  readOnly
                  disabled
                />
                <Input
                  label="Total Fitting Price"
                  value={selectedVendor?.FittingPrice || 0}
                  readOnly
                  disabled
                />
                <Input
                  label="Total Qty"
                  value={selectedVendor?.GRNQty || ""}
                  readOnly
                  disabled
                />
                <Input
                  label="Return Product Price"
                  value={lensData.returnProductPrice * lensData.returnQty }
                  onChange={(e) =>
                    setLensData((prev) => ({
                      ...prev,
                      returnProductPrice: e.target.value,
                    }))
                  }
                  type="number"
                />
                <Input
                  label="Return Fitting Price"
                  value={lensData.returnFittingPrice}
                  onChange={(e) =>
                    setLensData((prev) => ({
                      ...prev,
                      returnFittingPrice: e.target.value,
                    }))
                  }
                  type="number"
                />
                <Input
                  label="Return Qty"
                  value={lensData.returnQty}
                  onChange={(e) =>
                    setLensData((prev) => ({
                      ...prev,
                      returnQty: e.target.value,
                    }))
                  }
                  type="number"
                />
                <Input
                  label="Return Product GST"
                  value={
                    selectedVendor
                      ? (
                          (parseFloat(lensData.returnProductPrice || 0) * parseInt(lensData.returnQty)) *
                          (parseFloat(selectedVendor?.TaxPercent || 0) / 100)
                        ).toFixed(2)
                      : 0
                  }
                  readOnly
                  disabled
                />
                <Input
                  label="Return Fitting GST"
                  value={
                    selectedVendor
                      ? (
                          parseFloat(lensData.returnFittingPrice || 0) *
                          (parseFloat(selectedVendor?.FittingGSTPercentage) /
                            100)
                        ).toFixed(2)
                      : ""
                  }
                  readOnly
                  disabled
                />
              </div>}
             {selectedVendor && <Button onClick={handleAddItem}>Add</Button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpticalLens;
