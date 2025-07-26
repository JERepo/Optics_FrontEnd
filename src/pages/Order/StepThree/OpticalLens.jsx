import React, { useState } from "react";
import {
  useCheckTintQuery,
  useGetAddOnQuery,
  useGetCoatingsQuery,
  useGetFamilyQuery,
  useGetFocalityQuery,
  useGetIndexValuesQuery,
  useGetOrderPreferenceQuery,
  useGetProductDesignQuery,
  useGetSavedOrderDetailsQuery,
  useGetTreatmentsQuery,
} from "../../../api/orderApi";
import { useOrder } from "../../../features/OrderContext";
import { FiArrowLeft, FiPlus } from "react-icons/fi";
import { Autocomplete, TextField } from "@mui/material";
import { useGetAllBrandsQuery } from "../../../api/brandsApi";
import Loader from "../../../components/ui/Loader";

const Input = React.lazy(() => import("../../../components/Form/Input"));
const Radio = React.lazy(() => import("../../../components/Form/Radio"));
const Checkbox = React.lazy(() => import("../../../components/Form/Checkbox"));
const Button = React.lazy(() => import("../../../components/ui/Button"));

const productTypes = [
  { value: 0, lable: "Stock" },
  { value: 1, lable: "Rx" },
];

const OpticalLens = () => {
  const {
    customerId,
    currentStep,
    selectedProduct,
    prevStep,
    setCurrentSubStep,
    setSubStep,
    FrameDetailedId,
  } = useOrder();
  console.log("selected frame deyaild id", FrameDetailedId);
  const [lensData, setLensData] = useState({
    orderReference: null,
    brandId: null,
    productType: null,
    focality: null,
    family: null,
    design: null,
    indexValues: null,
    masterId: null,
    coatingId: null,
    coatingComboId: null,
    treatmentId: null,
    treatmentComboId: null,
    productName: null,
    tintvalue: 0,
    tintId: null,
    addOnData: [],
  });

  // API calls
  const { data: savedOrders, isLoading: isSavedOrdersLoading } =
    useGetSavedOrderDetailsQuery({ orderId: customerId.orderId });

  const { data: orderReferenceData, isLoading: isLoadingOrderReference } =
    useGetOrderPreferenceQuery({ orderId: customerId.orderId });

  const { data: allBrandsData, isLoading: isLoadingAllBrands } =
    useGetAllBrandsQuery();

  const { data: focalityData, isLoading: isLoadingFocality } =
    useGetFocalityQuery(
      {
        brandId: lensData.brandId,
        productType: lensData.productType,
      },
      {
        skip: !(lensData.brandId && lensData.productType !== null),
      }
    );

  const { data: familyData, isLoading: isLoadingFamily } = useGetFamilyQuery(
    {
      brandId: lensData.brandId,
      productType: lensData.productType,
      focalityId: lensData.focality,
    },
    {
      skip: !(
        lensData.brandId &&
        lensData.productType !== null &&
        lensData.focality
      ),
    }
  );

  const { data: productDesignData, isLoading: isLoadingProductDesign } =
    useGetProductDesignQuery(
      {
        brandId: lensData.brandId,
        productType: lensData.productType,
        focalityId: lensData.focality,
        familyId: lensData.family,
      },
      {
        skip: !(
          lensData.brandId &&
          lensData.productType !== null &&
          lensData.focality &&
          lensData.family
        ),
      }
    );

  const { data: indexValuesData, isLoading: isLoadingIndexValues } =
    useGetIndexValuesQuery(
      {
        brandId: lensData.brandId,
        productType: lensData.productType,
        focalityId: lensData.focality,
        familyId: lensData.family,
        designId: lensData.design,
      },
      {
        skip: !(
          lensData.brandId &&
          lensData.productType !== null &&
          lensData.focality &&
          lensData.family &&
          lensData.design
        ),
      }
    );

  const { data: coatingsData, isLoading: isLoadingCoatings } =
    useGetCoatingsQuery(
      { masterId: lensData.masterId },
      { skip: !lensData.masterId }
    );

  const { data: treatmentsData, isLoading: isLoadingTreatments } =
    useGetTreatmentsQuery(
      {
        masterId: lensData.masterId,
        coatingId: lensData.coatingId,
      },
      {
        skip: !lensData.masterId,
      }
    );

  const { data: tintData, isLoading: isTIntDataLoading } = useCheckTintQuery(
    {
      comboId: lensData.coatingComboId,
      locationId: customerId.locationId,
    },
    { skip: !lensData.coatingComboId }
  );

  const { data: addOnData } = useGetAddOnQuery(
    {
      comboId: lensData.coatingComboId,
      locationId: customerId.locationId,
    },
    { skip: !lensData.coatingComboId }
  );

  const handleRefresh = () => {
    setLensData({
      brandId: null,
      productType: null,
      focality: null,
      family: null,
      design: null,
      indexValues: null,
      masterId: null,
      coatingId: null,
      coatingComboId: null,
      treatmentId: null,
      treatmentComboId: null,
      productName: null,
      tintvalue: null,
      tintId: null,
      addOnData: [],
    });
  };
  const handleOLensBack = () => {
    if (selectedProduct.value === 6) {
      // prevSubStep();
      // setCurrentSubStep(5);
      setSubStep(5);
    } else {
      prevStep();
    }
  };
  console.log("coating data", lensData);
  return (
    <div className="max-w-7xl">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">
            Patient Name: {customerId.patientName}
          </h3>
          {selectedProduct.value === 6 && (
            <div className="mt-4">
              {isSavedOrdersLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="border rounded-2xl p-4 shadow-sm bg-white hover:shadow-md transition">
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">
                      {savedOrders[savedOrders?.length - 1]?.ProductName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Size:</span>{" "}
                      {savedOrders[savedOrders?.length - 1]?.Size}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Barcode:</span>{" "}
                      {savedOrders[savedOrders?.length - 1]?.Barcode}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Step {currentStep}
              {selectedProduct.value === 6 ? "(b)" : ""}:{" "}
              {selectedProduct.value === 6
                ? "Optical Lens"
                : selectedProduct.label}
            </h1>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                onClick={handleOLensBack}
                icon={FiArrowLeft}
                variant="outline"
              >
                Back
              </Button>
              <Button
                onClick={handleRefresh}
                icon={FiPlus}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Input
              label="Order reference"
              value={orderReferenceData?.data.OrderReference || ""}
              onChange={(e) =>
                setLensData({ ...lensData, orderReference: e.target.value })
              }
              placeholder="Enter order reference"
              disabled={isLoadingOrderReference}
              className="w-1/2"
            />

            <div className="flex items-center gap-4 mt-4">
              {/* Brand */}
              <div className="space-y-1 w-1/3">
                <label className="text-sm font-medium text-gray-700">
                  Brand
                </label>
                <Autocomplete
                  options={deduplicateOptions(
                    allBrandsData?.filter(
                      (b) => b.IsActive === 1 && b.OpticalLensActive === 1
                    ) || [],
                    "Id"
                  )}
                  getOptionLabel={(option) => option.BrandName || ""}
                  value={
                    allBrandsData?.find(
                      (brand) => brand.Id === lensData.brandId
                    ) || null
                  }
                  onChange={(_, newValue) =>
                    setLensData((prev) => ({
                      ...prev,
                      brandId: newValue?.Id || null,
                    }))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select brand"
                      size="small"
                    />
                  )}
                  loading={isLoadingAllBrands}
                  fullWidth
                  disabled={lensData.productType !== null}
                />
              </div>

              {/* Product Type */}
              {lensData.brandId && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    Product Type
                  </span>
                  {productTypes.map((type) => (
                    <Radio
                      key={type.value}
                      label={type.lable}
                      value={type.value}
                      checked={lensData.productType === type.value}
                      onChange={(e) =>
                        setLensData({
                          ...lensData,
                          productType: parseInt(e.target.value),
                        })
                      }
                      disabled={
                        !!(
                          lensData.focality ||
                          lensData.family ||
                          lensData.design ||
                          lensData.indexValues
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Dependent dropdowns */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              {lensData.brandId && lensData.productType !== null && (
                <AutocompleteField
                  label="Focality"
                  options={deduplicateOptions(
                    focalityData?.data?.filter((b) => b.IsActive === 1) || [],
                    "OpticalLensFocality.Id"
                  )}
                  valueField="OpticalLensFocality.Id"
                  labelField="OpticalLensFocality.Focality"
                  value={lensData.focality}
                  onChange={(val) =>
                    setLensData((prev) => ({ ...prev, focality: val }))
                  }
                  loading={isLoadingFocality}
                  disabled={!!(lensData.family || lensData.design)}
                />
              )}

              {lensData.focality && (
                <AutocompleteField
                  label="Product Family"
                  options={deduplicateOptions(
                    familyData?.data?.filter((b) => b.IsActive === 1) || [],
                    "OpticalLensProductFamily.Id"
                  )}
                  valueField="OpticalLensProductFamily.Id"
                  labelField="OpticalLensProductFamily.FamilyName"
                  value={lensData.family}
                  onChange={(val) =>
                    setLensData((prev) => ({ ...prev, family: val }))
                  }
                  loading={isLoadingFamily}
                  disabled={!!lensData.design}
                />
              )}

              {lensData.family && (
                <AutocompleteField
                  label="Product Design"
                  options={deduplicateOptions(
                    productDesignData?.data?.filter((b) => b.IsActive === 1) ||
                      [],
                    "OpticalLensProductDesign.Id"
                  )}
                  valueField="OpticalLensProductDesign.Id"
                  labelField="OpticalLensProductDesign.DesignName"
                  value={lensData.design}
                  onChange={(val) =>
                    setLensData((prev) => ({ ...prev, design: val }))
                  }
                  loading={isLoadingProductDesign}
                  disabled={!!lensData.masterId}
                />
              )}

              {lensData.design && (
                <AutocompleteField
                  label="Index Values"
                  options={deduplicateOptions(
                    indexValuesData?.data?.filter((b) => b.IsActive === 1) ||
                      [],
                    "OpticalLensIndex.Id"
                  )}
                  valueField="OpticalLensIndex.Id"
                  labelField="OpticalLensIndex.Index"
                  value={lensData.indexValues}
                  onChange={(val, item) =>
                    setLensData((prev) => ({
                      ...prev,
                      indexValues: val,
                      masterId: item?.MasterId || null,
                    }))
                  }
                  loading={isLoadingIndexValues}
                  disabled={!!lensData.masterId}
                />
              )}

              {lensData.masterId && (
                <AutocompleteField
                  label="Coating"
                  options={deduplicateOptions(
                    coatingsData?.data?.filter((b) => b.IsActive === 1) || [],
                    "OpticalLensCoating.Id"
                  )}
                  valueField="OpticalLensCoating.Id"
                  labelField="OpticalLensCoating.CoatingName"
                  value={lensData.coatingId}
                  onChange={(val, item) => {
                    if (!item) {
                      setLensData((prev) => ({
                        ...prev,

                        coatingId: null,
                      }));
                      return;
                    }
                    setLensData((prev) => ({
                      ...prev,

                      coatingId: item.OpticalLensCoating?.Id || null,
                    }));
                  }}
                  loading={isLoadingCoatings}
                  disabled={!!lensData.treatmentId}
                />
              )}

              {lensData.coatingId && (
                <AutocompleteField
                  label="Treatment"
                  options={deduplicateOptions(
                    treatmentsData?.data?.filter((b) => b.IsActive === 1) || [],
                    "OpticalLensTreatment.Id"
                  )}
                  valueField="OpticalLensTreatment.Id"
                  labelField="OpticalLensTreatment.TreatmentName"
                  value={lensData.treatmentId}
                  onChange={(val, item) => {
                    if (!item) {
                      setLensData((prev) => ({
                        ...prev,
                        coatingComboId: null,
                        treatmentId: null,
                      }));
                      return;
                    }
                    setLensData((prev) => ({
                      ...prev,
                      coatingComboId: item.CoatingComboId,
                      treatmentId: item.OpticalLensTreatment?.Id,
                    }));
                  }}
                  loading={isLoadingTreatments}
                />
              )}
            </div>

            <div className="mt-3">
              <Input
                label="Product Name"
                value={lensData.productName || ""}
                onChange={(e) =>
                  setLensData({ ...lensData, productName: e.target.value })
                }
                placeholder="Enter product name"
                className="w-1/2"
              />
            </div>

            <div className="tint-data flex gap-5 items-center">
              {tintData?.data.showTint && lensData.treatmentId && (
                <div className="flex items-center gap-3 w-1/3">
                  <Checkbox
                    label="Tint"
                    checked={lensData.tintvalue === 1}
                    value={lensData.tintvalue}
                    onChange={() =>
                      setLensData((prev) => ({
                        ...prev,
                        tintvalue: prev.tintvalue === 1 ? 0 : 1,
                      }))
                    }
                  />
                  <div className="w-full">
                    <Autocomplete
                      options={deduplicateOptions(
                        tintData?.data.tints || [],
                        "Id"
                      )}
                      getOptionLabel={(option) => option.Name || ""}
                      value={
                        tintData?.data.tints.find(
                          (tint) => tint.Id === lensData.tintId
                        ) || null
                      }
                      onChange={(_, newValue) =>
                        setLensData((prev) => ({
                          ...prev,
                          tintId: newValue?.Id || null,
                        }))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Select Tint"
                          size="small"
                          disabled={!!lensData.treatmentId}
                        />
                      )}
                      isOptionEqualToValue={(option, value) =>
                        option.Id === value.Id
                      }
                      loading={isTIntDataLoading}
                      fullWidth
                    />
                  </div>
                </div>
              )}
              {addOnData?.data && lensData.treatmentId && (
                <div>
                  {addOnData?.data?.map((add) => (
                    <Checkbox
                      key={add.Id}
                      label={add.Name}
                      value={add.Id}
                      checked={lensData.addOnData.includes(add.Id)}
                      onChange={() => {
                        setLensData((prev) => {
                          const exists = prev.addOnData.includes(add.Id);
                          const updatedAddOns = exists
                            ? prev.addOnData.filter((id) => id !== add.Id)
                            : [...prev.addOnData, add.Id];

                          return {
                            ...prev,
                            addOnData: updatedAddOns,
                          };
                        });
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Autocomplete helper component
const AutocompleteField = ({
  label,
  options,
  valueField,
  labelField,
  value,
  onChange,
  loading,
  disabled = false,
}) => {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <Autocomplete
        options={options}
        getOptionLabel={(option) => getNested(option, labelField) || ""}
        value={options.find((o) => getNested(o, valueField) === value) || null}
        onChange={(_, newValue) =>
          onChange(getNested(newValue, valueField), newValue)
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={`Select ${label}`}
            size="small"
            disabled={disabled}
          />
        )}
        loading={loading}
        fullWidth
        disabled={disabled}
      />
    </div>
  );
};

// Utility to safely access nested values
const getNested = (obj, path) =>
  path.split(".").reduce((o, p) => (o ? o[p] : ""), obj);

// Deduplicate based on nested key
const deduplicateOptions = (options, keyPath) => {
  const seen = new Set();
  return options.filter((item) => {
    const key = getNested(item, keyPath);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export default OpticalLens;
