import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  FiPlusCircle,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiPackage,
} from "react-icons/fi";

import Button from "../../../components/ui/Button";
import {
  useGetTaxQuery,
  useGetAllMasterQuery,
  useGetMasterByIdQuery,
  useUpdateMasterMutation,
  useDeActivateMutation,
  useCreateAccessoriesMasterMutation,
} from "../../../api/accessoriesMaster";
import { useFormData } from "../../../features/dataContext";
import { accessoriesMasterSchema } from "../../../utils/schemas/accessorySchema";
import HasPermission from "../../../components/HasPermission";
import { useGetAllBrandsQuery } from "../../../api/brandsApi";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import Toggle from "../../../components/ui/Toggle";

const FormField = ({ label, children, error }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {children}
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
);

const EditAccessoriesMaster = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isCreate = location.pathname.includes("/create");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentVariation, setCurrentVariation] = useState(null);
  const [isToggling, setIsToggling] = useState(false);

  const { data: brands, isLoading: loadingBrands } = useGetAllBrandsQuery();
  const { data: allTaxes, isLoading: loadingTaxes } = useGetTaxQuery();
  const { data: masterData, isLoading: isMasterLoading } =
    useGetMasterByIdQuery({ id });
  const { data: allAccess } = useGetAllMasterQuery();
  const [updateMaster, { isLoading: isDataUpdating }] =
    useUpdateMasterMutation();
  const [createAccessoriesMaster, { isLoading: isDataCreating }] =
    useCreateAccessoriesMasterMutation();
  const [deActivate, { isLoading: isDeActivating }] = useDeActivateMutation();

  const {
    formData,
    setFormData,
    variationsList,
    setVariationsList,
    setVariationData,
    setPricingData,
    resetVariationData,
    populateExistingProduct,
    isEditing,
    allLocations,
  } = useFormData();

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: formData,
    resolver: zodResolver(accessoriesMasterSchema),
    mode: "onTouched",
  });

  // Populate form on fetch
  useEffect(() => {
    if (masterData?.data && !isEditing) {
      const master = masterData.data;
      const formValues = {
        BrandID: master.Brand.Id || "",
        ProductName: master.ProductName || "",
        ProductCode: master.ProductCode || "",
        HSN: master.HSN || "",
        TaxID: master.TaxID || "",
      };
      reset(formValues);
      setFormData(formValues);
      populateExistingProduct(master);
    }
  }, [masterData, isMasterLoading, isEditing, reset, setFormData, populateExistingProduct]);

  const handleToggleConfirm = async () => {
    if (!currentVariation) return;

    try {
      setIsToggling(true);

      const newStatus = currentVariation.enabled ? 0 : 1;

      const payload = {
        IsActive: newStatus,
      };

      await deActivate({ id: currentVariation.OPVariationID, payload });

      setVariationsList((prev) =>
        prev.map((v) =>
          v.OPVariationID === currentVariation.OPVariationID
            ? { ...v, enabled: !v.enabled }
            : v
        )
      );

      toast.success(
        `Variation ${
          newStatus === 1 ? "activated" : "deactivated"
        } successfully`
      );
    } catch (error) {
      toast.error("Failed to toggle status");
      console.error(error);
    } finally {
      setIsToggling(false);
      setIsConfirmOpen(false);
      setCurrentVariation(null);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddVariation = () => {
    resetVariationData();
    navigate("variation");
  };

  const handleEditVariation = (variationId) => {
    const variation = variationsList.find(
      (v) => String(v.OPVariationID) === String(variationId)
    );
    if (!variation) return;

    setVariationData({
      Id: variation.Id || null,
      OPVariationID: String(variation.OPVariationID),
      SKUCode: variation.SKUCode || "",
      Barcode: variation.Barcode || "",
      OPMRP: variation.Stock?.OPMRP || "",
      StockId: variation.Stock?.Id || null,
    });

    const pricingData =
      allLocations?.data?.map((location) => ({
        id: String(location.Id),
        location: location.LocationName,
        buyingPrice: variation.Stock?.[`BuyingPrice${location.Id}`] || "",
        sellingPrice: variation.Stock?.[`SellingPrice${location.Id}`] || "",
      })) || [];

    setPricingData(pricingData);

    navigate(`variation`);
  };

  const formatPricing = (variation, type) => {
    if (!allLocations?.data || !variation.Stock) return "-";
    const prices = allLocations.data
      .map((location) => {
        const price = variation.Stock[`${type}${location.Id}`];
        return price ? `${location.LocationName}: ${price}` : null;
      })
      .filter(Boolean);
    return prices.length ? prices.join(", ") : "-";
  };

  const onSave = async (formValues) => {
    if (variationsList.length === 0) {
      toast.error("Please add at least one variation before saving.");
      return;
    }

    const payload = {
      ...formValues,
      Details: variationsList.map((variation) => ({
        Id: variation.Id || null,
        OPVariationID: variation.OPVariationID,
        SKUCode: variation.SKUCode,
        Barcode: variation.Barcode,
        Stock: {
          ...variation.Stock,
          Id: variation.Stock?.Id || null,
        },
      })),
    };
    const appId = allAccess.data.find(
      (p) => p.ApplicationUserId
    ).ApplicationUserId;
    try {
      console.log("Payload sent:", payload);
      let response;
      if (id) {
        response = await updateMaster({ id, payload }).unwrap();
        toast.success("Updated successfully");
      } else {
        response = await createAccessoriesMaster({
          id: appId,
          payload,
        }).unwrap();
        toast.success("Created successfully");
      }

      // Update variationsList with backend response
      if (response?.data?.OtherProductsDetails) {
        const updatedVariations = response.data.OtherProductsDetails.map(
          (detail) => ({
            Id: detail.Id,
            OPVariationID: detail.OPVariationID,
            SKUCode: detail.SKUCode,
            Barcode: detail.Barcode,
            OPMRP: detail.Stock?.OPMRP || "",
            Stock: {
              ...detail.Stock,
              Id: detail.Stock?.Id || null,
              location:
                detail.Stock?.location ||
                allLocations?.data?.map((loc) => String(loc.Id)) ||
                [],
            },
          })
        );
        setVariationsList(updatedVariations);
      }

      navigate(-1);
    } catch (err) {
      console.error("Save failed", err);
      toast.error("Failed to save product");
    }
  };

  if (isMasterLoading) return <h1>Loading...</h1>;

  return (
    <div className="max-w-6xl p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isCreate ? "Create Accessories Master" : "Edit Accessories Master"}
      </h2>

      <form>
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
                  .filter(
                    (brand) =>
                      brand.OthersProductsActive && brand.IsActive === 1
                  )
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
      </form>

      {/* Add Variation Button */}
      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg flex justify-between">
        <p className="text-sm font-medium text-gray-700">
          Need to add at least one variation!
        </p>
        <Button
          onClick={handleAddVariation}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <FiPlusCircle className="h-4 w-4" /> Add Variation
        </Button>
      </div>

      {/* Variation Table */}
      <div className="mt-6 shadow-sm border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "S.No",
                "Barcode",
                "SKU Code",
                "MRP",
                "Buying Price",
                "Selling Price",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {variationsList.length > 0 ? (
              variationsList.map((variation, index) => (
                <tr
                  key={variation.OPVariationID}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {variation.Barcode || (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {variation.SKUCode || (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {variation.Stock?.OPMRP || (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatPricing(variation, "BuyingPrice")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatPricing(variation, "SellingPrice")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <HasPermission module="Brand catagory" action="view">
                        <button
                          onClick={() =>
                            navigate(`view/${variation.OPVariationID}`)
                          }
                          className="text-gray-500 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50"
                          title="View"
                        >
                          <FiEye className="h-5 w-5" />
                        </button>
                      </HasPermission>
                      <HasPermission module="Brand catagory" action="edit">
                        <button
                          onClick={() =>
                            handleEditVariation(variation.OPVariationID)
                          }
                          className="text-gray-500 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-indigo-50"
                          title="Edit"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                      </HasPermission>
                      <HasPermission
                        module="Brand catagory"
                        action="deactivate"
                      >
                        {!isCreate && (
                          <div className="flex-shrink-0">
                            <Toggle
                              enabled={variation.enabled}
                              onToggle={() => {
                                setCurrentVariation(variation);
                                setIsConfirmOpen(true);
                              }}
                              className="ml-2"
                            />
                          </div>
                        )}
                      </HasPermission>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <FiPackage className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-gray-600 font-medium">
                      No variations found
                    </p>
                    <p className="text-gray-500 mt-1">
                      Click "Add Variation" to create one
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      <Button
        className="items-end mt-6"
        onClick={handleSubmit(onSave)}
        disabled={isDataUpdating || isDataCreating}
      >
        {isDataUpdating || isDataCreating ? "Saving..." : "Save"}
      </Button>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setCurrentVariation(null);
        }}
        onConfirm={handleToggleConfirm}
        title={`Confirm ${
          currentVariation?.enabled ? "Deactivation" : "Activation"
        }`}
        message={`Are you sure you want to ${
          currentVariation?.enabled ? "deactivate" : "activate"
        } this variation?`}
        confirmText={currentVariation?.enabled ? "Deactivate" : "Activate"}
        danger={currentVariation?.enabled}
        isLoading={isToggling}
      />
    </div>
  );
};

export default EditAccessoriesMaster;