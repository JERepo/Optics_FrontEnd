import { useGRN } from "../../features/GRNContext";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, SearchIcon, Trash2 } from "lucide-react";
import { Autocomplete, TextField } from "@mui/material";
import { useEffect, useState } from "react";
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
import { useCheckSupplierOrderNoQuery, useGetGRNPOdetailsByIdMutation, useGetOrderDetailsByorderDetasilIdMutation, useLazyCheckGRNQtyValidationQuery, useLazyGetAccessoryByBarcodeQuery, useLazyGetAccessoryByDetailIdQuery, useLazyGetCLByBarcodeQuery, useLazyGetCLByDetailIdQuery, useLazyGetFrameByBarcodeQuery, useSaveGRNDetailsMutation } from "../../api/grnApi";
import { GRNCLSearchTable, GRNSearchTable } from "./GRNSearchTables";
import { GRNScannedTable } from "./GRNScannedTables";
import { useGetContactLensDetailsMutation } from "../../api/clBatchDetailsApi";
import { useLazyGetBatchesForCLQuery } from "../../api/salesReturnApi";
import Input from "../../components/Form/Input";
import { POCLpowerSearchTable } from "../PurchaseOrder/POSearchTable";
import { GRNAgainstPOScannedTable } from "./GRNAgainstPOScannedTables";
import { BatchSelectionModal, GRNAgainstPOSearchTable } from "./GRNAgainstPOSearchTables";

export default function GRNStep4AgainstPO() {
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
    const [poDetailsItems, setPODetailsItems] = useState([]);
    const [filteredBrands, setFilteredBrands] = useState([]);
    const [againstPOBarcodeSearchedItems, setAgainstPOBarcodeSearchedItems] = useState([]);
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
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [grnQtyAgainstPOForBarcode, setGrnQtyAgainstPOForBarcode] = useState(null);
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

    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [selectedItemForBatch, setSelectedItemForBatch] = useState(null);

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
    }] = useLazyGetFrameByBarcodeQuery();

    const [triggerSearchOLByBarcode, {
        data: OLData,
        isFetching: isOLFetching,
        isLoading: isOLLoading
    }] = useLazyGetOlByBarcodeQuery();

    const [triggerGRNQtyValidationCheck] = useLazyCheckGRNQtyValidationQuery();

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
                productType: (grnData?.step2?.productType === "Lens" ? 0
                    : grnData?.step2?.productType === "Frame/Sunglass" ? 1
                        : grnData?.step2?.productType === "Accessories" ? 2
                            : grnData?.step2?.productType === "Contact Lens" ? 3
                                : null) ?? null,
                locationId: grnData?.step1?.selectedLocation,
                masterId: []
            }
            const responsea = await getOrderDD(payload).unwrap();
            setLensDD(responsea);

            console.log("DD reponse ----------", responsea);
        }
        if (formState.productType === "Lens" && grnData.step1.selectedLocation) {
            getDD();
        }
    }, [formState.productType]);

    useEffect(() => {
        const GRNOrderDetails = async () => {
            const payload = {
                orderDetailId: selectedLensDD?.orderDetailId,
                vendorId: grnData?.step1?.selectedVendor,
                companyId: grnData?.step1?.selectedLocation
            }

            const response = await getGRNOrderDetails(payload).unwrap();
            console.log("Order Detail GRN ------------ ", response);
            setGRNOrderPowerDetails(response.data);
            setFormState(prev => ({
                ...prev,
                rate: response?.data?.ProductDetails?.Stock?.BuyingPrice,
                fittingCharge: response?.data?.FittingChargeDetails?.FittingPrice
            }));
        }
        if (formState.productType === "Lens" && grnData.step1.selectedLocation && grnData.step1.selectedVendor) {
            GRNOrderDetails();
        }
    }, [formState.productType, selectedLensDD, grnData])

    const [triggerbrandandModelQuery, {
        data: frameDatabrandandModel,
        isFetching: isbrandandModelLoading,
        isError: isbrandandModelError,
        error: brandandModelError
    }] = useLazyGetByBrandAndModalQuery();

    // const [triggerSearchByBrandProduct, {
    //     isLoading: isBrandModelLoading,
    //     isFetching: isBrandAndModalFetching
    // }] = useLazyGetAccessoryByBrandProductNameQuery();

    const [triggerSearchAccByBrandProduct] = useLazyGetByBrandAndProductNameQuery();

    const [triggerSearchAccessoryByBarcode, {
        data: AccessoriesData,
        isFetching: isAccessorryFetching,
        isLoading: isAccessorryLoading
    }] = useLazyGetAccessoryByBarcodeQuery();

    const [triggerSearchCLByBarcode, {
        data: CLData,
        isFetching: isCLFetching,
        isLoading: isCLLoading
    }] = useLazyGetCLByBarcodeQuery();

    const [triggerGetGRNPODetailById] = useGetGRNPOdetailsByIdMutation();
    const [triggerGetAccessoryPOByDetailId] = useLazyGetAccessoryByDetailIdQuery();
    const [triggerGetCLPOByDetailId] = useLazyGetCLByDetailIdQuery();

    // Handler functions
    const handleBack = () => {
        prevStep();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle checkbox selection in search results
    const handleCheckboxChange = (item) => {
        setSelectedRows(prev => {
            const isSelected = prev.some(selectedItem => selectedItem.uniqueId === item.uniqueId);
            if (isSelected) {
                return prev.filter(selectedItem => selectedItem.uniqueId !== item.uniqueId);
            } else {
                return [...prev, item];
            }
        });
    };

    const handleGetPOdetailsByDetailId = async (detailId) => {
        if (!detailId) {
            toast.error("Detail Id is required");
            return;
        }

        try {
            const payload = {
                locationId: formState.companyId || null,
                vendorId: grnData?.step1?.selectedVendor,
                productType: grnData?.step2?.productType === "Frame/Sunglass" ? 1
                    : grnData?.step2?.productType === "Accessories" ? 2
                        : grnData?.step2?.productType === "Contact Lens" ? 3
                            : null
            };
            let query = null;
            if (grnData?.step2?.productType === "Frame/Sunglass") {
                payload.frameDetailIds = [detailId];
                query = triggerGetGRNPODetailById;
            } else if (grnData?.step2?.productType === "Accessories") {
                payload.accessoryDetailId = [detailId];
                query = triggerGetAccessoryPOByDetailId;
            } else if (grnData?.step2?.productType === "Contact Lens") {
                payload.clDetailId = [detailId];
                query = triggerGetCLPOByDetailId;
            }

            const result = await query(payload).unwrap();


            if (result && result.data && result.data.length > 0) {
                setPODetailsItems(prevItems => {
                    let updatedItems = [...prevItems];

                    console.log("New Item =============================== ", result.data)

                    result.data.forEach(newItem => {
                        const itemToAdd = {
                            ...newItem,
                            quantity: 1,
                            price: newItem.BuyingPrice || 0,
                            Id: newItem.Id, // Ensure unique ID
                            detailId: newItem.Id,
                            timestamp: Date.now()
                        };

                        if (formState.EntryType === "combined") {
                            const existingItemIndex = updatedItems.findIndex(
                                item => item.uniqueId === newItem.uniqueId &&
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
                                Id: newItem.Id,// Date.now() + Math.random(), // Ensure unique ID for separate entries
                                detailId: newItem.Id,
                                timestamp: Date.now()
                            });
                        }
                    });

                    // Sort by timestamp in descending order (latest first)
                    updatedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    return updatedItems;
                });

                toast.success(`Added ${result.data.length} item(s) to GRN`);
                // setSearchResults([]);
                setBrandId(null);
                setBrandInput("");
                setProductId(null);
                setProductInput("");
                setProductName("");
                setModalityId(null);
                setModalityInput("");
                handleRefresh();
            } else {
                toast.error("No PO details found for this item");
            }
        } catch (err) {
            console.error("Failed to fetch PO details:", err);
            toast.error("Failed to fetch PO details. Please try again.");
        }
    };

    // Add selected items from search results to scanned items
    const addSelectedItemsToScanned = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one item");
            return;
        }

        setScannedItems(prevItems => {
            let updatedItems = [...prevItems];

            selectedRows.forEach(newItem => {
                const itemToAdd = {
                    ...newItem,
                    // quantity: 1,
                    price: newItem.BuyingPrice || 0,
                    Id: newItem.Id || Date.now(),
                    detailId: newItem.Id,
                    timestamp: Date.now()
                };

                if (formState.EntryType === "combined") {
                    const existingItemIndex = updatedItems.findIndex(
                        item => item.uniqueId === newItem.uniqueId &&
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
                        detailId: newItem.Id,
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



    const handleAddPOdetailstoScannedTable = async (item) => {
        console.log("item=================", item);

        if (isAddingItem) return; // Prevent multiple clicks

        setIsAddingItem(true);

        try {
            // Check if the item is a Contact Lens with CLBatchCode == 1
            if (formState.productType === "Contact Lens" && item.CLBatchCode === 1) {
                // Fetch batches for the item
                await getCLBatches({
                    detailId: item.Id,
                    locationId: grnData?.step1?.selectedLocation,
                }).unwrap();
                setSelectedItemForBatch(item);
                setIsBatchModalOpen(true); // Open the modal
                setIsAddingItem(false);
                return;
            }

            // Calculate total GRNQty for this PODetailId from existing scanned items
            const existingGRNQtyForPO = scannedItems
                .filter(scannedItem => scannedItem.PODetailsId === item.PODetailsId)
                .reduce((total, scannedItem) => total + (scannedItem.quantity || 0), 0);

            const newTotalGRNQty = existingGRNQtyForPO + 1; // Adding 1 for the new item
            const pendingQty = item.POQty - (item.ReceivedQty ?? 0) - item.CancelledQty - item.TotalGRNQty;

            console.log("newTotalGRNQty ---------- ", newTotalGRNQty);
            console.log("pendingQty ---------- ", pendingQty);

            // Client-side validation
            if (newTotalGRNQty > pendingQty) {
                toast.error(`Total GRN quantity (${newTotalGRNQty}) cannot exceed pending quantity (${pendingQty}) for this PO`);
                return;
            }

            // API validation
            const payload = {
                PODetailsId: item.PODetailsId,
                GRNQty: newTotalGRNQty,
                grnMainId: grnData?.step1?.GrnMainId
            };

            const validationResult = await triggerGRNQtyValidationCheck(payload).unwrap();

            if (!validationResult.isValid) {
                toast.error(validationResult.message || "Quantity validation failed");
                return;
            }

            // Only add item if validation passes
            const itemToAdd = {
                ...item,
                quantity: 1, // Default quantity
                price: item.BuyingPrice || 0,
                Id: item.Id || Date.now(),
                detailId: item.Id,
                timestamp: Date.now()
            };

            setScannedItems(prevItems => {
                let updatedItems = [...prevItems];

                if (formState.EntryType === "combined") {
                    const existingItemIndex = updatedItems.findIndex(
                        existingItem => existingItem.uniqueId === item.uniqueId &&
                            (formState.productType !== "Contact Lens" || existingItem.CLBatchCode === item.CLBatchCode)
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
                    updatedItems.push({
                        ...itemToAdd,
                        Id: Date.now() + Math.random(),
                        detailId: item.Id,
                        timestamp: Date.now()
                    });
                }

                return updatedItems;
            });

            toast.success("Item added to GRN successfully");
            setPODetailsItems([]);
            setShowSearchInputs(false);
        } catch (error) {
            console.error("Failed to add item to GRN:", error);
            if (error.data?.message) {
                toast.error(error.data.message);
            } else if (error.status === 400) {
                toast.error("Invalid quantity");
            } else {
                toast.error("Failed to add item. Please try again.");
            }
        } finally {
            setIsAddingItem(false);
        }
    };

    const handleBatchSelection = async (batch, item) => {
        console.log("batch ----------- res --------- ", batch);
        console.log("item ----------- res --------- ", item);

        try {
            setIsLoading(true);

            // Validate batch code for Contact Lens with CLBatchCode === 1
            if (formState.productType === "Contact Lens" && item.CLBatchCode === 1 && !batch) {
                toast.error("Please provide a valid batch code for Contact Lens");
                return;
            }

            let remainingQty = 1; // Adding 1 item at a time
            const itemsToAdd = [];

            // Find the index of the current item in poDetailsItems
            const currentItemIndex = poDetailsItems.findIndex(
                poItem => poItem.PODetailsId === item.PODetailsId
            );

            if (currentItemIndex === -1) {
                toast.error("Selected item not found in PO details");
                setIsLoading(false);
                return;
            }

            // Start from the current item and iterate through poDetailsItems
            for (let i = currentItemIndex; i < poDetailsItems.length && remainingQty > 0; i++) {
                const currentItem = poDetailsItems[i];

                // Skip if item requires batch code but none is provided
                if (formState.productType === "Contact Lens" && currentItem.CLBatchCode === 1 && !batch) {
                    continue;
                }

                // Calculate already scanned quantity for this PO and batch (if applicable)
                const alreadyScannedQty = scannedItems.reduce((sum, scannedItem) => {
                    if (
                        // scannedItem.PODetailsId === currentItem.PODetailsId &&
                        // (formState.productType !== "Contact Lens" ||
                        //     currentItem.CLBatchCode !== 1 ||
                        //     scannedItem.BatchCode === batch?.CLBatchCode)
                        scannedItem.PODetailsId === currentItem.PODetailsId
                    ) {
                        return sum + (scannedItem.quantity || 0);
                    }
                    return sum;
                }, 0);

                const pendingQty = currentItem.POQty - (currentItem.ReceivedQty ?? 0) - currentItem.CancelledQty - currentItem.TotalGRNQty;

                // API validation
                const payload = {
                    PODetailsId: currentItem.PODetailsId,
                    GRNQty: alreadyScannedQty + remainingQty,
                    grnMainId: grnData?.step1?.GrnMainId
                };

                const validationResult = await triggerGRNQtyValidationCheck(payload).unwrap();

                if (!validationResult.isValid) {
                    toast.error(validationResult.message || `Quantity validation failed for PO ${currentItem.PONo}`);
                    continue;
                }

                // Calculate available quantity after validation
                const availableQty = pendingQty - alreadyScannedQty;

                if (availableQty < remainingQty) {
                    // If no available quantity, move to the next PO
                    continue;
                }

                console.log("currentItem --------------- ", currentItem);

                // Prepare item to add
                const itemToAdd = {
                    ...currentItem,
                    quantity: remainingQty,
                    price: (formState.productType === "Contact Lens" && currentItem.CLBatchCode === 1 ? batch.BuyingPrice : currentItem.BuyingPrice) || 0,
                    Id: Date.now() + Math.random(),
                    detailId: currentItem.Id,
                    timestamp: Date.now(),
                    CLMRP: batch.CLMRP,
                    existingGRNQty: validationResult.existingGRNQty
                };

                // Add batch information for Contact Lens with CLBatchCode === 1
                if (formState.productType === "Contact Lens" && currentItem.CLBatchCode === 1 && batch) {
                    itemToAdd.BatchCode = batch.CLBatchCode;
                    itemToAdd.CLBatchBarCode = batch.CLBatchBarCode;
                    itemToAdd.Expiry = batch.CLBatchExpiry;
                }

                itemsToAdd.push(itemToAdd);
                remainingQty = 0; // Since we're only adding 1 item, this should be fulfilled
            }

            if (itemsToAdd.length === 0) {
                toast.error("No available quantity remaining in any PO items");
                setIsLoading(false);
                return;
            }

            setScannedItems(prevItems => {
                let updatedItems = [...prevItems];

                for (const itemToAdd of itemsToAdd) {
                    if (formState.EntryType === "combined") {
                        const existingItemIndex = updatedItems.findIndex(
                            existingItem =>
                                existingItem.PODetailsId === itemToAdd.PODetailsId &&
                                (formState.productType !== "Contact Lens" ||
                                    itemToAdd.CLBatchCode !== 1 ||
                                    existingItem.BatchCode === itemToAdd.BatchCode)
                        );

                        if (existingItemIndex >= 0) {
                            // Update existing item's quantity by adding new quantity
                            updatedItems[existingItemIndex] = {
                                ...updatedItems[existingItemIndex],
                                quantity: updatedItems[existingItemIndex].quantity + itemToAdd.quantity,
                                timestamp: Date.now() // Update timestamp to reflect latest change
                            };
                        } else {

                            const existingItemIndex = updatedItems.findIndex(
                                existingItem =>
                                    existingItem.PODetailsId === itemToAdd.PODetailsId
                            );
                            let existingQuantity = 0;
                            if (existingItemIndex >= 0) {
                                // Update existing item's quantity by adding new quantity
                                existingQuantity = updatedItems[existingItemIndex].quantity;
                            }

                            console.log("!! itemToAdd -", itemToAdd);
                            // Add new item with provided quantity
                            updatedItems.push({
                                ...itemToAdd,
                                Id: Date.now() + Math.random(),
                                scannedQty: existingQuantity,
                                quantity: itemToAdd.quantity,
                                timestamp: Date.now()
                            });
                        }
                    } else {
                        // Separate entry: always add new row with unique ID
                        updatedItems.push({
                            ...itemToAdd,
                            Id: Date.now() + Math.random(),
                            quantity: itemToAdd.quantity,
                            timestamp: Date.now()
                        });
                    }
                }

                // Sort by timestamp in descending order (latest first)
                updatedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                console.log("updatedItems -------- ", updatedItems);
                return updatedItems;
            });

            console.log("itemsToAdd -------------- ", itemsToAdd);
            const totalAdded = itemsToAdd.reduce((total, item) => total + item.quantity, 0);
            toast.success(`Added ${totalAdded} item(s) to GRN`);

            // Clear inputs
            setPODetailsItems([]);
            setSearchResults([]);
            setSelectedBatchCode(null);
            setbatchCodeInput("");
            setClSearchItems([]);
            setProductId(null);
            setProductInput("");
            setModalityId(null);
            setModalityInput("");
            handleRefresh();
        } catch (error) {
            console.error("Failed to add item with batch:", error);
            toast.error("Failed to add item with batch code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };


    const handleAddBarcodeSearchItemsToScannedTable = async () => {
        if (!grnQtyAgainstPOForBarcode || grnQtyAgainstPOForBarcode <= 0) {
            toast.error("Please enter a valid GRN quantity");
            return;
        }

        console.log("poDetailsItems for scanned item", poDetailsItems);

        if (poDetailsItems.length === 0) {
            toast.error("No items available to add");
            return;
        }

        // Validate batch code only for Contact Lens with CLBatchCode === 1
        if (formState.productType === "Contact Lens" && poDetailsItems[0]?.CLBatchCode === 1) {
            if (formState.clBatchInputType === "select" && !selectedBatchCode) {
                toast.error("Please select a batch code for Contact Lens");
                return;
            }
            if (formState.clBatchInputType === "enter" && !batchCodeInput) {
                toast.error("Please enter a batch barcode for Contact Lens");
                return;
            }
        }

        try {
            setIsLoading(true);

            let remainingQty = parseInt(grnQtyAgainstPOForBarcode);
            const itemsToAdd = [];

            // For Contact Lens with batch code
            let selectedBatch = null;
            if (formState.productType === "Contact Lens" && poDetailsItems[0]?.CLBatchCode === 1) {
                if (formState.clBatchInputType === "select" && selectedBatchCode) {
                    selectedBatch = selectedBatchCode;
                } else if (formState.clBatchInputType === "enter" && batchCodeInput) {
                    selectedBatch = CLBatches?.data?.find(
                        (b) => b.CLBatchBarCode.toLowerCase() === batchCodeInput.toLowerCase()
                    );
                    if (!selectedBatch) {
                        toast.error("Invalid batch barcode");
                        setIsLoading(false);
                        return;
                    }
                }
            }

            // Validate each PO item and prepare items to add
            for (let i = poDetailsItems.length - 1; i >= 0 && remainingQty > 0; i--) {
                const item = poDetailsItems[i];

                // Skip if item requires batch code but none is provided
                if (formState.productType === "Contact Lens" && item.CLBatchCode === 1 && !selectedBatch) {
                    continue;
                }

                try {
                    console.log("scannedItems ------------", scannedItems);
                    console.log("item ------------", item);

                    // Calculate already scanned quantity for this PO and batch (if applicable)
                    const alreadyScannedQty = scannedItems.reduce((sum, scanned) => {
                        if (scanned.PODetailsId === item.PODetailsId) {
                            return sum + (scanned.quantity || 0);
                        }
                        return sum;
                    }, 0);

                    // FIXED: Calculate actual pending quantity considering already scanned items
                    const basePendingQty = item.POQty - (item.ReceivedQty ?? 0) - item.CancelledQty - item?.TotalGRNQty;
                    const actualPendingQty = basePendingQty - alreadyScannedQty;

                    console.log("basePendingQty", basePendingQty);
                    console.log("actualPendingQty", actualPendingQty);
                    console.log("enteredQty", remainingQty);
                    console.log("alreadyScannedQty", alreadyScannedQty);

                    // FIXED: Skip this PO item if it's already fully fulfilled
                    if (actualPendingQty <= 0) {
                        console.log(`Skipping PO ${item.PONo} - already fulfilled (actualPendingQty: ${actualPendingQty})`);
                        continue;
                    }

                    console.log("selectedBatch dadad", selectedBatch);

                    // API validation - only validate if there's pending quantity
                    const payload = {
                        PODetailsId: item.PODetailsId,
                        GRNQty: alreadyScannedQty + Math.min(remainingQty, actualPendingQty),
                        grnMainId: grnData?.step1?.GrnMainId
                        // batchCode: selectedBatch?.CLBatchCode
                    };

                    const validationResult = await triggerGRNQtyValidationCheck(payload).unwrap();

                    // NEW LOGIC: If validation is not valid, check if we can fulfill the remaining pending quantity
                    if (!validationResult.isValid) {
                        console.log(`Validation failed for PO ${item.PONo}: ${validationResult.message}`);

                        // Check if there's pending quantity that can be fulfilled (partially fulfilled case)
                        const remainingPendingQty = actualPendingQty;

                        if (remainingPendingQty > 0) {
                            console.log(`PO ${item.PONo} has ${remainingPendingQty} remaining pending quantity that can be fulfilled`);

                            const qtyToAdd = Math.min(remainingQty, remainingPendingQty);

                            if (qtyToAdd > 0) {
                                const itemToAdd = {
                                    ...item,
                                    quantity: qtyToAdd,
                                    price: item.BuyingPrice || 0,
                                    Id: Date.now() + Math.random(),
                                    detailId: item.Id,
                                    timestamp: Date.now(),
                                    existingGRNQty: validationResult.existingGRNQty,
                                    validationMessage: validationResult.message // Store validation message for reference
                                };

                                // console.log("selectedBatch ----", selectedBatch);
                                // Add batch information for Contact Lens with CLBatchCode === 1
                                if (formState.productType === "Contact Lens" && item.CLBatchCode === 1 && selectedBatch) {
                                    itemToAdd.BatchCode = selectedBatch.CLBatchCode;
                                    itemToAdd.CLBatchBarCode = selectedBatch.CLBatchBarCode;
                                    itemToAdd.Expiry = selectedBatch.CLBatchExpiry;
                                    itemToAdd.price = selectedBatch.BuyingPrice || item.BuyingPrice || 0;
                                    itemToAdd.MRP = selectedBatch.CLMRP || selectedBatch.MRP;
                                }

                                itemsToAdd.push(itemToAdd);
                                remainingQty -= qtyToAdd;

                                console.log(`Added ${qtyToAdd} items from PO ${item.PONo} to complete fulfillment, remaining: ${remainingQty}`);
                                toast.warning(`PO ${item.PONo}: ${validationResult.message}. Added remaining ${qtyToAdd} items to complete fulfillment.`);
                            }

                            // Move to next PO item since we've fulfilled this one completely
                            continue;
                        } else {
                            // No pending quantity available, skip to next item
                            console.log(`Skipping PO ${item.PONo} - no available quantity after validation failure`);
                            toast.error(`${validationResult.message}, Skipping to next item.`);
                            continue;
                        }
                    }

                    // Original logic for valid validation result
                    const availableQty = Math.min(actualPendingQty, basePendingQty);

                    if (availableQty <= 0) {
                        console.log(`Skipping PO ${item.PONo} - no available quantity (availableQty: ${availableQty})`);
                        continue;
                    }

                    const qtyToAdd = Math.min(remainingQty, availableQty);

                    if (qtyToAdd > 0) {
                        const itemToAdd = {
                            ...item,
                            quantity: qtyToAdd,
                            price: item.BuyingPrice || 0,
                            Id: Date.now() + Math.random(),
                            detailId: item.Id,
                            timestamp: Date.now(),
                            existingGRNQty: validationResult.existingGRNQty
                        };
                        // console.log("selectedBatch ----", selectedBatch);

                        // Add batch information for Contact Lens with CLBatchCode === 1
                        if (formState.productType === "Contact Lens" && item.CLBatchCode === 1 && selectedBatch) {
                            itemToAdd.BatchCode = selectedBatch.CLBatchCode;
                            itemToAdd.CLBatchBarCode = selectedBatch.CLBatchBarCode;
                            itemToAdd.Expiry = selectedBatch.CLBatchExpiry;
                            itemToAdd.price = selectedBatch.BuyingPrice || item.BuyingPrice || 0;
                            itemToAdd.MRP = selectedBatch.CLMRP || selectedBatch.MRP;
                        }

                        itemsToAdd.push(itemToAdd);
                        remainingQty -= qtyToAdd;

                        console.log(`Added ${qtyToAdd} items from PO ${item.PONo}, remaining: ${remainingQty}`);
                    }
                } catch (error) {
                    console.error(`API validation failed for PO ${item.PONo}:`, error);
                    toast.error(`Validation failed for PO ${item.PONo}. Skipping this item.`);
                    continue; // Ensure we continue to next item on API error
                }
            }

            if (itemsToAdd.length === 0) {
                toast.error("No available quantity remaining in any PO items");
                setIsLoading(false);
                return;
            }

            // If there's still remaining quantity after processing all items
            if (remainingQty > 0) {
                toast.warning(`Only ${parseInt(grnQtyAgainstPOForBarcode) - remainingQty} items could be added. ${remainingQty} items exceed available quantities.`);
            }

            // Add validated items to scannedItems
            setScannedItems(prevItems => {
                let updatedItems = [...prevItems];

                console.log("itemsToAdd ---- ", itemsToAdd);
                // console.log("existingItem ---- ", existingItem);

                for (const itemToAdd of itemsToAdd) {
                    if (formState.EntryType === "combined") {
                        const existingItemIndex = updatedItems.findIndex(
                            existingItem =>
                                existingItem.PODetailsId === itemToAdd.PODetailsId &&
                                (formState.productType !== "Contact Lens" ||
                                    itemToAdd.CLBatchCode !== 1 ||
                                    existingItem.BatchCode === itemToAdd.BatchCode)
                        );

                        if (existingItemIndex >= 0) {
                            updatedItems[existingItemIndex] = {
                                ...updatedItems[existingItemIndex],
                                quantity: updatedItems[existingItemIndex].quantity + itemToAdd.quantity
                            };
                        } else {
                            updatedItems.push(itemToAdd);
                        }
                    } else {
                        // Separate entry: always add new row with unique ID
                        updatedItems.push({
                            ...itemToAdd,
                            Id: Date.now() + Math.random(),
                            detailId: itemToAdd.Id,
                            timestamp: Date.now()
                        });
                    }
                }

                // Sort by timestamp in descending order (latest first)
                updatedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                return updatedItems;
            });

            console.log("itemsToAdd Items to add in detail table ------------- ", itemsToAdd);

            const totalAdded = itemsToAdd.reduce((total, item) => total + item.quantity, 0);
            toast.success(`Added ${totalAdded} item(s) to GRN`);

            // Clear inputs
            setGrnQtyAgainstPOForBarcode('');
            setPODetailsItems([]);
            setSearchResults([]);
            setModelNo("");
            setBrandId(null);
            setBrandInput("");
            setSelectedBatchCode(null);
            setbatchCodeInput("");
            setClSearchItems([]);
            setProductId(null);
            setProductInput("");
            setModalityId(null);
            setModalityInput("");
            handleRefresh();
            setSelectedBatchCode(null);
            setShowSearchInputs(false);
        } catch (error) {
            console.error("Failed to add items to GRN:", error);
            toast.error("Failed to add items. Please try again.");
        } finally {
            setIsLoading(false);
        }
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

            let requestData = {
                barcode: formState.barcode,
                locationId: formState.companyId
            }

            console.log("grnData.step3.GRNAgainstPOorderType --- ", grnData.step3.GRNAgainstPOorderType);

            // if (grnData.step3.GRNAgainstPOorderType == "Specific Order") {
            requestData.vendorId = grnData.step1.selectedVendor;
            requestData.createdCompanyId = grnData.step1.selectedLocation;
            requestData.productType = (grnData?.step2?.productType === "Lens" ? 0
                : grnData?.step2?.productType === "Frame/Sunglass" ? 1
                    : grnData?.step2?.productType === "Accessories" ? 2
                        : grnData?.step2?.productType === "Contact Lens" ? 3
                            : null) ?? null;
            // } else {
            //     requestData.vendorId = '';
            //     requestData.createdCompanyId = '';
            //     requestData.productType = '';
            // }

            const result = await typeFunction(requestData).unwrap();

            if (!result.data) {
                toast.error(`${result.message}`);
                setFormState(prev => ({
                    ...prev,
                    barcode: ""
                }));
            }

            if (result.data) {
                // Handle both array and single object responses
                const items = Array.isArray(result.data) ? result.data : [result.data];
                console.log("hdkajbdkahkdhkn", items);

                if (items.length === 0) {
                    toast.error("No items found for this barcode");
                    return;
                }

                if (formState.productType === "Contact Lens") {
                    // Handle Contact Lens items
                    const clItems = items.map(item => ({
                        ...item, // Access nested data object
                        quantity: 1,
                        price: item?.BuyingPrice, // Use BuyingPrice from nested data
                        detailId: item?.Id || item?.CLDetailId,
                        timestamp: Date.now()
                    }));

                    // Check if any CL item requires batch processing
                    const batchItems = clItems.filter(item => item.CLBatchCode === 1);
                    // const nonBatchItems = clItems.filter(item => item.CLBatchCode !== 1);

                    if (batchItems.length > 0) {
                        setClSearchItems(batchItems);
                        // Get batches for the first batch item (assuming they all have same detailId)
                        await getCLBatches({
                            detailId: batchItems[0]?.Id,
                            locationId: grnData?.step1?.selectedLocation,
                        }).unwrap();
                    }

                    // console.log("nonBatchItems --------- ", nonBatchItems);

                    if (clItems.length > 0) {
                        setPODetailsItems(prevItems => {
                            let updatedItems = []; // Create a copy of previous items

                            clItems.forEach(newItem => {
                                const existingItemIndex = formState.EntryType === "combined"
                                    ? updatedItems.findIndex(item => item.uniqueId === newItem.uniqueId)
                                    : -1;

                                if (existingItemIndex >= 0) {
                                    updatedItems[existingItemIndex] = {
                                        ...updatedItems[existingItemIndex],
                                        quantity: updatedItems[existingItemIndex].quantity + 1
                                    };
                                } else {
                                    updatedItems.push(newItem);
                                }
                            });

                            // Sort by timestamp in descending order (latest first)
                            // updatedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

                            return updatedItems;
                        });

                        console.log("poDetailsItems for CL --------=-=--=--=", poDetailsItems);

                        toast.success("CL items added successfully");
                        setFormState(prev => ({
                            ...prev,
                            barcode: ""
                        }));
                    }

                } else {
                    // Handle non-Contact Lens items
                    const newItems = items.map(item => ({
                        ...item,
                        quantity: 1,
                        price: item?.BuyingPrice,
                        Id: item?.Id || Date.now() + Math.random(), // More unique ID
                        detailId: item?.Id,
                        timestamp: Date.now()
                    }));

                    setPODetailsItems(prevItems => {
                        let updatedItems = [];

                        newItems.forEach(newItem => {
                            const existingItemIndex = formState.EntryType === "combined"
                                ? updatedItems.findIndex(item => item.uniqueId === newItem.uniqueId)
                                : -1;

                            if (existingItemIndex >= 0) {
                                updatedItems[existingItemIndex] = {
                                    ...updatedItems[existingItemIndex],
                                    quantity: updatedItems[existingItemIndex].quantity + 1
                                };
                            } else {
                                updatedItems.push(newItem);
                            }
                        });

                        // Sort by timestamp in descending order (latest first)
                        updatedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

                        return updatedItems;
                    });

                    toast.success(`${newItems.length} item(s) added successfully`);
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
            functionType = triggerSearchAccByBrandProduct;
            requestData.product = productName;
        }

        // if (grnData.step3.GRNAgainstPOorderType === "Specific Order") {
        //     requestData.vendorId = grnData.step1.selectedVendor;
        //     requestData.createdCompanyId = grnData.step1.selectedLocation;
        //     requestData.productType = (grnData?.step2?.productType === "Lens" ? 0
        //         : grnData?.step2?.productType === "Frame/Sunglass" ? 1
        //             : grnData?.step2?.productType === "Accessories" ? 2
        //                 : grnData?.step2?.productType === "Contact Lens" ? 3
        //                     : null) ?? null;
        // }

        try {
            const response = await functionType(requestData);

            console.log("Detail search response", response);

            if (response.status === "fulfilled") {
                const newItems = response?.data?.data || [];
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

    const handleSubmitGRNDetails = async () => {
        console.log("GRN data", grnData);
        try {
            if (!formState.grnMainId || !grnData?.step1?.GrnMainId) {
                throw new Error("GRN main ID not found");
            }

            let grnDetails = [];

            setIsLoading(true);

            if (formState.productType === "Frame/Sunglass" || formState.productType === "Accessories" || formState.productType === "Contact Lens") {
                if (scannedItems.length === 0) {
                    toast.error("Please scan and add at least one item");
                    return;
                }

                console.log("scannedItems ----- dbnajhdj", scannedItems);

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
                    }
                    console.log("jhsgdjabd ------ ", formState.grnMainId);
                    console.log("save detail Item ------ ", item);

                    return {
                        GRNMainID: formState.grnMainId || grnData.step1.GrnMainId,
                        GRNSlNo: index + 1,
                        ProductType: formState.productType === 'Frame/Sunglass' ? 1
                            : formState.productType === 'Lens' ? 0
                                : formState.productType === 'Accessories' ? 2
                                    : formState.productType === 'Contact Lens' ? 3
                                        : null,
                        detailId: item.detailId,
                        BatchCode: item.BatchCode || null,
                        OrderDetailId: item.OrderDetailId,
                        VendorOrderNo: null,
                        PODetailsId: item.PODetailsId,
                        GRNQty: item.quantity || 1,
                        GRNPrice: item.price || item.BuyingPrice,
                        TaxPercent: taxPercent,
                        FittingPrice: item.FittingPrice,
                        FittingGSTPercentage: item.FittingGSTPercentage,
                        ApplicationUserId: user.Id
                    };
                });
            }

            // if (formState.productType === "Contact Lens") {

            //     grnDetails = [{
            //         GRNMainID: formState.grnMainId,
            //         GRNSlNo: 1,
            //         ProductType: 0,
            //         detailId: selectedLensDD.olDetailId,
            //         BatchCode: selectedLensDD.cLBatchCode || null,
            //         OrderDetailId: selectedLensDD.orderDetailId || null,
            //         VendorOrderNo: formState.lensSupplierOrderNo || null,
            //         PODetailsId: null,
            //         GRNQty: GRNOrderPowerDetails?.OrderQuantity || 1,
            //         GRNPrice: formState?.rate,
            //         TaxPercent: GRNOrderPowerDetails?.TaxPercentage,
            //         FittingPrice: formState?.fittingCharge,
            //         FittingGSTPercentage: GRNOrderPowerDetails?.FittingChargeDetails?.FittingGST || null,
            //         ApplicationUserId: user.Id
            //     }];

            //     // return grnDetails;
            // }

            if (formState.productType === "Lens") {
                console.log("GRNOrderPowerDetails ------------- ", GRNOrderPowerDetails);
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
                    GRNPrice: formState?.rate,
                    TaxPercent: GRNOrderPowerDetails?.TaxPercentage,
                    FittingPrice: formState?.fittingCharge,
                    FittingGSTPercentage: GRNOrderPowerDetails?.FittingChargeDetails?.FittingGST || null,
                    ApplicationUserId: user.Id
                }];

                // return grnDetails;
            }
            console.log("grnDetails ---------- ", grnDetails);

            const response = await SaveGRN(grnDetails).unwrap();
            if (response.status === "success") {
                toast.success("GRN details saved successfully");
                updateStep1Data({
                    GrnMainId: response?.data?.data[0]?.GRNMainID || null,
                })
                nextStep();
            }
        } catch (error) {
            console.error("Error saving purchase order details:", error);
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

    // const updateScannedItemQuantity = (index, newQuantity) => {
    //     setScannedItems(prevItems =>
    //         prevItems.map((item, i) =>
    //             i === index ? { ...item, quantity: parseInt(newQuantity) } : item
    //         )
    //     );
    // };


    const updateScannedItemQuantity = async (index, newQuantity, batchCode) => {
        const quantity = parseInt(newQuantity);

        if (isNaN(quantity) || quantity < 1) {
            toast.error("Please enter a valid quantity (minimum 1)");
            return false;
        }

        const currentItem = scannedItems[index];

        console.log("currentItem --------- ", currentItem);
        const pendingQty = currentItem.POQty - (currentItem.ReceivedQty ?? 0) - currentItem.CancelledQty - currentItem.TotalGRNQty;

        console.log("scannedItems --------------- ", scannedItems);

        // Calculate total GRNQty for all items with same PODetailId (excluding current item)
        const totalGRNQtyForOtherItems = scannedItems
            .filter((item, i) => item.PODetailsId === currentItem.PODetailsId && i !== index)
            .reduce((total, item) => total + (item.quantity || 0), 0);

        console.log("totalGRNQtyForOtherItems", totalGRNQtyForOtherItems);
        console.log("quantity", quantity);


        const newTotalGRNQty = totalGRNQtyForOtherItems + quantity;

        // Check if new total exceeds pending quantity
        // if (grnData?.step2?.productType !== "Contact Lens") {
        if (newTotalGRNQty > pendingQty) {
            toast.error(`Total GRN quantity (${newTotalGRNQty}) cannot exceed pending quantity (${pendingQty}) for this PO`);
            return false;
        }
        // }

        console.log("newTotalGRNQty", newTotalGRNQty);


        // Validate with API first before updating state
        try {
            const payload = {
                PODetailsId: currentItem.PODetailsId,
                GRNQty: newTotalGRNQty,
                grnMainId: grnData?.step1?.GrnMainId,
                // batchCode: batchCode ? batchCode : null
                // CurrentGRNQty: totalGRNQtyForOtherItems,
                // NewItemGRNQty: quantity,
                // PendingQty: pendingQty
            };

            // Call API to validate GRN quantity
            const validationResult = await triggerGRNQtyValidationCheck(payload).unwrap();

            if (!validationResult.isValid) {
                toast.error(validationResult.message || "Quantity validation failed");
                return false;
            }

            // Only update state if API validation passes
            setScannedItems(prevItems =>
                prevItems.map((item, i) =>
                    i === index ? { ...item, quantity } : item
                )
            );

            toast.success("Quantity updated successfully");
            return true;

        } catch (error) {
            console.error("GRN quantity validation failed:", error);

            // Handle specific error cases
            if (error.data?.message) {
                toast.error(error.data.message);
            } else if (error.status === 400) {
                toast.error("Invalid quantity entered");
            } else if (error.status === 404) {
                toast.error("PO details not found");
            } else {
                toast.error("Failed to validate quantity. Please try again.");
            }

            return false;
        }
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

        const searchPayload = {
            CLMainId: productId,
            Spherical: spherical,
            Cylindrical: cylindrical,
            Axis: axis,
            Additional: additional,
            Colour: null,
            locationId: grnData.step1.selectedLocation,
        };

        try {
            setIsLoading(true);
            const response = await getPowerDetails({ payload: searchPayload }).unwrap();

            if (!response?.data?.data) {
                toast.error("No matching power found");
                setSearchFetched(false);
                return;
            }

            const items = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            console.log("data handleSearch ------------ ", items);
            toast.success(response?.data.message || "Power details found");

            // Get the first item's CLDetailId to fetch PO details
            const firstItem = items[0];
            if (!firstItem?.CLDetailId) {
                toast.error("No valid CLDetailId found in search results");
                setSearchFetched(false);
                return;
            }

            // Prepare payload for PO details
            const poPayload = {
                locationId: formState.companyId || null,
                vendorId: grnData?.step1?.selectedVendor,
                productType: 3, // Contact Lens
                clDetailId: [firstItem.CLDetailId],
            };

            console.log("poPayload ----------------- ", poPayload);

            // Fetch PO details using the existing query
            const poResult = await triggerGetCLPOByDetailId(poPayload).unwrap();

            if (poResult.data && poResult.data.length > 0) {
                setPODetailsItems(prevItems => {
                    let updatedItems = [...prevItems];

                    poResult.data.forEach(newItem => {
                        const itemToAdd = {
                            ...newItem,
                            quantity: 1,
                            price: newItem.BuyingPrice || 0,
                            Id: newItem.Id,
                            detailId: newItem.Id,
                            timestamp: Date.now(),
                            Barcode: firstItem.Barcode,
                            CLDetailId: firstItem.CLDetailId,
                            SphericalPower: firstItem.SphericalPower ?? firstItem.Spherical,
                            CylindricalPower: firstItem.CylindricalPower ?? firstItem.Cylindrical,
                            Axis: firstItem.Axis,
                            Additional: firstItem.Additional,
                            avlQty: parseInt(firstItem.AvlQty) || 0,
                            orderQty: firstItem.DefaultOrderQty || 1,
                            BuyingPriceMaster: newItem?.priceMaster?.buyingPrice || null,
                            MRPMaster: newItem?.priceMaster?.mrp || null,
                            CLBatchCode: newItem.CLBatchCode,
                            ProductName: newItem?.ProductName,
                            HSN: newItem?.HSN,
                        };

                        if (formState.EntryType === "combined") {
                            const existingItemIndex = updatedItems.findIndex(
                                item => item.uniqueId === newItem.uniqueId &&
                                    item.CLBatchCode === newItem.CLBatchCode
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
                            updatedItems.push({
                                ...itemToAdd,
                                Id: `cl-${newItem.Id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            });
                        }
                    });

                    // Sort by timestamp in descending order (latest first)
                    updatedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    return updatedItems;
                });

                toast.success(`Added ${poResult.data.length} contact lens item(s) to GRN`);

                // Check if batch processing is required
                if (poResult.data.some(item => item.CLBatchCode === 1)) {
                    await getCLBatches({
                        detailId: firstItem.CLDetailId,
                        locationId: grnData?.step1?.selectedLocation,
                    }).unwrap();
                    toast.success("Please select or scan batch code");
                }

                // Clear input fields
                setFormState(prev => ({
                    ...prev,
                    barcode: "",
                }));
                setBrandId(null);
                setBrandInput("");
                setProductId(null);
                setProductInput("");
                setModalityId(null);
                setModalityInput("");
                // handleRefresh();

                // Log poDetailsItems after state update
                setTimeout(() => {
                    console.log("Test the PODetailsItems", poDetailsItems);
                }, 0);

                setSearchFetched(true);
            } else {
                toast.error("No PO details found for this item");
                setSearchFetched(false);
            }
        } catch (error) {
            console.error("Search error:", error);
            toast.error(error.message || "Failed to fetch PO details");
            setSearchFetched(false);
        } finally {
            setIsLoading(false);
        }
    };



    useEffect(() => {
        console.log("Updated poDetailsItems:", poDetailsItems);
    }, [poDetailsItems]);


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
                    <h2 className="text-xl font-bold text-[#000060] mb-6">Step 4: {grnData?.step2?.productType}</h2>
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 flex text-[#000060] rounded-lg hover:bg-gray-100 transition-colors gap-2"
                    >
                        <ArrowLeft />
                        Back
                    </button>
                </div>

                {grnData?.step3?.GRNAgainstPOorderType === "Specific Order" && (
                    <div className="flex justify-center gap-12 mb-6">
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
                                // autoComplete="off"
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
                            onClick={() => {
                                setShowSearchInputs(true);
                                setPODetailsItems([]);
                                setSearchResults([]);
                                setModelNo("");
                                setBrandId(null);
                                setBrandInput("");
                                setProductName("");
                                setProductId(null);
                                setProductInput("");
                                setModalityInput("");
                                setModalityId(null);

                            }}
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

                                {(modalityId && productData) && (
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
                            onClick={() => { setShowSearchInputs(false); setPODetailsItems([]); }}
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
                                    <span className="font-bold flex">Customer Name </span>
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

                        {GRNOrderPowerDetails && (
                            <>
                                <div className="flex">
                                    {(GRNOrderPowerDetails?.PowerDetails?.RightSphericalPower ||
                                        GRNOrderPowerDetails?.PowerDetails?.RightCylindricalPower ||
                                        GRNOrderPowerDetails?.PowerDetails?.RightAxis ||
                                        GRNOrderPowerDetails?.PowerDetails?.RightAddPower) && (
                                            `R: Sph: ${GRNOrderPowerDetails?.PowerDetails?.RightSphericalPower || ''} Cyl: ${GRNOrderPowerDetails?.PowerDetails?.RightCylindricalPower || ''} Axis: ${GRNOrderPowerDetails?.PowerDetails?.RightAxis || ''} Add: ${GRNOrderPowerDetails?.PowerDetails?.RightAddPower || ''}`
                                        )}
                                    <br />
                                    {(GRNOrderPowerDetails?.PowerDetails?.LeftSphericalPower ||
                                        GRNOrderPowerDetails?.PowerDetails?.LeftCylindricalPower ||
                                        GRNOrderPowerDetails?.PowerDetails?.LeftAxis ||
                                        GRNOrderPowerDetails?.PowerDetails?.LeftAddPower) && (
                                            `L: Sph: ${GRNOrderPowerDetails?.PowerDetails?.LeftSphericalPower || ''} Cyl: ${GRNOrderPowerDetails?.PowerDetails?.LeftCylindricalPower || ''} Axis: ${GRNOrderPowerDetails?.PowerDetails?.LeftAxis || ''} Add: ${GRNOrderPowerDetails?.PowerDetails?.LeftAddPower || ''}`
                                        )}
                                </div>

                            </>
                        )}

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
                                        <input
                                            id="rate"
                                            name="rate"
                                            type="text"
                                            value={`${formState.rate}`}
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
                                                Number(formState.rate || 0) *
                                                (Number(GRNOrderPowerDetails?.TaxPercentage || 0) / 100)
                                            ).toFixed(2)} (${Number(GRNOrderPowerDetails?.TaxPercentage || 0)}%)`}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            disabled={true}
                                        />
                                    </div>
                                </div>

                                {GRNOrderPowerDetails?.FittingChargeDetails?.FittingCharges === 1 && (
                                    <div className="flex items-center justify-between gap-4 w-full">
                                        <div className="flex flex-col flex-1">
                                            <label htmlFor="fittingCharge" className="text-sm font-medium text-gray-700 mb-1">Fitting Charges *</label>
                                            <input
                                                id="fittingCharge"
                                                name="fittingCharge"
                                                type="text"
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

                {/* Batch Selection Modal */}
                <BatchSelectionModal
                    open={isBatchModalOpen}
                    onClose={() => {
                        setIsBatchModalOpen(false);
                        setSelectedItemForBatch(null);
                    }}
                    batches={CLBatches?.data || []}
                    onBatchSelect={handleBatchSelection}
                    item={selectedItemForBatch}
                />

                {/* For product search */}
                {(showSearchInputs && searchResults.length > 0 && !poDetailsItems.length) && (
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
                        <GRNAgainstPOSearchTable
                            searchResults={searchResults}
                            selectedRows={selectedRows}
                            handleGetPOdetailsByDetailId={handleGetPOdetailsByDetailId}
                            handleCheckboxChange={handleCheckboxChange}
                            handleAddPOdetailstoScannedTable={handleAddPOdetailstoScannedTable}
                            isAddingItem={isAddingItem}
                            poDetailsItem={1}
                            GRNAgainstPOorderType={grnData.step3.GRNAgainstPOorderType}
                            productType={grnData.step2.productType === "Frame/Sunglass" ? 1 : grnData.step2.productType === "Accessories" ? 2 : grnData.step2.productType === "Contact Lens" ? 3 : null}
                        />
                    </div>
                )}

                {/* For PO details (from barcode or power search) */}
                {poDetailsItems.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">PO Details</h3>
                        <GRNAgainstPOSearchTable
                            searchResults={poDetailsItems}
                            selectedRows={selectedRows}
                            handleGetPOdetailsByDetailId={handleGetPOdetailsByDetailId}
                            handleCheckboxChange={handleCheckboxChange}
                            handleAddPOdetailstoScannedTable={handleAddPOdetailstoScannedTable}
                            isAddingItem={isAddingItem}
                            poDetailsItem={2}
                            GRNAgainstPOorderType={grnData.step3.GRNAgainstPOorderType}
                            productType={grnData.step2.productType === "Frame/Sunglass" ? 1 : grnData.step2.productType === "Accessories" ? 2 : grnData.step2.productType === "Contact Lens" ? 3 : null}
                        />
                        <div className="flex space-y-6 mt-6 gap-25">
                            {/* Batch selection UI (shown only if CLBatchCode === 1) */}
                            {(formState.productType === "Contact Lens" && poDetailsItems.some(item => item.CLBatchCode === 1) && grnData?.step3?.GRNAgainstPOorderType === "Auto Processing") && (
                                <div className="flex flex-col gap-6">
                                    {/* Radio buttons for batch input type */}
                                    <div className="flex items-center gap-6">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="clBatchInputType"
                                                value="select"
                                                checked={formState.clBatchInputType === "select"}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700 font-medium">Select Batch Code</span>
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

                                    {/* Batch input fields */}
                                    {/* <div className="flex gap-4"> */}
                                    {formState.clBatchInputType === "select" ? (
                                        <div className=" items-center gap-4">
                                            <label className="text-sm font-medium text-gray-700 mb-5">
                                                Select Batch Code *
                                            </label>
                                            <Autocomplete
                                                options={CLBatches?.data || []}
                                                getOptionLabel={(option) => option.CLBatchCode || ""}
                                                value={
                                                    CLBatches?.data?.find(
                                                        (batch) => batch.CLBatchCode === selectedBatchCode?.CLBatchCode
                                                    ) || null
                                                }
                                                onChange={(_, newValue) => {
                                                    setSelectedBatchCode(newValue);
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Select Batch Code"
                                                        size="small"
                                                        error={!selectedBatchCode && formState.productType === "Contact Lens"}
                                                        helperText={
                                                            !selectedBatchCode && formState.productType === "Contact Lens"
                                                                ? "Batch code is required"
                                                                : ""
                                                        }
                                                        className="max-w-ls w-fit"
                                                    />
                                                )}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                            />
                                        </div>
                                    ) : (

                                        <div className="w-full max-w-md flex flex-col gap-4">
                                            <div className="flex gap-2 items-center">
                                                <Input
                                                    value={batchCodeInput}
                                                    onChange={(e) => setbatchCodeInput(e.target.value)}
                                                    label="Enter Batch Barcode *"
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
                                                                handleAddBarcodeSearchItemsToScannedTable();
                                                            } else {
                                                                toast.error("Invalid batch barcode");
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (batchCodeInput) {
                                                            const isValidBatch = CLBatches?.data?.find(
                                                                (b) => b.CLBatchBarCode.toLowerCase() === batchCodeInput.toLowerCase()
                                                            );
                                                            if (isValidBatch) {
                                                                setSelectedBatchCode(isValidBatch);
                                                                // handleAddBarcodeSearchItemsToScannedTable();
                                                            } else {
                                                                toast.error("Invalid batch barcode");
                                                            }
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                    disabled={!batchCodeInput}
                                                >
                                                    Search
                                                </button>
                                            </div>
                                            {selectedBatchCode && (
                                                <div className="text-sm text-gray-700">
                                                    Selected Batch: <span className="font-medium">{selectedBatchCode.CLBatchCode}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {/* </div> */}
                                </div>
                            )}

                            {/* GRN Quantity field */}
                            {(grnData?.step3?.GRNAgainstPOorderType === "Auto Processing") && (
                                <div className=" items-start gap-4 mt-10 space-y-1.5">
                                    <label
                                        htmlFor="grnQtyAgainstPOForBarcode"
                                        className="block text-sm font-medium text-gray-700 whitespace-nowrap pt-2"
                                    >
                                        Enter GRN Qty *
                                    </label>
                                    <div className="flex max-w-sm gap-4">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <input
                                                    id="grnQtyAgainstPOForBarcode"
                                                    name="grnQtyAgainstPOForBarcode"
                                                    type="number"
                                                    min="1"
                                                    value={grnQtyAgainstPOForBarcode || ""}
                                                    onChange={(e) => setGrnQtyAgainstPOForBarcode(e.target.value)}
                                                    className={`w-full px-3 py-2 border ${!grnQtyAgainstPOForBarcode || grnQtyAgainstPOForBarcode <= 0
                                                        ? "border-red-500"
                                                        : "border-gray-300"
                                                        } rounded-md focus:outline-none focus:ring-2 focus:ring-[#000060]`}
                                                    placeholder="Please enter GRN quantity.... "
                                                    aria-label="GRN Qty input"
                                                    disabled={isLoading}
                                                />
                                                {isLoading && (
                                                    <div className="absolute right-3 top-2.5">
                                                        <svg
                                                            className="animate-spin h-4 w-4 text-blue-500"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            ></circle>
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            ></path>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            {!grnQtyAgainstPOForBarcode ? (
                                                <p className="text-red-500 text-xs mt-1">GRN quantity is required</p>) : <p></p>
                                            }
                                            {(grnQtyAgainstPOForBarcode && grnQtyAgainstPOForBarcode <= 0) ? (
                                                <p className="text-red-500 text-xs mt-1">Quantity must be greater than 0</p>) : <p></p>
                                            }
                                        </div>
                                        <button
                                            onClick={handleAddBarcodeSearchItemsToScannedTable}
                                            className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex max-h-10"
                                            disabled={
                                                isLoading ||
                                                !grnQtyAgainstPOForBarcode ||
                                                grnQtyAgainstPOForBarcode <= 0 ||
                                                (formState.productType === "Contact Lens" &&
                                                    poDetailsItems.some(item => item.CLBatchCode === 1) &&
                                                    formState.clBatchInputType === "select" &&
                                                    !selectedBatchCode) ||
                                                (formState.productType === "Contact Lens" &&
                                                    poDetailsItems.some(item => item.CLBatchCode === 1) &&
                                                    formState.clBatchInputType === "enter" &&
                                                    (!batchCodeInput ||
                                                        !CLBatches?.data?.find(
                                                            (b) => b.CLBatchBarCode.toLowerCase() === batchCodeInput.toLowerCase()
                                                        )))
                                            }
                                        >
                                            {isLoading ? (
                                                <>
                                                    <svg
                                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                        ></circle>
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        ></path>
                                                    </svg>
                                                    Adding...
                                                </>
                                            ) : (
                                                "Add GRN Items"
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Final GRN Items */}
                {scannedItems.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">Final GRN Items</h3>
                        <GRNAgainstPOScannedTable
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