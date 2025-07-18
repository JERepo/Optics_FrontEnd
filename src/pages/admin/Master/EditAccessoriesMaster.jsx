import React, { useEffect, useState } from "react";
import { useGetAllBrandsQuery } from "../../../api/brandsApi";
import {
  useCreateAccessoriesMasterMutation,
  useDeActivateMutation,
  useGetAllMasterQuery,
  useGetMasterByIdQuery,
  useGetTaxQuery,
  useUpdateMasterMutation,
} from "../../../api/accessoriesMaster";
import { useLocation, useNavigate, useParams } from "react-router";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { FiEdit2, FiEye } from "react-icons/fi";
import { useFrameMaster } from "../../../features/frameMasterContext";
import toast from "react-hot-toast";
import { hasPermission } from "../../../utils/permissionUtils";
import { useSelector } from "react-redux";
import HasPermission from "../../../components/HasPermission";
import Toggle from "../../../components/ui/Toggle";
import { useGetAllLocationsQuery } from "../../../api/roleManagementApi";
import FrameAccessMasterForm from "./FrameAccessMasterForm";
import CreateVariation from "./CreateVariation";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import Button from "../../../components/ui/Button";

const EditFrameMaster = () => {
  const { id } = useParams();
  const location = useLocation();
  const isEnabled = location.pathname.includes("/view");
  const { access, user } = useSelector((state) => state.auth);

  const navigate = useNavigate();

  const { data: allLocations } = useGetAllLocationsQuery();
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
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [confirmToggle, setConfirmToggle] = React.useState({
    isOpen: false,
    index: null,
  });
  const [errors, setErrors] = useState({}); // State to hold form validation errors

  const {
    variationData,
    pricingData,
    stock,
    setVariationData,
    setPricingData,
    setStock,
    resetFrameMasterState,
    setFormData,
    formData,
  } = useFrameMaster();

  const [isEditingVariation, setIsEditingVariation] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState(null);

  // Transform API response to our state structure
  useEffect(() => {
    if (masterData?.data && allLocations?.data) {
      const { data } = masterData;

      setFormData({
        BrandID: String(data.Brand.Id),
        ProductName: data.ProductName || "",
        ProductCode: data.ProductCode || "",
        HSN: data.HSN || "",
        TaxID: data.TaxID || "",
      });

      const transformedVariations = [];
      const transformedStock = [];
      const transformedPricing = [];

      data.OtherProductsDetails.forEach((detail) => {
        transformedVariations.push({
          id: detail.Id,
          SKUCode: detail.SKUCode || "",
          Barcode: detail.Barcode || "",
          IsActive: detail.IsActive,
          CreatedDate: detail.CreatedDate,
          OPMainID: detail.OPMainID,
          OPVariationID: detail.OPVariationID || 1,
        });

        transformedStock.push({
          id: detail.Stock?.Id || null,
          FrameBatch: detail.Stock?.FrameBatch || "1",
          FrameSRP: detail.Stock?.OPMRP || "0",
        });

        const pricingForVariation = [];
        allLocations.data.forEach((location) => {
          const locId = location.Id;
          pricingForVariation.push({
            id: locId,
            location: location.LocationName,
            buyingPrice: detail.Stock?.[`BuyingPrice${locId}`] || "0.00",
            sellingPrice: detail.Stock?.[`SellingPrice${locId}`] || "0.00",
          });
        });

        transformedPricing.push(pricingForVariation);
      });

      setVariationData(transformedVariations);
      setStock(transformedStock);
      setPricingData(transformedPricing);
    } else if (!id) {
      resetFrameMasterState();
    }

    return () => {
      if (!id) {
        resetFrameMasterState();
      }
    };
  }, [masterData, allLocations, id]);

  const constructPayload = (formData) => {
    const payload = {
      Id: id ? parseInt(id) : null,
      ProductCode: formData.ProductCode || "",
      ProductName: formData.ProductName || "",
      HSN: formData.HSN || "",
      BrandID: parseInt(formData.BrandID) || null,
      TaxID: parseInt(formData.TaxID) || null,
      OtherProductType: 0,
      Details: variationData.map((variation, index) => {
        const stockData = stock[index] || {};
        const pricingDataForVariation = pricingData[index] || [];

        const locationIds = pricingDataForVariation.map((price) => price.id);
        const locationPricing = {};
        pricingDataForVariation.forEach((price) => {
          const locId = price.id;
          locationPricing[`BuyingPrice${locId}`] =
            parseFloat(price.buyingPrice) || 0;
          locationPricing[`SellingPrice${locId}`] =
            parseFloat(price.sellingPrice) || 0;
          if (!id) {
            locationPricing[`AvgPrice${locId}`] =
              parseFloat(price.buyingPrice) || 0;
            locationPricing[`Quantity${locId}`] = 0;
            locationPricing[`DefectiveQty${locId}`] = 0;
          }
        });

        const originalDetail = masterData?.data?.OtherProductsDetails?.[index];
        const isBarcodeChanged = variation.Barcode !== originalDetail?.Barcode;

        const baseDetail = {
          Id: variation.id || null,
          SKUCode: variation.SKUCode || "",
          Barcode: isBarcodeChanged ? variation.Barcode : undefined,
          OPVariationID: Number(variation.OPVariationID) || 1,
          OPMainID: Number(variation.OPMainID) || null,
          IsActive: variation.IsActive ?? 1,
          Stock: {
            Id: stockData.id || null,
            OPBatchCode: stockData.FrameBatch || 1,
            OPMRP: parseFloat(stockData.FrameSRP) || 0,
            location: locationIds,
            ...locationPricing,
          },
        };

        return baseDetail;
      }),
    };

    return payload;
  };

  const handleToggleStatus = async () => {
    const { index } = confirmToggle;
    const variation = variationData[index];
    const variationId = variation?.id;

    if (!variationId) return;

    try {
      await deActivate({
        id: variationId,
        payload: { IsActive: variation.IsActive == 1 ? 0 : 1 },
      }).unwrap();
      toast.success(
        `Variation ${
          variation.IsActive ? "deactivated" : "activated"
        } successfully`
      );

      const updatedVariations = [...variationData];
      updatedVariations[index].IsActive = !variation.IsActive;
      setVariationData(updatedVariations);
    } catch (error) {
      toast.error("Failed to update variation status");
      console.error("Deactivation error:", error);
    } finally {
      closeConfirmModal();
    }
  };

  const closeConfirmModal = () => {
    setIsConfirmOpen(false);
    setConfirmToggle({ isOpen: false, index: null });
  };

  const validateForm = () => {
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
    if (!formData.HSN) {
      newErrors.HSN = "HSN Code is required.";
    } else if (formData.HSN.length > 6) {
      newErrors.HSN = "HSN Code cannot exceed 6 characters.";
    }
    if (!formData.TaxID) {
      newErrors.TaxID = "Tax is required.";
    }
    return newErrors;
  };

  const handleSubmit = async () => {
    if (variationData.length <= 0) {
      toast.error("Add at least one variation");
      return;
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors); // Update errors state to display in form
      return;
    }

    setErrors({}); // Clear errors if validation passes
    const finalPayload = constructPayload(formData);

    try {
      if (id) {
        await updateMaster({
          id: parseInt(id),
          appId: user.Id,
          payload: finalPayload,
        }).unwrap();
        toast.success("Accessory updated");
      } else {
        await createAccessoriesMaster({
          id: user.Id,
          payload: finalPayload,
        }).unwrap();
        toast.success("Accessory created");
      }
      navigate(-1);
    } catch (error) {
      console.error("Error saving frame:", error);
      toast.error("Failed to save accessory");
    }
  };

  const handleEditVariation = (index) => {
    setEditingIndex(index);
    setIsEditingVariation(true);
  };

  const handleSaveVariation = (newVariation) => {
    const updatedVariation = {
      ...newVariation.variation,
      OPVariationID: newVariation.variation.OPVariationID || 1,
      IsActive: newVariation.variation.IsActive ?? 1,
      id: newVariation.variation.id || null,
      OPMainID: newVariation.variation.OPMainID || null,
      CreatedDate: newVariation.variation.CreatedDate || null,
    };

    if (editingIndex !== null) {
      const updatedVariations = [...variationData];
      updatedVariations[editingIndex] = updatedVariation;

      const updatedStock = [...stock];
      updatedStock[editingIndex] = {
        ...newVariation.stock,
        FrameBatch: newVariation.stock.OPBatchCode || "1",
        FrameSRP: newVariation.stock.OPMRP || "0",
        id: newVariation.stock.id || null,
      };

      const updatedPricing = [...pricingData];
      updatedPricing[editingIndex] = newVariation.pricing;

      setVariationData(updatedVariations);
      setStock(updatedStock);
      setPricingData(updatedPricing);
    } else {
      setVariationData([...variationData, updatedVariation]);
      setStock([
        ...stock,
        {
          ...newVariation.stock,
          FrameBatch: newVariation.stock.OPBatchCode || "1",
          FrameSRP: newVariation.stock.OPMRP || "0",
          id: null,
        },
      ]);
      setPricingData([...pricingData, newVariation.pricing]);
    }
    setIsEditingVariation(false);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setIsEditingVariation(false);
    setEditingIndex(null);
  };

  const handleToggleConfirm = (index) => {
    setConfirmToggle({ isOpen: true, index });
    setIsConfirmOpen(true);
  };

  if (isMasterLoading || loadingBrands || loadingTaxes) {
    return <div>Loading form data...</div>;
  }

  return (
    <div className="">
      {isEditingVariation ? (
        <CreateVariation
          onSave={handleSaveVariation}
          onCancel={handleCancelEdit}
          initialVariation={
            editingIndex !== null ? variationData[editingIndex] : null
          }
          initialPricing={
            editingIndex !== null ? pricingData[editingIndex] : []
          }
          initialStock={
            editingIndex !== null ? stock[editingIndex] : { FrameSRP: "0" }
          }
          isEnabled={isEnabled}
        />
      ) : (
        <div className="max-w-6xl">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="flex justify-between items-center px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {id
                  ? isEnabled
                    ? "View Accessory"
                    : "Edit Accessory"
                  : "Create New Accessory"}
              </h3>
              <Button onClick={() => navigate(-1)}>Back</Button>
            </div>
            <FrameAccessMasterForm
              initialValues={formData}
              brands={brands}
              taxOptions={allTaxes}
              isEditMode={!!id}
              isEnabled={isEnabled}
              id={id}
              errors={errors}
              setErrors={setErrors}
            />
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Variations</h3>
              {!isEnabled && (
                <Button onClick={() => handleEditVariation(null)}>
                  Add variation
                </Button>
              )}
            </div>

            <Table
              columns={[
                "S.No",
                "Barcode",
                "SKU Code",
                "MRP",
                "Buying Price",
                "Selling Price",
                "Actions",
              ]}
              data={variationData}
              renderRow={(variation, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{variation.Barcode || "-"}</TableCell>
                  <TableCell>{variation.SKUCode || "-"}</TableCell>
                  <TableCell>{stock[index]?.FrameSRP || "-"}</TableCell>
                  <TableCell className="text-sm min-w-[200px]">
                    {pricingData[index]?.length > 0 ? (
                      <div className="space-y-1">
                        {pricingData[index].map((item) => (
                          <div
                            key={`buy-${item.id}-${index}`}
                            className="flex justify-between"
                          >
                            <span className="font-medium text-gray-600">
                              {item.location}
                            </span>
                            <HasPermission
                              module="Accessory Master"
                              action={["edit", "create"]}
                            >
                              <span>
                                {parseFloat(item.buyingPrice).toFixed(2)}
                              </span>
                            </HasPermission>
                          </div>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-sm min-w-[200px]">
                    {pricingData[index]?.length > 0 ? (
                      <div className="space-y-1">
                        {pricingData[index].map((item) => (
                          <div
                            key={`sell-${item.id}-${index}`}
                            className="flex justify-between"
                          >
                            <span className="font-medium text-gray-600">
                              {item.location}
                            </span>
                            <span>
                              {parseFloat(item.sellingPrice).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {isEnabled && (
                        <HasPermission module="Accessory Master" action="view">
                          <FiEye
                            className="text-xl cursor-pointer"
                            onClick={() => handleEditVariation(index)}
                          />
                        </HasPermission>
                      )}
                      {!isEnabled && (
                        <HasPermission module="Accessory Master" action="edit">
                          <button
                            onClick={() => handleEditVariation(index)}
                            className="text-neutral-600 hover:text-primary transition-colors"
                            aria-label="Edit"
                          >
                            <FiEdit2 size={18} />
                          </button>
                        </HasPermission>
                      )}
                      {!isEnabled && (
                        <HasPermission
                          module="Accessory Master"
                          action="deactivate"
                        >
                          <div className="flex-shrink-0">
                            <Toggle
                              enabled={variation.IsActive}
                              onToggle={() => handleToggleConfirm(index)}
                              className="ml-2"
                            />
                          </div>
                        </HasPermission>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            />
          </div>

          {/* Submit Button */}
          {!isEnabled && (
            <div className="flex justify-end pt-4">
              <HasPermission
                module="Accessory Master"
                action={["edit", "create"]}
              >
                <Button
                  onClick={handleSubmit}
                  disabled={isDataCreating || isDataUpdating}
                  loading={isDataCreating || isDataUpdating}
                >
                  {isDataCreating || isDataUpdating
                    ? isDataUpdating
                      ? "Updating"
                      : "Creating"
                    : id
                    ? "Update Accessory"
                    : "Save Accessory"}
                </Button>
              </HasPermission>
            </div>
          )}
        </div>
      )}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setConfirmToggle({ isOpen: false, index: null });
        }}
        onConfirm={handleToggleStatus}
        isLoading={isDeActivating}
        title={`Confirm ${
          variationData[confirmToggle.index]?.IsActive
            ? "Deactivation"
            : "Activation"
        }`}
        message={`Are you sure you want to ${
          variationData[confirmToggle.index]?.IsActive
            ? "deactivate"
            : "activate"
        } this variation?`}
        confirmText={
          variationData[confirmToggle.index]?.IsActive
            ? "Deactivate"
            : "Activate"
        }
        danger={variationData[confirmToggle.index]?.IsActive}
      />
    </div>
  );
};

export default EditFrameMaster;
