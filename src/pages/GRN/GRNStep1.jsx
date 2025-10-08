import { useEffect, useState } from "react";
import { data, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Autocomplete, TextField } from "@mui/material";
import Input from "../../components/Form/Input";
import { toast } from "react-hot-toast";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useGetAllLocationsQuery } from "../../api/roleManagementApi";
import { useGetAllvendorByLocationQuery } from "../../api/vendorApi";
import { useGetCompanySettingsQuery } from "../../api/companySettingsApi";
import { useCheckDocNoUniqueQuery, useGetGRNDetailsMutation, useGetGRNMainMutation, useUpdateGRNMainMutation } from "../../api/grnApi";
import { useSaveGRNMainMutation } from "../../api/grnApi";
import { useGRN } from "../../features/GRNContext";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";



export default function GRNStep1() {

    const navigate = useNavigate();

    // Context
    const { grnData, setGRNData, currentStep, setCurrentStep, updateStep1Data, nextStep } = useGRN();

    // App states
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: "", message: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedVendor, setSelectedVendor] = useState("");
    const { user, hasMultipleLocations } = useSelector((state) => state.auth);
    const [vendors, setVendors] = useState([]);
    const [vendorInput, setVendorInput] = useState(null);
    const [error, setError] = useState({
        documentNo: null,
        documentDate: null,
        billingMethod: null,
        againstPO: null,
    });
    const [formState, setFormState] = useState({
        selectedGRNOptions: "order",
        vendorDetails: grnData.step1.vendorDetails,
        documentNo: grnData.step1.documentNo,
        documentDate: grnData.step1.documentDate ?? new Date(),
        billingMethod: grnData.step1.billingMethod || "invoice",
        againstPO: String(grnData.step1.againstPO || 1),
        grnMainId: grnData.step1.GrnMainId
    });
    const [grnViewDetails, setGrnViewDetails] = useState([]);


    // Mutation--------------------------------------------------------------------------------------------------------------------
    const [SaveGRNMain] = useSaveGRNMainMutation();
    const [getGRNDetails] = useGetGRNDetailsMutation();
    const [grnMainData] = useGetGRNMainMutation();
    const [updateGRNMain] = useUpdateGRNMainMutation();

    // Query-----------------------------------------------------------------------------------------------------------------------
    const { data: allLocations } = useGetAllLocationsQuery();
    const { data: vendorData } = useGetAllvendorByLocationQuery(
        { id: selectedLocation },
        { skip: !selectedLocation }
    );

    // User assigned locations
    const hasLocation = allLocations?.data ? allLocations?.data?.filter(loc =>
        hasMultipleLocations.includes(loc.Id)
    ) : [];

    const { data: companySettingsData, error: companySettingsError } = useGetCompanySettingsQuery(
        { id: selectedLocation || hasLocation?.[0]?.Id || '' },
        { skip: !selectedLocation && !hasLocation?.[0]?.Id }
    );

    const { data: isUniqueResponse, refetch: checkDocNoUnique } = useCheckDocNoUniqueQuery(
        { docNo: formState.documentNo, vendorId: formState.vendorDetails?.Id, companyId: selectedLocation, grnMainId: (grnData?.step1?.GrnMainId || null) },
        {
            skip: (!formState.documentNo || !formState.vendorDetails?.Id || !selectedLocation),
            refetchOnMountOrArgChange: true  // Always refetch to get latest data
        }
    )

    console.log("isUniqueResponse ------------------ ", isUniqueResponse);

    const isUnique = isUniqueResponse?.isUnique;



    // UseEffects as per screens---------------------------------------------------------------------------------------------------

    // Call fetch vendor data
    useEffect(() => {
        if (vendorData?.data?.data) {
            setVendors(vendorData?.data?.data);
        }
    }, [vendorData]);

    // Auto select location if it has only 1.
    useEffect(() => {
        if (hasLocation?.length === 1) {
            setSelectedLocation(hasLocation[0].Id.toString());
        }
    }, [hasLocation]);

    useEffect(() => {
        if (formState.documentNo && formState.vendorDetails?.Id && selectedLocation) {
            checkDocNoUnique();
        }
    }, [formState.documentNo, formState.vendorDetails?.Id, selectedLocation, checkDocNoUnique]);

    // fetch draft on vendor and against order changes
    useEffect(() => {
        const fetchGRNMain = async () => {
            const payload = {
                companyId: selectedLocation,
                vendorId: selectedVendor,
                againstPo: formState?.againstPO,
                applicationUserId: user?.Id
            }

            console.log(" payload ", payload);

            const GRNMainResponse = await grnMainData(payload).unwrap();

            if (GRNMainResponse.data.length > 0) {

                const grnMainId = GRNMainResponse.data[0]?.Id;
                console.log("grnMainId ------------ ", grnMainId);
                const vendorDocDate = GRNMainResponse.data[0]?.VendorDocDate;

                const dateObj = vendorDocDate ? new Date(vendorDocDate) : null;

                updateStep1Data({
                    GrnMainId: GRNMainResponse.data[0]?.Id,
                    selectedLocation: parseInt(selectedLocation),
                    selectedVendor: parseInt(selectedVendor),
                    againstPO: formState?.againstPO
                });
                setFormState((prev) => ({
                    ...prev,
                    documentNo: GRNMainResponse.data[0]?.VendorDocNo,
                    documentDate: dateObj
                }));
                return;

            } else {
                setFormState((prev) => ({
                    ...prev,
                    documentNo: "",
                    documentDate: new Date()
                }));
                updateStep1Data({
                    GrnMainId: null,
                    selectedLocation: parseInt(selectedLocation),
                    selectedVendor: parseInt(selectedVendor),
                    againstPO: null
                });
            }
        }

        fetchGRNMain();
    }, [selectedVendor, formState.againstPO])



    // Handler functions ----------------------------------------------------------------------------------------------------------

    const handleVendorChange = (vendorId) => {
        setSelectedVendor(vendorId);
        const vendor = vendors.find(v => v.Id === parseInt(vendorId));
        setFormState(prev => ({
            ...prev,
            vendorDetails: vendor
        }));
        // Clear documentNo error when vendor changes
        setError(prev => ({ ...prev, documentNo: null }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (name === 'documentNo') {
            setError(prev => ({ ...prev, documentNo: null }));
        }
    };
    const handleDateChange = (newDate) => {
        setFormState(prev => ({
            ...prev,
            documentDate: newDate
        }));

        // Clear error when date is selected
        setError(prev => ({ ...prev, documentDate: null }));
    };


    const handleSubmitGRNMain = async () => {
        setIsLoading(true);

        // 1. Check if GRN main and detail entry exists
        try {

            if (grnData?.step1?.GrnMainId) {

                const grnMainPayload = {
                    grnMain: grnData.step1.GrnMainId,
                    docNo: formState.documentNo,
                    docDate: formState.documentDate
                }

                const grnResponse = await updateGRNMain(grnMainPayload);

                console.log("grnResponse ---------------- ", grnResponse);

                // console.log("Grn REsponse ================== ", grnResponse.data.status);
                if (grnResponse.data.status === 'success') {
                    const body = {
                        companyId: selectedLocation,
                        vendorId: formState?.vendorDetails?.Id,
                        againstPo: formState?.againstPO,
                        applicationUserId: user?.Id,
                        grnMain: grnData?.step1?.GrnMainId,
                        status: 0
                    }

                    const grnDataResponse = await getGRNDetails(body);
                    console.log("grnDataResponse --------------- ", grnDataResponse.data.data);

                    setGRNData(prev => ({
                        ...prev,
                        step1: {
                            ...prev.step1,
                            vendorDetails: formState.vendorDetails,
                            documentNo: formState.documentNo,
                            documentDate: formState.documentDate,
                            billingMethod: formState.billingMethod,
                            againstPO: formState?.againstPO
                        }
                    }));

                    if (grnDataResponse?.data?.data && grnDataResponse?.data?.data.length > 0) {
                        setCurrentStep(5);
                        return;
                    }
                }

                nextStep();
                return;
            }

            const payload = {
                companyId: selectedLocation,
                vendorId: formState?.vendorDetails?.Id,
                againstPo: formState?.againstPO,
                applicationUserId: user?.Id,
                // grnMain: grnData?.step1?.GrnMainId 
            }

            console.log("fetchGRNDetails payload -------------- ", payload);
            const response = await getGRNDetails(payload);

            if (response?.data?.data.length > 0) {
                console.log("getAllGRNDetails response -------------- ", response?.data);
                setGRNData(prev => ({
                    ...prev,
                    step1: {
                        ...prev.step1,
                        selectedLocation: parseInt(selectedLocation),
                        selectedVendor: formState.vendorDetails?.Id,
                        GrnMainId: response?.data?.data[0]?.GrnMainId,
                        vendorDetails: formState.vendorDetails,
                        documentNo: formState.documentNo,
                        documentDate: formState.documentDate,
                        billingMethod: formState.billingMethod,
                        againstPO: formState?.againstPO
                    }
                }));
                // setCurrentStep(5);
                // return;
                // return;
                // setGrnViewDetails(response?.data?.data || []);
            }
        } catch (error) {
            console.error("Error fetching GRN details:", error);
            toast.error("Failed to fetch GRN details. Please try again.");
        }

        // 2. Check if Document No is unique
        if (isUnique === false) {
            setError(prev => ({ ...prev, documentNo: "Document number must be unique for this vendor" }));
            return;
        }

        if (isUnique === undefined || isUniqueResponse === undefined) {
            toast.loading("Checking document number uniqueness...");
            try {
                const uniquenessResult = await checkDocNoUnique().unwrap();
                if (!uniquenessResult?.isUnique) {
                    setError(prev => ({ ...prev, documentNo: "Document number must be unique for this vendor" }));
                    toast.dismiss();
                    return;
                }
            } catch (error) {
                toast.error("Error checking document number");
                return;
            }
        }
        // console.log("selectedLocation ----------- ", selectedLocation);

        // Update context with step1 data
        updateStep1Data({
            selectedLocation: parseInt(selectedLocation),
            selectedVendor: formState.vendorDetails?.Id,
            vendorDetails: formState.vendorDetails,
            documentNo: formState.documentNo,
            documentDate: formState.documentDate,
            billingMethod: formState.billingMethod,
            againstPO: formState?.againstPO,
            grnType: formState?.billingMethod
        });

        // 3. Save the GRN main entry in db
        const payload = {
            companyId: parseInt(selectedLocation),
            vendorId: formState.vendorDetails?.Id,
            inState: formState?.vendorDetails?.StateID === companySettingsData?.data?.data?.Company?.State?.Id ? 0 : 1,
            vendorDocNo: formState.documentNo,
            vendorDocDate: formState.documentDate,
            grnByMethod: 1,         // GRN by Order 1 : 0 (DC)
            grnType: formState.billingMethod === "invoice" ? 0 : 1,             // GRN Type 0 : Invoice and 1 : DC
            againstPO: formState?.againstPO,
            applicationUserId: user.Id
        }


        console.log("saveGRNpayload -------------- ", payload);

        // const response = await SaveGRNMain(payload).unwrap();
        // console.log(" GRN main save response ------------------ ", response);

        try {
            const response = await SaveGRNMain(payload).unwrap();
            console.log("GRN main save response:", response);

            if (response.status === "success") {
                toast.success("GRN main entry created successfully");

                // Save GrnMainId in context
                updateStep1Data({ GrnMainId: response?.data?.data.Id });

                // Move to next step
                nextStep();
                // navigate('/grn/create/step2'); // Or use your routing structure

            } else {
                toast.error("Failed to create GRN main entry");
                return;
            }

        } catch (error) {
            console.error("Error saving GRN:", error);
            toast.error("Failed to save GRN");
        } finally {
            setIsLoading(false);
        }

    }


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

                {/* Step 1: GRN Main Information */}
                {currentStep === 1 && (
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {/* Location dropdown */}
                        <div className=" lg:flex-row rounded-2xl shadow-xl items-start lg:items-center mb-6 p-4 gap-5">
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

                                    <Autocomplete
                                        options={vendors}
                                        getOptionLabel={(option) => option.VendorName}
                                        onInputChange={(event, value) => {
                                            setVendorInput(value);
                                        }}
                                        onChange={(event, newValue) => {
                                            if (newValue) {
                                                setVendorInput(newValue.VendorName);
                                                handleVendorChange(newValue?.Id)
                                            }
                                        }}
                                        value={
                                            vendors.find((b) => b.Id === formState.vendorDetails?.Id) ||
                                            vendors.find((b) => b.VendorName === vendorInput) ||
                                            null
                                        }
                                        isOptionEqualToValue={(option, value) =>
                                            option.Id === value.Id
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Search Vendor"
                                                variant="outlined"
                                                fullWidth
                                            />
                                        )}
                                        sx={{ width: 400 }}
                                    />
                                </div>
                            )}
                        </div>


                        {(selectedVendor || formState.vendorDetails?.Id) && (
                            <div className="bg-white rounded-2xl shadow-xl p-6 space-y-10">
                                <h2 className="text-xl font-bold text-[#000060] mb-6">Step 1</h2>

                                {vendors
                                    .filter(vendor => vendor.Id === parseInt(selectedVendor || formState.vendorDetails?.Id))
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
                                                    <span className="font-bold flex">GST Number</span>
                                                    <span className="flex">{vendor.TAXNo}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                <div className="flex gap-8">
                                    <div className="flex items-center mt-6 space-x-20">
                                        <Input
                                            label="Document No *"
                                            name="documentNo"
                                            onChange={handleInputChange}
                                            value={formState.documentNo || ""}
                                            error={isUnique === false ? "Document number must be unique for this vendor" : error.documentNo || ""}
                                            helperText={error.documentNo || "Must be unique for this vendor"}
                                        />
                                    </div>
                                    {console.log(formState?.documentDate)}
                                    <div className="flex items-center mt-6 space-x-20">
                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                            <DatePicker
                                                label="Document Date *"
                                                value={formState?.documentDate}
                                                onChange={handleDateChange}
                                                name="documentDate"
                                                maxDate={new Date()}
                                                format="dd/MM/yyyy"
                                            // renderInput={(params) => (
                                            //     <TextField
                                            //         {...params}
                                            //         size="small"
                                            //         fullWidth
                                            //         variant="outlined"
                                            //     />
                                            // )}
                                            />
                                        </LocalizationProvider>
                                    </div>
                                    <div className="flex items-center space-x-10">
                                        <div className="flex space-x-4">
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="billingMethod"
                                                    value="invoice"
                                                    checked={formState.billingMethod === "invoice"}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-gray-700 font-medium">Invoice</span>
                                            </label>

                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="billingMethod"
                                                    value="dc"
                                                    checked={formState.billingMethod === "dc"}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-gray-700 font-medium">DC</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-8">
                                    <div className="flex items-center space-x-10">
                                        <p className="font-bold text-gray-500">Against Purchase Order:</p>
                                        <div className="flex space-x-4">
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="againstPO"
                                                    value="1"
                                                    checked={formState.againstPO === "1"}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-gray-700 font-medium">Yes</span>
                                            </label>

                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="againstPO"
                                                    value="0"
                                                    checked={formState.againstPO === "0"}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-gray-700 font-medium">No</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end items-center space-x-2 mt-6">
                                    <button
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center flex-1 sm:flex-none"
                                        onClick={handleSubmitGRNMain}
                                        disabled={(!selectedVendor && !formState.vendorDetails?.Id) || !selectedLocation || !formState.documentNo || !formState.documentDate || isUnique === false || isLoading}
                                    >
                                        {isLoading ? "Saving..." : "Save & Next"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}


            </motion.div>
        </>
    )
}