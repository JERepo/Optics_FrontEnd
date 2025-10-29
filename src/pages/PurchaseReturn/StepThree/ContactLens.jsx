import React, { useState, useEffect, useRef } from "react";
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
import { useGetBatchBarCodeMutation } from "../../../api/salesReturnApi";
import { formatINR } from "../../../utils/formatINR";
import Modal from "../../../components/ui/Modal";
import { useSaveStockDetailsMutation } from "../../../api/stockTransfer";
import {
  useSavePurchaseReturnProductMutation,
  useBulkUploadContactLensMutation,
} from "../../../api/purchaseReturn";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, FileText, Upload } from "lucide-react";
import {
  useLazyDownloadAccessorySampleExcelQuery,
  useLazyDownloadFrameSampleExcelQuery,
} from "../../../api/purchaseOrderApi";
import { useLazyDownloadCLSampleExcelQuery } from "../../../api/grnApi";

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
    Spherical,
    Cylindrical,
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
    const expiry = clean(ExpiryDate);
    // const batchIsOne = clean(CLBatchCode);
    const batchIsZero = clean(sbatchCode);
    const batchBar = clean(sbatchbarCode);

    let specsObj = {};
    if (typeof specs === "string") {
      specs.split(",").forEach((pair) => {
        let [key, value] = pair.split(":").map((s) => s.trim());
        if (value === "null") value = null;
        specsObj[key] = value;
      });
    } else {
      // specsObj = {
      //   Sph: SphericalPower,
      //   Cyld: CylindricalPower,
      //   Axis: Axis,
      //   Add: Additional,
      // };
      specsObj = {
        Sph: SphericalPower || Spherical,
        Cyld: CylindricalPower || Cylindrical,
        Axis: Axis,
        Add: Additional,
      };
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
      name && brand && `${brand} ${name}`,
      specsList,
      clr && `Color: ${clr}`,
      barcodeVal && `Barcode: ${barcodeVal}`,
      (batchIsZero || batchBar) &&
        `Batch Code: ${batchBar || batchIsZero || "-"}`,
      expiry && `Expiry : ${expiry.split("-").reverse().join("/")}`,
      hsn && `HSN: ${hsn}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return "";
};

const ContactLens = () => {
  const {
    selectedPurchaseProduct,
    prevPurchaseStep,
    goToPurchaseStep,
    customerPurchase,
    purchaseDraftData,
    currentPurchaseStep,
  } = useOrder();
  const { hasMultipleLocations, user } = useSelector((state) => state.auth);
  const [searchFethed, setSearchFetched] = useState(false);

  const [mainClDetails, setMainClDetails] = useState([]);
  const [showInputRow, setShowInputRow] = useState(true);
  const [productSearch, setProductSearch] = useState(1);
  const [selectBatch, setSelectBatch] = useState(0);
  const [selectedBatchCode, setSelectedBatchCode] = useState(null);
  const [editMode, setEditMode] = useState({});

  const [batchCodeInput, setbatchCodeInput] = useState("");
  const [productCodeInput, setProductCodeInput] = useState("");
  const [detailId, setDetailId] = useState(false);
  const [openBatch, setOpenBatch] = useState(false);
  const fileInputRef = useRef(null);

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
  const [selectedFile, setSelectedFile] = useState(null);

  const [downloadFrameSample] = useLazyDownloadFrameSampleExcelQuery();
  const [downloadAccessorySample] = useLazyDownloadAccessorySampleExcelQuery();
  const [downloadCLSample] = useLazyDownloadCLSampleExcelQuery();
  const [uploadContactLensFile] = useBulkUploadContactLensMutation();

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

  const [getCLBatches, { data: CLBatches }] = useLazyGetBatchDetailsQuery();
  const [getPowerDetails, { isLoading: isPowerDetailsLoading }] =
    useGetPowerDetailsMutation();

  const [
    getBatchBarCodeDetails,
    { data: batchBarCodeDetails, isLoading: isbatchBarLoading },
  ] = useGetBatchBarCodeMutation();

  // const [getCLBatches, { data: CLBatches }] = useLazyGetBatchesForCLQuery();

  const [savePR, { isLoading: isPurchaseReturnLoading }] =
    useSavePurchaseReturnProductMutation();

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      mainClDetails.forEach((item, index) => {
        const key = `${item.Barcode}-${index}`;
        if (!newEditMode[key]) {
          newEditMode[key] = {
            BuyingPrice: false,
            qty: false,
            originalPrice: item.BuyingPrice,
            originalQty: item.stkQty,
          };
        }
      });
      return newEditMode;
    });
  }, [mainClDetails]);
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
      locationId: customerPurchase.locationId,
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
        if (data.CLBatchCode === 1) {
          try {
            await getCLBatches({
              clBatchId: data.CLDetailId,
              locationId: parseInt(hasMultipleLocations[0]),
            }).unwrap();
            setDetailId(true);
            setOpenBatch(true);
          } catch (error) {
            toast.error(error?.data.error);
            return;
          }
        } else if (data.CLBatchCode === 0) {
          if (data.stock[0]?.quantity <= 0) {
            toast.error("Stock quantity must be greater than 0!");
            return;
          }
          const cc = {
            ...data,
            // stkQty: 1,
            // Quantity: parseInt(data.AvlQty),
            Quantity: data.stock[0]?.quantity,
            BuyingPrice: parseFloat(data?.priceMaster.buyingPrice),
            stkQty: 1,
            sbatchCode: data.stock[0]?.batchCode,
            ExpiryDate: data.stock[0]?.CLBatchExpiry,
            MRP: parseFloat(data?.priceMaster.mrp),
          };
          const existingIndex = mainClDetails.findIndex(
            (item) => item.Barcode == data.Barcode
          );
          if (existingIndex !== -1) {
            const item = mainClDetails[existingIndex];
            const newQty = item.stkQty + 1;
            if (newQty > item.Quantity) {
              toast.error("Stock quantity cannot exceed available quantity!");
              return;
            }
            setMainClDetails((prev) =>
              prev.map((it, idx) =>
                idx === existingIndex ? { ...it, stkQty: it.stkQty + 1 } : it
              )
            );
          } else {
            setMainClDetails((prev) => [...prev, cc]);
          }
          handleRefresh();
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
      toast.error(error.data.error.message || "Product not found.");
    }
  };

  const toggleEditMode = (id, index, field, action = "toggle") => {
    setEditMode((prev) => {
      const key = `${id}-${index}`;
      const currentMode = prev[key]?.[field];
      const item = mainClDetails.find((i, idx) => idx === index);

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
            originalQty: item.stkQty, // Store original quantity
          },
        };
      }

      if (currentMode && action === "cancel") {
        if (field === "BuyingPrice") {
          setMainClDetails((prevItems) =>
            prevItems.map((i, idx) =>
              idx === index ? { ...i, BuyingPrice: prev[key].originalPrice } : i
            )
          );
        } else if (field === "qty") {
          setMainClDetails((prevItems) =>
            prevItems.map((i, idx) =>
              idx === index ? { ...i, stkQty: prev[key].originalQty } : i
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
  const handleQtyChange = (barcode, qty, index) => {
    const newQty = Number(qty);
    const avlQty = Number(mainClDetails[index].Quantity);
    if (newQty > avlQty) {
      toast.error("Stock quantity cannot exceed available quantity!");
      return;
    }
    if (newQty < 0) {
      toast.error("Stock quantity must be greater than 0!");
      return;
    }
    setMainClDetails((prev) =>
      prev.map((i, idx) => (idx === index ? { ...i, stkQty: newQty } : i))
    );
  };
  const handleGetBatchBarCodeDetails = async () => {
    if (!batchCodeInput) {
      return;
    }
    try {
      const batches = CLBatches?.data.batches;
      const isAvailable = batches?.find(
        (b) => b.CLBatchBarCode.toLowerCase() === batchCodeInput.toLowerCase()
      );

      if (isAvailable) {
        if (parseInt(isAvailable.Quantity) <= 0) {
          toast.error("Stock quantity must be greater than 0!");
          return;
        }
        const newItemCl = {
          ...newItem.powerData,
          sbatchbarCode: isAvailable.CLBatchBarCode,
          sMRP: isAvailable.CLMRP,

          selectBatch,
          stkQty: 1,
          // BuyingPrice:
          //   batchBarCodeDetails?.data.data.CLBatchCode === 0
          //     ? parseFloat(batchBarCodeDetails?.data.data.price.BuyingPrice)
          //     : parseFloat(batchBarCodeDetails?.data.data.stock.BuyingPrice),
          // Quantity:
          //   parseInt(newItem?.powerData?.AvlQty) ||
          //   parseInt(batchBarCodeDetails?.data?.data.Quantity),
          ExpiryDate: isAvailable.ExpiryDate,
          MRP: parseFloat(isAvailable.CLMRP),
          BuyingPrice: parseFloat(isAvailable.BuyingPrice),
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
          const newQty = item.stkQty + 1;
          if (newQty > item.Quantity) {
            toast.error("Stock quantity cannot exceed available quantity!");
            return;
          }
          setMainClDetails((prev) =>
            prev.map((it, idx) =>
              idx === existingIndex ? { ...it, stkQty: it.stkQty + 1 } : it
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
      } else {
        toast.error("Selected batchbarcode doesn't exist");
        return;
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

      if (response?.data.data.CLBatchCode === 0) {
        if (response?.data.data.stock.Quantity <= 0) {
          toast.error("Stock quantity must be greater than 0!");
          return;
        }
        const cc = {
          ...response?.data.data,
          // stkQty: 1,
          // Quantity: response?.data.data.Quantity,
          // MRP:
          //   response?.data.data.CLBatchCode === 0
          //     ? parseFloat(response?.data.data.price.MRP)
          //     : parseFloat(response?.data.data.stock.MRP),
          // BuyingPrice:
          //   response?.data.data.CLBatchCode === 0
          //     ? parseFloat(response?.data.data.price.BuyingPrice)
          //     : parseFloat(response?.data.data.stock.BuyingPrice),
          stkQty: 1,
          Quantity: response?.data.data.stock.Quantity,
          MRP:
            response?.data.data.CLBatchCode === 0
              ? parseFloat(response?.data.data.price.MRP)
              : parseFloat(response?.data.data.stock.MRP),
          BuyingPrice:
            response?.data.data.CLBatchCode === 0
              ? parseFloat(response?.data.data.price.BuyingPrice)
              : parseFloat(response?.data.data.stock.BuyingPrice),
          sbatchCode: response?.data.data.stock.BatchCode,
          ExpiryDate: response?.data.data.stock.Expiry,
        };
        const existingIndex = mainClDetails.findIndex(
          (item) => item.Barcode == response?.data.data.Barcode
        );
        if (existingIndex !== -1) {
          const item = mainClDetails[existingIndex];
          const newQty = item.stkQty + 1;
          if (newQty > item.Quantity) {
            toast.error("Stock quantity cannot exceed available quantity!");
            return;
          }
          setMainClDetails((prev) =>
            prev.map((it, idx) =>
              idx === existingIndex ? { ...it, stkQty: it.stkQty + 1 } : it
            )
          );
        } else {
          setMainClDetails((prev) => [...prev, cc]);
        }
        setProductCodeInput("");
      } else if (response?.data.data.CLBatchCode === 1) {
        const batchCodeData = await getCLBatches({
          clBatchId: response?.data.data.CLDetailId,
          locationId: parseInt(hasMultipleLocations[0]),
        }).unwrap();
        if (batchCodeData) {
          setDetailId(true);
        }
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.data.error);
    }
  };
  const handleSaveBatchData = async () => {
    let sub;
    if ((!detailId || openBatch) && productSearch == 0) {
      if (parseInt(selectedBatchCode.Quantity) <= 0) {
        toast.error("Stock quantity must be greater than 0!");
        return;
      }
      sub = {
        ...newItem.powerData,
        sbatchCode: selectedBatchCode.CLBatchCode,
        sMRP: selectedBatchCode.CLMRP,
        ExpiryDate: selectedBatchCode.ExpiryDate,
        stkQty: 1,
        Quantity: selectedBatchCode.Quantity,
        MRP: parseFloat(selectedBatchCode.CLMRP),
        BuyingPrice: parseFloat(selectedBatchCode.BuyingPrice),
      };
    } else if (detailId && productSearch == 1) {
      sub = {
        ...batchBarCodeDetails?.data.data,
        sbatchCode: selectedBatchCode.CLBatchCode,
        sMRP: selectedBatchCode.CLMRP,
        ExpiryDate: selectedBatchCode.ExpiryDate,
        stkQty: 1,
        Quantity: selectedBatchCode.Quantity,
        BuyingPrice: parseFloat(selectedBatchCode.BuyingPrice),
        MRP: parseFloat(selectedBatchCode.CLMRP),
      };
    }
    const existingIndex = mainClDetails.findIndex(
      (item) => item.Barcode == sub.Barcode && item.sbatchCode == sub.sbatchCode
    );
    if (existingIndex !== -1) {
      const item = mainClDetails[existingIndex];
      const newQty = item.stkQty + 1;
      if (newQty > item.Quantity) {
        toast.error("Stock quantity cannot exceed available quantity!");
        return;
      }
      setMainClDetails((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex ? { ...it, stkQty: it.stkQty + 1 } : it
        )
      );
    } else {
      setMainClDetails((prev) => [...prev, sub]);
    }
    handleRefresh();
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
        idx === index ? { ...i, BuyingPrice: newPrice } : i
      )
    );
  };
  const calculateStockGST = (item) => {
    if (!item) return { gstAmount: 0, slabNo: null, gstPercent: 0 };

    const tax = item.TaxDetails;
    if (!Array.isArray(tax) || tax.length === 0) {
      return { gstAmount: 0, slabNo: null, gstPercent: 0 };
    }

    const transferPrice = parseFloat(item.BuyingPrice) || 0;

    // case: single tax slab
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

    // case: multiple slabs
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

    // fallback: last slab
    const lastDetail = tax[tax.length - 1];
    const fallbackTaxPercent = parseFloat(lastDetail?.PurTaxPerct) || 0;
    const gstAmount = transferPrice * (fallbackTaxPercent / 100);
    return {
      gstAmount,
      slabNo: lastDetail?.TaxDetailId ?? tax.length,
      gstPercent: fallbackTaxPercent,
    };
  };

  const handleSaveData = async () => {
    if (!Array.isArray(mainClDetails) || mainClDetails.length === 0) {
      console.warn("No details to save");
      return;
    }
    console.log("items", mainClDetails);
    try {
      const payload = {
        products: mainClDetails.map((item) => {
          return {
            PRMainId: purchaseDraftData.Id,
            ProductType: 3,
            FrameDetailId: item.Id ?? null,
            AccessoryDetailId: null,
            ContactLensDetailId: item.CLDetailId ?? null,
            OpticalLensDetailId: null,
            BatchCode: item.sbatchCode || item.sbatchbarCode,
            DNQty: item.stkQty,
            DNPrice: parseFloat(item.BuyingPrice),
            ProductTaxPercentage: calculateStockGST(item).gstPercent,
            ApplicationUserId: user.Id,
          };
        }),
      };
      console.log(payload);
      await savePR({ payload }).unwrap();
      toast.success("Contact lens Purchase return successfully added!");
      goToPurchaseStep(4);
    } catch (error) {
      toast.error(error?.data.error);
    }
  };

  const handleDelete = (id, index) => {
    setMainClDetails((prev) => prev.filter((i, idx) => idx !== index));

    setEditMode((prev) => {
      const newEditMode = { ...prev };
      delete newEditMode[`${id}-${index}`];
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

  if (newItem.CLDetailId && !searchFethed) {
    inputTableColumns.push("Avl.Qty", "Order Qty", "Action");
  }

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadSampleExcel = async (selectedOption) => {
    try {
      if (selectedOption === "Frame/Sunglass") {
        const blob = await downloadFrameSample().unwrap();
        downloadFile(blob, "SampleFrameBulkUpload.xlsx");
      } else if (selectedOption === "Accessories") {
        const blob = await downloadAccessorySample().unwrap();
        downloadFile(blob, "SampleAccessoryBulkUpload.xlsx");
      } else if (selectedOption === "Contact Lens") {
        const blob = await downloadCLSample().unwrap();
        downloadFile(blob, "SampleCLBulkUpload.xlsx");
      }
      toast.success("Sample excel downloaded successfully.");
    } catch (error) {
      console.error("Failed to download sample excel:", error);
      toast.error(
        error.data?.message ||
          error.message ||
          "Failed to download sample excel"
      );
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    toast.success("File selected successfully");
  };

  const handleUpload = async (selectedOption) => {
    if (!selectedFile) {
      toast.error("Please select a file!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("excelFile", selectedFile);
      let res;

      if (selectedOption === "Contact Lens") {
        res = await uploadContactLensFile({
          formData: formData,
          applicationUserId: user?.Id,
          prMainId: purchaseDraftData.Id || purchaseDraftData[0].Id,
        }).unwrap();
      }

      console.log("response", res);

      if (res.status === "success") {
        // Generic success
        toast.success(
          res?.data?.message || res?.message || "File uploaded successfully!"
        );
        goToPurchaseStep(4);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error?.data?.error || error?.data?.message || "Upload failed"
      );
    }
  };

  return (
    <div className="max-w-8xl h-auto">
      <div className="bg-white rounded-xl shadow-sm p-2">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div>
                <div className="flex items-center gap-4 mb-4"></div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Step {currentPurchaseStep}: {selectedPurchaseProduct.label}
                </h1>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => prevPurchaseStep()}
                icon={FiArrowLeft}
                variant="outline"
              >
                Back
              </Button>
              <Button onClick={handleRefresh}>Refresh</Button>
            </div>
          </div>
        </div>

        <div>
          {mainClDetails.length > 0 && (
            <div className="p-6">
              <Table
                columns={[
                  "s.no",
                  "Product type",
                  "supplier order no",
                  "product details",
                  "srp",
                  "return qty",
                  "return product price",
                  "gst/unit",
                  "total price",
                  "action",
                ]}
                data={mainClDetails || []}
                renderRow={(item, index) => (
                  <TableRow key={`${item.Barcode}-${index}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>CL</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="whitespace-pre-wrap">
                      {getProductName(item)}
                    </TableCell>
                    <TableCell>₹{item.MRP}</TableCell>
                    <TableCell>
                      {editMode[`${item.Barcode}-${index}`]?.qty ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={item.stkQty}
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
                          {item.stkQty}
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
                    <TableCell>
                      ₹{formatINR(calculateStockGST(item).gstAmount)}(
                      {calculateStockGST(item).gstPercent}%)
                    </TableCell>
                    <TableCell>
                      ₹
                      {formatINR(
                        parseFloat(item.BuyingPrice) * item.stkQty +
                          calculateStockGST(item).gstAmount * item.stkQty
                      )}
                      {/* ({calculateStockGST(item).gstPercent}%) */}
                    </TableCell>

                    {/* <TableCell>{item.Quantity}</TableCell> */}

                    <TableCell>
                      <button
                        onClick={() => handleDelete(item.Barcode, index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 />
                      </button>
                    </TableCell>
                  </TableRow>
                )}
              />
              <div className="flex justify-end mt-6">
                <Button
                  type="submit"
                  isLoading={isPurchaseReturnLoading}
                  disabled={isPurchaseReturnLoading}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700"
                  onClick={handleSaveData}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4">
            <Radio
              name="productSearch"
              label="Enter Product Barcode"
              value="1"
              onChange={() => {
                handleRefresh();
                setProductSearch(1);
              }}
              checked={productSearch === 1}
            />
            <Radio
              name="productSearch"
              label="Search Product"
              value="0"
              onChange={() => {
                handleRefresh();
                setProductSearch(0);
              }}
              checked={productSearch === 0}
            />
            <Radio
              name="productSearch"
              value="2"
              onChange={() => setProductSearch(2)}
              checked={productSearch === 2}
              label="Bulk Process"
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

        {productSearch === 2 && (
          <div>
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full"
            >
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                {/* Top info banner */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-4 border-b border-gray-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-800">Tip:</span>{" "}
                    Download the sample file to see the correct format for your
                    bulk upload
                  </p>
                </div>

                {/* Content Section */}
                <div className="p-8">
                  {/* Single Row Layout */}
                  <div className="flex flex-col justify-between sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Download Sample Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        handleDownloadSampleExcel(selectedPurchaseProduct.label)
                      }
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center flex-1 sm:flex-none"
                    >
                      <>
                        <FileText className="w-4 h-4" />
                        <span className="text-white">Download Sample</span>
                      </>
                    </motion.button>

                    {/* File Upload Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      id="file-upload"
                    />
                    <motion.label
                      htmlFor="file-upload"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer flex items-center justify-center gap-2 font-semibold text-gray-700 whitespace-nowrap"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Select File</span>
                    </motion.label>

                    <div className="flex gap-4">
                      {/* Upload Button */}
                      <motion.button
                        // whileHover={{ scale: 1.02 }}
                        // whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          handleUpload(selectedPurchaseProduct.label)
                        }
                        // disabled={!selectedFile || isFrameFileUploading || isAccessoryFileUploading || isContactLensFileUploading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center flex-1 sm:flex-none"
                      >
                        {/* {(isFrameFileUploading || isAccessoryFileUploading || isContactLensFileUploading) ? (
                                            <>
                                              <RefreshCcw className="w-4 h-4 animate-spin" />
                                              <span className="text-white">Uploading...</span>
                                            </>
                                          ) : ( */}
                        <>
                          <Upload className="w-4 h-4" />
                          <span className="text-white">Upload</span>
                        </>
                        {/* )} */}
                      </motion.button>
                      {/* Clear Button */}
                      {selectedFile && (
                        <motion.button
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          onClick={handleClearFile}
                          className="px-4 py-2 rounded-lg border-2 border-red-300 text-red-600 hover:bg-red-50 transition-colors font-semibold whitespace-nowrap"
                        >
                          Clear
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Selected file display below */}
                  {selectedFile && (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
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

            {CLBatches?.data.batches && selectBatch === 0 && (
              <div className=" mt-5 flex items-center gap-4">
                <div className="space-y-2 w-1/3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select by BatchCode
                  </label>
                  <Autocomplete
                    options={CLBatches?.data.batches || []}
                    getOptionLabel={(option) => option.CLBatchCode || ""}
                    value={
                      CLBatches?.data.batches?.find(
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
                    Save
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
