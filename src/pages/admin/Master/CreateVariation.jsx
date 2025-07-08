import { useEffect, useState } from "react";
import { useGetAllLocationsQuery } from "../../../api/roleManagementApi";
import { useGetBarCodeQuery } from "../../../api/accessoriesMaster";
import { FiPlusCircle, FiRefreshCw, FiX } from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { LuIndianRupee } from "react-icons/lu";
import PricingTable from "./PricingTable";
import { useGetVariationsQuery } from "../../../api/variations";

const CreateVariation = ({
  onSave,
  onCancel,
  initialVariation,
  initialPricing,
  initialStock,
  isEnabled,
}) => {
  const { data: allLocations } = useGetAllLocationsQuery();
  const { data: barCodeData, refetch } = useGetBarCodeQuery({ skip: true });
  const { data: allVariations, isLoading: isVariationsLoading } =
    useGetVariationsQuery();
  const [formErrors, setFormErrors] = useState({});

  const [variation, setVariation] = useState(() => ({
    SKUCode: initialVariation?.SKUCode || "",
    Barcode: initialVariation?.Barcode || "",
    OPVariationID: initialVariation?.OPVariationID || "",
  }));

  const [stock, setLocalStock] = useState({
    OPBatchCode: initialStock?.FrameBatch || "1",
    OPMRP: initialStock?.FrameSRP || "",
  });

  const [pricing, setPricing] = useState(initialPricing || []);
  const [applyAll, setApplyAll] = useState({
    buyingPrice: "",
    sellingPrice: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleChange = (field, value) => {
    setVariation((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleStockChange = (field, value) => {
    setLocalStock((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleGenerateBarCode = async () => {
    setIsGenerating(true);
    try {
      const result = await refetch();
      const newCode = result?.data?.data?.barcode || "";
      setVariation((prev) => ({ ...prev, Barcode: newCode }));
      setFormErrors((prev) => ({ ...prev, Barcode: "" }));
    } finally {
      setIsGenerating(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!variation.OPVariationID || variation.OPVariationID === "") {
      errors.OPVariationID = "Variation selection is required.";
    }
    if (!variation.SKUCode) {
      errors.SKUCode = "SKU Code is required.";
    }
    if (!variation.Barcode) {
      errors.Barcode = "Barcode is required.";
    }
    if (!stock.OPMRP || isNaN(parseFloat(stock.OPMRP)) || parseFloat(stock.OPMRP) <= 0) {
      errors.OPMRP = "MRP is required and must be a valid positive number.";
    }

    let hasPricingError = false;
    pricing.forEach((p) => {
      if (!p.buyingPrice || isNaN(parseFloat(p.buyingPrice)) || parseFloat(p.buyingPrice) <= 0) {
        hasPricingError = true;
      }
      if (!p.sellingPrice || isNaN(parseFloat(p.sellingPrice)) || parseFloat(p.sellingPrice) <= 0) {
        hasPricingError = true;
      }
    });

    if (hasPricingError) {
      errors.pricing = "Valid buying and selling prices are required for all locations.";
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      variation: {
        ...variation,
        OPVariationID: variation.OPVariationID || "1", // Fallback to "1" as string
      },
      stock: {
        ...stock,
        OPMRP: parseFloat(stock.OPMRP) || 0,
      },
      pricing: pricing.map((p) => ({
        ...p,
        buyingPrice: parseFloat(p.buyingPrice) || 0,
        sellingPrice: parseFloat(p.sellingPrice) || 0,
      })),
    };

    onSave(payload);
  };

  const requiredFields = ["SKUCode", "Barcode", "OPVariationID"];
  const renderInputField = (field, label = field) => (
    <div key={field}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {requiredFields.includes(field) && (
          <span className="text-red-500">*</span>
        )}
      </label>
      <input
        type="text"
        value={variation[field] || ""}
        onChange={(e) => handleChange(field, e.target.value)}
        className={`mt-1 block w-full border ${
          formErrors[field] ? "border-red-500" : "border-gray-300"
        } rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500`}
        disabled={isEnabled}
      />
      {formErrors[field] && (
        <p className="text-red-500 text-sm mt-1">{formErrors[field]}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl p-6 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FiPlusCircle className="text-blue-600 text-2xl" />
          <h2 className="text-2xl font-bold text-gray-800">
            {initialVariation
              ? isEnabled
                ? "View Variation"
                : "Edit Variation"
              : "Create Variation"}
          </h2>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <FiX size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-2 mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Select Variation <span className="text-red-500">*</span>
          </label>
          <select
            name="OPVariationID"
            value={variation?.OPVariationID || ""}
            onChange={(e) => handleChange("OPVariationID", e.target.value)}
            className={`block w-full pl-3 pr-10 py-2 text-base border ${
              formErrors.OPVariationID ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md`}
            disabled={isEnabled || isVariationsLoading}
          >
            <option value="">Select variation</option>
            {allVariations?.data?.map(
              (variation) =>
                variation.IsActive === 1 && (
                  <option key={variation.Id} value={variation.Id}>
                    {variation.VariationName}
                  </option>
                )
            )}
          </select>
          {formErrors.OPVariationID && (
            <p className="text-red-500 text-sm mt-1">
              {formErrors.OPVariationID}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {renderInputField("SKUCode", "SKU Code")}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Barcode <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={variation.Barcode || ""}
                onChange={(e) => handleChange("Barcode", e.target.value)}
                className={`mt-1 block w-full border ${
                  formErrors.Barcode ? "border-red-500" : "border-gray-300"
                } rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500`}
                disabled={isEnabled}
              />
              {!isEnabled && (
                <Button
                  type="button"
                  onClick={handleGenerateBarCode}
                  variant="primary"
                  size="sm"
                  disabled={isGenerating}
                >
                  <FiRefreshCw
                    className={`animate-spin ${
                      isGenerating ? "inline" : "hidden"
                    }`}
                  />
                  {!isGenerating && "Generate"}
                </Button>
              )}
            </div>
            {formErrors.Barcode && (
              <p className="text-red-500 text-sm mt-1">{formErrors.Barcode}</p>
            )}
          </div>
        </div>

        <div className="mb-6 md:w-1/2">
          <label className="block text-sm font-medium text-gray-700">
            MRP <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LuIndianRupee className="text-gray-400" />
            </div>
            <input
              type="number"
              step="0.01"
              value={stock.OPMRP || ""}
              onChange={(e) => handleStockChange("OPMRP", e.target.value)}
              placeholder="0.00"
              className={`pl-7 pr-4 py-2 block w-full border ${
                formErrors.OPMRP ? "border-red-500" : "border-gray-300"
              } rounded-md focus:ring-blue-500 focus:border-blue-500`}
              disabled={isEnabled}
            />
            {formErrors.OPMRP && (
              <p className="text-red-500 text-sm mt-1">{formErrors.OPMRP}</p>
            )}
          </div>
        </div>

        <PricingTable
          pricing={pricing}
          onPriceChange={(idx, field, val) => {
            const updated = [...pricing];
            updated[idx][field] = val;
            setPricing(updated);
            if (formErrors.pricing) {
              setFormErrors((prev) => ({ ...prev, pricing: "" }));
            }
          }}
          applyAll={applyAll}
          onApplyAllChange={setApplyAll}
          onApplyToAll={(field, value) =>
            setPricing(pricing.map((row) => ({ ...row, [field]: value })))
          }
          isEnabled={isEnabled}
        />
        {formErrors.pricing && (
          <p className="text-red-500 text-sm mt-2">{formErrors.pricing}</p>
        )}

        {!isEnabled && (
          <div className="mt-6 flex justify-end gap-4">
            <Button type="button" onClick={onCancel} variant="secondary">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="lg">
              {initialVariation ? "Update Variation" : "Create Variation"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateVariation;