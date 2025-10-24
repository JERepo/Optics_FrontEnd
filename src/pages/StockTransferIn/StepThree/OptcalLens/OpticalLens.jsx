import React, { useEffect, useState } from "react";
import { lazy } from "react";
import {
  useGetCoatingsQuery,
  useGetDIaDetailsMutation,
  useGetFamilyQuery,
  useGetFocalityQuery,
  useGetIndexValuesQuery,
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
  FiSearch,
  FiEdit2,
} from "react-icons/fi";
import { Autocomplete, TextField } from "@mui/material";
import { useGetAllBrandsQuery } from "../../../../api/brandsApi";
import Loader from "../../../../components/ui/Loader";
import { Table, TableCell, TableRow } from "../../../../components/Table";
import { useSelector } from "react-redux";
const Input = lazy(() => import("../../../../components/Form/Input"));
const Radio = lazy(() => import("../../../../components/Form/Radio"));
const Checkbox = lazy(() => import("../../../../components/Form/Checkbox"));
const Textarea = lazy(() => import("../../../../components/Form/Textarea"));
const Button = lazy(() => import("../../../../components/ui/Button"));
import { isValidNumericInput } from "../../../../utils/isValidNumericInput";
import { formatINR } from "../../../../utils/formatINR";
import {
  useGetOlDetailsByOlDetailIdMutation,
  useGetStockOutDataForStockInQuery,
  useGetStockOutDetailsQuery,
  useLazyGetOLByBarcodeQuery,
  useSaveSTIMutation,
  useSaveStockDetailsMutation,
} from "../../../../api/stockTransfer";
import toast from "react-hot-toast";
import PowerDetailsFetch from "../../../Order/StepThree/OptcalLens/PowerDetailsFetch";
import { ErrorDisplayModal } from "../../../../components/ErrorsDisplay";

const productTypes = [
  { value: 0, lable: "Stock" },
  { value: 1, lable: "Rx" },
];

const getProductName = (item) => {
  const detail = Array.isArray(item.ProductDetails)
    ? item.ProductDetails[0]
    : item.ProductDetails;
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

  if (detail.ProductType === 0 || true) {
    const productName = clean(detail.productName);
    const hsn = clean(detail.HSN);

    let specsObj = {};
    if (typeof detail.Specs === "string") {
      detail.Specs.split(",").forEach((pair) => {
        let [key, value] = pair.split(":").map((s) => s.trim());
        if (value === "null") value = null;
        specsObj[key] = value;
      });
    } else {
      specsObj = {
        Sph: detail.Specs.Spherical || detail?.Spherical,
        Cyld: detail.Specs.Cylinder || detail?.Cylinder,
        Axis: null,
        Dia: detail.Specs.Diameter || detail?.Diameter,
        Add: null,
      };
    }

    const sph = formatPowerValue(specsObj.Sph);
    const cyld = formatPowerValue(specsObj.Cyld);
    const addl = formatPowerValue(specsObj.Add);
    const dia = formatPowerValue(specsObj.Dia);

    const specsList = [
      sph && `SPH: ${sph}`,
      cyld && `CYL: ${cyld}`,
      dia && `Axis: ${dia}`,
      addl && `Add: ${addl}`,
    ]
      .filter(Boolean)
      .join(", ");
    const lines = [productName && productName, specsList, hsn && `HSN: ${hsn}`];

    return lines.filter(Boolean).join("\n");
  }

  return "";
};

const OpticalLens = () => {
  const {
    customerStockTransferIn,
    currentStockTransferInStep,
    stockTransferInDraftData,
    goToStockTransferInStep,
    prevStockTransferInStep,
    selectedStockTransferInProduct,
  } = useOrder();

  const { user, hasMultipleLocations } = useSelector((state) => state.auth);
  const [barcode, setBarcode] = useState("");
  const [barCodeOrproduct, setBarCodeOrProduct] = useState(0);
  const [editMode, setEditMode] = useState({});
  const [barcodeData, setBarcodeData] = useState([]);

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
    powerSingleORboth: 0,
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
  const [
    getOLByBarcode,
    {
      data: BarcodeData,
      isLoading: isByBarcodeLoading,
      isFetching: isBarcodeFetching,
    },
  ] = useLazyGetOLByBarcodeQuery();
  const [saveStockTransfer, { isLoading: isStockTransferLoading }] =
    useSaveSTIMutation();
  const { data: stockOutData } = useGetStockOutDetailsQuery({
    mainId: customerStockTransferIn.mainId,
    locationId: customerStockTransferIn.locationId,
  });

  // Helper function to calculate current proposed tiq for a given OpticalLensDetailId
  const getCurrentProposedQty = (opticalLensDetailId) => {
    return barcodeData.reduce((sum, item) => {
      if (item.OpticalLensDetailId === opticalLensDetailId) {
        return sum + item.tiq;
      }
      return sum;
    }, 0);
  };

  const calculateStockGST = (item) => {
    if (!item) return { gstAmount: 0, slabNo: null, gstPercent: 0 };

    const tax = item.TaxDetails;
    if (!Array.isArray(tax) || tax.length === 0) {
      return { gstAmount: 0, slabNo: null, gstPercent: 0 };
    }

    const transferPrice = parseFloat(item.BuyingPrice) || 0;

    if (tax.length === 1) {
      const detail = tax[0];
      const taxPercent = parseFloat(detail.PurTaxPerct) || 0;
      const gstAmount = transferPrice * (taxPercent / 100);
      return {
        gstAmount,
        slabNo: detail.TaxDetailId,
        gstPercent: taxPercent,
      };
    }

    for (let i = 0; i < tax.length; i++) {
      const detail = tax[i];
      const slabEnd = parseFloat(detail.SlabEnd);
      const salesTax = parseFloat(detail.SalesTaxPerct) || 0;

      if (isNaN(slabEnd)) continue;

      const newSlabEnd = slabEnd / (1 + salesTax / 100);
      if (transferPrice <= newSlabEnd) {
        const taxPercent = parseFloat(detail.PurTaxPerct) || 0;
        const gstAmount = transferPrice * (taxPercent / 100);
        return {
          gstAmount,
          slabNo: detail.TaxDetailId || i + 1,
          gstPercent: taxPercent,
        };
      }
    }

    const lastDetail = tax[tax.length - 1];
    const fallbackTaxPercent = parseFloat(lastDetail?.PurTaxPerct) || 0;
    const gstAmount = transferPrice * (fallbackTaxPercent / 100);
    return {
      gstAmount,
      slabNo: lastDetail?.TaxDetailId ?? tax.length,
      gstPercent: fallbackTaxPercent,
    };
  };

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

  useEffect(() => {
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      barcodeData.forEach((item, index) => {
        const key = `${item.Barcode}-${index}`;
        if (!newEditMode[key]) {
          newEditMode[key] = {
            BuyingPrice: false,
            qty: false,
            originalPrice: item.BuyingPrice,
            originalQty: item.tiq,
          };
        }
      });
      return newEditMode;
    });
  }, [barcodeData]);

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
      powerSingleORboth: 0,
      withFitting: 1,
      prescriptionId: null,
      selectedPrescription: null,
      rimType: null,
      CLMRP: 0,
      returnPrice: 0,
      returnQty: 1,
    });
    setBarcodeData([]);
    setPowerDetailId(null);
    setEditMode({});
  };

  const handleOLensBack = () => {
    prevStockTransferInStep();
  };

  const handleDelete = (id, index) => {
    setBarcodeData((prev) =>
      prev.filter((i, idx) => !(i.Barcode === id && idx === index))
    );
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      delete newEditMode[`${id}-${index}`];
      return newEditMode;
    });
  };

  const handleSellingPriceChange = (barcode, price, index) => {
    const newPrice = Number(price);
    setBarcodeData((prev) =>
      prev.map((i, idx) =>
        i.Barcode === barcode && idx === index
          ? { ...i, BuyingPrice: newPrice }
          : i
      )
    );
  };

  const handleQtyChange = (barcode, qty, index) => {
    const newQty = Number(qty);
    const item = barcodeData[index];
    const currentProposed = getCurrentProposedQty(item.OpticalLensDetailId);
    const alreadyReceived = item.STQtyIn;
    const maxAllowed = item.STQtyOut - alreadyReceived;
    const effectiveRemaining = maxAllowed - (currentProposed - item.tiq);

    if (newQty > effectiveRemaining) {
      toast.error("Cannot exceed pending quantity!");
      return;
    }
    if (newQty < 0) {
      toast.error("Stock quantity must be greater than 0!");
      return;
    }
    setBarcodeData((prev) =>
      prev.map((i, idx) =>
        i.Barcode === barcode && idx === index ? { ...i, tiq: newQty } : i
      )
    );
  };

  const toggleEditMode = (id, index, field, action = "toggle") => {
    setEditMode((prev) => {
      const key = `${id}-${index}`;
      const currentMode = prev[key]?.[field];
      const item = barcodeData.find(
        (i, idx) => i.Barcode === id && idx === index
      );

      if (field === "BuyingPrice" && !currentMode) {
        return {
          ...prev,
          [key]: {
            ...prev[key],
            [field]: !currentMode,
            originalPrice: item.BuyingPrice,
          },
        };
      }

      if (field === "qty" && !currentMode) {
        return {
          ...prev,
          [key]: {
            ...prev[key],
            [field]: !currentMode,
            originalQty: item.tiq,
          },
        };
      }

      if (currentMode && action === "cancel") {
        if (field === "BuyingPrice") {
          setBarcodeData((prevItems) =>
            prevItems.map((i, idx) =>
              i.Barcode === id && idx === index
                ? { ...i, BuyingPrice: prev[key].originalPrice }
                : i
            )
          );
        } else if (field === "qty") {
          setBarcodeData((prevItems) =>
            prevItems.map((i, idx) =>
              i.Barcode === id && idx === index
                ? { ...i, tiq: prev[key].originalQty }
                : i
            )
          );
        }
      }

      return {
        ...prev,
        [key]: {
          ...prev[key],
          [field]: !currentMode,
          originalPrice: prev[key]?.originalPrice,
          originalQty: prev[key]?.originalQty,
        },
      };
    });
  };

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode) return;

    try {
      const res = await getOLByBarcode({
        barcode,
        locationId: customerStockTransferIn.locationId,
      }).unwrap();

      if (res?.data) {
        // Check if product exists in StockTransferOut
        const STOProduct = stockOutData?.data?.details?.find(
          (item) => item.OpticalLensDetailId === res?.data.OpticalLensDetailId
        );
        if (!STOProduct) {
          toast.error("Product is not present in the selected Stock Transfer");
          setBarcode("");
          return;
        }

        // Calculate pending quantity
        const currentProposed = getCurrentProposedQty(
          res.data.OpticalLensDetailId
        );
        const remaining =
          STOProduct.STQtyOut - STOProduct.STQtyIn - currentProposed;
        if (1 > remaining) {
          toast.error("No Pending Qty left for the given product");
          setBarcode("");
          return;
        }

        setBarcodeData((prev) => {
          // Find existing item in state
          const existingIndex = prev.findIndex(
            (i) => i.Barcode === res.data.Barcode
          );

          if (existingIndex !== -1) {
            // Update existing item
            return prev.map((item, idx) =>
              idx === existingIndex ? { ...item, tiq: item.tiq + 1 } : item
            );
          } else {
            // Add new item
            return [
              {
                ...res.data,
                ...STOProduct,
                tiq: 1,
                BuyingPrice: parseFloat(STOProduct?.TransferPrice),
                MRP: STOProduct?.SRP,
              },
              ...prev,
            ];
          }
        });

        setBarcode("");
      } else {
        toast.error("Barcode doesn't exist!");
        setBarcode("");
      }
    } catch (error) {
      toast.error(error?.data?.error || "Barcode doesn't exist!");
      setBarcode("");
    }
  };

  const [selectedEyes, setSelectedEyes] = useState([]);
  const [diaOptions, setDiaOptions] = useState([]);
  const [addFieldError, setAddFieldError] = useState(false);
  const [showGetDiaButton, setShowGetDiaButton] = useState(true);
  const [isDiaFetched, setIsDiaFetched] = useState(false);
  const [isPriceFetched, setIsPriceFetched] = useState(false);
  const [errors, setErrors] = useState(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [powerDetailId, setPowerDetailId] = useState(null);

  const [formValues, setFormValues] = useState({
    R: {
      SPH: "",
      CYLD: "",
      Dia: null,
      transferQty: "",
      Id: null,
      detailId: null,
    },
    L: {
      SPH: "",
      CYLD: "",
      Dia: null,
      transferQty: "",
      Id: null,
      detailId: null,
    },
  });
  const [getDIADetails, { isLoading: isDiaLoading }] =
    useGetDIaDetailsMutation();
  const [getPowerByOl, { isLoading: isPowerDetailsLoading }] =
    useGetOlDetailsByOlDetailIdMutation();

  useEffect(() => {
    setSelectedEyes(["R"]);
  }, []);

  useEffect(() => {
    setBarcodeData([]);
  }, [barCodeOrproduct]);

  const handleReset = () => {
    setSelectedEyes(["R"]);
    setIsEditable(false);
    setFormValues({
      R: {
        SPH: "",
        CYLD: "",
        Dia: null,
        transferQty: "",
        Id: null,
        detailId: null,
      },
      L: {
        SPH: "",
        CYLD: "",
        Dia: null,
        transferQty: "",
        Id: null,
        detailId: null,
      },
    });
    setAddFieldError(false);
    setShowGetDiaButton(true);
    setIsDiaFetched(false);
    setDiaOptions([]);
    setPowerDetailId(null);
  };

  const isFieldDisabled = (eye, field) => {
    if (field === "Dia") {
      return (
        !isDiaFetched ||
        isPriceFetched ||
        !isEditable ||
        (lensData.powerSingleORboth !== 1 && !selectedEyes.includes(eye))
      );
    }
    if (field === "transferQty") {
      return (
        !isDiaFetched ||
        !formValues[eye].Dia ||
        !isEditable ||
        (lensData.powerSingleORboth !== 1 && !selectedEyes.includes(eye))
      );
    }
    return (
      isDiaFetched ||
      !isEditable ||
      (lensData.powerSingleORboth !== 1 && !selectedEyes.includes(eye))
    );
  };

  const handleInputChange = (eye, field, value) => {
    if (field === "transferQty") {
      if (!isValidNumericInput(value)) {
        return;
      }
    }

    setFormValues((prev) => ({
      ...prev,
      [eye]: { ...prev[eye], [field]: value },
    }));
  };

  const handleGetDia = async () => {
    const isBothSelected = lensData.powerSingleORboth === 1;
    const isRSelected = isBothSelected || selectedEyes.includes("R");
    const isLSelected = isBothSelected || selectedEyes.includes("L");

    const safeParse = (value) => {
      const parsed = typeof value === "string" ? value.trim() : value;
      return parsed !== "" && !isNaN(parsed) ? Number(parsed) : null;
    };

    const payload = {
      RSPH: isRSelected ? safeParse(formValues.R.SPH) : null,
      RCYLD: isRSelected ? safeParse(formValues.R.CYLD) : null,
      selectedTypeRight: isRSelected ? 1 : 0,
      LSPH: isLSelected ? safeParse(formValues.L.SPH) : null,
      LCYLD: isLSelected ? safeParse(formValues.L.CYLD) : null,
      selectedTypeLeft: isLSelected ? 1 : 0,
      OpticalLensMasterId: lensData.masterId,
      CoatingComboId: lensData.coatingComboId,
    };

    try {
      const res = await getDIADetails({ payload }).unwrap();
      const { diameters, details } = res.data || {};

      if (res.status === "failure" || res.success === false) {
        const errors = res.error || res.errors;
        setErrors(
          Array.isArray(errors)
            ? errors
            : typeof errors === "string"
            ? [errors]
            : []
        );
        setErrorModalOpen(true);
        return;
      }

      const updatedForm = { ...formValues };
      ["R", "L"].forEach((eye) => {
        if ((eye === "R" && isRSelected) || (eye === "L" && isLSelected)) {
          const dia = diameters?.find((d) => d.side === eye);
          const detail = details?.find((d) => d.side === eye);

          updatedForm[eye].Dia = dia || null;
          updatedForm[eye].transferQty = dia ? 1 : "";
          updatedForm[eye].Id = dia?.Id || null;
          updatedForm[eye].detailId = detail?.OpticalLensDetailsId || null;
        }
      });
      setPowerDetailId(details[0].OpticalLensDetailsId);
      setFormValues(updatedForm);
      setDiaOptions(diameters || []);
      setIsDiaFetched(true);
      setShowAdd(true);
      setShowGetDiaButton(false);
    } catch (err) {
      console.error("Error fetching Dia:", err);
      const errors = err.data?.error || err.data?.errors;
      setErrors(
        Array.isArray(errors)
          ? errors
          : typeof errors === "string"
          ? [errors]
          : []
      );
      setErrorModalOpen(true);
      setPowerDetailId(null);
    }
  };

  const handleAddPowerData = async (eye) => {
    try {
      const STOProduct = stockOutData?.data?.details?.find(
        (item) => item.OpticalLensDetailId === formValues[eye].detailId
      );

      if (!STOProduct) {
        toast.error("Product is not present in the selected Stock Transfer");
        return;
      }

      // Calculate pending quantity
      const currentProposed = getCurrentProposedQty(formValues[eye].detailId);
      const remaining =
        STOProduct.STQtyOut - STOProduct.STQtyIn - currentProposed;
      const requestedQty = parseInt(formValues[eye].transferQty) || 1;

      if (requestedQty > remaining) {
        toast.error("No Pending Qty left for the given product");
        return;
      }

      const payload = {
        olDetailId: formValues[eye]?.detailId,
        locationId: parseInt(customerStockTransferIn.locationId),
      };

      if (!payload.olDetailId) {
        console.warn(`No detailId found for eye: ${eye}`);
        return;
      }

      const res = await getPowerByOl({ payload }).unwrap();
      // if (res?.data.Quantity <= 0) {
      //   toast.error("Stock Quantity must be greater than 0!");
      //   return;
      // }

      setBarcodeData((prev) => {
        // Find existing item in state
        const existingIndex = prev.findIndex(
          (i) => i.Barcode === res.data.Barcode
        );

        if (existingIndex !== -1) {
          // Update existing item
          return prev.map((item, idx) =>
            idx === existingIndex
              ? { ...item, tiq: item.tiq + requestedQty }
              : item
          );
        } else {
          // Add new item
          return [
            ...prev,
            {
              ...res.data,
              ...STOProduct,
              tiq: requestedQty,
              BuyingPrice: parseFloat(STOProduct?.TransferPrice),
              MRP: STOProduct?.SRP,
            },
          ];
        }
      });

      setBarcode("");
      setShowAdd(false);
      handleReset();
    } catch (error) {
      console.log(error?.data?.error);
      toast.error(error?.data?.error || "Failed to add power data");
    }
  };

  const handleSaveFinalData = async () => {
    if (!Array.isArray(barcodeData) || barcodeData.length === 0) {
      console.warn("No details to save");
      return;
    }
    try {
      const payload = {
        STInMainId: stockTransferInDraftData.ID,
        STOutMainId: parseInt(customerStockTransferIn.mainId),
        products: barcodeData.map((item) => {
          return {
            ProductType: 0,
            detailId: item.OpticalLensDetailId,
            BatchCode: null,
            STQtyIn: item.tiq,
            STQtyOut: item.STQtyOut,
            transferPrice: parseFloat(item.BuyingPrice),
            gstPercentage: calculateStockGST(item).gstPercent,
            srp: parseFloat(item.SRP),
          };
        }),
      };
      await saveStockTransfer({ payload }).unwrap();
      toast.success("Optical Lens transferin successfully added");
      goToStockTransferInStep(4);
    } catch (error) {
      toast.error(error?.data.error.message || error?.data?.error || "Please try again after some time!");
    }
  };

  const inputTableColumns = ["SPH", "CYLD", "Dia", "transferQty"];

  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-4 mb-4"></div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h1 className="text-2xl font-bold text-neutral-700">
              Step {currentStockTransferInStep}:{" "}
              {selectedStockTransferInProduct.label}
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

          <form onSubmit={handleBarcodeSubmit} className="space-y-2 mb-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between w-1/2 mb-3">
                <div className="flex items-center gap-5">
                  <Radio
                    value="0"
                    onChange={() => {
                      setBarCodeOrProduct(0)
                     handleRefresh()

                    }}
                    checked={barCodeOrproduct === 0}
                    label="Stock lenses(By barcode)"
                  />
                  <Radio
                    value="1"
                    onChange={() => setBarCodeOrProduct(1)}
                    checked={barCodeOrproduct === 1}
                    label="Search Product"
                  />
                </div>
              </div>
              {barCodeOrproduct === 0 && (
                <div className="flex gap-2">
                  <div className="relative flex items-center">
                    <input
                      id="barcode"
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Scan or enter barcode"
                      className="w-[400px] pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <FiSearch className="absolute left-3 text-gray-400" />
                  </div>
                  <Button
                    type="submit"
                    isLoading={isByBarcodeLoading || isBarcodeFetching}
                    disabled={isByBarcodeLoading || isBarcodeFetching}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          </form>

          {barcodeData.length > 0 && barCodeOrproduct === 0 && (
            <Table
              columns={[
                "s.no",
                "type",
                "product name",
                "transfer price",
                "pending qty",
                "transfer in qty",
                "gst",
                "total amount",
                "action",
              ]}
              data={barcodeData}
              renderRow={(item, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>OL</TableCell>
                  <TableCell className="whitespace-pre-wrap">
                    {getProductName(item)}
                  </TableCell>
                  <TableCell>
                    {editMode[`${item.Barcode}-${index}`]?.BuyingPrice ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.BuyingPrice || ""}
                          onChange={(e) =>
                            handleSellingPriceChange(
                              item.Barcode,
                              e.target.value,
                              index
                            )
                          }
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          placeholder="Enter price"
                        />
                        <button
                          onClick={() =>
                            toggleEditMode(
                              item.Barcode,
                              index,
                              "BuyingPrice",
                              "save"
                            )
                          }
                          className="text-neutral-400 transition"
                          title="Save"
                        >
                          <FiCheck size={18} />
                        </button>
                        <button
                          onClick={() =>
                            toggleEditMode(
                              item.Barcode,
                              index,
                              "BuyingPrice",
                              "cancel"
                            )
                          }
                          className="text-neutral-400 transition"
                          title="Cancel"
                        >
                          <FiX size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        ₹{formatINR(item.BuyingPrice)}
                        <button
                          onClick={() =>
                            toggleEditMode(item.Barcode, index, "BuyingPrice")
                          }
                          className="text-neutral-400 transition"
                          title="Edit Price"
                        >
                          <FiEdit2 size={14} />
                        </button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{item.STQtyOut - item.STQtyIn}</TableCell>
                  <TableCell>
                    {editMode[`${item.Barcode}-${index}`]?.qty ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.tiq}
                          onChange={(e) =>
                            handleQtyChange(item.Barcode, e.target.value, index)
                          }
                          className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          min="1"
                        />
                        <button
                          onClick={() =>
                            toggleEditMode(item.Barcode, index, "qty")
                          }
                          className="text-neutral-400 transition"
                          title="Save"
                        >
                          <FiCheck size={18} />
                        </button>
                        <button
                          onClick={() =>
                            toggleEditMode(item.Barcode, index, "qty")
                          }
                          className="text-neutral-400 transition"
                          title="Cancel"
                        >
                          <FiX size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {item.tiq}
                        <button
                          onClick={() =>
                            toggleEditMode(item.Barcode, index, "qty", "cancel")
                          }
                          className="text-neutral-400 transition"
                          title="Edit Quantity"
                        >
                          <FiEdit2 size={14} />
                        </button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    ₹{formatINR(calculateStockGST(item).gstAmount)}(
                    {calculateStockGST(item).gstPercent}%)
                  </TableCell>
                  <TableCell>
                    ₹
                    {formatINR(
                      parseFloat(item.BuyingPrice) * item.tiq +
                        calculateStockGST(item).gstAmount * item.tiq
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleDelete(item.Barcode, index)}
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

          {barCodeOrproduct === 1 && (
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
                            lensData.indexValues ||
                            type.lable === "Rx"
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
            </div>
          )}
          {lensData.treatmentId && (
            <div className="mt-3 w-full">
              <Input
                label="Product Name"
                value={lensData.productName || ""}
                onChange={(e) =>
                  setLensData({
                    ...lensData,
                    productName: e.target.value,
                  })
                }
                placeholder="Enter product name"
                className="w-full"
                disabled
              />
            </div>
          )}
          {lensData.treatmentId && (
            <>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => setIsEditable(true)}>
                    Edit
                  </Button>
                  <Button onClick={handleReset}>Reset</Button>
                </div>
              </div>
              {addFieldError && (
                <p className="text-red-600 mt-2 text-sm">
                  Add on value is not applicable for the selected product.
                  Please change the product or the prescription
                </p>
              )}
              <table className="w-full bg-white shadow rounded-lg mt-3 border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    {inputTableColumns.map((col) => (
                      <th
                        key={col}
                        className="p-3 text-left text-gray-600 font-medium uppercase"
                      >
                        {col === "transferQty" ? "Transfer Qty" : col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    {inputTableColumns.map((field) => (
                      <td key={field} className="p-3 align-top">
                        {field === "Dia" && isDiaFetched ? (
                          <select
                            className={`w-24 px-2 py-1 border rounded-md ${
                              isFieldDisabled("R", field)
                                ? "bg-gray-100 border-gray-200 text-gray-400"
                                : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            }`}
                            value={formValues.R.Dia?.DiameterSize || ""}
                            onChange={(e) => {
                              const selectedDia = diaOptions.find(
                                (d) => d.DiameterSize === e.target.value
                              );
                              setFormValues((prev) => ({
                                ...prev,
                                R: {
                                  ...prev.R,
                                  Dia: selectedDia || null,
                                  transferQty: selectedDia ? "1" : "",
                                },
                              }));
                            }}
                            disabled={isFieldDisabled("R", field)}
                          >
                            <option value="">Select</option>
                            {diaOptions.map((d) => (
                              <option key={d.Id} value={d.DiameterSize}>
                                {d.DiameterSize}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field === "transferQty" ? "number" : "text"}
                            min={field === "transferQty" ? "1" : undefined}
                            value={formValues.R[field] || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              console.log("Input onChange", { field, value });
                              if (field === "transferQty") {
                                // Only allow digits and empty string
                                if (value === "" || /^\d*$/.test(value)) {
                                  handleInputChange("R", field, value);
                                }
                              } else {
                                handleInputChange("R", field, value);
                              }
                            }}
                            onKeyPress={(e) => {
                              if (
                                field === "transferQty" &&
                                !/[0-9]/.test(e.key)
                              ) {
                                e.preventDefault();
                              }
                            }}
                            disabled={isFieldDisabled("R", field)}
                            className={`w-24 px-2 py-1 border rounded-md ${
                              isFieldDisabled("R", field)
                                ? "bg-gray-100 border-gray-200 text-gray-400"
                                : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            }`}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              <div className="mt-4 flex justify-end gap-4 items-center">
                {showGetDiaButton && (
                  <Button onClick={handleGetDia} disabled={isDiaLoading}>
                    {isDiaLoading ? "Loading..." : "Fetch Dia"}
                  </Button>
                )}
                {showAdd && (
                  <Button
                    isLoading={isPowerDetailsLoading}
                    disabled={isPowerDetailsLoading}
                    onClick={() => handleAddPowerData(selectedEyes[0])}
                  >
                    Add
                  </Button>
                )}
              </div>
            </>
          )}
          {barcodeData.length > 0 && barCodeOrproduct === 1 && (
            <Table
              columns={[
                "s.no",
                "type",
                "product name",
                "transfer price",
                "pending qty",
                "transfer in qty",
                "gst",
                "total amount",
                "action",
              ]}
              data={barcodeData}
              renderRow={(item, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>OL</TableCell>
                  <TableCell className="whitespace-pre-wrap">
                    {getProductName(item)}
                  </TableCell>
                  <TableCell>
                    {editMode[`${item.Barcode}-${index}`]?.BuyingPrice ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.BuyingPrice || ""}
                          onChange={(e) =>
                            handleSellingPriceChange(
                              item.Barcode,
                              e.target.value,
                              index
                            )
                          }
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          placeholder="Enter price"
                        />
                        <button
                          onClick={() =>
                            toggleEditMode(
                              item.Barcode,
                              index,
                              "BuyingPrice",
                              "save"
                            )
                          }
                          className="text-neutral-400 transition"
                          title="Save"
                        >
                          <FiCheck size={18} />
                        </button>
                        <button
                          onClick={() =>
                            toggleEditMode(
                              item.Barcode,
                              index,
                              "BuyingPrice",
                              "cancel"
                            )
                          }
                          className="text-neutral-400 transition"
                          title="Cancel"
                        >
                          <FiX size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        ₹{formatINR(item.BuyingPrice)}
                        <button
                          onClick={() =>
                            toggleEditMode(item.Barcode, index, "BuyingPrice")
                          }
                          className="text-neutral-400 transition"
                          title="Edit Price"
                        >
                          <FiEdit2 size={14} />
                        </button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{item.STQtyOut - item.STQtyIn}</TableCell>
                  <TableCell>
                    {editMode[`${item.Barcode}-${index}`]?.qty ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.tiq}
                          onChange={(e) =>
                            handleQtyChange(item.Barcode, e.target.value, index)
                          }
                          className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          min="1"
                        />
                        <button
                          onClick={() =>
                            toggleEditMode(item.Barcode, index, "qty")
                          }
                          className="text-neutral-400 transition"
                          title="Save"
                        >
                          <FiCheck size={18} />
                        </button>
                        <button
                          onClick={() =>
                            toggleEditMode(item.Barcode, index, "qty")
                          }
                          className="text-neutral-400 transition"
                          title="Cancel"
                        >
                          <FiX size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {item.tiq}
                        <button
                          onClick={() =>
                            toggleEditMode(item.Barcode, index, "qty", "cancel")
                          }
                          className="text-neutral-400 transition"
                          title="Edit Quantity"
                        >
                          <FiEdit2 size={14} />
                        </button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    ₹{formatINR(calculateStockGST(item).gstAmount)}(
                    {calculateStockGST(item).gstPercent}%)
                  </TableCell>
                  <TableCell>
                    ₹
                    {formatINR(
                      parseFloat(item.BuyingPrice) * item.tiq +
                        calculateStockGST(item).gstAmount * item.tiq
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleDelete(item.Barcode, index)}
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

          {barcodeData.length > 0 && (
            <div className="mt-5 p-4 bg-gray-50 rounded-lg flex justify-end">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-lg font-medium text-neutral-700">
                    Total Quantity:
                  </span>
                  <span className="ml-2 text-xl font-semibold text-neutral-700">
                    {barcodeData.reduce(
                      (sum, item) => sum + (item.tiq || 0),
                      0
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-lg font-medium text-neutral-700">
                    Total GST:
                  </span>
                  <span className="ml-2 text-xl font-semibold text-neutral-700">
                    ₹
                    {formatINR(
                      barcodeData.reduce((sum, item) => {
                        const { gstPercent } = calculateStockGST(item);
                        const gstAmount =
                          (item.BuyingPrice || 0) *
                          (item.tiq || 0) *
                          (parseFloat(gstPercent) / 100);
                        return sum + gstAmount;
                      }, 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-lg font-medium text-neutral-700">
                    Total Amount:
                  </span>
                  <span className="ml-2 text-xl font-semibold text-neutral-700">
                    ₹
                    {formatINR(
                      barcodeData.reduce((sum, item) => {
                        const { gstPercent } = calculateStockGST(item);
                        const baseAmount =
                          (parseFloat(item.BuyingPrice) || 0) * (item.tiq || 0);
                        const gstAmount = baseAmount * (gstPercent / 100);
                        return sum + (baseAmount + gstAmount);
                      }, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
          {barcodeData.length > 0 && (
            <div className="flex justify-end mt-5">
              {" "}
              <Button
                onClick={handleSaveFinalData}
                isLoading={isStockTransferLoading}
                disabled={isStockTransferLoading}
              >
                Save & Next
              </Button>
            </div>
          )}
          <ErrorDisplayModal
            errors={errors}
            open={errorModalOpen}
            onClose={() => setErrorModalOpen(false)}
          />
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
