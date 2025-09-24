import React, { useState, useMemo, useEffect } from "react";
import { useOrder } from "../../../features/OrderContext";
import Button from "../../../components/ui/Button";
import { FiArrowLeft, FiSearch, FiX } from "react-icons/fi";
import Input from "../../../components/Form/Input";
import { isValidNumericInput } from "../../../utils/isValidNumericInput";
import Radio from "../../../components/Form/Radio";
import { useGetAllBrandsQuery } from "../../../api/brandsApi";
import Checkbox from "../../../components/Form/Checkbox";
import toast from "react-hot-toast";
import {
  useLazyGetByBarCodeQuery,
  useLazyGetByBrandAndModalQuery,
} from "../../../api/orderApi";
import { Autocomplete, TextField } from "@mui/material";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { useSaveOfferProductMutation } from "../../../api/offerApi";
import { useGetAllBrandGroupsQuery } from "../../../api/brandGroup";
import { useNavigate } from "react-router";

const brandsLevelItemsFirstRow = [
  { value: 1, label: "Both" },
  { value: 2, label: "Frames" },
  { value: 3, label: "Sunglass" },
];

const brandLevelItemsSecondRow = [
  { value: 1, label: "All Brands" },
  { value: 2, label: "Selected" },
];
const FrameSunglass = () => {
  const {
    currentOfferStep,
    selectedOfferProduct,
    prevOfferStep,
    customerOffer,
    goToOfferStep,
    updateCurrentOfferStep
  } = useOrder();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [level, setLevel] = useState(0);

  const [selectedSubLevelBrandFirstRow, setSelectedSubLevelBrandFirstRow] =
    useState(1);
  const [selectedSubLevelBrandSecondRow, setSelectedSubLevelBrandSecondRow] =
    useState(1);

  const [selectedBrands, setSelectedBrands] = useState({});
  const [discountPV, setDiscountPV] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [barcode, setBarcode] = useState("");
  const [items, setItems] = useState([]);
  const [searchMode, setSearchMode] = useState(false);
  const [brandInput, setBrandInput] = useState(""); // for user typing
  const [brandId, setBrandId] = useState(null); // selected BrandGroupID
  const [modelNo, setModelNo] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const { data: allBrandsData, isLoading: isLoadingAllBrands } =
    useGetAllBrandsQuery();
  const { data: allBrands } = useGetAllBrandsQuery();

  const [
    fetchByBarcode,
    { isLoading: isBarcodeLoading, isFetching: isBarCodeFetching },
  ] = useLazyGetByBarCodeQuery();
  const [
    fetchByBrandModal,
    { isLoading: isBrandModelLoading, isFetching: isBrandAndModalFetching },
  ] = useLazyGetByBrandAndModalQuery();
  const [saveFrame, { isLoading: isFrameSaving }] =
    useSaveOfferProductMutation();
  const { data: allBrandGroups } = useGetAllBrandGroupsQuery();
  useEffect(() => {
    setDiscountValue("");
  }, [discountPV]);

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode) return;
    const res = await fetchByBarcode({
      barcode,
      locationId: customerOffer.locationId || 2,
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
        return [{ ...data, Quantity: 1 }, ...prev];
      });
    } else {
      toast.error(`Barcode doesn't exist!`);
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
        locationId: customerOffer.locationId || 2,
      });

      const data = res?.data?.data;

      if (data && data.length > 0) {
        setSearchResults(data);
        setBrandInput("");
        setBrandId(null);
        setModelNo("");
        setSearchMode(false);
      } else {
        toast.error(res?.data?.message || "No matching products found!");
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
  const handleDelete = (barcode) => {
    setItems((prev) => prev.filter((i) => i.Barcode !== barcode));
    setSelectedRows((prev) => prev.filter((i) => i.Barcode !== barcode));
  };
  // Filter active frame brands
  const frameBrands = useMemo(() => {
    if (!allBrandsData) return [];
    return allBrandsData.filter((b) => b.IsActive === 1 && b.FrameActive === 1);
  }, [allBrandsData]);

  // Group brands by BrandGroupID
  const groupedBrands = useMemo(() => {
    const groups = {};
    frameBrands.forEach((brand) => {
      if (!groups[brand.BrandGroupID]) groups[brand.BrandGroupID] = [];
      groups[brand.BrandGroupID].push(brand);
    });
    return groups;
  }, [frameBrands]);

  // Handle group selection
  const toggleGroup = (groupId) => {
    const brandsInGroup = groupedBrands[groupId].map((b) => b.Id);
    const allSelected = brandsInGroup.every((id) => selectedBrands[id]);

    const newSelectedBrands = { ...selectedBrands };
    brandsInGroup.forEach((id) => {
      if (allSelected) {
        delete newSelectedBrands[id];
      } else {
        newSelectedBrands[id] = true;
      }
    });
    setSelectedBrands(newSelectedBrands);
  };
  const handleRefresh = () => {
    setQuantity("");
    setDiscountPV(1);
    setDiscountValue("");
    setItems([]);
    setLevel(0);
  };

  const toggleBrand = (brandId) => {
    setSelectedBrands((prev) => ({
      ...prev,
      [brandId]: !prev[brandId],
    }));
  };
  const filteredBrands = allBrands?.filter(
    (b) =>
      b.FrameActive === 1 &&
      b.IsActive === 1 &&
      b.BrandName.toLowerCase().includes(brandInput.toLowerCase())
  );

  const handleSave = async () => {
    if (!quantity) {
      toast.error("Please Enter qty");
      return;
    }
    if (!discountValue) {
      toast.error("Please Enter discount");
      return;
    }
    const frameCategoryMap = {
      2: 0, // Frames
      3: 1, // Sunglass
      1: null, // Both
    };
    console.log("fra", selectedSubLevelBrandFirstRow);
    const payload = {
      OfferMainId: customerOffer.offerMainId,
      ProductType: 1,
      Qty: parseInt(quantity),
      DiscountType: discountPV, //
      DiscountPerct: discountPV === 0 ? parseFloat(discountValue) : null,
      DiscountValue: discountPV === 1 ? parseFloat(discountValue) : null,
      BrandId:
        selectedSubLevelBrandSecondRow === 2 && level === 0
          ? Object.entries(selectedBrands)
              .filter(([key, val]) => val)
              .map(([key]) => parseInt(key))
          : null,

      FrameDetailID: items.length > 0 ? items.map((item) => item.Id) : null,
      FrameCategory:
        frameCategoryMap[Number(selectedSubLevelBrandFirstRow)] ?? null,
    };

    const finalPayload = {
      entries: [payload],
    };

    try {
      await saveFrame(finalPayload).unwrap();
      toast.success("Offer Frame product successfully created");
      updateCurrentOfferStep(1)
      navigate("/offer");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="max-w-8xl h-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Header */}
        <div className=" flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            Step {currentOfferStep}: {selectedOfferProduct.label}
          </h1>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={prevOfferStep}
              icon={FiArrowLeft}
              variant="outline"
            >
              Back
            </Button>
            <Button onClick={handleRefresh}>Refresh</Button>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex gap-5">
            <Input
              type="number"
              className="w-1/2"
              value={quantity}
              label="Minimum Qty to Order"
              onChange={(e) => {
                const val = e.target.value;
                if (isValidNumericInput(val)) setQuantity(val);
              }}
            />
            {/* discount section */}
            <div>
              <div className="flex items-center gap-5">
                <Radio
                  name="discount"
                  value="1"
                  onChange={() => setDiscountPV(1)}
                  checked={discountPV === 1}
                  label="Discount Value"
                />
                <Radio
                  name="discount"
                  value="0"
                  onChange={() => setDiscountPV(0)}
                  checked={discountPV === 0}
                  label="Discount Percentage%"
                />
              </div>

              <div className="mt-1">
                <Input
                  type="number"
                  className=""
                  placeholder={
                    discountPV === 1
                      ? "Enter Discount Value"
                      : "Enter Discount Percentage %"
                  }
                  value={discountValue}
                  onChange={(e) => {
                    const val = e.target.value;

                    // Allow clearing
                    if (val === "") {
                      setDiscountValue("");
                      return;
                    }

                    if (!isValidNumericInput(val)) return;

                    if (discountPV === 0 && parseFloat(val) > 100) {
                      toast.error("Percentage cannot exceed 100!");
                      return;
                    }

                    setDiscountValue(val);
                  }}
                />
              </div>
            </div>
          </div>
          {/* Level Selection */}
          <div className="flex items-center gap-5 mt-5">
            <Radio
              name="level"
              value="0"
              onChange={() => setLevel(0)}
              checked={level === 0}
              label="Brand/Category Level"
            />
            <Radio
              name="level"
              value="1"
              onChange={() => setLevel(1)}
              checked={level === 1}
              label="Item Level"
            />
          </div>

          {level === 0 && (
            <>
              <div className="grid grid-cols-3 gap-3 w-1/2 mt-5">
                {brandsLevelItemsFirstRow.map((item) => (
                  <Radio
                    key={item.value}
                    name="BrandFirst"
                    value={item.value}
                    onChange={() =>
                      setSelectedSubLevelBrandFirstRow(item.value)
                    }
                    checked={selectedSubLevelBrandFirstRow == item.value}
                    label={item.label}
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 w-1/2 mt-5">
                {brandLevelItemsSecondRow.map((item) => (
                  <Radio
                    key={item.value}
                    name="BrandSecond"
                    value={item.value}
                    onChange={() =>
                      setSelectedSubLevelBrandSecondRow(item.value)
                    }
                    checked={selectedSubLevelBrandSecondRow == item.value}
                    label={item.label}
                  />
                ))}
              </div>
            </>
          )}
          {level === 1 && (
            <>
              <div className="py-3 border-gray-100">
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
                        Search by Brand & Model *
                      </label>
                      <div className="flex gap-2">
                        <Autocomplete
                          options={filteredBrands}
                          getOptionLabel={(option) => option.BrandName}
                          onInputChange={(event, value) => {
                            setBrandInput(value);
                            // setShowBrandDropdown(true);
                          }}
                          onChange={(event, newValue) => {
                            if (newValue) {
                              setBrandInput(newValue.BrandName);
                              setBrandId(newValue.Id);
                              //   setShowBrandDropdown(false);
                            }
                          }}
                          //   value={
                          //     filteredBrands.find((b) => b.BrandName ===) ||
                          //     null
                          //   }
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
                          isLoading={
                            isBrandModelLoading || isBrandAndModalFetching
                          }
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
                <div className="">
                  <Table
                    columns={[
                      "S.No",
                      "Barcode",
                      "Name",
                      "Frame Size",
                      "S/O",
                      "Product details",
                      "MRP",
                      "Selling Price",
                    ]}
                    data={items}
                    renderRow={(item, index) => (
                      <TableRow key={item.Barcode}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.Barcode}</TableCell>
                        <TableCell>{item.Name}</TableCell>
                        <TableCell>{item.Size}</TableCell>
                        <TableCell>
                          {item.Category == "O" ? "Optical Frame" : "Sunglass"}
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

              {!searchMode && searchResults.length > 0 && (
                <div className="mt-4">
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
                      "pRODUCR DETAILS",
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
                        <TableCell>{item.Size}</TableCell>
                        <TableCell>
                          {item.Category == 0 ? "Optical Frame" : "Sunglass"}
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
            </>
          )}
          {/* Selected Brands Section */}
          {selectedSubLevelBrandSecondRow === 2 && level === 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {isLoadingAllBrands ? (
                <p>Loading brands...</p>
              ) : (
                Object.entries(groupedBrands).map(([groupId, brands]) => (
                  <div
                    key={groupId}
                    className="border border-neutral-300 rounded-lg p-4 mb-4 shadow-sm"
                  >
                    {/* Group Checkbox */}
                    <Checkbox
                      label={`${
                        allBrandGroups?.data?.find((item) => item.Id == groupId)
                          ?.BrandGroupName || ""
                      }`}
                      checked={brands.every((b) => selectedBrands[b.Id])}
                      onChange={() => toggleGroup(groupId)}
                    />

                    {/* Brands under this group */}
                    <div className="ml-6 mt-2 grid grid-cols-2 gap-2">
                      {brands.map((brand) => (
                        <Checkbox
                          key={brand.Id}
                          label={brand.BrandName}
                          checked={!!selectedBrands[brand.Id]}
                          onChange={() => toggleBrand(brand.Id)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="mt-5">
            <Button
              onClick={handleSave}
              isLoading={isFrameSaving}
              disabled={isFrameSaving}
            >
              Create Offer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrameSunglass;
