import { useEffect, useState } from "react";
import { data, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Autocomplete, TextField } from "@mui/material";
import { toast } from "react-hot-toast";
import {
    ArrowLeft,
    Check,
    AlertCircle,
    Trash2,
    PenIcon,
    PenBoxIcon,
    PenLineIcon,
    SearchIcon,
    RefreshCcw,
    HardDriveDownload,
    Plus
} from "lucide-react";
import { Table, TableRow, TableCell } from "../../components/Table";
import Input from "../../components/Form/Input";
import Button from "../../components/ui/Button";
import { useSelector } from "react-redux";
import { useGetAllLocationsQuery } from "../../api/roleManagementApi";
import { useGetAllVendorMutation, useGetAllvendorByLocationQuery } from "../../api/vendorApi";
import {
    useSavePurchaseOrderDetailsMutation,
    useSavePurchaseOrderMutation,
    useGetAllPoDetailsMutation,
    useUpdatePoBuyingPriceMutation,
    useUpdatePoQtyMutation,
    useDeletePoMutation,
    useUpdatePoMainMutation,
    useLazyGetOlByBarcodeQuery,
    useGetOlByDetailIdMutation,
    useGetAllPoDetailsForNewOrderMutation,
    useGetPOMainMutation,
    useUpdatePOMainDataMutation
} from "../../api/purchaseOrderApi";
import { useGetCompanySettingsQuery } from "../../api/companySettingsApi";
import { useGetCompanyByIdQuery } from "../../api/companiesApi";
import {
    useGetOrderDetailsAllMutation,
    useLazyGetByBarCodeQuery,
    useLazyGetByBrandAndModalQuery,
    useLazyFetchBarcodeForAccessoryQuery,
    useLazyGetByBrandAndProductNameQuery,
    useGetModalitiesQuery,
    useGetProductNamesByModalityQuery,
    useGetPowerDetailsMutation,
    useGetFocalityQuery,
    useGetFamilyQuery,
    useGetProductDesignQuery,
    useGetIndexValuesQuery,
    useGetCoatingsQuery,
    useGetTreatmentsQuery,
    useGetDIaDetailsMutation
} from "../../api/orderApi";
import { useGetContactLensDetailsMutation } from "../../api/clBatchDetailsApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { PurchaseOrderStep2 } from "./PurchaseOrderStep2";
import { POAgainstOrderTableComponent, PurchaseOrderVendorSection } from "./PurchaseOrderStep3";
import { POAccessoriesScannedTable, POCLScannedTable, POFrameScannedTable, POLensScannedTable } from "./POScannedTables";
import { set } from "react-hook-form";
import { POCLpowerSearchTable, POFrameSearchTable, POolSearchTable } from "./POSearchTable";
import { calculateTotalQuantity, calculateTotalAmount, calculateTotalGrossValue, calculateTotalGST, calculateTotalNetValue } from "./helperFunction";

export default function SavePurchaseOrder() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: "", message: "" });
    const [selectedLocation, setSelectedLocation] = useState(null);
    const { data: allLocations } = useGetAllLocationsQuery();
    const [filteredOrderDetails, setFilteredOrderDetails] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState("");
    const [formState, setFormState] = useState({
        shiptoAddress: "against",           // 'new' or 'against'
        referenceNo: "",
        vendorDetails: null,
        selectedOption: "",                 // For step 2 radio buttons
        remarks: "",
        EntryType: "combined",
        barcode: "",
        productType: "Stocks"
    });
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [savedPODetails, setSavedPODetails] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [createdPOMainId, setCreatedPOMainId] = useState(null);
    const { user, hasMultipleLocations } = useSelector((state) => state.auth);
    const [poreviewDetails, setPoreviewDetails] = useState([]);
    const [editPriceModalOpen, setEditPriceModalOpen] = useState(false);
    const [editQtyModalOpen, setEditQtyModalOpen] = useState(false);
    const [currentEditingItem, setCurrentEditingItem] = useState(null);
    const [editedBuyingPrice, setEditedBuyingPrice] = useState('');
    const [editedPoQty, setEditedPoQty] = useState('');
    const [qtyError, setQtyError] = useState('');
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [orderToRemove, setOrderToRemove] = useState(null);
    const [scannedItems, setScannedItems] = useState([]);
    const [showSearchInputs, setShowSearchInputs] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchTerm2, setSearchTerm2] = useState('');
    const [brandInput, setBrandInput] = useState(""); // for user typing
    const [brandId, setBrandId] = useState(null); // selected BrandGroupID
    const [modelNo, setModelNo] = useState("");
    const [productName, setProductName] = useState("");
    const [modalityInput, setModalityInput] = useState("");
    const [modalityId, setModalityId] = useState(null);
    const [productInput, setProductInput] = useState("");
    const [productId, setProductId] = useState(null);
    const [filteredBrands, setFilteredBrands] = useState([]);
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
    const [searchFethed, setSearchFetched] = useState(false);
    const [errors, setErrors] = useState({});
    const [selectedRows, setSelectedRows] = useState([]);
    const [clSearchedItems, setClSearchedItems] = useState([]);
    const [olPowerDia, setOlPowerDia] = useState([]);
    const [olItemsStack, setOlItemStack] = useState({
        productType: "Stocks",
        focality: null,
        family: null,
        design: null,
        index: null,
        coating: null,
        treatment: null,
        productName: null,
        masterId: null,
        coatingCombo: null,
        olDetailId: null
    })

    const { data: vendorData } = useGetAllvendorByLocationQuery(
        { id: selectedLocation },
        { skip: !selectedLocation }
    );

    const [triggerBarcodeQuery, {
        data: frameData,
        isFetching: isBarcodeLoading,
        isError: isBarcodeError,
        error: barcodeError
    }] = useLazyGetByBarCodeQuery();

    const [triggerbrandandModelQuery, {
        data: frameDatabrandandModel,
        isFetching: isbrandandModelLoading,
        isError: isbrandandModelError,
        error: brandandModelError
    }] = useLazyGetByBrandAndModalQuery();

    const [triggerSearchAccessoryByBarcode, {
        data: AccessoriesData,
        isFetching: isAccessorryFetching,
        isLoading: isAccessorryLoading
    }] = useLazyFetchBarcodeForAccessoryQuery();

    const [triggerSearchByBrandProduct, {
        isLoading: isBrandModelLoading,
        isFetching: isBrandAndModalFetching
    }] = useLazyGetByBrandAndProductNameQuery();

    const [triggerSearchCLByBarcode, {
        data: CLData,
        isFetching: isCLFetching,
        isLoading: isCLLoading
    }] = useGetContactLensDetailsMutation();

    const [triggerGetPOMain] = useGetPOMainMutation();


    const [triggerSearchOLByBarcode, {
        data: OLData,
        isFetching: isOLFetching,
        isLoading: isOLLoading
    }] = useLazyGetOlByBarcodeQuery();

    const [triggerUpdatePOMainData] = useUpdatePOMainDataMutation();

    const { data: focalityData, isLoading: isLoadingFocality } = useGetFocalityQuery(
        {
            brandId: brandId,
            productType: olItemsStack.productType === "Stocks" ? 0 : 1,
        },
        {
            skip: !(brandId && formState.productType !== null),
        }
    );

    const { data: familyData, isLoading: isLoadingFamily } = useGetFamilyQuery(
        {
            brandId: brandId,
            productType: olItemsStack.productType,
            focalityId: olItemsStack.focality,
        },
        {
            skip: !(
                brandId &&
                olItemsStack.productType !== null &&
                olItemsStack.focality
            ),
        }
    );

    const { data: productDesignData, isLoading: isLoadingProductDesign } =
        useGetProductDesignQuery(
            {
                brandId: brandId,
                productType: olItemsStack.productType,
                focalityId: olItemsStack.focality,
                familyId: olItemsStack.family,
            },
            {
                skip: !(
                    brandId &&
                    olItemsStack.productType !== null &&
                    olItemsStack.focality &&
                    olItemsStack.family
                ),
            }
        );

    const { data: indexValuesData, isLoading: isLoadingIndexValues } =
        useGetIndexValuesQuery(
            {
                brandId: brandId,
                productType: olItemsStack.productType,
                focalityId: olItemsStack.focality,
                familyId: olItemsStack.family,
                designId: olItemsStack.design,
            },
            {
                skip: !(
                    brandId &&
                    olItemsStack.productType !== null &&
                    olItemsStack.focality &&
                    olItemsStack.family &&
                    olItemsStack.design
                ),
            }
        );

    const { data: coatingsData, isLoading: isLoadingCoatings } =
        useGetCoatingsQuery(
            { masterId: olItemsStack.masterId },
            { skip: !olItemsStack.masterId }
        );

    const { data: treatmentsData, isLoading: isLoadingTreatments } =
        useGetTreatmentsQuery(
            {
                masterId: olItemsStack.masterId,
                coatingId: olItemsStack.coating,
            },
            {
                skip: !olItemsStack.masterId,
            }
        );

    const { data: modalities, isLoading: modalitiesLoading } = useGetModalitiesQuery();

    const { data: productData, isLoading: isProductsLoading } = useGetProductNamesByModalityQuery(
        { brandId: brandId, modalityId: modalityId },
        { skip: !brandId || !modalityId }
    );

    const [getPowerDetails, { isLoading: isPowerDetailsLoading }] = useGetPowerDetailsMutation();

    const { data: allBrands } = useGetAllBrandsQuery();

    // Filter brand based on the selected option type : Dont dare to change anything 😠
    useEffect(() => {
        if (allBrands) {
            console.log("allBrands", allBrands);
            if (formState.selectedOption === "Frame/Sunglass") {
                const frameBrands = allBrands?.filter(
                    (b) =>
                        b.FrameActive === 1 &&
                        b.IsActive === 1 &&
                        b.BrandName.toLowerCase().includes(brandInput?.toLowerCase())
                );
                setFilteredBrands(frameBrands);
            }
            if (formState.selectedOption === "Accessories") {
                const accessoriesBrands = allBrands?.filter(
                    (b) =>
                        b.OthersProductsActive === 1 &&
                        b.IsActive === 1 &&
                        b.BrandName.toLowerCase().includes(brandInput?.toLowerCase())
                );
                setFilteredBrands(accessoriesBrands);
            }
            if (formState.selectedOption === "Contact Lens") {
                const contactLensBrands = allBrands?.filter(
                    (b) =>
                        b.ContactLensActive === 1 &&
                        b.IsActive === 1 &&
                        b.BrandName.toLowerCase().includes(brandInput?.toLowerCase())
                );
                setFilteredBrands(contactLensBrands);
            }
            if (formState.selectedOption === "Lens") {
                const OlBrands = allBrands?.filter(
                    (b) =>
                        b.OpticalLensActive === 1 &&
                        b.IsActive === 1 &&
                        b.BrandName.toLowerCase().includes(brandInput?.toLowerCase())
                );
                setFilteredBrands(OlBrands);
            }
            console.log(filteredBrands);
        }
    }, [formState.selectedOption, formState, currentStep]);

    // console.log("brandData ------------- ", filteredBrands);

    const handleCheckboxChange = (item) => {
        const exists = selectedRows.find((i) => i.Barcode === item.Barcode);
        if (exists) {
            // Remove from selectedRows
            setSelectedRows((prev) => prev.filter((i) => i.Barcode !== item.Barcode));
        } else {
            // Add to selectedRows
            setSelectedRows((prev) => [...prev, item]);
        }
    };

    const [SavePurchaseOrder] = useSavePurchaseOrderMutation();
    const [SavePurchaseOrderDetails] = useSavePurchaseOrderDetailsMutation();
    const [getOrderDetails] = useGetOrderDetailsAllMutation();
    const [getAllPoDetails] = useGetAllPoDetailsMutation();
    const [updatePOPrice] = useUpdatePoBuyingPriceMutation();
    const [updatePOQty] = useUpdatePoQtyMutation();
    const [deletePO] = useDeletePoMutation();
    const [updatePoMain] = useUpdatePoMainMutation();
    const [getDia, { isLoading: isGetDiameterLoading }] = useGetDIaDetailsMutation();
    const [getOlDetails, { isLoading: isGetOlDetails }] = useGetOlByDetailIdMutation();
    const [getAllPoDetailsForNewOrder] = useGetAllPoDetailsForNewOrderMutation();

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


    // fetch draftinfo
    useEffect(() => {

        const fetchPOMainDraft = async () => {
            if (selectedVendor && formState.shiptoAddress) {
                const checkPayload = {
                    locationId: parseInt(selectedLocation),
                    ApplicationUserId: parseInt(user.Id),
                    vendorId: parseInt(selectedVendor),
                    againstOrder: formState.shiptoAddress === "against" ? "1" : "0",
                    status: 0
                };

                const poMainResponse = await triggerGetPOMain(checkPayload).unwrap();

                if (poMainResponse.data.length > 0) {

                    const poMainId = poMainResponse.data[0]?.Id;
                    setCreatedPOMainId(poMainId);
                    setFormState((prev) => ({ ...prev, referenceNo: poMainResponse.data[0]?.POReferenceNo }));
                    return;

                } else {
                    setFormState((prev) => ({ ...prev, referenceNo: "" }));
                    setCreatedPOMainId(null);
                }
            }

        }

        fetchPOMainDraft();
    }, [selectedVendor, formState.shiptoAddress])

    // Auto select location if it has only 1.
    useEffect(() => {
        if (hasLocation?.length === 1) {
            setSelectedLocation(hasLocation[0].Id.toString());
        }
    }, [hasLocation]);

    // Catching error for Company fetch
    useEffect(() => {
        if (companySettingsError) {
            console.error("Error fetching company settings:", companySettingsError);
            setAlertMessage({
                type: "error",
                message: "Failed to fetch company details",
            });
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        }
    }, [companySettingsError]);

    // Call fetch vendor data
    useEffect(() => {
        if (vendorData?.data?.data) {
            setVendors(vendorData?.data?.data);
        }
    }, [vendorData]);

    useEffect(() => {
        if (currentStep === 3 && formState.shiptoAddress === "new") {
            const barcodeInput = document.getElementById("barcode");
            barcodeInput?.focus();
        }
    }, [currentStep, formState.shiptoAddress]);

    // Set vendor details as  per selected vendor
    useEffect(() => {
        if (selectedVendor) {
            const vendor = vendors.find((v) => v.Id === parseInt(selectedVendor));
            setFormState((prev) => ({
                ...prev,
                vendorDetails: vendor,
            }));
        }
    }, [selectedVendor, vendors]);


    // Update productName based on dropdown selections
    useEffect(() => {
        const brand =
            allBrands?.find((b) => b.Id === brandId)?.BrandName || "";
        const focality =
            focalityData?.data?.find(
                (f) => f.OpticalLensFocality.Id === olItemsStack.focality
            )?.OpticalLensFocality.Focality || "";
        const family =
            familyData?.data?.find(
                (f) => f.OpticalLensProductFamily.Id === olItemsStack.family
            )?.OpticalLensProductFamily.FamilyName || "";
        const design =
            productDesignData?.data?.find(
                (d) => d.OpticalLensProductDesign.Id === olItemsStack.design
            )?.OpticalLensProductDesign.DesignName || "";
        const indexValue =
            indexValuesData?.data?.find(
                (i) => i.OpticalLensIndex.Id === olItemsStack.index
            )?.OpticalLensIndex.Index || "";
        const coating =
            coatingsData?.data?.find(
                (c) => c.OpticalLensCoating.Id === olItemsStack.coating
            )?.OpticalLensCoating.CoatingName || "";
        const treatment =
            treatmentsData?.data?.find(
                (t) => t.OpticalLensTreatment.Id === olItemsStack.treatment
            )?.OpticalLensTreatment.TreatmentName || "";

        // Combine all dropdown names (except product type) into productName
        const productNameParts = [
            brand,
            focality,
            family,
            design,
            indexValue,
            coating,
            treatment,
        ].filter((part) => part); // Remove empty strings

        const newProductName = productNameParts.join(" ") || null;

        setOlItemStack((prev) => ({
            ...prev,
            productName: newProductName,
        }));
    }, [
        olItemsStack.brandId,
        olItemsStack.focality,
        olItemsStack.family,
        olItemsStack.design,
        olItemsStack.index,
        olItemsStack.coating,
        olItemsStack.treatment,
        allBrands,
        focalityData,
        familyData,
        productDesignData,
        indexValuesData,
        coatingsData,
        treatmentsData,
    ]);


    // fetch order details or PO orders as per current form step
    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (selectedLocation && formState.selectedOption && currentStep === 3) {                        // Step 3 fetch order details
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

                        // reverse the list tp show the latest entry first
                        const sortedDetails = filteredDetails.sort((a, b) => b.Id - a.Id);

                        setFilteredOrderDetails(sortedDetails);
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
            } else if (selectedLocation && formState.vendorId && currentStep === 4) {                       // Step 4 fetch PO order 
                // Inside step 3 where you make the API call

                console.log("I'm called")
                try {
                    const payload = {
                        locationId: Number(selectedLocation),
                        ApplicationUserId: Number(user.Id),
                        vendorId: Number(selectedVendor),
                        againstOrder: formState.shiptoAddress === "against" ? "1" : "0"
                    };

                    if (formState.shiptoAddress === "against") {

                        const response = await getAllPoDetails(payload).unwrap();
                        // console.log("getAllPoDetails response -------------- ", response);
                        setPoreviewDetails(response);

                    } else if (formState.shiptoAddress === "new") {

                        const poDetailsResponse = await getAllPoDetailsForNewOrder(payload).unwrap();
                        setPoreviewDetails(poDetailsResponse.data);

                    }

                } catch (error) {
                    console.error("Error fetching PO details:", error);
                    setAlertMessage({
                        type: "error",
                        message: "Failed to fetch PO details"
                    });
                    setShowAlert(true);
                    setTimeout(() => setShowAlert(false), 3000);
                }
            }
        };

        fetchOrderDetails();
    }, [selectedLocation, formState.selectedOption, currentStep]);


    // Handle refreshing the form state in step 3
    const handleRefreshForm = () => {
        // setBrandId(null);
        setBrandInput(null);
        setModelNo("");
        setOlItemStack({
            productType: "Stocks",
            focality: null,
            family: null,
            design: null,
            index: null,
            coating: null,
            treatment: null,
            productName: null,
            masterId: null,
            coatingCombo: null,
            olDetailId: null
        });
        setSearchResults([]);
        setModalityId(null);
        setProductId(null);
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
        });
        setSearchFetched(false);
        setProductName("");
    };


    // Handle search and add frame by barcode
    const handleSearchByBarcode = async (type) => {
        if (!formState.barcode || !selectedLocation) {
            setAlertMessage({
                type: "error",
                message: "Please enter a barcode and select a location"
            });
            setShowAlert(true);
            return;
        }

        let typeFunction = null;
        switch (type) {
            case 1:
                typeFunction = triggerBarcodeQuery;
                break;
            case 2:
                typeFunction = triggerSearchOLByBarcode;
                break;
            case 3:
                typeFunction = triggerSearchAccessoryByBarcode;
                break;
            case 4:
                typeFunction = triggerSearchCLByBarcode;
                break;
            default:
                typeFunction = null;
        }

        try {

            const result = await typeFunction({
                barcode: formState.barcode,
                locationId: selectedLocation
            }).unwrap();

            // Handle successful response
            if (result.data) {
                console.log("Scanned cl item:", result.data.data);

                let newItem = {};
                if (formState.selectedOption === "Contact Lens") {
                    newItem = {
                        ...result.data.data,
                        quantity: 1, // Default quantity
                        price: result?.data?.data?.BuyingPrice, // Default price
                        cLDetailId: result?.data?.data?.CLDetailId,
                        Id: formState.EntryType === "seperate"
                            ? `cl-${data.OpticalLensDetailId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
                            : data.OpticalLensDetailId || Date.now(),
                        timestamp: Date.now()
                    };
                } else {
                    newItem = {
                        ...result.data,
                        quantity: 1, // Default quantity
                        price: result?.data?.data?.BuyingPrice, // Default price
                        cLDetailId: result?.data?.data?.CLDetailId,
                        timestamp: Date.now()
                    };
                }

                console.log("new Item ---- ", newItem);


                let updatedItems = [];
                if (formState.EntryType === "combined") {
                    // Check if item with same barcode already exists
                    const existingItemIndex = scannedItems.findIndex(
                        item => item.Barcode === newItem.Barcode
                    );

                    console.log("existingItemIndex --- ", existingItemIndex);

                    if (existingItemIndex >= 0) {
                        // Increment quantity for existing item
                        updatedItems = scannedItems.map((item, index) =>
                            index === existingItemIndex
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        );
                    } else {
                        // Add new item
                        updatedItems = [...scannedItems, newItem];
                    }
                } else {
                    // Always add as new item (even if same barcode exists)
                    updatedItems = [...scannedItems, newItem];
                }

                // Sort by timestamp in descending order (latest first)
                updatedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

                console.log("scannedItems ---- ", updatedItems);

                // Update state with sorted items
                setScannedItems(updatedItems);

                setAlertMessage({
                    type: "success",
                    message: "Item scanned successfully"
                });

                // Clear the barcode input
                setFormState(prev => ({
                    ...prev,
                    barcode: ""
                }));

            }

        } catch (error) {
            console.error("Barcode scan failed:", error);
            setAlertMessage({
                type: "error",
                message: error.data?.message || "Failed to scan barcode"
            });
        } finally {
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        }
    };

    // Handle search and add frame by brand and model no.
    const handleDetailSearch = async (type) => {
        // Validate inputs
        if (!brandId || (type === 1 && !modelNo) || (type === 2 && !productName)) {
            setAlertMessage({
                type: "error",
                message: type === 1
                    ? "Please enter both brand and model number"
                    : "Please enter both brand and product name"
            });
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
            return;
        }

        console.log("modelNo ---- ", modelNo);

        let functionType = null;
        let field = null;
        let requestData = {
            brand: brandId,
            locationId: selectedLocation
        };

        if (type === 1) {
            functionType = triggerbrandandModelQuery;
            requestData.modal = modelNo;
        } else if (type === 2) {
            functionType = triggerSearchByBrandProduct;
            requestData.product = productName;
        }

        console.log("Search parameters:", requestData);

        try {
            const response = await functionType(requestData);

            console.log("response --- ", response);

            if (response.status == "fulfilled") {

                const newItems = response?.data?.data;


                if (formState.EntryType === "combined") {
                    // For combined entry, we'll merge items with the same barcode
                    setSearchResults(prevResults => {
                        const mergedResults = [...prevResults];

                        newItems.forEach(newItem => {
                            const existingIndex = mergedResults.findIndex(
                                item => item.Barcode === newItem.Barcode
                            );

                            if (existingIndex >= 0) {
                                // Update existing item (you might want to merge other properties too)
                                mergedResults[existingIndex] = {
                                    ...mergedResults[existingIndex],
                                    // You can add merging logic for other properties if needed
                                };
                            } else {
                                mergedResults.push(newItem);
                            }
                        });

                        return mergedResults;
                    });
                } else {
                    // For separate entry, just add all new items
                    setSearchResults(newItems);
                }

                setAlertMessage({
                    type: "success",
                    message: "Search completed successfully"
                });
            } else {
                setAlertMessage({
                    type: "Warning",
                    message: "No matching data found!"
                });
            }


        } catch (error) {
            console.error("Search failed:", error);
            setAlertMessage({
                type: "error",
                message: error.message || "Failed to search items"
            });
            setSearchResults([]);
        } finally {
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        }
    };

    // Function to handle search in Contact lens
    const handleSearch = async () => {
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
            locationId: selectedLocation,
        };

        try {
            const response = await getPowerDetails({ payload }).unwrap();

            if (!response?.data?.data) {
                toast.error("No matching power found");
                setSearchFetched(false);
                return;
            }

            const data = response.data.data;
            toast.success(response?.data.message || "Power details found");

            console.log("data ------------ ", data);

            // Create updated item with response data
            const updatedItem = {
                ...newItem,
                Barcode: data.Barcode,
                CLDetailId: data?.CLDetailId,
                SphericalPower: Number(data.SphericalPower),
                CylindricalPower: data.CylindricalPower,
                Axis: data.Axis,
                Additional: data.Additional,
                avlQty: parseInt(data.AvlQty) || 0,
                orderQty: data.DefaultOrderQty || 1,
                quantity: 1,
                BuyingPrice: data?.priceMaster?.buyingPrice || 0,
                taxPercentage: data?.TaxDetails[0]?.PurTaxPerct || 0,
                // Add truly unique ID for separate entries
                Id: formState.EntryType === "seperate"
                    ? `cl-${data.CLDetailId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                    : data.CLDetailId || Date.now(),
                timestamp: Date.now()
            };

            console.log("updatedItem ------------ ", updatedItem);

            let updatedItems = [];
            if (formState.EntryType === "combined") {
                // Check if item with same barcode already exists
                const existingItemIndex = scannedItems.findIndex(
                    item => item.Barcode === updatedItem.Barcode
                );

                console.log("existingItemIndex --- ", existingItemIndex);

                if (existingItemIndex >= 0) {
                    // Increment quantity for existing item
                    updatedItems = scannedItems.map((item, index) =>
                        index === existingItemIndex
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                } else {
                    // Add new item
                    updatedItems = [...scannedItems, updatedItem];
                }
            } else {
                // Always add as new item (even if same barcode exists)
                updatedItems = [...scannedItems, updatedItem];
            }

            updatedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            console.log("scannedItems ---- ", updatedItems);

            // Update state with sorted items
            setScannedItems(updatedItems);

            const entryType = formState.EntryType === "seperate" ? "separate" : "combined";
            toast.success(`Added as ${entryType} entry`);
            setSearchFetched(true);

        } catch (error) {
            console.error("Search error:", error);
            toast.error(error.message || "Failed to search power details");
            setSearchFetched(false);
        }
    };

    // Search function to handle OL search
    const handleOlSearch = async () => {
        // Enhanced validation
        if (!olItemsStack.olDetailId || !selectedLocation) {
            toast.error("Mandatory field is required. Try again!");
            return;
        }

        const payload = {
            olDetailId: parseInt(olItemsStack.olDetailId),
            locationId: selectedLocation,
        };

        try {
            const response = await getOlDetails(payload).unwrap();

            console.log(response);

            if (!response?.data) {
                toast.error("No record found");
                setSearchFetched(false);
                return;
            }

            const data = response?.data;
            toast.success(response?.message || "Optical lens details found");

            console.log("data ----- ", data);

            // Create updated item with response data
            const updatedItem = {
                ...newItem,
                OpticalLensDetailId: data?.OpticalLensDetailId,
                Barcode: data.Barcode,
                Spherical: data?.Spherical,
                Cylinder: data?.Cylinder,
                quantity: data.quantity || 1,
                BuyingPrice: data?.BuyingPrice || 0,
                taxPercentage: data?.TaxDetails[0]?.PurTaxPerct || 0,
                // Add unique ID for separate entries tracking
                Id: formState.EntryType === "seperate"
                    ? `ol-${data.OpticalLensDetailId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
                    : data.OpticalLensDetailId || Date.now()
            };

            console.log("updatedItem ------------ ", updatedItem);

            if (formState.EntryType === "seperate") {
                // SEPARATE ENTRY: Always add as new individual entry
                setScannedItems(prevItems => [...prevItems, updatedItem]);
                toast.success("Added as separate entry");
            } else {
                // COMBINED ENTRY: Combine quantities for same barcode
                const existingItemIndex = scannedItems.findIndex(
                    item => item.Barcode === updatedItem.Barcode
                );

                console.log("existingItemIndex --- ", existingItemIndex);

                if (existingItemIndex >= 0) {
                    // Increment quantity for existing item
                    setScannedItems(prevItems =>
                        prevItems.map((item, index) =>
                            index === existingItemIndex
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        )
                    );
                    toast.success("Quantity increased for existing item");
                } else {
                    // Add new item
                    setScannedItems(prevItems => [...prevItems, updatedItem]);
                    toast.success("Added new item");
                }
            }

            setSearchFetched(true);

        } catch (error) {
            console.error("Search error:", error);
            toast.error(error.message || "Failed to search power details");
            setSearchFetched(false);
        }
    };

    const handleSearchDia = async () => {
        if (!newItem.sphericalPower || !olItemsStack.masterId || !olItemsStack.coatingCombo) {
            setAlertMessage({
                type: "error",
                message: "Please enter all the required fields."
            });
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
            return;
        }

        try {

            const payload = {
                RSPH: parseInt(newItem.sphericalPower),
                RCYLD: parseInt(newItem.cylindricalPower), // Handle empty cylindrical
                OpticalLensMasterId: olItemsStack.masterId,
                CoatingComboId: olItemsStack.coatingCombo,
                selectedTypeRight: 1,
                selectedTypeLeft: 0
            }

            const response = await getDia({ payload }).unwrap();

            console.log("Diameter response ------------ ", response);

            if (!response?.data?.diameters?.length > 0) {
                toast.error("No match found.");
                setSearchFetched(false);
                return;
            }

            if (response?.data?.details[0]) {
                setOlItemStack((prev) => ({ ...prev, olDetailId: response?.data?.details[0]?.OpticalLensDetailsId }));
                setOlPowerDia(response?.data?.diameters);
            }

            toast.success(response?.data.message || "Diameter details found");

        } catch (error) {
            console.error("Search error:", error);
            toast.error(error.message || "Failed to search power details");
            setSearchFetched(false);
        }
    }

    // Add selected items from search results to scanned items
    const addSelectedItemsToScanned = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one item");
            return;
        }

        setScannedItems(prevItems => {
            const updatedItems = [...prevItems];

            selectedRows.forEach(newItem => {
                // Prepare the item with default values
                const itemToAdd = {
                    ...newItem,
                    quantity: 1,
                    price: newItem.BuyingPrice || 0,
                    taxPercentage: newItem?.Tax?.Details[0]?.PurTaxPerct,
                    // Generate truly unique ID for separate entries, use existing ID for combined
                    Id: formState.EntryType === "seperate"
                        ? `sep-${newItem.Id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                        : newItem.Id || Date.now()
                };

                if (formState.EntryType === "seperate") {
                    // SEPARATE ENTRY LOGIC: Always add as new entry even if barcode exists
                    updatedItems.push(itemToAdd);
                } else {
                    // COMBINED ENTRY LOGIC: Combine quantities for same barcode
                    const existingItemIndex = updatedItems.findIndex(
                        item => item.Barcode === newItem.Barcode
                    );

                    if (existingItemIndex >= 0) {
                        // Increment quantity for existing item
                        updatedItems[existingItemIndex] = {
                            ...updatedItems[existingItemIndex],
                            quantity: updatedItems[existingItemIndex].quantity + 1
                        };
                    } else {
                        // Add new item
                        updatedItems.push(itemToAdd);
                    }
                }
            });
            console.log(" updatedItems ------------ ", updatedItems);
            return updatedItems;
        });

        toast.success(`Added ${selectedRows.length} item(s) to GRN`);
        setSelectedRows([]);
    };

    const handleRefresh = () => {
        setNewItem({
            barcode: null,
            CLDetailId: null,
            sphericalPower: null,
            cylindricalPower: null,
            diameter: null,
            axis: null,
            additional: null,
            avlQty: null,
            orderQty: null,
            buyingPrice: null,
        });
        setOlPowerDia([]);
        setSearchFetched(false);
        setErrors({});
    }


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleOlItemStackChange = (e) => {
        const { name, value } = e.target;
        setOlItemStack(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePowerSearchInputChange = (e) => {
        const { name, value } = e.target;
        setNewItem((prev) => ({ ...prev, [name]: value }));

        let message = "";

        // if (["sphericalPower", "cylindricalPower", "additional"].includes(name)) {
        //     if (value && !isMultipleOfQuarter(value)) {
        //         message = "Power should only be in multiples of 0.25";
        //     }
        // }

        if (name === "axis" && value && !isValidAxis(value)) {
            message = "Axis is incorrect";
        }

        // if (name === "additional") {
        //     const additionalValue = parseFloat(value);
        //     if (value && (!isMultipleOfQuarter(value) || additionalValue < 0)) {
        //         message = "Additional power must be a positive multiple of 0.25";
        //     }
        // }

        setErrors((prev) => ({ ...prev, [name]: message }));
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

    // Handle update of values such as price and qty in step 3.     fieldType: 1 [Price]    &&   fieldType: 2 [Qty]
    // Replace your current updateScannedItemPrice function with this:
    const updateScannedItemPrice = (index, newPrice) => {
        console.log("index --- ", index);
        console.log("scannedItems ----- // -0", scannedItems);
        setScannedItems(prevItems =>
            prevItems.map((item, i) =>
                i === index ? { ...item, price: parseFloat(newPrice) } : item
            )
        );
    };

    const updateScannedItemQuantity = (index, newQuantity) => {
        setScannedItems(prevItems =>
            prevItems.map((item, i) =>
                i === index ? { ...item, quantity: parseInt(newQuantity) } : item
            )
        );
    };

    const handleDeleteScannedItem = (index) => {
        setScannedItems(prevItems => prevItems.filter((_, i) => i !== index));
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
                    message: "Please select a vendor",
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
        setScannedItems([]);
        setSelectedOrders([]);
        setSelectAll(false);
        setFilteredOrderDetails([]);
        setPoreviewDetails([]);
        setShowSearchInputs(false);
        handleRefreshForm();
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


    const handleRemoveOrder = async () => {
        if (!orderToRemove) {
            setAlertMessage({
                type: "error",
                message: "Something went wrong, could not get the Id."
            });
            setShowAlert(true)
            setTimeout(() => { setShowAlert(false), 3000 });
        }

        console.log("orderToRemove -----", orderToRemove);
        try {
            const payload = {
                p_id: orderToRemove
            }

            const response = await deletePO(payload).unwrap();
            if (response.status === "success") {
                console.log(response);

                setPoreviewDetails(prev => prev.filter(item => item.poDetailId !== orderToRemove));
                setShowRemoveModal(false);
                setOrderToRemove(null);
                setAlertMessage({
                    type: "success",
                    message: "Purchase order deleted successfully"
                });
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
                // Optionally navigate to another page or reset the form
                // setCurrentStep(2);
            } else {
                setAlertMessage({
                    type: "error",
                    message: response.message || "Failed to delete purchase order"
                });
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
            }

        } catch (error) {
            setAlertMessage({
                type: "error",
                message: error.message || "Failed to remove PO detail"
            });
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        }
    };


    // Handle Save for PO main 
    const handleSubmit = async () => {
        try {
            let poDetailsResponse;
            if (createdPOMainId) {

                const checkPayload = {
                    locationId: parseInt(selectedLocation),
                    ApplicationUserId: parseInt(user.Id),
                    vendorId: parseInt(selectedVendor),
                    againstOrder: formState.shiptoAddress === "against" ? "1" : "0",
                    status: 0
                };

                await triggerUpdatePOMainData({
                    poMainId: createdPOMainId,
                    refNo: formState.referenceNo
                });

                if (formState.shiptoAddress === "against") {
                    poDetailsResponse = await getAllPoDetails(checkPayload).unwrap();
                } else if (formState.shiptoAddress === "new") {
                    const response = await getAllPoDetailsForNewOrder(checkPayload).unwrap();
                    poDetailsResponse = response?.data;
                }
                // console.log("poDetailsResponse ---------------- ", poDetailsResponse);

                if (poDetailsResponse && poDetailsResponse.length > 0) {
                    setPoreviewDetails(poDetailsResponse);
                    setCurrentStep(4);
                    return;
                }

                setCurrentStep(2);
                return;

            }



            // Prepare payload with data from all steps
            const payload = {
                companyId: parseInt(selectedLocation),
                vendorId: parseInt(selectedVendor),
                poPrefix: companySettingsData?.data?.data?.POPrefix || "",
                inState: formState?.vendorDetails?.StateID === companySettingsData?.data?.data?.State?.Id ? 0 : 1,
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

            let payload = {
                locationId: selectedLocation,
                ApplicationUserId: user.Id,
                vendorId: selectedVendor,
                againstOrder: formState.shiptoAddress === "against" ? "1" : "0"
            };

            // For against orders - use selected orders from the table
            if (formState.shiptoAddress === "against") {
                if (selectedOrders.length === 0) {
                    setAlertMessage({
                        type: "error",
                        message: "Please select at least one order"
                    });
                    setShowAlert(true);
                    setTimeout(() => setShowAlert(false), 3000);
                    return;
                }

                console.log("selectedOrders ------ ", selectedOrders);

                // Prepare PO details payload for against orders
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
                        poQty: order.poQty ?? order?.orderQty - order?.billedQty - order?.cancelledQty,
                        poPrice: order.productType == 3 ? order.poPrice ?? order?.priceMaster?.buyingPrice
                            : order.poPrice ?? order?.pricing?.buyingPrice,
                        taxPercentage: formState.selectedOption === 'Lens' ? order?.TaxPrectTaxMain
                            : formState.selectedOption === 'Contact Lens' ? order?.TaxPrectTaxMain
                                : formState.selectedOption === 'Frame/Sunglass' ? order?.TaxPrectTaxMain
                                    : formState.selectedOption === 'Accessories' ? order?.TaxPrectTaxMain : order?.taxPercentage || 0,
                        Status: 0, // Default status
                        ApplicationUserId: user.Id
                    }));

                // Call API to save PO details
                const response = await SavePurchaseOrderDetails(poDetails).unwrap();
                if (response.status === "success") {
                    setSavedPODetails(response?.data?.details);
                    setAlertMessage({
                        type: "success",
                        message: "Purchase order details saved successfully"
                    });
                    setShowAlert(true);
                    setTimeout(() => setShowAlert(false), 3000);
                    // setCurrentStep(4);

                    // fetch updated PO details
                    const allPOres = await getAllPoDetails(payload).unwrap();
                    setPoreviewDetails(allPOres);
                }
            }
            // For new orders - use the frameData from barcode scanning
            else if (formState.shiptoAddress === "new") {

                let poDetails;
                // if (!showSearchInputs) {
                if (scannedItems.length === 0) {
                    setAlertMessage({
                        type: "error",
                        message: "Please scan at least one item"
                    });
                    setShowAlert(true);
                    setTimeout(() => setShowAlert(false), 3000);
                    return;
                }

                console.log("scannedItems in po details djhbajdb ", scannedItems);

                // Prepare PO details payload for new orders
                poDetails = scannedItems.map((item, index) => ({
                    poMainId: createdPOMainId,
                    poslNo: index + 1,
                    productType: formState.selectedOption === 'Frame/Sunglass' ? 1
                        : formState.selectedOption === 'Lens' ? 0
                            : formState.selectedOption === 'Accessories' ? 2
                                : formState.selectedOption === 'Contact Lens' ? 3
                                    : null,
                    detailId: formState.selectedOption === "Contact Lens" ? item.CLDetailId : formState.selectedOption === "Lens" ? item.OpticalLensDetailId : item.Id,
                    poQty: item.quantity || 1,
                    poPrice: item.price || item.BuyingPrice,
                    // taxPercentage: item.taxPercentage || 0,
                    taxPercentage: formState.selectedOption === 'Lens' ? order?.TaxPrectTaxMain
                        : formState.selectedOption === 'Contact Lens' ? order?.TaxPrectTaxMain
                            : formState.selectedOption === 'Frame/Sunglass' ? order?.TaxPrectTaxMain
                                : formState.selectedOption === 'Accessories' ? order?.TaxPrectTaxMain : order?.taxPercentage || 0,
                    Status: 0,
                    ApplicationUserId: user.Id
                }));

                // Call API to save PO details
                const response = await SavePurchaseOrderDetails(poDetails).unwrap();
                if (response.status === "success") {
                    setSavedPODetails(response?.data?.details);
                    setAlertMessage({
                        type: "success",
                        message: "Purchase order details saved successfully"
                    });
                    setShowAlert(true);
                    setTimeout(() => setShowAlert(false), 3000);

                    const poDetailsResponse = await getAllPoDetailsForNewOrder(payload).unwrap();
                    setPoreviewDetails(poDetailsResponse.data);
                    // setCurrentStep(4);
                }
            }

            setScannedItems([]);
            setSelectedOrders([]);
            setSelectAll(false);
            setFilteredOrderDetails([]);
            setShowSearchInputs(false);
            // setPoreviewDetails([]);
            handleRefreshForm();
            // Move to step 4
            setCurrentStep(4);



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

    // Handle complete PO in step 4
    const handleCompletePO = async () => {
        try {
            // Calculate total values based on formState.shiptoAddress
            const totalQty = calculateTotalQuantity(poreviewDetails, formState.shiptoAddress);

            const totalBasicValue = calculateTotalGrossValue(poreviewDetails, formState.shiptoAddress);

            const totalGSTValue = calculateTotalGST(poreviewDetails, formState.shiptoAddress);

            const totalValue = calculateTotalNetValue(poreviewDetails, formState.shiptoAddress);

            const payload = {
                poId: createdPOMainId,
                remarks: formState.remarks || "",
                totalBasicValue: parseFloat(totalBasicValue).toFixed(2),
                totalGSTValue: parseFloat(totalGSTValue).toFixed(2),
                totalValue: parseFloat(totalValue).toFixed(2),
                totalQty: totalQty
            };

            const response = await updatePoMain(payload).unwrap();

            if (response.status === "success") {
                setAlertMessage({
                    type: "success",
                    message: "Purchase order completed successfully"
                });
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
                navigate('/purchase-order/');
            } else {
                setAlertMessage({
                    type: "error",
                    message: response.message || "Failed to complete purchase order"
                });
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
            }
        } catch (error) {
            console.error("Error completing purchase order:", error);
            setAlertMessage({
                type: "error",
                message: error.message || "An error occurred while completing purchase order"
            });
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        }
    };


    const handleAdvSearch = () => {
        if (allBrands) {
            console.log("allBrands ------------ ", allBrands);
            console.log(formState.selectedOption);
            if (formState.selectedOption === "Frame/Sunglass") {
                const frameBrands = allBrands?.filter(
                    (b) =>
                        b.FrameActive === 1 &&
                        b.IsActive === 1
                    // b.BrandName.toLowerCase().includes(brandInput?.toLowerCase())
                );
                console.log(frameBrands);

                setFilteredBrands(frameBrands);
            }
            if (formState.selectedOption == "Accessories") {
                const accessoriesBrands = allBrands?.filter(
                    (b) =>
                        b.OthersProductsActive === 1 &&
                        b.IsActive === 1
                    // b.BrandName.toLowerCase().includes(brandInput?.toLowerCase())
                );
                console.log(accessoriesBrands);

                setFilteredBrands(accessoriesBrands);
            }
            if (formState.selectedOption === "Contact Lens") {
                const contactLensBrands = allBrands?.filter(
                    (b) =>
                        b.ContactLensActive === 1 &&
                        b.IsActive === 1
                    // b.BrandName.toLowerCase().includes(brandInput?.toLowerCase())
                );
                console.log(contactLensBrands);

                setFilteredBrands(contactLensBrands);
            }
            if (formState.selectedOption === "Lens") {
                const OlBrands = allBrands?.filter(
                    (b) =>
                        b.OpticalLensActive === 1 &&
                        b.IsActive === 1
                    // b.BrandName.toLowerCase().includes(brandInput?.toLowerCase())
                );
                console.log(OlBrands);

                setFilteredBrands(OlBrands);
            }
            console.log(filteredBrands);
        }
        setShowSearchInputs(true);
    }

    const handleEditPriceClick = (item) => {
        console.log("item ---------------- ", item);
        let price = null;
        if (formState.shiptoAddress === "against") {
            price = item?.poPrice || (item?.productType == 3 ? item?.priceMaster?.buyingPrice : item.pricing?.buyingPrice);
        } else {
            price = item?.poPrice || (item?.ProductDetails?.ProductType == 3 ? item?.ProductDetails?.price?.BuyingPrice : item?.ProductDetails?.Stock?.BuyingPrice);
        }
        setCurrentEditingItem(item);
        setEditedBuyingPrice(price);
        setEditPriceModalOpen(true);
    };

    const handleEditQtyClick = (item) => {
        let Qty = null;
        if (formState.shiptoAddress === "against") {
            Qty = (item.poQty || item.orderQty - item.billedQty - item.cancelledQty);
        } else {
            Qty = (item?.poQty || item?.POQty);
        }
        setCurrentEditingItem(item);
        setEditedPoQty(Qty);
        setEditQtyModalOpen(true);
    };

    const handlePriceUpdate = async () => {
        if (!currentEditingItem || !editedBuyingPrice) return;
        console.log("currentEditingItem -------------- ", currentEditingItem);
        try {
            const payload = {
                p_id: currentEditingItem.poDetailId,
                p_buyingPrice: editedBuyingPrice
            }
            const response = await updatePOPrice(payload).unwrap();

            if (response.status === "success") {
                if (formState.shiptoAddress === "against") {
                    // Update poreviewDetails with the new price
                    setPoreviewDetails(prev => prev.map(item => {
                        if (item.poDetailId === currentEditingItem.poDetailId) {
                            return {
                                ...item,
                                poPrice: parseFloat(editedBuyingPrice),
                                // Update pricing/priceMaster based on product type
                                ...(item.productType === 3
                                    ? { priceMaster: { ...item.priceMaster, buyingPrice: parseFloat(editedBuyingPrice) } }
                                    : { pricing: { ...item.pricing, buyingPrice: parseFloat(editedBuyingPrice) } }
                                )
                            };
                        }
                        return item;
                    }));
                } else {
                    // Update poreviewDetails with the new price
                    setPoreviewDetails(prev => prev.map(item => {
                        if (item.poDetailId === currentEditingItem.poDetailId) {
                            return {
                                ...item,
                                poPrice: parseFloat(editedBuyingPrice),
                                // Update pricing/priceMaster based on product type
                                ...(item?.ProductDetails?.ProductType === 3
                                    ? { price: { ...item.price, BuyingPrice: parseFloat(editedBuyingPrice) } }
                                    : { Stock: { ...item.Stock, BuyingPrice: parseFloat(editedBuyingPrice) } }
                                )
                            };
                        }
                        return item;
                    }));
                }

                setAlertMessage({
                    type: "success",
                    message: "Buying price updated successfully"
                });
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
            } else {
                setAlertMessage({
                    type: "error",
                    message: response.message || "Failed to update Buying price."
                });
                setShowAlert(true);
            }
        } catch (error) {
            console.error("Error updating buying price:", error);
            setAlertMessage({
                type: "error",
                message: error.message || "Failed to update buying price"
            });
            setShowAlert(true);
        }

        setEditPriceModalOpen(false);
        setCurrentEditingItem(null);
        setEditedBuyingPrice('');
    };

    const handleQtyUpdate = async () => {
        if (!currentEditingItem || !editedPoQty) {
            setQtyError('Please enter a valid quantity');
            return;
        }

        if (formState.shiptoAddress === "against") {
            const orderQty = currentEditingItem.orderQty;
            if (parseInt(editedPoQty) > orderQty) {
                setQtyError(`Quantity cannot exceed order quantity (${orderQty})`);
                return;
            }
        }

        setQtyError('');

        try {
            const payload = {
                p_id: currentEditingItem.poDetailId,
                p_PoQty: editedPoQty
            }
            const response = await updatePOQty(payload).unwrap();

            if (response.status === "success") {
                // Update only the specific item in poreviewDetails
                setPoreviewDetails(prev => prev.map(item => {
                    if (item.poDetailId === currentEditingItem.poDetailId) {
                        return {
                            ...item,
                            poQty: parseInt(editedPoQty, 10)
                        };
                    }
                    return item;
                }));

                setAlertMessage({
                    type: "success",
                    message: "PO Qty updated successfully"
                });
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
            } else {
                setAlertMessage({
                    type: "error",
                    message: response.message || "Failed to update PO Qty."
                });
                setShowAlert(true);
            }
        } catch (error) {
            console.error("Error updating PO Qty:", error);
            setAlertMessage({
                type: "error",
                message: error.message || "Failed to update PO Qty"
            });
            setShowAlert(true);
        }

        setEditQtyModalOpen(false);
        setCurrentEditingItem(null);
        setEditedPoQty('');
        setQtyError('');
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

                {/* Header and Step Indicators */}
                <header className="">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 p-4"
                    >
                        <div className="">
                            <button
                                className="text-[#000060] hover:text-[#0000a0] transition-colors flex items-center mb-3"
                                onClick={() => navigate('/purchase-order')}
                            >
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

                                <PurchaseOrderVendorSection
                                    vendors={vendors}
                                    selectedVendor={selectedVendor}
                                />

                                <div className="grid grid-cols-2 gap-8  bg-white text-gray-600">
                                    {/* Ship to Address Section */}
                                    <div className="flex">
                                        {/* {console.log("vend -------------- ", formState.vendorDetails)} */}
                                        <p className="font-bold text-gray-500 mb-4">Ship to Address:</p>
                                        {formState.vendorDetails?.MultiDelivery === 0 ? (
                                            <div className="ml-4 text-gray-500">
                                                <p>{formState.vendorDetails?.Address1 || 'N/A'} {formState.vendorDetails?.Address2}</p>
                                                <p>
                                                    {formState.vendorDetails?.City}
                                                    {formState.vendorDetails?.Pin &&
                                                        ` - ${formState.vendorDetails?.Pin}`
                                                    }
                                                </p>
                                                <p>
                                                    {/* {companiesData?.data?.data?.State?.StateName} */}
                                                    {companiesData?.data?.data?.Country?.CountryName &&
                                                        `${companiesData?.data?.data?.Country?.CountryName}`
                                                    }
                                                </p>
                                            </div>
                                        ) : (

                                            <div className="ml-4 text-gray-500">
                                                {console.log("companiesData ---------", companiesData?.data?.data)}
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
                                        )}

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
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center flex-1 sm:flex-none"
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
                {(currentStep === 2) && (
                    formState.shiptoAddress === "against" ? (
                        <PurchaseOrderStep2
                            productOptions={["Frame/Sunglass", "Lens", "Contact Lens", "Accessories"]}
                            formState={formState}
                            handleInputChange={handleInputChange}
                            handleOptionChange={handleOptionChange}
                            handleNext={handleNext}
                            handleBack={handleBack}
                        />

                    ) : formState.shiptoAddress === "new" ? (
                        <PurchaseOrderStep2
                            productOptions={["Frame/Sunglass", "Lens", "Contact Lens", "Accessories", "Bulk Process"]}
                            formState={formState}
                            handleInputChange={handleInputChange}
                            handleOptionChange={handleOptionChange}
                            handleNext={handleNext}
                            handleBack={handleBack}
                        />
                    ) : null
                )}


                {/* Step 3: Order Selection for Against Order */}
                {(currentStep === 3 && formState.shiptoAddress === "against") && (
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-xl p-6"
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-[#000060] mb-6">Step 3: Select Orders</h2>
                            <button
                                onClick={handleBack}
                                className="px-4 py-2 flex text-[#000060] rounded-lg hover:bg-gray-100 transition-colors gap-2"
                            >
                                <ArrowLeft />
                                Back
                            </button>
                        </div>

                        {/* Vendor Details Section */}
                        <PurchaseOrderVendorSection
                            vendors={vendors}
                            selectedVendor={selectedVendor}
                        />

                        <div className="overflow-auto rounded-lg shadow">
                            {console.log("filteredOrderDetails ------------- ", filteredOrderDetails)}
                            <POAgainstOrderTableComponent
                                filteredOrderDetails={filteredOrderDetails}
                                formState={formState}
                                selectedOrders={selectedOrders}
                                handleOrderSelection={handleOrderSelection}
                            />
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

                {/* Step 3: Order Selection for New Order */}
                {(currentStep === 3 && formState.shiptoAddress === "new") && (
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-xl p-6"
                    >

                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-[#000060] mb-6">Step 3:
                                {formState.selectedOption == "Frame/Sunglass" && " Frame/Sunglass"}
                                {formState.selectedOption == "Accessories" && " Accessories"}
                                {formState.selectedOption == "Contact Lens" && " Contact Lens"}
                                {formState.selectedOption == "Lens" && " Optical Lens"}

                            </h2>
                            <div className="flex gap-2 items-center justify-center">
                                <button
                                    onClick={handleBack}
                                    className="px-4 py-2 flex text-[#000060] rounded-lg hover:bg-gray-100 transition-colors gap-2"
                                >
                                    <ArrowLeft />
                                    Back
                                </button>
                                {showSearchInputs && (
                                    <button
                                        onClick={handleRefreshForm}
                                        className="flex gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCcw />
                                        Refresh
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className=" items-center my-10 w-full gap-6">

                            <div className="flex gap-12 mb-6 items-center justify-center">
                                <div className="flex space-x-4">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="EntryType"
                                            value="combined"
                                            checked={formState.EntryType === "combined"}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700 font-medium">Combined Entry</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="EntryType"
                                            value="seperate"
                                            checked={formState.EntryType === "seperate"}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700 font-medium">Seperate Entry</span>
                                    </label>
                                </div>
                            </div>

                            {/* Toggle between barcode input and search inputs */}
                            {!showSearchInputs ? (
                                <div className="flex-1 flex items-center gap-5">
                                    <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 whitespace-nowrap">
                                        Enter Barcode
                                    </label>
                                    <div className="relative flex-1">
                                        <input
                                            id="barcode"
                                            name="barcode"
                                            type="text"
                                            autoComplete="off"
                                            autoFocus
                                            value={formState.barcode}
                                            onChange={handleInputChange}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    {
                                                        if (formState.selectedOption === "Frame/Sunglass") { handleSearchByBarcode(1) }
                                                        else if (formState.selectedOption === "Lens") { handleSearchByBarcode(2) }
                                                        else if (formState.selectedOption === "Accessories") { handleSearchByBarcode(3) }
                                                        else if (formState.selectedOption === "Contact Lens") { handleSearchByBarcode(4) }
                                                    };
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#000060] pr-10"
                                            placeholder="Scan or enter barcode..."
                                            aria-label="Barcode input"
                                            disabled={isLoading}
                                        />
                                        {isLoading && (
                                            <div className="absolute right-3 top-2.5">
                                                <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (formState.selectedOption === "Frame/Sunglass") { handleSearchByBarcode(1) }
                                            else if (formState.selectedOption === "Lens") { handleSearchByBarcode(2) }
                                            else if (formState.selectedOption === "Accessories") { handleSearchByBarcode(3) }
                                            else if (formState.selectedOption === "Contact Lens") { handleSearchByBarcode(4) }
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center"
                                        disabled={!formState.barcode || isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Adding...
                                            </>
                                        ) : (
                                            'Add'
                                        )}
                                    </button>
                                    <button
                                        onClick={handleAdvSearch}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap flex items-center"
                                    >
                                        <SearchIcon className="h-4 w-4 mr-1" />
                                        Search
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-wrap">

                                    {/* Search Brand */}
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

                                    {/* For Frame/Sunglass */}
                                    {formState.selectedOption === "Frame/Sunglass" && (
                                        <div className="flex-1 min-w-[250px]">
                                            <input
                                                id="model"
                                                name="model"
                                                type="text"
                                                autoComplete="off"
                                                value={modelNo}
                                                onChange={(e) => setModelNo(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#000060] pr-10"
                                                placeholder="Enter model no."
                                            />
                                        </div>
                                    )}

                                    {/* For Accessories */}
                                    {formState.selectedOption === "Accessories" && (
                                        <div className="flex-1 min-w-[250px]">
                                            <input
                                                id="product"
                                                name="productName"
                                                type="text"
                                                autoComplete="off"
                                                value={productName}
                                                onChange={(e) => setProductName(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#000060] pr-10"
                                                placeholder="Enter product name"
                                            />
                                        </div>
                                    )}

                                    {/* Contact Lens */}
                                    {(formState.selectedOption === "Contact Lens") && (
                                        <>
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

                                            {productData && (
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
                                    )}

                                    {/* Optical Lens */}
                                    {(formState.selectedOption === "Lens" && brandInput) && (
                                        <>
                                            <div className="flex space-x-4">
                                                <label>Product Type :</label>
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="productType"
                                                        value="Stocks"
                                                        checked={olItemsStack.productType === "Stocks"}
                                                        onChange={handleOlItemStackChange}
                                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="text-gray-700 font-medium">Stocks</span>
                                                </label>
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="productType"
                                                        value="Rx"
                                                        checked={olItemsStack.productType === "Rx"}
                                                        onChange={handleOlItemStackChange}
                                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                        disabled={true}
                                                    />
                                                    <span className="text-gray-700 font-medium">Rx</span>
                                                </label>
                                            </div>

                                            {(formState.productType === "Stocks" && focalityData && brandInput) && (
                                                <>
                                                    <div className="w-full flex flex-col md:flex-row gap-4 mt-4">

                                                        {/* Focality */}
                                                        <div className="flex-1">
                                                            <AutocompleteField
                                                                label="Focality"
                                                                options={deduplicateOptions(
                                                                    focalityData?.data?.filter((b) => b.IsActive === 1) || [],
                                                                    "OpticalLensFocality.Id"
                                                                )}
                                                                valueField="OpticalLensFocality.Id"
                                                                labelField="OpticalLensFocality.Focality"
                                                                value={olItemsStack.focality}
                                                                onChange={(val) =>
                                                                    setOlItemStack((prev) => ({ ...prev, focality: val }))
                                                                }
                                                                loading={isLoadingFocality}
                                                                disabled={!!(olItemsStack.family || olItemsStack.design)}
                                                            />
                                                        </div>

                                                        {/* Product Family */}
                                                        {olItemsStack.focality && (
                                                            <div className="flex-1">
                                                                <AutocompleteField
                                                                    label="Product Family"
                                                                    options={deduplicateOptions(
                                                                        familyData?.data?.filter((b) => b.IsActive === 1) || [],
                                                                        "OpticalLensProductFamily.Id"
                                                                    )}
                                                                    valueField="OpticalLensProductFamily.Id"
                                                                    labelField="OpticalLensProductFamily.FamilyName"
                                                                    value={olItemsStack.family}
                                                                    onChange={(val) =>
                                                                        setOlItemStack((prev) => ({ ...prev, family: val }))
                                                                    }
                                                                    loading={isLoadingFamily}
                                                                    disabled={!!olItemsStack.design}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Product Design */}
                                                        {olItemsStack.family && (
                                                            <div className="flex-1">
                                                                <AutocompleteField
                                                                    label="Product Design"
                                                                    options={deduplicateOptions(
                                                                        productDesignData?.data?.filter((b) => b.IsActive === 1) || [],
                                                                        "OpticalLensProductDesign.Id"
                                                                    )}
                                                                    valueField="OpticalLensProductDesign.Id"
                                                                    labelField="OpticalLensProductDesign.DesignName"
                                                                    value={olItemsStack.design}
                                                                    onChange={(val) =>
                                                                        setOlItemStack((prev) => ({ ...prev, design: val }))
                                                                    }
                                                                    loading={isLoadingProductDesign}
                                                                    disabled={!!olItemsStack.index}
                                                                />
                                                            </div>
                                                        )}

                                                    </div>

                                                    {olItemsStack.design && (
                                                        <div className="w-full flex flex-col md:flex-row gap-4 mt-4">

                                                            {/* Index Value */}
                                                            <div className="flex-1">
                                                                <AutocompleteField
                                                                    label="Index Values"
                                                                    options={deduplicateOptions(
                                                                        indexValuesData?.data?.filter((b) => b.IsActive === 1) ||
                                                                        [],
                                                                        "OpticalLensIndex.Id"
                                                                    )}
                                                                    valueField="OpticalLensIndex.Id"
                                                                    labelField="OpticalLensIndex.Index"
                                                                    value={olItemsStack.index}
                                                                    onChange={(val, item) =>
                                                                        setOlItemStack((prev) => ({
                                                                            ...prev,
                                                                            index: val,
                                                                            masterId: item?.MasterId || null,
                                                                        }))
                                                                    }
                                                                    loading={isLoadingIndexValues}
                                                                    disabled={!!(olItemsStack.masterId && olItemsStack.coating)}
                                                                />
                                                            </div>

                                                            {/* Coating */}
                                                            {olItemsStack.masterId && (
                                                                <div className="flex-1">
                                                                    <AutocompleteField
                                                                        label="Coating"
                                                                        options={deduplicateOptions(
                                                                            coatingsData?.data?.filter((b) => b.IsActive === 1) || [],
                                                                            "OpticalLensCoating.Id"
                                                                        )}
                                                                        valueField="OpticalLensCoating.Id"
                                                                        labelField="OpticalLensCoating.CoatingName"
                                                                        value={olItemsStack.coating}
                                                                        onChange={(val, item) => {
                                                                            if (!item) {
                                                                                setOlItemStack((prev) => ({
                                                                                    ...prev,
                                                                                    coating: null,
                                                                                }));
                                                                                return;
                                                                            }
                                                                            setOlItemStack((prev) => ({
                                                                                ...prev,
                                                                                coating: item.OpticalLensCoating?.Id || null,
                                                                            }));
                                                                        }}
                                                                        loading={isLoadingCoatings}
                                                                        disabled={!!olItemsStack.treatment}
                                                                    />
                                                                </div>
                                                            )}

                                                            {/* Treatment */}
                                                            {olItemsStack.coating && (
                                                                <div className="flex-1">
                                                                    <AutocompleteField
                                                                        label="Treatment"
                                                                        options={deduplicateOptions(
                                                                            treatmentsData?.data?.filter((b) => b.IsActive === 1) || [],
                                                                            "OpticalLensTreatment.Id"
                                                                        )}
                                                                        valueField="OpticalLensTreatment.Id"
                                                                        labelField="OpticalLensTreatment.TreatmentName"
                                                                        value={olItemsStack.treatment}
                                                                        onChange={(val, item) => {
                                                                            if (!item) {
                                                                                setOlItemStack((prev) => ({
                                                                                    ...prev,
                                                                                    coatingCombo: null,
                                                                                    treatment: null,
                                                                                }));
                                                                                return;
                                                                            }
                                                                            setOlItemStack((prev) => ({
                                                                                ...prev,
                                                                                coatingCombo: item.CoatingComboId,
                                                                                treatment: item.OpticalLensTreatment?.Id,
                                                                            }));
                                                                        }}
                                                                        loading={isLoadingTreatments}
                                                                    />
                                                                </div>
                                                            )}

                                                        </div>
                                                    )}

                                                    {/* Product Name */}
                                                    {olItemsStack.treatment && (
                                                        <div className="w-full flex flex-col md:flex-row gap-4 mt-4">
                                                            <div className="flex-1">
                                                                <Input
                                                                    label="Product Name"
                                                                    value={olItemsStack.productName || ""}
                                                                    onChange={(e) =>
                                                                        setOlItemStack({ ...olItemsStack, productName: e.target.value })
                                                                    }
                                                                    placeholder="Enter product name"
                                                                    className="w-full"
                                                                    disabled
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    )}


                                    {(formState.selectedOption === "Frame/Sunglass" || formState.selectedOption === "Accessories") ? (
                                        <button
                                            onClick={() => {
                                                if (formState.selectedOption === "Frame/Sunglass") handleDetailSearch(1)
                                                else if (formState.selectedOption === "Accessories") handleDetailSearch(2)
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center justify-center w-full md:w-auto"
                                            disabled={!brandId}
                                        >
                                            <SearchIcon className="h-4 w-4 mr-1" />
                                            Search
                                        </button>
                                    ) : null}

                                    <button
                                        onClick={() => setShowSearchInputs(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap flex items-center justify-center w-full md:w-auto"
                                    >
                                        Back to Barcode
                                    </button>

                                </div>
                            )}
                        </div>

                        {/* Optical Lens Search */}
                        {(showSearchInputs && olItemsStack.treatment && brandId) && (
                            <POolSearchTable
                                newItem={newItem}
                                handlePowerSearchInputChange={handlePowerSearchInputChange}
                                errors={errors}
                                searchFethed={searchFethed}
                                setNewItem={setNewItem}
                                olPowerDia={olPowerDia}
                                handleSearchDia={handleSearchDia}
                                isGetDiameterLoading={isGetDiameterLoading}
                                handleOlSearch={handleOlSearch}
                                isPowerDetailsLoading={isPowerDetailsLoading}
                                handleRefresh={handleRefresh}
                            />
                        )}

                        {/* Contact Lens Search */}
                        {(showSearchInputs && productId) && (
                            <POCLpowerSearchTable
                                headerItems={["Spherical Power", "Cylindrical Power", "Axis", "Additional", "Action"]}
                                newItem={newItem}
                                handlePowerSearchInputChange={handlePowerSearchInputChange}
                                handleSearch={handleSearch}
                                handleRefresh={handleRefresh}
                                isPowerDetailsLoading={isPowerDetailsLoading}
                                errors={errors}
                                searchFethed={searchFethed}
                            />

                        )}


                        {/* Search result table */}
                        {showSearchInputs && searchResults.length > 0 && (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Search Results</h3>
                                    {selectedRows.length > 0 && (
                                        <button
                                            onClick={addSelectedItemsToScanned}
                                            className="flex gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <Plus />
                                            Add Selected ({selectedRows.length})
                                        </button>
                                    )}
                                </div>
                                {formState.selectedOption === "Frame/Sunglass" ? (
                                    <POFrameSearchTable
                                        headerItems={["", "Barcode", "Name", "S/O", "Polarised", "Photochromatic", "Clip No", "MRP", "Buying Price"]}
                                        searchResults={searchResults}
                                        selectedRows={selectedRows}
                                        handleCheckboxChange={handleCheckboxChange}
                                    />
                                ) : null}
                            </>
                        )}

                        {(showSearchInputs && searchResults.length > 0 && formState.selectedOption === "Accessories") && (
                            <Table
                                columns={["", "Barcode", "Name", "Variation", "SKU Code", "Buying Price"]}
                                data={searchResults}
                                renderRow={(acc, index) => (
                                    <TableRow key={acc.barcode}>
                                        <TableCell>
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.some(
                                                    (i) => i.Barcode === acc.Barcode
                                                )}
                                                onChange={() => handleCheckboxChange(acc)}
                                            />
                                        </TableCell>
                                        <TableCell>{acc.Barcode}</TableCell>
                                        <TableCell>{acc.Name}</TableCell>
                                        <TableCell>{acc.Variation}</TableCell>
                                        <TableCell>{acc.SKU}</TableCell>
                                        <TableCell>{acc.BuyingPrice}</TableCell>
                                    </TableRow>
                                )}
                            />
                        )}

                        {/* Scanned Table for all products types */}
                        {(scannedItems.length > 0) && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-4">Purchase Order Items</h3>
                                {formState.selectedOption === "Frame/Sunglass" ? (
                                    <POFrameScannedTable
                                        headerItems={["Barcode", "Name", "S/O", "Polarised", "Photochromatic", "Clip No", "MRP", "Buying Price", "PO QTY", "Action"]}
                                        scannedItems={scannedItems}
                                        updateScannedItemQuantity={updateScannedItemQuantity}
                                        updateScannedItemPrice={updateScannedItemPrice}
                                        handleDeleteScannedItem={handleDeleteScannedItem}
                                    />
                                ) :
                                    formState.selectedOption === "Lens" ? (
                                        <POLensScannedTable
                                            headerItems={["Spherical Power", "Cylindrical Power", "Buying Price", "PO QTY", "Action"]}
                                            scannedItems={scannedItems}
                                            updateScannedItemQuantity={updateScannedItemQuantity}
                                            updateScannedItemPrice={updateScannedItemPrice}
                                            handleDeleteScannedItem={handleDeleteScannedItem}

                                        />
                                    ) :
                                        formState.selectedOption === "Accessories" ? (
                                            <POAccessoriesScannedTable
                                                headerItems={["Barcode", "Name", "Variation", "SKU Code", "MRP", "Buying Price", "PO QTY", "Action"]}
                                                scannedItems={scannedItems}
                                                updateScannedItemQuantity={updateScannedItemQuantity}
                                                updateScannedItemPrice={updateScannedItemPrice}
                                                handleDeleteScannedItem={handleDeleteScannedItem}
                                            />
                                        ) : formState.selectedOption === "Contact Lens" ? (
                                            <POCLScannedTable
                                                headerItems={["Barcode", "Spherical power", "Cylindrical power", "Axis", "Additional", "Buying Price", "PO Qty", "Action"]}
                                                scannedItems={scannedItems}
                                                updateScannedItemQuantity={updateScannedItemQuantity}
                                                updateScannedItemPrice={updateScannedItemPrice}
                                                handleDeleteScannedItem={handleDeleteScannedItem}
                                            />
                                        ) : null}
                            </div>

                        )}

                        <div className="flex justify-between items-center mt-8">
                            <button
                                onClick={handleBack}
                                className="px-4 py-2 border border-[#000060] text-[#000060] rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Back
                            </button>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleSubmitPODetails}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
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
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                                >
                                    Add PO
                                </button>
                            </div>
                        </div>

                        {/* Vendor details section */}
                        <PurchaseOrderVendorSection
                            vendors={vendors}
                            selectedVendor={selectedVendor}
                        />

                        <div className="overflow-auto rounded-lg shadow">
                            {formState.shiptoAddress === "against" ? (
                                <table className="min-w-full divide-y divide-neutral-200">
                                    <thead className="bg-blue-50"> {/* bg-blue-50 */}
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">SL No.</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Order No.</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Product Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Product Details</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Buying Price</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Order Qty</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">PO Qty</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Avl. Qty</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Total Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Action</th>
                                        </tr>
                                    </thead>

                                    {/* {console.log("poreviewDetails ------------------ ", poreviewDetails)} */}
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {poreviewDetails
                                            .map((order, index) => (
                                                <tr key={order.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{order.orderPrefix}/{order.orderNo}/{order.slNo}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{order.productType == 0 && `OL` || order.productType == 1 && `F` || order.productType == 2 && `Acc` || order.productType == 3 && `CL`}</td>
                                                    {order.productType == 0 &&
                                                        <td className="px-6 py-4 whitespace-wrap min-w-72">{order?.productDescName}
                                                            {/* R Row */}
                                                            {(order?.specs?.powerDetails?.right?.sphericalPower ||
                                                                order?.specs?.powerDetails?.right?.cylindricalPower ||
                                                                order?.specs?.powerDetails?.right?.axis ||
                                                                order?.specs?.powerDetails?.right?.additional) && (
                                                                    <>
                                                                        <br />
                                                                        R: {order?.specs?.powerDetails?.right?.sphericalPower &&
                                                                            `SPH: ${order?.specs?.powerDetails?.right?.sphericalPower > 0
                                                                                ? `+${order?.specs?.powerDetails?.right?.sphericalPower}`
                                                                                : order?.specs?.powerDetails?.right?.sphericalPower}`}
                                                                        {order?.specs?.powerDetails?.right?.cylindricalPower &&
                                                                            ` CYL: ${order?.specs?.powerDetails?.right?.cylindricalPower > 0
                                                                                ? `+${order?.specs?.powerDetails?.right?.cylindricalPower}`
                                                                                : order?.specs?.powerDetails?.right?.cylindricalPower}`}
                                                                        {order?.specs?.powerDetails?.right?.axis &&
                                                                            ` Axis: ${order?.specs?.powerDetails?.right?.axis}`}
                                                                        {order?.specs?.powerDetails?.right?.additional &&
                                                                            ` Add: ${order?.specs?.powerDetails?.right?.additional > 0
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
                                                                            `SPH: ${order?.specs?.powerDetails?.left?.sphericalPower > 0
                                                                                ? `+${order?.specs?.powerDetails?.left?.sphericalPower}`
                                                                                : order?.specs?.powerDetails?.left?.sphericalPower}`}
                                                                        {order?.specs?.powerDetails?.left?.cylindricalPower &&
                                                                            ` CYL: ${order?.specs?.powerDetails?.left?.cylindricalPower > 0
                                                                                ? `+${order?.specs?.powerDetails?.left?.cylindricalPower}`
                                                                                : order?.specs?.powerDetails?.left?.cylindricalPower}`}
                                                                        {order?.specs?.powerDetails?.left?.axis &&
                                                                            ` Axis: ${order?.specs?.powerDetails?.left?.axis}`}
                                                                        {order?.specs?.powerDetails?.left?.additional &&
                                                                            ` Add: ${order?.specs?.powerDetails?.left?.additional > 0
                                                                                ? `+${order?.specs?.powerDetails?.left?.additional}`
                                                                                : order?.specs?.powerDetails?.left?.additional}`}
                                                                    </>
                                                                )}

                                                            {order?.specs?.addOn?.addOnId && (<><br /> <span className="font-medium">AddOn: {order?.specs?.addOn?.addOnName}</span></>)}
                                                            {order?.specs?.tint?.tintCode && (<><br /><span className="font-medium">Tint: {order?.specs?.tint?.tintName}</span></>)}
                                                            {order?.hSN && (<><br /><span className="font-medium">HSN: {order?.hSN}</span></>)}
                                                        </td>
                                                    }
                                                    {order.productType == 1 &&
                                                        <td className="px-6 py-4 whitespace-wrap">{order?.productDescName}
                                                            <br></br>Size: {order?.size}-{order?.dBL}-{order?.templeLength}
                                                            <br></br>{order?.category === 0 ? `Category: Sunglass` : `Category: OpticalFrame`}
                                                            <br></br>{order?.barcode && `Barcode: ` + order?.barcode}
                                                            <br></br>{order?.hSN && `HSN: ` + order?.hSN}
                                                        </td>
                                                    }
                                                    {order.productType == 2 &&
                                                        <td className="px-6 py-4 whitespace-wrap">{order?.productDescName}
                                                            {order?.variationName && (<><br />Variation: {order?.variationName}</>)}
                                                            {order?.barcode && (<><br />Barcode: {order?.barcode}</>)}
                                                            {order?.hSN && (<><br />HSN: {order?.hSN}</>)}
                                                        </td>
                                                    }
                                                    {order.productType == 3 &&
                                                        <td className="px-6 py-4 whitespace-wrap">{order?.productDescName}
                                                            <br></br>{order?.sphericalPower && (`Sph: ` + (order?.sphericalPower > 0 ? `+` + order?.sphericalPower : order?.sphericalPower))}
                                                            {order?.cylindricalPower && (` Cyld: ` + (order?.cylindricalPower > 0 ? `+` + order?.cylindricalPower : order?.cylindricalPower))}
                                                            {order?.axis && (` Axis: ` + (order?.axis))}
                                                            {order?.additional && (` Add: ` + (order?.additional > 0 ? `+` + order?.additional : order?.additional))}
                                                            {order?.color && (<><br />Clr: {order?.color > 0}</>)}
                                                            {order?.barcode && (<><br />Barcode: {order?.barcode}</>)}
                                                            {order?.hSN && (<><br />HSN: {order?.hSN}</>)}
                                                        </td>
                                                    }
                                                    {order.productType == 3 ?
                                                        <td className="px-6 py-4 whitespace-nowrap">{order.poPrice ?? order?.priceMaster?.buyingPrice}
                                                            <button
                                                                onClick={() => handleEditPriceClick(order)}
                                                                className="ml-2 text-gray-500 hover:text-[#000060]"
                                                            >
                                                                <PenIcon className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                        :
                                                        <td className="px-6 py-4 whitespace-nowrap">{order.poPrice ?? order?.pricing?.buyingPrice}
                                                            <button
                                                                onClick={() => handleEditPriceClick(order)}
                                                                className="ml-2 text-gray-500 hover:text-[#000060]"
                                                            >
                                                                <PenIcon className="w-4 h-4" />
                                                            </button>
                                                        </td>

                                                    }
                                                    <td className="px-6 py-4 whitespace-nowrap">{order?.orderQty}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{order.poQty ?? order?.orderQty - order?.billedQty - order?.cancelledQty}
                                                        <button
                                                            onClick={() => handleEditQtyClick(order)}
                                                            className="ml-2 text-gray-500 hover:text-[#000060]"
                                                        >
                                                            <PenIcon className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                    {order.productType == 3 ?
                                                        // logic for sum of quantities in stock
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            {order?.stock.reduce((total, item) => total + item.quantity, 0)}
                                                        </td>
                                                        :
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">{order?.pricing?.quantity}</td>
                                                    }
                                                    {/* // In the table cell where Total Amount is displayed: */}
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {calculateTotalAmount(order)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => {
                                                                setOrderToRemove(order.poDetailId);
                                                                setShowRemoveModal(true);
                                                            }}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            ) : formState.shiptoAddress === "new" ? (
                                <table className="min-w-full divide-y divide-neutral-200">
                                    <thead className="bg-blue-50"> {/* bg-blue-50 */}
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">SL No.</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Product Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Barcode</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Product Details</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Buying Price</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">PO Qty</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Avl. Qty</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Total Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {console.log("poreviewDetails ---------- BHSBS", poreviewDetails)}
                                        {poreviewDetails
                                            .map((order, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{order?.ProductDetails?.ProductType == 0 && `OL` || order?.ProductDetails?.ProductType == 1 && `F` || order?.ProductDetails?.ProductType == 2 && `Acc` || order?.ProductDetails?.ProductType == 3 && `CL`}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{order?.ProductDetails?.ProductType == 0 ? "" : order?.ProductDetails?.barcode}</td>
                                                    {/* <td className="px-6 py-4 whitespace-nowrap">{order?.ProductDetails?.productName}
                                                        <br />{order?.ProductDetails?.hsncode ? `HSN: ` + order?.ProductDetails?.hsncode : null}
                                                    </td> */}
                                                    {order?.ProductDetails?.ProductType == 0 ?
                                                        <td className="px-6 py-4 whitespace-wrap min-w-72">{order?.ProductDetails?.productName
                                                        }
                                                            <br />
                                                            {order?.ProductDetails?.Specs?.Spherical ? `Sph: ${order?.ProductDetails?.Specs?.Spherical} ` : `Sph: `}
                                                            {order?.ProductDetails?.Specs?.Cylinder ? `Cyl: ${order?.ProductDetails?.Specs?.Cylinder} ` : `Cyl: `}
                                                            {order?.ProductDetails?.Specs?.Diameter ? `Dia: ${order?.ProductDetails?.Specs?.Diameter} ` : `Dia: `}

                                                            <br></br>{order?.ProductDetails?.HSN && `HSN: ` + order?.ProductDetails?.HSN}

                                                        </td>
                                                        : order?.ProductDetails?.ProductType == 1 ?
                                                            <td className="px-6 py-4 whitespace-wrap">{order?.ProductDetails?.productName}
                                                                <br></br>Size: {order?.ProductDetails?.Size?.Size}
                                                                <br></br>{order?.ProductDetails?.ProductType === 0 ? `Category: Sunglass` : `Category: OpticalFrame`}
                                                                <br></br>{order?.ProductDetails?.HSN && `HSN: ` + order?.ProductDetails?.HSN}
                                                            </td>
                                                            : order?.ProductDetails?.ProductType == 2 ?
                                                                <td className="px-6 py-4 whitespace-wrap">{order?.ProductDetails?.productName}
                                                                    {order?.ProductDetails?.Variation?.Variation && (<><br />Variation: {order?.ProductDetails?.Variation?.Variation}</>)}
                                                                    <br></br>{order?.ProductDetails?.HSN && `HSN: ` + order?.ProductDetails?.HSN}
                                                                </td>
                                                                : order?.ProductDetails?.ProductType == 3 ?
                                                                    <td className="px-6 py-4 whitespace-wrap">{order?.ProductDetails?.productName}
                                                                        <br />
                                                                        {order?.ProductDetails?.PowerSpecs?.Sph ? `Sph: ${order?.ProductDetails?.PowerSpecs?.Sph} ` : `Sph: `}
                                                                        {order?.ProductDetails?.PowerSpecs?.Cyl ? `Cyl: ${order?.ProductDetails?.PowerSpecs?.Cyl} ` : `Cyl: `}
                                                                        {order?.ProductDetails?.PowerSpecs?.Axis ? `Axis: ${order?.ProductDetails?.PowerSpecs?.Axis} ` : `Axis: `}
                                                                        {order?.ProductDetails?.PowerSpecs?.Add ? `Add: ${order?.ProductDetails?.PowerSpecs?.Axis} ` : `Add: `}
                                                                        <br></br>{order?.ProductDetails?.HSN && `HSN: ` + order?.ProductDetails?.HSN}
                                                                    </td>
                                                                    :
                                                                    <td className="px-6 py-4 whitespace-nowrap">{order?.ProductDetails?.productName}
                                                                        <br />{order?.ProductDetails?.hsncode ? `HSN: ` + order?.ProductDetails?.hsncode : null}
                                                                    </td>
                                                    }

                                                    {order?.ProductDetails?.ProductType == 3 ?
                                                        <td className="px-6 py-4 whitespace-nowrap">{order?.poPrice ?? order?.ProductDetails?.price?.BuyingPrice}
                                                            <button
                                                                onClick={() => handleEditPriceClick(order)}
                                                                className="ml-2 text-gray-500 hover:text-[#000060]"
                                                            >
                                                                <PenIcon className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                        :
                                                        <td className="px-6 py-4 whitespace-nowrap">{order?.poPrice ?? order?.ProductDetails?.Stock?.BuyingPrice}
                                                            <button
                                                                onClick={() => handleEditPriceClick(order)}
                                                                className="ml-2 text-gray-500 hover:text-[#000060]"
                                                            >
                                                                <PenIcon className="w-4 h-4" />
                                                            </button>
                                                        </td>

                                                    }
                                                    <td className="px-6 py-4 whitespace-nowrap">{order?.poQty ?? order?.POQty}
                                                        <button
                                                            onClick={() => handleEditQtyClick(order)}
                                                            className="ml-2 text-gray-500 hover:text-[#000060]"
                                                        >
                                                            <PenIcon className="w-4 h-4" />
                                                        </button>
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap">{order?.ProductDetails?.Stock?.Quantity}</td>

                                                    {/* // In the table cell where Total Amount is displayed: */}
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {order?.ProductDetails?.ProductType === 3 ? (
                                                            (
                                                                ((order?.poPrice ?? order?.ProductDetails?.price?.BuyingPrice) * (order.poQty ?? order?.POQty)) +
                                                                ((order?.poPrice ?? order?.ProductDetails?.price?.BuyingPrice) *
                                                                    (order.poQty ?? order?.POQty) *
                                                                    (order?.ProductDetails?.GSTPercentage / 100))
                                                            ).toFixed(2)
                                                        ) : order?.ProductDetails?.ProductType === 0 ? (
                                                            (
                                                                ((order?.poPrice ?? order?.ProductDetails?.Stock?.BuyingPrice) * (order.poQty ?? order?.POQty)) +
                                                                ((order?.poPrice ?? order?.ProductDetails?.Stock?.BuyingPrice) *
                                                                    (order.poQty ?? order?.POQty) *
                                                                    (order?.taxPercent / 100))
                                                            ).toFixed(2)
                                                        ) : (
                                                            // Default calculation
                                                            (
                                                                ((order?.poPrice ?? order?.ProductDetails?.Stock?.BuyingPrice) * (order.poQty ?? order?.POQty)) +
                                                                ((order?.poPrice ?? order?.ProductDetails?.Stock?.BuyingPrice) *
                                                                    (order.poQty ?? order?.POQty) *
                                                                    (order?.ProductDetails?.GSTPercentage / 100))
                                                            ).toFixed(2)
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => {
                                                                setOrderToRemove(order.poDetailId);
                                                                setShowRemoveModal(true);
                                                            }}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            ) : null}
                        </div>

                        {/* Calculation Summary Section */}
                        {formState.shiptoAddress === "against" ?
                            (<div className="flex mt-10 justify-between px-5 rounded-2xl shadow p-8">

                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-600 font-bold text-lg">Total Quantity :</span>
                                    <span className="font-bold text-lg">
                                        {Number(calculateTotalQuantity(poreviewDetails, formState.shiptoAddress))}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-600 font-bold text-lg">Total Gross Value :</span>
                                    <span className="font-bold text-lg">
                                        ₹ {Number(calculateTotalGrossValue(poreviewDetails, formState.shiptoAddress)).toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-600 font-bold text-lg">Total GST :</span>
                                    <span className="font-bold text-lg">
                                        ₹ {Number(calculateTotalGST(poreviewDetails, formState.shiptoAddress)).toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-600 font-bold text-lg">Total Net Value :</span>
                                    <span className="font-bold text-lg">
                                        ₹ {Number(calculateTotalNetValue(poreviewDetails, formState.shiptoAddress)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            ) : (
                                <div className="flex mt-10 justify-between px-5 rounded-2xl shadow p-8">

                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-600 font-bold text-lg">Total Quantity :</span>
                                        <span className="font-bold text-lg">
                                            {Number(calculateTotalQuantity(poreviewDetails, formState.shiptoAddress))}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-600 font-bold text-lg">Total Gross Value :</span>
                                        <span className="font-bold text-lg">
                                            ₹ {Number(calculateTotalGrossValue(poreviewDetails, formState.shiptoAddress)).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-600 font-bold text-lg">Total GST :</span>
                                        <span className="font-bold text-lg">
                                            ₹ {Number(calculateTotalGST(poreviewDetails, formState.shiptoAddress)).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-600 font-bold text-lg">Total Net Value :</span>
                                        <span className="font-bold text-lg">
                                            ₹ {Number(calculateTotalNetValue(poreviewDetails, formState.shiptoAddress)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>)
                        }

                        <div className="flex items-center justify-between w-full mt-7">
                            {/* Remarks Section - takes available space */}
                            <div className=" flex gap-5 items-center flex-1">
                                <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 whitespace-nowrap">
                                    Remarks
                                </label>
                                <input
                                    id="remarks"
                                    name="remarks"
                                    value={formState.remarks}
                                    onChange={handleInputChange}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#000060]"
                                    placeholder="Any additional remarks..."
                                />
                            </div>

                            {/* {console.log("createdPOMainId ", createdPOMainId)} */}

                            {/* Button container - fixed width */}
                            <div className="flex-shrink-0 ml-4">
                                <button
                                    onClick={handleCompletePO}
                                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 whitespace-nowrap"
                                    disabled={!createdPOMainId || poreviewDetails.length === 0}
                                >
                                    Complete Purchase Order
                                </button>
                            </div>
                        </div>



                        {/* <span className="text-gray-700 font-bold">
                                    Total Amount: ₹{calculateTotalAmount().toFixed(2)}
                                </span> */}

                    </motion.div>
                )}
            </motion.div >

            {editPriceModalOpen && (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white p-6 rounded-lg shadow-xl w-96"
                        >
                            <motion.h3
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-lg font-bold mb-4"
                            >
                                Edit Buying Price
                            </motion.h3>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <input
                                    type="number"
                                    value={editedBuyingPrice}
                                    onChange={(e) => setEditedBuyingPrice(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-[#000060] focus:border-transparent transition-all"
                                    placeholder="Enter new price"
                                    autoFocus
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex justify-end space-x-2"
                            >
                                <button
                                    onClick={() => setEditPriceModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePriceUpdate}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Update
                                </button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            )
            }

            {
                editQtyModalOpen && (
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-neutral-200/50 backdrop-blur-xs flex items-center justify-center z-50"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-white p-6 rounded-lg shadow-xl w-96"
                            >
                                <motion.h3
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-lg font-bold mb-4"
                                >
                                    Edit PO Quantity
                                </motion.h3>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <input
                                        type="number"
                                        value={editedPoQty}
                                        onChange={(e) => {
                                            setEditedPoQty(e.target.value);
                                            setQtyError(''); // Clear error when typing
                                        }}
                                        className="w-full p-2 border border-gray-300 rounded mb-1 focus:ring-2 focus:ring-[#000060] focus:border-transparent transition-all"
                                        placeholder="Enter new quantity"
                                        min="1"
                                        autoFocus
                                    />
                                    {qtyError && (
                                        <p className="text-red-500 text-sm mb-3">{qtyError}</p>
                                    )}
                                    <p className="text-gray-500 text-sm">
                                        Order Quantity: {currentEditingItem?.orderQty - currentEditingItem?.billedQty - currentEditingItem?.cancelledQty}
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex justify-end space-x-2"
                                >
                                    <button
                                        onClick={() => {
                                            setEditQtyModalOpen(false);
                                            setQtyError('');
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleQtyUpdate}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Update
                                    </button>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                )
            }

            {
                showRemoveModal && (
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-neutral-200/50 backdrop-blur-xs flex items-center justify-center z-50"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-white p-6 rounded-lg shadow-xl w-96"
                            >
                                <motion.h3
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-lg font-bold mb-4"
                                >
                                    Are you sure you want to delete?
                                </motion.h3>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex justify-end space-x-2"
                                >
                                    <button
                                        onClick={() => {
                                            setShowRemoveModal(false);
                                            setQtyError('');
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleRemoveOrder}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Yes
                                    </button>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                )
            }
        </>
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

// Utility to safely access nested values
const getNested = (obj, path) =>
    path.split(".").reduce((o, p) => (o ? o[p] : ""), obj);

// Deduplicate based on nested key
const deduplicateOptions = (options, keyPath) => {
    const seen = new Set();
    return options.filter((item) => {
        const key = getNested(item, keyPath);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};