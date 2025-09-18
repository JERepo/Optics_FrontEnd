import React, { useEffect, useState } from "react";
import { useOrder } from "../../../features/OrderContext";
import { FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { useGetAllBrandsQuery } from "../../../api/brandsApi";
import {
  useCheckTintQuery,
  useGetAddOnQuery,
  useGetCoatingsQuery,
  useGetFamilyQuery,
  useGetFocalityQuery,
  useGetIndexValuesQuery,
  useGetProductDesignQuery,
  useGetTreatmentsQuery,
} from "../../../api/orderApi";
import Radio from "../../../components/Form/Radio";
import { Autocomplete, TextField } from "@mui/material";
import { isValidNumericInput } from "../../../utils/isValidNumericInput";
import toast from "react-hot-toast";
import Input from "../../../components/Form/Input";
import Checkbox from "../../../components/Form/Checkbox";
import {
  useGetAddOnByBrandIdQuery,
  useGetCoatingsByBrandQuery,
  useGetTreatmentsByBrandQuery,
  useSaveOfferProductMutation,
} from "../../../api/offerApi";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { ErrorDisplayModal } from "../../../components/ErrorsDisplay";
import { useNavigate } from "react-router";

const options = [
  { value: 1, label: "All Brands" },
  { value: 2, label: "Family" },
  { value: 3, label: "Coating" },
  { value: 4, label: "Treatment" },
];
const productTypes = [
  { value: 0, lable: "Stock" },
  { value: 1, lable: "Rx" },
];

const tints = [
  { value: 1, label: "Any" },
  { value: 2, label: "With Tint" },
  { value: 3, label: "Without Tint" },
];

const OpticalLens = () => {
  const {
    currentOfferStep,
    selectedOfferProduct,
    prevOfferStep,
    customerOffer,
    goToOfferStep,
  } = useOrder();
  const navigate = useNavigate();

  const [discountPV, setDiscountPV] = useState(1);
  const [discountValue, setDiscountValue] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState([]);
  const [showProduct, setShowProduct] = useState(false);
  const [errors, setErrors] = useState(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  const [lensData, setLensData] = useState({
    type: 1,
    brandId: null,
    focalityId: null,
    productType: null,
    tintvalue: 1,
    tintId: null,
    AddOnId: null,
    family: null,
    design: null,
    indexValues: null,
    masterId: null,
    coatingId: null,
    treatmentId: null,
    coatingComboId: null,
    addOnCheck: false,
  });

  //   api quiries
  const { data: allBrandsData, isLoading: isLoadingAllBrands } =
    useGetAllBrandsQuery();

  const { data: addOnData } = useGetAddOnByBrandIdQuery(
    {
      id: lensData.brandId,
    },
    { skip: !lensData.brandId }
  );
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
      focalityId: lensData.focalityId,
    },
    {
      skip: !(
        lensData.brandId &&
        lensData.productType !== null &&
        lensData.focalityId
      ),
    }
  );

  const { data: productDesignData, isLoading: isLoadingProductDesign } =
    useGetProductDesignQuery(
      {
        brandId: lensData.brandId,
        productType: lensData.productType,
        focalityId: lensData.focalityId,
        familyId: lensData.family,
      },
      {
        skip: !(
          lensData.brandId &&
          lensData.productType !== null &&
          lensData.focalityId &&
          lensData.family
        ),
      }
    );

  const { data: indexValuesData, isLoading: isLoadingIndexValues } =
    useGetIndexValuesQuery(
      {
        brandId: lensData.brandId,
        productType: lensData.productType,
        focalityId: lensData.focalityId,
        familyId: lensData.family,
        designId: lensData.design,
      },
      {
        skip: !(
          lensData.brandId &&
          lensData.productType !== null &&
          lensData.focalityId &&
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

  const { data: coatingDataByBrand } = useGetCoatingsByBrandQuery(
    {
      id: lensData.brandId,
    },
    { skip: !lensData.brandId }
  );
  const { data: treatmentDataByBrand } = useGetTreatmentsByBrandQuery(
    {
      id: lensData.brandId,
    },
    { skip: !lensData.brandId }
  );
  const [saveOL, { isLoading: isOLSaving }] = useSaveOfferProductMutation();
  const handleRefresh = () => {
    setShowProduct(false);
  };
  useEffect(() => {
    handleRefresh();
  }, [lensData.type]);

  const filteredBrands = allBrandsData?.filter(
    (b) => b.OpticalLensActive === 1 && b.IsActive === 1
  );
  const generateProductName = (data) => {
    const brand =
      allBrandsData?.find((b) => b.Id === data.brandId)?.BrandName ||
      "Unknown Brand";
    const focality =
      focalityData?.data?.find(
        (f) => f.OpticalLensFocality.Id === data.focalityId
      )?.OpticalLensFocality.Focality || "";
    const family =
      familyData?.data?.find(
        (f) => f.OpticalLensProductFamily.Id === data.family
      )?.OpticalLensProductFamily.FamilyName || "";
    const design =
      productDesignData?.data?.find(
        (d) => d.OpticalLensProductDesign.Id === data.design
      )?.OpticalLensProductDesign.DesignName || "";
    const index =
      indexValuesData?.data?.find(
        (i) => i.OpticalLensIndex.Id === data.indexValues
      )?.OpticalLensIndex.Index || "";
    const coating =
      data.type === 3
        ? coatingDataByBrand?.data?.find((c) => c.Id === data.coatingId)
            ?.CoatingName || ""
        : coatingsData?.data?.find(
            (c) => c.OpticalLensCoating.Id === data.coatingId
          )?.OpticalLensCoating.CoatingName || "";
    const treatment =
      data.type === 4
        ? treatmentDataByBrand?.data?.find((t) => t.Id === data.treatmentId)
            ?.TreatmentName || ""
        : treatmentsData?.data?.find(
            (t) => t.OpticalLensTreatment.Id === data.treatmentId
          )?.OpticalLensTreatment.TreatmentName || "";
    const addOn =
      (data.AddOnId &&
        addOnData?.data?.data?.find((a) => a.Id === data.AddOnId)?.AddOnName) ||
      "";
    const tint = data.tintvalue === 1 ? "Tint:Yes" : "";

    let nameParts = [];
    switch (data.type) {
      case 1: // All Brands
        nameParts = [brand, focality].filter(Boolean);
        break;
      case 2: // Family
        nameParts = [
          brand,
          focality,
          family,
          design,
          index,
          coating,
          treatment,
        ].filter(Boolean);
        break;
      case 3: // Coating
        nameParts = [brand, focality, coating].filter(Boolean);
        break;
      case 4: // Treatment
        nameParts = [brand, focality, treatment].filter(Boolean);
        break;
      default:
        return "Unknown Product";
    }

    // Append optional tint and add-on
    if (addOn) nameParts.push(`Add On: ${addOn}`);
    if (tint) nameParts.push(tint);

    return nameParts.join(" - ") || "Unnamed Product";
  };
  const handleDelete = (index) => {
    const updatedItem = items.filter((item, i) => i !== index);
    setItems(updatedItem);
  };
  const resetForm = () => {
    setLensData((prev) => ({
      ...prev,
      focalityId: null,
      family: null,
      design: null,
      indexValues: null,
      masterId: null,
      coatingId: null,
      treatmentId: null,
      coatingComboId: null,
      tintvalue: null,
      AddOnId: null,
      productType: null,
    }));
    setShowProduct(false);
    setQuantity(1);
    setDiscountValue("");
  };
  const handleAddItem = () => {
    const errors = [];

    // Common validations for all types
    if (!lensData.brandId) {
      errors.push("Brand is required");
    }
    if (quantity <= 0 || !quantity) {
      errors.push("Quantity must be greater than 0");
    }
    if (discountValue === null || discountValue === "" || discountValue < 0) {
      errors.push(
        "Discount value/percentage is required and must be non-negative"
      );
    }
    if (discountPV === 0 && parseFloat(discountValue) > 100) {
      errors.push("Discount percentage cannot exceed 100");
    }

    // Type-specific validations
    switch (lensData.type) {
      case 1: // All Brands
        if (!lensData.focalityId) {
          errors.push("Focality is required for All Brands");
        }
        break;

      case 2: // Family
        if (!lensData.focalityId) {
          errors.push("Focality is required for Family");
        }
        if (!lensData.masterId) {
          errors.push("Please select family,design,Index value");
        }
        // if (!lensData.coatingComboId) {
        //   errors.push("Coating is required");
        // }
        if (showProduct) {
          if (!lensData.coatingId || !lensData.treatmentId) {
            errors.push(
              "Coating and Treatment are required when product is selected"
            );
          }
        }
        break;

      case 3: // Coating
        if (!lensData.focalityId) {
          errors.push("Focality is required for Coating");
        }
        if (!lensData.coatingId) {
          errors.push("Coating is required for Coating type");
        }
        break;

      case 4: // Treatment
        if (!lensData.focalityId) {
          errors.push("Focality is required for Treatment");
        }
        if (!lensData.treatmentId) {
          errors.push("Treatment is required for Treatment type");
        }
        break;

      default:
        errors.push("Invalid type selected");
    }

    if (errors.length > 0) {
      setErrors(errors);
      setErrorModalOpen(true);
      return;
    }

    const productName = generateProductName(lensData);

    setItems((prev) => [
      ...prev,
      {
        ...lensData,
        quantity,
        discountValue,
        discountPV,
        productName,
        showProduct,
      },
    ]);
    toast.success("Item added successfully!");
    resetForm();
  };

  const handleSave = async () => {
    if (items.length <= 0) {
      toast.error("Please add atleast one item to proceed!");
      return;
    }

    const payload = {
      entries: items.map((item) => ({
        OfferMainId: customerOffer.offerMainId ?? null,
        ProductType: 0,
        BrandId: item.brandId,
        OLDetailID: null,
        OLMasterID: item.type === 2 && !item.showProduct ? item.masterId : null,
        OLCoatingComboID: item.type === 2 ? item.coatingComboId : null,
        OLTreatmentID:
          item.type === 1
            ? null
            : item.type === 4
            ? item.treatmentId
            : item.type === 3
            ? null
            : null,
        OLCoatingID:
          item.type === 1
            ? null
            : item.type === 4
            ? null
            : item.type === 3
            ? item.coatingId
            : null,
        OLAddOnId: item.AddOnId ?? null,
        OLFocalityID: item.focalityId,
        OLTintID: item.tintvalue === 1 ? 1 : null,
        Qty: parseInt(item.quantity) ?? 0,
        DiscountType: item.discountPV,
        DiscountPerct:
          item.discountPV === 0 ? parseFloat(item.discountValue) : null,
        DiscountValue:
          item.discountPV === 1 ? parseFloat(item.discountValue) : null,
      })),
    };
    try {
      await saveOL(payload).unwrap();
      toast.success("Optical lens successfully saved");
      navigate("/offer")
    } catch (error) {
      console.log(error);
    }
    console.log(payload);
  };

  return (
    <div>
      <div className="max-w-8xl h-auto">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Header */}
          <div className=" flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">
              Step {currentOfferStep}: {selectedOfferProduct.label}
            </h1>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={prevOfferStep}
                icon={FiArrowLeft}
                variant="outline"
              >
                Back
              </Button>
              <Button>Refresh</Button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="my-5">
              <Table
                columns={[
                  "S.No",
                  "product name",
                  "minqty",
                  "discount",
                  "action",
                ]}
                data={items}
                renderRow={(item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      {item.discountPV === 0
                        ? `${item.discountValue}%`
                        : `₹${item.discountValue}`}
                    </TableCell>

                    <TableCell>
                      <button
                        onClick={() => handleDelete(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 />
                      </button>
                    </TableCell>
                  </TableRow>
                )}
              />
            </div>
          )}
          <div>
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="flex gap-5">
                <Input
                  type="number"
                  label="Minimum Qty to Order"
                  className="w-full"
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (isValidNumericInput(val)) setQuantity(val);
                  }}
                />
              </div>

              {/* Discount section */}
              <div className="">
                <div className="flex items-center gap-5">
                  <Radio
                    name="discount"
                    value="1"
                    onChange={() => setDiscountPV(1)}
                    checked={discountPV === 1}
                    label="Discount Value"
                  />
                  <Radio
                    name="discount"
                    value="0"
                    onChange={() => setDiscountPV(0)}
                    checked={discountPV === 0}
                    label="Discount Percentage %"
                  />
                </div>

                <div className="mt-1">
                  <Input
                    type="number"
                    placeholder={
                      discountPV === 1
                        ? "Enter Discount Value"
                        : "Enter Discount Percentage %"
                    }
                    value={discountValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setDiscountValue("");
                        return;
                      }
                      if (!isValidNumericInput(val)) return;
                      if (discountPV === 0 && parseFloat(val) > 100) {
                        toast.error("Percentage cannot exceed 100!");
                        return;
                      }
                      setDiscountValue(val);
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex flex-col gap-3 flex-grow-1">
                <div className="flex flex-col gap-2">
                  <Autocomplete
                    options={filteredBrands}
                    getOptionLabel={(option) => option.BrandName}
                    onChange={(event, newValue) => {
                      setLensData((prev) => ({
                        ...prev,
                        brandId: newValue?.Id || null,
                        focalityId: null,
                        family: null,
                        design: null,
                        indexValues: null,
                        masterId: null,
                        coatingId: null,
                        treatmentId: null,
                        coatingComboId: null,
                        tintvalue: null,
                        AddOnId: null,
                      }));
                    }}
                    value={
                      filteredBrands?.find((b) => b.Id === lensData.brandId) ||
                      null
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.Id === value.Id
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Brand"
                        variant="outlined"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </div>
              </div>
              <div>
                {lensData.brandId && (
                  <div className="flex items-center gap-3 align-bottom">
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
                          setLensData((prev) => ({
                            ...prev,
                            productType: parseInt(e.target.value),
                            focalityId: null,
                            family: null,
                            design: null,
                            indexValues: null,
                            masterId: null,
                            coatingId: null,
                            treatmentId: null,
                            coatingComboId: null,
                            tintvalue: null,
                            AddOnId: null,
                          }))
                        }
                        disabled={
                          !!(
                            lensData.focalityId ||
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
              <div className="flex-grow-1">
                {(lensData.productType === 0 || lensData.productType === 1) &&
                  lensData.brandId && (
                    <AutocompleteField
                      label="Focality"
                      options={deduplicateOptions(
                        focalityData?.data?.filter((b) => b.IsActive === 1) ||
                          [],
                        "OpticalLensFocality.Id"
                      )}
                      valueField="OpticalLensFocality.Id"
                      labelField="OpticalLensFocality.Focality"
                      value={lensData.focalityId}
                      onChange={(val) =>
                        setLensData((prev) => ({
                          ...prev,
                          focalityId: val,
                          family: null,
                          design: null,
                          indexValues: null,
                          masterId: null,
                          coatingId: null,
                          treatmentId: null,
                          coatingComboId: null,
                        }))
                      }
                      showLabel={false}
                      loading={isLoadingFocality}
                    />
                  )}
              </div>
            </div>
            {lensData.brandId &&
              lensData.focalityId &&
              (lensData.productType === 0 || lensData.productType === 1) && (
                <div className="grid grid-cols-4 gap-3 w-1/2 mt-5">
                  {options.map((item) => (
                    <Radio
                      key={item.value}
                      name="type"
                      value={item.value}
                      onChange={() => {
                        setLensData((prev) => ({
                          ...prev,
                          type: item.value,
                          // focalityId: null,
                          family: null,
                          design: null,
                          indexValues: null,
                          masterId: null,
                          coatingId: null,
                          treatmentId: null,
                          coatingComboId: null,
                          tintvalue: null,
                          AddOnId: null,
                        }));
                      }}
                      checked={lensData.type == item.value}
                      label={item.label}
                    />
                  ))}
                </div>
              )}
            {/* for case 2 family */}

            {lensData.brandId &&
              lensData.focalityId &&
              (lensData.productType === 0 || lensData.productType === 1) && (
                <div className="grid grid-cols-3 gap-5 mt-5">
                  {lensData.focalityId && lensData.type === 2 && (
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
                        setLensData((prev) => ({
                          ...prev,
                          family: val,
                          design: null,
                          indexValues: null,
                          masterId: null,
                          coatingId: null,
                          treatmentId: null,
                          coatingComboId: null,
                        }))
                      }
                      loading={isLoadingFamily}
                      // disabled={!!lensData.design}
                    />
                  )}

                  {lensData.family && lensData.type === 2 && (
                    <AutocompleteField
                      label="Product Design"
                      options={deduplicateOptions(
                        productDesignData?.data?.filter(
                          (b) => b.IsActive === 1
                        ) || [],
                        "OpticalLensProductDesign.Id"
                      )}
                      valueField="OpticalLensProductDesign.Id"
                      labelField="OpticalLensProductDesign.DesignName"
                      value={lensData.design}
                      onChange={(val) =>
                        setLensData((prev) => ({
                          ...prev,
                          design: val,
                          indexValues: null,
                          masterId: null,
                          coatingId: null,
                          treatmentId: null,
                          coatingComboId: null,
                        }))
                      }
                      loading={isLoadingProductDesign}
                      // disabled={!!lensData.masterId}
                    />
                  )}

                  {lensData.design && lensData.type === 2 && (
                    <div className="flex flex-col">
                      <AutocompleteField
                        label="Index Values"
                        options={deduplicateOptions(
                          indexValuesData?.data?.filter(
                            (b) => b.IsActive === 1
                          ) || [],
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
                            coatingId: null,
                            treatmentId: null,
                            coatingComboId: null,
                          }))
                        }
                        loading={isLoadingIndexValues}
                        // disabled={!!lensData.masterId}
                      />
                      <div
                        className="flex justify-end underline cursor-pointer text-blue-600"
                        onClick={() => setShowProduct(true)}
                      >
                        Add Coating & Treatment
                      </div>
                    </div>
                  )}

                  {lensData.masterId && showProduct && lensData.type === 2 && (
                    <AutocompleteField
                      label="Coating"
                      options={deduplicateOptions(
                        coatingsData?.data?.filter((b) => b.IsActive === 1) ||
                          [],
                        "OpticalLensCoating.Id"
                      )}
                      valueField="OpticalLensCoating.Id"
                      labelField="OpticalLensCoating.CoatingName"
                      value={lensData.coatingId}
                      onChange={(val, item) => {
                        if (!item) {
                          setLensData((prev) => ({
                            ...prev,
                            coatingComboId: null,
                            coatingId: null,
                            treatmentId: null,
                          }));
                          return;
                        }
                        setLensData((prev) => ({
                          ...prev,
                          coatingComboId: item.CoatingComboId,
                          coatingId: item.OpticalLensCoating?.Id || null,
                          treatmentId: null,
                        }));
                      }}
                      loading={isLoadingCoatings}
                      // disabled={!!lensData.treatmentId}
                    />
                  )}

                  {lensData.coatingId && showProduct && lensData.type === 2 && (
                    <AutocompleteField
                      label="Treatment"
                      options={deduplicateOptions(
                        treatmentsData?.data?.filter((b) => b.IsActive === 1) ||
                          [],
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
                          treatmentId: item.OpticalLensTreatment?.Id,
                        }));
                      }}
                      loading={isLoadingTreatments}
                    />
                  )}
                  {/* for case 3 coating */}
                  {lensData.brandId && lensData.type === 3 && (
                    <AutocompleteField
                      label="Coating"
                      options={deduplicateOptions(
                        coatingDataByBrand?.data?.filter(
                          (b) => b.IsActive === 1
                        ) || [],
                        "Id"
                      )}
                      valueField="Id"
                      labelField="CoatingName"
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

                          coatingId: item.Id || null,
                        }));
                      }}
                      // loading={isLoadingCoatings}
                      // disabled={!!lensData.treatmentId}
                    />
                  )}
                  {/* for case 4 treatment */}
                  {lensData.brandId && lensData.type === 4 && (
                    <AutocompleteField
                      label="Treatment"
                      options={deduplicateOptions(
                        treatmentDataByBrand?.data?.filter(
                          (b) => b.IsActive === 1
                        ) || [],
                        "Id"
                      )}
                      valueField="Id"
                      labelField="TreatmentName"
                      value={lensData.treatmentId}
                      onChange={(val, item) => {
                        if (!item) {
                          setLensData((prev) => ({
                            ...prev,

                            treatmentId: null,
                          }));
                          return;
                        }
                        setLensData((prev) => ({
                          ...prev,

                          treatmentId: item?.Id,
                        }));
                      }}
                      loading={isLoadingTreatments}
                    />
                  )}
                </div>
              )}

            {/* common  */}
            {lensData.brandId &&
              lensData.focalityId &&
              (lensData.productType === 0 || lensData.productType === 1) && (
                <div>
                  <div className="tint-data flex gap-5 items-center mt-5">
                    <div className="flex items-center gap-3 align-bottom">
                      <span className="text-sm font-medium text-gray-700">
                        Tint
                      </span>
                      <div className="flex whitespace-nowrap gap-3">
                        {tints.map((type) => (
                          <Radio
                            name="tint"
                            key={type.value}
                            label={type.label}
                            value={type.value}
                            checked={lensData.tintvalue === type.value}
                            onChange={(e) =>
                              setLensData((prev) => ({
                                ...prev,
                                tintvalue: parseInt(e.target.value),
                              }))
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <div className=" flex w-full gap-3">
                      <Checkbox
                        label="Add On"
                        checked={lensData.addOnCheck}
                        onChange={(e) =>
                          setLensData((prev) => ({
                            ...prev,
                            addOnCheck: e.target.checked,
                          }))
                        }
                      />
                      {addOnData?.data && lensData.addOnCheck && (
                        <div className="w-1/3">
                          <Autocomplete
                            options={
                              addOnData?.data?.data.filter(
                                (b) => b.IsActive === 1
                              ) || []
                            }
                            getOptionLabel={(option) => option.AddOnName}
                            onChange={(event, newValue) => {
                              setLensData((prev) => ({
                                ...prev,
                                AddOnId: newValue?.Id,
                              }));
                            }}
                            value={
                              addOnData?.data?.data?.find(
                                (b) => b.Id === lensData.AddOnId
                              ) || null
                            }
                            isOptionEqualToValue={(option, value) =>
                              option.Id === value.Id
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select Add on"
                                variant="outlined"
                                fullWidth
                                size="small"
                              />
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3 justify-between">
                    <Button icon={FiPlus} onClick={handleAddItem}>
                      Add
                    </Button>
                    <Button
                      onClick={handleSave}
                      isLoading={isOLSaving}
                      disabled={isOLSaving}
                    >
                      Create Offer
                    </Button>
                  </div>
                </div>
              )}
          </div>
          <ErrorDisplayModal
            title="Errors adding optical lens"
            errors={errors}
            open={errorModalOpen}
            onClose={() => setErrorModalOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default OpticalLens;

// Autocomplete helper component
// AutocompleteField Component
const AutocompleteField = ({
  label,
  options,
  valueField,
  labelField,
  value,
  onChange,
  loading,
  disabled = false,
  showLabel = true, // new prop (default true → shows label on top)
}) => {
  return (
    <div className="space-y-1">
      {showLabel && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
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
            placeholder={!showLabel ? `Select ${label}` : ""} // use placeholder if no label
            size="small"
            disabled={disabled}
            InputProps={{
              ...params.InputProps,
              style: { color: "#000" }, // <-- force black text
            }}
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
