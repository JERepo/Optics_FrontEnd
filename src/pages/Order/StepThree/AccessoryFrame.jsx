import React, { useRef, useState, useEffect } from "react";
import { useOrder } from "../../../features/OrderContext";
import { FiArrowLeft, FiPlus, FiSearch, FiX, FiTrash2 } from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { useGetAllBrandsQuery } from "../../../api/brandsApi";
import {
  useLazyFetchBarcodeForAccessoryQuery,
  useLazyGetByBrandAndProductNameQuery,
  useSaveAccessoryMutation,
} from "../../../api/orderApi";
import toast from "react-hot-toast";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import { Autocomplete, TextField } from "@mui/material";

const AccessoryFrame = () => {
  const { selectedProduct, customerId, prevStep, currentStep, goToStep } =
    useOrder();
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
  const brandInputRef = useRef(null);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const dropdownRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        brandInputRef.current &&
        !brandInputRef.current.contains(event.target)
      ) {
        setShowBrandDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode) return;
    const res = await fetchByBarcode({
      barcode,
      locationId: customerId.locationId,
    });
    const data = res?.data?.data;
    if (data) {
      setItems((prev) => {
        const existing = prev.find((i) => i.Barcode === data.Barcode);
        if (existing) {
          return prev.map((i) =>
            i.Barcode === data.Barcode
              ? { ...i, Quantity: Number(i.Quantity) + 1 }
              : i
          );
        }
        return [...prev, { ...data, Quantity: 1 }];
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
        locationId: customerId.locationId,
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
  };

  const handleCheckboxChange = (item) => {
    const exists = selectedRows.find((i) => i.Barcode === item.Barcode);
    if (exists) {
      // Remove from selectedRows
      setSelectedRows((prev) => prev.filter((i) => i.Barcode !== item.Barcode));
    } else {
      // Add to selectedRows
      setSelectedRows((prev) => [...prev, item]);
    }
  };

  const handleAddSelectedItems = () => {
    setItems((prev) => {
      const updatedItems = prev.map((item) => {
        const matched = selectedRows.find((s) => s.Barcode === item.Barcode);
        if (matched) {
          return { ...item, Quantity: Number(item.Quantity) + 1 };
        }
        return item;
      });

      // Add new items (not already in prev)
      const newItems = selectedRows
        .filter((s) => !prev.find((p) => p.Barcode === s.Barcode))
        .map((s) => ({ ...s, Quantity: 1 }));

      return [...updatedItems, ...newItems];
    });

    setSelectedRows([]);
    setSearchResults([]);
  };

  const handleQtyChange = (barcode, qty) => {
    setItems((prev) =>
      prev.map((i) =>
        i.Barcode === barcode ? { ...i, Quantity: Number(qty) } : i
      )
    );
  };

  const handleDelete = (barcode) => {
    setItems((prev) => prev.filter((i) => i.Barcode !== barcode));
    setSelectedRows((prev) => prev.filter((i) => i.Barcode !== barcode));
  };

  const handleConfirmBypassWarnings = async () => {
    if (!warningPayload) return;
    const warnedIds = warningPayload.map((w) => w.otherProductDetailId);
    const newPayload = {
      products: items.map((item) => ({
        otherProductDetailId: item.Id,
        qty: item.Quantity,
        locationId: customerId.locationId,
        bypassWarnings: warnedIds.includes(item.Id),
      })),
    };
    try {
      await saveAccessory({
        orderId: customerId.orderId,
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
  console.log(customerId);
  const handleSave = async (e) => {
    e.preventDefault();
    if (items.length <= 0) return toast.error("Please add at least one item");
    const basePayload = {
      products: items.map((item) => ({
        otherProductDetailId: item.Id,
        qty: item.Quantity,
        locationId: customerId.locationId,
        bypassWarnings: false,
      })),
    };

    try {
      const response = await saveAccessory({
        orderId: customerId.orderId,
        payload: basePayload,
      }).unwrap();
      if (response?.warnings?.length > 0) {
        setWarningPayload(response.warnings);
        setShowConfirmModal(true);
      } else {
        goToStep(4);
        toast.success("Frames saved successfully!");
      }
    } catch (error) {
      toast.error("Cannot save Frames!");
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
      <div className="bg-white rounded-xl shadow-sm ">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Step {currentStep}: {selectedProduct.label}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {searchMode
                  ? "Search by brand and model"
                  : "Scan or enter product barcode to add items"}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button onClick={prevStep} icon={FiArrowLeft} variant="outline">
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
                "Qty",
                "Action",
              ]}
              data={items}
              renderRow={(item, index) => (
                <TableRow key={item.Barcode}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.Barcode}</TableCell>
                  <TableCell>{item.Name}</TableCell>
                  <TableCell>{item.Variation}</TableCell>
                  <TableCell>{item.SKU}</TableCell>
                  <TableCell>{item.MRP}</TableCell>

                  <TableCell>{item.SellingPrice}</TableCell>
                  <TableCell>
                    <input
                      type="number"
                      value={item.Quantity}
                      onChange={(e) =>
                        handleQtyChange(item.Barcode, e.target.value)
                      }
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleDelete(item.Barcode)}
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
                isLoading={isFrameSaving}
                className="px-6 py-3 bg-green-600 hover:bg-green-700"
                onClick={handleSave}
              >
                Save & Continue
              </Button>
            </div>
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

        <div className="p-6 border-gray-100">
          {!searchMode ? (
            <form onSubmit={handleBarcodeSubmit} className="space-y-2">
              <div className="flex flex-col gap-3">
                <label
                  htmlFor="barcode"
                  className="text-sm font-medium text-gray-700"
                >
                  Enter Barcode
                </label>
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
                <label className="text-sm font-medium text-gray-700">
                  Search by Brand & Product Name *
                </label>
                <div className="flex gap-2">
                  <Autocomplete
                    options={filteredBrands}
                    getOptionLabel={(option) => option.BrandName}
                    onInputChange={(event, value) => {
                      setBrandInput(value);
                      setShowBrandDropdown(true);
                    }}
                    onChange={(event, newValue) => {
                      if (newValue) {
                        setBrandInput(newValue.BrandName);
                        setBrandId(newValue.Id);
                        setShowBrandDropdown(false);
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
                      (item) => item.Id === warning.otherProductDetailId
                    ) + 1;
                  return (
                    <li key={warning.otherProductDetailId}>
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

export default AccessoryFrame;
