import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Check,
    AlertCircle,
    Search,
    RefreshCw,
    XCircle,
    IndianRupee,
    FileText,
    Upload,
    CheckCircle
} from "lucide-react";
import { useGetContactLensDetailsMutation, useGetContactLensStockMutation, useLazyDownloadSampleExcelQuery, useUpdateContactLensStockDetailsMutation, useUploadBulkFileMutation } from "../../api/clBatchDetailsApi";
import { useGetAllLocationsQuery } from "../../api/roleManagementApi";
import PricingTable from "../admin/Master/PricingTable";
import { useSaveContactLensDetailsMutation } from "../../api/clBatchDetailsApi";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useLazyGetBatchesForCLQuery } from "../../api/salesReturnApi";
import { Autocomplete, Button, Input, TextField } from "@mui/material";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useGetModalitiesQuery, useGetPowerDetailsMutation, useGetProductNamesByModalityQuery } from "../../api/orderApi";
import { POCLpowerSearchTable } from "../PurchaseOrder/POSearchTable";

export default function ClBatchDetails() {
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: "", message: "" });
    const [selectedOption, setSelectedOption] = useState(null);
    const [selectedSearchOption, setSelectedSearchOption] = useState(null);
    const [barcodeInput, setBarcodeInput] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [productDetails, setProductDetails] = useState(null);
    const [productStockDetails, setProductStockDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [clBatchInputType, setClBatchInputType] = useState("select");
    const [batchCodeInput, setbatchCodeInput] = useState("");
    const [selectedBatchCode, setSelectedBatchCode] = useState(null);
    const [oldCLBatchCode, setOldCLBatchCode] = useState("");
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [brandInput, setBrandInput] = useState("");
    const [filteredBrands, setFilteredBrands] = useState([]);
    const [brandId, setBrandId] = useState(null);
    const [modalityId, setModalityId] = useState(null);
    const [modalityInput, setModalityInput] = useState("");
    const [productId, setProductId] = useState(null);
    const [productInput, setProductInput] = useState("");
    const [newItem, setNewItem] = useState({
        barcode: null,
        CLDetailId: null,
        OpticalLensDetailId: null,
        sphericalPower: null,
        cylindricalPower: null,
        diameter: null,
        axis: null,
        additional: null,
        avlQty: null,
        orderQty: null,
        quantity: null,
        buyingPrice: null,
    });
    const [errors, setErrors] = useState({});
    const [searchFethed, setSearchFetched] = useState(false);
    const [isBatchLoading, setIsBatchLoading] = useState(false);

    const [fetchDetails] = useGetContactLensDetailsMutation();
    const { data: allLocations } = useGetAllLocationsQuery();
    const [saveBatchDetails, { isLoading: isSaving }] = useSaveContactLensDetailsMutation();
    const [updateBatchDetails, { isLoading: isUpdating }] = useUpdateContactLensStockDetailsMutation();
    const { user, hasMultipleLocations } = useSelector((state) => state.auth);
    const [getCLBatches, { data: CLBatches }] = useLazyGetBatchesForCLQuery();
    const [getCLStock] = useGetContactLensStockMutation();
    const [downloadSampleExcel] = useLazyDownloadSampleExcelQuery();
    const [uploadFile, { isLoading: isFileUploading }] = useUploadBulkFileMutation();
    const { data: allBrands } = useGetAllBrandsQuery();
    const { data: modalities, isLoading: modalitiesLoading } = useGetModalitiesQuery();
    const { data: productData, isLoading: isProductsLoading } = useGetProductNamesByModalityQuery(
        { brandId: brandId, modalityId: modalityId },
        { skip: !brandId || !modalityId }
    );
    const [getPowerDetails, { isLoading: isPowerDetailsLoading }] = useGetPowerDetailsMutation();

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

    const [batchDetails, setBatchDetails] = useState({
        batchCode: "",
        expiryDate: "",
        batchBarcode: "",
        mrp: "",
    });

    const [pricing, setPricing] = useState([]);
    const [applyAll, setApplyAll] = useState({
        buyingPrice: "",
        sellingPrice: "",
    });

    const [formErrors, setFormErrors] = useState({});


    useEffect(() => {
        if (allBrands) {
            const contactLensBrands = allBrands?.filter(
                (b) =>
                    b.ContactLensActive === 1 &&
                    b.IsActive === 1 &&
                    b.BrandName.toLowerCase().includes(brandInput.toLowerCase())
            );
            setFilteredBrands(contactLensBrands);

        }
    }, [allBrands, brandInput]);


    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        toast.success("File selected successfully");
    };

    const handleSearch = async () => {
        setIsLoading(true);
        if (!barcodeInput.trim()) {
            toast.error("Please enter a valid barcode");
            return;
        }

        try {
            const response = await fetchDetails({
                barcode: barcodeInput,
                locationId: hasMultipleLocations || null,
            }).unwrap();

            if (response?.status === "success") {
                if (response?.data?.data?.CLBatchCode === 0) {
                    toast.error("Cannot add Contact Lens Product with CLBatchCode=0");
                    return;
                }
                toast.success("Product details fetched successfully");
                setProductDetails(response?.data?.data);
            } else {
                toast.error("No product found for the given barcode");
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setAlertMessage({
                type: "error",
                message: err.data?.error || err.message || "Failed to fetch product details",
            });
            setShowAlert(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSearch = async () => {
        setIsLoading(true);
        if (!barcodeInput.trim()) {
            toast.error("Please enter a valid barcode");
            return;
        }

        try {
            const response = await fetchDetails({
                barcode: barcodeInput,
                locationId: hasMultipleLocations || null,
            }).unwrap();

            if (response?.status === "success") {
                if (response?.data?.data?.CLBatchCode === 0) {
                    toast.error("Cannot add Contact Lens Product with CLBatchCode=0");
                    return;
                }

                setIsBatchLoading(true);
                await getCLBatches({
                    detailId: response?.data?.data?.CLDetailId,
                    locationId: hasMultipleLocations || null,
                }).unwrap();
                setIsBatchLoading(false); // Reset after fetch completes

                toast.success("Product details fetched successfully");
                setProductDetails(response?.data?.data);
            } else {
                toast.error("No product found for the given barcode");
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setAlertMessage({
                type: "error",
                message: err.data?.error || err.message || "Failed to fetch product details",
            });
            setShowAlert(true);
        } finally {
            setIsBatchLoading(false);
            setIsLoading(false);
        }
    };

    const handleBatchBarcodeSearch = async () => {
        if (!batchCodeInput.trim()) {
            toast.error("Please enter a batch barcode");
            return;
        }

        if (!CLBatches?.data?.length) {
            toast.error("Please search for a product first to load available batches");
            return;
        }

        // Find the matching batch
        const matchingBatch = CLBatches.data.find(
            (batch) => batch.CLBatchBarCode?.toLowerCase() === batchCodeInput.toLowerCase()
        );

        if (!matchingBatch) {
            toast.error("Invalid batch barcode - no matching batch found");
            return;
        }

        // Set selectedBatchCode for UI consistency
        setSelectedBatchCode(matchingBatch);

        // Pass the batch directly instead of relying on state
        toast.success("Batch selected, fetching stock details...");
        await handleSearchCLStock(matchingBatch);
    };

    const handlePowerSearchInputChange = (e) => {
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

    const handleRefresh = () => {
        setNewItem({
            barcode: null,
            CLDetailId: null,
            OpticalLensDetailId: null,
            sphericalPower: null,
            cylindricalPower: null,
            diameter: null,
            axis: null,
            additional: null,
            avlQty: null,
            orderQty: null,
            quantity: null,
            buyingPrice: null,
            Barcode: null,
            BrandName: null,
            SphericalPower: null,
            CylindricalPower: null,
            BuyingPrice: null,
            BuyingPriceMaster: null,
            MRPMaster: null,
            CLBatchCode: null,
            ProductName: null,
            HSN: null,
            TaxDetails: null,
            Id: null
        });
        setSearchFetched(false);
        setErrors({});
        // Don't reset productDetails here as it might be needed for batch selection
    };


    const handlePowerSearch = async () => {
        // Enhanced validation
        if (!newItem.sphericalPower || isNaN(parseFloat(newItem.sphericalPower))) {
            toast.error("Please enter valid Spherical Power before searching.");
            return;
        }

        // Validate numeric fields
        const spherical = parseFloat(newItem.sphericalPower);
        const cylindrical = newItem.cylindricalPower ? parseFloat(newItem.cylindricalPower) : null;
        const axis = newItem.axis ? parseInt(newItem.axis) : null;
        const additional = newItem.additional ? parseInt(newItem.additional) : null;

        if (isNaN(spherical)) {
            toast.error("Invalid Spherical Power value");
            return;
        }

        const payload = {
            CLMainId: productId,
            Spherical: spherical,
            Cylindrical: cylindrical,
            Axis: axis,
            Additional: additional,
            Colour: null,
            locationId: hasMultipleLocations || null, // Use location from auth state
        };

        try {
            const response = await getPowerDetails({ payload }).unwrap();

            if (!response?.data?.data) {
                toast.error("No matching power found");
                setSearchFetched(false);
                return;
            }

            const data = response.data.data;
            console.log("data handleSearch ------------ ", data);
            if (data.CLBatchCode === 0) {
                toast.error("Cannot add Contact Lens Product with CLBatchCode=0");
                return;
            }
            toast.success(response?.data.message || "Power details found");

            // Update newItem with response data
            const updatedItem = {
                ...newItem,
                Barcode: data.Barcode,
                BrandName: data?.BrandName,
                CLDetailId: data?.CLDetailId,
                SphericalPower: data.SphericalPower ?? data.Spherical,
                CylindricalPower: data.CylindricalPower ?? data.Cylindrical,
                Axis: data.Axis,
                Additional: data.Additional,
                avlQty: parseInt(data.AvlQty) || 0,
                orderQty: data.DefaultOrderQty || 1,
                quantity: 1,
                BuyingPrice: data?.BuyingPrice || 0,
                BuyingPriceMaster: data?.priceMaster?.buyingPrice || null,
                MRPMaster: data?.priceMaster?.mrp || null,
                CLBatchCode: data.CLBatchCode,
                ProductName: data?.ProductName,
                HSN: data?.HSN,
                TaxDetails: data?.TaxDetails,
                // Generate unique ID for tracking
                Id: `cl-${data.CLDetailId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            };

            setNewItem(updatedItem);
            setSearchFetched(true);

            // Handle batch code logic
            if (data?.CLBatchCode === 1) {
                // Fetch batches for this detail
                await getCLBatches({
                    detailId: data?.CLDetailId,
                    locationId: hasMultipleLocations || null,
                }).unwrap();
                toast.success("Please select or scan batch code");

                // Set product details for batch selection
                setProductDetails({
                    ...productDetails,
                    CLDetailId: data.CLDetailId,
                    ProductName: data.ProductName,
                    BrandName: data.BrandName,
                    SphericalPower: updatedItem.SphericalPower,
                    CylindricalPower: updatedItem.CylindricalPower,
                    Axis: updatedItem.Axis,
                    Additional: updatedItem.Additional,
                    MRP: data?.priceMaster?.mrp || data.MRP
                });
            } else {
                toast.success("Power details loaded successfully");
            }

        } catch (error) {
            console.error("Search error:", error);
            toast.error(error?.data?.message || error.message || "Failed to search power details");
            setSearchFetched(false);
        }
    };

    const handleReset = () => {
        setBarcodeInput('');
        setProductDetails(null);
        setProductStockDetails(null);
        setBatchDetails({
            batchCode: "",
            expiryDate: "",
            batchBarcode: "",
            mrp: "",
        });
        setPricing([]);
        setSelectedBatchCode(null);
        setbatchCodeInput("");
        setOldCLBatchCode(""); // Reset oldCLBatchCode
        // setSelectedSearchOption(null);
        setSearchInput("");
        // setSelectedSearchOption(null);
        setFormErrors({});
        setProductDetails(null);
        setProductStockDetails(null);
        setSelectedBatchCode(null);
        setOldCLBatchCode("");
        setbatchCodeInput("");
        setNewItem({
            barcode: null,
            CLDetailId: null,
            OpticalLensDetailId: null,
            sphericalPower: null,
            cylindricalPower: null,
            diameter: null,
            axis: null,
            additional: null,
            avlQty: null,
            orderQty: null,
            quantity: null,
            buyingPrice: null,
            Barcode: null,
            BrandName: null,
            SphericalPower: null,
            CylindricalPower: null,
            BuyingPrice: null,
            BuyingPriceMaster: null,
            MRPMaster: null,
            CLBatchCode: null,
            ProductName: null,
            HSN: null,
            TaxDetails: null,
            Id: null
        });
        setSearchFetched(false);
        setBarcodeInput('');
        setBatchDetails({
            batchCode: "",
            expiryDate: "",
            batchBarcode: "",
            mrp: "",
        });
        setPricing([]);
        setBrandId(null);
        setBrandInput("");
        setModalityId(null);
        setModalityInput("");
        setProductId(null);
        setProductInput("");
    };

    const handleSearchCLStock = async (batchData) => {
        setIsLoading(true);

        // Use the passed parameter or fall back to state
        const batch = batchData || selectedBatchCode;

        console.log("SelectedbatchCode", batch?.CLBatchCode);

        if (!batch?.CLBatchCode?.trim()) {
            toast.error("Please enter a valid batch code");
            setIsLoading(false);
            return;
        }

        try {
            const response = await getCLStock({
                BatchCode: batch.CLBatchCode,
                BatchBarcode: "",
            }).unwrap();

            if (response?.status === "success") {
                toast.success("Product stock details fetched successfully");
                setProductStockDetails(response?.data?.data);
                setBatchDetails({
                    batchCode: response?.data?.data?.CLBatchCode || "",
                    expiryDate: response?.data?.data?.CLBatchExpiry?.split('T')[0] || "",
                    batchBarcode: response?.data?.data?.CLBatchBarCode || "",
                    mrp: response?.data?.data?.CLMRP || "",
                });
                console.log("loc", response?.data?.data?.locations);
                setPricing(response?.data?.data?.locations || []);
                setOldCLBatchCode(response?.data?.data?.CLBatchCode || "");
            } else {
                toast.error("No product found for the given batch code");
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setAlertMessage({
                type: "error",
                message: err.data?.error || err.message || "Failed to fetch product stock details",
            });
            setShowAlert(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (allLocations?.data?.length && pricing.length === 0 && !productStockDetails) {
            const initialPricing = allLocations.data.map((loc) => ({
                id: loc.Id,
                location: loc.LocationName,
                buyingPrice: "",
                sellingPrice: "",
                avgPrice: "",
                quantity: 0,
                defectiveQty: 0,
            }));
            setPricing(initialPricing);
        }
        if (productDetails && !productStockDetails) {
            setBatchDetails(prev => ({
                ...prev,
                mrp: productDetails.MRP || ""
            }));
        }
    }, [allLocations, pricing.length, productDetails, productStockDetails]);

    const handleBatchDetailChange = (field, value) => {
        setBatchDetails(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    // const handlePriceChange = (idx, field, value) => {
    //     const updated = [...pricing];
    //     updated[idx][field] = value;
    //     // Recalculate avgPrice if buyingPrice or sellingPrice changes
    //     if (field === 'buyingPrice' || field === 'sellingPrice') {
    //         const buying = parseFloat(updated[idx].buyingPrice) || 0;
    //         const selling = parseFloat(updated[idx].sellingPrice) || 0;
    //         updated[idx].avgPrice = ((buying + selling) / 2).toFixed(2);
    //     }
    //     setPricing(updated);
    //     if (formErrors.pricing) {
    //         setFormErrors(prev => ({ ...prev, pricing: "" }));
    //     }
    // };
    const handlePriceChange = (idx, field, value) => {
        const updated = [...pricing];
        updated[idx] = { ...updated[idx], [field]: value }; // Line 235: Error here
        // Recalculate avgPrice if buyingPrice or sellingPrice changes
        if (field === 'buyingPrice' || field === 'sellingPrice') {
            const buying = parseFloat(updated[idx].buyingPrice) || 0;
            const selling = parseFloat(updated[idx].sellingPrice) || 0;
            updated[idx].avgPrice = ((buying + selling) / 2).toFixed(2);
        }
        console.log("Pricing after update:", updated);
        setPricing(updated);
        if (formErrors.pricing || formErrors[`${field}_${idx}`]) {
            setFormErrors(prev => ({
                ...prev,
                pricing: "",
                [`${field}_${idx}`]: ""
            }));
        }
    };

    const validateBatchDetails = () => {
        const errors = {};

        if (!batchDetails.batchCode.trim()) {
            errors.batchCode = "Batch Code is required";
        }

        if (!batchDetails.expiryDate) {
            errors.expiryDate = "Expiry Date is required";
        }

        const mrp = parseFloat(batchDetails.mrp);
        if (isNaN(mrp) || mrp <= 0) {
            errors.mrp = "MRP must be a valid number greater than 0";
        }

        let pricingErrors = false;
        pricing.forEach((p, idx) => {
            const buying = parseFloat(p.buyingPrice);
            const selling = parseFloat(p.sellingPrice);

            if (isNaN(buying) || buying <= 0) {
                pricingErrors = true;
            }

            if (isNaN(selling) || selling <= 0) {
                pricingErrors = true;
            }

            if (selling <= buying) {
                pricingErrors = true;
                errors[`sellingPrice_${idx}`] = `Selling price must be greater than buying price at ${p.location}`;
            }
        });

        if (pricingErrors) {
            errors.pricing = "Valid buying and selling prices are required for all locations";
        }

        return errors;
    };

    const handleDownloadSampleExcel = async () => {
        try {
            const blob = await downloadSampleExcel().unwrap();
            downloadFile(blob, "SampleCLDetailsBulkUpload.xlsx");
            toast.success("Sample excel downloaded successfully.");
        } catch (error) {
            console.error('Failed to download sample excel:', error);
            toast.error(error.data?.message || error.message || "Failed to download sample excel");
        }
    }

    const formatDateToDDMMYYYY = (date) => {
        if (!date) return null;

        const d = new Date(date);
        if (isNaN(d.getTime())) return null; // Invalid date

        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = d.getFullYear();

        return `${day}-${month}-${year}`;
    };

    const handleSubmit = async () => {
        const errors = validateBatchDetails();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            const locationPrices = {
                location: pricing.map(loc => loc.id),
            };

            pricing.forEach((loc, index) => {
                const idx = index + 1;
                const buyingPrice = parseFloat(loc.buyingPrice) || 0;
                const sellingPrice = parseFloat(loc.sellingPrice) || 0;
                // const avgPrice = parseFloat(loc.avgPrice) || (buyingPrice + sellingPrice) / 2;
                const avgPrice = parseFloat(loc.buyingPrice) || 0;
                const quantity = loc.quantity || 0;
                const defectiveQty = loc.defectiveQty || 0;

                locationPrices[`BuyingPrice${idx}`] = buyingPrice;
                locationPrices[`SellingPrice${idx}`] = sellingPrice;
                locationPrices[`AvgPrice${idx}`] = avgPrice;
                locationPrices[`Quantity${idx}`] = quantity;
                locationPrices[`DefectiveQty${idx}`] = defectiveQty;
            });

            const requestData = {
                clBatchCode: batchDetails.batchCode,
                clBatchBarcode: batchDetails.batchBarcode || null,
                clBatchExpiry: batchDetails.expiryDate ? formatDateToDDMMYYYY(batchDetails.expiryDate) : null,
                clMrp: parseFloat(batchDetails.mrp),
                clDetailsId: productDetails?.CLDetailId,
                oldCLBatchCode: selectedOption === "edit" ? oldCLBatchCode : undefined,
                locationPrices: locationPrices
            };

            console.log("Submitting:", requestData);
            console.log("userId:", user?.Id);

            let response;
            if (selectedOption === "edit") {
                response = await updateBatchDetails({ batchData: requestData, applicationUserId: user?.Id, companyId: hasMultipleLocations }).unwrap();
            } else {
                response = await saveBatchDetails({ batchData: requestData, applicationUserId: user?.Id, companyId: hasMultipleLocations }).unwrap();
            }

            setAlertMessage({ type: "success", message: selectedOption === "edit" ? "Batch details updated successfully" : "Batch details saved successfully" });
            setShowAlert(true);

            // Reset the entire page
            setBatchDetails({
                batchCode: "",
                expiryDate: "",
                batchBarcode: "",
                mrp: "",
            });
            setPricing([]);
            setApplyAll({
                buyingPrice: "",
                sellingPrice: "",
            });
            setBarcodeInput("");
            setSearchInput("");
            setSelectedOption(null);
            setSelectedSearchOption(null);
            setFormErrors({});
            setProductDetails(null);
            setProductStockDetails(null);
            setSelectedBatchCode(null);
            setOldCLBatchCode("");
            setbatchCodeInput("");
            setTimeout(() => setShowAlert(false), 3000);
        } catch (err) {
            console.error('Failed to save/update batch:', err);
            toast.error(err.data?.message || err.message || "Failed to save/update batch details");
        }
    };


    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Please select a file!");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("excelFile", selectedFile);

            const res = await uploadFile({
                formData: formData,
                applicationUserId: user?.Id,
                companyId: hasMultipleLocations
            }).unwrap();

            console.log("response", res);

            // Check if there are any failed rows
            if (res?.data?.failedRows > 0 && res?.data?.failedDetails?.length > 0) {
                // Show error details
                const errorMessage = (
                    <div className="max-h-60 overflow-y-auto">
                        <p className="font-semibold mb-2">
                            Upload completed with {res.data.failedRows} error(s) out of {res.data.totalProcessed} rows
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            {res.data.failedDetails.map((detail, idx) => (
                                <li key={idx}>
                                    <span className="font-medium">Row {detail.row}</span>
                                    {detail.batchCode && ` (${detail.batchCode})`}:
                                    <span className="text-red-600 ml-1">
                                        {detail.errors.join(", ")}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                );

                toast.error(errorMessage, {
                    duration: 8000,
                    style: {
                        maxWidth: '500px',
                    }
                });
            } else if (res?.data?.successCount > 0) {
                // All successful
                toast.success(
                    `${res.data.message || "File uploaded successfully!"}\n` +
                    `Successfully processed ${res.data.successCount} out of ${res.data.totalProcessed} rows.`,
                    { duration: 5000 }
                );
            } else {
                // Generic success
                toast.success(res?.data?.message || res?.message || "File uploaded successfully!");
            }

            // Clear file only if there are no errors or if user wants to upload a new file
            if (res?.data?.failedRows === 0) {
                handleClearFile();
            }

        } catch (error) {
            console.error("Upload error:", error);
            toast.error(error?.data?.error || error?.error || "Upload failed");
        }
    };

    const handleClearFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };


    const handleSelectOptionChange = (option) => {
        setSelectedOption(option);
        setSearchInput("");
        setSelectedSearchOption(null);
        setFormErrors({});
        setProductDetails(null);
        setProductStockDetails(null);
        setSelectedBatchCode(null);
        setOldCLBatchCode("");
        setbatchCodeInput("");
        setNewItem({
            barcode: null,
            CLDetailId: null,
            OpticalLensDetailId: null,
            sphericalPower: null,
            cylindricalPower: null,
            diameter: null,
            axis: null,
            additional: null,
            avlQty: null,
            orderQty: null,
            quantity: null,
            buyingPrice: null,
            Barcode: null,
            BrandName: null,
            SphericalPower: null,
            CylindricalPower: null,
            BuyingPrice: null,
            BuyingPriceMaster: null,
            MRPMaster: null,
            CLBatchCode: null,
            ProductName: null,
            HSN: null,
            TaxDetails: null,
            Id: null
        });
        setSearchFetched(false);
        setBarcodeInput('');
        setBatchDetails({
            batchCode: "",
            expiryDate: "",
            batchBarcode: "",
            mrp: "",
        });
        setPricing([]);
        setBrandId(null);
        setBrandInput("");
        setModalityId(null);
        setModalityInput("");
        setProductId(null);
        setProductInput("");
    }

    const handleSelectedSearchOption = (option) => {
        setSelectedSearchOption(option);
        setSearchInput("");
        // setSelectedSearchOption(null);
        setFormErrors({});
        setProductDetails(null);
        setProductStockDetails(null);
        setSelectedBatchCode(null);
        setOldCLBatchCode("");
        setbatchCodeInput("");
        setNewItem({
            barcode: null,
            CLDetailId: null,
            OpticalLensDetailId: null,
            sphericalPower: null,
            cylindricalPower: null,
            diameter: null,
            axis: null,
            additional: null,
            avlQty: null,
            orderQty: null,
            quantity: null,
            buyingPrice: null,
            Barcode: null,
            BrandName: null,
            SphericalPower: null,
            CylindricalPower: null,
            BuyingPrice: null,
            BuyingPriceMaster: null,
            MRPMaster: null,
            CLBatchCode: null,
            ProductName: null,
            HSN: null,
            TaxDetails: null,
            Id: null
        });
        setSearchFetched(false);
        setBarcodeInput('');
        setBatchDetails({
            batchCode: "",
            expiryDate: "",
            batchBarcode: "",
            mrp: "",
        });
        setPricing([]);
        setBrandId(null);
        setBrandInput("");
        setModalityId(null);
        setModalityInput("");
        setProductId(null);
        setProductInput("");
    }

    useEffect(() => {
        if (CLBatches?.data && isBatchLoading) {
            // Batches have loaded, reset loading state if needed
            setIsBatchLoading(false);
        }
    }, [CLBatches?.data, isBatchLoading]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className=""
            >
                <AnimatePresence>
                    {showAlert && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${alertMessage.type === "success" ? "bg-green-100" : "bg-yellow-100"}`}
                        >
                            <div className="flex items-center space-x-2">
                                {alertMessage.type === "success" ? (
                                    <Check className="h-5 w-5 text-green-500" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                                )}
                                <span
                                    className={`text-sm ${alertMessage.type === "success" ? "text-green-700" : "text-yellow-700"}`}
                                >
                                    {alertMessage.message}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <header className="">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 p-4"
                    >
                        <div className="">
                            <button className="text-[#000060] hover:text-[#0000a0] transition-colors flex items-center mb-3">
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Back to dashboard
                            </button>
                            <h1 className="text-3xl lg:text-4xl font-bold text-[#000060] mb-2">
                                CL Batch Details
                            </h1>
                        </div>
                    </motion.div>
                </header>

                <AnimatePresence>
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex flex-col lg:flex-row rounded-2xl shadow-xl justify-between items-start lg:items-center mb-6 p-4"
                    >
                        <div className="flex items-center space-x-6 mb-6">
                            {["single", "bulk", "edit"].map((option) => (
                                <div key={option} className="flex items-center">
                                    <input
                                        type="radio"
                                        id={option}
                                        name="batchOption"
                                        value={option}
                                        checked={selectedOption === option}
                                        onChange={() => handleSelectOptionChange(option)}
                                        className="h-4 w-4 text-[#000060] focus:ring-[#000060]"
                                    />
                                    <label htmlFor={option} className="ml-2 text-sm font-medium text-[#4b4b80] capitalize">
                                        {option}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <AnimatePresence>
                    {selectedOption === "single" && (
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex flex-col rounded-2xl shadow-xl mb-6 p-4"
                        >
                            <div className="flex flex-wrap items-center gap-6 mb-4">
                                {["barcode", "product"].map((option) => (
                                    <div key={option} className="flex items-center">
                                        <input
                                            type="radio"
                                            id={option}
                                            name="searchOption"
                                            value={option}
                                            checked={selectedSearchOption === option}
                                            onChange={() => handleSelectedSearchOption(option)}
                                            className="h-4 w-4 text-[#000060] focus:ring-[#000060]"
                                        />
                                        <label htmlFor={option} className="ml-2 text-sm font-medium text-[#4b4b80] capitalize">
                                            {option === "barcode" ? "Enter Product Barcode" : "Search Product"}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            {selectedSearchOption === "barcode" && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4"
                                >
                                    <div className="flex-grow w-full">
                                        <input
                                            type="text"
                                            value={barcodeInput}
                                            onChange={(e) => setBarcodeInput(e.target.value)}
                                            placeholder="Scan or enter barcode"
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000060] focus:border-[#000060] transition-all w-full"
                                        />
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={handleSearch}
                                            disabled={isLoading || !barcodeInput}
                                            className="px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#0000a0] transition-colors flex items-center justify-center flex-1 sm:flex-none disabled:opacity-50"
                                        >
                                            {isLoading ? (
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Search className="w-4 h-4 mr-2" />
                                            )}
                                            {isLoading ? "Searching..." : "Search"}
                                        </button>
                                        <button
                                            onClick={() => handleReset()}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center flex-1 sm:flex-none"
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Reset
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedSearchOption(null);
                                                setBarcodeInput("");
                                            }}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center flex-1 sm:flex-none"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Close
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {selectedSearchOption === "product" && (
                                <>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4 w-full"
                                    >
                                        <div className="flex flex-row gap-4 min-w-[200px]">
                                            <div className="flex-1 min-w-[200px]">
                                                <Autocomplete
                                                    options={filteredBrands}
                                                    getOptionLabel={(option) => option.BrandName}
                                                    onInputChange={(event, value) => {
                                                        setBrandInput(value);
                                                    }}
                                                    onChange={(event, newValue) => {
                                                        if (newValue) {
                                                            setBrandInput(newValue.BrandName);
                                                            setBrandId(newValue.Id);
                                                        } else {
                                                            setBrandInput("");
                                                            setBrandId(null);
                                                        }
                                                    }}
                                                    value={
                                                        filteredBrands.find((b) => b.BrandName === brandInput) ||
                                                        null
                                                    }
                                                    isOptionEqualToValue={(option, value) =>
                                                        option.Id === value.Id
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label="Search Brand"
                                                            variant="outlined"
                                                            fullWidth
                                                        />
                                                    )}
                                                />
                                            </div>
                                            <>
                                                {brandId && (
                                                    <div className="flex-1 min-w-[300px]">
                                                        <Autocomplete
                                                            options={modalities?.data || []}
                                                            getOptionLabel={(option) => option.ModalityName || ""}
                                                            onInputChange={(event, value) => {
                                                                setModalityInput(value);
                                                            }}
                                                            onChange={(event, newValue) => {
                                                                if (newValue) {
                                                                    setModalityInput(newValue.ModalityName);
                                                                    setModalityId(newValue.Id);
                                                                }
                                                            }}
                                                            value={
                                                                modalities?.data.find((b) => b.Id === modalityId) ||
                                                                null
                                                            }
                                                            isOptionEqualToValue={(option, value) =>
                                                                option.Id === value.Id
                                                            }
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    label="Search Modality"
                                                                    variant="outlined"
                                                                    fullWidth
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                )}

                                                {modalityId && productData && (
                                                    <div className="flex-1 min-w-[300px]">
                                                        <Autocomplete
                                                            options={productData?.data?.data || []}
                                                            getOptionLabel={(option) => option.ProductName || ""}
                                                            onInputChange={(event, value) => {
                                                                setProductInput(value);
                                                            }}
                                                            onChange={(event, newValue) => {
                                                                if (newValue) {
                                                                    setProductInput(newValue.ProductName);
                                                                    setProductId(newValue.Id);
                                                                }
                                                            }}
                                                            value={
                                                                productData?.data?.data.find((b) => b.Id === productId) ||
                                                                null
                                                            }
                                                            isOptionEqualToValue={(option, value) =>
                                                                option.Id === value.Id
                                                            }
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    label="Search Product"
                                                                    variant="outlined"
                                                                    fullWidth
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        </div>

                                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                            {/* <button className="px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#0000a0] transition-colors flex items-center justify-center flex-1 sm:flex-none">
                                                <Search className="w-4 h-4 mr-2" />
                                                Search
                                            </button> */}

                                            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center flex-1 sm:flex-none"
                                                onClick={handleReset}
                                            >
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Refresh
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedSearchOption(null);
                                                    setSearchInput("");
                                                }}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center flex-1 sm:flex-none"
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Close
                                            </button>
                                        </div>
                                    </motion.div>
                                    <>
                                        {productId && (
                                            <POCLpowerSearchTable
                                                headerItems={["Spherical Power", "Cylindrical Power", "Axis", "Additional", "Action"]}
                                                newItem={newItem}
                                                handlePowerSearchInputChange={handlePowerSearchInputChange}
                                                handleSearch={handlePowerSearch}
                                                handleRefresh={handleRefresh}
                                                isPowerDetailsLoading={isPowerDetailsLoading}
                                                errors={errors}
                                                searchFethed={searchFethed}
                                            />)}
                                    </>

                                </>
                            )}

                            {productDetails && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="rounded-xl shadow-xl overflow-hidden mt-6 mb-4"
                                >
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-[#000060]">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Product Details</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">MRP</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Spherical Power</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Cylindrical Power</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Axis</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Additional</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Colour</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                <tr>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {productDetails?.BrandName ?? ''} {productDetails?.ProductName}
                                                        {productDetails.Size && <br />}{productDetails.Size}
                                                        {/* {productDetails.SphericalPower && <br />}{productDetails.SphericalPower ? `Sph: ${productDetails.SphericalPower > 0 ? `+` : ``}${productDetails.SphericalPower}` : `Sph: `}
                                                        {productDetails.CylindricalPower ? ` Cyl: ${productDetails.CylindricalPower > 0 && `+`}${productDetails.CylindricalPower}` : ` Cyl: `}
                                                        {productDetails.Axis ? ` Axis: ${productDetails.Axis}` : ` Axis: `}
                                                        {productDetails.Additional ? ` Add: ${productDetails.Additional}` : ` Add: `}
                                                        {(typeof productDetails?.CLBatchCode) === 'string' && <br />}{(typeof productDetails?.CLBatchCode) === 'string' ? `BatchCode: ${productDetails.CLBatchCode}` : ``}
                                                        {(typeof productDetails?.CLBatchCode) === 'string' && (productDetails?.Expiry || productDetails?.CLBatchExpiry) && (() => {
                                                            const expiryDate = productDetails.Expiry || productDetails?.CLBatchExpiry;
                                                            const [year, month, day] = expiryDate.split('-');
                                                            const formattedExpiry = `${day}-${month}-${year}`;
                                                            return ` Expiry: ${formattedExpiry}`;
                                                        })()}
                                                        {productDetails.HSN && <br />}{productDetails.HSN && `HSN: ` + productDetails.HSN} */}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {productDetails.MRP}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {productDetails.SphericalPower}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {productDetails.CylindricalPower}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {productDetails.Axis}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {productDetails.Additional || "-"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {productDetails.Colour || "-"}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}

                            {productDetails && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="rounded-2xl p-2 mt-6"
                                >
                                    <h3 className="text-lg font-semibold text-[#000060] mb-4">Batch Details</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Enter Batch Code <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={batchDetails.batchCode}
                                                onChange={(e) => handleBatchDetailChange("batchCode", e.target.value)}
                                                className={`w-full px-3 py-2 border ${formErrors.batchCode ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-[#000060] focus:border-[#000060]`}
                                            />
                                            {formErrors.batchCode && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.batchCode}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Expiry Date <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={batchDetails.expiryDate}
                                                onChange={(e) => handleBatchDetailChange("expiryDate", e.target.value)}
                                                className={`w-full px-3 py-2 border ${formErrors.expiryDate ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-[#000060] focus:border-[#000060]`}
                                            />
                                            {formErrors.expiryDate && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.expiryDate}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Batch Barcode
                                            </label>
                                            <input
                                                type="text"
                                                value={batchDetails.batchBarcode}
                                                onChange={(e) => handleBatchDetailChange("batchBarcode", e.target.value)}
                                                className={`w-full px-3 py-2 border rounded-md focus:ring-[#000060] focus:border-[#000060]`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                MRP <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <IndianRupee className="text-gray-400" />
                                                </div>
                                                <input
                                                    type="number"
                                                    value={batchDetails.mrp}
                                                    onChange={(e) => handleBatchDetailChange("mrp", e.target.value)}
                                                    className={`w-full pl-8 pr-3 py-2 border ${formErrors.mrp ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-[#000060] focus:border-[#000060]`}
                                                />
                                            </div>
                                            {formErrors.mrp && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.mrp}</p>
                                            )}
                                        </div>
                                    </div>

                                    <PricingTable
                                        pricing={pricing}
                                        onPriceChange={handlePriceChange}
                                        applyAll={applyAll}
                                        onApplyAllChange={setApplyAll}
                                        onApplyToAll={(field, value) =>
                                            setPricing(pricing.map((row) => ({ ...row, [field]: value })))
                                        }
                                    />

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSaving || isUpdating}
                                            className="px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#0000a0] transition-colors disabled:opacity-50"
                                        >
                                            {(isSaving || isUpdating) ? (
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin inline" />
                                            ) : null}
                                            {(isSaving || isUpdating) ? "Processing..." : "Save Batch Details"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {selectedOption === "edit" && (
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex flex-col rounded-2xl shadow-xl mb-6 p-4"
                        >
                            <div className="flex flex-wrap items-center gap-6 mb-4">
                                {["barcode", "product"].map((option) => (
                                    <div key={option} className="flex items-center">
                                        <input
                                            type="radio"
                                            id={option}
                                            name="searchOption"
                                            value={option}
                                            checked={selectedSearchOption === option}
                                            onChange={() => handleSelectedSearchOption(option)}
                                            className="h-4 w-4 text-[#000060] focus:ring-[#000060]"
                                        />
                                        <label htmlFor={option} className="ml-2 text-sm font-medium text-[#4b4b80] capitalize">
                                            {option === "barcode" ? "Enter Product Barcode" : "Search Product"}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            {selectedSearchOption === "barcode" && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4"
                                >
                                    <div className="flex-grow w-full">
                                        <input
                                            type="text"
                                            value={barcodeInput}
                                            onChange={(e) => setBarcodeInput(e.target.value)}
                                            placeholder="Scan or enter barcode"
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000060] focus:border-[#000060] transition-all w-full"
                                        />
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={handleEditSearch}
                                            disabled={isLoading || !barcodeInput}
                                            className="px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#0000a0] transition-colors flex items-center justify-center flex-1 sm:flex-none disabled:opacity-50"
                                        >
                                            {isLoading ? (
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Search className="w-4 h-4 mr-2" />
                                            )}
                                            {isLoading ? "Searching..." : "Search"}
                                        </button>
                                        <button
                                            onClick={() => handleReset()}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center flex-1 sm:flex-none"
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Reset
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedSearchOption(null);
                                                setBarcodeInput("");
                                            }}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center flex-1 sm:flex-none"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Close
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {selectedSearchOption === "product" && (
                                <>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4 w-full"
                                    >
                                        <div className="flex flex-row gap-4 min-w-[200px]">
                                            <div className="flex-1 min-w-[200px]">
                                                <Autocomplete
                                                    options={filteredBrands}
                                                    getOptionLabel={(option) => option.BrandName}
                                                    onInputChange={(event, value) => {
                                                        setBrandInput(value);
                                                    }}
                                                    onChange={(event, newValue) => {
                                                        if (newValue) {
                                                            setBrandInput(newValue.BrandName);
                                                            setBrandId(newValue.Id);
                                                        } else {
                                                            setBrandInput("");
                                                            setBrandId(null);
                                                        }
                                                    }}
                                                    value={
                                                        filteredBrands.find((b) => b.BrandName === brandInput) ||
                                                        null
                                                    }
                                                    isOptionEqualToValue={(option, value) =>
                                                        option.Id === value.Id
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label="Search Brand"
                                                            variant="outlined"
                                                            fullWidth
                                                        />
                                                    )}
                                                />
                                            </div>
                                            <>
                                                {brandId && (
                                                    <div className="flex-1 min-w-[300px]">
                                                        <Autocomplete
                                                            options={modalities?.data || []}
                                                            getOptionLabel={(option) => option.ModalityName || ""}
                                                            onInputChange={(event, value) => {
                                                                setModalityInput(value);
                                                            }}
                                                            onChange={(event, newValue) => {
                                                                if (newValue) {
                                                                    setModalityInput(newValue.ModalityName);
                                                                    setModalityId(newValue.Id);
                                                                }
                                                            }}
                                                            value={
                                                                modalities?.data.find((b) => b.Id === modalityId) ||
                                                                null
                                                            }
                                                            isOptionEqualToValue={(option, value) =>
                                                                option.Id === value.Id
                                                            }
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    label="Search Modality"
                                                                    variant="outlined"
                                                                    fullWidth
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                )}

                                                {modalityId && productData && (
                                                    <div className="flex-1 min-w-[300px]">
                                                        <Autocomplete
                                                            options={productData?.data?.data || []}
                                                            getOptionLabel={(option) => option.ProductName || ""}
                                                            onInputChange={(event, value) => {
                                                                setProductInput(value);
                                                            }}
                                                            onChange={(event, newValue) => {
                                                                if (newValue) {
                                                                    setProductInput(newValue.ProductName);
                                                                    setProductId(newValue.Id);
                                                                }
                                                            }}
                                                            value={
                                                                productData?.data?.data.find((b) => b.Id === productId) ||
                                                                null
                                                            }
                                                            isOptionEqualToValue={(option, value) =>
                                                                option.Id === value.Id
                                                            }
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    label="Search Product"
                                                                    variant="outlined"
                                                                    fullWidth
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        </div>

                                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                            {/* <button className="px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#0000a0] transition-colors flex items-center justify-center flex-1 sm:flex-none">
                                                <Search className="w-4 h-4 mr-2" />
                                                Search
                                            </button> */}

                                            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center flex-1 sm:flex-none"
                                                onClick={handleReset}
                                            >
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Refresh
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedSearchOption(null);
                                                    setSearchInput("");
                                                }}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center flex-1 sm:flex-none"
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Close
                                            </button>
                                        </div>
                                    </motion.div>
                                    <>
                                        {productId && (
                                            <POCLpowerSearchTable
                                                headerItems={["Spherical Power", "Cylindrical Power", "Axis", "Additional", "Action"]}
                                                newItem={newItem}
                                                handlePowerSearchInputChange={handlePowerSearchInputChange}
                                                handleSearch={handlePowerSearch}
                                                handleRefresh={handleRefresh}
                                                isPowerDetailsLoading={isPowerDetailsLoading}
                                                errors={errors}
                                                searchFethed={searchFethed}
                                            />)}
                                    </>

                                </>
                            )}

                            {productDetails && (
                                <>
                                    <div className="mt-6">
                                        <div className="flex items-center space-x-10">
                                            <div className="flex space-x-4">
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="clBatchInputType"
                                                        value="select"
                                                        checked={clBatchInputType === "select"}
                                                        onChange={() => setClBatchInputType("select")}
                                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="text-gray-700 font-medium">Select Batch code</span>
                                                </label>

                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="clBatchInputType"
                                                        value="enter"
                                                        checked={clBatchInputType === "enter"}
                                                        onChange={() => setClBatchInputType("enter")}
                                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="text-gray-700 font-medium">Enter Batch Barcode</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {clBatchInputType === "select" ? (
                                        <div className="flex items-end gap-2 my-4">
                                            <div className="space-y-2 w-1/3">
                                                <Autocomplete
                                                    options={CLBatches?.data || []}
                                                    getOptionLabel={(option) => option.CLBatchCode || ""}
                                                    value={
                                                        CLBatches?.data?.find(
                                                            (batch) =>
                                                                batch.CLBatchCode === selectedBatchCode?.CLBatchCode
                                                        ) || null
                                                    }
                                                    onChange={(_, newValue) => {
                                                        handleSearchCLStock(newValue);
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
                                                <button
                                                    className="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                                                    onClick={() => handleSearchCLStock(selectedBatchCode)} // Pass selectedBatchCode directly
                                                >
                                                    Search
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-1/2 mt-5 flex items-center gap-4">
                                            {isBatchLoading && (
                                                <div className="flex items-center">
                                                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                                    <span className="text-sm text-gray-500">Loading batches...</span>
                                                </div>
                                            )}
                                            <Input
                                                value={batchCodeInput}
                                                onChange={(e) => setbatchCodeInput(e.target.value)}
                                                label="Enter BatchBarCode"
                                                error={
                                                    batchCodeInput &&
                                                    CLBatches?.data?.length > 0 &&
                                                    !CLBatches.data.find(
                                                        (b) => b.CLBatchBarCode?.toLowerCase() === batchCodeInput.toLowerCase()
                                                    )
                                                }
                                                helperText={
                                                    batchCodeInput && CLBatches?.data?.length > 0
                                                        ? !CLBatches.data.find(
                                                            (b) => b.CLBatchBarCode?.toLowerCase() === batchCodeInput.toLowerCase()
                                                        )
                                                            ? "Invalid batch barcode"
                                                            : "Valid barcode"
                                                        : CLBatches?.data?.length === 0
                                                            ? "Search product first to load batches"
                                                            : "Enter batch barcode"
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && batchCodeInput.trim()) {
                                                        e.preventDefault();
                                                        handleBatchBarcodeSearch();
                                                    }
                                                }}
                                            />
                                            <button
                                                className="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 flex justify-center items-center"
                                                onClick={handleBatchBarcodeSearch}
                                                disabled={!batchCodeInput.trim() || !CLBatches?.data?.length || isLoading}
                                            >
                                                {isLoading ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                                ) : (
                                                    <Search className="w-4 h-4 mr-2" />
                                                )}
                                                Search
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            {productDetails && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="rounded-xl shadow-xl overflow-hidden mt-6 mb-4"
                                >
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-[#000060]">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Product Details</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">MRP</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Spherical Power</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Cylindrical Power</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Axis</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Additional</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Colour</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                <tr>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {productDetails?.BrandName ?? ''} {productDetails?.ProductName}
                                                        {productDetails.Size && <br />}{productDetails.Size}
                                                        {/* {productDetails.SphericalPower && <br />}{productDetails.SphericalPower ? `Sph: ${productDetails.SphericalPower > 0 ? `+` : ``}${productDetails.SphericalPower}` : `Sph: `}
                                                        {productDetails.CylindricalPower ? ` Cyl: ${productDetails.CylindricalPower > 0 && `+`}${productDetails.CylindricalPower}` : ` Cyl: `}
                                                        {productDetails.Axis ? ` Axis: ${productDetails.Axis}` : ` Axis: `}
                                                        {productDetails.Additional ? ` Add: ${productDetails.Additional}` : ` Add: `}
                                                        {(typeof productDetails?.CLBatchCode) === 'string' && <br />}{(typeof productDetails?.CLBatchCode) === 'string' ? `BatchCode: ${productDetails.CLBatchCode}` : ``}
                                                        {(typeof productDetails?.CLBatchCode) === 'string' && (productDetails?.Expiry || productDetails?.CLBatchExpiry) && (() => {
                                                            const expiryDate = productDetails.Expiry || productDetails?.CLBatchExpiry;
                                                            const [year, month, day] = expiryDate.split('-');
                                                            const formattedExpiry = `${day}-${month}-${year}`;
                                                            return ` Expiry: ${formattedExpiry}`;
                                                        })()}
                                                        {productDetails.HSN && <br />}{productDetails.HSN && `HSN: ` + productDetails.HSN} */}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {productDetails.MRP}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {productDetails.SphericalPower}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {productDetails.CylindricalPower}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {productDetails.Axis}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {productDetails.Additional || "-"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {productDetails.Colour || "-"}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}

                            {productStockDetails && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="rounded-2xl p-2 mt-6"
                                >
                                    <h3 className="text-lg font-semibold text-[#000060] mb-4">Batch Details</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Enter Batch Code <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                disabled="true"
                                                type="text"
                                                value={batchDetails.batchCode}
                                                onChange={(e) => handleBatchDetailChange("batchCode", e.target.value)}
                                                className={`w-full px-3 py-2 border ${formErrors.batchCode ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-[#000060] focus:border-[#000060]`}
                                            />
                                            {formErrors.batchCode && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.batchCode}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Expiry Date <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={batchDetails.expiryDate}
                                                onChange={(e) => handleBatchDetailChange("expiryDate", e.target.value)}
                                                className={`w-full px-3 py-2 border ${formErrors.expiryDate ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-[#000060] focus:border-[#000060]`}
                                            />
                                            {formErrors.expiryDate && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.expiryDate}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Batch Barcode
                                            </label>
                                            <input
                                                type="text"
                                                value={batchDetails.batchBarcode}
                                                onChange={(e) => handleBatchDetailChange("batchBarcode", e.target.value)}
                                                className={`w-full px-3 py-2 border rounded-md focus:ring-[#000060] focus:border-[#000060]`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                MRP <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <IndianRupee className="text-gray-400" />
                                                </div>
                                                <input
                                                    type="number"
                                                    value={batchDetails.mrp}
                                                    onChange={(e) => handleBatchDetailChange("mrp", e.target.value)}
                                                    className={`w-full pl-8 pr-3 py-2 border ${formErrors.mrp ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-[#000060] focus:border-[#000060]`}
                                                />
                                            </div>
                                            {formErrors.mrp && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.mrp}</p>
                                            )}
                                        </div>
                                    </div>

                                    <PricingTable
                                        pricing={pricing}
                                        onPriceChange={handlePriceChange}
                                        applyAll={applyAll}
                                        onApplyAllChange={setApplyAll}
                                        onApplyToAll={(field, value) =>
                                            setPricing(pricing.map((row) => ({ ...row, [field]: value })))
                                        }
                                    />

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSaving || isUpdating}
                                            className="px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#0000a0] transition-colors disabled:opacity-50"
                                        >
                                            {(isSaving || isUpdating) ? (
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin inline" />
                                            ) : null}
                                            {(isSaving || isUpdating) ? "Processing..." : "Update Batch Details"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {selectedOption === 'bulk' && (
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
                                        <span className="font-semibold text-gray-800">Tip:</span> Download the sample file to see the correct format for your bulk upload
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
                                            onClick={handleDownloadSampleExcel}
                                            disabled={isSaving}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center flex-1 sm:flex-none"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                    <span>Downloading...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FileText className="w-4 h-4" />
                                                    <span className="text-white">Download Sample</span>
                                                </>
                                            )}
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
                                                onClick={handleUpload}
                                                disabled={!selectedFile || isFileUploading}
                                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center flex-1 sm:flex-none"
                                            >
                                                {isFileUploading ? (
                                                    <>
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                        <span className="text-white">Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-4 h-4" />
                                                        <span className="text-white">Upload</span>
                                                    </>
                                                )}
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
                                                    <p className="font-semibold text-gray-800 truncate">{selectedFile.name}</p>
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
                    )}
                </AnimatePresence>
            </motion.div>
        </>
    );
};