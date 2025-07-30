import React, { useEffect, useRef } from "react";
import FrameMasterForm from "./FrameMasterForm";
import { useGetAllBrandsQuery } from "../../../api/brandsApi";
import { useGetTaxQuery } from "../../../api/accessoriesMaster";
import {
  useGetAllmaterialsQuery,
  useGetAllRimTypeQuery,
} from "../../../api/materialMaster";
import { useGetAllShapesQuery } from "../../../api/shapeMasterApi";
import { useLocation, useNavigate, useParams } from "react-router";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { FiEdit2, FiEye } from "react-icons/fi";
import { useFrameMaster } from "../../../features/frameMasterContext";
import CreateVariationForm from "./CreateVariationForm";
import {
  useCreateFrameMasterMutation,
  useGetAllFrameMasterQuery,
  useGetFrameMasterByIdQuery,
  useUpdateFramemasterMutation,
  useDeActivateMutation,
} from "../../../api/frameMasterApi";
import { useGetAllLocationsQuery } from "../../../api/roleManagementApi";
import toast from "react-hot-toast";
import { hasPermission } from "../../../utils/permissionUtils";
import { useSelector } from "react-redux";
import HasPermission from "../../../components/HasPermission";
import Toggle from "../../../components/ui/Toggle";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import Button from "../../../components/ui/Button";

const EditFrameMaster = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEnabled = location.pathname.includes("/view");
  const { access, user } = useSelector((state) => state.auth);
  const { data: allBrands, isLoading: allBrandsLoading } =
    useGetAllBrandsQuery();
  const { data: allTax, isLoading: allTaxLoading } = useGetTaxQuery();
  const { data: allMaterials, isLoading: allMaterialsLoading } =
    useGetAllmaterialsQuery();
  const { data: allRimTypes, isLoading: allRimsLoading } =
    useGetAllRimTypeQuery();
  const { data: allShapes, isLoading: allShapesLoading } =
    useGetAllShapesQuery();
  const { data: allLocations, isLoading: allLocationsLoading } =
    useGetAllLocationsQuery();
  const [createFrameMaster, { isLoading: isFrameCreating }] =
    useCreateFrameMasterMutation();
  const [updateFramemaster, { isLoading: isFrameUpdating }] =
    useUpdateFramemasterMutation();
  const [deActivate] = useDeActivateMutation();
  const { data: frameMaster, isLoading: isFrameLoading } =
    useGetFrameMasterByIdQuery(id ? { id } : { skip: true });
  const { data: allFrames } = useGetAllFrameMasterQuery();
  const hasViewAccess = hasPermission(access, "Frame Master", ["view"]);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [currentVariation, setCurrentVariation] = React.useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const formRef = useRef(null);

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

  useEffect(() => {
    if (frameMaster?.data && allLocations?.data) {
      const { data: masterData } = frameMaster;

      setFormData({
        BrandID: String(masterData.Brand.Id),
        ModelNo: masterData.ModelNo,
        Category: String(masterData.Category),
        Type: String(masterData.FrameRimType.Id),
        ShapeID: String(masterData.ShapeID),
        FrontMaterialID: String(masterData.FrontMaterialID),
        TempleMaterialID: String(masterData.TempleMaterialID),
        Gender: String(masterData.Gender),
        IsClipOn: masterData.IsClipOn == 1 ? true :false,
        NoOfClips: masterData.NoOfClips,
        IsRxable: masterData.IsRxable,
        CaptureSlNo: String(masterData.CaptureSlNo),
        HSN: masterData.HSN,
        TaxID: masterData.TaxID,
      });

      const transformedVariations = [];
      const transformedStock = [];
      const transformedPricing = [];

      masterData.FrameDetails.forEach((detail) => {
        transformedVariations.push({
          id: detail.Id,
          ColourCode: detail.ColourCode || null,
          Size: detail.Size || null,
          DBL: detail.DBL || null,
          TempleLength: detail.TempleLength || null,
          SkuCode: detail.SkuCode || null,
          Barcode: detail.Barcode || null,
          FrameFrontColor: detail.FrameFrontColor || null,
          TempleColor: detail.TempleColor || null,
          LensColor: detail.LensColor || null,
          IsPhotochromatic: String(detail.IsPhotochromatic ?? 0),
          IsPolarised: String(detail.IsPolarised ?? 0),
          LaunchSeason: detail.LaunchSeason || null,
          IsActive: detail.IsActive ?? 1,
          FrameImages: detail.FrameImages || [],
        });

        transformedStock.push({
          FrameDetailId: detail.Stock?.FrameDetailId || null,
          FrameBatch: detail.Stock?.FrameBatch || 1,
          FrameSRP: detail.Stock?.FrameSRP.toString() || 0,
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
  }, [frameMaster?.data, allLocations?.data, id]);

  const constructPayload = (formData) => {
    const payload = {
      Id: id ? parseInt(id) : null,
      BrandID: Number(formData.BrandID),
      ModelNo: formData.ModelNo,
      Category: Number(formData.Category),
      Type: Number(formData.Type),
      ShapeID: Number(formData.ShapeID) || null,
      FrontMaterialID: Number(formData.FrontMaterialID) || null,
      TempleMaterialID: Number(formData.TempleMaterialID) || null,
      Gender: Number(formData.Gender),
      IsClipOn: formData.IsClipOn ? 1 : 0,
      NoOfClips: Number(formData.NoOfClips) || null,
      IsRxable: formData.IsRxable ? 1 : 0,
      CaptureSlNo: Number(formData.CaptureSlNo) || 0,
      HSN: formData.HSN,
      TaxID: Number(formData.TaxID),
      ApplicationUserId: user.Id,
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

        const originalDetail = frameMaster?.data?.FrameDetails?.[index];
        const isBarcodeChanged = variation.Barcode !== originalDetail?.Barcode;

        const baseDetail = {
          Id: variation.id || null,
          ColourCode: variation.ColourCode,
          Size: variation.Size,
          DBL: !variation.DBL ? null : variation.DBL,
          TempleLength: variation.TempleLength,
          SkuCode: variation.SkuCode,
          FrameFrontColor: variation.FrameFrontColor,
          TempleColor: variation.TempleColor,
          LensColor: variation.LensColor,
          IsPhotochromatic: Number(variation.IsPhotochromatic),
          IsPolarised: Number(variation.IsPolarised),
          LaunchSeason: Number(variation.LaunchSeason) || null,
          IsActive: Number(variation.IsActive ?? 1),
          FrameImages: variation.FrameImages || [],
          Stock: {
            FrameDetailId: Number(stockData.FrameDetailId) || null,
            FrameBatch: stockData.FrameBatch || 1,
            FrameSRP: parseFloat(stockData.FrameSRP) || 0,
            location: locationIds,
            ...locationPricing,
          },
        };
        if (isBarcodeChanged) {
          baseDetail.Barcode = variation.Barcode;
        }
        return baseDetail;
      }),
    };

    return payload;
  };

  const handleSubmit = async () => {
    if (variationData.length <= 0) {
      toast.error("Add at least one variation");
      return;
    }

    // Call the validate function from FrameMasterForm
    const validationErrors = formRef.current?.validate();
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      return; // Validation failed, errors are displayed in FrameMasterForm
    }

    const finalPayload = constructPayload(formData);
    try {
      if (id) {
        await updateFramemaster({
          id: parseInt(id),
          payload: finalPayload,
          appId: user.Id,
        }).unwrap();
        toast.success("Frame updated successfully");
      } else {
        await createFrameMaster({
          id: user.Id,
          payload: finalPayload,
        }).unwrap();
        toast.success("Frame created successfully");
      }
      navigate(-1);
      resetFrameMasterState();
    } catch (error) {
      console.error("Error saving frame:", error);
      toast.error("Failed to save frame");
    }
  };

  const handleEditVariation = (index) => {
    setEditingIndex(index);
    setIsEditingVariation(true);
  };

  const handleSaveVariation = (newVariation) => {
    const updatedVariation = {
      ...newVariation.variation,
      FrameImages: newVariation.variation.FrameImages || [],
      IsActive: newVariation.variation.IsActive ?? 1,
      id: newVariation.variation.id || null,
    };

    if (editingIndex !== null) {
      const updatedVariations = [...variationData];
      updatedVariations[editingIndex] = updatedVariation;

      const updatedStock = [...stock];
      updatedStock[editingIndex] = {
        ...newVariation.stock,
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
          id: null,
        },
      ]);
      setPricingData([...pricingData, newVariation.pricing]);
    }
    setIsEditingVariation(false);
    setEditingIndex(null);
  };

  const handleToggleStatus = async () => {
    if (!currentVariation) return;

    setIsUpdatingStatus(true);
    try {
      await deActivate({
        id: currentVariation.id,
        payload: { IsActive: currentVariation.IsActive === 1 ? 0 : 1 },
      }).unwrap();
      const updatedVariations = variationData.map((v) =>
        v.id === currentVariation.id
          ? { ...v, IsActive: v.IsActive === 1 ? 0 : 1 }
          : v
      );
      setVariationData(updatedVariations);
      toast.success(
        `Variation ${
          currentVariation.IsActive === 1 ? "deactivated" : "activated"
        }`
      );
    } catch (err) {
      toast.error("Failed to update variation status.");
    } finally {
      setIsUpdatingStatus(false);
      setIsConfirmOpen(false);
      setCurrentVariation(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingVariation(false);
    setEditingIndex(null);
  };

  if (
    isFrameLoading ||
    allBrandsLoading ||
    allRimsLoading ||
    allShapesLoading ||
    allLocationsLoading ||
    allMaterialsLoading ||
    allTaxLoading
  ) {
    return <div>Loading form data...</div>;
  }

  return (
    <div className="">
      {isEditingVariation ? (
        <CreateVariationForm
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
                    ? "View Frame"
                    : "Edit Frame"
                  : "Create New Frame"}
              </h3>
              <Button onClick={() => navigate(-1)}>Back</Button>
            </div>
            <FrameMasterForm
              ref={formRef}
              initialValues={formData}
              brands={allBrands}
              rimTypes={allRimTypes?.data}
              rimShapes={allShapes}
              materials={allMaterials}
              taxOptions={allTax?.data}
              isEnabled={isEnabled}
              isEditMode={!!id}
            />
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Variations</h3>
              {!isEnabled && (
                <Button onClick={() => handleEditVariation(null)}>
                  Add Variation
                </Button>
              )}
            </div>

            <Table
              columns={[
                "S.No",
                "Colour Code",
                "Size",
                "Frame Front Colour",
                "SKU",
                "Barcode",
                "SRP",
                "Buying Prices",
                "Selling Prices",
                "Actions",
              ]}
              data={variationData}
              renderRow={(variation, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{variation.ColourCode || "-"}</TableCell>
                  <TableCell>{variation.Size || "-"}</TableCell>
                  <TableCell>{variation.FrameFrontColor || "-"}</TableCell>
                  <TableCell>{variation.SkuCode || "-"}</TableCell>
                  <TableCell>{variation.Barcode || "-"}</TableCell>
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
                            {!isEnabled && (
                              <HasPermission
                                module="Frame Master"
                                action={["create", "edit"]}
                              >
                                <span>
                                  {parseFloat(item.buyingPrice).toFixed(2)}
                                </span>
                              </HasPermission>
                            )}
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
                        <FiEye
                          className="text-xl cursor-pointer"
                          onClick={() => handleEditVariation(index)}
                        />
                      )}

                      {!isEnabled && (
                        <button
                          onClick={() => handleEditVariation(index)}
                          className="text-neutral-600 hover:text-primary transition-colors"
                          aria-label="Edit"
                        >
                          <FiEdit2 size={18} />
                        </button>
                      )}
                      {!isEnabled && (
                        <HasPermission
                          module="Frame Master"
                          action="deactivate"
                        >
                          <div className="flex-shrink-0">
                            <Toggle
                              enabled={variation.IsActive === 1}
                              onToggle={() => {
                                setCurrentVariation(variation);
                                setIsConfirmOpen(true);
                              }}
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

          <div className="flex justify-end pt-4">
            {!isEnabled && (
              <HasPermission module="Frame Master" action={["edit", "create"]}>
                <Button
                  onClick={handleSubmit}
                  disabled={isFrameCreating || isFrameUpdating}
                  loading={isFrameCreating || isFrameUpdating}
                >
                  {isFrameCreating || isFrameUpdating
                    ? isFrameUpdating
                      ? "Updating"
                      : "Creating"
                    : id
                    ? "Update Frame Master"
                    : "Save Frame Master"}
                </Button>
              </HasPermission>
            )}
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setCurrentVariation(null);
        }}
        onConfirm={handleToggleStatus}
        isLoading={isUpdatingStatus}
        title={`Confirm ${
          currentVariation?.IsActive === 1 ? "Deactivation" : "Activation"
        }`}
        message={`Are you sure you want to ${
          currentVariation?.IsActive === 1 ? "deactivate" : "activate"
        } this variation?`}
        confirmText={
          currentVariation?.IsActive === 1 ? "Deactivate" : "Activate"
        }
        danger={currentVariation?.IsActive === 1}
      />
    </div>
  );
};

export default EditFrameMaster;
