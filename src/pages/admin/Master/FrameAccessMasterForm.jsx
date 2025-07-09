import React, { useEffect, useState } from "react";
import { useFrameMaster } from "../../../features/frameMasterContext";
import HasPermission from "../../../components/HasPermission";
import Button from "../../../components/ui/Button";

const FrameAccessMasterForm = ({
  initialValues = {},
  onSubmit,
  brands = [],
  taxOptions = [],
  isEditMode,
  isEnabled,
  id,
}) => {
  const { formData, setFormData } = useFrameMaster();

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (val !== "") {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.BrandID) {
      newErrors.BrandID = "Brand is required.";
    }
    if (!formData.ProductName) {
      newErrors.ProductName = "Product Name is required.";
    } else if (formData.ProductName.length > 100) {
      newErrors.ProductName = "Product Name cannot exceed 100 characters";
    }
    if (!formData.ProductCode) {
      newErrors.ProductCode = "Product Code is required.";
    } else if (formData.ProductCode.length > 30) {
      newErrors.ProductCode = "Product Code cannot exceed 30 characters";
    }
    if (!formData.HSN) newErrors.HSN = "HSN Code is required.";
    if (!formData.TaxID) newErrors.TaxID = "Tax is required.";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    // setFormData(formData);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
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
            <option value="">Select a brand</option>
            {brands?.data
              ?.filter(
                (brand) => brand.OthersProductsActive && brand.IsActive === 1
              )
              .map((brand) => (
                <option key={brand.Id} value={String(brand.Id)}>
                  {brand.BrandName}
                </option>
              ))}
          </select>
          {errors.BrandID && (
            <p className="text-red-500 text-sm">{errors.BrandID}</p>
          )}
        </div>

        <div>
          <label>Product Name</label>
          <input
            type="text"
            name="ProductName"
            value={formData.ProductName}
            onChange={handleChange}
            className="input"
            disabled={isEnabled}
          />
          {errors.ProductName && (
            <p className="text-red-500 text-sm">{errors.ProductName}</p>
          )}
        </div>
      </div>

      <div>
        <label>Product Code</label>
        <input
          type="text"
          name="ProductCode"
          value={formData.ProductCode}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter product code"
          disabled={isEnabled}
        />
        {errors.ProductCode && (
          <p className="text-red-500 text-sm">{errors.ProductCode}</p>
        )}
      </div>
      <div>
        <label>HSN Code</label>
        <input
          type="text"
          name="HSN"
          value={formData.HSN}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter HSN code"
          disabled={isEnabled}
        />
        {errors.HSN && <p className="text-red-500 text-sm">{errors.HSN}</p>}
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
        {errors.TaxID && <p className="text-red-500 text-sm">{errors.TaxID}</p>}
      </div>

      <div className="flex justify-end pt-4">
        {!isEnabled && (
          <HasPermission module="Accessory Master" action={["edit","create"]}>
            <Button type="submit">
              {id ? "Update Accessory" : "Save Accessory"}
            </Button>
          </HasPermission>
        )}
      </div>
    </form>
  );
};

export default FrameAccessMasterForm;
