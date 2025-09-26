import { useGRN } from "../../features/GRNContext";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, SearchIcon, Trash2 } from "lucide-react";
import { Autocomplete, TextField } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
    useLazyGetByBarCodeQuery,
    useLazyGetByBrandAndModalQuery,
    useLazyGetByBrandAndProductNameQuery,
    useLazyFetchBarcodeForAccessoryQuery,
    useGetModalitiesQuery,
    useGetProductNamesByModalityQuery,
    useGetPowerDetailsMutation,
    useGetOrderddMutation
} from "../../api/orderApi";
import {
    useLazyGetOlByBarcodeQuery
} from "../../api/purchaseOrderApi";
import { Table, TableRow, TableCell } from "../../components/Table";
import toast from "react-hot-toast";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useCheckSupplierOrderNoQuery, useGetOrderDetailsByorderDetasilIdMutation, useSaveGRNDetailsMutation } from "../../api/grnApi";
import { GRNCLSearchTable, GRNSearchTable } from "./GRNSearchTables";
import { GRNScannedTable } from "./GRNScannedTables";
import { useGetContactLensDetailsMutation } from "../../api/clBatchDetailsApi";
import { useLazyGetBatchesForCLQuery } from "../../api/salesReturnApi";
import Input from "../../components/Form/Input";
import { POCLpowerSearchTable } from "../PurchaseOrder/POSearchTable";

export default function GRNStep3() {
    // Context
    const { grnData, currentStep, updateStep1Data, nextStep, prevStep, resetGRN } = useGRN();

    // User State
    const { user, hasMultipleLocations } = useSelector((state) => state.auth);

    // Local State
    const [isLoading, setIsLoading] = useState(false);
    const [formState, setFormState] = useState({
        companyId: grnData.step1.selectedLocation,
        vendorDetails: grnData.step1.vendorDetails,
        productType: grnData.step2.productType || null,
        barcode: null,
        grnMainId: grnData.step1.GrnMainId,
        clBatchInputType: "select",
        EntryType: "combined",
        lensSupplierOrderNo: "",
        clGRNType: "Against Order",
        rate: null,
        fittingCharge: null,
        gstAmt: null,
        fittingGstAmt: null
    });
    const [scannedItems, setScannedItems] = useState([]);
    const [showSearchInputs, setShowSearchInputs] = useState(false);
    const [filteredBrands, setFilteredBrands] = useState([]);
    const [brandInput, setBrandInput] = useState("");
    const [brandId, setBrandId] = useState(null);
    const [modelNo, setModelNo] = useState("");
    const [selectedRows, setSelectedRows] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [productName, setProductName] = useState("");
    const [clSearchItems, setClSearchItems] = useState([]);
    const [selectedBatchCode, setSelectedBatchCode] = useState(null);
    const [batchCodeInput, setbatchCodeInput] = useState("");
    const [modalityInput, setModalityInput] = useState("");
    const [modalityId, setModalityId] = useState(null);
    const [productInput, setProductInput] = useState("");
    const [productId, setProductId] = useState(null);
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
    const [olPowerDia, setOlPowerDia] = useState([]);
    const [lensDD, setLensDD] = useState([]);
    const [lensDDInput, setlensDDInput] = useState("");
    const [selectedLensDD, setSelectedLensDD] = useState(null);
    const [GRNOrderPowerDetails, setGRNOrderPowerDetails] = useState(null);
    const [error, setError] = useState({
        lensSupplierOrderNo: null
    });

    // RTK Mutation Hooks
    const [SaveGRN, { isLoading: isSavingGRN }] = useSaveGRNDetailsMutation();
    const [getPowerDetails, { isLoading: isPowerDetailsLoading }] = useGetPowerDetailsMutation();
    const [getOrderDD, { isLoading: isGetOrderDDLoading }] = useGetOrderddMutation();
    const [getGRNOrderDetails] = useGetOrderDetailsByorderDetasilIdMutation();
    // RTK Query Hooks
    const [triggerBarcodeQuery, {
        data: frameData,
        isFetching: isBarcodeLoading,
        isError: isBarcodeError,
        error: barcodeError
    }] = useLazyGetByBarCodeQuery();

    const [triggerSearchOLByBarcode, {
        data: OLData,
        isFetching: isOLFetching,
        isLoading: isOLLoading
    }] = useLazyGetOlByBarcodeQuery();

    const [getCLBatches, { data: CLBatches }] = useLazyGetBatchesForCLQuery();
    const { data: modalities, isLoading: modalitiesLoading } = useGetModalitiesQuery();

    const { data: allBrands } = useGetAllBrandsQuery();

    const { data: productData, isLoading: isProductsLoading } = useGetProductNamesByModalityQuery(
        { brandId: brandId, modalityId: modalityId },
        { skip: !brandId || !modalityId }
    );

    const { data: isUniqueResponse, refetch: checkSupplierNoUnique } = useCheckSupplierOrderNoQuery(
        { docNo: formState.lensSupplierOrderNo, vendorId: grnData?.step1?.selectedVendor, companyId: grnData?.step1?.selectedLocation },
        {
            skip: (!formState.lensSupplierOrderNo || !grnData?.step1?.selectedVendor || !grnData?.step1?.selectedLocation),
            refetchOnMountOrArgChange: true  // Always refetch to get latest data
        }
    )

    console.log("GRN data --------------- ", grnData);

    console.log("isUniqueResponse ------------------ ", isUniqueResponse);

    const isUnique = isUniqueResponse?.isUnique;


    useEffect(() => {
        if (formState.lensSupplierOrderNo && grnData?.step1?.selectedVendor && grnData?.step1?.selectedLocation) {
            checkSupplierNoUnique();
        }
    }, [formState.lensSupplierOrderNo, grnData?.step1?.selectedVendor, grnData?.step1?.selectedLocation]);

    // useEffect to set filtered brands when allBrands changes
    useEffect(() => {
        if (allBrands) {
            if (formState.productType === "Frame/Sunglass") {
                const frameBrands = allBrands?.filter(
                    (b) =>
                        b.FrameActive === 1 &&
                        b.IsActive === 1 &&
                        b.BrandName.toLowerCase().includes(brandInput.toLowerCase())
                );
                setFilteredBrands(frameBrands);
            }
            if (formState.productType === "Accessories") {
                const accessoriesBrands = allBrands?.filter(
                    (b) =>
                        b.OthersProductsActive === 1 &&
                        b.IsActive === 1 &&
                        b.BrandName.toLowerCase().includes(brandInput.toLowerCase())
                );
                setFilteredBrands(accessoriesBrands);
            }
            if (formState.productType === "Contact Lens") {
                const contactLensBrands = allBrands?.filter(
                    (b) =>
                        b.ContactLensActive === 1 &&
                        b.IsActive === 1 &&
                        b.BrandName.toLowerCase().includes(brandInput.toLowerCase())
                );
                setFilteredBrands(contactLensBrands);
            }
            if (formState.productType === "Lens") {
                const OlBrands = allBrands?.filter(
                    (b) =>
                        b.OpticalLensActive === 1 &&
                        b.IsActive === 1 &&
                        b.BrandName.toLowerCase().includes(brandInput.toLowerCase())
                );
                setFilteredBrands(OlBrands);
            }
        }
    }, [formState.productType, allBrands, brandInput]);

    useEffect(() => {
        const getDD = async () => {
            const payload = {
                productType: (grnData?.step2?.productType === "Lens" ? "0"
                    : grnData?.step2?.productType === "Frame/Sunglass" ? 1
                        : grnData?.step2?.productType === "Accessories" ? 2
                            : grnData?.step2?.productType === "Contact Lens" ? 3
                                : null) ?? null,
                locationId: grnData?.step1?.selectedLocation,
                masterId: []
            };

            try {
                let responsea = await getOrderDD(payload).unwrap();

                // Validate that responsea is an array
                if (!Array.isArray(responsea)) {
                    throw new Error('Expected responsea to be an array');
                }

                // Create a mutable copy and sort by orderDetailId in descending order
                const sortedResponse = [...responsea].sort((a, b) => {
                    const aId = a.orderDetailId ?? 0;
                    const bId = b.orderDetailId ?? 0;
                    return bId - aId;
                });

                setLensDD(sortedResponse);

                console.log("DD response ----------", sortedResponse);
            } catch (error) {
                console.error("Error fetching dropdown data:", error);
            }
        };

        if (formState.productType === "Lens" && grnData?.step1?.selectedLocation) {
            getDD();
        }
    }, [formState.productType, grnData]);

    useEffect(() => {
        const GRNOrderDetails = async () => {
            if (!selectedLensDD?.orderDetailId) return;

            const payload = {
                orderDetailId: selectedLensDD.orderDetailId,
                vendorId: grnData?.step1?.selectedVendor,
                companyId: grnData?.step1?.selectedLocation
            };

            try {
                const response = await getGRNOrderDetails(payload).unwrap();
                console.log("Order Detail GRN ------------ ", response);
                setGRNOrderPowerDetails(response.data);
                const baseRate = response?.data?.ProductDetails?.Stock?.BuyingPrice || 0;
                const tintBuying = response?.data?.Tint?.TintBuying
                    ? (response.data.OrderQuantity < 2
                        ? (Number(response.data.Tint.TintBuying) / 2 || 0)
                        : Number(response.data.Tint.TintBuying) || 0)
                    : 0;
                const addOnBuying = response?.data?.AddOd?.AddOnBuying
                    ? (response.data.OrderQuantity < 2
                        ? (Number(response.data.AddOd.AddOnBuying) / 2 || 0)
                        : Number(response.data.AddOd.AddOnBuying) || 0)
                    : 0;

                const totalRate = (parseFloat(baseRate) + parseFloat(tintBuying) + parseFloat(addOnBuying)).toFixed(2);
                console.log("baseRate:", baseRate, "tintBuying:", tintBuying, "addOnBuying:", addOnBuying, "totalRate:", totalRate);

                setFormState(prev => ({
                    ...prev,
                    rate: totalRate,
                    fittingCharge: response?.data?.FittingChargeDetails?.FittingPrice || null,
                    errors: { ...prev.errors }
                }));
            } catch (error) {
                console.error("Error fetching GRN order details:", error);
                toast.error("Failed to fetch order details");
            }
        };

        if (formState.productType === "Lens" && grnData.step1.selectedLocation && grnData.step1.selectedVendor && selectedLensDD) {
            GRNOrderDetails();
        }
    }, [formState.productType, selectedLensDD, grnData]);


    // Calculate rate using useMemo
    const calculatedRate = useMemo(() => {
        const baseRate = Number(formState.rate) || 0;
        const tintBuying = GRNOrderPowerDetails?.Tint?.TintBuying
            ? (GRNOrderPowerDetails.OrderQuantity < 2
                ? (Number(GRNOrderPowerDetails.Tint.TintBuying) / 2 || 0)
                : Number(GRNOrderPowerDetails.Tint.TintBuying) || 0)
            : 0;
        const addOnBuying = GRNOrderPowerDetails?.AddOd?.AddOnBuying
            ? (GRNOrderPowerDetails.OrderQuantity < 2
                ? (Number(GRNOrderPowerDetails.AddOd.AddOnBuying) / 2 || 0)
                : Number(GRNOrderPowerDetails.AddOd.AddOnBuying) || 0)
            : 0;
        return baseRate + tintBuying + addOnBuying;
    }, [formState.rate, GRNOrderPowerDetails]);

    const [triggerbrandandModelQuery, {
        data: frameDatabrandandModel,
        isFetching: isbrandandModelLoading,
        isError: isbrandandModelError,
        error: brandandModelError
    }] = useLazyGetByBrandAndModalQuery();

    const [triggerSearchByBrandProduct, {
        isLoading: isBrandModelLoading,
        isFetching: isBrandAndModalFetching
    }] = useLazyGetByBrandAndProductNameQuery();

    const [triggerSearchAccessoryByBarcode, {
        data: AccessoriesData,
        isFetching: isAccessorryFetching,
        isLoading: isAccessorryLoading
    }] = useLazyFetchBarcodeForAccessoryQuery();

    const [triggerSearchCLByBarcode, {
        data: CLData,
        isFetching: isCLFetching,
        isLoading: isCLLoading
    }] = useGetContactLensDetailsMutation();

    // Handler functions
    const handleBack = () => {
        prevStep();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;
        let errors = { ...formState.errors };

        // Validate rate
        if (name === "rate") {
            newValue = value ? Number(value) : null;

            if (newValue !== null && newValue < 0) {
                errors.rate = "Rate cannot be negative";
            } else {
                delete errors.rate;
            }
        }

        setFormState(prev => ({
            ...prev,
            [name]: newValue,
            errors
        }));
    };

    // Handle checkbox selection in search results
    const handleCheckboxChange = (item) => {
        setSelectedRows(prev => {
            const isSelected = prev.some(selectedItem => selectedItem.Barcode === item.Barcode);
            if (isSelected) {
                return prev.filter(selectedItem => selectedItem.Barcode !== item.Barcode);
            } else {
                return [...prev, item];
            }
        });
    };

    // Add selected items from search results to scanned items
    const addSelectedItemsToScanned = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one item");
            return;
        }

        setScannedItems(prevItems => {
            let updatedItems = [...prevItems];

            console.log("newItem ---------- mhabdkab", newItem);

            selectedRows.forEach(newItem => {
                const itemToAdd = {
                    ...newItem,
                    quantity: 1,
                    price: newItem.BuyingPrice || 0,
                    Id: newItem.Id || Date.now(),
                    detailId: newItem.Id,
                    timestamp: Date.now()
                };

                if (formState.EntryType === "combined") {
                    const existingItemIndex = updatedItems.findIndex(
                        item => item.Barcode === newItem.Barcode &&
                            (formState.productType !== "Contact Lens" || item.CLBatchCode === newItem.CLBatchCode)
                    );

                    if (existingItemIndex >= 0) {
                        updatedItems[existingItemIndex] = {
                            ...updatedItems[existingItemIndex],
                            quantity: updatedItems[existingItemIndex].quantity + 1
                        };
                    } else {
                        updatedItems.push(itemToAdd);
                    }
                } else {
                    // Separate entry: always add new row
                    updatedItems.push({
                        ...itemToAdd,
                        Id: Date.now(), // Ensure unique ID for separate entries
                        timestamp: Date.now()
                    });
                }
            });

            // Sort by timestamp in descending order (latest first)
            updatedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            return updatedItems;
        });

        toast.success(`Added ${selectedRows.length} item(s) to GRN`);
        setSelectedRows([]);
    };

    const handleSearchByBarcode = async (type) => {
        if (!formState.barcode || !formState.companyId) {
            toast.error("Please enter a barcode and select a location");
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
            setIsLoading(true);
            const result = await typeFunction({
                barcode: formState.barcode,
                locationId: formState.companyId
            }).unwrap();

            console.log("pBuyingPriceadbakndkjand", result);

            if (result.data) {
                let newItem = {};
                if (formState.productType === "Contact Lens") {
                    newItem = {
                        ...result.data.data,
                        quantity: 1,
                        MRP: result?.data?.data?.CLBatchCode === 1 ? result?.data?.data?.MRP : result?.data?.data?.pMRP,
                        price: result?.data?.data?.CLBatchCode === 1 ? result?.data?.data?.BuyingPrice : result?.data?.data?.pBuyingPrice,
                        cLDetailId: result?.data?.data?.CLDetailId,
                        timestamp: Date.now()
                    };
                    if (result.data.data.CLBatchCode === 1) {
                        setClSearchItems([newItem]);
                        await getCLBatches({
                            detailId: result?.data?.data?.CLDetailId,
                            locationId: grnData?.step1?.selectedLocation,
                        }).unwrap();
                    } else {
                        setScannedItems(prevItems => {
                            let updatedItems = [...prevItems];
                            const existingItemIndex = formState.EntryType === "combined"
                                ? updatedItems.findIndex(
                                    item => item.Barcode === newItem.Barcode &&
                                        item.CLBatchCode === newItem.CLBatchCode
                                )
                                : -1;

                            if (existingItemIndex >= 0) {
                                updatedItems[existingItemIndex] = {
                                    ...updatedItems[existingItemIndex],
                                    quantity: updatedItems[existingItemIndex].quantity + 1
                                };
                            } else {
                                updatedItems.push({
                                    ...newItem,
                                    Id: Date.now()
                                });
                            }

                            // Sort by timestamp in descending order (latest first)
                            updatedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                            return updatedItems;

                        });
                        toast.success("CL item added successfully");
                        setFormState(prev => ({
                            ...prev,
                            barcode: ""
                        }));
                    }
                } else {
                    newItem = {
                        ...result.data,
                        quantity: 1,
                        price: result?.data?.BuyingPrice,
                        Id: Date.now(),
                        detailId: result?.data?.Id,
                        timestamp: Date.now()
                    };

                    setScannedItems(prevItems => {
                        let updatedItems = [...prevItems];
                        const existingItemIndex = formState.EntryType === "combined"
                            ? updatedItems.findIndex(item => item.Barcode === newItem.Barcode)
                            : -1;

                        if (existingItemIndex >= 0) {
                            updatedItems[existingItemIndex] = {
                                ...updatedItems[existingItemIndex],
                                quantity: updatedItems[existingItemIndex].quantity + 1
                            };
                        } else {
                            updatedItems.push(newItem);
                        }

                        // Sort by timestamp in descending order (latest first)
                        updatedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                        return updatedItems;

                    });

                    toast.success("Item added successfully");
                    setFormState(prev => ({
                        ...prev,
                        barcode: ""
                    }));
                }
            }
        } catch (error) {
            console.error("Barcode scan failed:", error);
            toast.error("Failed to add item. Please check the barcode and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDetailSearch = async (type) => {
        if (!brandId || (type === 1 && !modelNo) || (type === 2 && !productName)) {
            toast.error(
                type === 1
                    ? "Please enter both brand and model number"
                    : "Please enter both brand and product name"
            );
            return;
        }

        let functionType = null;
        let requestData = {
            brand: brandId,
            locationId: formState.companyId
        };

        if (type === 1) {
            functionType = triggerbrandandModelQuery;
            requestData.modal = modelNo;
        } else if (type === 2) {
            functionType = triggerSearchByBrandProduct;
            requestData.product = productName;
        }

        try {
            const response = await functionType(requestData);

            if (response.status === "fulfilled") {
                const newItems = response?.data?.data || [];
                // const newItems = {
                //     ...response.data.data,
                //     quantity: 1,
                //     price: response?.data?.data?.BuyingPrice,
                //     Id: Date.now(),
                //     detailId: response?.data?.data?.Id,
                //     timestamp: Date.now()
                // };
                setSearchResults(newItems);

                if (newItems.length === 0) {
                    toast.error("No items found matching your criteria");
                } else {
                    toast.success(`Found ${newItems.length} item(s)`);
                }
            } else {
                toast.error("Search failed. Please try again.");
            }
        } catch (error) {
            console.error("Search failed:", error);
            toast.error("Search failed. Please try again.");
            setSearchResults([]);
        }
    };

    const handleGetBatchBarCodeDetails = async () => {

        // const batches = CLBatches;

        const batches = CLBatches?.data;
        console.log("CLBatches ----------- ", CLBatches);
        console.log("selectedBatchCode --------------- ", selectedBatchCode);
        const isAvailable = batches?.find(
            (b) => b.CLBatchCode.toLowerCase() === batchCodeInput.toLowerCase()
        );

        if (!isAvailable) {
            toast.error("Batch barcode not found");
            return;
        }

        console.log("isAvailable -------------- ", isAvailable);

        const newItem = {
            ...clSearchItems[0],
            ...isAvailable,
            quantity: 1,
            price: isAvailable ? isAvailable?.BuyingPrice : clSearchItems[0]?.BuyingPrice || 0,
            MRP: isAvailable.CLMRP,
            Id: Date.now()
        };

        setScannedItems(prevItems => {
            let updatedItems = [...prevItems];
            const existingItemIndex = formState.EntryType === "combined"
                ? updatedItems.findIndex(
                    item => item.Barcode === newItem.Barcode &&
                        item.CLBatchCode === newItem.CLBatchCode
                )
                : -1;

            if (existingItemIndex >= 0) {
                updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    quantity: updatedItems[existingItemIndex].quantity + 1
                };
            } else {
                updatedItems.push(newItem);
            }
            return updatedItems;
        });

        toast.success("Batch added successfully");
        setClSearchItems([]);
        setSelectedBatchCode(null);
        setbatchCodeInput("");
        setFormState(prev => ({
            ...prev,
            barcode: ""
        }));
    };

    const handleAddBatchDatatoScanned = () => {
        if (!selectedBatchCode) {
            toast.error("Please select a batch code");
            return;
        }
        const batches = CLBatches?.data;
        console.log("CLBatches ----------- ", CLBatches);
        console.log("selectedBatchCode --------------- ", selectedBatchCode);

        const isAvailable = batches?.find(
            (b) => b.CLBatchCode.toLowerCase() === selectedBatchCode?.CLBatchCode.toLowerCase()
        );

        if (!isAvailable) {
            toast.error("Batch barcode not found");
            return;
        }

        console.log("isAvailable -------------- ", isAvailable);

        console.log("selectedBatchCode -------------", selectedBatchCode);

        const newItem = {
            ...clSearchItems[0],
            ...selectedBatchCode,
            quantity: 1,
            price: isAvailable ? isAvailable?.BuyingPrice : clSearchItems[0]?.BuyingPrice || 0,
            MRP: selectedBatchCode.CLMRP,
            Id: Date.now(),
            timestamp: Date.now()
        };

        console.log("newItem ------------- ", newItem);
        console.log("setScannedItems ------ ", scannedItems);

        setScannedItems(prevItems => {
            let updatedItems = [...prevItems];
            const existingItemIndex = formState.EntryType === "combined"
                ? updatedItems.findIndex(
                    item => item.Barcode === newItem.Barcode &&
                        item.CLBatchCode === newItem.CLBatchCode
                )
                : -1;

            if (existingItemIndex >= 0) {
                updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    quantity: updatedItems[existingItemIndex].quantity + 1
                };
            } else {
                updatedItems.push(newItem);
            }

            // Sort by timestamp in descending order (latest first)
            updatedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            return updatedItems;
            // return updatedItems;
        });



        toast.success("Batch added successfully");
        setClSearchItems([]);
        setSelectedBatchCode(null);
        setbatchCodeInput("");
        handleRefresh();
        setFormState(prev => ({
            ...prev,
            barcode: ""
        }));
    };

    const handleSubmitGRNDetails = async () => {
        try {
            if (!formState.grnMainId || !grnData?.step1?.GrnMainId) {
                throw new Error("GRN main ID not found");
            }

            if (formState.productType === "Lens" && !isUnique) {
                toast.error("Supplier order number must be unique for this vendor");
                return;
            }

            if (formState.productType === "Lens" && (formState.rate === null || formState.rate < 0)) {
                toast.error("Please enter a valid rate");
                return;
            }

            let grnDetails = [];

            setIsLoading(true);

            if (formState.productType === "Frame/Sunglass" || formState.productType === "Accessories" || formState.productType === "Contact Lens") {
                if (scannedItems.length === 0) {
                    toast.error("Please scan and add at least one item");
                    return;
                }

                grnDetails = scannedItems.map((item, index) => {
                    let taxPercent = 0;

                    if (item?.Tax?.Details && item?.Tax?.Details?.length > 0) {
                        const taxDetails = item?.Tax?.Details;
                        if (taxDetails.length === 1) {
                            taxPercent = parseFloat(taxDetails[0]?.PurTaxPerct) || 0;
                        } else {
                            const transferPrice = item.price || item?.BuyingPrice;

                            for (const taxDetail of taxDetails) {
                                if (taxDetail.SlabEnd && taxDetail.SalesTaxPerct) {
                                    const salesTaxDecimal = parseFloat(taxDetail.SalesTaxPerct) / 100;
                                    const newSlabEnd = parseFloat(taxDetail.SlabEnd) / (1 + salesTaxDecimal);

                                    if (transferPrice <= newSlabEnd) {
                                        taxPercent = parseFloat(taxDetail.PurTaxPerct) || 0;
                                        break;
                                    }
                                }
                            }

                            if (taxPercent === 0) {
                                taxPercent = parseFloat(taxDetails[0].PurTaxPerct) || 0;
                            }
                        }
                    } else if (item?.TaxDetails && item?.TaxDetails?.length > 0) {
                        const taxDetails = item?.TaxDetails;
                        if (taxDetails.length === 1) {
                            taxPercent = parseFloat(taxDetails[0]?.PurTaxPerct) || 0;
                        } else {
                            const transferPrice = item.price || item?.BuyingPrice;

                            for (const taxDetail of taxDetails) {
                                if (taxDetail.SlabEnd && taxDetail.SalesTaxPerct) {
                                    const salesTaxDecimal = parseFloat(taxDetail.SalesTaxPerct) / 100;
                                    const newSlabEnd = parseFloat(taxDetail.SlabEnd) / (1 + salesTaxDecimal);

                                    if (transferPrice <= newSlabEnd) {
                                        taxPercent = parseFloat(taxDetail.PurTaxPerct) || 0;
                                        break;
                                    }
                                }
                            }

                            if (taxPercent === 0) {
                                taxPercent = parseFloat(taxDetails[0].PurTaxPerct) || 0;
                            }
                        }
                    }

                    return {
                        GRNMainID: formState.grnMainId || grnData.step1.GrnMainId,
                        GRNSlNo: index + 1,
                        ProductType: formState.productType === 'Frame/Sunglass' ? 1
                            : formState.productType === 'Lens' ? 0
                                : formState.productType === 'Accessories' ? 2
                                    : formState.productType === 'Contact Lens' ? 3
                                        : null,
                        detailId: formState.productType === 'Contact Lens' ? item.CLDetailId : item.detailId,
                        BatchCode: item.CLBatchCode || null,
                        OrderDetailId: null,
                        VendorOrderNo: null,
                        PODetailsId: null,
                        GRNQty: item.quantity || 1,
                        GRNPrice: item.price || item.BuyingPrice || item.BuyingPriceMaster,
                        TaxPercent: taxPercent,
                        FittingPrice: null,
                        FittingGSTPercentage: null,
                        ApplicationUserId: user.Id
                    };
                });
            }

            if (formState.productType === "Lens") {
                if (!selectedLensDD || !formState.lensSupplierOrderNo) {
                    toast.error("Please select an order and enter a supplier order number");
                    return;
                }

                grnDetails = [{
                    GRNMainID: formState.grnMainId,
                    GRNSlNo: 1,
                    ProductType: 0,
                    detailId: selectedLensDD.olDetailId,
                    BatchCode: selectedLensDD.cLBatchCode || null,
                    OrderDetailId: selectedLensDD.orderDetailId || null,
                    VendorOrderNo: formState.lensSupplierOrderNo || null,
                    PODetailsId: null,
                    GRNQty: GRNOrderPowerDetails?.OrderQuantity || 1,
                    GRNPrice: formState.rate, // Use user-entered rate
                    TaxPercent: GRNOrderPowerDetails?.TaxPercentage,
                    FittingPrice: (GRNOrderPowerDetails?.FittingChargeDetails?.FittingCharges === 1 && GRNOrderPowerDetails?.FittingChargeDetails?.FittingChargesPurchase === 1 && GRNOrderPowerDetails?.FittingChargeDetails?.WithFitting === 1) ? formState.fittingCharge : null,
                    FittingGSTPercentage: (GRNOrderPowerDetails?.FittingChargeDetails?.FittingCharges === 1 && GRNOrderPowerDetails?.FittingChargeDetails?.FittingChargesPurchase === 1 && GRNOrderPowerDetails?.FittingChargeDetails?.WithFitting === 1) ? GRNOrderPowerDetails?.FittingChargeDetails?.FittingGST : null,
                    ApplicationUserId: user.Id
                }];
            }

            console.log("grnDetails ---------- ", grnDetails);

            const response = await SaveGRN(grnDetails).unwrap();
            if (response.status === "success") {
                toast.success("GRN details saved successfully");
                updateStep1Data({
                    GrnMainId: response?.data?.data[0]?.GRNMainID || null,
                });
                nextStep();
            }
        } catch (error) {
            console.error("Error saving GRN details:", error);
            toast.error("Failed to save GRN details. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const updateScannedItemPrice = (index, newPrice) => {
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

    const removeScannedItem = (index) => {
        setScannedItems(prevItems => prevItems.filter((_, i) => i !== index));
        toast.success("Item removed");
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

    const isMultipleOfQuarter = (value) => {
        const num = parseFloat(value);
        return num % 0.25 === 0;
    };

    const isValidAxis = (value) => {
        const num = parseInt(value);
        return num >= 0 && num <= 180;
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
            locationId: grnData.step1.selectedLocation,
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
            toast.success(response?.data.message || "Power details found");

            // Create updated item with response data
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
                // Add truly unique ID for separate entries
                Id: formState.EntryType === "seperate"
                    ? `cl-${data.CLDetailId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                    : data.CLDetailId || Date.now()
            };

            if (data?.CLBatchCode === 1) {
                setClSearchItems([updatedItem]);
                await getCLBatches({
                    detailId: data?.CLDetailId,
                    locationId: grnData?.step1?.selectedLocation,
                }).unwrap();
                toast.success("Please select or scan batch code");
            } else {
                // Add directly to scanned items
                setScannedItems(prevItems => {
                    let updatedItems = [...prevItems];
                    const existingItemIndex = formState.EntryType === "combined"
                        ? updatedItems.findIndex(
                            item => item.Barcode === updatedItem.Barcode && // Use updatedItem instead of newItem
                                item.CLBatchCode === updatedItem.CLBatchCode
                        )
                        : -1;

                    if (existingItemIndex >= 0) {
                        updatedItems[existingItemIndex] = {
                            ...updatedItems[existingItemIndex],
                            quantity: updatedItems[existingItemIndex].quantity + 1
                        };
                    } else {
                        updatedItems.push(updatedItem); // Use updatedItem instead of newItem
                    }

                    // Sort by timestamp in descending order (latest first)
                    updatedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    return updatedItems;
                });
                toast.success(`Added as ${formState.EntryType} entry`);
            }

            setSearchFetched(true);
        } catch (error) {
            console.error("Search error:", error);
            toast.error(error.message || "Failed to search power details");
            setSearchFetched(false);
        }
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
    };

    return (
        <>
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2 Poytal shadow-xl p-6 space-y-10"
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#000060] mb-6">Step 3: Select GRN</h2>
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 flex text-[#000060] rounded-lg hover:bg-gray-100 transition-colors gap-2"
                    >
                        <ArrowLeft />
                        Back
                    </button>
                </div>

                {formState.productType !== 'Lens' ? (

                    <div className="flex justify-start gap-12 mb-6">
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
                                <span className="text-gray-700 font-medium">Separate Entry</span>
                            </label>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-start gap-12 mb-6">
                        <div className="flex space-x-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="clGRNType"
                                    value="Against Order"
                                    checked={formState.clGRNType === "Against Order"}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700 font-medium">Against Order(Stock/Rx)</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="clGRNType"
                                    value="Stock Lenses"
                                    checked={formState.clGRNType === "Stock Lenses"}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700 font-medium">Stock Lenses(Bulk)</span>
                            </label>
                        </div>
                    </div>
                )}

                {(!showSearchInputs && formState.productType !== "Lens") ? (
                    <div className="flex-1 flex items-center gap-5">
                        <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 whitespace-nowrap">
                            Enter Barcode
                        </label>
                        <div className="relative flex-1">
                            <input
                                id="barcode"
                                name="barcode"
                                type="text"
                                autoFocus
                                value={formState.barcode || ''}
                                onChange={handleInputChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (formState.productType === "Frame/Sunglass") {
                                            handleSearchByBarcode(1);
                                        } else if (formState.productType === "Lens") {
                                            handleSearchByBarcode(2);
                                        } else if (formState.productType === "Accessories") {
                                            handleSearchByBarcode(3);
                                        } else if (formState.productType === "Contact Lens") {
                                            handleSearchByBarcode(4);
                                        }
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
                                if (formState.productType === "Frame/Sunglass") {
                                    handleSearchByBarcode(1);
                                } else if (formState.productType === "Lens") {
                                    handleSearchByBarcode(2);
                                } else if (formState.productType === "Accessories") {
                                    handleSearchByBarcode(3);
                                } else if (formState.productType === "Contact Lens") {
                                    handleSearchByBarcode(4);
                                }
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
                            onClick={() => setShowSearchInputs(true)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap flex items-center"
                        >
                            <SearchIcon className="h-4 w-4 mr-1" />
                            Search
                        </button>
                    </div>
                ) : (showSearchInputs && formState.productType !== "Lens") ? (
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-wrap">
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

                        {formState.productType === "Frame/Sunglass" && (
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

                        {formState.productType === "Accessories" && (
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

                        {formState.productType === "Contact Lens" && (
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
                        )}

                        <button
                            onClick={() => {
                                if (formState.productType === "Frame/Sunglass") handleDetailSearch(1)
                                else if (formState.productType === "Accessories") handleDetailSearch(2)
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center justify-center w-full md:w-auto"
                            disabled={!brandId || (formState.productType === "Frame/Sunglass" && !modelNo) || (formState.productType === "Accessories" && !productName)}
                        >
                            <SearchIcon className="h-4 w-4 mr-1" />
                            Search
                        </button>

                        <button
                            onClick={() => {
                                setShowSearchInputs(false);
                                setBrandId(null);
                                setBrandInput("");
                                setModalityId(null);
                                setModalityInput("");
                                setProductId(null);
                                setProductInput("");
                                setProductName("");
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap flex items-center justify-center w-full md:w-auto"
                        >
                            Back to Barcode
                        </button>
                    </div>
                ) : (!showSearchInputs && formState.productType === "Lens") ? (
                    <div className="flex-1 min-w-[200px]">
                        <Autocomplete
                            options={lensDD}
                            getOptionLabel={(option) => option.orderNoDDCl}
                            onInputChange={(event, value) => {
                                setlensDDInput(value);
                            }}
                            onChange={(event, newValue) => {
                                if (newValue) {
                                    setlensDDInput(newValue.orderNoDDCl);
                                    setSelectedLensDD(newValue);
                                } else {
                                    setlensDDInput("");
                                    setSelectedLensDD(null);
                                }
                            }}
                            value={
                                lensDD.find((b) => b.orderNoDDCl === lensDDInput) ||
                                null
                            }
                            isOptionEqualToValue={(option, value) =>
                                option.orderNoDDCl === value.orderNoDDCl
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Search Order no."
                                    variant="outlined"
                                    fullWidth
                                />
                            )}
                        />
                    </div>
                ) : null}

                {console.log("selectedLensDD ---------------- ", selectedLensDD)}
                {(!showSearchInputs && formState.productType === "Lens" && selectedLensDD) && (
                    <>
                        <div key={selectedLensDD.Id} className="mb-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <p className="text-gray-700 ">
                                    <span className="font-bold flex">Patient Name </span>
                                    <span>{selectedLensDD.customerName}</span>
                                </p>
                                <p className="text-gray-700">
                                    <span className="font-bold flex">Order Reference</span>
                                    <span>{selectedLensDD.orderReference}</span>
                                </p>
                                <p className="text-gray-700">
                                    <span className="font-bold flex">With Fitting</span>
                                    <span>{selectedLensDD.withFitting === 1 ? "Yes" : "No"}</span>
                                </p>
                                {/* <p className="text-gray-700">
                                    <span className="font-bold flex">Product Name</span>
                                    <span className="flex">{selectedLensDD.productDescName}</span>
                                </p> */}
                            </div>
                            <p className="text-gray-700">
                                <span className="font-bold flex">Product Name</span>
                                <span className="flex">{selectedLensDD.productDescName}</span>
                            </p>
                        </div>



                        {GRNOrderPowerDetails && (
                            <>
                                <div className="flex">
                                    {(GRNOrderPowerDetails?.PowerDetails?.RightSphericalPower ||
                                        GRNOrderPowerDetails?.PowerDetails?.RightCylindricalPower ||
                                        GRNOrderPowerDetails?.PowerDetails?.RightAxis ||
                                        GRNOrderPowerDetails?.PowerDetails?.RightAddPower) && (
                                            `R: Sph: ${GRNOrderPowerDetails?.PowerDetails?.RightSphericalPower > 0 ? `+` : ``}${GRNOrderPowerDetails?.PowerDetails?.RightSphericalPower || ''} 
                                            Cyl: ${GRNOrderPowerDetails?.PowerDetails?.RightCylindricalPower > 0 ? `+` : ``}${GRNOrderPowerDetails?.PowerDetails?.RightCylindricalPower || ''} 
                                            Axis: ${GRNOrderPowerDetails?.PowerDetails?.RightAxis > 0 ? `+` : ``}${GRNOrderPowerDetails?.PowerDetails?.RightAxis || ''} 
                                            Add: ${GRNOrderPowerDetails?.PowerDetails?.RightAddPower > 0 ? `+` : ``}${GRNOrderPowerDetails?.PowerDetails?.RightAddPower || ''}`
                                        )}
                                    <br />
                                    {(GRNOrderPowerDetails?.PowerDetails?.LeftSphericalPower ||
                                        GRNOrderPowerDetails?.PowerDetails?.LeftCylindricalPower ||
                                        GRNOrderPowerDetails?.PowerDetails?.LeftAxis ||
                                        GRNOrderPowerDetails?.PowerDetails?.LeftAddPower) && (
                                            `L: Sph: ${GRNOrderPowerDetails?.PowerDetails?.LeftSphericalPower > 0 ? `+` : ``}${GRNOrderPowerDetails?.PowerDetails?.LeftSphericalPower || ''} 
                                            Cyl: ${GRNOrderPowerDetails?.PowerDetails?.LeftCylindricalPower > 0 ? `+` : ``}${GRNOrderPowerDetails?.PowerDetails?.LeftCylindricalPower || ''} 
                                            Axis: ${GRNOrderPowerDetails?.PowerDetails?.LeftAxis > 0 ? `+` : ``}${GRNOrderPowerDetails?.PowerDetails?.LeftAxis || ''} 
                                            Add: ${GRNOrderPowerDetails?.PowerDetails?.LeftAddPower > 0 ? `+` : ``}${GRNOrderPowerDetails?.PowerDetails?.LeftAddPower || ''}`
                                        )}
                                </div>

                            </>
                        )}

                        <div className="flex items-center gap-4">
                            <label>Supplier Order No.</label>
                            <input
                                id="lensSupplierOrderNo"
                                name="lensSupplierOrderNo"
                                type="text"
                                autoComplete="off"
                                autoFocus
                                value={formState.lensSupplierOrderNo || ''}
                                onChange={handleInputChange}
                                className=" px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#000060] pr-10"
                                placeholder="Supplier Order No."
                                aria-label="Supplier Order no input"
                                error={isUnique === false ? "Supplier order number must be unique for this vendor" : error.lensSupplierOrderNo || ""}
                                helperText={error.lensSupplierOrderNo || "Must be unique for this vendor"}
                                disabled={isLoading}
                            />

                        </div>

                        {GRNOrderPowerDetails && (
                            <>
                                <div className="flex items-center justify-between gap-4 w-full mb-4">
                                    <div className="flex flex-col flex-1">
                                        <label htmlFor="rQty" className="text-sm font-medium text-gray-700 mb-1">Qty *</label>
                                        <input
                                            id="rQty"
                                            name="rQty"
                                            type="number"
                                            value={GRNOrderPowerDetails?.OrderQuantity}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            disabled={true}
                                        />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <label htmlFor="rate" className="text-sm font-medium text-gray-700 mb-1">Rate *</label>
                                        {/* {} */}
                                        <input
                                            id="rate"
                                            name="rate"
                                            type="number"
                                            value={formState.rate ?? ''}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        // disabled={true}
                                        />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <label htmlFor="gst" className="text-sm font-medium text-gray-700 mb-1">GST% & Amt *</label>
                                        <input
                                            id="gst"
                                            name="gst"
                                            type="text"
                                            value={`₹ ${(
                                                (parseFloat(formState.rate))
                                                * (GRNOrderPowerDetails?.TaxPercentage / 100)
                                            ).toFixed(2)} (${Number(GRNOrderPowerDetails?.TaxPercentage || 0)}%)`}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            disabled={true}
                                        />
                                    </div>
                                </div>

                                {(GRNOrderPowerDetails?.FittingChargeDetails?.FittingCharges === 1 && GRNOrderPowerDetails?.FittingChargeDetails?.FittingChargesPurchase === 1 && GRNOrderPowerDetails?.FittingChargeDetails?.WithFitting === 1) && (
                                    <div className="flex items-center justify-between gap-4 w-full">
                                        <div className="flex flex-col flex-1">
                                            <label htmlFor="fittingCharge" className="text-sm font-medium text-gray-700 mb-1">Fitting Charges *</label>
                                            <input
                                                id="fittingCharge"
                                                name="fittingCharge"
                                                type="number"
                                                value={`${formState.fittingCharge}`}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            // disabled={true}
                                            />
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <label htmlFor="fittingGst" className="text-sm font-medium text-gray-700 mb-1">Fitting Amt & GST% *</label>
                                            <input
                                                id="fittingGst"
                                                name="fittingGst"
                                                type="text"
                                                value={`₹ ${(
                                                    Number(formState.fittingCharge || 0) *
                                                    (Number(GRNOrderPowerDetails?.FittingChargeDetails?.FittingGST || 0) / 100)
                                                ).toFixed(2)} (${Number(GRNOrderPowerDetails?.FittingChargeDetails?.FittingGST || 0)}%)`}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                disabled={true}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between gap-4 w-full mb-4">
                                    <div className="flex flex-col flex-1">
                                        <label htmlFor="totalBasicAmt" className="text-sm font-medium text-gray-700 mb-1">Total Basic Amt</label>
                                        <div className="w-full px-3 py-2 text-sm">
                                            {`₹ ${(((formState.rate || 0) * GRNOrderPowerDetails?.OrderQuantity) + Number(formState.fittingCharge || 0)).toFixed(2)}`}
                                        </div>
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <label htmlFor="totalGst" className="text-sm font-medium text-gray-700 mb-1">Total GST *</label>
                                        <div className="w-full px-3 py-2 text-sm">
                                            {`₹ ${(((formState.rate || 0) * (GRNOrderPowerDetails?.TaxPercentage / 100) * GRNOrderPowerDetails?.OrderQuantity) + (Number(formState.fittingCharge || 0) * (Number(GRNOrderPowerDetails?.FittingChargeDetails?.FittingGST || 0) / 100))).toFixed(2)}`}
                                        </div>
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <label htmlFor="totalQty" className="text-sm font-medium text-gray-700 mb-1">Total Qty *</label>
                                        <div className="w-full px-3 py-2 text-sm">
                                            {GRNOrderPowerDetails?.OrderQuantity}
                                        </div>
                                    </div>
                                    {(grnData?.step1?.vendorDetails?.DCGRNPrice === 1 && grnData?.step1?.billingMethod === "dc") ? null : (
                                        <div className="flex flex-col flex-1">
                                            <label htmlFor="totalAmt" className="text-sm font-medium text-gray-700 mb-1">Total Amt *</label>
                                            <div className="w-full px-3 py-2 text-sm">
                                                {`₹ ${(
                                                    ((formState.rate || 0) * GRNOrderPowerDetails?.OrderQuantity) +
                                                    Number(formState.fittingCharge || 0) +
                                                    ((formState.rate || 0) * (GRNOrderPowerDetails?.TaxPercentage / 100) * GRNOrderPowerDetails?.OrderQuantity) +
                                                    (Number(formState.fittingCharge || 0) * (Number(GRNOrderPowerDetails?.FittingChargeDetails?.FittingGST || 0) / 100))
                                                ).toFixed(2)}`}
                                            </div>
                                        </div>

                                    )}
                                </div>
                            </>
                        )}
                    </>
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

                {(showSearchInputs && searchResults.length > 0) && (
                    <div className="mt-6">
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

                        <GRNSearchTable
                            searchResults={searchResults}
                            selectedRows={selectedRows}
                            handleCheckboxChange={handleCheckboxChange}
                            productType={grnData.step2.productType === "Frame/Sunglass" ? 1 : grnData.step2.productType === "Accessories" ? 2 : null}
                        />
                    </div>
                )}

                {(formState.productType === "Contact Lens" && clSearchItems.length > 0) && (
                    <>
                        <div className="mt-6">
                            <div className="flex items-center space-x-10">
                                <div className="flex space-x-4">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="clBatchInputType"
                                            value="select"
                                            checked={formState.clBatchInputType === "select"}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700 font-medium">Select Batch code</span>
                                    </label>

                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="clBatchInputType"
                                            value="enter"
                                            checked={formState.clBatchInputType === "enter"}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700 font-medium">Enter Batch Barcode</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {formState.clBatchInputType === "select" ? (
                            <div className="flex items-end gap-2">
                                <div className="space-y-2 w-1/3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Select by BatchCode
                                    </label>
                                    {/* {console.log("CLBatches ------------- ", CLBatches)} */}
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
                                    <button
                                        className="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                                        onClick={handleAddBatchDatatoScanned}
                                    >
                                        Add
                                    </button>
                                )}
                            </div>
                        ) : formState.clBatchInputType === "enter" ? (
                            // <div className="w-1/2 mt-5 flex items-center gap-4">
                            //     <Input
                            //         value={batchCodeInput}
                            //         onChange={(e) => setbatchCodeInput(e.target.value)}
                            //         label="Enter BatchBarCode"
                            //         onKeyDown={(e) => {
                            //             if (e.key === "Enter") {
                            //                 handleGetBatchBarCodeDetails();
                            //             }
                            //         }}
                            //     />
                            //     <button
                            //         className="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                            //         onClick={handleGetBatchBarCodeDetails}
                            //     >
                            //         Add
                            //     </button>
                            // </div>
                            <div className="w-1/2 mt-5 flex items-center gap-4">
                                <Input
                                    value={batchCodeInput}
                                    onChange={(e) => setbatchCodeInput(e.target.value)}
                                    label="Enter BatchBarCode"
                                    error={
                                        batchCodeInput &&
                                        !CLBatches?.data?.find(
                                            (b) => b.CLBatchBarCode.toLowerCase() === batchCodeInput.toLowerCase()
                                        )
                                    }
                                    helperText={
                                        batchCodeInput &&
                                            !CLBatches?.data?.find(
                                                (b) => b.CLBatchBarCode.toLowerCase() === batchCodeInput.toLowerCase()
                                            )
                                            ? "Invalid batch barcode"
                                            : "Required"
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && batchCodeInput) {
                                            const isValidBatch = CLBatches?.data?.find(
                                                (b) => b.CLBatchBarCode.toLowerCase() === batchCodeInput.toLowerCase()
                                            );
                                            if (isValidBatch) {
                                                setSelectedBatchCode(isValidBatch);
                                                handleGetBatchBarCodeDetails();
                                            } else {
                                                toast.error("Invalid batch barcode");
                                            }
                                        }
                                    }}
                                />
                                <button
                                    className="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                                    onClick={() => {
                                        if (batchCodeInput) {
                                            const isValidBatch = CLBatches?.data?.find(
                                                (b) => b.CLBatchBarCode.toLowerCase() === batchCodeInput.toLowerCase()
                                            );
                                            if (isValidBatch) {
                                                setSelectedBatchCode(isValidBatch);
                                                handleGetBatchBarCodeDetails();
                                            } else {
                                                toast.error("Invalid batch barcode");
                                            }
                                        }
                                    }}
                                    disabled={!batchCodeInput}
                                >
                                    Add
                                </button>
                            </div>
                        ) : null}
                    </>
                )}


                {console.log("scannedItems --------", scannedItems)}
                {scannedItems.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">GRN Items</h3>
                        <GRNScannedTable
                            scannedItems={scannedItems}
                            updateScannedItemPrice={updateScannedItemPrice}
                            updateScannedItemQuantity={updateScannedItemQuantity}
                            removeScannedItem={removeScannedItem}
                            productType={grnData.step2.productType === "Frame/Sunglass" ? 1 : grnData.step2.productType === "Accessories" ? 2 : grnData.step2.productType === "Contact Lens" ? 3 : null}
                        />
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
                            onClick={handleSubmitGRNDetails}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                            disabled={formState.productType === "Lens" ? (!formState.lensSupplierOrderNo || !selectedLensDD) : scannedItems.length <= 0}
                        >
                            Save & Next
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
}