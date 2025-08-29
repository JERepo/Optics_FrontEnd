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
    useLazyFetchBarcodeForAccessoryQuery
} from "../../api/orderApi";
import {
    useLazyGetOlByBarcodeQuery
} from "../../api/purchaseOrderApi";
import { Table, TableRow, TableCell } from "../../components/Table";
import toast from "react-hot-toast";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useSaveGRNDetailsMutation } from "../../api/grnApi";
import { GRNSearchTable } from "./GRNSearchTables";
import { GRNScannedTable } from "./GRNScannedTables";

export default function GRNStep3() {
    // Context -----------------------------------------------------------------------------------------
    const { grnData, currentStep, updateStep1Data, nextStep, prevStep, resetGRN } = useGRN();
    // console.log(" grnData at step 3 ", grnData);
    // User State
    const { user, hasMultipleLocations } = useSelector((state) => state.auth);


    // Local State -----------------------------------------------------------------------------------------
    const [isLoading, setIsLoading] = useState(false);
    const [formState, setFormState] = useState({
        companyId: grnData.step1.selectedLocation,
        vendorDetails: grnData.step1.vendorDetails,
        productType: grnData.step2.productType || null,
        barcode: null,
        grnMainId: grnData.step1.GrnMainId
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

    // RTK Mutation Hooks -----------------------------------------------------------------------------------------
    const [SaveGRN, { isLoading: isSavingGRN }] = useSaveGRNDetailsMutation();

    // RTK Query Hooks -----------------------------------------------------------------------------------------
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

    const { data: allBrands } = useGetAllBrandsQuery();

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

    // Handler functions -----------------------------------------------------------------------------------------
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
            const updatedItems = [...prevItems];

            selectedRows.forEach(newItem => {
                // Prepare the item with default values
                const itemToAdd = {
                    ...newItem,
                    quantity: 1,
                    price: newItem.BuyingPrice || 0,
                    Id: newItem.Id || Date.now() // Use existing ID or generate a temporary one
                };

                // Check if item with same barcode already exists
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
            });

            return updatedItems;
        });

        toast.success(`Added ${selectedRows.length} item(s) to GRN`);
        setSelectedRows([]); // Clear selection after adding
    };

    // Handle search and add frame by barcode
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
            // case 2:
            //     typeFunction = triggerSearchOLByBarcode;
            //     break;
            case 3:
                typeFunction = triggerSearchAccessoryByBarcode;
                break;
            // case 4:
            //     typeFunction = triggerSearchCLByBarcode;
            //     break;
            default:
                typeFunction = null;
        }

        try {
            const result = await typeFunction({
                barcode: formState.barcode,
                locationId: formState.companyId
            }).unwrap();

            // Handle successful response
            if (result.data) {
                let newItem = {};
                if (formState.productType === "Contact Lens") {
                    newItem = {
                        ...result.data.data,
                        quantity: 1,
                        price: result?.data?.data?.BuyingPrice,
                        cLDetailId: result?.data?.data?.CLDetailId
                    };
                } else {
                    newItem = {
                        ...result.data,
                        quantity: 1,
                        price: result?.data?.BuyingPrice,
                        Id: result?.data?.Id
                    };
                }

                // Check if item with same barcode already exists
                const existingItemIndex = scannedItems.findIndex(
                    item => item.Barcode === newItem.Barcode
                );

                if (existingItemIndex >= 0) {
                    // Increment quantity for existing item
                    setScannedItems(prevItems =>
                        prevItems.map((item, index) =>
                            index === existingItemIndex
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        )
                    );
                } else {
                    // Add new item
                    setScannedItems(prevItems => [...prevItems, newItem]);
                }

                toast.success("Item added successfully");

                // Clear the barcode input
                setFormState(prev => ({
                    ...prev,
                    barcode: ""
                }));
            }

        } catch (error) {
            console.error("Barcode scan failed:", error);
            toast.error("Failed to add item. Please check the barcode and try again.");
        }
    };

    // Handle detail search for Frame and Accessories
    const handleDetailSearch = async (type) => {
        // Validate inputs
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


    // Save GRN Details
    const handleSubmitGRNDetails = async () => {
        try {
            console.log("GRN data before submitting details ", grnData);
            if (!grnData?.step1?.GrnMainId) {
                throw new Error("GRN main ID not found");
            }

            let grnDetails = [];

            setIsLoading(true);
            if (scannedItems.length === 0) {
                toast.error("Please scan and add at least one item");
                return;
            }

            console.log("scannedItems in po details ", scannedItems);


            if (formState.productType === "Frame/Sunglass" || formState.productType === "Accessories") {
                grnDetails = scannedItems.map((item, index) => {
                    let taxPercent = 0;

                    // Calculate tax percentage based on slab system
                    if (item?.Tax?.Details && item?.Tax?.Details?.length > 0) {
                        const taxDetails = item?.Tax?.Details;
                        console.log("taxDetails ", taxDetails);
                        // If there's only one tax detail object, use its PurTaxPerct directly
                        if (taxDetails.length === 1) {
                            taxPercent = parseFloat(taxDetails[0]?.PurTaxPerct) || 0;
                        } else {
                            // Multiple tax details - use slab calculation
                            const transferPrice = item.price || item?.BuyingPrice;

                            for (const taxDetail of taxDetails) {
                                if (taxDetail.SlabEnd && taxDetail.SalesTaxPerct) {
                                    // Calculate new slab end
                                    const salesTaxDecimal = parseFloat(taxDetail.SalesTaxPerct) / 100;
                                    const newSlabEnd = parseFloat(taxDetail.SlabEnd) / (1 + salesTaxDecimal);

                                    // Check if transfer price falls within this slab
                                    if (transferPrice <= newSlabEnd) {
                                        taxPercent = parseFloat(taxDetail.PurTaxPerct) || 0;
                                        break; // Found the correct slab, exit loop
                                    }
                                }
                            }

                            // If no slab matched, use the first tax detail as fallback
                            if (taxPercent === 0) {
                                taxPercent = parseFloat(taxDetails[0].PurTaxPerct) || 0;
                            }
                        }
                    }

                    console.log("Final taxPercent for item ", item.Barcode, taxPercent);

                    return {
                        GRNMainID: formState.grnMainId,
                        GRNSlNo: index + 1,
                        ProductType: formState.productType === 'Frame/Sunglass' ? 1
                            : formState.productType === 'Lens' ? 0
                                : formState.productType === 'Accessories' ? 2
                                    : formState.productType === 'Contact Lens' ? 3
                                        : null,
                        detailId: item.Id,
                        BatchCode: null,
                        OrderDetailId: null,
                        VendorOrderNo: null,
                        PODetailsId: null,
                        GRNQty: item.quantity || 1,
                        GRNPrice: item.price || item.BuyingPrice,
                        TaxPercent: taxPercent,
                        FittingPrice: null,
                        FittingGSTPercentage: null,
                        ApplicationUserId: user.Id
                    };
                });
            }

            // Call API to save PO details
            const response = await SaveGRN(grnDetails).unwrap();
            if (response.status === "success") {
                toast.success("GRN details saved successfully");
                nextStep();
            }


        } catch (error) {
            console.error("Error saving purchase order details:", error);
            toast.error("Failed to save GRN details. Please try again.");
        }
    };

    const updateScannedItemPrice = (itemId, newPrice) => {
        setScannedItems(prevItems =>
            prevItems.map(item =>
                item.Id === itemId ? { ...item, price: parseFloat(newPrice) } : item
            )
        );
    };

    const updateScannedItemQuantity = (itemId, newQuantity) => {
        setScannedItems(prevItems =>
            prevItems.map(item =>
                item.Id === itemId ? { ...item, quantity: parseInt(newQuantity) } : item
            )
        );
    };

    const removeScannedItem = (itemId) => {
        setScannedItems(prevItems => prevItems.filter(item => item.Id !== itemId));
        toast.success("Item removed");
    };

    return (
        <>
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-xl p-6 space-y-10"
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

                {!showSearchInputs ? (
                    // Barcode Input and Search
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
                                            if (formState.productType === "Frame/Sunglass") { handleSearchByBarcode(1) }
                                            else if (formState.productType === "Lens") { handleSearchByBarcode(2) }
                                            else if (formState.productType === "Accessories") { handleSearchByBarcode(3) }
                                            else if (formState.productType === "Contact Lens") { handleSearchByBarcode(4) }
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
                                if (formState.productType === "Frame/Sunglass") { handleSearchByBarcode(1) }
                                else if (formState.productType === "Lens") { handleSearchByBarcode(2) }
                                else if (formState.productType === "Accessories") { handleSearchByBarcode(3) }
                                else if (formState.productType === "Contact Lens") { handleSearchByBarcode(4) }
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
                            onClick={() => setShowSearchInputs(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap flex items-center justify-center w-full md:w-auto"
                        >
                            Back to Barcode
                        </button>
                    </div>
                )}

                {/* Search results table */}
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

                {/* Scanned items table */}
                {scannedItems.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">GRN Items</h3>

                        <GRNScannedTable
                            scannedItems={scannedItems}
                            updateScannedItemPrice={updateScannedItemPrice}
                            updateScannedItemQuantity={updateScannedItemQuantity}
                            removeScannedItem={removeScannedItem}
                            productType={grnData.step2.productType === "Frame/Sunglass" ? 1 : grnData.step2.productType === "Accessories" ? 2 : null}
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
                            disabled={scannedItems.length <= 0}
                        >
                            Save & Next
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    )
}