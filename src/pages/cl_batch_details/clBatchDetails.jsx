import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Check,
    AlertCircle,
    Search,
    RefreshCw,
    XCircle,
    IndianRupee
} from "lucide-react";
import { useGetContactLensDetailsMutation } from "../../api/clBatchDetailsApi";
import { useGetAllLocationsQuery } from "../../api/roleManagementApi";
import PricingTable from "../admin/Master/PricingTable";
import { useSaveContactLensDetailsMutation } from "../../api/clBatchDetailsApi";
import { useSelector } from "react-redux";

export default function ClBatchDetails() {
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: "", message: "" });
    const [selectedOption, setSelectedOption] = useState(null);
    const [selectedSearchOption, setSelectedSearchOption] = useState(null);
    const [barcodeInput, setBarcodeInput] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [fetchDetails, { data, isLoading, error }] = useGetContactLensDetailsMutation();
    const { data: allLocations } = useGetAllLocationsQuery();
    const [saveBatchDetails, { isLoading: isSaving }] = useSaveContactLensDetailsMutation();
    const { user } = useSelector((state) => state.auth);

    const productDetails = data?.data?.data || null;

    const [batchDetails, setBatchDetails] = useState({
        batchCode: "",
        expiryDate: "",
        batchBarcode: "",
        mrp: productDetails?.MRP || "",
    });

    const [pricing, setPricing] = useState([]);
    const [applyAll, setApplyAll] = useState({
        buyingPrice: "",
        sellingPrice: "",
    });

    const [formErrors, setFormErrors] = useState({});


    const handleSearch = async () => {
        if (!barcodeInput.trim()) return;

        try {
            await fetchDetails(barcodeInput);
        } catch (err) {
            console.error('Unexpected error:', err);
        }
    };

    const handleReset = () => {
        setBarcodeInput('');
    };



    useEffect(() => {
        if (allLocations?.data?.length && pricing.length === 0) {
            const initialPricing = allLocations.data.map((loc) => ({
                id: loc.Id,
                location: loc.LocationName,
                buyingPrice: "",
                sellingPrice: "",
            }));
            setPricing(initialPricing);
        }
        if (productDetails) {
            setBatchDetails(prev => ({
                ...prev,
                mrp: productDetails.MRP || ""
            }));
        }
    }, [allLocations, pricing.length, productDetails]);

    const handleBatchDetailChange = (field, value) => {
        setBatchDetails(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const handlePriceChange = (idx, field, value) => {
        const updated = [...pricing];
        updated[idx][field] = value;
        setPricing(updated);
        if (formErrors.pricing) {
            setFormErrors(prev => ({ ...prev, pricing: "" }));
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

        if (!batchDetails.batchBarcode.trim()) {
            errors.batchBarcode = "Batch Barcode is required";
        }

        const mrp = parseFloat(batchDetails.mrp);
        if (isNaN(mrp)) {
            errors.mrp = "MRP must be a valid number";
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

    const handleSubmit = async () => {
        const errors = validateBatchDetails();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            // Format the data according to the exact API requirements
            const locationPrices = {
                location: pricing.map(loc => loc.id),
            };

            // Add price fields for each location
            pricing.forEach((loc, index) => {
                const idx = index + 1;
                const buyingPrice = parseFloat(loc.buyingPrice) || 0;
                const sellingPrice = parseFloat(loc.sellingPrice) || 0;
                const avgPrice = (buyingPrice + sellingPrice) / 2;

                locationPrices[`BuyingPrice${idx}`] = buyingPrice;
                locationPrices[`SellingPrice${idx}`] = sellingPrice;
                locationPrices[`AvgPrice${idx}`] = avgPrice;
                locationPrices[`Quantity${idx}`] = 0;
                locationPrices[`DefectiveQty${idx}`] = 0;
            });

            const requestData = {
                clBatchCode: batchDetails.batchCode,
                clBatchBarcode: batchDetails.batchBarcode,
                clBatchExpiry: batchDetails.expiryDate,
                clMrp: parseFloat(batchDetails.mrp),
                clDetailsId: productDetails?.CLDetailsId,
                locationPrices: locationPrices
            };

            console.log("Submitting:", requestData); // For debugging
            console.log("userId:", user?.Id); // For debugging

            // Call the API
            const response = await saveBatchDetails({ batchData: requestData, applicationUserId: user?.Id }).unwrap();

            // Handle successful response
            setAlertMessage({ type: "success", message: "Batch details saved successfully" });
            setShowAlert(true);

        } catch (err) {
            console.error('Failed to save batch:', err);
            setAlertMessage({
                type: "error",
                message: err.data?.error || err.message || "Failed to save batch details"
            });
            setShowAlert(true);
        }
    };


    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className=""
            >
                {/* Alert component remains the same */}
                <AnimatePresence>
                    {showAlert && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${alertMessage.type === "success" ? "bg-green-100" : "bg-yellow-100"
                                }`}
                        >
                            <div className="flex items-center space-x-2">
                                {alertMessage.type === "success" ? (
                                    <Check className="h-5 w-5 text-green-500" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                                )}
                                <span
                                    className={`text-sm ${alertMessage.type === "success"
                                        ? "text-green-700"
                                        : "text-yellow-700"
                                        }`}
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

                {/* Main options radio buttons */}
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
                                        onChange={() => setSelectedOption(option)}
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

                {/* Single option content */}
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
                                            onChange={() => setSelectedSearchOption(option)}
                                            className="h-4 w-4 text-[#000060] focus:ring-[#000060]"
                                        />
                                        <label htmlFor={option} className="ml-2 text-sm font-medium text-[#4b4b80] capitalize">
                                            {option === "barcode" ? "Enter Product Barcode" : "Search Product"}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            {/* Barcode input field */}
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

                            {/* Error message */}
                            {error && (
                                <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">
                                    Error: {error.data?.message || "Failed to fetch product details"}
                                </div>
                            )}

                            {/* Product search field */}
                            {selectedSearchOption === "product" && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4 w-full"
                                >
                                    <div className="flex-grow w-full sm:w-auto">
                                        <input
                                            type="text"
                                            value={searchInput}
                                            onChange={(e) => setSearchInput(e.target.value)}
                                            placeholder="Search product by name or ID"
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000060] focus:border-[#000060] transition-all w-full"
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                        <button className="px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#0000a0] transition-colors flex items-center justify-center flex-1 sm:flex-none">
                                            <Search className="w-4 h-4 mr-2" />
                                            Search
                                        </button>

                                        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center flex-1 sm:flex-none">
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
                            )}



                            {/* Results table */}
                            {productDetails && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="rounded-2xl shadow-xl overflow-hidden mb-6"
                                >
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-[#000060]">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Product Name + Brand Name</th>
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
                                                        {productDetails.ProductName}, {productDetails.BrandName}
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
                                    className="rounded-2xl p-6 mt-6"
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
                                                className={`w-full px-3 py-2 border ${formErrors.batchCode ? "border-red-500" : "border-gray-300"
                                                    } rounded-md focus:ring-[#000060] focus:border-[#000060]`}
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
                                                className={`w-full px-3 py-2 border ${formErrors.expiryDate ? "border-red-500" : "border-gray-300"
                                                    } rounded-md focus:ring-[#000060] focus:border-[#000060]`}
                                            />
                                            {formErrors.expiryDate && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.expiryDate}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Batch Barcode <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={batchDetails.batchBarcode}
                                                onChange={(e) => handleBatchDetailChange("batchBarcode", e.target.value)}
                                                className={`w-full px-3 py-2 border ${formErrors.batchBarcode ? "border-red-500" : "border-gray-300"
                                                    } rounded-md focus:ring-[#000060] focus:border-[#000060]`}
                                            />
                                            {formErrors.batchBarcode && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.batchBarcode}</p>
                                            )}
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
                                                    className={`w-full pl-8 pr-3 py-2 border ${formErrors.mrp ? "border-red-500" : "border-gray-300"
                                                        } rounded-md focus:ring-[#000060] focus:border-[#000060]`}
                                                />
                                            </div>
                                            {formErrors.mrp && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.mrp}</p>
                                            )}
                                        </div>
                                    </div>

                                    <PricingTable
                                        pricing={pricing}
                                        onPriceChange={(idx, field, val) => {
                                            const updated = [...pricing];
                                            updated[idx][field] = val;
                                            setPricing(updated);
                                            if (formErrors.pricing) {
                                                setFormErrors((prev) => ({ ...prev, pricing: "" }));
                                            }
                                        }}
                                        applyAll={applyAll}
                                        onApplyAllChange={setApplyAll}
                                        onApplyToAll={(field, value) =>
                                            setPricing(pricing.map((row) => ({ ...row, [field]: value })))
                                        }
                                    // isEnabled={isEnabled}
                                    />

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSaving}
                                            className="px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#0000a0] transition-colors disabled:opacity-50"
                                        >
                                            {isSaving ? (
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin inline" />
                                            ) : null}
                                            {isSaving ? "Saving..." : "Save Batch Details"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </>
    );
};