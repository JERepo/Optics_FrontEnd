import React, { useEffect, useState } from "react";
import { lazy } from "react";
import {
  useCheckTintQuery,
  useGetAddOnQuery,
  useGetCoatingsQuery,
  useGetFamilyQuery,
  useGetFocalityQuery,
  useGetIndexValuesQuery,
  useGetOrderPreferenceQuery,
  useGetProductDesignQuery,
  useGetTreatmentsQuery,
} from "../../../../api/orderApi";
import { useOrder } from "../../../../features/OrderContext";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiEdit,
  FiCheck,
  FiX,
  FiEdit2,
} from "react-icons/fi";
import { Autocomplete, TextField } from "@mui/material";
import { useGetAllBrandsQuery } from "../../../../api/brandsApi";
import Loader from "../../../../components/ui/Loader";
import { Table, TableCell, TableRow } from "../../../../components/Table";
import {
  useGetOlInvoiceDetailsQuery,
  useGetPriceByCoatingComboIdQuery,
  useLazyGetInvoiceDetailsQuery,
  useSaveProductsMutation,
} from "../../../../api/salesReturnApi";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const Input = lazy(() => import("../../../../components/Form/Input"));
const Radio = lazy(() => import("../../../../components/Form/Radio"));
const Checkbox = lazy(() => import("../../../../components/Form/Checkbox"));
const Textarea = lazy(() => import("../../../../components/Form/Textarea"));
const Button = lazy(() => import("../../../../components/ui/Button"));
import { isValidNumericInput } from "../../../../utils/isValidNumericInput";
import { formatINR } from "../../../../utils/formatINR";
const productTypes = [
  { value: 0, lable: "Stock" },
  { value: 1, lable: "Rx" },
];
const getProductNameYes = (item) => {
  const product = item?.ProductDetails?.[0];
  if (!product) return "";

  const {
    brandName,
    productName,
    barcode,
    fittingPrice,
    fittingGSTPercentage,
    hSN,
    specs,
    productDescName,
  } = product;

  const clean = (val) => {
    if (
      val === null ||
      val === undefined ||
      val === "undefined" ||
      val === "null" ||
      val === "N/A"
    ) {
      return "";
    }
    return val;
  };

  const formatPowerValue = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return num > 0 ? `+${val}` : val;
  };

  const tintName = clean(specs?.tint?.tintName);
  const addOns = specs?.addOn?.addOnName;

  const pd = specs?.powerDetails || {};
  const specsLines = ["right", "left"]
    .map((side) => {
      const eye = pd[side];
      if (!eye) return "";
      const sph = clean(eye.sphericalPower);
      const cyl = clean(eye.cylinder);
      const axis = clean(eye.axis);
      const addition = clean(eye.addition);

      const powerValues = [];
      if (sph) powerValues.push(`SPH ${formatPowerValue(sph)}`);
      if (cyl) powerValues.push(`CYL ${formatPowerValue(cyl)}`);
      if (axis) powerValues.push(`Axis ${formatPowerValue(axis)}`);
      if (addition) powerValues.push(`Add ${formatPowerValue(addition)}`);

      const label = side === "right" ? "R" : "L";
      return powerValues.length ? `${label}: ${powerValues.join(", ")}` : "";
    })
    .filter(Boolean)
    .join("\n");

  const lines = [
    `${clean(brandName)} ${clean(productDescName)}`,
    specsLines,
    clean(barcode) && `Barcode: ${barcode}`,
    tintName ? `Tint: ${tintName}` : "",
    addOns?.length > 0 ? `AddOn: ${addOns}` : "",
    clean(hSN) && `HSN: ${hSN}`,
    clean(fittingPrice) ? `Fitting Price: ${fittingPrice}` : "",
  ];

  return lines.filter(Boolean).join("\n");
};

const getProductName = (order) => {
  const { ProductType, productName, ProductName, tintName, AddOnData } = order;

  const clean = (val) => {
    if (
      val === null ||
      val === undefined ||
      val === "undefined" ||
      val === "null" ||
      val === "N/A"
    ) {
      return "";
    }
    return String(val).trim();
  };

  if (ProductType === 0 || true) {
    const name = clean(productName || ProductName);
    const addonNames = AddOnData.map((item) => item.name.split(" - ₹")[0]);

    const tint = clean(tintName);

    return [
      name,
      tint && `Tint : ${tint.split(" - ₹")[0]}`,
      addonNames.length > 0 && `Add On : ${addonNames}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return "";
};

const OpticalLens = () => {
  const {
    customerSalesId,
    currentSalesStep,
    selectedSalesProduct,
    prevSalesStep,
    salesDraftData,
    findGSTPercentage,
    goToSalesStep,
    referenceApplicable,
    calculateGST,
  } = useOrder();

  const { user } = useSelector((state) => state.auth);
  const [mainOLDetails, setMainOLDetails] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [editMode, setEditMode] = useState({}); // { [index]: { returnPrice: false, returnQty: false } }
  const [editReturnPrice, setEditReturnPrice] = useState("");
  const [editReturnQty, setEditReturnQty] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editReturnFittingPrice, setEditReturnFittingprice] = useState(0);
  const [returnPriceError, setReturnPriceError] = useState(null);

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
    tintPrice: null,
    AddOnData: [],
    powerSingleORboth: 1,
    withFitting: 1,
    prescriptionId: null,
    selectedPrescription: null,
    rimType: null,
    tintName: null,
  });

  // API calls
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
      locationId: customerSalesId.locationId,
    },
    { skip: !lensData.coatingComboId }
  );

  const { data: addOnData } = useGetAddOnQuery(
    {
      comboId: lensData.coatingComboId,
      locationId: customerSalesId.locationId,
    },
    { skip: !lensData.coatingComboId }
  );

  const { data: priceDetails } = useGetPriceByCoatingComboIdQuery(
    {
      coatingComboId: lensData.coatingComboId,
      locationId: customerSalesId.locationId,
    },
    { skip: !lensData.coatingComboId }
  );

  const [saveFinalProducts, { isLoading: isFinalProductsSaving }] =
    useSaveProductsMutation();
  const { data: InvoiceDetailsDrop, isLoading: isInvoiceDetailsLoading } =
    useGetOlInvoiceDetailsQuery({
      id: customerSalesId.patientId,
      locationId: customerSalesId.locationId,
    });
  const [
    getInvoiceDetails,
    { data: InvoiceDetails, isLoading: isInvoiceLoading },
  ] = useLazyGetInvoiceDetailsQuery();

  // Update productName based on dropdown selections
  useEffect(() => {
    const brand =
      allBrandsData?.find((b) => b.Id === lensData.brandId)?.BrandName || "";
    const focality =
      focalityData?.data?.find(
        (f) => f.OpticalLensFocality.Id === lensData.focality
      )?.OpticalLensFocality.Focality || "";
    const family =
      familyData?.data?.find(
        (f) => f.OpticalLensProductFamily.Id === lensData.family
      )?.OpticalLensProductFamily.FamilyName || "";
    const design =
      productDesignData?.data?.find(
        (d) => d.OpticalLensProductDesign.Id === lensData.design
      )?.OpticalLensProductDesign.DesignName || "";
    const indexValue =
      indexValuesData?.data?.find(
        (i) => i.OpticalLensIndex.Id === lensData.indexValues
      )?.OpticalLensIndex.Index || "";
    const coating =
      coatingsData?.data?.find(
        (c) => c.OpticalLensCoating.Id === lensData.coatingId
      )?.OpticalLensCoating.CoatingName || "";
    const treatment =
      treatmentsData?.data?.find(
        (t) => t.OpticalLensTreatment.Id === lensData.treatmentId
      )?.OpticalLensTreatment.TreatmentName || "";

    const productNameParts = [
      brand,
      focality,
      family,
      design,
      indexValue,
      coating,
      treatment,
    ].filter((part) => part);

    const newProductName = productNameParts.join(" ") || null;

    setLensData((prev) => ({
      ...prev,
      productName: newProductName,
    }));
  }, [
    lensData.brandId,
    lensData.focality,
    lensData.family,
    lensData.design,
    lensData.indexValues,
    lensData.coatingId,
    lensData.treatmentId,
    allBrandsData,
    focalityData,
    familyData,
    productDesignData,
    indexValuesData,
    coatingsData,
    treatmentsData,
  ]);
  // Initialize editMode for each item
  useEffect(() => {
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      mainOLDetails.forEach((item, index) => {
        const key = referenceApplicable === 1 ? `${item.Id}-${index}` : index;
        if (!newEditMode[key]) {
          newEditMode[key] = { returnPrice: false, returnQty: false };
        }
      });
      return newEditMode;
    });
  }, [mainOLDetails, referenceApplicable]);
  const handleRefresh = () => {
    setLensData({
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
      tintPrice: null,
      AddOnData: [],
      powerSingleORboth: 1,
      withFitting: 1,
      prescriptionId: null,
      selectedPrescription: null,
      rimType: null,
      CLMRP: 0,
      returnPrice: 0,
      returnQty: 1,
    });
    setEditMode({});
    setMainOLDetails([]);
    setSelectedInvoice(null);
  };

  const handleOLensBack = () => {
    prevSalesStep();
  };

  const handleDelete = (index) => {
    setMainOLDetails((prev) => prev.filter((_, i) => i !== index));
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      delete newEditMode[index];
      return newEditMode;
    });
  };
  const toggleEditMode = (id, index, field) => {
    const key = referenceApplicable === 1 ? `${id}-${index}` : index;
    setEditMode((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: !prev[key]?.[field],
      },
    }));
    const item = mainOLDetails[index];
    if (!editMode[key]?.[field]) {
      if (field === "returnPrice") {
        setEditReturnPrice(item.returnPrice || item.ReturnPricePerUnit || "");
      } else if (field === "returnQty") {
        setEditReturnQty(item.returnQty || item.ReturnQty || "");
      }
    }
  };

  const saveEdit = (id, index, field) => {
    const key = referenceApplicable === 1 ? `${id}-${index}` : index;
    const parsedQty = parseFloat(editReturnQty);
    const parsedPrice = parseFloat(editReturnPrice);
    const item = mainOLDetails[index];

    if (field === "returnQty") {
      if (isNaN(parsedQty) || parsedQty < 1) {
        toast.error("Return quantity must be a positive number");
        return;
      }
    }
    if (field === "returnPrice") {
      if (parsedPrice > parseFloat(parseFloat(item.ActualSellingPrice))) {
        toast.error("Return price cannot be greater than selling price");
        return;
      }
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        toast.error("Return price must be a non-negative number");
        return;
      }
    }

    setMainOLDetails((prev) =>
      prev.map((it, i) =>
        i === index
          ? {
              ...it,
              ...(field === "returnPrice" && {
                [referenceApplicable === 1
                  ? "ReturnPricePerUnit"
                  : "returnPrice"]: parsedPrice,
              }),
              ...(field === "returnQty" && {
                [referenceApplicable === 1 ? "ReturnQty" : "returnQty"]:
                  parsedQty,
              }),
            }
          : it
      )
    );
    setEditMode((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: false,
      },
    }));
  };

  const cancelEdit = (id, index, field) => {
    const key = referenceApplicable === 1 ? `${id}-${index}` : index;
    setEditMode((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: false,
      },
    }));
  };
  const handleAddToTable = () => {
    if (!lensData.productName) {
      toast.error("Please select all required fields before adding.");
      return;
    }
    if (lensData.tintvalue === 1 && !lensData.tintId) {
      toast.error("Please select all required fields before adding.");
      return;
    }

    const addonsTotal = Array.isArray(lensData?.AddOnData)
      ? lensData.AddOnData.reduce(
          (sum, item) =>
            sum + (parseFloat(item.price.replace(/[^0-9.-]+/g, "")) || 0),
          0
        )
      : 0;
    setMainOLDetails((prev) => [
      ...prev,
      {
        ...lensData,
        ...priceDetails?.data,
        CLMRP: parseFloat(priceDetails?.data.SellingPrice),
        returnPrice:
          (parseFloat(priceDetails?.data?.SellingPrice) || 0) +
          addonsTotal +
          (parseFloat(lensData?.tintPrice) || 0),

        returnQty: 1,
        ProductType: 0,
      },
    ]);

    // Reset all lensData except mainOLDetails
    setLensData({
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
      tintPrice: null,
      AddOnData: [],
      powerSingleORboth: 1,
      withFitting: 1,
      prescriptionId: null,
      selectedPrescription: null,
      rimType: null,
      CLMRP: 0,
      returnPrice: 0,
      returnQty: 1,
    });
  };
  const handleDeleteYes = (id, index) => {
    if (referenceApplicable === 1) {
      setMainOLDetails((prev) => prev.filter((item, i) => i !== index));
    } else {
      setMainOLDetails((prev) =>
        prev.filter((i, idx) => !(i.Barcode === id && idx === index))
      );
      setEditMode((prev) => {
        const newEditMode = { ...prev };
        delete newEditMode[`${id}-${index}`];
        return newEditMode;
      });
    }
  };
  const handleAddInvoice = () => {
    if (!selectedInvoice) {
      toast.error("Please select an invoice before adding.");
      return;
    }
    const exist = mainOLDetails.find((item) => item.Id === selectedInvoice.Id);
    if (exist) {
      toast.error("Invoice already exist please choose another");
      return;
    }
    if(!isValidNumericInput(parseFloat(editReturnFittingPrice))){
      toast.error("Please enter valid return fitting price")
      return;
    }
   
    const newItem = {
      ...selectedInvoice,
      ReturnPricePerUnit:
        (parseInt(selectedInvoice?.InvoiceQty) *
        parseFloat(selectedInvoice?.ActualSellingPrice)) + parseFloat(editReturnFittingPrice),
      ReturnQty: selectedInvoice?.InvoiceQty,
    };
    setMainOLDetails((prev) => [...prev, newItem]);

    setSelectedInvoice(null);
    setEditReturnFittingprice(0);
  };

  useEffect(() => {
    setEditReturnFittingprice(
      parseFloat(selectedInvoice?.ProductDetails[0]?.fittingPrice || 0)
    );
  }, [selectedInvoice]);

  const getProductDisplayName = (product) => {
    const {
      brandName,
      productName,
      hSN,
      barcode,
      fittingPrice,
      specs,
      coatingName,
      treatmentName,
    } = product;

    // Cleaner to remove null, undefined, "null", "undefined", "N/A", or blank strings
    const clean = (val) => {
      if (
        val == null ||
        val === "null" ||
        val === "undefined" ||
        val === "N/A" ||
        (typeof val === "string" && val.trim() === "")
      ) {
        return "";
      }
      return String(val).trim();
    };

    const right = specs?.powerDetails?.right;
    const left = specs?.powerDetails?.left;

    const formatLens = (side, data) => {
      if (!data) return "";
      const parts = [];
      if (clean(side)) parts.push(side);
      if (clean(data.sphericalPower))
        parts.push(`Sph: ${clean(data.sphericalPower)}`);
      if (clean(data.addition)) parts.push(`Add: ${clean(data.addition)}`);
      if (clean(data.axis)) parts.push(`Axis: ${clean(data.axis)}`);
      if (clean(data.diameter)) parts.push(`Dia: ${clean(data.diameter)}`);
      return parts.length ? `${side}:${parts.slice(1).join(", ")}` : "";
    };

    const rightPower = formatLens("R", right);
    const leftPower = formatLens("L", left);

    const tint = clean(specs?.tint?.tintName)
      ? `Tint: ${clean(specs.tint.tintName)}`
      : "";
    const addOn = clean(specs?.addOn?.addOnName)
      ? `AddOn: ${clean(specs.addOn.addOnName)}`
      : "";

    return [
      clean(brandName),
      clean(productName),

      coatingName,
      treatmentName,
      rightPower,
      leftPower,
      tint,
      addOn,
      clean(barcode) ? `${clean(barcode)}` : "",
    ]
      .filter(Boolean)
      .join(" ");
  };
  const handleSaveData = async () => {
    if (!Array.isArray(mainOLDetails) || mainOLDetails.length === 0) {
      console.warn("No details to save");
      return;
    }
    try {
      for (const detail of mainOLDetails) {
        const payload = {
          SRMasterID: salesDraftData.Id ?? null,
          ProductType: 0,
          ContactLensDetailId: detail.CLDetailId ?? null,
          AccessoryDetailId: detail.AccessoryDetailId ?? null,
          FrameDetailId: detail.FrameDetailId ?? null,
          OpticalLensDetailId:
            referenceApplicable === 1
              ? detail.OrderDetailId
              : detail.OpticalLensDetailId ?? null,
          BatchCode: detail.CLBatchCode ?? null,
          CNQty:
            referenceApplicable === 0
              ? detail.returnQty
              : detail.ReturnQty ?? null,
          SRP:
            referenceApplicable === 0
              ? parseFloat(detail.returnPrice)
              : parseFloat(detail.SRP) ?? null,
          ReturnPrice:
            referenceApplicable === 0
              ? detail.returnPrice
              : detail.ReturnPricePerUnit ?? null,
          ProductTaxPercentage:
            parseFloat(findGSTPercentage(detail).taxPercentage) ?? null,
          FittingReturnPrice:
            referenceApplicable === 0
              ? detail.FittingReturnPrice
              : detail.ProductDetails[0]?.fittingPrice ?? null,
          FittingTaxPercentage:
            referenceApplicable === 0
              ? detail.FittingTaxPercentage
              : detail.ProductDetails[0]?.fittingGSTPercentage ?? null,
          InvoiceDetailId: detail.Id ?? null,
          ApplicationUserId: user.Id,
        };
        await saveFinalProducts({ payload }).unwrap();
      }

      goToSalesStep(4);
    } catch (error) {
      console.error("Error saving detail:", error);
    }
  };
console.log(selectedInvoice)
  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-4 mb-4"></div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Step {currentSalesStep}: {selectedSalesProduct.label}
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
          {mainOLDetails.length > 0 && referenceApplicable === 0 && (
            <Table
              columns={[
                "S.No",
                "Invoice no",
                "Product type",
                "Product details",
                "SRP",
                "Return price",
                "GST Amt",
                "Return Qty",
                "Total amount",
                "Action",
              ]}
              data={mainOLDetails}
              name="Product details"
              renderHeader={(column) => (
                <div
                  className={
                    column === "Return price" || column === "Return Qty"
                      ? "min-w-[100px] inline-block"
                      : ""
                  }
                >
                  {column}
                </div>
              )}
              renderRow={(item, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell></TableCell>
                  <TableCell>OL</TableCell>
                  <TableCell className="whitespace-pre-line">
                    {getProductName(item)}
                  </TableCell>
                  <TableCell>₹{item.CLMRP}</TableCell>
                  <TableCell>
                    {editMode[index]?.returnPrice ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editReturnPrice}
                          onChange={(e) => setEditReturnPrice(e.target.value)}
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          placeholder="Enter price"
                          min="0"
                        />
                        <button
                          onClick={() => saveEdit(null, index, "returnPrice")}
                          className="text-neutral-400 transition"
                          title="Save"
                        >
                          <FiCheck size={18} />
                        </button>
                        <button
                          onClick={() => cancelEdit(null, index, "returnPrice")}
                          className="text-neutral-400 transition"
                          title="Cancel"
                        >
                          <FiX size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">
                          ₹{item.returnPrice}
                        </span>
                        <button
                          onClick={() =>
                            toggleEditMode(null, index, "returnPrice")
                          }
                          className="text-neutral-400 hover:text-neutral-600 transition"
                          title="Edit Price"
                        >
                          <FiEdit2 size={14} />
                        </button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>₹{findGSTPercentage(item).gstAmount}</TableCell>
                  <TableCell className="min-w-[150px]">
                    {editMode[index]?.returnQty ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editReturnQty}
                          onChange={(e) => setEditReturnQty(e.target.value)}
                          className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          min="1"
                        />
                        <button
                          onClick={() => saveEdit(null, index, "returnQty")}
                          className="text-neutral-400 transition"
                          title="Save"
                        >
                          <FiCheck size={18} />
                        </button>
                        <button
                          onClick={() => cancelEdit(null, index, "returnQty")}
                          className="text-neutral-400 transition"
                          title="Cancel"
                        >
                          <FiX size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">{item.returnQty}</span>
                        <button
                          onClick={() =>
                            toggleEditMode(null, index, "returnQty")
                          }
                          className="text-neutral-400 hover:text-neutral-600 transition"
                          title="Edit Quantity"
                        >
                          <FiEdit2 size={14} />
                        </button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    ₹
                    {(
                      parseFloat(item.returnPrice) * parseFloat(item.returnQty)
                    ).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleDelete(index)}
                      className="text-neutral-400 transition"
                      title="Delete"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </TableCell>
                </TableRow>
              )}
            />
          )}

          {mainOLDetails.length > 0 && referenceApplicable === 0 && (
            <div className="flex justify-end mt-5">
              <Button
                onClick={handleSaveData}
                isLoading={isFinalProductsSaving}
                disabled={isFinalProductsSaving}
              >
                Save & Next
              </Button>
            </div>
          )}
          {referenceApplicable === 1 && mainOLDetails.length > 0 && (
            <div className="">
              <Table
                expand={true}
                columns={[
                  "S.No",
                  "Invoice No",
                  "Type",
                  "Product Details",
                  "SRP",
                  "Return Price",
                  "GST Amt",
                  "return Qty",
                  "Total Amount",
                  "Action",
                ]}
                data={mainOLDetails}
                renderRow={(item, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell>
                      {item["InvoiceMain.InvoicePrefix"]}/
                      {item["InvoiceMain.InvoiceNo"]}/{item.InvoiceSlNo}
                    </TableCell>
                    <TableCell className="text-center">OL</TableCell>
                    <TableCell className="whitespace-pre-line">
                      {getProductNameYes(item)}
                    </TableCell>
                    <TableCell>
                      ₹{formatINR(parseFloat(item.SRP || 0))}
                    </TableCell>
                    <TableCell>
                      {editMode[`${item.Id}-${index}`]?.returnPrice ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editReturnPrice}
                            onChange={(e) => setEditReturnPrice(e.target.value)}
                            className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            placeholder="Enter return price"
                            min="0"
                          />
                          <button
                            onClick={() =>
                              saveEdit(item.Id, index, "returnPrice")
                            }
                            className="text-neutral-400 transition"
                            title="Save"
                          >
                            <FiCheck size={18} />
                          </button>
                          <button
                            onClick={() =>
                              cancelEdit(item.Id, index, "returnPrice")
                            }
                            className="text-neutral-400 transition"
                            title="Cancel"
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          ₹{formatINR(parseFloat(item.ReturnPricePerUnit || 0))}
                          <button
                            onClick={() =>
                              toggleEditMode(item.Id, index, "returnPrice")
                            }
                            className="text-neutral-400 hover:text-neutral-600 transition"
                            title="Edit Return Price"
                          >
                            <FiEdit2 size={14} />
                          </button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      ₹
                      {formatINR(
                        calculateGST(
                          parseFloat(item.ReturnPricePerUnit || 0) *
                            parseInt(item.ReturnQty || 0),
                          parseFloat(item.ProductDetails[0].taxPercentage || 0)
                        ).gstAmount
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.ReturnQty || 0}
                    </TableCell>
                    <TableCell>
                      ₹
                      {formatINR(
                        parseFloat(
                          item.ReturnPricePerUnit * item.ReturnQty +
                            editReturnFittingPrice
                        )
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        className="px-3 py-1"
                        onClick={() => handleDeleteYes(null, index)}
                        icon={FiTrash2}
                      ></Button>
                    </TableCell>
                  </TableRow>
                )}
              />
              <div className="flex justify-end mt-6">
                <Button
                  type="submit"
                  isLoading={isFinalProductsSaving}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700"
                  onClick={handleSaveData}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          )}
          {referenceApplicable === 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-4 mt-4">
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
                      productDesignData?.data?.filter(
                        (b) => b.IsActive === 1
                      ) || [],
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
                        coatingComboId: item.CoatingComboId,
                        treatmentId: item.OpticalLensTreatment?.Id,
                      }));
                    }}
                    loading={isLoadingTreatments}
                  />
                )}
              </div>

              {lensData.treatmentId && (
                <div className="mt-3">
                  <Input
                    label="Product Name"
                    value={lensData.productName || ""}
                    onChange={(e) =>
                      setLensData({ ...lensData, productName: e.target.value })
                    }
                    placeholder="Enter product name"
                    className="w-full"
                    disabled
                  />
                </div>
              )}

              <div className="tint-data flex gap-5 items-center">
                {tintData?.data.showTint && lensData.treatmentId && (
                  <div className="flex items-center gap-3 w-1/2">
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
                    {lensData.tintvalue === 1 && (
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
                              tintPrice: newValue?.price.substring(1) || null,
                              tintName: newValue.Name || null,
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
                    )}
                  </div>
                )}
                {addOnData?.data && lensData.treatmentId && (
                  <div>
                    {addOnData?.data?.map((add) => (
                      <Checkbox
                        key={add.Id}
                        label={add.Name}
                        value={add.Id}
                        checked={lensData.AddOnData?.some(
                          (item) => item.Id === add.Id
                        )}
                        onChange={() => {
                          setLensData((prev) => {
                            const exists = prev.AddOnData?.some(
                              (item) => item.Id === add.Id
                            );
                            const updatedAddOns = exists
                              ? prev.AddOnData.filter(
                                  (item) => item.Id !== add.Id
                                )
                              : [
                                  ...prev.AddOnData,
                                  {
                                    Id: add.Id,
                                    price: add.price,
                                    name: add.Name,
                                  },
                                ];

                            return {
                              ...prev,
                              AddOnData: updatedAddOns,
                            };
                          });
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {lensData.treatmentId && (
                <Button
                  onClick={handleAddToTable}
                  icon={FiPlus}
                  className="bg-green-600 hover:bg-green-700 mt-5"
                >
                  Add
                </Button>
              )}
            </div>
          )}
          {referenceApplicable === 1 && (
            <div>
              <div className="space-y-1 w-1/3">
                <label className="text-sm font-medium text-gray-700">
                  Select Invoice No
                </label>
                <Autocomplete
                  options={InvoiceDetailsDrop?.data || []}
                  getOptionLabel={(option) => {
                    const prefix = option["InvoiceMain.InvoicePrefix"];
                    const InvoiceNo = option["InvoiceMain.InvoiceNo"];
                    const slNo = option.InvoiceSlNo;
                    return `${prefix}/${InvoiceNo}/${slNo}`;
                  }}
                  value={
                    InvoiceDetailsDrop?.data?.find(
                      (invoice) => invoice.Id === selectedInvoice?.Id
                    ) || null
                  }
                  onChange={(_, newValue) => setSelectedInvoice(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select Invoice No"
                      size="small"
                    />
                  )}
                  loading={isInvoiceDetailsLoading}
                  fullWidth
                  disabled={lensData.productType !== null}
                />
              </div>
              {selectedInvoice && (
                <div>
                  <div className="grid grid-cols-3 gap-5">
                    <Textarea
                      label="Product Name"
                      value={getProductDisplayName(
                        selectedInvoice?.ProductDetails[0] ?? []
                      )}
                      className="col-span-3"
                    />
                    <Input
                      label="Supplier Order No"
                      value=""
                      className="col-span-3"
                    />
                    <Input
                      label="Billed Qty"
                      value={selectedInvoice?.InvoiceQty}
                      grayOut={true}
                    />
                    <Input
                      label="Total Product Price"
                      value={
                        parseInt(selectedInvoice?.InvoiceQty) *
                        parseFloat(selectedInvoice?.ActualSellingPrice)
                      }
                      grayOut={true}
                    />
                    <Input
                      label="Total Fitting Price"
                      value={selectedInvoice?.ProductDetails[0]?.fittingPrice}
                      grayOut={true}
                    />
                    <Input
                      label="Return Qty"
                      value={selectedInvoice?.InvoiceQty}
                      grayOut={true}
                    />
                    <Input
                      label="Return Product Price"
                      value={
                        parseInt(selectedInvoice?.InvoiceQty) *
                        parseFloat(selectedInvoice?.ActualSellingPrice)
                      }
                      grayOut={true}
                    />
                    <Input
                      label="Return Fitting Price"
                      value={editReturnFittingPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!isValidNumericInput(val)) return;
                        setEditReturnFittingprice(val);
                      }}
                    />
                  </div>

                  <Button onClick={handleAddInvoice}>Add</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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

const getNested = (obj, path) =>
  path.split(".").reduce((o, p) => (o ? o[p] : ""), obj);

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
