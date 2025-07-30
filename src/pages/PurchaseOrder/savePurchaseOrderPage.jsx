import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Check,
    AlertCircle,
} from "lucide-react";

import { useSelector } from "react-redux";
import { useGetAllLocationsQuery } from "../../api/roleManagementApi";
import { useGetAllVendorMutation } from "../../api/vendorApi";
import { useSavePurchaseOrderMutation } from "../../api/purchaseOrderApi";
import { useGetCompanySettingsQuery } from "../../api/companySettingsApi";

export default function SavePurchaseOrder() {
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: "", message: "" });
    const [selectedLocation, setSelectedLocation] = useState(null);
    const { data: allLocations } = useGetAllLocationsQuery();
    const [vendors, setVendors] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState("");
    const [formState, setFormState] = useState({
        shiptoAddress: "against", // 'new' or 'against'
        referenceNo: "",
        vendorDetails: null
    });
    const [companyDetails, setCompanyDetails] = useState(null);

    const { user, hasMultipleLocations } = useSelector((state) => state.auth);
    const [getAllVendor] = useGetAllVendorMutation();
    const [SavePurchaseOrder] = useSavePurchaseOrderMutation();
    const { data: companySettingsData, error: companySettingsError } = useGetCompanySettingsQuery(
        { id: selectedLocation },
        { skip: !selectedLocation }
    );

    // User assigned locations
    const hasLocation = allLocations?.data?.filter(loc =>
        hasMultipleLocations.includes(loc.Id)
    );

    console.log("User Locations:", hasLocation);

    const fetchVendors = async (locationId) => {
        if (!locationId) return;

        try {
            const payload = { company_id: parseInt(locationId) };
            const response = await getAllVendor(payload).unwrap();
            console.log("Fetched Vendors:", response);
            if (response?.data?.data) {
                setVendors(response.data.data);
                setSelectedVendor(""); // Reset selected vendor when location changes
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
        if (selectedVendor) {
            const vendor = vendors.find(v => v.Id === parseInt(selectedVendor));
            setFormState(prev => ({
                ...prev,
                vendorDetails: vendor
            }));
        }
    }, [selectedVendor, vendors]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            // Validate form
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

            // Prepare payload
            const payload = {
                companyId: parseInt(selectedLocation),
                vendorId: parseInt(selectedVendor),
                poPrefix: companySettingsData?.data?.data?.POPrefix || "",
                inState: formState?.vendorDetails?.MultiDelivery === 1 ? 0 : 1,
                againstOrder: formState.shiptoAddress === "against" ? 1 : 0,
                shiptoCompanyId: formState?.vendorDetails?.MultiDelivery === 1 ? parseInt(selectedLocation) : formState?.vendorDetails?.DeliveryLocationId,
                poReferenceNo: formState.referenceNo || "",
            };

            console.log("Payload for Purchase Order:", payload);
            // Call API
            const response = await SavePurchaseOrder({ id: user.Id, payload }).unwrap();
            console.log("Purchase Order Response:", response);
            if (response.status === "success") {
                setAlertMessage({
                    type: "success",
                    message: "Purchase order created successfully"
                });
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
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

    // Render company details if needed
    console.log("Company Details:", companySettingsData?.data);

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
                                Purchase Order
                            </h1>
                        </div>
                    </motion.div>
                </header>

                {/* Location dropdown */}
                <AnimatePresence>
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex flex-col lg:flex-row rounded-2xl shadow-xl items-start lg:items-center mb-6 p-4 gap-5"
                    >
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
                                    onChange={(e) => setSelectedVendor(e.target.value)}
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
                    </motion.div>
                </AnimatePresence>

                {selectedVendor && (
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-xl p-6 "
                    >
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
                                            <span>{vendor.TAXNo}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}

                        <div className="flex mt-6 space-x-16">
                            <p className="text-gray-700 "><span className="font-bold flex">Ship to address :  </span></p>
                            <div className="flex items-center space-x-15">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="shiptoAddress"
                                        value="new"
                                        checked={formState.shiptoAddress === "new"}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700 font-medium">New Order</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="shiptoAddress"
                                        value="against"
                                        checked={formState.shiptoAddress === "against"}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700 font-medium">Against Order</span>
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
                    </motion.div>
                )}
            </motion.div>
        </>
    );
};