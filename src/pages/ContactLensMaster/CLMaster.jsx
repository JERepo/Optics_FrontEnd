import React, { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import { useNavigate, useParams } from "react-router";
import { Autocomplete, TextField } from "@mui/material";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useGetModalitiesQuery } from "../../api/orderApi";
import Input from "../../components/Form/Input";
import Radio from "../../components/Form/Radio";
import {
  useCreateCLMasterMutation,
  useGetCLMasterByIdQuery,
  useGetMaterialsQuery,
  useLazyGetCLMasterFileQuery,
  useUpdateCLMasterMutation,
} from "../../api/contactlensMaster";
import { useGetTaxQuery } from "../../api/accessoriesMaster";
import { LuIndianRupee } from "react-icons/lu";
import { FiGlobe, FiPlus } from "react-icons/fi";
import { useGetAllLocationsQuery } from "../../api/roleManagementApi";
import toast from "react-hot-toast";
import { Table, TableCell, TableRow } from "../../components/Table";
import { useSelector } from "react-redux";
import Loader from "../../components/ui/Loader";

const powerTypes = [
  { value: 1, label: "Spherical" },
  { value: 2, label: "Astigmatism" },
  { value: 3, label: "Progressive" },
];

const productTypes = [
  { value: 0, label: "Stock" },
  { value: 1, label: "Rx" },
];

const CLMaster = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [isDragging, setIsDragging] = useState(false);

  const [pricing, setPricing] = useState([]);
  const [applyAll, setApplyAll] = useState({
    buyingPrice: "",
    sellingPrice: "",
  });
  const [items, setItems] = useState([]);
  const [isClOpen, setClOpen] = useState(false);

  // Lens master data
  const [lensData, setLensData] = useState({
    powerType: null,
    brandId: null,
    modality: null,
    productCode: "",
    productName: "",
    baseCurve: "",
    diameter: "",
    inventory: 0,
    material: null,
    productType: null,
    hsnCode: "",
    taxPercentage: null,
    mrp: "",
    excel: 0,
    selectedFile: null,
  });

  const [clDetails, setClDetails] = useState({
    skucode: null,
    barCode: null,
    sph: null,
    cyl: null,
    axis: null,
    addl: null,
    clr: null,
  });

  const [errors, setErrors] = useState({});

  const { data: allLocations } = useGetAllLocationsQuery();
  const { data: allBrandsData, isLoading: isLoadingAllBrands } =
    useGetAllBrandsQuery();
  const { data: modalities, isLoading: modalitiesLoading } =
    useGetModalitiesQuery();
  const { data: materialsData, isLoading: materialLoading } =
    useGetMaterialsQuery();
  const { data: allTax, isLoading: allTaxLoading } = useGetTaxQuery();
  const [getSampleFile, { isFetching: isSheetFetching }] =
    useLazyGetCLMasterFileQuery();
  const [saveCLMaster, { isLoading: isCLMasterCreating }] =
    useCreateCLMasterMutation();
  const { data: clData, isLoading: isCLLoading } = useGetCLMasterByIdQuery(
    { id: id },
    { skip: !id }
  );
  const [updateMaster, { isLoading: isMasterUpdating }] =
    useUpdateCLMasterMutation();
  console.log(clData?.data);
  useEffect(() => {
    if (id && clData?.data && !isCLLoading) {
      const data = clData?.data;
      setLensData({
        powerType: data.PowerType || null,
        brandId: data.BrandID || null,
        modality: data.Modality || null,
        productCode: data.ProductCode || "",
        productName: data.ProductName || "",
        baseCurve: data.BaseCurve ? data.BaseCurve.toString() : "",
        diameter: data.Diameter ? data.Diameter.toString() : "",
        inventory: data.StockType ? 1 : 0,
        material: data.MaterialID || null,
        productType: data.Type || null,
        hsnCode: data.HSN || "",
        taxPercentage: data.TaxID || null,
        mrp: data.prices ? data.prices.MRP.toString() : "",
        excel: data?.FileUploaded ? 1 : 0,
        selectedFile: null,
      });

      // Prefill contact lens details
      if (data.details && data.details.length > 0) {
        setItems(
          data.details.map((item) => ({
            skucode: item.SKUCode || null,
            barCode: item.Barcode || null,
            sph: item.SphericalPower ? item.SphericalPower.toString() : null,
            cyl: item.CylindricalPower
              ? item.CylindricalPower.toString()
              : null,
            axis: item.Axis ? item.Axis.toString() : null,
            addl: item.Additional ? item.Additional.toString() : null,
            clr: item.Colour || null,
          }))
        );
      }

      if (data.prices) {
        const pricingData = Object.keys(data.prices)
          .filter((key) => key.startsWith("BuyingPrice"))
          .map((key) => {
            const index = parseInt(key.replace("BuyingPrice", ""), 10); // 1,2,3...
            return {
              id: index, // locationId
              location: `Location ${index}`, // you can replace with real name from allLocations
              buyingPrice: data.prices[`BuyingPrice${index}`] || "",
              sellingPrice: data.prices[`SellingPrice${index}`] || "",
            };
          });

        setPricing(pricingData);
      }
    }
  }, [id, clData, isCLLoading, allLocations]);
  // Initialize pricing for all locations

  useEffect(() => {
    if (allLocations?.data?.length && pricing.length === 0) {
      const initialPricing = allLocations.data.map((loc) => ({
        id: loc.Id,
        location: loc.LocationName,
        buyingPrice: "",
        sellingPrice: "",
      }));
      setPricing(initialPricing);
    }
  }, [allLocations, pricing.length]);

  const handleApplyToAll = (field, value) => {
    setPricing((prev) => prev.map((row) => ({ ...row, [field]: value })));
    setErrors((prev) => {
      const newErrors = { ...prev };
      pricing.forEach((_, idx) => {
        delete newErrors[`pricing_${field}_${idx}`];
        delete newErrors[`pricing_compare_${idx}`];
      });
      return newErrors;
    });
  };

  const handlePriceChange = (idx, field, val) => {
    const sanitized = val.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;

    const updated = [...pricing];
    updated[idx][field] = sanitized;
    setPricing(updated);

    const errorKey = `pricing_${field}_${idx}`;
    const compareKey = `pricing_compare_${idx}`;
    if (errors[errorKey] || errors[compareKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        delete newErrors[compareKey];
        return newErrors;
      });
    }
  };

  // Input change handler for lensData
  const handleInputChange = (field, value) => {
    setLensData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Clear items when switching to Excel mode
    if (field === "excel" && value === 1) {
      setItems([]);
      setClOpen(false);
    }
    // Clear selectedFile when switching to manual mode
    if (field === "excel" && value === 0) {
      setLensData((prev) => ({ ...prev, selectedFile: null }));
    }
  };

  const handleCLChange = (e) => {
    const { name, value } = e.target;
    setClDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (file) => {
    if (!file) return;

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload .xlsx, .xls, or .csv");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB");
      return;
    }

    // Clear manual items when a file is uploaded
    setItems([]);
    setClOpen(false);
    handleInputChange("selectedFile", file);
    toast.success("File uploaded successfully!");
  };

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadSampleFile = async () => {
    try {
      const blob = await getSampleFile().unwrap();
      downloadFile(blob, "CLMaster.xlsx");
      toast.success("Sample file downloaded successfully!");
    } catch (error) {
      toast.error(
        error?.data?.error || error?.error?.message || "Download failed"
      );
    }
  };

  const handleRefresh = () => {
    setLensData({
      powerType: null,
      brandId: null,
      modality: null,
      productCode: "",
      productName: "",
      baseCurve: "",
      diameter: "",
      inventory: 0,
      material: null,
      productType: null,
      hsnCode: "",
      taxPercentage: null,
      mrp: "",
      excel: 0,
      selectedFile: null,
    });
    setClDetails({
      skucode: null,
      barCode: null,
      sph: null,
      cyl: null,
      axis: null,
      addl: null,
      clr: null,
    });
    setErrors({});
    setItems([]);
    setApplyAll({
      buyingPrice: "",
      sellingPrice: "",
    });
    setPricing([]);
  };

  const validateForm = () => {
    const newErrors = {};

    // Product Code
    if (!lensData.productCode?.trim()) {
      newErrors.productCode = "Product code is required";
    } else if (lensData.productCode.length > 30) {
      newErrors.productCode = "Max 30 characters allowed";
    }

    // Product Name
    if (!lensData.productName?.trim()) {
      newErrors.productName = "Product name is required";
    } else if (lensData.productName.length > 100) {
      newErrors.productName = "Max 100 characters allowed";
    }

    // Power Type
    if (!lensData.powerType) {
      newErrors.powerType = "Power type is required";
    } else if (![1, 2, 3].includes(lensData.powerType)) {
      newErrors.powerType = "Invalid power type";
    }

    // Stock Type (ProductType in UI)
    if (lensData.productType === null || lensData.productType === undefined) {
      newErrors.productType = "Stock type is required";
    } else if (![0, 1].includes(lensData.productType)) {
      newErrors.productType = "Invalid stock type";
    }

    // Base Curve
    if (!lensData.baseCurve) {
      newErrors.baseCurve = "Base curve is required";
    } else if (!/^\d{1,2}(\.\d{1,2})?$/.test(lensData.baseCurve)) {
      newErrors.baseCurve = "Must be decimal with up to 2 decimals";
    }

    // Diameter
    if (!lensData.diameter) {
      newErrors.diameter = "Diameter is required";
    } else if (!/^\d{1,2}(\.\d{1,2})?$/.test(lensData.diameter)) {
      newErrors.diameter = "Must be decimal with up to 2 decimals";
    }

    // HSN Code
    if (!lensData.hsnCode?.trim()) {
      newErrors.hsnCode = "HSN code is required";
    } else if (!/^[A-Za-z0-9]{8}$/.test(lensData.hsnCode)) {
      newErrors.hsnCode = "Must be exactly 8 characters";
    }

    // Brand
    if (!lensData.brandId) {
      newErrors.brandId = "Brand is required";
    }

    // Modality
    if (!lensData.modality) {
      newErrors.modality = "Modality is required";
    }

    // Material
    if (!lensData.material) {
      newErrors.material = "Material is required";
    }

    // Tax
    if (!lensData.taxPercentage) {
      newErrors.taxPercentage = "Tax percentage is required";
    }

    // MRP
    if (!lensData.mrp) {
      newErrors.mrp = "MRP is required";
    } else if (isNaN(lensData.mrp) || Number(lensData.mrp) <= 0) {
      newErrors.mrp = "MRP must be a positive number";
    }

    // Pricing Validation
    pricing.forEach((row, idx) => {
      const buy = parseFloat(row.buyingPrice);
      const sell = parseFloat(row.sellingPrice);

      if (!buy || isNaN(buy)) {
        newErrors[
          `pricing_buying_${idx}`
        ] = `Buying price is required for ${row.location}`;
      }
      if (!sell || isNaN(sell)) {
        newErrors[
          `pricing_selling_${idx}`
        ] = `Selling price is required for ${row.location}`;
      }
      if (!isNaN(buy) && !isNaN(sell) && sell <= buy) {
        newErrors[
          `pricing_compare_${idx}`
        ] = `Selling price must be greater than buying price for ${row.location}`;
      }
    });

    // Contact Lens Details or File Validation
    if (lensData.excel === 1 && !lensData.selectedFile) {
      newErrors.selectedFile = "Please upload an Excel file";
    }
    if (lensData.excel === 0 && items.length === 0) {
      newErrors.items = "Please add at least one contact lens detail manually";
    }
    if (lensData.excel === 1 && items.length > 0) {
      newErrors.mode =
        "Cannot use both Excel upload and manual details. Please choose one method.";
    }
    if (lensData.excel === 0 && lensData.selectedFile) {
      newErrors.mode =
        "Cannot use both Excel upload and manual details. Please choose one method.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, clDetails]);
    setClDetails({
      skucode: null,
      barCode: null,
      sph: null,
      cyl: null,
      axis: null,
      addl: null,
      clr: null,
    });
    setClOpen(false);
    // Clear selected file when adding manual details
    handleInputChange("selectedFile", null);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error(errors.mode || "Please fix the errors in the form");
      return;
    }

    // If file is required but not uploaded, stop
    if (lensData.excel === 1 && !lensData.selectedFile) {
      toast.error("Please upload an Excel file before saving");
      return;
    }

    try {
      let payloadToSend;

      if (lensData.excel === 1 && lensData.selectedFile) {
        const formData = new FormData();
        formData.append("powerType", lensData.powerType || "");
        formData.append("BrandID", lensData.brandId || "");
        formData.append("Modality", lensData.modality || "");
        formData.append("ProductCode", lensData.productCode || "");
        formData.append("ProductName", lensData.productName || "");
        formData.append("BaseCurve", lensData.baseCurve || "");
        formData.append("Diameter", lensData.diameter || "");
        formData.append("HSN", lensData.hsnCode || "");
        formData.append("MaterialID", lensData.material || "");
        formData.append("Type", lensData.productType || "");
        formData.append("TaxID", lensData.taxPercentage || "");
        formData.append("ApplicationUserId", user.Id || "");
        formData.append("IsActive", 1);
        formData.append("MRP", parseFloat(lensData.mrp) || 0);
        if (id) formData.append("Id", parseInt(id));

        if (pricing?.length) {
          formData.append(
            "prices",
            JSON.stringify(
              pricing.map((row) => ({
                locationId: row.id,
                buying: parseFloat(row.buyingPrice) || 0,
                selling: parseFloat(row.sellingPrice) || 0,
              }))
            )
          );
        }

        formData.append("file", lensData.selectedFile);

        payloadToSend = formData;
      } else {
        let details = [];
        if (lensData.excel === 0 && items?.length) {
          details = items.map((item) => ({
            SKUCode: item.skucode || "",
            Barcode: item.barCode || "",
            SphericalPower: parseFloat(item.sph) || 0,
            CylindricalPower: parseFloat(item.cyl) || 0,
            Axis: parseInt(item.axis) || 0,
            Additional: parseFloat(item.addl) || 0,
            Colour: item.clr || "",
          }));
        }
        payloadToSend = {
          powerType: lensData.powerType,
          BrandID: lensData.brandId,
          Modality: lensData.modality,
          ProductCode: lensData.productCode,
          ProductName: lensData.productName,
          BaseCurve: lensData.baseCurve,
          Diameter: lensData.diameter,
          HSN: lensData.hsnCode,
          MaterialID: lensData.material,
          Type: lensData.productType,
          TaxID: lensData.taxPercentage,
          ApplicationUserId: user.Id,
          IsActive: 1,
          MRP: parseFloat(lensData.mrp) || 0,
          details,
          prices: pricing.map((row) => ({
            locationId: row.id,
            buying: parseFloat(row.buyingPrice) || 0,
            selling: parseFloat(row.sellingPrice) || 0,
          })),
        };
        if (id) payloadToSend.Id = parseInt(id);
      }
      if (id) {
        await updateMaster({
          masterId: parseInt(id),
          payload: payloadToSend,
        }).unwrap();
      } else {
        await saveCLMaster({ payload: payloadToSend }).unwrap();
      }

      toast.success(`Contact lens ${id ? "updated" : "saved"} successfully!`);
      handleRefresh();
      navigate("/contact-lens-master")
    } catch (error) {
      toast.error(error?.data?.message || "Failed to save Contact Lens Master");
    }
  };

    if (isCLLoading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <Loader color="black" width="w-10" height="h-10" />
        </div>
      );
    }

  return (
    <div>
      <div className="max-w-8xl">
        <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6">
          <div className="flex justify-between items-center mb-3">
            <div className="text-neutral-800 text-2xl font-semibold">
              Contact Lens Master
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate("/contact-lens-master")}>
                Back
              </Button>
            </div>
          </div>

          <div>
            <div className="flex flex-col gap-5">
              {/* First row */}
              <div className="grid grid-cols-3 gap-5">
                <Autocomplete
                  options={powerTypes}
                  getOptionLabel={(option) => option.label || ""}
                  value={
                    powerTypes.find((p) => p.value === lensData.powerType) ||
                    null
                  }
                  onChange={(_, newValue) =>
                    handleInputChange("powerType", newValue?.value || null)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select Power Type"
                      size="small"
                      error={!!errors.powerType}
                      helperText={errors.powerType}
                    />
                  )}
                />
                <Autocomplete
                  options={
                    allBrandsData?.filter(
                      (b) => b.IsActive === 1 && b.ContactLensActive === 1
                    ) || []
                  }
                  getOptionLabel={(option) => option.BrandName || ""}
                  value={
                    allBrandsData?.find((b) => b.Id === lensData.brandId) ||
                    null
                  }
                  onChange={(_, newValue) =>
                    handleInputChange("brandId", newValue?.Id || null)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select brand"
                      size="small"
                      error={!!errors.brandId}
                      helperText={errors.brandId}
                    />
                  )}
                  loading={isLoadingAllBrands}
                  fullWidth
                />
                <Autocomplete
                  options={modalities?.data || []}
                  getOptionLabel={(option) => option.ModalityName || ""}
                  value={
                    modalities?.data.find((m) => m.Id === lensData.modality) ||
                    null
                  }
                  onChange={(_, newValue) =>
                    handleInputChange("modality", newValue?.Id || null)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search or select modality"
                      size="small"
                      error={!!errors.modality}
                      helperText={errors.modality}
                    />
                  )}
                  loading={modalitiesLoading}
                />
              </div>

              {/* Product details */}
              <div className="grid grid-cols-4 gap-5">
                <Input
                  label="Product Code"
                  value={lensData.productCode}
                  onChange={(e) =>
                    handleInputChange("productCode", e.target.value)
                  }
                  placeholder="Enter Product Code"
                  error={errors.productCode}
                />
                <Input
                  label="Product Name"
                  value={lensData.productName}
                  onChange={(e) =>
                    handleInputChange("productName", e.target.value)
                  }
                  placeholder="Enter Product Name"
                  error={errors.productName}
                />
                <Input
                  label="Base Curve"
                  value={lensData.baseCurve}
                  onChange={(e) =>
                    handleInputChange("baseCurve", e.target.value)
                  }
                  placeholder="Enter Base Curve"
                  error={errors.baseCurve}
                />
                <Input
                  label="Diameter"
                  value={lensData.diameter}
                  onChange={(e) =>
                    handleInputChange("diameter", e.target.value)
                  }
                  placeholder="Enter Diameter"
                  error={errors.diameter}
                />
              </div>

              {/* Inventory + material + product type */}
              <div className="flex gap-5">
                <div className="flex items-center gap-5 flex-1/2">
                  <label>Allow Negative Inventory </label>
                  <Radio
                    name="Inv"
                    value="1"
                    checked={lensData.inventory === 1}
                    onChange={() => handleInputChange("inventory", 1)}
                    label="Yes"
                  />
                  <Radio
                    name="Inv"
                    value="0"
                    checked={lensData.inventory === 0}
                    onChange={() => handleInputChange("inventory", 0)}
                    label="No"
                  />
                </div>
                <Autocomplete
                  className="flex-1/2"
                  options={materialsData?.data || []}
                  getOptionLabel={(option) => option.MaterialName || ""}
                  value={
                    materialsData?.data.find(
                      (m) => m.Id === lensData.material
                    ) || null
                  }
                  onChange={(_, newValue) =>
                    handleInputChange("material", newValue?.Id || null)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search or select Material"
                      size="small"
                      error={!!errors.material}
                      helperText={errors.material}
                    />
                  )}
                  loading={materialLoading}
                />
                <Autocomplete
                  className="flex-1/2"
                  options={productTypes}
                  getOptionLabel={(option) => option.label || ""}
                  value={
                    productTypes.find(
                      (pt) => pt.value === lensData.productType
                    ) || null
                  }
                  onChange={(_, newValue) =>
                    handleInputChange("productType", newValue?.value || null)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search or select product Type"
                      size="small"
                      error={!!errors.productType}
                      helperText={errors.productType}
                    />
                  )}
                />
              </div>

              {/* HSN, Tax, MRP */}
              <div className="grid grid-cols-3 gap-5 items-center">
                <Input
                  label="HSN Code"
                  value={lensData.hsnCode}
                  onChange={(e) => handleInputChange("hsnCode", e.target.value)}
                  placeholder="Enter HSN Code"
                  error={errors.hsnCode}
                />
                <Autocomplete
                  options={allTax?.data || []}
                  getOptionLabel={(option) => option.Name || ""}
                  value={
                    allTax?.data.find((t) => t.Id === lensData.taxPercentage) ||
                    null
                  }
                  onChange={(_, newValue) =>
                    handleInputChange("taxPercentage", newValue?.Id || null)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search or select tax percentage"
                      size="small"
                      error={!!errors.taxPercentage}
                      helperText={errors.taxPercentage}
                    />
                  )}
                />
                <Input
                  label="MRP"
                  value={lensData.mrp}
                  onChange={(e) => handleInputChange("mrp", e.target.value)}
                  placeholder="Enter MRP"
                  error={errors.mrp}
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <FiGlobe className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Location-Based Pricing
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
                {["buyingPrice", "sellingPrice"].map((field) => (
                  <div className="space-y-2" key={field}>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <LuIndianRupee className="text-blue-500" />
                      Apply {field === "buyingPrice"
                        ? "Buying"
                        : "Selling"}{" "}
                      Price to All
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name={field}
                        placeholder="0.00"
                        value={applyAll[field]}
                        onChange={(e) =>
                          setApplyAll((prev) => ({
                            ...prev,
                            [field]: e.target.value,
                          }))
                        }
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <Button
                        type="button"
                        onClick={() => handleApplyToAll(field, applyAll[field])}
                        variant="primary"
                        size="sm"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Buying Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Selling Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pricing.map((row, idx) => (
                      <tr key={row.location} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {row.location}
                        </td>
                        {["buyingPrice", "sellingPrice"].map((field) => (
                          <td className="px-6 py-4" key={field}>
                            <div className="relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">
                                  <LuIndianRupee />
                                </span>
                              </div>
                              <input
                                type="text"
                                value={row[field]}
                                onChange={(e) =>
                                  handlePriceChange(idx, field, e.target.value)
                                }
                                placeholder="0.00"
                                className={`block w-full pl-7 pr-12 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                  ${
                                    errors[`pricing_${field}_${idx}`] ||
                                    errors[`pricing_compare_${idx}`]
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                              />
                            </div>
                            {errors[`pricing_${field}_${idx}`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`pricing_${field}_${idx}`]}
                              </p>
                            )}
                            {field === "sellingPrice" &&
                              errors[`pricing_compare_${idx}`] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors[`pricing_compare_${idx}`]}
                                </p>
                              )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Import Details From Excel
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Upload an Excel file to automatically fill the form data
                      or add details manually below
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-sm font-medium ${
                        lensData.excel === 0 ? "text-gray-900" : "text-gray-500"
                      }`}
                    >
                      Manual Entry
                    </span>
                    <button
                      onClick={() =>
                        handleInputChange("excel", lensData.excel === 1 ? 0 : 1)
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        lensData.excel === 1 ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          lensData.excel === 1
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span
                      className={`text-sm font-medium ${
                        lensData.excel === 1 ? "text-blue-600" : "text-gray-500"
                      }`}
                    >
                      Excel Upload
                    </span>
                  </div>
                </div>

                {lensData.excel === 1 && (
                  <div className="space-y-4">
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                        isDragging
                          ? "border-blue-500 bg-blue-100"
                          : "border-gray-300"
                      } ${
                        items.length > 0
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                      onDragOver={(e) => {
                        if (items.length > 0) return;
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        if (items.length > 0) return;
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    >
                      <div className="max-w-md mx-auto">
                        <div className="flex justify-center mb-3">
                          <svg
                            className="w-12 h-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          Drop your Excel file here
                        </p>
                        <p className="text-sm text-gray-500 mb-4">or</p>
                        <label
                          htmlFor="file-upload"
                          className={
                            items.length > 0
                              ? "cursor-not-allowed"
                              : "cursor-pointer"
                          }
                        >
                          <span
                            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                              items.length > 0
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            Browse Files
                          </span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) =>
                              handleFileUpload(e.target.files?.[0])
                            }
                            disabled={items.length > 0}
                          />
                        </label>
                        <p className="text-xs text-gray-400 mt-3">
                          Supports .xlsx, .xls, .csv files (Max 10MB)
                        </p>
                      </div>
                    </div>
                    {items.length > 0 && (
                      <p className="text-red-500 text-sm">
                        Please remove manual details to upload an Excel file.
                      </p>
                    )}
                    {lensData.selectedFile && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <svg
                              className="w-5 h-5 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <div>
                              <p className="font-medium text-green-800">
                                {lensData.selectedFile.name}
                              </p>
                              <p className="text-sm text-green-600">
                                {(
                                  lensData.selectedFile.size /
                                  1024 /
                                  1024
                                ).toFixed(2)}{" "}
                                MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleInputChange("selectedFile", null)
                            }
                            className="text-green-600 hover:text-green-800 transition-colors"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                    {errors.selectedFile && (
                      <p className="text-red-500 text-sm">
                        {errors.selectedFile}
                      </p>
                    )}
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-4 my-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Need a template?
                      </p>
                      <p className="text-xs text-gray-500">
                        Download our Excel template to ensure proper formatting
                      </p>
                    </div>
                    <Button
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      onClick={handleDownloadSampleFile}
                      isLoading={isSheetFetching}
                      disabled={isSheetFetching}
                      variant="ghost"
                    >
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-5">
              <div className="flex justify-between items-center">
                <div className="text-xl text-neutral-700 font-semibold">
                  Contact Lens Details
                </div>
                <Button
                  icon={FiPlus}
                  iconPosition="left"
                  className={`bg-primary/90 text-neutral-50 hover:bg-primary/70 transition-all whitespace-nowrap ${
                    lensData.excel === 1 && lensData.selectedFile
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  onClick={() => setClOpen(true)}
                  disabled={lensData.excel === 1 && lensData.selectedFile}
                >
                  Add CLDetails
                </Button>
              </div>
              {lensData.excel === 1 && lensData.selectedFile && (
                <p className="text-red-500 text-sm">
                  Please remove the uploaded file to add manual details.
                </p>
              )}
              <Table
                columns={[
                  "S.No",
                  "skucode",
                  "barcode",
                  "spherical power",
                  "cylindrical power",
                  "axis",
                  "additional",
                  "colour",
                ]}
                data={items}
                renderRow={(item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.skucode}</TableCell>
                    <TableCell>{item.barCode}</TableCell>
                    <TableCell>{item.sph}</TableCell>
                    <TableCell>{item.cyl}</TableCell>
                    <TableCell>{item.axis}</TableCell>
                    <TableCell>{item.addl}</TableCell>
                    <TableCell>{item.clr}</TableCell>
                  </TableRow>
                )}
              />
              {errors.items && (
                <p className="text-red-500 text-sm">{errors.items}</p>
              )}
            </div>
            {isClOpen && !(lensData.excel === 1 && lensData.selectedFile) && (
              <div className="mt-5">
                <div className="flex gap-5">
                  <Input
                    label="SKUCode"
                    placeholder="Enter SKU Code"
                    value={clDetails.skucode}
                    onChange={handleCLChange}
                    name="skucode"
                  />
                  <Input
                    label="BarCode"
                    placeholder="Enter BarCode"
                    value={clDetails.barCode}
                    onChange={handleCLChange}
                    name="barCode"
                  />
                </div>
                <div className="flex gap-5">
                  <Input
                    label="Spherical Power"
                    placeholder="Enter Spherical Power"
                    value={clDetails.sph}
                    onChange={handleCLChange}
                    name="sph"
                  />
                  <Input
                    label="Cylindrical Power"
                    placeholder="Enter Cylindrical Power"
                    value={clDetails.cyl}
                    onChange={handleCLChange}
                    name="cyl"
                  />
                  <Input
                    label="Axis"
                    placeholder="Enter Axis"
                    value={clDetails.axis}
                    onChange={handleCLChange}
                    name="axis"
                  />
                  <Input
                    label="Additional"
                    placeholder="Enter Additional"
                    value={clDetails.addl}
                    onChange={handleCLChange}
                    name="addl"
                  />
                  <Input
                    label="Colour"
                    placeholder="Enter Colour"
                    value={clDetails.clr}
                    onChange={handleCLChange}
                    name="clr"
                  />
                </div>
                <div>
                  <Button onClick={handleAddItem}>Add</Button>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <Button
                variant="primary"
                onClick={handleSave}
                className="w-64"
                isLoading={isCLMasterCreating || isMasterUpdating}
                disabled={isCLMasterCreating || isMasterUpdating}
              >
                {id ? "Update" : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CLMaster;
