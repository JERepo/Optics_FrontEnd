import React, { useEffect } from "react";
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
} from "../../../api/frameMasterApi";
import { useGetAllLocationsQuery } from "../../../api/roleManagementApi";
import toast from "react-hot-toast";
import { hasPermission } from "../../../utils/permissionUtils";
import { useSelector } from "react-redux";
import HasPermission from "../../../components/HasPermission";
import Toggle from "../../../components/ui/Toggle";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";

const EditFrameMaster = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEnabled = location.pathname.includes("/view");
  const { access } = useSelector((state) => state.auth);
  const { data: allBrands } = useGetAllBrandsQuery();
  const { data: allTax } = useGetTaxQuery();
  const { data: allMaterials } = useGetAllmaterialsQuery();
  const { data: allRimTypes } = useGetAllRimTypeQuery();
  const { data: allShapes } = useGetAllShapesQuery();
  const { data: allLocations } = useGetAllLocationsQuery();
  const [createFrameMaster] = useCreateFrameMasterMutation();
  const [updateFramemaster] = useUpdateFramemasterMutation();
  const { data: frameMaster, isLoading: isFrameLoading } =
    useGetFrameMasterByIdQuery(id ? { id } : { skip: true });
  const { data: allFrames } = useGetAllFrameMasterQuery();
  const hasViewAccess = hasPermission(access, "Frame Master", "view");
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [currentVariation, setCurrentVariation] = React.useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

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
    if (frameMaster?.data && allLocations?.data) {
      const { data: masterData } = frameMaster;

      // Set initial form data
      setFormData({
        BrandID: String(masterData.Brand.Id),
        ModelNo: masterData.ModelNo,
        Category: String(masterData.Category), // ← "0" or "1"
        Type: String(masterData.FrameRimType.Id),
        ShapeID: String(masterData.FrameShapeMaster.Id),
        FrontMaterialID: String(masterData.FrontMaterial.Id),
        TempleMaterialID: String(masterData.TempleMaterial.Id),
        Gender: String(masterData.Gender),
        IsClipOn: masterData.IsClipOn,
        NoOfClips: masterData.NoOfClips,
        IsRxable: masterData.IsRxable,
        CaptureSlNo: masterData.CaptureSlNo,
        HSN: masterData.HSN,
        TaxID: String(masterData.TaxMain.Id),
      });

      // Transform variations and pricing data
      const transformedVariations = [];
      const transformedStock = [];
      const transformedPricing = [];

      masterData.FrameDetails.forEach((detail) => {
        // Variation data
        transformedVariations.push({
          id: detail.Id,
          ColourCode: detail.ColourCode,
          Size: detail.Size,
          DBL: detail.DBL,
          TempleLength: detail.TempleLength,
          SkuCode: detail.SkuCode,
          Barcode: detail.Barcode,
          FrameFrontColor: detail.FrameFrontColor,
          TempleColor: detail.TempleColor,
          LensColor: detail.LensColor,
          IsPhotochromatic: detail.IsPhotochromatic,
          IsPolarised: detail.IsPolarised,
          LaunchSeason: detail.LaunchSeason || "",
        });

        // Stock data
        transformedStock.push({
          id: detail.Stock?.Id || null,
          FrameBatch: detail.Stock?.FrameBatch || "",
          FrameSRP: detail.Stock?.FrameSRP || "0.00",
        });

        // Pricing data
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
      // For new frame, reset state
      resetFrameMasterState();
    }

    return () => {
      if (!id) {
        resetFrameMasterState();
      }
    };
  }, [frameMaster, allLocations, id]);

  const constructPayload = (formData) => {
    const payload = {
      Id: id ? parseInt(id) : null, // Include ID for updates, null for new
      BrandID: formData.BrandID,
      ModelNo: formData.ModelNo,
      Category: formData.Category,
      Type: formData.Type,
      ShapeID: formData.ShapeID,
      FrontMaterialID: formData.FrontMaterialID,
      TempleMaterialID: formData.TempleMaterialID,
      Gender: formData.Gender,
      IsClipOn: formData.IsClipOn,
      NoOfClips: formData.NoOfClips,
      IsRxable: formData.IsRxable,
      CaptureSlNo: formData.CaptureSlNo || 0,
      HSN: formData.HSN,
      TaxID: formData.TaxID,
      Details: variationData.map((variation, index) => {
        const stockData = stock[index] || {};
        const pricingDataForVariation = pricingData[index] || [];

        const locationIds = pricingDataForVariation.map((price) => price.id);
        const locationPricing = {};
        pricingDataForVariation.forEach((price) => {
          const locId = price.id;
          locationPricing[`BuyingPrice${locId}`] = price.buyingPrice;
          locationPricing[`SellingPrice${locId}`] = price.sellingPrice;
          locationPricing[`AvgPrice${locId}`] =
            (parseFloat(price.buyingPrice || 0) +
              parseFloat(price.sellingPrice || 0)) /
            2;
          locationPricing[`Quantity${locId}`] = 0;
          locationPricing[`DefectiveQty${locId}`] = 0;
        });

        // Get the original barcode from fetched data
        const originalDetail = frameMaster?.data?.FrameDetails?.[index];
        const isBarcodeChanged = variation.Barcode !== originalDetail?.Barcode;

        const baseDetail = {
          Id: variation.id || null,
          ColourCode: variation.ColourCode,
          Size: variation.Size,
          DBL: variation.DBL,
          TempleLength: variation.TempleLength,
          SkuCode: variation.SkuCode,
          FrameFrontColor: variation.FrameFrontColor,
          TempleColor: variation.TempleColor,
          LensColor: variation.LensColor,
          IsPhotochromatic: variation.IsPhotochromatic,
          IsPolarised: variation.IsPolarised,
          LaunchSeason: variation.LaunchSeason || "",
          Stock: {
            Id: stockData.id || null,
            FrameBatch: stockData.FrameBatch || "",
            FrameSRP: stockData.FrameSRP || "0.00",
            location: locationIds,
            ...locationPricing,
          },
          FrameImages: variation.FrameImages || [],
        };

        // Only include Barcode if it's changed
        if (isBarcodeChanged) {
          baseDetail.Barcode = variation.Barcode;
        }

        return baseDetail;
      }),
    };

    return payload;
  };

  const handleSubmit = async (formData) => {
    if (variationData.length <= 0) {
      toast.error("Add atleast one variation");
      return;
    }
    const finalPayload = constructPayload(formData);
    const appId = allFrames?.data.find(
      (p) => p.ApplicationUserId
    ).ApplicationUserId;

    try {
      if (id) {
        // Update existing frame
        await updateFramemaster({
          id: parseInt(id),
          payload: finalPayload,
        }).unwrap();
      } else {
        // Create new frame
        await createFrameMaster({ id: appId, payload: finalPayload }).unwrap();
      }
      navigate(-1); // Redirect after success
    } catch (error) {
      console.error("Error saving frame:", error);
      // Handle error (show toast, etc.)
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
    };

    if (editingIndex !== null) {
      // Update existing variation
      const updatedVariations = [...variationData];
      updatedVariations[editingIndex] = updatedVariation;

      const updatedStock = [...stock];
      updatedStock[editingIndex] = newVariation.stock;

      const updatedPricing = [...pricingData];
      updatedPricing[editingIndex] = newVariation.pricing;

      setVariationData(updatedVariations);
      setStock(updatedStock);
      setPricingData(updatedPricing);
    } else {
      // Add new variation
      setVariationData([...variationData, updatedVariation]);
      setStock([...stock, newVariation.stock]);
      setPricingData([...pricingData, newVariation.pricing]);
    }
    setIsEditingVariation(false);
    setEditingIndex(null);
  };

  const handleToggleStatus = async () => {
    if (!currentVariation) return;

    setIsUpdatingStatus(true);
    try {
      // Update the enabled status locally (if needed) or make an API call here
      const updatedVariations = variationData.map((v) =>
        v === currentVariation ? { ...v, enabled: !v.enabled } : v
      );
      setVariationData(updatedVariations);
      toast.success(
        `Variation ${currentVariation.enabled ? "deactivated" : "activated"}`
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
    !allBrands?.data ||
    !allRimTypes?.data ||
    !allShapes?.data ||
    !allMaterials?.data ||
    !allTax?.data
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
            editingIndex !== null ? stock[editingIndex] : { FrameSRP: "0.00" }
          }
          isEnabled={isEnabled}
        />
      ) : (
        <div className="max-w-6xl">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {id
                  ? isEnabled
                    ? "View Frame"
                    : "Edit Frame"
                  : "Create New Frame"}
              </h3>
            </div>
            <FrameMasterForm
              onSubmit={handleSubmit}
              initialValues={formData}
              brands={allBrands?.data}
              rimTypes={allRimTypes?.data}
              rimShapes={allShapes?.data}
              materials={allMaterials?.data}
              taxOptions={allTax?.data}
              navigate={navigate}
              isEditMode={!!id}
              isEnabled={isEnabled}
            />
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Variations</h3>
              {!isEnabled && (
                <button
                  onClick={() => handleEditVariation(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Variation
                </button>
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
                            {!hasViewAccess && (
                              <span>
                                {parseFloat(item.buyingPrice).toFixed(2)}
                              </span>
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
                      <FiEye
                        className="text-xl cursor-pointer"
                        onClick={() => handleEditVariation(index)}
                      />
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
                          module="Accessory Master"
                          action="deactivate"
                        >
                          {/* {!isCreate && ( */}
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
                          {/* )} */}
                        </HasPermission>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            />
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleToggleStatus}
        isLoading={isUpdatingStatus}
        title={`Confirm ${
          currentVariation?.enabled ? "Deactivation" : "Activation"
        }`}
        message={`Are you sure you want to ${
          currentVariation?.enabled ? "deactivate" : "activate"
        } this variation?`}
        confirmText={currentVariation?.enabled ? "Deactivate" : "Activate"}
        danger={currentVariation?.enabled}
      />
    </div>
  );
};

export default EditFrameMaster;
