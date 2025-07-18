import React, { useState } from "react";
import { useFrameMaster } from "../../../features/frameMasterContext";
import HasPermission from "../../../components/HasPermission";

const FrameAccessMasterForm = ({
  initialValues = {},
  brands = [],
  taxOptions = [],
  isEditMode,
  isEnabled,
  id,
  errors, // Receive errors from parent
  setErrors, // Receive setErrors from parent
}) => {
  const { formData, setFormData } = useFrameMaster();
  const [localErrors, setLocalErrors] = useState({}); // Local state for real-time validation

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));

    // Dynamic real-time validation
    let error = "";
    if (val === "") {
      error = "";
    } else {
      switch (name) {
        case "ProductName":
          if (val.length > 100)
            error = "Product Name cannot exceed 100 characters.";
          break;
        case "ProductCode":
          if (val.length > 30)
            error = "Product Code cannot exceed 30 characters.";
          break;
        case "HSN":
          if (val.length > 6) error = "HSN Code cannot exceed 6 characters.";
          break;
        default:
          break;
      }
    }

    setLocalErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    // Clear corresponding error in parent when user starts correcting
    if (errors[name] && val !== "") {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label>Brand *</label>
          <select
            value={formData.BrandID}
            name="BrandID"
            onChange={handleChange}
            className="block w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md"
            disabled={isEnabled}
          >
            <option value="">Select a brand*</option>
            {brands
              ?.filter(
                (brand) => brand.OthersProductsActive && brand.IsActive === 1
              )
              .map((brand) => (
                <option key={brand.Id} value={String(brand.Id)}>
                  {brand.BrandName}
                </option>
              ))}
          </select>
          {(errors.BrandID || localErrors.BrandID) && (
            <p className="text-red-500 text-sm">
              {errors.BrandID || localErrors.BrandID}
            </p>
          )}
        </div>

        <div>
          <label>Product Name*</label>
          <input
            type="text"
            name="ProductName"
            value={formData.ProductName}
            onChange={handleChange}
            className="input"
            disabled={isEnabled}
          />
          {(errors.ProductName || localErrors.ProductName) && (
            <p className="text-red-500 text-sm">
              {errors.ProductName || localErrors.ProductName}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label>Product Code*</label>
          <input
            type="text"
            name="ProductCode"
            value={formData.ProductCode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter product code"
            disabled={isEnabled}
          />
          {(errors.ProductCode || localErrors.ProductCode) && (
            <p className="text-red-500 text-sm">
              {errors.ProductCode || localErrors.ProductCode}
            </p>
          )}
        </div>
        <div>
          <label>HSN Code*</label>
          <input
            type="text"
            name="HSN"
            value={formData.HSN}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter HSN code"
            disabled={isEnabled}
          />
          {(errors.HSN || localErrors.HSN) && (
            <p className="text-red-500 text-sm">{errors.HSN || localErrors.HSN}</p>
          )}
        </div>

        <div>
          <label>Tax % *</label>
          <select
            name="TaxID"
            value={formData.TaxID}
            onChange={handleChange}
            className="w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md"
            disabled={isEnabled}
          >
            <option value="">Select tax percentage</option>
            {taxOptions?.data
              ?.filter((tax) => tax.IsActive === 1)
              .map((tax) => (
                <option key={tax.Id} value={String(tax.Id)}>
                  {tax.Name}
                </option>
              ))}
          </select>
          {(errors.TaxID || localErrors.TaxID) && (
            <p className="text-red-500 text-sm">
              {errors.TaxID || localErrors.TaxID}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FrameAccessMasterForm;