import React, { useEffect, useState } from "react";
import { useGetVariationsQuery } from "../../../api/variations";
import { useGetBarCodeQuery } from "../../../api/accessoriesMaster";
import Button from "../../../components/ui/Button";
import { FiPlusCircle, FiRefreshCw } from "react-icons/fi";
import PricingTable from "./PricingTable";
import { useFormData } from "../../../features/dataContext";
import { useGetAllLocationsQuery } from "../../../api/roleManagementApi";
import { useNavigate, useParams } from "react-router-dom";
import { LuIndianRupee } from "react-icons/lu";

const CreateVariation = () => {
  const navigate = useNavigate();
  const { id: variationId } = useParams();
  const { data: allVariations, isLoading: isVariationsLoading } =
    useGetVariationsQuery();
  const { data: barCode, refetch } = useGetBarCodeQuery({ skip: true });
  const { data: allLocations } = useGetAllLocationsQuery();

  const {
    variationData,
    setVariationData,
    pricingData,
    setPricingData,
    addVariationToList,
    variationsList,
  } = useFormData();

  useEffect(() => {
    // Only initialize for new variations (when variationId is not present or variationData is empty)
    if (!variationId || !variationData.OPVariationID) {
      // Initialize pricingData for all locations if creating a new variation
      const initialPricing =
        allLocations?.data?.map((location) => ({
          id: location.Id,
          location: location.LocationName,
          buyingPrice: "",
          sellingPrice: "",
        })) || [];

      setPricingData(initialPricing);
    }
  }, [allLocations, variationId, variationData.OPVariationID, setPricingData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "OPMRP" && value && !/^\d{0,10}(\.\d{0,2})?$/.test(value))
      return;

    setVariationData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePriceChange = (index, field, value) => {
    if (value && !/^\d{0,10}(\.\d{0,2})?$/.test(value)) return;

    const updated = pricingData.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    );
    setPricingData(updated);
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateBarCode = async () => {
    setIsGenerating(true);
    try {
      await refetch();
      setVariationData((prev) => ({
        ...prev,
        Barcode: barCode?.data?.barcode || "",
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const [applyAll, setApplyAll] = useState({
    buyingPrice: "",
    sellingPrice: "",
  });

  const handleApplyToAll = (field, value) => {
    if (value && !/^\d{0,10}(\.\d{0,2})?$/.test(value)) return;
    const updated = pricingData.map((item) => ({
      ...item,
      [field]: value,
    }));
    setPricingData(updated);
  };

  const handleSubmit = () => {
    addVariationToList();
    navigate(-1);
  };

  return (
    <div className="max-w-6xl p-6 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-6 justify-between">
        <div className="flex gap-3 items-center">
          <FiPlusCircle className="text-blue-600 text-2xl" />
          <h2 className="text-2xl font-bold text-gray-800">
            {variationId ? "Edit Variation" : "Create Variation"}
          </h2>
        </div>
        <Button onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Variation Dropdown */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Variation
          </label>
          <select
            name="OPVariationID"
            value={variationData?.OPVariationID || ""}
            onChange={handleChange}
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md"
            disabled={isVariationsLoading}
          >
            <option value="">Select variation</option>
            {!isVariationsLoading &&
              allVariations?.data?.map(
                (variation) =>
                  variation.IsActive === 1 && (
                    <option key={variation.Id} value={variation.Id}>
                      {variation.VariationName}
                    </option>
                  )
              )}
          </select>
        </div>

        {/* SKU Code Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            SKU Code
          </label>
          <input
            type="text"
            name="SKUCode"
            value={variationData?.SKUCode || ""}
            onChange={handleChange}
            placeholder="Enter SKU Code"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Barcode Field + Generate Button */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Barcode
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="Barcode"
              value={variationData?.Barcode || ""}
              onChange={handleChange}
              placeholder="Barcode will be generated"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button
              type="button"
              onClick={handleGenerateBarCode}
              variant="primary"
              loading={isGenerating}
              loadingText="Generating..."
              className="flex items-center gap-2"
            >
              <FiRefreshCw className="h-4 w-4" />
              Generate
            </Button>
          </div>
        </div>

        {/* SRP Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            SRP (Price)
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm"><LuIndianRupee /></span>
            </div>
            <input
              type="text"
              name="OPMRP"
              value={variationData?.OPMRP || ""}
              onChange={handleChange}
              placeholder="0.00"
              className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">INR</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Format: 9999.99 (max 2 decimal places)
          </p>
        </div>
      </div>

      {pricingData && (
        <PricingTable
          pricing={pricingData}
          onPriceChange={handlePriceChange}
          applyAll={applyAll}
          onApplyAllChange={setApplyAll}
          onApplyToAll={handleApplyToAll}
        />
      )}

      <div className="mt-6 flex justify-end">
        <Button variant="primary" size="lg" onClick={handleSubmit}>
          {variationId ? "Update Variation" : "Create Variation"}
        </Button>
      </div>
    </div>
  );
};

export default CreateVariation;
