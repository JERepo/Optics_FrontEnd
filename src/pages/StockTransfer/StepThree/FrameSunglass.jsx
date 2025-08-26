import React, { useState, useEffect } from "react";
import { useOrder } from "../../../features/OrderContext";
import {
  FiArrowLeft,
  FiPlus,
  FiSearch,
  FiX,
  FiTrash2,
  FiEdit,
  FiCheck,
  FiEdit2,
} from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { useGetAllBrandsQuery } from "../../../api/brandsApi";
import {
  useLazyGetByBarCodeQuery,
  useLazyGetByBrandAndModalQuery,
  useSaveFrameMutation,
} from "../../../api/orderApi";
import toast from "react-hot-toast";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import { Autocomplete, TextField } from "@mui/material";
import Radio from "../../../components/Form/Radio";

import { useSelector } from "react-redux";
import { formatINR } from "../../../utils/formatINR";
import { useSaveStockDetailsMutation } from "../../../api/stockTransfer";
import {
  validateQuantity,
  validateStockQty,
} from "../../../utils/isValidNumericInput";

const getProductDetailsText = (order) => {
  const {
    productName,
    BrandName,

    HSN,
    hSN,
    barcode,
    color,
    Barcode,
    ProductType,
    Colour,
    brandName,
    size,
    category,
  } = order;

  const clean = (val) => {
    if (
      val === null ||
      val === undefined ||
      val === "undefined" ||
      val === "null" ||
      val === "N/A" ||
      val === "" ||
      val === 0
    ) {
      return "";
    }
    return String(val).trim();
  };

  const brand = clean(brandName || BrandName);
  const name = clean(productName);
  const hsn = clean(HSN || hSN);
  const barcodeVal = clean(Barcode || barcode);
  const clr = clean(Colour || color);
  const sizeVal = clean(size);

  // map category
  const getCategoryName = (cat) => {
    if (cat === 0 || cat === "0") return "Optical Frame";
    if (cat === 1 || cat === "1") return "Sunglass";
    return "";
  };

  return [
    brand && name ? `Brand: ${brand} - ${name}` : brand || name,
    hsn && `HSN: ${hsn}`,
    sizeVal && `Size: ${sizeVal}`,
    getCategoryName(category) && `Category: ${getCategoryName(category)}`,
    clr && `Color: ${clr}`,
    barcodeVal && `Barcode: ${barcodeVal}`,
  ]
    .filter(Boolean)
    .join("\n");
};

const FrameSunglass = () => {
  const {
    selectedStockProduct,
    prevStockStep,
    goToStockStep,
    stockDraftData,
    customerStock,
    calculateGST,
    currentStockStep,
  } = useOrder();
  const { user } = useSelector((state) => state.auth);
  const [barcode, setBarcode] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [brandInput, setBrandInput] = useState("");
  const [brandId, setBrandId] = useState(null);
  const [modelNo, setModelNo] = useState(null);
  const [items, setItems] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [warningPayload, setWarningPayload] = useState(null);
  const [singleOrCombine, setSingleOrCombine] = useState(0);
  const [editMode, setEditMode] = useState({}); // { [barcode-index]: { sellingPrice: false, qty: false } }

  const { data: allBrands } = useGetAllBrandsQuery();
  const [
    fetchByBarcode,
    {
      data: barCodeData,
      isLoading: isBarcodeLoading,
      isFetching: isBarCodeFetching,
    },
  ] = useLazyGetByBarCodeQuery();
  const [
    fetchByBrandModal,
    { isLoading: isBrandModelLoading, isFetching: isBrandAndModalFetching },
  ] = useLazyGetByBrandAndModalQuery();
  const [saveFrame, { isLoading: isFrameSaving }] = useSaveFrameMutation();
  const [saveStockTransfer, { isLoading: isStockTransferLoading }] =
    useSaveStockDetailsMutation();

  useEffect(() => {
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      items.forEach((item, index) => {
        const key = `${item.Barcode}-${index}`;
        if (!newEditMode[key]) {
          newEditMode[key] = {
            BuyingPrice: false,
            qty: false,
            originalPrice: item.BuyingPrice,
            originalQty: item.stkQty, // Store original quantity
          };
        }
      });
      return newEditMode;
    });
  }, [items]);

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode) return;
    try {
      const res = await fetchByBarcode({
        barcode,
        locationId: customerStock.locationId,
      }).unwrap();
      const data = res?.data;
      if (data && validateQuantity(data)) {
        setItems((prev) => {
          if (singleOrCombine === 1) {
            return [{ ...data, stkQty: 1 }, ...prev];
          } else {
            // Combine Entry: Increment stkQty or add new item
            const index = prev.findIndex((i) => i.Barcode === data.Barcode);
            if (index !== -1) {
              const newStkQty = Number(prev[index].stkQty) + 1;
              const qty = Number(prev[index].Quantity);
              return prev.map((item, idx) =>
                idx === index
                  ? {
                      ...item,
                      stkQty: newStkQty,
                      Quantity: qty + data.Quantity,
                    }
                  : item
              );
            } else {
              return [{ ...data, stkQty: 1 }, ...prev];
            }
          }
        });
        setBarcode("");
      }
    } catch (error) {
      toast.error("Product does not exist");
      setBarcode("");
    }
  };

  const handleBrandModelSubmit = async (e) => {
    e.preventDefault();
    if (!brandId) return;

    try {
      const res = await fetchByBrandModal({
        brand: brandId,
        modal: modelNo,
        locationId: customerStock.locationId,
      }).unwrap();

      const data = res?.data;

      if (data && data.length > 0) {
        setSearchResults(data);
        setBrandInput("");
        setBrandId(null);
        setModelNo("");
        setSearchMode(false);
      } else {
        toast.error(res?.data?.message || "No matching product found");
        setBrandInput("");
        setBrandId(null);
        setModelNo("");
        setSearchMode(false);
      }
    } catch (err) {
      const msg = err?.data?.message || err?.error || "Product does not exist";
      toast.error(msg);
      setBrandInput("");
      setBrandId(null);
      setModelNo("");
      setSearchMode(false);
    }
  };

  const handleRefresh = () => {
    setSearchMode(false);
    setItems([]);
    setBarcode("");
    setBrandInput("");
    setBrandId(null);
    setModelNo("");
    setSearchResults([]);
    setSelectedRows([]);
    setEditMode({});
  };

  const handleCheckboxChange = (item) => {
    const exists = selectedRows.find((i) => i.Barcode === item.Barcode);
    if (exists) {
      setSelectedRows((prev) => prev.filter((i) => i.Barcode !== item.Barcode));
    } else {
      setSelectedRows((prev) => [...prev, item]);
    }
  };

  const handleAddSelectedItems = () => {
    setItems((prev) => {
      let updated = [...prev];
      selectedRows.forEach((selected) => {
        if (!validateQuantity(selected)) return;
        if (singleOrCombine === 1) {
          // Separate Entry: Add new item with stkQty: 1
          updated = [{ ...selected, stkQty: 1 }, ...updated];
        } else {
          // Combine Entry: Increment stkQty or add new item
          const index = updated.findIndex(
            (i) => i.Barcode === selected.Barcode
          );
          if (index !== -1) {
            const newStkQty = Number(updated[index].stkQty) + 1;
            const qty = Number(prev[index].Quantity);
            if (!validateStockQty(updated[index], newStkQty)) {
              return; // Skip this item if stkQty exceeds AvlQty
            }
            updated = updated.map((item, idx) =>
              idx === index
                ? { ...item, stkQty: newStkQty, Quantity: qty + index.Quantity }
                : item
            );
          } else {
            updated = [{ ...selected, stkQty: 1 }, ...updated];
          }
        }
      });
      return updated;
    });
    setSelectedRows([]);
    setSearchResults([]);
  };

  const handleQtyChange = (barcode, qty, index) => {
    const newQty = Number(qty);
    const avlQty = Number(items[index].Quantity);
    if (newQty > avlQty) {
      toast.error("Stock quantity cannot exceed available quantity!");
      return;
    }
    if (newQty < 0) {
      toast.error("Stock quantity must be greater than 0!");
      return;
    }
    setItems((prev) =>
      prev.map((i, idx) =>
        i.Barcode === barcode && idx === index ? { ...i, stkQty: newQty } : i
      )
    );
  };

  const handleDelete = (id, index) => {
    setItems((prev) =>
      prev.filter((i, idx) => !(i.Barcode === id && idx === index))
    );
    setSelectedRows((prev) => prev.filter((i) => i.Barcode !== id));
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      delete newEditMode[`${id}-${index}`];
      return newEditMode;
    });
  };

  const toggleEditMode = (id, index, field, action = "toggle") => {
    setEditMode((prev) => {
      const key = `${id}-${index}`;
      const currentMode = prev[key]?.[field];
      const item = items.find((i, idx) => i.Barcode === id && idx === index);

      if (field === "BuyingPrice" && !currentMode) {
        return {
          ...prev,
          [key]: {
            ...prev[key],
            [field]: !currentMode,
            originalPrice: item.BuyingPrice,
          },
        };
      }

      if (field === "qty" && !currentMode) {
        return {
          ...prev,
          [key]: {
            ...prev[key],
            [field]: !currentMode,
            originalQty: item.stkQty, // Store original quantity
          },
        };
      }

      if (currentMode && action === "cancel") {
        if (field === "BuyingPrice") {
          setItems((prevItems) =>
            prevItems.map((i, idx) =>
              i.Barcode === id && idx === index
                ? { ...i, BuyingPrice: prev[key].originalPrice }
                : i
            )
          );
        } else if (field === "qty") {
          setItems((prevItems) =>
            prevItems.map((i, idx) =>
              i.Barcode === id && idx === index
                ? { ...i, stkQty: prev[key].originalQty }
                : i
            )
          );
        }
      }

      return {
        ...prev,
        [key]: {
          ...prev[key],
          [field]: !currentMode,
          originalPrice: prev[key]?.originalPrice,
          originalQty: prev[key]?.originalQty,
        },
      };
    });
  };

  const handleConfirmBypassWarnings = async () => {
    if (!warningPayload) return;
    const newPayload = {
      products: items.map((item) => ({
        frameDetailId: item.Id,
        qty: item.Quantity,
        PatientID: customerStock.patientId,
        locationId: customerStock.locationId,
        bypassWarnings: true,
      })),
    };
    try {
      await saveFrame({
        orderId: customerStock.orderId,
        payload: newPayload,
      }).unwrap();
      toast.success("Frames saved with warnings bypassed.");
      setShowConfirmModal(false);
      goToStockStep(4);
    } catch (err) {
      setShowConfirmModal(false);
      toast.error("Failed to save after confirming warnings.");
    }
  };

  const calculateStockGST = (item) => {
    if (!item) return 0;
    if (customerStock.inState === 0) {
      const detail = item.Tax.Details[0];
      return { gstAmount: 0, slabNo: detail.Id, gstPercent: 0 }; // no GST for out of state
    }

    const tax = item.Tax;
    if (!tax || !Array.isArray(tax.Details)) {
      return { gstAmount: 0, slabNo: null, gstPercent: 0 };
    }

    const transferPrice = parseFloat(item.BuyingPrice) || 0;

    if (tax.Details.length === 1) {
      const detail = tax.Details[0];
      const taxPercent = parseFloat(detail.PurTaxPerct) || 0;
      // return transferPrice * (taxPercent / 100);
      const gstAmount = transferPrice * (taxPercent / 100);
      return {
        gstAmount,
        slabNo: detail.Id,
        gstPercent: taxPercent,
      };
    }

    for (let i = 0; i < tax.Details.length; i++) {
      const detail = tax.Details[i];
      const slabEnd = parseFloat(detail.SlabEnd);
      const salesTax = parseFloat(detail.SalesTaxPerct) || 0;

      if (isNaN(slabEnd)) continue;

      // Adjusted slabEnd = SlabEnd / (1 + SalesTax%)
      const newSlabEnd = slabEnd / (1 + salesTax / 100);

      if (transferPrice <= newSlabEnd) {
        const taxPercent = parseFloat(detail.PurTaxPerct) || 0;
        const gstAmount = transferPrice * (taxPercent / 100);
        return {
          gstAmount,
          slabNo: detail.Id || i + 1,
          gstPercent: taxPercent,
        };
      }
    }

    const lastDetail = tax.Details[tax.Details.length - 1];
    const fallbackTaxPercent = parseFloat(lastDetail?.PurTaxPerct) || 0;
    const gstAmount = transferPrice * (fallbackTaxPercent / 100);
    return {
      gstAmount,
      slabNo: lastDetail?.Id || tax.Details.length,
      gstPercent: lastDetail?.PurTaxPerct || 0,
    };
  };

  const handleSellingPriceChange = (barcode, price, index) => {
    const item = items.find((i, idx) => i.Barcode === barcode && idx === index);
    const newPrice = Number(price);

    if (newPrice > item.MRP) {
      toast.error("Return Price cannot be greater than MRP!");
      return;
    }

    setItems((prev) =>
      prev.map((i, idx) =>
        i.Barcode === barcode && idx === index
          ? { ...i, BuyingPrice: newPrice }
          : i
      )
    );
  };

  const handleSaveData = async () => {
    if (!Array.isArray(items) || items.length === 0) {
      console.warn("No details to save");
      return;
    }
    console.log("items", items);
    try {
      const payload = {
        STOutMainId: stockDraftData.ID || stockDraftData[0].ID,
        products: items.map((item) => {
          return {
           
            ProductType: 1,
            detailId: item.Id,
            BatchCode: null,
            STQtyOut: item.Quantity,
            TransferPrice: parseFloat(item.BuyingPrice),
            gstPercentage: calculateStockGST(item).gstPercent,
            mrp: item.MRP,
            
          };
        }),
      };
      console.log(payload);
      await saveStockTransfer({ payload }).unwrap();
      toast.success("Frame Stock transfer out successfully added");
      goToStockStep(4);
    } catch (error) {
     console.log(error)
    }
  };

  const filteredBrands = allBrands?.filter(
    (b) =>
      b.FrameActive === 1 &&
      b.IsActive === 1 &&
      b.BrandName.toLowerCase().includes(brandInput.toLowerCase())
  );

  return (
    <div className="max-w-8xl h-auto">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-4 mb-4"></div>
              <h1 className="text-2xl font-bold text-gray-900">
                Step {currentStockStep}: {selectedStockProduct.label}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {searchMode
                  ? "Search by brand and model"
                  : "Scan or enter product barcode to add items"}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={() => prevStockStep()}
                icon={FiArrowLeft}
                variant="outline"
              >
                Back
              </Button>
              <Button
                onClick={handleRefresh}
                icon={FiPlus}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>
        <div className="p-6 border-gray-100">
          {!searchMode ? (
            <form onSubmit={handleBarcodeSubmit} className="space-y-2">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between w-1/2 mb-3">
                  <label
                    htmlFor="barcode"
                    className="text-sm font-medium text-gray-700"
                  >
                    Enter Barcode
                  </label>

                  <div className="flex items-center gap-5">
                    <Radio
                      value="0"
                      onChange={() => setSingleOrCombine(0)}
                      checked={singleOrCombine === 0}
                      label="Combine Entry"
                    />
                    <Radio
                      value="1"
                      onChange={() => setSingleOrCombine(1)}
                      checked={singleOrCombine === 1}
                      label="Separate Entry"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex items-center">
                    <input
                      id="barcode"
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Scan or enter barcode"
                      className="w-[400px] pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <FiSearch className="absolute left-3 text-gray-400" />
                  </div>
                  <Button
                    type="submit"
                    isLoading={isBarcodeLoading || isBarCodeFetching}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setSearchMode(true)}
                    variant="outline"
                  >
                    Search
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleBrandModelSubmit} className="space-y-2">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between w-1/2 mb-3">
                  <label
                    htmlFor="barcode"
                    className="text-sm font-medium text-gray-700"
                  >
                    Search by Brand & Model *
                  </label>
                  <div className="flex items-center gap-5">
                    <Radio
                      value="0"
                      onChange={() => setSingleOrCombine(0)}
                      checked={singleOrCombine === 0}
                      label="Combine Entry"
                    />
                    <Radio
                      value="1"
                      onChange={() => setSingleOrCombine(1)}
                      checked={singleOrCombine === 1}
                      label="Separate Entry"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Autocomplete
                    options={filteredBrands}
                    getOptionLabel={(option) => option.BrandName}
                    onInputChange={(event, value) => {
                      setBrandInput(value);
                    }}
                    onChange={(event, newValue) => {
                      if (newValue) {
                        setBrandInput(newValue.BrandName);
                        setBrandId(newValue.Id);
                      }
                    }}
                    value={
                      filteredBrands.find((b) => b.BrandName === brandInput) ||
                      null
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.Id === value.Id
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search Brand"
                        variant="outlined"
                        fullWidth
                      />
                    )}
                    sx={{ width: 400 }}
                  />
                  <input
                    type="text"
                    value={modelNo}
                    onChange={(e) => setModelNo(e.target.value)}
                    placeholder="Model Number"
                    className="flex-1 pl-4 pr-4 py-3 border border-gray-300 rounded-lg"
                  />
                  <Button
                    type="submit"
                    disabled={isBrandModelLoading || !brandId}
                    isLoading={isBrandModelLoading || isBrandAndModalFetching}
                  >
                    Search
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setSearchMode(false)}
                    variant="outline"
                    icon={FiX}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div>
          {items.length > 0 && (
            <div className="p-6">
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
                  "Action",
                ]}
                data={items}
                renderRow={(item, index) => (
                  <TableRow key={`${item.Barcode}-${index}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>F/S</TableCell>
                    <TableCell className="whitespace-pre-wrap">
                      <div>{item.Name}</div>
                      <div>Size: {item.Size}</div>

                      <div>Barcode: {item.Barcode}</div>
                    </TableCell>
                    <TableCell>₹{item.MRP}</TableCell>
                    <TableCell>
                      {editMode[`${item.Barcode}-${index}`]?.BuyingPrice ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={item.BuyingPrice || ""}
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
                              toggleEditMode(
                                item.Barcode,
                                index,
                                "BuyingPrice",
                                "save"
                              )
                            }
                            className="text-neutral-400 transition"
                            title="Save"
                          >
                            <FiCheck size={18} />
                          </button>
                          <button
                            onClick={() =>
                              toggleEditMode(
                                item.Barcode,
                                index,
                                "BuyingPrice",
                                "cancel"
                              )
                            }
                            className="text-neutral-400 transition"
                            title="Cancel"
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          ₹{formatINR(item.BuyingPrice)}
                          <button
                            onClick={() =>
                              toggleEditMode(item.Barcode, index, "BuyingPrice")
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
                      ₹{formatINR(calculateStockGST(item).gstAmount)}
                    </TableCell>
                    <TableCell>
                      {editMode[`${item.Barcode}-${index}`]?.qty ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={item.stkQty}
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
                              toggleEditMode(item.Barcode, index, "qty")
                            }
                            className="text-neutral-400 transition"
                            title="Save"
                          >
                            <FiCheck size={18} />
                          </button>
                          <button
                            onClick={() =>
                              toggleEditMode(item.Barcode, index, "qty")
                            }
                            className="text-neutral-400 transition"
                            title="Cancel"
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {item.stkQty}
                          <button
                            onClick={() =>
                              toggleEditMode(item.Barcode, index, "qty")
                            }
                            className="text-neutral-400 transition"
                            title="Edit Quantity"
                          >
                            <FiEdit2 size={14} />
                          </button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{item.Quantity}</TableCell>
                    <TableCell>
                      ₹
                      {formatINR(
                        parseFloat(item.BuyingPrice) * item.Quantity +
                          calculateStockGST(item).gstAmount * item.Quantity
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleDelete(item.Barcode, index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 />
                      </button>
                    </TableCell>
                  </TableRow>
                )}
              />
              <div className="flex justify-end mt-6">
                <Button
                  type="submit"
                  isLoading={isStockTransferLoading}
                  disabled={isStockTransferLoading}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700"
                  onClick={handleSaveData}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          )}
        </div>

        {!searchMode && searchResults.length > 0 && (
          <div className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Select Frames</h3>
              <div className="">
                {selectedRows.length > 0 ? (
                  <Button
                    onClick={handleAddSelectedItems}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Selected Items
                  </Button>
                ) : (
                  <Button
                    onClick={() => setSearchResults([])}
                    variant="outline"
                    icon={FiX}
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
            <Table
              columns={[
                "",
                "Barcode",
                "Name",
                "Frame Size",
                "S/O",
                "Product Details",
                "MRP",
                "Buying Price",
              ]}
              data={searchResults}
              renderRow={(item, index) => (
                <TableRow key={item.Barcode}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedRows.some(
                        (i) => i.Barcode === item.Barcode
                      )}
                      onChange={() => handleCheckboxChange(item)}
                    />
                  </TableCell>
                  <TableCell>{item.Barcode}</TableCell>
                  <TableCell>{item.Name}</TableCell>
                  <TableCell>{item.Size}</TableCell>
                  <TableCell>
                    {item.Category === 0 ? "Optical Frame" : "Sunglass"}
                  </TableCell>
                  <TableCell>{item.PO}</TableCell>
                  <TableCell>{item.MRP}</TableCell>
                  <TableCell>{item.BuyingPrice}</TableCell>
                </TableRow>
              )}
            />
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBypassWarnings}
        title="Stock Warning"
        message={
          warningPayload && warningPayload.length > 0 ? (
            <>
              <p className="mb-2">Some frames have stock issues:</p>
              <ul className="list-disc pl-5">
                {warningPayload.map((warning, idx) => {
                  const indexInItems =
                    items.findIndex(
                      (item) => item.Id === warning.frameDetailId
                    ) + 1;
                  return (
                    <li key={warning.frameDetailId}>
                      Frame #{indexInItems}: {warning.message}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2">Do you want to proceed anyway?</p>
            </>
          ) : (
            "Some frames are out of stock. Do you want to proceed anyway?"
          )
        }
        confirmText="Yes, Proceed"
        cancelText="Cancel"
        danger={false}
        isLoading={isFrameSaving}
      />
    </div>
  );
};

export default FrameSunglass;
