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
  useLazyFetchBarcodeForAccessoryQuery,
  useLazyGetByBrandAndProductNameQuery,
  useSaveAccessoryMutation,
} from "../../../api/orderApi";
import toast from "react-hot-toast";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import { Autocomplete, TextField } from "@mui/material";
import { useSelector } from "react-redux";
import Radio from "../../../components/Form/Radio";
import {
  useGetStockOutDataForStockInQuery,
  useGetStockOutDetailsQuery,
  useSaveStockDetailsMutation,
} from "../../../api/stockTransfer";
import { formatINR } from "../../../utils/formatINR";
import {
  validateQuantity,
  validateStockQty,
} from "../../../utils/isValidNumericInput";

const AccessoryFrame = () => {
  const {
    customerStockTransferIn,
    currentStockTransferInStep,
    stockTransferInDraftData,
    goToStockTransferInStep,
    prevStockTransferInStep,
    selectedStockTransferInProduct,
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
  const [singleOrCombine, setSingleOrCombine] = useState(0); // 0 = Combine, 1 = Separate
  const [editMode, setEditMode] = useState({}); // { [barcode-index]: { sellingPrice: false, qty: false } }

  // const { data: stockOutData } = useGetStockOutDetailsQuery({
  //   mainId: customerStockTransferIn.mainId,
  //   locationId: parseInt(hasMultipleLocations[0]),
  // });
  const { data: stockOutData } = useGetStockOutDataForStockInQuery({
      mainId: customerStockTransferIn.mainId,
      locationId: parseInt(hasMultipleLocations[0]),
    });
  const { data: allBrands } = useGetAllBrandsQuery();
  const [
    fetchByBarcode,
    {
      data: barCodeData,
      isLoading: isBarcodeLoading,
      isFetching: isBarCodeFetching,
    },
  ] = useLazyFetchBarcodeForAccessoryQuery();
  const [
    fetchByBrandProduct,
    { isLoading: isBrandModelLoading, isFetching: isBrandAndModalFetching },
  ] = useLazyGetByBrandAndProductNameQuery();
  const [saveAccessory, { isLoading: isFrameSaving }] =
    useSaveAccessoryMutation();
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
        locationId: customerStockTransferIn.locationId,
      }).unwrap();
      const data = res?.data;

      setItems((prev) => {
        // Check if product exists in StockTransferOut
        const STOProduct = stockOutData?.data?.StockTransferInDetails?.find(
          (item) => item.FrameDetailId === data.Id
        );
        if (!STOProduct) {
          toast.error("Product is not present in the selected Stock Transfer");
          return prev;
        }

        // Find existing in our items (local scanned state)
        const existing = prev.find((i) => i.Barcode === data.Barcode);

        // Determine current STQtyIn (from state if exists, else from backend)
        const currentSTQtyIn = existing?.tiq ?? STOProduct.STQtyIn;

        // Check pending qty
        if (STOProduct.STQtyOut === currentSTQtyIn) {
          toast.error("No Pending Qty left for the given product");
          return prev;
        }

        // If valid, update state
      
          if (existing) {
            const newStkQty = currentSTQtyIn + 1;
            return prev.map((item) =>
              item.Barcode === data.Barcode
                ? {
                    ...item,
                    ...STOProduct,
                    STQtyIn: newStkQty,
                    tiq: newStkQty,
                  }
                : item
            );
          } else {
            return [
              { ...data, ...STOProduct, tiq: 1, STQtyIn: currentSTQtyIn + 1 },
              ...prev,
            ];
          }
        
      });

      setBarcode("");
    } catch (error) {
      toast.error("Product does not exist");
      setBarcode("");
    }
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
        locationId: customerStockTransferIn.locationId,
      });

      const data = res?.data?.data;

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
        const STOProduct = stockOutData?.data?.StockTransferInDetails?.find(
          (item) => item.FrameDetailId === selected.Id
        );

        if (!STOProduct) {
          toast.error("Product is not present in the selected Stock Transfer");
          return;
        }

        // Find existing item in state
        const existing = updated.find((i) => i.Barcode === selected.Barcode);

        // Use updated STQtyIn from state if exists, else from backend
        const currentSTQtyIn = existing?.tiq ?? STOProduct.STQtyIn;

        // Check pending qty with latest value
        if (STOProduct.STQtyOut === currentSTQtyIn) {
          toast.error("No Pending Qty left for the given product");
          return;
        }

        // If still pending
        if (STOProduct.STQtyOut > currentSTQtyIn) {
          
            if (existing) {
              const newStkQty = currentSTQtyIn + 1;

              updated = updated.map((item) =>
                item.Barcode === selected.Barcode
                  ? {
                      ...item,
                      ...STOProduct,
                      STQtyIn: newStkQty,
                      tiq: newStkQty,
                    }
                  : item
              );
            } else {
              updated = [
                {
                  ...selected,
                  ...STOProduct,
                  tiq: 1,
                  STQtyIn: currentSTQtyIn + 1,
                },
                ...updated,
              ];
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
    const avlQty = Number(items[index].STQtyOut);
    if (newQty > avlQty) {
      toast.error("TransferIn qty cannot exceed transferOut qty");
      return;
    }
    if (newQty < 0) {
      toast.error("Stock quantity must be greater than 0!");
      return;
    }
    setItems((prev) =>
      prev.map((i, idx) =>
        i.Barcode === barcode && idx === index ? { ...i, tiq: newQty } : i
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
          ? { ...i, BuyingPrice: newPrice }
          : i
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
            originalQty: item.tiq, // Store original quantity
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
                ? { ...i, tiq: prev[key].originalQty }
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

  const calculateStockGST = (item) => {
    if (!item) return 0;

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
  const handleSaveData = async () => {
    if (!Array.isArray(items) || items.length === 0) {
      console.warn("No details to save");
      return;
    }
    try {
      const payload = {
        STInMainId: stockTransferInDraftData.ID,
        STOutMainId: customerStockTransferIn.mainId,
        products: items.map((item) => {
          return {
            ProductType: 2,
            detailId: item.Id,
            BatchCode: null,
            STQtyIn: item.tiq,
            STQtyOut: item.STQtyOut,
            transferPrice: parseFloat(item.BuyingPrice),
            gstPercentage: calculateStockGST(item).gstPercent,
            srp: parseFloat(item.MRP),
          };
        }),
      };

      await saveStockTransfer({ payload }).unwrap();
      toast.success("Accessory transfer in successfully added");
      goToStockTransferInStep(4);
    } catch (error) {
      console.log(error);
    }
  };

  const filteredBrands = allBrands?.filter(
    (b) =>
      b.OthersProductsActive === 1 &&
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
                Step {currentStockTransferInStep}:{" "}
                {selectedStockTransferInProduct.label}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {searchMode
                  ? "Search by brand and model"
                  : "Scan or enter product barcode to add items"}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={prevStockTransferInStep}
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
                "s.no",
                "type",
                "product name",
                "transfer price",
                "transfer out qty",
                "transfer in qty",
                "gst",
                "total amount",
                "action",
              ]}
              data={items}
              renderRow={(item, index) => (
                <TableRow key={`${item.Barcode}-${index}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>ACC</TableCell>
                  <TableCell className="whitespace-pre-wrap">
                    <div>{item.Name}</div>
                    <div>Variation: {item.Variation}</div>

                    <div>Barcode: {item.Barcode}</div>
                  </TableCell>
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
                  <TableCell>{item.STQtyOut}</TableCell>
                  <TableCell>
                    ₹{formatINR(calculateStockGST(item).gstAmount)}(
                    {calculateStockGST(item).gstPercent}%)
                  </TableCell>
                  <TableCell>
                    ₹
                    {formatINR(
                      parseFloat(item.BuyingPrice) * item.tiq +
                        calculateStockGST(item).gstAmount * item.tiq
                    )}
                  </TableCell>
                  <TableCell>
                    {editMode[`${item.Barcode}-${index}`]?.qty ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.tiq}
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
                  <TableCell>{item.Variation}</TableCell>
                  <TableCell>{item.SKU}</TableCell>
                  <TableCell>{item.MRP}</TableCell>
                  <TableCell>{item.BuyingPrice}</TableCell>
                </TableRow>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessoryFrame;
