import React, { useState, useEffect } from "react";
import { useOrder } from "../../../features/OrderContext";
import {
  FiArrowLeft,
  FiEdit,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { Table, TableCell, TableRow } from "../../../components/Table";
import TextField from "@mui/material/TextField";
import { useGetAllBrandsQuery } from "../../../api/brandsApi";
import {
  useGetColourQuery,
  useGetModalitiesQuery,
  useGetPowerDetailsMutation,
  useGetProductNamesByModalityQuery,
} from "../../../api/orderApi";
import { Autocomplete } from "@mui/material";
import Input from "../../../components/Form/Input";
import { toast } from "react-hot-toast";
import Radio from "../../../components/Form/Radio";

import {
  useLazyGetBatchDetailsQuery,
  useSaveBatchDetailsMutation,
} from "../../../api/InvoiceApi";
import { useSelector } from "react-redux";
import { useGetBatchBarCodeMutation } from "../../../api/salesReturnApi";

// Validation helpers
const isMultipleOfQuarter = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && Math.abs(num * 100) % 25 === 0;
};

const isValidAxis = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num >= 1 && num <= 180;
};

const DisplayInformation = ({ items, onSave, isContactLensCreating }) => {
  const totalQty = items.reduce(
    (sum, item) => sum + Number(item.orderQty || 0),
    0
  );
  const totalAmount = items.reduce(
    (sum, item) =>
      sum + Number(item.sellingPrice || 0) * Number(item.orderQty || 0),
    0
  );

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Quantity</p>
            <p className="text-lg font-semibold text-gray-800">{totalQty}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Amount</p>
            <p className="text-lg font-semibold text-gray-800">
              ₹{totalAmount.toFixed(2)}
            </p>
          </div>
        </div>
        <Button
          onClick={onSave}
          isLoading={isContactLensCreating}
          className="bg-green-600 hover:bg-green-700"
          size="lg"
        >
          Save & Next
        </Button>
      </div>
    </div>
  );
};

const getProductName = (order) => {
  console.log("orr", order);
  const {
    ProductType,
    productName,
    ProductName,
    specs,
    barcode,
    Barcode,
    hSN,
    HSN,
    ExpiryDate,
    FittingPrice,
    FittingGSTPercentage,
    batchCode,
    BatchCode,
    CLBatchCode,
    colour,
    Colour,
    SphericalPower,
    CylindricalPower,
    Axis,
    Additional,
  } = order;

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

  if (ProductType === 3 || true) {
    // Assuming CL is type 3
    const name = clean(productName || ProductName);
    const hsn = clean(hSN || HSN || "");
    const barcodeVal = clean(barcode || Barcode);
    const expiry = clean(ExpiryDate);
    const batch = clean(batchCode || BatchCode || CLBatchCode);

    let specsObj = {};
    if (typeof specs === "string") {
      specs.split(",").forEach((pair) => {
        let [key, value] = pair.split(":").map((s) => s.trim());
        if (value === "null") value = null;
        specsObj[key] = value;
      });
    } else {
      specsObj = {
        Sph: SphericalPower,
        Cyld: CylindricalPower,
        Axis: Axis,
        Add: Additional,
      };
    }

    const sph = cleanPower(specsObj.Sph);
    const cyld = cleanPower(specsObj.Cyld);
    const axis = clean(specsObj.Axis);
    const addl = cleanPower(specsObj.Add);
    const clr = clean(colour || Colour);

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
      clr && `Color: ${clr}`,
      barcodeVal && `Barcode: ${barcodeVal}`,
      batch && `Batch Code: ${batch || "-"}`,
      expiry && `Expiry : ${expiry.split("-").reverse().join("/")}`,
      hsn && `HSN: ${hsn}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return "";
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
const ContactLens = () => {
  const {
    selectedSalesProduct,
    prevSalesStep,
    currentSalesStep,
    customerSalesId,
    draftData,
  } = useOrder();
  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const [searchFethed, setSearchFetched] = useState(false);
  const [items, setItems] = useState([]);
  const [mainClDetails, setMainClDetails] = useState([]);
  const [showInputRow, setShowInputRow] = useState(true);
  const [productSearch, setProductSearch] = useState(1); // Default to Enter Product Barcode
  const [selectBatch, setSelectBatch] = useState(0);
  const [selectedBatchCode, setSelectedBatchCode] = useState(null);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editReturnQty, setEditReturnQty] = useState("");
  const [editReturnPrice, setEditReturnPrice] = useState(""); // New state for editing price
  const [batchCodeInput, setbatchCodeInput] = useState("");
  const [productCodeInput, setProductCodeInput] = useState("");
  const [detailId, setDetailId] = useState(null);
  const [lensData, setLensData] = useState({
    orderReference: null,
    brandId: null,
    modalityId: null,
    productId: null,
    color: null,
  });

  const [newItem, setNewItem] = useState({
    CLDetailId: null,
    sphericalPower: null,
    cylindricalPower: null,
    axis: null,
    additional: null,
    avlQty: null,
    orderQty: null,
    sellingPrice: null,
    powerData: null,
  });

  const [errors, setErrors] = useState({});

  const { data: modalities, isLoading: modalitiesLoading } =
    useGetModalitiesQuery();
  const { data: allBrands } = useGetAllBrandsQuery();
  const { data: productNames, isLoading: isProductsLoading } =
    useGetProductNamesByModalityQuery(
      { brandId: lensData.brandId, modalityId: lensData.modalityId },
      { skip: !lensData.brandId || !lensData.modalityId }
    );

  const { data: colorData, isLoading: colorDataLoading } = useGetColourQuery(
    { clMainId: lensData.productId },
    { skip: !lensData.productId }
  );

  const [getPowerDetails, { isLoading: isPowerDetailsLoading }] =
    useGetPowerDetailsMutation();

  const [getBatches, { data: batchDetails }] = useLazyGetBatchDetailsQuery();

  const [
    getBatchBarCodeDetails,
    { data: batchBarCodeDetails, isLoading: isbatchBarLoading },
  ] = useGetBatchBarCodeMutation();

  const handleRefresh = () => {
    setLensData({
      orderReference: null,
      brandId: null,
      modalityId: null,
      productId: null,
      color: null,
    });
    setSearchFetched(false);
    setMainClDetails([]);
    setNewItem({
      CLDetailId: null,
      sphericalPower: null,
      cylindricalPower: null,
      axis: null,
      additional: null,
      avlQty: null,
      orderQty: null,
      sellingPrice: null,
      powerData: null,
    });
    setSelectedBatchCode(null);
    setProductSearch(1); // Reset to Enter Product Barcode
    setDetailId(false);
  };

  const handleRefeshPowerTable = () => {
    setNewItem({
      CLDetailId: "",
      sphericalPower: "",
      cylindricalPower: "",
      axis: "",
      additional: "",
      avlQty: "",
      orderQty: "",
      sellingPrice: "",
      powerData: "",
    });
    setErrors({});
    setSearchFetched(false);
  };

  const filteredBrands =
    allBrands?.filter(
      (brand) => brand.ContactLensActive === 1 && brand.IsActive === 1
    ) || [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));

    let message = "";

    if (["sphericalPower", "cylindricalPower", "additional"].includes(name)) {
      if (value && !isMultipleOfQuarter(value)) {
        message = "Power should only be in multiples of 0.25";
      }
    }

    if (name === "axis" && value && !isValidAxis(value)) {
      message = "Axis is incorrect";
    }

    if (name === "additional") {
      const additionalValue = parseFloat(value);
      if (value && (!isMultipleOfQuarter(value) || additionalValue < 0)) {
        message = "Additional power must be a positive multiple of 0.25";
      }
    }

    setErrors((prev) => ({ ...prev, [name]: message }));
  };

  const isFormValid = () => {
    const validationErrors = {};

    if (
      !newItem.sphericalPower ||
      !isMultipleOfQuarter(newItem.sphericalPower)
    ) {
      validationErrors.sphericalPower =
        "Power should only be in multiples of 0.25";
    }

    if (
      newItem.cylindricalPower &&
      !isMultipleOfQuarter(newItem.cylindricalPower)
    ) {
      validationErrors.cylindricalPower =
        "Power should only be in multiples of 0.25";
    }

    if (newItem.additional) {
      const additionalValue = parseFloat(newItem.additional);
      if (!isMultipleOfQuarter(additionalValue) || additionalValue < 0) {
        validationErrors.additional =
          "Additional power must be a positive multiple of 0.25";
      }
    }

    if (newItem.axis && !isValidAxis(newItem.axis)) {
      validationErrors.axis = "Axis is incorrect";
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleAdd = () => {
    if (!isFormValid()) return;

    const updatedItem = { ...newItem };

    const existingIndex = items.findIndex(
      (item) => item.CLDetailId === newItem.CLDetailId
    );

    let updatedItems;
    if (existingIndex >= 0) {
      updatedItems = [...items];
      updatedItems[existingIndex] = updatedItem;
    } else {
      updatedItems = [...items, updatedItem];
    }

    setItems(updatedItems);
    setShowInputRow(false);
    handleRefeshPowerTable();
  };

  const handleSearch = async () => {
    if (!newItem.sphericalPower) {
      toast.error("Please enter Spherical Power before searching.");
      return;
    }

    const payload = {
      CLMainId: lensData.productId,
      Spherical: parseFloat(newItem.sphericalPower),
      Cylindrical: parseFloat(newItem.cylindricalPower) || null,
      Axis: parseInt(newItem.axis) || null,
      Additional: parseInt(newItem.additional) || null,
      Colour: lensData.color || null,
      locationId: customerSalesId.locationId,
    };

    try {
      const response = await getPowerDetails({ payload }).unwrap();
      if (response?.data?.data) {
        const data = response.data.data;
        toast.success(`${response?.data.message}`);
        setNewItem({
          CLDetailId: data.CLDetailId,
          sphericalPower: data.SphericalPower,
          cylindricalPower: data.CylindricalPower,
          axis: data.Axis,
          additional: data.Additional,
          avlQty: parseInt(data.AvlQty),
          orderQty: data.DefaultOrderQty,
          sellingPrice: data.SellingPrice,
          powerData: data,
        });
        setSearchFetched(true);
        await getBatches({
          clBatchId: data.CLDetailId,
          locationId: hasMultipleLocations[0],
        }).unwrap();
        setDetailId(true);
      } else {
        setSearchFetched(false);
        toast.error("No matching power found");
        setDetailId(false);
      }
    } catch (error) {
      console.error("error", error);
      toast.error("No matching power found");
      setSearchFetched(false);
      setDetailId(false);
    }
  };

  const handleGetBatchBarCodeDetails = async () => {
    if (!batchCodeInput) {
      return;
    }
    try {
      const batches = batchDetails?.data?.batches;
      const isAvailable = batches?.find(
        (b) => b.CLBatchBarCode.toLowerCase() === batchCodeInput.toLowerCase()
      );
      if (isAvailable) {
        const newItemCl = {
          ...isAvailable,
          returnPrice: 1200,
          returnQty: 2,
        };
        setMainClDetails((prev) => [...prev, newItemCl]);

        setLensData({
          orderReference: null,
          brandId: null,
          modalityId: null,
          productId: null,
          color: null,
        });
        setSearchFetched(false);
        setNewItem({
          CLDetailId: null,
          sphericalPower: null,
          cylindricalPower: null,
          axis: null,
          additional: null,
          avlQty: null,
          orderQty: null,
          sellingPrice: null,
          powerData: null,
        });
        setSelectedBatchCode(null);
        setDetailId(false);
        setProductCodeInput("");
      } else {
        toast.error("Entered BatchBarcode is not exists!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleGetProductCodeDetails = async () => {
    if (!productCodeInput) {
      return;
    }
    try {
      const response = await getBatchBarCodeDetails(productCodeInput).unwrap();

      const batchCodeData = await getBatches({
        clBatchId: 23588,
        locationId: hasMultipleLocations[0],
      }).unwrap();
      setDetailId(true);
    } catch (error) {
      console.log(error);
      toast.error(error?.data.error);
    }
  };
  const handleSaveBatchData = () => {
    let sub;
    if (!detailId) {
      sub = {
        ...newItem.powerData,
        ...selectedBatchCode,
      };
    } else {
      sub = {
        ...batchBarCodeDetails?.data.data,
        ...selectedBatchCode,
      };
    }

    setMainClDetails((prev) => [...prev, sub]);

    setLensData({
      orderReference: null,
      brandId: null,
      modalityId: null,
      productId: null,
      color: null,
    });
    setSearchFetched(false);
    setNewItem({
      CLDetailId: null,
      sphericalPower: null,
      cylindricalPower: null,
      axis: null,
      additional: null,
      avlQty: null,
      orderQty: null,
      sellingPrice: null,
      powerData: null,
    });
    setSelectedBatchCode(null);
    setDetailId(false);
    setProductCodeInput("");
  };

  const handleDelete = (index) => {
    setMainClDetails((prev) => prev.filter((_, i) => i !== index));
  };

  const startEdit = (index, qty, price) => {
    setEditingIndex(index);
    setEditReturnQty(qty);
    setEditReturnPrice(price); // Initialize price for editing
  };

  const saveEdit = () => {
    const parsedQty = parseFloat(editReturnQty);
    const parsedPrice = parseFloat(editReturnPrice);
    const item = mainClDetails[editingIndex];
    if (parsedQty > item.Quantity) {
      toast.error("Sales return qty should not be greater than quantity");
      return;
    }
    if (parsedPrice > parseFloat(item.SellingPrice)) {
      toast.error(
        "Sales return price should not be greater than selling price"
      );
      return;
    }
    setMainClDetails((prev) =>
      prev.map((it, i) =>
        i === editingIndex
          ? { ...it, returnQty: editReturnQty, returnPrice: editReturnPrice }
          : it
      )
    );
    setEditingIndex(-1);
  };

  const cancelEdit = () => {
    setEditingIndex(-1);
  };

  const inputTableColumns = [
    "Spherical Power",
    "Cylindrical Power",
    "Axis",
    "Additional Power",
    "",
  ];

  if (newItem.CLDetailId && !searchFethed) {
    inputTableColumns.push("Avl.Qty", "Order Qty", "Action");
  }

  console.log("new item", newItem);
  return (
    <div className="max-w-7xl h-auto">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div></div>
            <div className="flex gap-3">
              <Button
                onClick={() => prevSalesStep()}
                icon={FiArrowLeft}
                variant="outline"
              >
                Back
              </Button>
              <Button onClick={handleRefresh}>Refresh</Button>
            </div>
          </div>
        </div>
        {mainClDetails.length > 0 && (
          <Table
            expand={true}
            columns={[
              "S.No",
              "Invoice no",
              "product type",
              "product details",
              "srp",
              "return price",
              "gst amt",
              "return qty",
              "total amount",
              "action",
            ]}
            data={mainClDetails}
            renderRow={(item, index) => (
              <TableRow>
                <TableCell>{index + 1}</TableCell>
                <TableCell></TableCell>
                <TableCell>CL</TableCell>
                <TableCell className="whitespace-pre-line">
                  {getProductName(item)}
                </TableCell>
                <TableCell>{item.CLMRP}</TableCell>
                <TableCell>
                  {editingIndex === index ? (
                    <Input
                      value={editReturnPrice}
                      onChange={(e) => setEditReturnPrice(e.target.value)}
                      type="number"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p>{item.returnPrice}</p>
                      <FiEdit
                        className="cursor-pointer"
                        onClick={() =>
                          startEdit(index, item.returnQty, item.returnPrice)
                        }
                      />
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  {calculateGST(parseFloat(item.returnPrice), 18).gstAmount}
                </TableCell>
                <TableCell>
                  {editingIndex === index ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editReturnQty}
                        onChange={(e) => setEditReturnQty(e.target.value)}
                        type="number"
                      />
                      <Button size="sm" onClick={saveEdit}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p>{item.returnQty}</p>
                      <FiEdit
                        className="cursor-pointer"
                        onClick={() =>
                          startEdit(index, item.returnQty, item.returnPrice)
                        }
                      />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  ₹
                  {(
                    parseFloat(item.returnPrice) * parseFloat(item.returnQty)
                  ).toFixed(2)}
                </TableCell>
                <TableCell>
                  <FiTrash2
                    className="text-red-500 hover:text-red-700 cursor-pointer"
                    onClick={() => handleDelete(index)}
                  />
                </TableCell>
              </TableRow>
            )}
          />
        )}
        <div className="p-6">
          <div className="flex items-center gap-4">
            <Radio
              name="productSearch"
              label="Enter Product Barcode"
              value="1"
              onChange={() => {
                setProductSearch(1);
              }}
              checked={productSearch === 1}
            />
            <Radio
              name="productSearch"
              label="Search Product"
              onChange={() => {
                setProductSearch(0);
              }}
              value="0"
              checked={productSearch === 0}
            />
          </div>
        </div>

        {productSearch === 0 && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Brand
                </label>
                <Autocomplete
                  options={filteredBrands || []}
                  getOptionLabel={(option) => option.BrandName || ""}
                  value={
                    allBrands?.find((brand) => brand.Id === lensData.brandId) ||
                    null
                  }
                  onChange={(_, newValue) => {
                    setLensData((prev) => ({
                      ...prev,
                      brandId: newValue?.Id || null,
                      modalityId: null,
                      productId: null,
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search or select brand"
                      size="small"
                    />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  disabled={lensData.modalityId}
                />
              </div>

              {lensData.brandId && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Modality
                  </label>
                  <Autocomplete
                    options={modalities?.data || []}
                    getOptionLabel={(option) => option.ModalityName || ""}
                    value={
                      modalities?.data.find(
                        (modality) => modality.Id === lensData.modalityId
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      setLensData((prev) => ({
                        ...prev,
                        modalityId: newValue?.Id || null,
                        productId: null,
                      }));
                    }}
                    loading={modalitiesLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search or select modality"
                        size="small"
                      />
                    )}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    disabled={lensData.productId}
                  />
                </div>
              )}

              {lensData.modalityId && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Name
                  </label>
                  <Autocomplete
                    options={productNames?.data?.data || []}
                    getOptionLabel={(option) => option.ProductName || ""}
                    value={
                      productNames?.data.data.find(
                        (product) => product.Id === lensData.productId
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      setLensData((prev) => ({
                        ...prev,
                        productId: newValue?.Id || null,
                      }));
                    }}
                    loading={isProductsLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search or select product"
                        size="small"
                      />
                    )}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                  />
                </div>
              )}
              {lensData.productId && colorData?.data?.data.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Colour
                  </label>
                  <Autocomplete
                    options={colorData?.data?.data || []}
                    getOptionLabel={(option) => option.Colour || ""}
                    value={
                      colorData?.data.data.find(
                        (product) => product.Colour === lensData.color
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      setLensData((prev) => ({
                        ...prev,
                        color: newValue?.Colour || null,
                      }));
                    }}
                    loading={colorDataLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search or select color"
                        size="small"
                      />
                    )}
                    isOptionEqualToValue={(option, value) =>
                      option.Color === value.Color
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {lensData.productId && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Power Details</h2>
              <div className="flex gap-4">
                <Button
                  onClick={handleRefeshPowerTable}
                  icon={FiRefreshCw}
                  variant="outline"
                />
              </div>
            </div>

            {showInputRow && (
              <Table
                columns={inputTableColumns}
                data={[{}]}
                renderRow={() => (
                  <TableRow key=" Power Details">
                    <TableCell>
                      <Input
                        name="sphericalPower"
                        value={newItem.sphericalPower}
                        onChange={handleInputChange}
                        error={errors.sphericalPower}
                        grayOut={searchFethed}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        name="cylindricalPower"
                        value={newItem.cylindricalPower}
                        onChange={handleInputChange}
                        error={errors.cylindricalPower}
                        grayOut={searchFethed}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        name="axis"
                        value={newItem.axis}
                        onChange={handleInputChange}
                        error={errors.axis}
                        grayOut={searchFethed}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        name="additional"
                        value={newItem.additional}
                        onChange={handleInputChange}
                        error={errors.additional}
                        grayOut={searchFethed}
                      />
                    </TableCell>

                    {newItem.CLDetailId && !searchFethed && (
                      <>
                        <TableCell>
                          <Input
                            name="avlQty"
                            value={newItem.avlQty}
                            onChange={handleInputChange}
                            error={errors.avlQty}
                            grayOut={searchFethed}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            name="orderQty"
                            value={newItem.orderQty}
                            onChange={handleInputChange}
                            error={errors.orderQty}
                          />
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button size="sm" onClick={handleAdd}>
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRefeshPowerTable}
                          >
                            Cancel
                          </Button>
                        </TableCell>
                      </>
                    )}
                    {!newItem.CLDetailId && (
                      <TableCell className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSearch}
                          disabled={isPowerDetailsLoading}
                          variant="outline"
                        >
                          {isPowerDetailsLoading ? "Searching..." : "Search"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )}
              />
            )}
          </div>
        )}

        {productSearch === 1 && (
          <div className="p-6">
            <div className="w-full flex items-center gap-4">
              <Input
                value={productCodeInput}
                onChange={(e) => setProductCodeInput(e.target.value)}
                label="Enter Product Barcode"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleGetProductCodeDetails();
                  }
                }}
              />
              <Button onClick={handleGetProductCodeDetails}>Search</Button>
            </div>
          </div>
        )}

        {detailId && (
          <div className="p-6">
            <div className="flex items-center gap-4">
              <Radio
                name="selectBatch"
                label="Select Batch Code"
                onChange={() => setSelectBatch(0)}
                value="0"
                checked={selectBatch === 0}
              />
              <Radio
                name="selectBatch"
                label="Scan Batch BarCode"
                value="1"
                onChange={() => {
                  setSelectBatch(1);
                  setSelectedBatchCode(null);
                }}
                checked={selectBatch === 1}
              />
            </div>

            {batchDetails?.data?.batches && selectBatch === 0 && (
              <div className="w-1/3 mt-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select by BatchCode
                  </label>
                  <Autocomplete
                    options={batchDetails?.data?.batches || []}
                    getOptionLabel={(option) => option.CLBatchCode || ""}
                    value={
                      batchDetails?.data?.batches?.find(
                        (batch) =>
                          batch.CLBatchCode === selectedBatchCode?.CLBatchCode
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      setSelectedBatchCode(newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search or select BatchCode"
                        size="small"
                      />
                    )}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                  />
                </div>
              </div>
            )}
            {selectBatch === 1 && (
              <div className="w-1/2 mt-5 flex items-center gap-4">
                <Input
                  value={batchCodeInput}
                  onChange={(e) => setbatchCodeInput(e.target.value)}
                  label="Enter BatchBarCode"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleGetBatchBarCodeDetails();
                    }
                  }}
                />
                <Button onClick={handleGetBatchBarCodeDetails}>Search</Button>
              </div>
            )}

            {selectedBatchCode && (
              <Button className="w-[200px]" onClick={handleSaveBatchData}>
                Save
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactLens;
