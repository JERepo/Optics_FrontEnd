import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Check,
    AlertCircle,
    Trash2
} from "lucide-react";

import { useSelector } from "react-redux";
import { useGetAllLocationsQuery } from "../../api/roleManagementApi";
import { useGetAllVendorMutation } from "../../api/vendorApi";
import { useSavePurchaseOrderDetailsMutation, useSavePurchaseOrderMutation } from "../../api/purchaseOrderApi";
import { useGetCompanySettingsQuery } from "../../api/companySettingsApi";
import { useGetCompanyByIdQuery } from "../../api/companiesApi";
import { useGetOrderDetailsAllMutation } from "../../api/orderApi";

export default function SavePurchaseOrder() {
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: "", message: "" });
    const [selectedLocation, setSelectedLocation] = useState(null);
    const { data: allLocations } = useGetAllLocationsQuery();
    const [filteredOrderDetails, setFilteredOrderDetails] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState("");
    const [formState, setFormState] = useState({
        shiptoAddress: "against", // 'new' or 'against'
        referenceNo: "",
        vendorDetails: null,
        selectedOption: "" // For step 2 radio buttons
    });
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [savedPODetails, setSavedPODetails] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [createdPOMainId, setCreatedPOMainId] = useState(null);
    const { user, hasMultipleLocations } = useSelector((state) => state.auth);
    const [getAllVendor] = useGetAllVendorMutation();
    const [SavePurchaseOrder] = useSavePurchaseOrderMutation();
    const [SavePurchaseOrderDetails] = useSavePurchaseOrderDetailsMutation();
    const [getOrderDetails] = useGetOrderDetailsAllMutation();

    // User assigned locations
    const hasLocation = allLocations?.data ? allLocations?.data?.filter(loc =>
        hasMultipleLocations.includes(loc.Id)
    ) : [];

    const { data: companySettingsData, error: companySettingsError } = useGetCompanySettingsQuery(
        { id: selectedLocation || hasLocation?.[0]?.Id || '' },
        { skip: !selectedLocation && !hasLocation?.[0]?.Id }
    );

    const { data: companiesData, error: companiesError } = useGetCompanyByIdQuery(
        { id: formState?.vendorDetails?.MultiDelivery === 1 ? selectedLocation : formState?.vendorDetails?.DeliveryLocationId },
        { skip: !selectedLocation && !hasLocation?.[0]?.Id }
    );

    const fetchVendors = async (locationId) => {
        if (!locationId) return;

        try {
            const payload = { company_id: parseInt(locationId) };
            const response = await getAllVendor(payload).unwrap();
            if (response?.data?.data) {
                setVendors(response.data.data);
                setSelectedVendor("");
            }
        } catch (error) {
            console.error("Error fetching vendors:", error);
            setAlertMessage({
                type: "error",
                message: "Failed to fetch vendors"
            });
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        }
    };

    useEffect(() => {
        if (hasLocation?.length === 1) {
            setSelectedLocation(hasLocation[0].Id.toString());
        }
    }, [hasLocation]);

    useEffect(() => {
        if (companySettingsError) {
            console.error("Error fetching company settings:", companySettingsError);
            setAlertMessage({
                type: "error",
                message: "Failed to fetch company details"
            });
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        }
    }, [companySettingsError]);

    useEffect(() => {
        if (selectedLocation) {
            fetchVendors(selectedLocation);
        }
    }, [selectedLocation]);


    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (selectedLocation && formState.selectedOption && currentStep === 3) {
                try {
                    const payload = {
                        orderMasterId: null,
                        locationId: selectedLocation,
                        productType: formState.selectedOption === 'Frame/Sunglass' ? 1
                            : formState.selectedOption === 'Lens' ? 0
                                : formState.selectedOption === 'Accessories' ? 2
                                    : formState.selectedOption === 'Contact Lens' ? 3
                                        : null
                    };

                    const response = await getOrderDetails(payload).unwrap();
                    if (response) {
                        const filteredDetails = response.filter(detail => {
                            const validDetailStatus = [0, 2].includes(detail.orderDetailStatus);
                            const validMasterStatus = [1, 2].includes(detail.orderMasterStatus);
                            return validDetailStatus && validMasterStatus;
                        });
                        setFilteredOrderDetails(filteredDetails);
                        setSelectedOrders([]);
                        setSelectAll(false);
                    }
                } catch (error) {
                    console.error("Error fetching order details:", error);
                    setAlertMessage({
                        type: "error",
                        message: "Failed to fetch order details"
                    });
                    setShowAlert(true);
                    setTimeout(() => setShowAlert(false), 3000);
                }
            }
        };

        fetchOrderDetails();
    }, [selectedLocation, formState.selectedOption, currentStep]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleVendorChange = (vendorId) => {
        setSelectedVendor(vendorId);
        const vendor = vendors.find(v => v.Id === parseInt(vendorId));
        setFormState(prev => ({
            ...prev,
            vendorDetails: vendor
        }));
    };

    const handleOptionChange = (option) => {
        setFormState(prev => ({
            ...prev,
            selectedOption: option
        }));
    };

    const handleNext = () => {
        // Validate step 1 before proceeding
        if (currentStep === 1) {
            if (!selectedLocation) {
                setAlertMessage({
                    type: "error",
                    message: "Please select a location"
                });
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
                return;
            }

            if (!selectedVendor) {
                setAlertMessage({
                    type: "error",
                    message: "Please select a vendor"
                });
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
                return;
            }

            if (!formState.shiptoAddress) {
                setAlertMessage({
                    type: "error",
                    message: "Please select a ship to address"
                });
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
                return;
            }
        }

        // Validate step 2 before proceeding
        if (currentStep === 2 && !formState.selectedOption) {
            setAlertMessage({
                type: "error",
                message: "Please select an option"
            });
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
            return;
        }

        // Validate step 3 before proceeding
        if (currentStep === 3 && selectedOrders.length === 0) {
            setAlertMessage({
                type: "error",
                message: "Please select at least one order"
            });
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
            return;
        }

        setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        setCurrentStep(currentStep === 1 ? 1 : currentStep - 1);
    };

    const handleOrderSelection = (orderId) => {
        setSelectedOrders(prev => {
            if (prev.includes(orderId)) {
                return prev.filter(id => id !== orderId);
            } else {
                return [...prev, orderId];
            }
        });

        // Update selectAll state if needed
        if (selectedOrders.length + 1 === filteredOrderDetails.length) {
            setSelectAll(true);
        } else {
            setSelectAll(false);
        }
    };

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setSelectAll(isChecked);
        if (isChecked) {
            setSelectedOrders(filteredOrderDetails.map(order => order.orderDetailId));
        } else {
            setSelectedOrders([]);
        }
    };


    const handleRemoveOrder = (orderId) => {
        setSelectedOrders(prev => prev.filter(id => id !== orderId));
    };


    // Handle Save for PO main 
    const handleSubmit = async () => {
        try {
            // Prepare payload with data from all steps
            const payload = {
                companyId: parseInt(selectedLocation),
                vendorId: parseInt(selectedVendor),
                poPrefix: companySettingsData?.data?.data?.POPrefix || "",
                inState: formState?.vendorDetails?.MultiDelivery === 1 ? 0 : 1,
                againstOrder: formState.shiptoAddress === "against" ? 1 : 0,
                shiptoCompanyId: formState?.vendorDetails?.MultiDelivery === 1 ? parseInt(selectedLocation) : formState?.vendorDetails?.DeliveryLocationId,
                poReferenceNo: formState.referenceNo || "",
                status: 0   // Default to draft status
            };

            console.log("Complete Payload:", payload);
            // Call API
            const response = await SavePurchaseOrder({ id: user.Id, payload }).unwrap();
            if (response.status === "success") {

                console.log(response);
                setCreatedPOMainId(response.data.data.Id);
                setAlertMessage({
                    type: "success",
                    message: "Purchase order created successfully"
                });
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
                // Optionally navigate to another page or reset the form
                setCurrentStep(2);
            } else {
                setAlertMessage({
                    type: "error",
                    message: response.message || "Failed to create purchase order"
                });
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
            }
        } catch (error) {
            console.error("Error creating purchase order:", error);
            setAlertMessage({
                type: "error",
                message: error.message || "An error occurred while creating purchase order"
            });
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        }
    };

    // Handle save for PO details
    const handleSubmitPODetails = async () => {
        try {
            if (!createdPOMainId) {
                throw new Error("Purchase order main ID not found");
            }

            if (selectedOrders.length === 0) {
                setAlertMessage({
                    type: "error",
                    message: "Please select at least one order"
                });
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
                return;
            }

            // Prepare PO details payload
            const poDetails = filteredOrderDetails
                .filter(order => selectedOrders.includes(order.orderDetailId))
                .map(order => ({
                    poMainId: createdPOMainId,
                    poslNo: order.slNo,
                    productType: formState.selectedOption === 'Frame/Sunglass' ? 1
                        : formState.selectedOption === 'Lens' ? 0
                            : formState.selectedOption === 'Accessories' ? 2
                                : formState.selectedOption === 'Contact Lens' ? 3
                                    : null,
                    [formState.selectedOption === 'Frame/Sunglass' ? 'FrameDetailId'
                        : formState.selectedOption === 'Lens' ? 'OpticalLensDetailId'
                            : formState.selectedOption === 'Accessories' ? 'AccessoryDetailId'
                                : 'ContactLensDetailId']: order.productId,
                    detailId: order.olDetailId || order.cLDetailId || order.frameDetailId || order.accessoryDetailId,
                    orderDetailId: order.orderDetailId,
                    poQty: order.orderQty - order.billedQty - order.cancelledQty,
                    poPrice: order.pricing.buyingPrice,
                    taxPercentage: order.taxPercentage || 0,
                    Status: 0, // Default status
                    ApplicationUserId: user.Id
                }));

            console.log("payload: ", poDetails);

            // Call API to save PO details
            const response = await SavePurchaseOrderDetails(poDetails).unwrap();
            if (response.status === "success") {
                setSavedPODetails(response?.data?.details);
                setAlertMessage({
                    type: "success",
                    message: "Purchase order details saved successfully"
                });
                console.log(response.data.details);
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
                // Optionally navigate to another page or reset the form
                setCurrentStep(4);
            } else {
                setAlertMessage({
                    type: "error",
                    message: response.message || "Failed to save purchase order details"
                });
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
            }
        } catch (error) {
            console.error("Error saving purchase order details:", error);
            setAlertMessage({
                type: "error",
                message: error.message || "An error occurred while saving purchase order details"
            });
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        }
    };

    const calculateTotalAmount = () => {
        return selectedOrders.reduce((total, orderId) => {
            const order = filteredOrderDetails.find(o => o.id === orderId);
            if (order) {
                const quantity = order.orderQty - order.billedQty - order.cancelledQty;
                const price = order.pricing.buyingPrice;
                const tax = order.taxPercentage || 0;
                return total + (price * quantity) + (price * quantity * (tax / 100));
            }
            return total;
        }, 0);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Alert component */}
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
                                Purchase Order
                            </h1>
                            <div className="flex items-center mt-2">
                                <div className={`flex items-center ${currentStep === 1 ? 'font-bold text-shadow-primary' : 'text-gray-500'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${currentStep === 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                                        1
                                    </div>
                                    <span>Vendor Information</span>
                                </div>
                                <div className="mx-2 text-gray-400">→</div>
                                <div className={`flex items-center ${currentStep === 2 ? 'font-bold text-shadow-primary' : 'text-gray-500'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${currentStep === 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                                        2
                                    </div>
                                    <span>Product Type</span>
                                </div>
                                <div className="mx-2 text-gray-400">→</div>
                                <div className={`flex items-center ${currentStep === 3 ? 'font-bold text-shadow-primary' : 'text-gray-500'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${currentStep === 3 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                                        3
                                    </div>
                                    <span>Orders List</span>
                                </div>
                                <div className="mx-2 text-gray-400">→</div>
                                <div className={`flex items-center ${currentStep === 4 ? 'font-bold text-shadow-primary' : 'text-gray-500'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${currentStep === 4 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                                        4
                                    </div>
                                    <span>Review</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </header>

                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {/* Location dropdown */}
                        <div className="flex flex-col lg:flex-row rounded-2xl shadow-xl items-start lg:items-center mb-6 p-4 gap-5">
                            {(hasLocation && hasLocation.length > 1) && (
                                <div className="flex items-center space-x-6 mb-6">
                                    <label className="text-sm font-medium text-gray-700">
                                        Select Location:
                                    </label>
                                    <select
                                        value={selectedLocation}
                                        onChange={(e) => setSelectedLocation(e.target.value)}
                                        className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select a location</option>
                                        {hasLocation.map((loc) => (
                                            <option key={loc.Id} value={loc.Id}>
                                                {loc.LocationName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Vendor dropdown */}
                            {selectedLocation && (
                                <div className="flex items-center space-x-6 mb-6">
                                    <label className="text-sm font-medium text-gray-700">
                                        Select Vendor:
                                    </label>
                                    <select
                                        value={selectedVendor}
                                        onChange={(e) => handleVendorChange(e.target.value)}
                                        className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select a vendor</option>
                                        {vendors.map((vendor) => (
                                            <option key={vendor.Id} value={vendor.Id}>
                                                {vendor.VendorName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {selectedVendor && (
                            <div className="bg-white rounded-2xl shadow-xl p-6 space-y-10">
                                <h2 className="text-xl font-bold text-[#000060] mb-6">Step 1</h2>

                                {vendors
                                    .filter(vendor => vendor.Id === parseInt(selectedVendor))
                                    .map((vendor) => (
                                        <div key={vendor.Id} className="mb-4">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <p className="text-gray-700 ">
                                                    <span className="font-bold flex">Vendor Name </span>
                                                    <span>{vendor.VendorName}</span>
                                                </p>
                                                <p className="text-gray-700">
                                                    <span className="font-bold flex">Mobile Number</span>
                                                    <span>{vendor.MobNumber}</span>
                                                </p>
                                                <p className="text-gray-700">
                                                    <span className="font-bold flex">Address</span>
                                                    <span className="flex">{vendor.Address1} {vendor.Address2}</span>
                                                    <span>{vendor.City}</span>
                                                </p>
                                                <p className="text-gray-700">
                                                    <span className="font-medium flex">GST Number</span>
                                                    <span className="font-bold">{vendor.TAXNo}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                <div className="grid grid-cols-2 gap-8  bg-white text-gray-600">
                                    {/* Ship to Address Section */}
                                    <div className="flex">
                                        <p className="font-bold text-gray-500 mb-4">Ship to Address:</p>
                                        <div className="ml-4 text-gray-500">
                                            <p>{companiesData?.data?.data?.BillingAddress1 || 'N/A'} {companiesData?.data?.data?.BillingAddress2}</p>
                                            <p>
                                                {companiesData?.data?.data?.BillingCity}
                                                {companiesData?.data?.data?.BillingZipCode &&
                                                    ` - ${companiesData?.data?.data?.BillingZipCode}`
                                                }
                                            </p>
                                            <p>
                                                {companiesData?.data?.data?.State?.StateName}
                                                {companiesData?.data?.data?.Country?.CountryName &&
                                                    `, ${companiesData?.data?.data?.Country?.CountryName}`
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* PO Created Against Section */}
                                    <div className="flex items-baseline space-x-10">
                                        <p className="font-bold text-gray-500">PO Created Against:</p>
                                        <div className="flex space-x-4">
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="shiptoAddress"
                                                    value="new"
                                                    checked={formState.shiptoAddress === "new"}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-gray-700 font-medium">New Order</span>
                                            </label>

                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="shiptoAddress"
                                                    value="against"
                                                    checked={formState.shiptoAddress === "against"}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-gray-700 font-medium">Against Order</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center mt-6 space-x-20">
                                    <span className="text-gray-700 font-medium">Reference No : </span>
                                    <input
                                        type="text"
                                        name="referenceNo"
                                        value={formState.referenceNo}
                                        onChange={handleInputChange}
                                        placeholder="Enter Reference No"
                                        className="px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000060] focus:border-[#000060] transition-all "
                                    />
                                </div>

                                <div className="flex justify-end items-center space-x-2 mt-6">
                                    <button
                                        className="px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#0000a0] transition-colors flex items-center justify-center flex-1 sm:flex-none disabled:opacity-50"
                                        onClick={handleSubmit}
                                        disabled={!selectedVendor || !selectedLocation || !formState.shiptoAddress}
                                    >
                                        Save & Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Step 2: Options Selection */}
                {currentStep === 2 && (
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-xl p-6"
                    >
                        <h2 className="text-xl font-bold text-[#000060] mb-6">Step 2</h2>

                        <div className="flex justify-start gap-12">
                            {['Frame/Sunglass', 'Lens', 'Contact Lens', 'Accessories'].map((option) => (
                                <label
                                    key={option}
                                    htmlFor={`option-${option}`}
                                    className="flex items-center gap-2 cursor-pointer group"
                                >
                                    <input
                                        id={`option-${option}`}
                                        name="option"
                                        type="radio"
                                        checked={formState.selectedOption === option}
                                        onChange={() => handleOptionChange(option)}
                                        className="h-4 w-4 text-[#000060] focus:ring-[#000060] border-gray-300 cursor-pointer"
                                    />
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-[#000060] transition-colors">
                                        {option}
                                    </span>
                                </label>
                            ))}
                        </div>

                        <div className="flex justify-between items-center mt-8">
                            <button
                                onClick={handleBack}
                                className="px-4 py-2 border border-[#000060] text-[#000060] rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleNext}
                                className="px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#0000a0] transition-colors disabled:opacity-50"
                                disabled={!formState.selectedOption}
                            >
                                Next
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Order Selection */}
                {currentStep === 3 && (
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-xl p-6"
                    >
                        <h2 className="text-xl font-bold text-[#000060] mb-6">Step 3: Select Orders</h2>

                        <div className="flex justify-start gap-12 mb-6">
                            {vendors
                                .filter(vendor => vendor.Id === parseInt(selectedVendor))
                                .map((vendor) => (
                                    <div key={vendor.Id} className="mb-4">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <p className="text-gray-700 ">
                                                <span className="font-bold flex">Vendor Name </span>
                                                <span>{vendor.VendorName}</span>
                                            </p>
                                            <p className="text-gray-700">
                                                <span className="font-bold flex">Mobile Number</span>
                                                <span>{vendor.MobNumber}</span>
                                            </p>
                                            <p className="text-gray-700">
                                                <span className="font-bold flex">Address</span>
                                                <span className="flex">{vendor.Address1} {vendor.Address2}</span>
                                                <span>{vendor.City}</span>
                                            </p>
                                            <p className="text-gray-700">
                                                <span className="font-medium flex">GST Number</span>
                                                <span className="font-bold">{vendor.TAXNo}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        <div className="overflow-auto rounded-lg shadow">
                            <table className="min-w-full divide-y divide-neutral-200">
                                <thead className="bg-blue-50"> {/* bg-blue-50 */}
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase flex justify-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={selectAll}
                                                onChange={handleSelectAll}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-neutral-600 font-semibold">Bill</span>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">SL No.</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Order No.</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Product Details</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Buying Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Order Quantity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">PO Quantity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Avl Quantity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-neutral-200">
                                    {filteredOrderDetails.length > 0 ? (
                                        filteredOrderDetails.map((order, index) => (
                                            <tr key={order.orderDetailId} className={selectedOrders.includes(order.orderDetailId) ? "bg-neutral-50" : ""}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedOrders.includes(order.orderDetailId)}
                                                        onChange={() => handleOrderSelection(order.orderDetailId)}
                                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{order.orderPrefix}/{order.orderNo}/{order.slNo}</td>
                                                {formState.selectedOption === 'Lens' &&
                                                    <td className="px-6 py-4 whitespace-wrap">{order?.productDescName}
                                                        {/* R Row */}
                                                        {(order?.specs?.powerDetails?.right?.sphericalPower ||
                                                            order?.specs?.powerDetails?.right?.cylindricalPower ||
                                                            order?.specs?.powerDetails?.right?.axis ||
                                                            order?.specs?.powerDetails?.right?.additional) && (
                                                                <>
                                                                    <br />
                                                                    R: {order?.specs?.powerDetails?.right?.sphericalPower &&
                                                                        `SPH ${order?.specs?.powerDetails?.right?.sphericalPower > 0
                                                                            ? `+${order?.specs?.powerDetails?.right?.sphericalPower}`
                                                                            : order?.specs?.powerDetails?.right?.sphericalPower}`}
                                                                    {order?.specs?.powerDetails?.right?.cylindricalPower &&
                                                                        ` CYL ${order?.specs?.powerDetails?.right?.cylindricalPower > 0
                                                                            ? `+${order?.specs?.powerDetails?.right?.cylindricalPower}`
                                                                            : order?.specs?.powerDetails?.right?.cylindricalPower}`}
                                                                    {order?.specs?.powerDetails?.right?.axis &&
                                                                        ` Axis ${order?.specs?.powerDetails?.right?.axis > 0
                                                                            ? `+${order?.specs?.powerDetails?.right?.axis}`
                                                                            : order?.specs?.powerDetails?.right?.axis}`}
                                                                    {order?.specs?.powerDetails?.right?.additional &&
                                                                        ` Add ${order?.specs?.powerDetails?.right?.additional > 0
                                                                            ? `+${order?.specs?.powerDetails?.right?.additional}`
                                                                            : order?.specs?.powerDetails?.right?.additional}`}
                                                                </>
                                                            )}

                                                        {/* L Row */}
                                                        {(order?.specs?.powerDetails?.left?.sphericalPower ||
                                                            order?.specs?.powerDetails?.left?.cylindricalPower ||
                                                            order?.specs?.powerDetails?.left?.axis ||
                                                            order?.specs?.powerDetails?.left?.additional) && (
                                                                <>
                                                                    <br />
                                                                    L: {order?.specs?.powerDetails?.left?.sphericalPower &&
                                                                        `SPH ${order?.specs?.powerDetails?.left?.sphericalPower > 0
                                                                            ? `+${order?.specs?.powerDetails?.left?.sphericalPower}`
                                                                            : order?.specs?.powerDetails?.left?.sphericalPower}`}
                                                                    {order?.specs?.powerDetails?.left?.cylindricalPower &&
                                                                        ` CYL ${order?.specs?.powerDetails?.left?.cylindricalPower > 0
                                                                            ? `+${order?.specs?.powerDetails?.left?.cylindricalPower}`
                                                                            : order?.specs?.powerDetails?.left?.cylindricalPower}`}
                                                                    {order?.specs?.powerDetails?.left?.axis &&
                                                                        ` Axis ${order?.specs?.powerDetails?.left?.axis > 0
                                                                            ? `+${order?.specs?.powerDetails?.left?.axis}`
                                                                            : order?.specs?.powerDetails?.left?.axis}`}
                                                                    {order?.specs?.powerDetails?.left?.additional &&
                                                                        ` Add ${order?.specs?.powerDetails?.left?.additional > 0
                                                                            ? `+${order?.specs?.powerDetails?.left?.additional}`
                                                                            : order?.specs?.powerDetails?.left?.additional}`}
                                                                </>
                                                            )}

                                                        {order?.specs?.addOn?.addOnId && (<><br /> <span className="font-medium">AddOn: {order?.specs?.addOn?.addOnName}</span></>)}
                                                        {order?.specs?.tint?.tintCode && (<><br /><span className="font-medium">Tint: {order?.specs?.tint?.tintName}</span></>)}
                                                        {order?.hSN && (<><br /><span className="font-medium">HSN: {order?.hSN}</span></>)}
                                                    </td>
                                                }
                                                {formState.selectedOption === 'Frame/Sunglass' &&
                                                    <td className="px-6 py-4 whitespace-wrap">{order?.productDescName}
                                                        <br></br>{order?.size}-{order?.dBL}-{order?.templeLength}
                                                        <br></br>{order?.category === 0 ? `Sunglass` : `OpticalFrame`}
                                                        <br></br>{order?.barcode && `Barcode: ` + order?.barcode}
                                                        <br></br>{order?.hSN && `HSN: ` + order?.hSN}
                                                    </td>
                                                }
                                                {formState.selectedOption === 'Accessories' &&
                                                    <td className="px-6 py-4 whitespace-wrap">{order?.productDescName}
                                                        {order?.variationName && (<><br/>Variation: {order?.variationName}</>)}
                                                        {order?.barcode && (<><br/>Barcode: {order?.barcode}</>)}
                                                        {order?.hSN && (<><br/>HSN: {order?.hSN}</>)}
                                                    </td>
                                                }
                                                {formState.selectedOption === 'Contact Lens' &&
                                                    <td className="px-6 py-4 whitespace-wrap">{order?.productDescName}
                                                        <br></br>{order?.sphericalPower && (`Sph: `+ (order?.sphericalPower >0 ? `+`+order?.sphericalPower : order?.sphericalPower))}
                                                        {order?.cylindricalPower && (` Cyld: `+ (order?.cylindricalPower > 0 ? `+`+order?.cylindricalPower : order?.cylindricalPower))}
                                                        {order?.axis && (` Axis: ` + (order?.cylindricalPower>0 ? `+`+order?.cylindricalPower : order?.cylindricalPower))}
                                                        {order?.additional && (` Add: ` + (order?.additional>0 ? `+`+order?.additional : order?.additional))}
                                                        {order?.color && (<><br/>Clr: {order?.color>0}</> )}
                                                        {order?.barcode && (<><br/>Barcode: {order?.barcode}</>)}
                                                        {order?.hSN && (<><br/>HSN: {order?.hSN}</>)}
                                                    </td>
                                                }
                                                <td className="px-6 py-4 whitespace-nowrap">{order?.pricing?.buyingPrice}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">{order?.orderQty}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">{order?.orderQty - order?.billedQty - order?.cancelledQty}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">{order?.pricing?.quantity}</td>
                                                {/* <td className="px-6 py-4 whitespace-nowrap">{((order?.pricing?.buyingPrice * order?.orderQty) + (order?.pricing?.buyingPrice * order?.orderQty * (order?.taxPercentage / 100))).toFixed(2)}</td> */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {formState.selectedOption === "Lens" ? (
                                                        // Optical Lens calculation
                                                        (() => {
                                                            const bothLens = order?.specs?.powerDetails?.bothLens === 1;
                                                            const buyingPrice = parseFloat(order?.pricing?.buyingPrice || 0);
                                                            const orderQty = parseInt(order?.orderQty || 0, 10);

                                                            // Tint buying price
                                                            const tintBuying =
                                                                parseFloat(order?.specs?.tint?.tintBuyingPrice || 0) || 0;

                                                            // Sum of addon buying prices
                                                            const addonBuying = Array.isArray(order?.specs?.addOn)
                                                                ? order.specs.addOn.reduce(
                                                                    (sum, add) => sum + (parseFloat(add?.addOnBuyingPrice || 0) || 0),
                                                                    0
                                                                )
                                                                : parseFloat(order?.specs?.addOn?.addOnBuyingPrice || 0) || 0;

                                                            // Calculate base
                                                            let total;
                                                            if (bothLens) {
                                                                total = buyingPrice * orderQty + tintBuying + addonBuying;
                                                            } else {
                                                                total =
                                                                    buyingPrice * orderQty + tintBuying / 2 + addonBuying / 2;
                                                            }

                                                            // Add tax
                                                            const totalWithTax =
                                                                total + total * (parseFloat(order?.taxPercentage) / 100 || 0);

                                                            return totalWithTax.toFixed(2);
                                                        })()
                                                    ) : (
                                                        // Default calculation
                                                        (
                                                            (order?.pricing?.buyingPrice * order?.orderQty) +
                                                            (order?.pricing?.buyingPrice *
                                                                order?.orderQty *
                                                                (order?.taxPercentage / 100))
                                                        ).toFixed(2)
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                                                No orders found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center mt-8">
                            <button
                                onClick={handleBack}
                                className="px-4 py-2 border border-[#000060] text-[#000060] rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Back
                            </button>
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-700 font-medium">
                                    Selected: {selectedOrders.length} orders
                                </span>
                                <button
                                    onClick={handleSubmitPODetails}
                                    // onClick={handleNext}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                                    disabled={selectedOrders.length === 0}
                                >
                                    Save & Next
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Step 4: Review Selected Orders */}
                {currentStep === 4 && (
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-xl p-6"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-[#000060] ">Step 4: Review Selected Orders</h2>
                            <div className="flex gap-2 py-4">
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#0000a0] transition-colors disabled:opacity-50"
                                >
                                    Add PO
                                </button>
                                <button
                                    onClick={handleBack}
                                    className="px-4 bg-[#000060] text-white rounded-lg hover:bg-[#0000a0] transition-colors disabled:opacity-50"
                                >
                                    Back
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-start gap-12 mb-6">
                            {vendors
                                .filter(vendor => vendor.Id === parseInt(selectedVendor))
                                .map((vendor) => (
                                    <div key={vendor.Id} className="mb-4">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <p className="text-gray-700 ">
                                                <span className="font-bold flex">Vendor Name </span>
                                                <span>{vendor.VendorName}</span>
                                            </p>
                                            <p className="text-gray-700">
                                                <span className="font-bold flex">Mobile Number</span>
                                                <span>{vendor.MobNumber}</span>
                                            </p>
                                            <p className="text-gray-700">
                                                <span className="font-bold flex">Address</span>
                                                <span className="flex">{vendor.Address1} {vendor.Address2}</span>
                                                <span>{vendor.City}</span>
                                            </p>
                                            <p className="text-gray-700">
                                                <span className="font-medium flex">GST Number</span>
                                                <span className="font-bold">{vendor.TAXNo}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        <div className="overflow-auto rounded-lg shadow">
                            <table className="min-w-full divide-y divide-neutral-200">
                                <thead className="bg-blue-50"> {/* bg-blue-50 */}
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">SL No.</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Order No.</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Product Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Barcode</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Product Details</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Buying Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Order Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">PO Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Avl. Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Total Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredOrderDetails
                                        .filter(order => selectedOrders.includes(order.orderDetailId))
                                        .map((order, index) => (
                                            <tr key={order.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{order.orderPrefix}/{order.orderNo}/{order.slNo}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{formState?.selectedOption}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{order?.barcode}</td>
                                                {formState.selectedOption === 'Lens' &&
                                                    <td className="px-6 py-4 whitespace-wrap">{order?.productDescName}
                                                        <br></br>Right: {order?.specs?.powerDetails?.right?.sphericalPower || 0.00} Left: {order?.specs?.powerDetails?.left?.sphericalPower || 0.00}
                                                    </td>
                                                }
                                                {formState.selectedOption === 'Frame/Sunglass' &&
                                                    <td className="px-6 py-4 whitespace-wrap">{order?.productDescName}
                                                        <br></br>{order?.barcode}
                                                    </td>
                                                }
                                                {formState.selectedOption === 'Accessories' &&
                                                    <td className="px-6 py-4 whitespace-wrap">{order?.productDescName}
                                                        <br></br>{order?.variationName}
                                                    </td>
                                                }
                                                {formState.selectedOption === 'Contact Lens' &&
                                                    <td className="px-6 py-4 whitespace-wrap">{order?.productDescName}
                                                        <br></br>Sph: {order?.sphericalPower ?? 0}
                                                    </td>
                                                }
                                                <td className="px-6 py-4 whitespace-nowrap">{order?.pricing?.buyingPrice}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{order?.orderQty}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{order?.orderQty - order?.billedQty - order?.cancelledQty}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{order?.pricing?.quantity}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {(order?.pricing?.buyingPrice * (order?.orderQty - order?.billedQty - order?.cancelledQty)).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleRemoveOrder(order.id)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Calculation Summary Section */}
                        {/* <div className="flex ">

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Quantity:</span>
                                    <span className="font-medium">
                                        {filteredOrderDetails
                                            .filter(order => selectedOrders.includes(order.id))
                                            .reduce((total, order) => total + (order.orderQty - order.billedQty - order.cancelledQty), 0)}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Gross Value:</span>
                                    <span className="font-medium">
                                        ₹{filteredOrderDetails
                                            .filter(order => selectedOrders.includes(order.id))
                                            .reduce((total, order) => {
                                                const quantity = order.orderQty - order.billedQty - order.cancelledQty;
                                                return total + (order.pricing?.buyingPrice * quantity);
                                            }, 0)
                                            .toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total GST:</span>
                                    <span className="font-medium">
                                        ₹{filteredOrderDetails
                                            .filter(order => selectedOrders.includes(order.id))
                                            .reduce((total, order) => {
                                                const quantity = order.orderQty - order.billedQty - order.cancelledQty;
                                                const taxPercentage = order.taxPercentage || 0;
                                                return total + (order.pricing?.buyingPrice * quantity * (taxPercentage / 100));
                                            }, 0)
                                            .toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex justify-between border-t pt-2">
                                    <span className="text-gray-700 font-bold">Total Net Value:</span>
                                    <span className="text-[#000060] font-bold">
                                        ₹{calculateTotalAmount().toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div> */}

                        {/* Remarks Section */}
                        {/* <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-bold text-gray-700 mb-4">Additional Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
                                        Remarks
                                    </label>
                                    <textarea
                                        id="remarks"
                                        name="remarks"
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#000060]"
                                        placeholder="Any additional notes or instructions..."
                                    />
                                </div>

                                <div>
                                    <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1">
                                        Expected Delivery Date
                                    </label>
                                    <input
                                        type="date"
                                        id="deliveryDate"
                                        name="deliveryDate"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#000060]"
                                    />
                                </div>
                            </div>
                        </div> */}

                        <div className="flex justify-between items-center mt-8">
                            <button
                                onClick={handleBack}
                                className="px-4 py-2 border border-[#000060] text-[#000060] rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Back
                            </button>
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-700 font-bold">
                                    Total Amount: ₹{calculateTotalAmount().toFixed(2)}
                                </span>
                                <button
                                    onClick={handleSubmit}
                                    className="px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#0000a0] transition-colors disabled:opacity-50"
                                >
                                    Complete Purchase Order
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </>
    );
};