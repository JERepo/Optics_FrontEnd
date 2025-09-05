import React, { useState, useEffect } from "react";
import { useOrder } from "../../../features/OrderContext";
import {
  FiArrowLeft,
  FiCheck,
  FiEdit,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { Table, TableCell, TableRow } from "../../../components/Table";
import TextField from "@mui/material/TextField";
import { useGetAllBrandsQuery } from "../../../api/brandsApi";
import {
  useGetColourQuery,
  useGetModalitiesQuery,
  useGetPowerDetailsMutation,
  useGetProductNamesByModalityQuery,
} from "../../../api/orderApi";
import { Autocomplete } from "@mui/material";
import Input from "../../../components/Form/Input";
import { toast } from "react-hot-toast";
import Radio from "../../../components/Form/Radio";

import { useLazyGetBatchDetailsQuery } from "../../../api/InvoiceApi";
import { useSelector } from "react-redux";
import {
  useGetBatchBarCodeMutation,
  useLazyGetBatchesForCLQuery,
  useLazyGetInvoiceDetailsQuery,
  useSaveProductsMutation,
} from "../../../api/salesReturnApi";
import { formatINR } from "../../../utils/formatINR";
import Modal from "../../../components/ui/Modal";

// Validation helpers
const isMultipleOfQuarter = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && Math.abs(num * 100) % 25 === 0;
};

const isValidAxis = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num >= 1 && num <= 180;
};

const getProductName = (order) => {
  const {
    ProductType,
    productName,
    ProductName,
    specs,
    barcode,
    Barcode,
    hSN,
    HSN,
    ExpiryDate,
    FittingPrice,
    FittingGSTPercentage,
    batchCode,
    BatchCode,
    CLBatchCode,
    colour,
    Colour,
    SphericalPower,
    CylindricalPower,
    Axis,
    Additional,
    BrandName,
    selectBatch,
    sbatchCode,
    CLBatchBarCode,
    sbatchbarCode,
    sphericalPower,
    cylindricalPower,
  } = order;

  const clean = (val) => {
    if (
      val === null ||
      val === undefined ||
      val === "undefined" ||
      val === "null" ||
      val === "N/A" ||
      val === 0
    ) {
      return "";
    }
    return String(val).trim();
  };

  const cleanPower = (val) => {
    const cleaned = clean(val);
    if (!cleaned) return "";
    const num = parseFloat(cleaned);
    if (isNaN(num)) return "";
    return num >= 0 ? `+${num.toFixed(2)}` : `${num.toFixed(2)}`;
  };

  if (ProductType === 3 || true) {
    // Assuming CL is type 3
    const name = clean(productName || ProductName);
    const hsn = clean(hSN || HSN || "");
    const brand = clean(BrandName);
    const barcodeVal = clean(barcode || Barcode);
    const expiry = clean(ExpiryDate || order.Expiry);
    const batchc = clean(sbatchCode || order.BatchCode);
    const batchBar = clean(sbatchbarCode);
    let specsObj = {};
    if (typeof specs === "string") {
      specs.split(",").forEach((pair) => {
        let [key, value] = pair.split(":").map((s) => s.trim());
        if (value === "null") value = null;
        specsObj[key] = value;
      });
    } else {
      specsObj = {
        Sph: SphericalPower || sphericalPower || order.Spherical,
        Cyld: CylindricalPower || cylindricalPower || order.Cylindrical,
        Axis: Axis,
        Add: Additional,
      };
      // specsObj = {
      //   Sph: specs.SphericalPower || specs.sphericalPower,
      //   Cyld: specs.CylindricalPower || specs.cylindricalPower,
      //   Axis: specs.Axis || specs.axis,
      //   Add: specs.Additional || specs.additional,
      // };
    }

    const sph = cleanPower(specsObj.Sph);
    const cyld = cleanPower(specsObj.Cyld);
    const axis = clean(specsObj.Axis);
    const addl = cleanPower(specsObj.Add);
    const clr = clean(colour || Colour);

    const specsList = [
      sph && `SPH: ${sph}`,
      cyld && `CYL: ${cyld}`,
      axis && `Axis: ${axis}`,
      addl && `Add: ${addl}`,
    ]
      .filter(Boolean)
      .join(", ");

    return [
      brand && `${brand} ${name}`,
      specsList,
      clr && `Color: ${clr}`,
      barcodeVal && `Barcode: ${barcodeVal}`,
      batchc && `BatchCode: ${batchc}`,
      batchBar && `BatchBarCode: ${batchBar}`,
      expiry && `Expiry : ${expiry.split("-").reverse().join("/")}`,
      hsn && `HSN: ${hsn}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return "";
};
const getProductNameYes = (data) => {
  const order = { ...data.ProductDetails[0], ...data };
  const {
    productName,
    BrandName,
    specs = {},
    HSN,
    hSN,
    barcode,
    color,
    Barcode,
    ProductType,
    Colour,
    brandName,
    selectBatch,
    sbatchCode,
    CLBatchBarCode,
    sbatchbarCode,
    ExpiryDate,
  } = order;
  console.log("order in yes", order);
  const clean = (val) => {
    if (
      val === null ||
      val === undefined ||
      val === "undefined" ||
      val === "null" ||
      val === "N/A" ||
      val === 0
    ) {
      return "";
    }
    return String(val).trim();
  };

  const cleanPower = (val) => {
    const cleaned = clean(val);
    if (!cleaned) return "";
    const num = parseFloat(cleaned);
    if (isNaN(num)) return "";
    return num >= 0 ? `+${num.toFixed(2)}` : `${num.toFixed(2)}`;
  };

  const name = clean(productName);
  const hsn = clean(HSN || hSN);
  const brand = clean(brandName);
  const barcodeVal = clean(Barcode || barcode);
  const clr = clean(Colour || color);
  const expiry = clean(ExpiryDate || order.Expiry);
  const batchc = clean(sbatchCode || order.BatchCode);
  const batchBar = clean(sbatchbarCode);
  console.log("ooo", order);

  // Ensure specs is an object, handle cases where it might be a string
  let specsObj = {};

  specsObj = {
    Sph: specs.SphericalPower || specs.sphericalPower,
    Cyld: specs.CylindricalPower || specs.cylindricalPower,
    Axis: specs.Axis || specs.axis,
    Add: specs.Additional || specs.additional,
  };

  const sph = cleanPower(specsObj.Sph);
  const cyld = cleanPower(specsObj.Cyld);
  const axis = clean(specsObj.Axis);
  const addl = cleanPower(specsObj.Add);

  const specsList = [
    sph && `SPH: ${sph}`,
    cyld && `CYL: ${cyld}`,
    axis && `Axis: ${axis}`,
    addl && `Add: ${addl}`,
  ]
    .filter(Boolean)
    .join(", ");

  return [
    brand && `${brand} ${name}`,
    specsList,
    clr && `Color: ${clr}`,
    barcodeVal && `Barcode: ${barcodeVal}`,
    batchc && `BatchCode: ${batchc}`,
    batchBar && `BatchBarCode: ${batchBar}`,
    expiry && `Expiry : ${expiry.split("-").reverse().join("/")}`,
    hsn && `HSN: ${hsn}`,
  ]
    .filter(Boolean)
    .join("\n");
};

const ContactLens = () => {
  const {
    prevSalesStep,
    customerSalesId,
    salesDraftData,

    findGSTPercentage,
    calculateGST,
    goToSalesStep,
    referenceApplicable,
    selectedPatient,
    currentSalesStep,
    selectedSalesProduct,
  } = useOrder();
  const { hasMultipleLocations, user } = useSelector((state) => state.auth);
  const [searchFethed, setSearchFetched] = useState(false);

  const [mainClDetails, setMainClDetails] = useState([]);
  const [showInputRow, setShowInputRow] = useState(true);
  const [productSearch, setProductSearch] = useState(1); // Default to Enter Product Barcode
  const [selectBatch, setSelectBatch] = useState(0);
  const [selectedBatchCode, setSelectedBatchCode] = useState(null);
  const [editMode, setEditMode] = useState({});
  const [editReturnQty, setEditReturnQty] = useState("");
  const [editReturnPrice, setEditReturnPrice] = useState("");
  const [batchCodeInput, setbatchCodeInput] = useState("");
  const [productCodeInput, setProductCodeInput] = useState("");
  const [detailId, setDetailId] = useState(false);
  const [openBatch, setOpenBatch] = useState(false);
  const [openReferenceYes, setOpenReferenceYes] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceSelected, setIsInvoiceSelected] = useState(false);
  const [selectedInvoiceReturnQty, setSelectedInvoiceReturnQty] = useState(0);
  const [detaildAccId, setDetailAccId] = useState(null);
  const [lensData, setLensData] = useState({
    orderReference: null,
    brandId: null,
    modalityId: null,
    productId: null,
    color: null,
  });

  const [newItem, setNewItem] = useState({
    CLDetailId: null,
    sphericalPower: null,
    cylindricalPower: null,
    axis: null,
    additional: null,
    avlQty: null,
    orderQty: null,
    sellingPrice: null,
    powerData: null,
  });

  const [errors, setErrors] = useState({});

  const { data: modalities, isLoading: modalitiesLoading } =
    useGetModalitiesQuery();
  const { data: allBrands } = useGetAllBrandsQuery();
  const { data: productNames, isLoading: isProductsLoading } =
    useGetProductNamesByModalityQuery(
      { brandId: lensData.brandId, modalityId: lensData.modalityId },
      { skip: !lensData.brandId || !lensData.modalityId }
    );

  const { data: colorData, isLoading: colorDataLoading } = useGetColourQuery(
    { clMainId: lensData.productId },
    { skip: !lensData.productId }
  );

  const [getBatches, { data: batchDetails }] = useLazyGetBatchDetailsQuery();
  const [getPowerDetails, { isLoading: isPowerDetailsLoading }] =
    useGetPowerDetailsMutation();

  const [
    getBatchBarCodeDetails,
    { data: batchBarCodeDetails, isLoading: isbatchBarLoading },
  ] = useGetBatchBarCodeMutation();
  const [saveFinalProducts, { isLoading: isFinalProductsSaving }] =
    useSaveProductsMutation();
  const [
    getInvoiceDetails,
    { data: InvoiceDetails, isLoading: isInvoiceLoading },
  ] = useLazyGetInvoiceDetailsQuery();
  const [getCLBatches, { data: CLBatches }] = useLazyGetBatchesForCLQuery();

  useEffect(() => {
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      mainClDetails.forEach((item, index) => {
        const key = `${item.Barcode}-${index}`;
        if (!newEditMode[key]) {
          newEditMode[key] = {
            SellingPrice: false,
            qty: false,
            originalPrice: item.sellingPrice,
            originalQty: item.returnQty,
          };
        }
      });
      return newEditMode;
    });
  }, [mainClDetails]);

  const toggleEditMode = (id, index, field, action = "toggle") => {
    setEditMode((prev) => {
      const key = `${id}-${index}`;
      const currentMode = prev[key]?.[field];
      const item = mainClDetails.find((i, idx) => idx === index);

      if (field === "SellingPrice" && !currentMode) {
        return {
          ...prev,
          [key]: {
            ...prev[key],
            [field]: !currentMode,
            originalPrice: item.returnPrice,
          },
        };
      }

      if (field === "qty" && !currentMode) {
        return {
          ...prev,
          [key]: {
            ...prev[key],
            [field]: !currentMode,
            originalQty: item.returnQty, // Store original quantity
          },
        };
      }

      if (currentMode && action === "cancel") {
        if (field === "SellingPrice") {
          setMainClDetails((prevItems) =>
            prevItems.map((i, idx) =>
              idx === index ? { ...i, returnPrice: prev[key].originalPrice } : i
            )
          );
        } else if (field === "qty") {
          setMainClDetails((prevItems) =>
            prevItems.map((i, idx) =>
              idx === index ? { ...i, returnQty: prev[key].originalQty } : i
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
  const handleSellingPriceChange = (barcode, price, index) => {
    const item = mainClDetails.find((i, idx) => idx === index);
    const newPrice = Number(price);

    if (newPrice > item.MRP) {
      toast.error("Return Price cannot be greater than MRP!");
      return;
    }

    setMainClDetails((prev) =>
      prev.map((i, idx) =>
        idx === index ? { ...i, returnPrice: newPrice } : i
      )
    );
  };
  const handleQtyChange = (barcode, qty, index) => {
    const newQty = Number(qty);

    if (newQty < 0) {
      toast.error("Stock quantity must be greater than 0!");
      return;
    }
    setMainClDetails((prev) =>
      prev.map((i, idx) => (idx === index ? { ...i, returnQty: newQty } : i))
    );
  };

  const handleRefresh = () => {
    setLensData({
      orderReference: null,
      brandId: null,
      modalityId: null,
      productId: null,
      color: null,
    });
    setSearchFetched(false);
    setNewItem({
      CLDetailId: null,
      sphericalPower: null,
      cylindricalPower: null,
      axis: null,
      additional: null,
      avlQty: null,
      orderQty: null,
      sellingPrice: null,
      powerData: null,
    });
    setSelectedBatchCode(null);
    setProductSearch(1);
    setDetailId(false);
    setProductCodeInput("");
  };

  const handleRefeshPowerTable = () => {
    setNewItem({
      CLDetailId: "",
      sphericalPower: "",
      cylindricalPower: "",
      axis: "",
      additional: "",
      avlQty: "",
      orderQty: "",
      sellingPrice: "",
      powerData: "",
    });
    setErrors({});
    setSearchFetched(false);
  };

  const filteredBrands =
    allBrands?.filter(
      (brand) => brand.ContactLensActive === 1 && brand.IsActive === 1
    ) || [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));

    let message = "";

    if (["sphericalPower", "cylindricalPower", "additional"].includes(name)) {
      if (value && !isMultipleOfQuarter(value)) {
        message = "Power should only be in multiples of 0.25";
      }
    }

    if (name === "axis" && value && !isValidAxis(value)) {
      message = "Axis is incorrect";
    }

    if (name === "additional") {
      const additionalValue = parseFloat(value);
      if (value && (!isMultipleOfQuarter(value) || additionalValue < 0)) {
        message = "Additional power must be a positive multiple of 0.25";
      }
    }

    setErrors((prev) => ({ ...prev, [name]: message }));
  };
  const handleSearch = async () => {
    if (!newItem.sphericalPower) {
      toast.error("Please enter Spherical Power before searching.");
      return;
    }

    const payload = {
      CLMainId: lensData.productId,
      Spherical: parseFloat(newItem.sphericalPower),
      Cylindrical: parseFloat(newItem.cylindricalPower) || null,
      Axis: parseInt(newItem.axis) || null,
      Additional: parseInt(newItem.additional) || null,
      Colour: lensData.color || null,
      locationId: customerSalesId.locationId,
    };

    try {
      const response = await getPowerDetails({ payload }).unwrap();
      if (response?.data?.data) {
        const data = response.data.data;
        toast.success(`${response?.data.message}`);
        setNewItem({
          CLDetailId: data.CLDetailId,
          sphericalPower: data.SphericalPower,
          cylindricalPower: data.CylindricalPower,
          axis: data.Axis,
          additional: data.Additional,
          avlQty: parseInt(data.AvlQty),
          orderQty: data.DefaultOrderQty,
          sellingPrice: data.SellingPrice,
          powerData: data,
        });
        setSearchFetched(true);
        if (data.CLBatchCode === 1 && referenceApplicable === 0) {
          await getCLBatches({
            detailId: data.CLDetailId,
            locationId: parseInt(hasMultipleLocations[0]),
          }).unwrap();
          setDetailId(true);
          setOpenBatch(true);
        } else if (data.CLBatchCode === 0 && referenceApplicable === 0) {
          if (data.stock[0]?.quantity <= 0) {
            toast.error("Stock quantity must be greater than 0!");
            return;
          }
          const cc = {
            ...data,
            Quantity: data.stock[0]?.quantity,
            returnPrice: parseFloat(data?.priceMaster.sellingPrice),
            returnQty: 1,
            sbatchCode: data.stock[0]?.batchCode,
            ExpiryDate: data.stock[0]?.CLBatchExpiry,
            MRP: parseFloat(data?.priceMaster.mrp),
          };

          const existingIndex = mainClDetails.findIndex(
            (item) => item.Barcode == data.Barcode
          );
          if (existingIndex !== -1) {
            const item = mainClDetails[existingIndex];
            const newQty = item.returnQty + 1;
            if (newQty > item.Quantity) {
              toast.error("Stock quantity cannot exceed available quantity!");
              return;
            }
            setMainClDetails((prev) =>
              prev.map((it, idx) =>
                idx === existingIndex
                  ? { ...it, returnQty: it.returnQty + 1 }
                  : it
              )
            );
          } else {
            setMainClDetails((prev) => [...prev, cc]);
          }
          handleRefresh();
        } else if (data.CLBatchCode === 1 && referenceApplicable === 1) {
          const response = await getCLBatches({
            detailId: data.CLDetailId,
            locationId: parseInt(hasMultipleLocations[0]),
          }).unwrap();
          setDetailAccId(data.CLDetailId);
          setDetailId(true);
          setOpenBatch(true);
        } else if (data.CLBatchCode === 0 && referenceApplicable === 1) {
          try {
            await getInvoiceDetails({
              productType: 3,
              detailId: data.CLDetailId,
              batchCode: null,
              patientId: customerSalesId.patientId,
              locationId: customerSalesId.locationId,
            }).unwrap();
            setDetailAccId(data.CLDetailId);
            setOpenReferenceYes(true);
          } catch (error) {
            toast.error("No eligible Invoice exists for the given product");
          }
        }
      } else {
        setSearchFetched(false);
        setDetailId(false);
        setOpenBatch(false);
      }
    } catch (error) {
      console.error("error", error);
      setSearchFetched(false);
      setDetailId(false);
      setOpenBatch(false);
    }
  };

  const handleGetBatchBarCodeDetails = async () => {
    if (!batchCodeInput) {
      return;
    }
    try {
      const batches = CLBatches?.data;
      const isAvailable = batches?.find(
        (b) => b.CLBatchBarCode.toLowerCase() === batchCodeInput.toLowerCase()
      );

      if (isAvailable && referenceApplicable === 0) {
        // if (isAvailable.Quantity <= 0) {
        //   toast.error("Stock quantity not available for this batchbarcode!");
        //   return;
        // }
        const newItemCl = {
          ...newItem.powerData,
          sbatchbarCode: isAvailable.CLBatchBarCode,
          ExpiryDate: isAvailable.CLBatchExpiry,
          selectBatch,
          returnPrice: parseFloat(isAvailable.SellingPrice),
          returnQty: 1,
          Quantity: isAvailable.Quantity,
          ...(detailId ? batchBarCodeDetails?.data?.data : {}),
        };
        let existingIndex;
        if (productSearch === 0 && selectBatch === 0) {
          existingIndex = mainClDetails.findIndex(
            (item) => item.Barcode == newItemCl.Barcode
          );
        } else {
          existingIndex = mainClDetails.findIndex(
            (item) =>
              item.Barcode == newItemCl.Barcode &&
              item.sbatchbarCode == newItemCl.sbatchbarCode
          );
        }
        if (existingIndex !== -1) {
          const item = mainClDetails[existingIndex];
          const newQty = item.returnQty + 1;
          // if (newQty > item.Quantity) {
          //   toast.error("Stock quantity cannot exceed available quantity!");
          //   return;
          // }
          setMainClDetails((prev) =>
            prev.map((it, idx) =>
              idx === existingIndex
                ? { ...it, returnQty: it.returnQty + 1 }
                : it
            )
          );
        } else {
          setMainClDetails((prev) => [...prev, newItemCl]);
        }
        setLensData({
          orderReference: null,
          brandId: null,
          modalityId: null,
          productId: null,
          color: null,
        });
        setSearchFetched(false);
        setNewItem({
          CLDetailId: null,
          sphericalPower: null,
          cylindricalPower: null,
          axis: null,
          additional: null,
          avlQty: null,
          orderQty: null,
          sellingPrice: null,
          powerData: null,
        });
        setSelectedBatchCode("");
        setDetailId(false);
        setProductCodeInput("");
        setbatchCodeInput("");
      } else if (isAvailable && referenceApplicable === 1) {
        try {
          await getInvoiceDetails({
            productType: 3,
            detailId:
              selectBatch === 1
                ? batchBarCodeDetails?.data.data.CLDetailId
                : newItem.CLDetailId,
            batchCode: isAvailable.CLBatchBarCode,
            patientId: customerSalesId.patientId,
            locationId: customerSalesId.locationId,
          }).unwrap();
          const id =
            selectBatch === 1
              ? batchBarCodeDetails?.data.data.CLDetailId
              : newItem.CLDetailId;
          setDetailAccId(id);
          setOpenReferenceYes(true);
          setbatchCodeInput("");
        } catch (error) {
          console.log(error);
          toast.error(
            error?.data.error ||
              "No eligible Invoice exists for the given product"
          );
        }
      } else {
        toast.error("Entered BatchBarcode is not exists!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleGetProductCodeDetails = async () => {
    if (!productCodeInput) {
      return;
    }
    try {
      const response = await getBatchBarCodeDetails({
        batchCode: productCodeInput,
        locationId: parseInt(hasMultipleLocations[0]),
      }).unwrap();

      if (response?.data.data.CLBatchCode === 0 && referenceApplicable === 0) {
        // if (response?.data.data.stock.Quantity <= 0) {
        //   toast.error("Stock quantity not available for this barcode!");
        //   return;
        // }
        const cc = {
          ...response?.data.data,
          returnPrice:
            response?.data.data.CLBatchCode === 0
              ? parseFloat(response?.data.data.price.SellingPrice)
              : parseFloat(response?.data.data.stock.SellingPrice),
          returnQty: 1,
          Quantity: response?.data.data.stock.Quantity,
          MRP:
            response?.data.data.CLBatchCode === 0
              ? parseFloat(response?.data.data.price.MRP)
              : parseFloat(response?.data.data.stock.MRP),
        };
        const existingIndex = mainClDetails.findIndex(
          (item) => item.Barcode == response?.data.data.Barcode
        );
        if (existingIndex !== -1) {
          const item = mainClDetails[existingIndex];
          const newQty = item.returnQty + 1;
          // if (newQty > item.Quantity) {
          //   toast.error("Stock quantity cannot exceed available quantity!");
          //   return;
          // }
          setMainClDetails((prev) =>
            prev.map((it, idx) =>
              idx === existingIndex
                ? { ...it, returnQty: it.returnQty + 1 }
                : it
            )
          );
        } else {
          setMainClDetails((prev) => [...prev, cc]);
        }
        setProductCodeInput("");
      } else if (
        response?.data.data.CLBatchCode === 1 &&
        referenceApplicable === 0
      ) {
        const batchCodeData = await getCLBatches({
          detailId: response?.data.data.CLDetailId,
          locationId: parseInt(hasMultipleLocations[0]),
        }).unwrap();
        if (batchCodeData) {
          setDetailId(true);
        }
      } else if (
        referenceApplicable === 1 &&
        response?.data.data.CLBatchCode === 0
      ) {
        await getInvoiceDetails({
          productType: 3,
          detailId: response?.data.data.CLDetailId,
          batchCode: null,
          patientId: customerSalesId.patientId,
          locationId: customerSalesId.locationId,
        }).unwrap();
        setDetailAccId(response?.data.data.CLDetailId);
        setOpenReferenceYes(true);
      } else if (
        referenceApplicable === 1 &&
        response?.data.data.CLBatchCode === 1
      ) {
        const batchCodeData = await getCLBatches({
          detailId: response?.data.data.CLDetailId,
          locationId: parseInt(hasMultipleLocations[0]),
        }).unwrap();
        if (batchCodeData) {
          setDetailId(true);
        }
      }
    } catch (error) {
      console.log(error);
      toast.error(
        error?.data.error || "No eligible Invoice exists for the given product"
      );
    }
  };

  const handleSaveBatchData = async () => {
    // if (selectedBatchCode.Quantity <= 0) {
    //   toast.error("Stock quantity must be greater than 0!");
    //   return;
    // }
    if (referenceApplicable === 0) {
      let sub;
      if ((!detailId || openBatch) && productSearch == 0) {
        sub = {
          ...newItem.powerData,
          sbatchCode: selectedBatchCode.CLBatchCode,
          sMRP: selectedBatchCode.CLMRP,
          MRP: selectedBatchCode.CLMRP,
          Quantity: selectedBatchCode.Quantity,
          ExpiryDate: selectedBatchCode.CLBatchExpiry,
          returnPrice: parseFloat(selectedBatchCode.SellingPrice),
          returnQty: 1,
        };
      } else if (detailId && productSearch == 1) {
        sub = {
          ...batchBarCodeDetails?.data.data,
          sbatchCode: selectedBatchCode.CLBatchCode,
          sMRP: selectedBatchCode.CLMRP,
          MRP: selectedBatchCode.CLMRP,
          ExpiryDate: selectedBatchCode.CLBatchExpiry,
          Quantity: selectedBatchCode.Quantity,
          returnPrice: parseFloat(selectedBatchCode.SellingPrice),
          returnQty: 1,
        };
      }

      // const existingIndex = mainClDetails.findIndex(
      //   (item) =>
      //     item.Barcode == sub.Barcode || item.CLBatchCode == sub.CLBatchCode
      // );
      const existingIndex = mainClDetails.findIndex(
        (item) =>
          item.Barcode == sub.Barcode && item.sbatchCode == sub.sbatchCode
      );
      if (existingIndex !== -1) {
        const item = mainClDetails[existingIndex];
        const newQty = item.returnQty + 1;
        // if (newQty > item.Quantity) {
        //   toast.error("Stock quantity cannot exceed available quantity!");
        //   return;
        // }
        setMainClDetails((prev) =>
          prev.map((it, idx) =>
            idx === existingIndex ? { ...it, returnQty: it.returnQty + 1 } : it
          )
        );
      } else {
        setMainClDetails((prev) => [...prev, sub]);
      }

      handleRefresh();
    } else if (referenceApplicable === 1) {
      try {
        await getInvoiceDetails({
          productType: 3,
          detailId:
            productSearch === 1
              ? batchBarCodeDetails?.data.data.CLDetailId
              : newItem.CLDetailId,
          batchCode: selectedBatchCode.CLBatchCode || null,
          patientId: customerSalesId.patientId,
          locationId: customerSalesId.locationId,
        }).unwrap();
        const id =
          productSearch === 1
            ? batchBarCodeDetails?.data.data.CLDetailId
            : newItem.CLDetailId;
        setDetailAccId(id);
        setOpenReferenceYes(true);
      } catch (error) {
        toast.error("No eligible Invoice exists for the given product");
      }
    }
  };
  const handleAddData = () => {
    if (!selectedInvoiceReturnQty || isNaN(selectedInvoiceReturnQty)) {
      toast.error("Please enter a valid Return Qty");
      return;
    }

    if (
      selectedInvoice?.InvoiceQty - parseInt(selectedInvoice?.ReturnQty) <
      selectedInvoiceReturnQty
    ) {
      toast.error("Sales Return Quantity cannot exceed Pending Quantity!");
      return;
    }

    // Check if item already exists in items array
    const itemExists = mainClDetails.some(
      (item) => item.Id === selectedInvoice?.Id
    );

    if (itemExists) {
      toast.error("This invoice item has already been added!");
      return;
    }

    const newItemCL = {
      ...newItem,
      AccId: detaildAccId,
      ...selectedInvoice,
      ReturnQty: selectedInvoiceReturnQty,
      sbatchCode: selectedInvoice?.ProductDetails[0]?.stock[0]?.batchCode ?? "",
      ExpiryDate:
        (selectedInvoice?.ProductDetails[0]?.stock[0]?.CLBatchExpiry ||
          selectedInvoice?.ProductDetails[0]?.stock[0]?.cLBatchExpiry) ??
        "",
      returnPrice: selectedInvoice.ActualSellingPrice,
      GSTPercentage: parseFloat(
        selectedInvoice.ProductDetails[0].taxPercentage
      ),
      TotalAmount:
        parseFloat(selectedInvoice.ActualSellingPrice) *
        selectedInvoiceReturnQty,
    };

    setMainClDetails((prev) => [...prev, newItemCL]);
    setDetailAccId(null);
    setOpenReferenceYes(false);
    setIsInvoiceSelected(false);
    setSelectedInvoiceReturnQty(0);
    setSelectedInvoice(null);
    setbatchCodeInput("");
    setLensData({
      orderReference: null,
      brandId: null,
      modalityId: null,
      productId: null,
      color: null,
    });
    setSearchFetched(false);
    setNewItem({
      CLDetailId: null,
      sphericalPower: null,
      cylindricalPower: null,
      axis: null,
      additional: null,
      avlQty: null,
      orderQty: null,
      sellingPrice: null,
      powerData: null,
    });
    setSelectedBatchCode(null);
    setDetailId(false);
    setProductCodeInput("");
    handleRefresh();
  };
  const handleSaveData = async () => {
    if (!Array.isArray(mainClDetails) || mainClDetails.length === 0) {
      console.warn("No details to save");
      return;
    }
    try {
      for (const detail of mainClDetails) {
        const payload = {
          SRMasterID: salesDraftData.Id ?? null,
          ProductType: detail.ProductType ?? 3,
          ContactLensDetailId: detail.CLDetailId ?? detail.AccId ?? null,
          AccessoryDetailId: detail.AccessoryDetailId ?? null,
          FrameDetailId: detail.FrameDetailId ?? null,
          OpticalLensDetailId: detail.OpticalLensDetailId ?? null,
          BatchCode: (detail.sbatchCode || detail.sbatchbarCode) ?? null,
          CNQty:
            referenceApplicable === 0
              ? detail.returnQty
              : detail.ReturnQty ?? null,
          SRP:
            referenceApplicable === 0
              ? parseFloat(detail.MRP)
              : parseFloat(detail.SRP) ?? null,
          ReturnPrice:
            referenceApplicable === 0
              ? detail.returnPrice
              : parseFloat(detail.returnPrice) ?? null,
          ProductTaxPercentage:
            referenceApplicable === 0
              ? Array.isArray(detail.TaxDetails)
                ? findGSTPercentage(detail).taxPercentage
                : findGSTPercentage({
                    ...detail,
                    TaxDetails: [{ ...detail.TaxDetails }],
                  }).taxPercentage ?? null
              : parseFloat(detail.ProductDetails[0].taxPercentage) ?? null,
          FittingReturnPrice: detail.FittingReturnPrice ?? null,
          FittingTaxPercentage: detail.FittingTaxPercentage ?? null,
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

  const handleDelete = (index) => {
    const item = mainClDetails[index];
    setMainClDetails((prev) => prev.filter((_, i) => i !== index));
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      delete newEditMode[`${item.Barcode}-${index}`];
      return newEditMode;
    });
  };

  const handleDeleteYes = (index) => {
    const item = mainClDetails[index];
    setMainClDetails((prev) => prev.filter((item, i) => i !== index));
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      delete newEditMode[`${item.Barcode}-${index}`];
      return newEditMode;
    });
  };

  const inputTableColumns = [
    "Spherical Power",
    "Cylindrical Power",
    "Axis",
    "Additional Power",
    "",
  ];

  if (newItem.CLDetailId && !searchFethed && referenceApplicable === 0) {
    inputTableColumns.push("Avl.Qty", "Order Qty", "Action");
  }

  return (
    <div className="max-w-8xl h-auto">
      <div className="bg-white rounded-xl shadow-sm p-2">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div>
                <div className="flex items-center gap-4 mb-4"></div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Step {currentSalesStep}: {selectedSalesProduct.label}
                </h1>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => prevSalesStep()}
                icon={FiArrowLeft}
                variant="outline"
              >
                Back
              </Button>
              <Button onClick={handleRefresh}>Refresh</Button>
            </div>
          </div>
        </div>
        {referenceApplicable === 0 && (
          <div>
            {mainClDetails.length > 0 && (
              <Table
                expand={true}
                columns={[
                  "S.No",
                  "Invoice no",
                  "product type",
                  "product details",
                  "srp",
                  "return price",
                  "gst amt",
                  "return qty",
                  "total amount",
                  "action",
                ]}
                data={mainClDetails}
                renderRow={(item, index) => (
                  <TableRow>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell></TableCell>
                    <TableCell>CL</TableCell>
                    <TableCell className="whitespace-pre-line">
                      {getProductName(item)}
                    </TableCell>
                    <TableCell>₹{item.MRP}</TableCell>
                    <TableCell>
                      {editMode[`${item.Barcode}-${index}`]?.SellingPrice ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={item.returnPrice || ""}
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
                                "SellingPrice",
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
                                "SellingPrice",
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
                          ₹{formatINR(item.returnPrice)}
                          <button
                            onClick={() =>
                              toggleEditMode(
                                item.Barcode,
                                index,
                                "SellingPrice"
                              )
                            }
                            className="text-neutral-400 transition"
                            title="Edit Price"
                          >
                            <FiEdit2 size={14} />
                          </button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {Array.isArray(item.TaxDetails)
                        ? findGSTPercentage(item).gstAmount
                        : calculateGST(
                            parseFloat(item.returnPrice),
                            parseFloat(item.TaxDetails?.SalesTaxPerct || 0)
                          ).gstAmount}
                    </TableCell>
                    <TableCell>
                      {editMode[`${item.Barcode}-${index}`]?.qty ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={item.returnQty}
                            onChange={(e) =>
                              handleQtyChange(
                                item.Barcode,
                                e.target.value,
                                index
                              )
                            }
                            className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            min="1"
                          />
                          <button
                            onClick={() =>
                              toggleEditMode(item.Barcode, index, "qty", "save")
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
                                "qty",
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
                          {item.returnQty}
                          <button
                            onClick={() =>
                              toggleEditMode(item.Barcode, index, "qty")
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
                      ₹
                      {(
                        parseFloat(item.returnPrice) *
                        parseFloat(item.returnQty)
                      ).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <FiTrash2
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                        onClick={() => handleDelete(index)}
                      />
                    </TableCell>
                  </TableRow>
                )}
              />
            )}
            {mainClDetails.length > 0 && (
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
          </div>
        )}
        {referenceApplicable === 1 && mainClDetails.length > 0 && (
          <div className="p-6">
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
                "Return Qty",
                "Total Amount",
                "Action",
              ]}
              data={mainClDetails}
              renderRow={(item, index) => (
                <TableRow
                  key={
                    item.InvoiceDetailId ||
                    `${item.InvoiceMain?.InvoiceNo}/${item.InvoiceSlNo}/${index}`
                  }
                >
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell>
                    {item["InvoiceMain.InvoicePrefix"]}/
                    {item["InvoiceMain.InvoiceNo"]}/{item.InvoiceSlNo}
                  </TableCell>
                  <TableCell className="text-center">CL</TableCell>
                  <TableCell className="whitespace-pre-line">
                    {getProductNameYes(item)}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{formatINR(parseFloat(item.SRP || 0))}
                  </TableCell>
                  <TableCell>
                      {editMode[`${item.Barcode}-${index}`]?.SellingPrice ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={item.returnPrice || ""}
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
                                "SellingPrice",
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
                                "SellingPrice",
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
                          ₹{formatINR(item.returnPrice)}
                          <button
                            onClick={() =>
                              toggleEditMode(
                                item.Barcode,
                                index,
                                "SellingPrice"
                              )
                            }
                            className="text-neutral-400 transition"
                            title="Edit Price"
                          >
                            <FiEdit2 size={14} />
                          </button>
                        </div>
                      )}
                    </TableCell>
                  <TableCell className="text-right">
                    ₹
                    {formatINR(
                      calculateGST(
                        parseFloat(item.returnPrice || 0),
                        parseFloat(item.GSTPercentage || 0)
                      ).gstAmount
                    )}
                    (
                    {
                      calculateGST(
                        parseFloat(item.returnPrice || 0),
                        parseFloat(item.GSTPercentage || 0)
                      ).taxPercentage
                    }
                    %)
                  </TableCell>
                  <TableCell className="text-center">
                    {item.ReturnQty || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{formatINR(parseFloat(item.TotalAmount || 0))}
                  </TableCell>
                  <TableCell>
                    <Button
                      className="px-3 py-1"
                      onClick={() => handleDeleteYes(index)}
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
        {referenceApplicable === 1 && (
          <div>
            <Modal
              width="max-w-4xl"
              isOpen={openReferenceYes}
              onClose={() => {
                setOpenReferenceYes(false);
                setIsInvoiceSelected(false);
              }}
            >
              <h1 className="text-neutral-700 text-2xl mb-3">Invoice List</h1>
              {!isInvoiceSelected && (
                <Table
                  columns={[
                    "S.No",
                    "INVOICE No",
                    "invoice value",
                    "invoice qty",
                    "sale return qty",
                    "pending return qty",
                    "Action",
                  ]}
                  data={InvoiceDetails?.data}
                  renderRow={(item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {item["InvoiceMain.InvoicePrefix"]}/
                        {item["InvoiceMain.InvoiceNo"]}/{item.InvoiceSlNo}
                      </TableCell>
                      <TableCell>
                        ₹
                        {formatINR(
                          parseFloat(item.ActualSellingPrice) * item.InvoiceQty
                        )}
                      </TableCell>
                      <TableCell>{item.InvoiceQty}</TableCell>

                      <TableCell>{item.ReturnQty}</TableCell>
                      <TableCell>
                        {item.InvoiceQty - parseInt(item.ReturnQty)}
                      </TableCell>
                      <TableCell>
                        <button
                          className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          onClick={() => {
                            setSelectedInvoice(item);
                            setIsInvoiceSelected(true);
                            setSelectedInvoiceReturnQty(
                              item.InvoiceQty - parseInt(item.ReturnQty)
                            );
                          }}
                        >
                          Select
                        </button>
                      </TableCell>
                    </TableRow>
                  )}
                />
              )}
              {isInvoiceSelected && (
                <div className="flex gap-2 ">
                  <Input
                    value={
                      selectedInvoice?.InvoiceQty -
                      parseInt(selectedInvoice?.ReturnQty)
                    }
                    grayOut={true}
                    label="Pending Qty"
                  />
                  <Input
                    value={selectedInvoiceReturnQty}
                    label="Sales Return Qty"
                    onChange={(e) =>
                      setSelectedInvoiceReturnQty(e.target.value)
                    }
                  />
                </div>
              )}

              {isInvoiceSelected && (
                <div className="w-full mt-5">
                  <Button onClick={handleAddData}>Save</Button>
                </div>
              )}
            </Modal>
          </div>
        )}
        <div className="p-6">
          <div className="flex items-center gap-4">
            <Radio
              name="productSearch"
              label="Enter Product Barcode"
              value="1"
              onChange={() => {
                setProductSearch(1);
              }}
              checked={productSearch === 1}
            />
            <Radio
              name="productSearch"
              label="Search Product"
              onChange={() => {
                setProductSearch(0);
              }}
              value="0"
              checked={productSearch === 0}
            />
          </div>
        </div>

        {productSearch === 0 && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Brand
                </label>
                <Autocomplete
                  options={filteredBrands || []}
                  getOptionLabel={(option) => option.BrandName || ""}
                  value={
                    allBrands?.find((brand) => brand.Id === lensData.brandId) ||
                    null
                  }
                  onChange={(_, newValue) => {
                    setLensData((prev) => ({
                      ...prev,
                      brandId: newValue?.Id || null,
                      modalityId: null,
                      productId: null,
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search or select brand"
                      size="small"
                    />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  disabled={lensData.modalityId}
                />
              </div>

              {lensData.brandId && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Modality
                  </label>
                  <Autocomplete
                    options={modalities?.data || []}
                    getOptionLabel={(option) => option.ModalityName || ""}
                    value={
                      modalities?.data.find(
                        (modality) => modality.Id === lensData.modalityId
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      setLensData((prev) => ({
                        ...prev,
                        modalityId: newValue?.Id || null,
                        productId: null,
                      }));
                    }}
                    loading={modalitiesLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search or select modality"
                        size="small"
                      />
                    )}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    disabled={lensData.productId}
                  />
                </div>
              )}

              {lensData.modalityId && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Name
                  </label>
                  <Autocomplete
                    options={productNames?.data?.data || []}
                    getOptionLabel={(option) => option.ProductName || ""}
                    value={
                      productNames?.data.data.find(
                        (product) => product.Id === lensData.productId
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      setLensData((prev) => ({
                        ...prev,
                        productId: newValue?.Id || null,
                      }));
                    }}
                    loading={isProductsLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search or select product"
                        size="small"
                      />
                    )}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                  />
                </div>
              )}
              {lensData.productId && colorData?.data?.data.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Colour
                  </label>
                  <Autocomplete
                    options={colorData?.data?.data || []}
                    getOptionLabel={(option) => option.Colour || ""}
                    value={
                      colorData?.data.data.find(
                        (product) => product.Colour === lensData.color
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      setLensData((prev) => ({
                        ...prev,
                        color: newValue?.Colour || null,
                      }));
                    }}
                    loading={colorDataLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search or select color"
                        size="small"
                      />
                    )}
                    isOptionEqualToValue={(option, value) =>
                      option.Color === value.Color
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {lensData.productId && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Power Details</h2>
              <div className="flex gap-4">
                <Button
                  onClick={handleRefeshPowerTable}
                  icon={FiRefreshCw}
                  variant="outline"
                />
              </div>
            </div>

            {showInputRow && (
              <Table
                columns={inputTableColumns}
                data={[{}]}
                renderRow={() => (
                  <TableRow key=" Power Details">
                    <TableCell>
                      <Input
                        name="sphericalPower"
                        value={newItem.sphericalPower}
                        onChange={handleInputChange}
                        error={errors.sphericalPower}
                        grayOut={searchFethed}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        name="cylindricalPower"
                        value={newItem.cylindricalPower}
                        onChange={handleInputChange}
                        error={errors.cylindricalPower}
                        grayOut={searchFethed}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        name="axis"
                        value={newItem.axis}
                        onChange={handleInputChange}
                        error={errors.axis}
                        grayOut={searchFethed}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        name="additional"
                        value={newItem.additional}
                        onChange={handleInputChange}
                        error={errors.additional}
                        grayOut={searchFethed}
                      />
                    </TableCell>

                    {!newItem.CLDetailId && (
                      <TableCell className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSearch}
                          disabled={isPowerDetailsLoading}
                          variant="outline"
                        >
                          {isPowerDetailsLoading ? "Searching..." : "Search"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )}
              />
            )}
          </div>
        )}

        {productSearch === 1 && (
          <div className="p-6">
            <div className=" flex items-center gap-4">
              <Input
                value={productCodeInput}
                onChange={(e) => setProductCodeInput(e.target.value)}
                label="Enter Product Barcode"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleGetProductCodeDetails();
                  }
                }}
                className="w-1/3"
              />
              <Button
                onClick={handleGetProductCodeDetails}
                isLoading={isbatchBarLoading}
                disabled={isbatchBarLoading}
              >
                Search
              </Button>
            </div>
          </div>
        )}

        {detailId && (
          <div className="p-6">
            <div className="flex items-center gap-4">
              <Radio
                name="selectBatch"
                label="Select Batch Code"
                onChange={() => setSelectBatch(0)}
                value="0"
                checked={selectBatch === 0}
              />
              <Radio
                name="selectBatch"
                label="Scan Batch BarCode"
                value="1"
                onChange={() => {
                  setSelectBatch(1);
                  setSelectedBatchCode(null);
                }}
                checked={selectBatch === 1}
              />
            </div>

            {CLBatches && selectBatch === 0 && (
              <div className=" mt-5 flex items-center gap-4">
                <div className="space-y-2 w-1/3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select by BatchCode
                  </label>
                  <Autocomplete
                    options={CLBatches?.data || []}
                    getOptionLabel={(option) => option.CLBatchCode || ""}
                    value={
                      CLBatches?.data.find(
                        (batch) =>
                          batch.CLBatchCode === selectedBatchCode?.CLBatchCode
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      setSelectedBatchCode(newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search or select BatchCode"
                        size="small"
                      />
                    )}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                  />
                </div>
                {selectedBatchCode && (
                  <Button
                    className="w-[150px] mt-8"
                    onClick={handleSaveBatchData}
                  >
                    {referenceApplicable === 1 ? "Search Invoice" : "Save"}
                  </Button>
                )}
              </div>
            )}
            {selectBatch === 1 && (
              <div className="w-1/2 mt-5 flex items-center gap-4">
                <Input
                  value={batchCodeInput}
                  onChange={(e) => setbatchCodeInput(e.target.value)}
                  label="Enter BatchBarCode"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleGetBatchBarCodeDetails();
                    }
                  }}
                />
                <Button onClick={handleGetBatchBarCodeDetails}>Search</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactLens;
