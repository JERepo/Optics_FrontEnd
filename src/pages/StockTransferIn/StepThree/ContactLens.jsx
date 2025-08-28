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
import { useGetBatchBarCodeMutation } from "../../../api/salesReturnApi";
import { formatINR } from "../../../utils/formatINR";
import Modal from "../../../components/ui/Modal";
import {
  useGetStockOutDetailsQuery,
  useSaveStockDetailsMutation,
} from "../../../api/stockTransfer";

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
    CLBatchBarCode,
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
    const batchIsOne = clean(CLBatchCode);
    const batchIsZero = clean(batchCode || BatchCode);
    const batchBar = clean(CLBatchBarCode);

    let specsObj = {};
    if (typeof specs === "string") {
      specs.split(",").forEach((pair) => {
        let [key, value] = pair.split(":").map((s) => s.trim());
        if (value === "null") value = null;
        specsObj[key] = value;
      });
    } else {
      specsObj = {
        Sph: SphericalPower,
        Cyld: CylindricalPower,
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
      (batchIsOne || batchIsZero || batchBar) &&
        `Batch Code: ${batchBar || batchIsOne || batchIsZero || "-"}`,
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
    customerStockTransferIn,
    currentStockTransferInStep,
    stockTransferInDraftData,
    goToStockTransferInStep,
    prevStockTransferInStep,
    selectedStockTransferInProduct,
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
  const { data: stockOutData } = useGetStockOutDetailsQuery({
    mainId: customerStockTransferIn.mainId,
    locationId: parseInt(hasMultipleLocations[0]),
  });

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

  const [saveStockTransfer, { isLoading: isStockTransferLoading }] =
    useSaveStockDetailsMutation();

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
    setDetailId(false);
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
      locationId: customerStockTransferIn.locationId,
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
          const STOProduct = stockOutData?.data.details.find(
            (item) => item.ContactLensDetailId === data.CLDetailId
          );
          if (!STOProduct) {
            toast.error(
              "Product is not present in the selected Stock Transfer"
            );
            return;
          }
          if (STOProduct.STQtyOut === STOProduct.STQtyIn) {
            toast.error("No Pending Qty left for the given product");
            return;
          }

          const cc = {
            ...data,
            ...STOProduct,
            tiq: 1,
          };
          setMainClDetails((prev) => [...prev, cc]);
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
            originalQty: item.tiq, // Store original quantity
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
              idx === index ? { ...i, tiq: prev[key].originalQty } : i
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
    // const avlQty = Number(mainClDetails[index].Quantity);
    // Find existing in our items (local scanned state)
    const existing = mainClDetails[index];

    // Determine current STQtyIn (from state if exists, else from backend)
    const currentSTQtyIn = existing?.tiq;
    if (newQty > currentSTQtyIn) {
      toast.error("TransferIn qty cannot exceed transferOut qty!");
      return;
    }
    if (newQty < 0) {
      toast.error("TransferIn qty must be greater than 0!");
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
        // if (parseInt(batchBarCodeDetails?.data?.data.AvlQty) <= 0) {
        //   toast.error("Stock quantity must be greater than 0!");
        //   return;
        // }
        const STOProduct = stockOutData?.data.details.find(
          (item) =>
            item.ContactLensDetailId ===
            batchBarCodeDetails?.data?.data.CLDetailId
        );
        if (!STOProduct) {
          toast.error("Product is not present in the selected Stock Transfer");
          return;
        }
        if (STOProduct.STQtyOut === STOProduct.STQtyIn) {
          toast.error("No Pending Qty left for the given product");
          return;
        }

        const newItemCl = {
          ...isAvailable,
          ...newItem.powerData,
          ...STOProduct,
          selectBatch,

          ...(detailId ? batchBarCodeDetails?.data?.data : {}),
        };

        setMainClDetails((prev) => [...prev, newItemCl]);
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
        // if (response?.data.data.Quantity <= 0) {
        //   toast.error("Stock quantity must be greater than 0!");
        //   return;
        // }
        const STOProduct = stockOutData?.data.details.find(
          (item) => item.ContactLensDetailId === response?.data.data.CLDetailId
        );
        if (!STOProduct) {
          toast.error("Product is not present in the selected Stock Transfer");
          return;
        }
        if (STOProduct.STQtyOut === STOProduct.STQtyIn) {
          toast.error("No Pending Qty left for the given product");
          return;
        }
        const cc = {
          ...response?.data.data,
          ...STOProduct,
          tiq: 1,
        };
        setMainClDetails((prev) => [...prev, cc]);
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
      const STOProduct = stockOutData?.data.details.find(
        (item) => item.ContactLensDetailId === newItem.CLDetailId
      );
      console.log("new Ire", newItem, STOProduct);
      if (!STOProduct) {
        toast.error("Product is not present in the selected Stock Transfer");
        return;
      }
      if (STOProduct.STQtyOut === STOProduct.STQtyIn) {
        toast.error("No Pending Qty left for the given product");
        return;
      }
      sub = {
        ...newItem.powerData,
        ...selectedBatchCode,
        ...STOProduct,
        tiq: 1,
      };
    } else if (detailId && productSearch == 1) {
      const STOProduct = stockOutData?.data.details.find(
        (item) =>
          item.ContactLensDetailId === batchBarCodeDetails?.data.data.CLDetailId
      );
      if (!STOProduct) {
        toast.error("Product is not present in the selected Stock Transfer");
        return;
      }
      if (STOProduct.STQtyOut === STOProduct.STQtyIn) {
        toast.error("No Pending Qty left for the given product");
        return;
      }
      sub = {
        ...batchBarCodeDetails?.data.data,
        ...selectedBatchCode,
        ...STOProduct,
        tiq: 1,
      };
    }

    setMainClDetails((prev) => [...prev, sub]);
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

    try {
      const payload = {
        STInMainId: stockTransferInDraftData.ID,
        STOutMainId: parseInt(customerStockTransferIn.mainId),
        products: mainClDetails.map((item) => {
          return {
            ProductType: 3,
            detailId: item.CLDetailId,
            BatchCode: item.CLBatchCode || item.CLBatchBarCode,
            STQtyIn: item.tiq,
            STQtyOut: item.STQtyOut,
            transferPrice: parseFloat(item.BuyingPrice),
            gstPercentage: calculateStockGST(item).gstPercent,
            srp: parseFloat(item.MRP),
          };
        }),
      };
      console.log(payload);
      await saveStockTransfer({ payload }).unwrap();
      toast.success("Contact Lens stock transferin successfully added");
      goToStockTransferInStep(4);
    } catch (error) {
      toast.error(error?.data.error.message);
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

  // if (newItem.CLDetailId && !searchFethed) {
  //   inputTableColumns.push("Avl.Qty", "Order Qty", "Action");
  // }
  console.log(mainClDetails);
  return (
    <div className="max-w-8xl h-auto">
      <div className="bg-white rounded-xl shadow-sm p-2">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div>
                <div className="flex items-center gap-4 mb-4"></div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Step {currentStockTransferInStep}:{" "}
                  {selectedStockTransferInProduct.label}
                </h1>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => prevStockTransferInStep()}
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
                  "type",
                  "product name",
                  "transfer price",
                  "transfer out qty",
                  "transfer in qty",
                  "gst",
                  "total amount",
                  "action",
                ]}
                data={mainClDetails || []}
                renderRow={(item, index) => (
                  <TableRow key={`${item.Barcode}-${index}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>CL</TableCell>
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
                    <TableCell>{item.STQtyOut}</TableCell>
                    <TableCell>
                      {editMode[`${item.Barcode}-${index}`]?.qty ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={item.tiq}
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
                  isLoading={isStockTransferLoading}
                  disabled={isStockTransferLoading}
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
