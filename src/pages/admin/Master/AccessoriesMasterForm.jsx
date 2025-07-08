// src/components/forms/AccessoriesMasterForm.js
import React from "react";
import { FiPlusCircle } from "react-icons/fi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../../../components/ui/Button";

const FormField = ({ label, children, error }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {children}
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
);

const AccessoriesMasterForm = ({
  formData,
  setFormData,
  brands,
  allTaxes,
  loadingBrands,
  loadingTaxes,
  isCreate,
  onSubmit,
  handleAddVariation,
  errors,
  handleSubmit,
  register,
}) => {
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-2 gap-5">
        <FormField label="Brand" error={errors.BrandID?.message}>
          <select
            {...register("BrandID")}
            value={formData.BrandID}
            onChange={handleChange}
            className="block w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md"
          >
            <option value="">Select a brand</option>
            {!loadingBrands &&
              brands?.data
                .filter((brand) => brand.OthersProductsActive && brand.IsActive === 1)
                .map((brand) => (
                  <option key={brand.Id} value={String(brand.Id)}>
                    {brand.BrandName}
                  </option>
                ))}
          </select>
        </FormField>

        <FormField label="Product Name" error={errors.ProductName?.message}>
          <input
            {...register("ProductName")}
            type="text"
            name="ProductName"
            value={formData.ProductName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter product name"
          />
        </FormField>

        <FormField label="Product Code" error={errors.ProductCode?.message}>
          <input
            {...register("ProductCode")}
            type="text"
            name="ProductCode"
            value={formData.ProductCode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter product code"
          />
        </FormField>

        <FormField label="HSN Code" error={errors.HSN?.message}>
          <input
            {...register("HSN")}
            type="text"
            name="HSN"
            value={formData.HSN}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter HSN code"
          />
        </FormField>

        <FormField label="Tax Percentage" error={errors.TaxID?.message}>
          <select
            {...register("TaxID")}
            name="TaxID"
            value={formData.TaxID}
            onChange={handleChange}
            className="w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md"
          >
            <option value="">Select tax percentage</option>
            {!loadingTaxes &&
              allTaxes?.data
                .filter((tax) => tax.IsActive === 1)
                .map((tax) => (
                  <option key={tax.Id} value={String(tax.Id)}>
                    {tax.Name} ({tax.percentage}%)
                  </option>
                ))}
          </select>
        </FormField>
      </div>

      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg flex justify-between">
        <p className="text-sm font-medium text-gray-700">
          Need to add at least one variation!
        </p>
        <Button
          onClick={handleAddVariation}
          type="button"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <FiPlusCircle className="h-4 w-4" /> Add Variation
        </Button>
      </div>
    </form>
  );
};

export default AccessoriesMasterForm;
