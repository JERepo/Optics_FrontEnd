import React, { useRef, useState, useEffect } from "react";
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
  useCreateNewCustomerMutation,
  useGetPatientDetailsByIdQuery,
  useLazyFetchBarcodeForAccessoryQuery,
  useLazyGetByBrandAndProductNameQuery,
  useSaveAccessoryMutation,
} from "../../../api/orderApi";
import toast from "react-hot-toast";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import { Autocomplete, TextField } from "@mui/material";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/Form/Input";
import Select from "../../../components/Form/Select";
import { useSelector } from "react-redux";
import { useGetIsdQuery } from "../../../api/customerApi";
import Radio from "../../../components/Form/Radio";
import { useSaveProductsMutation } from "../../../api/salesReturnApi";

const AccessoryFrame = () => {
  const {
    selectedSalesProduct,
    customerSalesId,
    prevSalesStep,
    currentSalesStep,
    goToSalesStep,
    salesDraftData,
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
  const [singleOrCombine, setSingleOrCombine] = useState(0); // 0 = Combine, 1 = Separate
  const [editMode, setEditMode] = useState({}); // { [barcode-index]: { sellingPrice: false, qty: false } }

  const { data: allBrands } = useGetAllBrandsQuery();
  const [
    fetchByBarcode,
    { isLoading: isBarcodeLoading, isFetching: isBarCodeFetching },
  ] = useLazyFetchBarcodeForAccessoryQuery();
  const [
    fetchByBrandProduct,
    { isLoading: isBrandModelLoading, isFetching: isBrandAndModalFetching },
  ] = useLazyGetByBrandAndProductNameQuery();
  const [saveAccessory, { isLoading: isFrameSaving }] =
    useSaveAccessoryMutation();
  const [saveFinalProducts, { isLoading: isFinalProductsSaving }] =
    useSaveProductsMutation();

  useEffect(() => {
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      items.forEach((item, index) => {
        const key = `${item.Barcode}-${index}`;
        if (!newEditMode[key]) {
          newEditMode[key] = { sellingPrice: false, qty: false };
        }
      });
      return newEditMode;
    });
  }, [items]);
  console.log("edit", editMode);
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode) return;

    const res = await fetchByBarcode({
      barcode,
      locationId: customerSalesId.locationId,
    });
    const data = res?.data?.data;

    if (data) {
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
      toast.error(`Barcode doesn't exist!`);
    }
    setBarcode("");
  };

  const handleBrandModelSubmit = async (e) => {
    e.preventDefault();
    if (!brandId || !modelNo) {
      toast.error("Brand or Product name is mandatory!");
      return;
    }

    try {
      const res = await fetchByBrandProduct({
        brand: brandId,
        product: modelNo,
        locationId: customerSalesId.locationId,
      });

      const data = res?.data?.data;

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
      const msg = err?.data?.message || err?.error || "Failed to fetch models";
      toast.error(msg);
      setBrandInput("");
      setBrandId(null);
      setModelNo("");
      setSearchMode(false);
    }
  };

  const handleRefresh = () => {
    setSearchMode(false);
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
    const newQty = qty.trim();
    if (isNaN(Number(newQty)) || Number(newQty) < 0) {
      toast.error("Quantity must be a positive number!");
      return;
    }
    setItems((prev) =>
      prev.map((i, idx) =>
        i.Barcode === barcode && idx === index
          ? { ...i, Quantity: Number(qty) }
          : i
      )
    );
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
          ? { ...i, SellingPrice: newPrice }
          : i
      )
    );
  };

  const handleDelete = (barcode, index) => {
    setItems((prev) =>
      prev.filter((i, idx) => !(i.Barcode === barcode && idx === index))
    );
    setSelectedRows((prev) => prev.filter((i) => i.Barcode !== barcode));
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      delete newEditMode[`${barcode}-${index}`];
      return newEditMode;
    });
  };

  const toggleEditMode = (barcode, index, field) => {
    setEditMode((prev) => ({
      ...prev,
      [`${barcode}-${index}`]: {
        ...prev[`${barcode}-${index}`],
        [field]: !prev[`${barcode}-${index}`]?.[field],
      },
    }));
  };

  const handleConfirmBypassWarnings = async () => {
    if (!warningPayload) return;
    const newPayload = {
      products: items.map((item) => ({
        otherProductDetailId: item.Id,
        qty: item.Quantity,
        PatientID: customerSalesId.patientId,
        locationId: customerSalesId.locationId,
        bypassWarnings: true,
      })),
    };
    try {
      await saveAccessory({
        orderId: customerSalesId.orderId,
        payload: newPayload,
      }).unwrap();
      toast.success("Accessories saved with warnings bypassed.");
      setShowConfirmModal(false);
      goToSalesStep(4);
    } catch (err) {
      setShowConfirmModal(false);
      toast.error("Failed to save after confirming warnings.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (items.length <= 0) return toast.error("Please add at least one item");
    const basePayload = {
      products: items.map((item) => ({
        otherProductDetailId: item.Id,
        qty: item.Quantity,
        PatientID: customerSalesId.patientId,
        locationId: customerSalesId.locationId,
        bypassWarnings: false,
      })),
    };

    try {
      const response = await saveAccessory({
        orderId: customerSalesId.orderId,
        payload: basePayload,
      }).unwrap();
      if (response?.warnings?.length > 0) {
        setWarningPayload(response.warnings);
        setShowConfirmModal(true);
      } else {
        goToSalesStep(4);
        toast.success("Accessories saved successfully!");
      }
    } catch (error) {
      toast.error("Cannot save Accessories!");
    }
  };

  const handleSaveData = async () => {
    if (!Array.isArray(items) || items.length === 0) {
      console.warn("No details to save");
      return;
    }

    try {
      for (const detail of items) {
        const payload = {
          SRMasterID: salesDraftData.Id ?? null,
          ProductType: detail.ProductType ?? 2,
          ContactLensDetailId: detail.CLDetailId ?? null,
          AccessoryDetailId: detail.Id ?? null,
          FrameDetailId: detail.FrameDetailId ?? null,
          OpticalLensDetailId: detail.OpticalLensDetailId ?? null,
          BatchCode: detail.CLBatchCode ?? null,
          CNQty: detail.Quantity ?? null,
          SRP: parseFloat(detail.MRP) ?? null,
          ReturnPrice: detail.SellingPrice ?? null,
          ProductTaxPercentage: detail.ProductTaxPercentage ?? 18,
          FittingReturnPrice: detail.FittingReturnPrice ?? null,
          FittingTaxPercentage: detail.FittingTaxPercentage ?? null,
          InvoiceDetailId: detail.InvoiceDetailId ?? null,
          ApplicationUserId: user.Id,
        };

        await saveFinalProducts({ payload }).unwrap();
      }
      goToSalesStep(4);
    } catch (error) {
      console.error("Error saving detail:", error);
    }
  };

  const filteredBrands = allBrands?.filter(
    (b) =>
      b.OthersProductsActive === 1 &&
      b.IsActive === 1 &&
      b.BrandName.toLowerCase().includes(brandInput.toLowerCase())
  );

  return (
    <div className="max-w-7xl h-auto">
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
                onClick={prevSalesStep}
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
                    placeholder="Product Name"
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
        {items.length > 0 && (
          <div className="p-6">
            <Table
              columns={[
                "S.No",
                "Barcode",
                "Name",
                "Variation",
                "sku code",
                "MRP",
                "Selling Price",
                "return Qty",
                "Action",
              ]}
              data={items}
              renderRow={(item, index) => (
                <TableRow key={`${item.Barcode}-${index}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.Barcode}</TableCell>
                  <TableCell>{item.Name}</TableCell>
                  <TableCell>{item.Variation}</TableCell>
                  <TableCell>{item.SKU}</TableCell>
                  <TableCell>₹{item.MRP}</TableCell>
                  <TableCell>
                    {editMode[`${item.Barcode}-${index}`]?.sellingPrice ? (
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
                            toggleEditMode(item.Barcode, index, "sellingPrice")
                          }
                          className="text-neutral-400 transition"
                          title="Save"
                        >
                          <FiCheck size={18} />
                        </button>
                        <button
                          onClick={() =>
                            toggleEditMode(item.Barcode, index, "sellingPrice")
                          }
                          className="text-neutral-400 transition"
                          title="Cancel"
                        >
                          <FiX size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">
                          ₹{item.SellingPrice || "N/A"}
                        </span>
                        <button
                          onClick={() =>
                            toggleEditMode(item.Barcode, index, "sellingPrice")
                          }
                          className="text-neutral-400"
                          title="Edit Price"
                        >
                          <FiEdit2 size={14} />
                        </button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editMode[`${item.Barcode}-${index}`]?.qty ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.Quantity}
                          onChange={(e) =>
                            handleQtyChange(item.Barcode, e.target.value, index)
                          }
                          className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          min="1"
                        />
                        <button
                          onClick={() =>
                            toggleEditMode(item.Barcode, index, "qty")
                          }
                          className="text-neutral-400"
                          title="Save"
                        >
                          <FiCheck size={18} />
                        </button>
                        <button
                          onClick={() =>
                            toggleEditMode(item.Barcode, index, "qty")
                          }
                          className="text-neutral-400"
                          title="Cancel"
                        >
                          <FiX size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">{item.Quantity}</span>
                        <button
                          onClick={() =>
                            toggleEditMode(item.Barcode, index, "qty")
                          }
                          className="text-neutral-400"
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
        {!searchMode && searchResults.length > 0 && (
          <div className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Select Accessories</h3>
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
                "Variation",
                "sku code",
                "MRP",
                "Selling Price",
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
                  <TableCell>{item.Variation}</TableCell>
                  <TableCell>{item.SKU}</TableCell>
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
              <p className="mb-2">Some accessories have stock issues:</p>
              <ul className="list-disc pl-5">
                {warningPayload.map((warning, idx) => {
                  const indexInItems =
                    items.findIndex(
                      (item) => item.Id === warning.otherProductDetailId
                    ) + 1;
                  return (
                    <li key={warning.otherProductDetailId}>
                      Accessory #{indexInItems}: {warning.message}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2">Do you want to proceed anyway?</p>
            </>
          ) : (
            "Some accessories are out of stock. Do you want to proceed anyway?"
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

export default AccessoryFrame;
