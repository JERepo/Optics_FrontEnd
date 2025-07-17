import React, { useEffect, useState } from "react";
import { useGetBarCodeQuery } from "../../../api/accessoriesMaster";
import { useGetAllLocationsQuery } from "../../../api/roleManagementApi";
import { useGetAllseasonsQuery } from "../../../api/seasonMaster";
import { toast } from "react-hot-toast";

import { FiPlusCircle, FiRefreshCw, FiX } from "react-icons/fi";
import { LuIndianRupee } from "react-icons/lu";

import Button from "../../../components/ui/Button";
import PricingTable from "../Master/PricingTable";
import ImageUploadGrid from "./ImageUploadGrid";
import { useFrameMaster } from "../../../features/frameMasterContext";

const CreateVariationForm = ({
  onSave,
  onCancel,
  initialVariation,
  initialPricing,
  initialStock,
  isEnabled,
}) => {
  const { data: allLocations } = useGetAllLocationsQuery();

  const { data: allSeasons } = useGetAllseasonsQuery();
  const { data: barCodeData, refetch } = useGetBarCodeQuery({ skip: true });
  const [formErrors, setFormErrors] = useState({});

  const [variation, setVariation] = useState(() => ({
    ColourCode: initialVariation?.ColourCode || null,
    Size: initialVariation?.Size || null,
    DBL: initialVariation?.DBL || null,
    TempleLength: initialVariation?.TempleLength || null,
    LaunchSeason: initialVariation?.LaunchSeason || null,
    IsPhotochromatic: initialVariation?.IsPhotochromatic || 0,
    IsPolarised: initialVariation?.IsPolarised || 0,
    LensColor: initialVariation?.LensColor || null,
    FrameFrontColor: initialVariation?.FrameFrontColor || null,
    TempleColor: initialVariation?.TempleColor || null,
    SkuCode: initialVariation?.SkuCode || null,
    Barcode: initialVariation?.Barcode || null,
    IsActive: initialVariation?.IsActive ?? 1, // Default to 1 for new variations
    id: initialVariation?.id || null, // Preserve id
  }));

  const [images, setImages] = useState(() => {
    if (initialVariation?.FrameImages?.length) {
      const existingImages = initialVariation.FrameImages.map((img) => ({
        FileName: img.FileName,
        IsMain: img.IsMain === 1,
        file: null,
      }));
      return [
        ...existingImages,
        ...Array(5 - existingImages.length).fill({
          file: null,
          FileName: null,
        }),
      ].slice(0, 5);
    }
    return Array(5).fill({ file: null, FileName: null });
  });

  const [mainImageIndex, setMainImageIndex] = useState(
    () =>
      initialVariation?.FrameImages?.findIndex((img) => img.IsMain === 1) ??
      null
  );

  const [stock, setLocalStock] = useState({
    FrameSRP: initialStock?.FrameSRP || null,
    FrameBatch: initialStock?.FrameBatch || 1,
    id: initialStock?.id || null,
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

  const toggleCheckbox = (field) => {
    setVariation((prev) => ({
      ...prev,
      [field]: prev[field] === 1 ? 0 : 1,
    }));
  };

  const handleGenerateBarCode = async () => {
    setIsGenerating(true);
    try {
      const result = await refetch();
      const newCode = result?.data?.data?.barcode || null;
      setVariation((prev) => ({ ...prev, Barcode: newCode }));
      setFormErrors((prev) => ({ ...prev, Barcode: null }));
    } finally {
      setIsGenerating(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!variation.ColourCode) {
      errors.ColourCode = "Colour Code is required.";
    } else if (variation.ColourCode.length > 25) {
      errors.ColourCode = "Colour Code must not exceed 25 characters.";
    }

    if (!variation.Size) {
      errors.Size = "Size is required.";
    } else if (variation.Size.length > 3) {
      errors.Size = "Size must not exceed 3 characters.";
    }

    if (variation.DBL && variation.DBL.length > 3) {
      errors.DBL = "DBL must not exceed 3 characters.";
    }

    if (variation.TempleLength && variation.TempleLength.length > 3) {
      errors.TempleLength = "Temple Length must not exceed 3 characters.";
    }

    if (!variation.SkuCode) {
      errors.SkuCode = "SKU Code is required.";
    } else if (variation.SkuCode.length > 100) {
      errors.SkuCode = "SKU Code must not exceed 100 characters.";
    }

    if (!variation.Barcode) {
      errors.Barcode = "Barcode is required.";
    } else if (variation.Barcode.length > 25) {
      errors.Barcode = "Barcode must not exceed 25 characters.";
    }

    if (!stock.FrameSRP) {
      errors.FrameSRP = "SRP is required.";
    } else if (isNaN(parseFloat(stock.FrameSRP))) {
      errors.FrameSRP = "SRP must be a valid number.";
    } else {
      const srp = parseFloat(stock.FrameSRP);
      let srpErrors = false;
      const invalidSRPLocations = [];

      pricing.forEach((p) => {
        const buying = parseFloat(p.buyingPrice);
        const selling = parseFloat(p.sellingPrice);

        if (!isNaN(buying) && srp <= buying) {
          srpErrors = true;
          invalidSRPLocations.push(p.location);
        }
        if (!isNaN(selling) && srp <= selling) {
          srpErrors = true;
          if (!invalidSRPLocations.includes(p.location)) {
            invalidSRPLocations.push(p.location);
          }
        }
      });

      if (srpErrors) {
        errors.FrameSRP = `SRP should be greater than both buying and selling prices in: ${invalidSRPLocations.join(
          ", "
        )}.`;
      }
    }

    if (variation.LensColor && variation.LensColor.length > 50) {
      errors.LensColor = "Lens color cannot exceed 50 characters.";
    }
    if (variation.FrameFrontColor && variation.FrameFrontColor.length > 50) {
      errors.FrameFrontColor = "Frame Front Color cannot exceed 50 characters.";
    }
    if (variation.TempleColor && variation.TempleColor.length > 50) {
      errors.TempleColor = "Temple Color cannot exceed 50 characters.";
    }

    let hasPricingError = false;
    pricing.forEach((p, index) => {
      const buying = parseFloat(p.buyingPrice);
      const selling = parseFloat(p.sellingPrice);

      if (!p.buyingPrice || isNaN(buying)) {
        errors[
          `buyingPrice_${index}`
        ] = `Buying price at ${p.location} is required and must be a valid number.`;
        hasPricingError = true;
      }

      if (!p.sellingPrice || isNaN(selling)) {
        errors[
          `sellingPrice_${index}`
        ] = `Selling price at ${p.location} is required and must be a valid number.`;
        hasPricingError = true;
      }

      if (!isNaN(buying) && !isNaN(selling) && selling <= buying) {
        errors[
          `sellingPrice_${index}`
        ] = `Selling price at ${p.location} must be greater than the buying price.`;
        hasPricingError = true;
      }
    });

    if (hasPricingError) {
      errors.pricing =
        "Pricing details are invalid and selling price should be greater than buying price!";
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

    const validImages = images
      .map((img, idx) => ({
        ...img,
        originalIndex: idx,
        FileName: img.file ? img.file.name : img.FileName,
      }))
      .filter((img) => img.file || img.FileName);

    const frameImages = validImages.map((img) => ({
      FileName: img.FileName,
      IsMain: img.originalIndex === mainImageIndex ? 1 : 0,
    }));

    if (frameImages.length && mainImageIndex === null) {
      frameImages[0].IsMain = 1;
    }

    const payload = {
      variation: {
        ...variation,
        FrameImages: frameImages,
        IsActive: variation.IsActive ?? 1,
      },
      stock: {
        ...stock,
        FrameSRP: parseFloat(stock.FrameSRP) || 0,
      },
      pricing: pricing.map((p) => ({
        ...p,
        buyingPrice: parseFloat(p.buyingPrice) || 0,
        sellingPrice: parseFloat(p.sellingPrice) || 0,
      })),
      images: validImages,
    };

    onSave(payload);
  };

  const requiredFields = ["ColourCode", "Size", "SkuCode", "Barcode"];
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
        value={variation[field]}
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
                ? "View variation"
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {[
            { field: "ColourCode", label: "Colour Code" },
            { field: "Size", label: "Size" },
            { field: "DBL", label: "DBL" },
            { field: "TempleLength", label: "Temple Length" },
          ].map(({ field, label }) => renderInputField(field, label))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Launch Season
            </label>
            <select
              value={variation.LaunchSeason}
              onChange={(e) => handleChange("LaunchSeason", e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isEnabled}
            >
              <option value="">Select</option>
              {allSeasons?.data.map((season) => (
                <>
                  {season.IsActive === 1 && (
                    <option key={season.Id} value={season.Id}>
                      {season.SeasonName}
                    </option>
                  )}
                </>
              ))}
            </select>
          </div>
          {[
            { label: "Photochromatic", field: "IsPhotochromatic" },
            { label: "Polarised", field: "IsPolarised" },
          ].map(({ label, field }) => (
            <div key={field} className="flex items-center mt-6 space-x-2">
              <input
                type="checkbox"
                checked={variation[field] === "1"}
                onChange={() => toggleCheckbox(field)}
                className="form-checkbox h-5 w-5 text-blue-600"
                disabled={isEnabled}
              />
              <label className="text-sm font-medium text-gray-700">
                {label}
              </label>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {[
            { field: "LensColor", label: "Lens Color" },
            { field: "FrameFrontColor", label: "Frame Front Color" },
            { field: "TempleColor", label: "Temple Color" },
          ].map(({ field, label }) => renderInputField(field, label))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {renderInputField("SkuCode", "SKU Code")}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Barcode
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={variation.Barcode}
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
          <label className="block text-sm font-medium text-gray-700">SRP</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LuIndianRupee className="text-gray-400" />
            </div>
            <input
              type="number"
              value={stock.FrameSRP}
              onChange={(e) =>
                setLocalStock((prev) => ({ ...prev, FrameSRP: e.target.value }))
              }
              placeholder="0"
              className={`pl-7 pr-4 py-2 block w-full border ${
                formErrors.FrameSRP ? "border-red-500" : "border-gray-300"
              } rounded-md`}
              disabled={isEnabled}
            />
            {formErrors.FrameSRP && (
              <p className="text-red-500 text-sm mt-1">{formErrors.FrameSRP}</p>
            )}
          </div>
        </div>

        <PricingTable
          pricing={pricing}
          onPriceChange={(idx, field, val) => {
            const updated = [...pricing];
            updated[idx][field] = val;
            setPricing(updated);
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

        <ImageUploadGrid
          images={images}
          setImages={setImages}
          mainImageIndex={mainImageIndex}
          setMainImageIndex={setMainImageIndex}
          isEnabled={isEnabled}
        />

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

export default CreateVariationForm;
