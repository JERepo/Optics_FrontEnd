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
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/Form/Input";
import {
  useLazyGetInvoiceDetailsQuery,
  useSaveProductsMutation,
} from "../../../api/salesReturnApi";
import { useSelector } from "react-redux";
import { formatINR } from "../../../utils/formatINR";
import Loader from "../../../components/ui/Loader";

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
    dBL,
    templeLength,
    category,
    modelNo,
    productDescName,
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
  const name = clean(productName || productDescName);
  const hsn = clean(HSN || hSN);
  const barcodeVal = clean(Barcode || barcode);
  const clr = clean(Colour || color);
  const sizeVal = clean(size);
  const mo = clean(modelNo);

  // map category
  const getCategoryName = (cat) => {
    if (cat === 0 || cat === "0") return "Optical Frame";
    if (cat === 1 || cat === "1") return "Sunglass";
    return "";
  };

  return [
    name ? `${name}` : name,
    // mo && `Model No:${mo}`,
    sizeVal && `Size: ${sizeVal}-${dBL}-${templeLength}`,
    getCategoryName(category) && `Category: ${getCategoryName(category)}`,
    clr && `Color: ${clr}`,
    barcodeVal && `Barcode: ${barcodeVal}`,
    hsn && `HSN: ${hsn}`,
  ]
    .filter(Boolean)
    .join("\n");
};

const FrameSunglass = () => {
  const {
    selectedSalesProduct,
    prevSalesStep,
    currentSalesStep,
    goToStep,
    customerSalesId,
    referenceApplicable,
    salesDraftData,
    goToSalesStep,
    calculateGST,
  } = useOrder();
  const { user, hasMultipleLocations } = useSelector((state) => state.auth);
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
  const [openReferenceYes, setOpenReferenceYes] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceSelected, setIsInvoiceSelected] = useState(false);
  const [selectedInvoiceReturnQty, setSelectedInvoiceReturnQty] = useState(0);

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
  const [saveFinalProducts, { isLoading: isFinalProductsSaving }] =
    useSaveProductsMutation();

  const [
    getInvoiceDetails,
    { data: InvoiceDetails, isLoading: isInvoiceLoading },
  ] = useLazyGetInvoiceDetailsQuery();

  useEffect(() => {
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      items.forEach((item, index) => {
        const key = `${item.Id || item.Barcode}-${index}`;
        if (!newEditMode[key]) {
          newEditMode[key] = {
            sellingPrice: false,
            qty: false,
            returnPrice: false,
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
        locationId: customerSalesId.locationId,
      });
      const data = res?.data?.data;
      if (data) {
        if (referenceApplicable === 0) {
          setItems((prev) => {
            if (singleOrCombine === 1) {
              return [{ ...data, Quantity: 1 }, ...prev];
            } else {
              const index = prev.findIndex((i) => i.Barcode === data.Barcode);
              if (index !== -1) {
                return prev.map((item, idx) =>
                  idx === index
                    ? { ...item, Quantity: Number(item.Quantity) + 1 }
                    : item
                );
              } else {
                return [{ ...data, Quantity: 1 }, ...prev];
              }
            }
          });
        } else {
          await getInvoiceDetails({
            productType: 1,
            detailId: data.Id,
            batchCode: null,
            patientId: customerSalesId.patientId,
            locationId: customerSalesId.locationId,
          }).unwrap();
          setOpenReferenceYes(true);
        }
      }
    } catch (error) {
      toast.error("No eligible Invoice exists for the given product");
    }

    setBarcode("");
  };

  const handleBrandModelSubmit = async (e) => {
    e.preventDefault();
    if (!brandId) return;

    try {
      const res = await fetchByBrandModal({
        brand: brandId,
        modal: modelNo,
        locationId: customerSalesId.locationId,
      }).unwrap();

      const data = res?.data;

      if (data && data.length > 0) {
        setSearchResults(data);
        setBrandInput("");
        setBrandId(null);
        setModelNo("");
        setSearchMode(false);
      } else {
        toast.error(res?.data?.message || "No matching models found");
        setBrandInput("");
        setBrandId(null);
        setModelNo("");
        setSearchMode(false);
      }
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.error ||
        "No eligible Invoice exists for the given product";
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

  const handleCheckboxChange = async (item) => {
    const exists = selectedRows.find((i) => i.Barcode === item.Barcode);
    if (referenceApplicable === 0) {
      if (exists) {
        setSelectedRows((prev) =>
          prev.filter((i) => i.Barcode !== item.Barcode)
        );
      } else {
        setSelectedRows((prev) => [...prev, item]);
      }
    } else if (referenceApplicable === 1) {
      // if (exists) {
      //   setSelectedRows((prev) =>
      //     prev.filter((i) => i.Barcode !== item.Barcode)
      //   );
      // } else {
      //   setSelectedRows((prev) => [...prev, item]);
      // }
      try {
        await getInvoiceDetails({
          productType: 1,
          detailId: item.Id,
          batchCode: null,
          patientId: customerSalesId.patientId,
          locationId: customerSalesId.locationId,
        }).unwrap();
        setOpenReferenceYes(true);
      } catch (error) {
        toast.error("No eligible Invoice exists for the given product");
      }
    }
  };

  const handleAddSelectedItems = () => {
    setItems((prev) => {
      let updated = [...prev];

      selectedRows.forEach((selected) => {
        if (singleOrCombine === 1) {
          updated = [{ ...selected, Quantity: 1 }, ...updated];
        } else {
          const index = updated.findIndex(
            (i) => i.Barcode === selected.Barcode
          );
          if (index !== -1) {
            updated = updated.map((item, idx) =>
              idx === index
                ? { ...item, Quantity: Number(item.Quantity) + 1 }
                : item
            );
          } else {
            updated = [{ ...selected, Quantity: 1 }, ...updated];
          }
        }
      });

      return updated;
    });

    setSelectedRows([]);
    setSearchResults([]);
  };

  const handleQtyChange = (barcode, qty, index) => {
    setItems((prev) =>
      prev.map((i, idx) =>
        i.Barcode === barcode && idx === index
          ? { ...i, Quantity: Number(qty) }
          : i
      )
    );
  };

  const handleDelete = (id, index) => {
    if (referenceApplicable === 1) {
      setItems((prev) => prev.filter((item, i) => i !== index));
    } else {
      setItems((prev) =>
        prev.filter((i, idx) => !(i.Barcode === id && idx === index))
      );
      setSelectedRows((prev) => prev.filter((i) => i.Barcode !== id));
      setEditMode((prev) => {
        const newEditMode = { ...prev };
        delete newEditMode[`${id}-${index}`];
        return newEditMode;
      });
    }
  };
  const handleReturnPriceChange = (id, price, index) => {
    const item = items.find((i, idx) => i.Id === id && idx === index);
    const newPrice = parseFloat(price);

    // Validate that Return Price does not exceed Invoice Price (ActualSellingPrice)
    if (newPrice > item.ActualSellingPrice) {
      toast.error("Return Price cannot be greater than Invoice Price!");
      return;
    }

    // Update ReturnPricePerUnit and TotalAmount
    setItems((prev) =>
      prev.map((i, idx) =>
        i.Id === id && idx === index
          ? {
              ...i,
              ReturnPricePerUnit: newPrice,
              TotalAmount: newPrice * parseInt(i.ReturnQty || 0),
            }
          : i
      )
    );
  };
  const toggleEditMode = (id, index, field, action) => {
    console.log("coming");
    setEditMode((prev) => {
      const key = `${id}-${index}`;
      const currentMode = prev[key]?.[field];

      // If entering edit mode, store the current price as originalPrice
      if (!currentMode) {
        const item = items.find((i, idx) => i.Id === id && idx === index);
        let originalPrice = prev[key]?.originalPrice;
        if (field === "sellingPrice" && referenceApplicable === 0) {
          originalPrice = item?.SellingPrice;
        } else if (field === "returnPrice" && referenceApplicable === 1) {
          originalPrice = item.ReturnPricePerUnit || item.ActualSellingPrice;
        }

        return {
          ...prev,
          [key]: {
            ...prev[key],
            [field]: true,
            originalPrice,
          },
        };
      }

      // If exiting edit mode
      if (currentMode) {
        if (
          field === "sellingPrice" &&
          referenceApplicable === 0 &&
          action === "cancel"
        ) {
          // Revert to original price on cancel
          setItems((prevItems) =>
            prevItems.map((i, idx) =>
              i.Barcode === id && idx === index
                ? { ...i, SellingPrice: prev[key].originalPrice || i.MRP }
                : i
            )
          );
        } else if (
          field === "returnPrice" &&
          referenceApplicable === 1 &&
          action === "cancel"
        ) {
          // Revert to original price on cancel
          setItems((prevItems) =>
            prevItems.map((i, idx) =>
              i.Id === id && idx === index
                ? {
                    ...i,
                    ReturnPricePerUnit:
                      prev[key].originalPrice || i.ActualSellingPrice,
                  }
                : i
            )
          );
        }

        return {
          ...prev,
          [key]: {
            ...prev[key],
            [field]: false,
            originalPrice: prev[key].originalPrice, // Preserve original price
          },
        };
      }

      return {
        ...prev,
        [key]: {
          ...prev[key],
          [field]: !currentMode,
          originalPrice: prev[key]?.originalPrice,
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
        PatientID: customerSalesId.patientId,
        locationId: customerSalesId.locationId,
        bypassWarnings: true,
      })),
    };
    try {
      await saveFrame({
        orderId: customerSalesId.orderId,
        payload: newPayload,
      }).unwrap();
      toast.success("Frames saved with warnings bypassed.");
      setShowConfirmModal(false);
      goToStep(4);
    } catch (err) {
      setShowConfirmModal(false);
      toast.error("Failed to save after confirming warnings.");
    }
  };

  const handleSellingPriceChange = (barcode, price, index) => {
    const item = items.find((i, idx) => i.Barcode === barcode && idx === index);
    const newPrice = Number(price);
    console.log("item", item);
    if (newPrice > item.MRP) {
      toast.error("Return Price cannot be greater than MRP!");
      return;
    }

    setItems((prev) =>
      prev.map((i, idx) =>
        i.Barcode === barcode && idx === index
          ? { ...i, SellingPrice: newPrice }
          : i
      )
    );
  };

  const handleAddData = () => {
    if (!selectedInvoiceReturnQty || isNaN(selectedInvoiceReturnQty)) {
      toast.error("Please enter a valid Return Qty");
      return;
    }

    if (
      selectedInvoice?.InvoiceQty - parseInt(selectedInvoice?.ReturnQty) <
      selectedInvoiceReturnQty
    ) {
      toast.error("Sales Return Quantity cannot exceed Pending Quantity!");
      return;
    }

    // Check if item already exists in items array
    const itemExists = items.some((item) => item.Id === selectedInvoice?.Id);

    if (itemExists) {
      toast.error("This invoice item has already been added!");
      return;
    }

    const newItem = {
      ...barCodeData?.data,
      FrameId: barCodeData?.data.Id,
      ...selectedInvoice,
      ReturnQty: selectedInvoiceReturnQty,
      ReturnPricePerUnit: selectedInvoice.ActualSellingPrice,
      GSTPercentage:
        parseFloat(selectedInvoice.ProductDetails[0]?.taxPercentage) || 0,
      TotalAmount:
        parseFloat(selectedInvoice.ActualSellingPrice) *
        selectedInvoiceReturnQty,
    };

    setItems((prev) => [...prev, newItem]);
    setOpenReferenceYes(false);
    setIsInvoiceSelected(false);
    setSelectedInvoiceReturnQty(0);
    setSelectedInvoice(null);
  };
  const handleSaveData = async () => {
    if (referenceApplicable === 0) {
      if (!Array.isArray(items) || items.length === 0) {
        console.warn("No details to save");
        return;
      }
    }

    try {
      for (const detail of items) {
        const payload = {
          SRMasterID: salesDraftData.Id ?? null,
          ProductType: detail.ProductType ?? 1,
          ContactLensDetailId: detail.CLDetailId ?? null,
          AccessoryDetailId: detail.AccessoryDetailId ?? null,
          FrameDetailId: detail.FrameId ?? detail.Id ?? null,
          OpticalLensDetailId: detail.OpticalLensDetailId ?? null,
          BatchCode: detail.CLBatchCode ?? null,
          CNQty:
            referenceApplicable === 1
              ? detail.ReturnQty ?? null
              : detail.Quantity ?? null,
          SRP:
            referenceApplicable === 0
              ? parseFloat(detail.MRP) ?? null
              : parseFloat(detail.SRP) ?? null,
          ReturnPrice:
            referenceApplicable === 0
              ? parseFloat(detail.SellingPrice) ?? null
              : parseFloat(detail.ReturnPricePerUnit) ?? null,
          ProductTaxPercentage: detail.ProductTaxPercentage ?? 18,
          FittingReturnPrice: detail.FittingReturnPrice ?? null,
          FittingTaxPercentage: detail.FittingTaxPercentage ?? null,
          InvoiceDetailId: referenceApplicable === 1 ? detail.Id ?? null : null,
          ApplicationUserId: user.Id,
          companyId :parseInt(hasMultipleLocations[0])
        };

        await saveFinalProducts({ payload }).unwrap();
      }

      goToSalesStep(4);
    } catch (error) {
      console.error("Error saving detail(s):", error);
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
                Step {currentSalesStep}: {selectedSalesProduct.label}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {searchMode
                  ? "Search by brand and model"
                  : "Scan or enter product barcode to add items"}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={() => prevSalesStep()}
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
                  {referenceApplicable === 0 && (
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
                  )}
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

        {referenceApplicable === 0 && (
          <div>
            {items.length > 0 && (
              <div className="p-6">
                <Table
                  columns={[
                    "S.No",
                    "Barcode",
                    "Name",
                    "Frame Size",
                    "S/O",
                    "Product details",
                    "MRP",
                    "Return Price",
                    "return Qty",
                    "Action",
                  ]}
                  data={items}
                  renderRow={(item, index) => (
                    <TableRow key={`${item.Barcode}-${index}`}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.Barcode}</TableCell>
                      <TableCell>{item.Name}</TableCell>
                      <TableCell>{item.Size}</TableCell>
                      <TableCell>
                        {item.Category === "O" ? "Optical Frame" : "Sunglass"}
                      </TableCell>
                      <TableCell className="w-[80px]">
                        <div className="grid grid-cols-2 gap-2 w-auto">
                          {[
                            item.PO == 1 ? "PH" : null,
                            item.Ph == 1 ? "PO" : null,
                            item.Cl ? `CL: ${item.Cl}` : null,
                            item.IsRxable === 1 ? "Rx" : null,
                          ]
                            .filter(Boolean)
                            .map((val, idx) => (
                              <div key={idx}>{val}</div>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell>₹{item.MRP}</TableCell>
                      <TableCell>
                        {editMode[`${item.Id}-${index}`]?.sellingPrice ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={item.SellingPrice || ""}
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
                                  item.Id,
                                  index,
                                  "sellingPrice",
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
                                  item.Id,
                                  index,
                                  "sellingPrice",
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
                            ₹{item.SellingPrice || "N/A"}
                            <button
                              onClick={() =>
                                toggleEditMode(item.Id, index, "sellingPrice")
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
                        {editMode[`${item.Id}-${index}`]?.qty ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={item.Quantity}
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
                                toggleEditMode(
                                  item.Id,
                                  index,
                                  "qty",
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
                                  item.Id,
                                  index,
                                  "qty",
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
                            {item.Quantity}
                            <button
                              onClick={() =>
                                toggleEditMode(item.Id, index, "qty")
                              }
                              className="text-neutral-400 transition"
                              title="Edit Quantity"
                            >
                              <FiEdit2 size={14} />
                            </button>
                          </div>
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
                    isLoading={isFinalProductsSaving}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700"
                    onClick={handleSaveData}
                  >
                    Save & Continue
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        {referenceApplicable === 1 && items.length > 0 && (
          <div className="p-6">
            <Table
              expand={true}
              columns={[
                "S.No",
                "Invoice No",
                "Type",
                "Product Details",
                "SRP",
                "Return Price",
                "GST Amt",
                "return Qty",
                "Total Amount",
                "Action",
              ]}
              data={items}
              renderRow={(item, index) => (
                <TableRow
                  key={
                    item.SalesReturnDetailId ||
                    `${item.InvoiceMain?.InvoiceNo}/${item.InvoiceSlNo}/${index}`
                  }
                >
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell>
                    {item["InvoiceMain.InvoicePrefix"]}/
                    {item["InvoiceMain.InvoiceNo"]}/{item.InvoiceSlNo}
                  </TableCell>
                  <TableCell className="text-center">F/S</TableCell>
                  <TableCell className="whitespace-pre-line">
                    {getProductDetailsText(item.ProductDetails[0])}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{formatINR(parseFloat(item.SRP || 0))}
                  </TableCell>
                  <TableCell className="text-right">
                    {editMode[`${item.Id}-${index}`]?.returnPrice ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.ReturnPricePerUnit || ""}
                          onChange={(e) =>
                            handleReturnPriceChange(
                              item.Id,
                              e.target.value,
                              index
                            )
                          }
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          placeholder="Enter return price"
                        />
                        <button
                          onClick={() =>
                            toggleEditMode(item.Id, index, "returnPrice")
                          }
                          className="text-neutral-400 transition"
                          title="Save"
                        >
                          <FiCheck size={18} />
                        </button>
                        <button
                          onClick={() =>
                            toggleEditMode(
                              item.Id,
                              index,
                              "returnPrice",
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
                        ₹{formatINR(parseFloat(item.ReturnPricePerUnit || 0))}
                        <button
                          onClick={() =>
                            toggleEditMode(item.Id, index, "returnPrice")
                          }
                          className="text-neutral-400 transition"
                          title="Edit Return Price"
                        >
                          <FiEdit2 size={14} />
                        </button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    ₹
                    {formatINR(
                      calculateGST(
                        parseFloat(item.ReturnPricePerUnit || 0),
                        parseFloat(item.GSTPercentage || 0)
                      ).gstAmount
                    )}
                  </TableCell>
                  <TableCell>{item.ReturnQty || 0}</TableCell>
                  <TableCell>
                    ₹{formatINR(parseFloat(item.TotalAmount || 0))}
                  </TableCell>
                  <TableCell>
                    <Button
                      className="px-3 py-1"
                      onClick={() => handleDelete(null, index)}
                      icon={FiTrash2}
                    ></Button>
                  </TableCell>
                </TableRow>
              )}
            />
            <div className="flex justify-end mt-6">
              <Button
                type="submit"
                isLoading={isFinalProductsSaving}
                className="px-6 py-3 bg-green-600 hover:bg-green-700"
                onClick={handleSaveData}
              >
                Save & Continue
              </Button>
            </div>
          </div>
        )}
        {referenceApplicable === 1 && (
          <div>
            <Modal
              width="max-w-4xl"
              isOpen={openReferenceYes}
              onClose={() => {
                setOpenReferenceYes(false);
                setIsInvoiceSelected(false);
              }}
            >
              <h1 className="text-neutral-700 text-2xl mb-3">Invoice List</h1>
              {!isInvoiceSelected && (
                <Table
                  columns={[
                    "S.No",
                    "INVOICE No",
                    "invoice value",
                    "invoice qty",
                    "sale return qty",
                    "pending return qty",
                    "Action",
                  ]}
                  data={InvoiceDetails?.data?.filter(
                    (item) =>
                      item["InvoiceMain.Company.Id"] ===
                      parseInt(hasMultipleLocations[0])
                  )}
                  renderRow={(item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {item["InvoiceMain.InvoicePrefix"]}/
                        {item["InvoiceMain.InvoiceNo"]}/{item.InvoiceSlNo}
                      </TableCell>
                      <TableCell>
                        ₹
                        {formatINR(
                          parseFloat(item.ActualSellingPrice) * item.InvoiceQty
                        )}
                      </TableCell>
                      <TableCell>{item.InvoiceQty}</TableCell>

                      <TableCell>{item.ReturnQty}</TableCell>
                      <TableCell>
                        {item.InvoiceQty - parseInt(item.ReturnQty)}
                      </TableCell>
                      <TableCell>
                        <button
                          className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          onClick={() => {
                            setSelectedInvoice(item);
                            setIsInvoiceSelected(true);
                            setSelectedInvoiceReturnQty(
                              item.InvoiceQty - parseInt(item.ReturnQty)
                            );
                          }}
                        >
                          Select
                        </button>
                      </TableCell>
                    </TableRow>
                  )}
                />
              )}
              {isInvoiceSelected && (
                <div className="flex gap-2 ">
                  <Input
                    value={
                      selectedInvoice?.InvoiceQty -
                      parseInt(selectedInvoice?.ReturnQty)
                    }
                    grayOut={true}
                    label="Pending Qty"
                  />
                  <Input
                    value={selectedInvoiceReturnQty}
                    label="Sales Return Qty"
                    onChange={(e) =>
                      setSelectedInvoiceReturnQty(e.target.value)
                    }
                  />
                </div>
              )}

              {isInvoiceSelected && (
                <div className="w-full mt-5">
                  <Button onClick={handleAddData}>Save</Button>
                </div>
              )}
            </Modal>
          </div>
        )}

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
                "Selling Price",
              ]}
              data={searchResults}
              renderRow={(item, index) => (
                <TableRow key={item.Barcode}>
                  <TableCell>
                    {isInvoiceLoading ? (
                      <Loader size={15} color="black" />
                    ) : (
                      <input
                        type="checkbox"
                        checked={selectedRows.some(
                          (i) => i.Barcode === item.Barcode
                        )}
                        onChange={() => handleCheckboxChange(item)}
                      />
                    )}
                  </TableCell>
                  <TableCell>{item.Barcode}</TableCell>
                  <TableCell>{item.Name}</TableCell>
                  <TableCell>{item.Size}</TableCell>
                  <TableCell>
                    {item.Category === "O" ? "Optical Frame" : "Sunglass"}
                  </TableCell>
                  <TableCell className="w-[80px]">
                    <div className="grid grid-cols-2 gap-2 w-auto">
                      {[
                        item.PO == 1 ? "PH" : null,
                        item.Ph == 1 ? "PO" : null,
                        item.Cl ? `CL: ${item.Cl}` : null,
                        item.IsRxable === 1 ? "Rx" : null,
                      ]
                        .filter(Boolean)
                        .map((val, idx) => (
                          <div key={idx}>{val}</div>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell>{item.MRP}</TableCell>
                  <TableCell>{item.SellingPrice}</TableCell>
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
