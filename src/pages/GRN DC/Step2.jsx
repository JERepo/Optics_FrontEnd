import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { useGetGRNDetailsMutation, useLazyDeleteGRNDetailQuery, useSaveCompleteGRNMutation } from "../../api/grnApi";
import toast from "react-hot-toast";
import { PenIcon, Trash2 } from "lucide-react";
import { Table, TableRow, TableCell } from "../../components/Table";
import { useNavigate } from "react-router-dom";
import { useGRNDC } from "../../features/GRNDcContext";
import { useGetGRNDCdataMutation, useUpdateGRNPriceAndFittingMutation } from "../../api/grnDcApi";


export default function GRNDCStep2() {
    const { grnData, currentStep, setCurrentStep, updateStep1Data, updateStep3Data, nextStep, prevStep, resetGRN } = useGRNDC();
    const navigate = useNavigate();
    console.log("grnData in GRNStep4 ---------------- ", grnData);
    const { user, hasMultipleLocations } = useSelector((state) => state.auth);
    const [grnViewDetails, setGrnViewDetails] = useState([]);
    const [formState, setFormState] = useState({
        remarks: ""
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [newQuantity, setNewQuantity] = useState('');
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [orderToRemove, setOrderToRemove] = useState(null);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [filteredGrnViewDetails, setFilteredGrnViewDetails] = useState([]);
    const [searchFilters, setSearchFilters] = useState({
        GRNNo: "",
        VendorDocNo: "",
        VendorOrderNo: ""
    });
    const [editPriceModal, setEditPriceModal] = useState(false);
    const [editPriceData, setEditPriceData] = useState({ GRNPrice: '', FittingPrice: '' });
    const [editingGRNDetailId, setEditingGRNDetailId] = useState(null);

    const [triggerDeleteGRNDetails] = useLazyDeleteGRNDetailQuery();

    const openModal = (index, currentQuantity) => {
        setEditingIndex(index);
        setNewQuantity(currentQuantity);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingIndex(null);
        setNewQuantity('');
    };

    const handleQuantityUpdate = async () => {
        if (editingIndex !== null) {
            await updateScannedItemQuantity(editingIndex, newQuantity);
            closeModal();
        }
    };

    // RTK mutation hooks --------------------------------------------------------------------------------
    const [getGRNDetails] = useGetGRNDCdataMutation();
    const [saveCompleteGRN] = useSaveCompleteGRNMutation();
    const [updateGRNPriceAndFitting] = useUpdateGRNPriceAndFittingMutation();


    // Handler Functions ---------------------------------------------------------------------------------
    const fetchGRNDetails = async () => {
        const payload = {
            companyId: grnData?.step1?.selectedLocation,
            vendorId: grnData?.step1?.selectedVendor,
        }

        try {

            console.log("fetchGRNDetails payload -------------- ", payload);
            const response = await getGRNDetails(payload);

            if (response?.data) {
                console.log("getAllGRNDetails response -------------- ", response);
                console.log("MAIN Id: ", response?.data?.data[0]?.GRNMainId);

                setGrnViewDetails(response?.data?.data || []);

                //Update the context
                // if (response?.data?.data[0]?.GRNMainId) {
                //     updateStep1Data({
                //         GrnMainId: response?.data?.data[0]?.GRNMainId,
                //     });
                //     console.log("Updated GRNMainId in context.", response?.data?.data[0]?.GRNMainId);
                // }
            }
        } catch (error) {
            console.error("Error fetching GRN details:", error);
            toast.error("Failed to fetch GRN details. Please try again.");
        }
    }


    const handleRowSelect = (index) => {
        const newSelectedRows = new Set(selectedRows);
        if (newSelectedRows.has(index)) {
            newSelectedRows.delete(index);
        } else {
            newSelectedRows.add(index);
        }
        setSelectedRows(newSelectedRows);
    };


    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIndices = new Set(filteredGrnViewDetails.map((_, index) => index));
            setSelectedRows(allIndices);
        } else {
            setSelectedRows(new Set());
        }
    };



    const updateGRNItemPrice = (index, newPrice) => {
        setGrnViewDetails(prevItems =>
            prevItems.map((item, i) =>
                i === index ? { ...item, GRNPrice: parseFloat(newPrice) } : item
            )
        );
    };

    const updateGRNItemQuantity = (index, newQuantity) => {
        setGrnViewDetails(prevItems =>
            prevItems.map((item, i) =>
                i === index ? { ...item, GRNQty: parseInt(newQuantity) } : item
            )
        );
    };

    const removeGRNItem = (index) => {
        setGrnViewDetails(prevItems => prevItems.filter((_, i) => i !== index));
        toast.success("Item removed");
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchFilters((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // Handler to open price edit modal
    const openPriceEditModal = (index, grnDetailId, currentGRNPrice, currentFittingPrice) => {
        setEditingIndex(index);
        setEditingGRNDetailId(grnDetailId);
        setEditPriceData({
            GRNPrice: currentGRNPrice || '0',
            FittingPrice: currentFittingPrice || '0'
        });
        setEditPriceModal(true);
    };

    // Handler to close price edit modal
    const closePriceEditModal = () => {
        setEditPriceModal(false);
        setEditingIndex(null);
        setEditPriceData({ GRNPrice: '', FittingPrice: '' });
    };

    // Handler to update GRNPrice and FittingPrice
    const handlePriceUpdate = async () => {
        if (editingIndex !== null) {
            const grnPrice = parseFloat(editPriceData.GRNPrice);
            const fittingPrice = parseFloat(editPriceData.FittingPrice);

            if (isNaN(grnPrice) || isNaN(fittingPrice)) {
                toast.error("Please enter valid numbers for GRN Price and Fitting Price");
                return;
            }

            const payload = {
                GRNDetailId: editingGRNDetailId,
                grnPrice: grnPrice || 0,
                fitting: fittingPrice || 0,
            }

            const response = await updateGRNPriceAndFitting(payload).unwrap();

            if (!response.success) {
                toast.success("Error updating price, Try again later.");
                return;
            }

            setGrnViewDetails(prevItems =>
                prevItems.map((item, i) =>
                    i === editingIndex
                        ? { ...item, GRNPrice: grnPrice, FittingPrice: fittingPrice }
                        : item
                )
            );
            toast.success("Price updated successfully");
            closePriceEditModal();
        }
    };

    // Handler for price input changes
    const handlePriceInputChange = (e) => {
        const { name, value } = e.target;
        setEditPriceData(prev => ({
            ...prev,
            [name]: value
        }));
    };


    // Handler for Save and Preview
    const handleSaveAndPreview = () => {
        const selectedItems = filteredGrnViewDetails.filter((_, index) => selectedRows.has(index));
        if (selectedItems.length === 0) {
            toast.error("Please select at least one item to proceed");
            return;
        }

        console.log("selectedItems --------- ", selectedItems);

        // Update context with selected items
        updateStep3Data({
            selectedItems: selectedItems
        });

        console.log("Selected items saved to context:", selectedItems);

        // Navigate to Step 3
        setCurrentStep(3);
    };

    // UseEffects ---------------------------------------------------------------------------------

    // Filter data based on search inputs
    useEffect(() => {
        const filteredData = grnViewDetails.filter(item => {
            const grnNoMatch = searchFilters.GRNNo
                ? item.GRNNo?.toLowerCase().includes(searchFilters.GRNNo.toLowerCase())
                : true;
            const vendorDocNoMatch = searchFilters.VendorDocNo
                ? item.VendorDocNo?.toLowerCase().includes(searchFilters.VendorDocNo.toLowerCase())
                : true;
            const vendorOrderNoMatch = searchFilters.VendorOrderNo
                ? item.VendorOrderNo?.toLowerCase().includes(searchFilters.VendorOrderNo.toLowerCase())
                : true;
            return grnNoMatch && vendorDocNoMatch && vendorOrderNoMatch;
        });
        setFilteredGrnViewDetails(filteredData);
        setSelectedRows(new Set()); // Reset selected rows when filter changes
    }, [searchFilters, grnViewDetails]);

    useEffect(() => {
        if (currentStep === 2) {
            fetchGRNDetails();
        }
    }, currentStep)


    return (
        <>
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-xl p-6 space-y-10"
            >

                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#000060] mb-6">Step {grnData?.step1?.againstPO === "1" ? currentStep : `4`}: Review Selected GRN</h2>
                    <button
                        onClick={() => { setCurrentStep(1) }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                    >
                        BACK
                    </button>
                </div>


                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">GRN Items</h3>
                    <Table
                        columns={[
                            <input
                                type="checkbox"
                                checked={selectedRows.size === filteredGrnViewDetails.length && filteredGrnViewDetails.length > 0}
                                onChange={handleSelectAll}
                                className="h-5 w-5"
                            />,
                            <div className="flex-col justify-end">
                                {/* <div className="h-8"></div> */}
                                <input
                                    type="text"
                                    name="GRNNo"
                                    value={searchFilters.GRNNo}
                                    onChange={handleSearchChange}
                                    placeholder="Search GRN No."
                                    className="w-full px-2 py-1 text-xs border rounded"
                                />
                                GRN No.
                            </div>,
                            <>
                                <input
                                    type="text"
                                    name="VendorDocNo"
                                    value={searchFilters.VendorDocNo}
                                    onChange={handleSearchChange}
                                    placeholder="Search Supplier Doc No."
                                    className="w-full px-2 py-1 text-xs border rounded"
                                />
                                Supplier Document No
                            </>,
                            <>
                                Supplier Document Date
                            </>,
                            <>
                                <input
                                    type="text"
                                    name="VendorOrderNo"
                                    value={searchFilters.VendorOrderNo}
                                    onChange={handleSearchChange}
                                    placeholder="Search Supplier Order No."
                                    className="w-full px-2 py-1 text-xs border rounded"
                                />
                                Supplier Order No.
                            </>, "Product Details", "QTY", "GRN Price", "Fitting Price", "Total Amount"]}
                        data={filteredGrnViewDetails}
                        renderRow={(item, index) => (
                            <TableRow key={item.Barcode || index}>
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.has(index)}
                                        onChange={() => handleRowSelect(index)}
                                        className="h-5 w-5"
                                    />
                                </TableCell>
                                <TableCell>{item.GRNNo}</TableCell>
                                <TableCell>{item.VendorDocNo}</TableCell>
                                <TableCell>
                                    {(() => {
                                        // Format expiry date from YYYY-MM-DD to DD-MM-YYYY
                                        if (item.VendorDocDate) {
                                            const [year, month, day] = item.VendorDocDate.split('-');
                                            const formattedExpiry = `${day}-${month}-${year}`;
                                            return <>{formattedExpiry}</>;
                                        }
                                        return null;
                                    })()}

                                </TableCell>
                                <TableCell>{item.VendorOrderNo || null}</TableCell>

                                {item?.ProductDetails?.ProductType === 1 ?
                                    <TableCell>{item?.ProductDetails?.productName}<br />
                                        Size: {item?.ProductDetails?.Size?.Size}<br />
                                        Category: {item?.category === 0 ? `Sunglass` : `OpticalFrame`} <br />
                                        Barcode: {item?.ProductDetails?.barcode}<br />
                                        HSN: {item?.ProductDetails?.HSN}
                                    </TableCell>
                                    : item?.ProductDetails?.ProductType === 2 ?
                                        <TableCell>{item?.ProductDetails?.productName}<br />
                                            Variation: {item?.ProductDetails?.Variation?.Variation}<br />
                                            Barcode: {item?.ProductDetails?.barcode}<br />
                                            HSN: {item?.ProductDetails?.HSN}
                                        </TableCell>
                                        : item?.ProductDetails?.ProductType === 3 ?
                                            <TableCell>
                                                {item.ProductDetails?.productName}
                                                {item.ProductDetails?.PowerSpecs?.Sph && <br />}{item.ProductDetails?.PowerSpecs?.Sph ? `Sph: ${item.ProductDetails?.PowerSpecs?.Sph > 0 ? `+` : ``}${item.ProductDetails?.PowerSpecs?.Sph}` : `Sph: `}
                                                {item.PowerSpecsCylindricalPower ? ` Cyl: ${item.CylindricalPower > 0 ? `+` : ``}${item.CylindricalPower}` : ` Cyl: `}
                                                {item.PowerSpecsAxis ? ` Axis: ${item.Axis > 0 ? `+` : ``}${item.Axis}` : ` Axis: `}
                                                {item.PowerSpecsAdditional ? ` Add: ${item.Additional > 0 ? `+` : ``}${item.Additional}` : ` Add: `}
                                                {item.Size && <br />}{item.Size}
                                                {item?.ProductDetails?.barcode && <br />}{item?.ProductDetails?.barcode ? `Barcode: ${item?.ProductDetails?.barcode}` : null}
                                                {item?.BatchCode && <br />}{item.BatchCode ? `BatchCode: ${item.BatchCode}` : null}
                                                {(() => {
                                                    console.log("Iteme ajnd", item);
                                                    const stock = item?.ProductDetails?.Stock?.find(stock => stock.BatchCode === item.BatchCode);
                                                    console.log("item.BatchCode:", item.BatchCode);
                                                    console.log("Stock array:", item?.ProductDetails?.Stock);
                                                    console.log("Found stock:", stock);

                                                    // Format expiry date from YYYY-MM-DD to DD-MM-YYYY
                                                    if (stock?.Expiry) {
                                                        const [year, month, day] = stock.Expiry.split('-');
                                                        const formattedExpiry = `${day}-${month}-${year}`;
                                                        return <> Expiry: {formattedExpiry}</>;
                                                    }
                                                    return null;
                                                })()}
                                                {item?.ProductDetails?.HSN && <br />}{`HSN: ${item?.ProductDetails?.HSN}`}
                                            </TableCell>
                                            : item?.ProductDetails?.ProductType === 0 ?
                                                <TableCell>
                                                    {item.ProductDetails?.productName}

                                                    {(item.PowerDetails?.Right?.RightSphericalPower || item.PowerDetails?.Right?.RightCylinderPower || item.PowerDetails?.Right?.RightAxis || item.PowerDetails?.Right?.RightAddition)
                                                        && <br />}
                                                    {`R: `}
                                                    {item.PowerDetails?.Right?.RightSphericalPower ? `Sph: ${item.PowerDetails?.Right?.RightSphericalPower > 0 ? `+` : ``}${item.PowerDetails?.Right?.RightSphericalPower}` : `Sph: `}
                                                    {item.PowerDetails?.Right?.RightCylinderPower ? ` Cyl: ${item.PowerDetails?.Right?.RightCylinderPower > 0 ? `+` : ``}${item.PowerDetails?.Right?.RightCylinderPower}` : ` Cyl: `}
                                                    {item.PowerDetails?.Right?.RightAxis ? ` Axis: ${item.PowerDetails?.Right?.RightAxis > 0 ? `+` : ``}${item.PowerDetails?.Right?.RightAxis}` : ` Axis: `}
                                                    {item.PowerDetails?.Right?.RightAddition ? ` Add: ${item.PowerDetails?.Right?.RightAddition > 0 ? `+` : ``}${item.PowerDetails?.Right?.RightAddition}` : ` Add: `}

                                                    {(item.PowerDetails?.Left?.LeftSphericalPower || item.PowerDetails?.Left?.LeftCylinderPower || item.PowerDetails?.Left?.LeftAxis || item.PowerDetails?.Left?.LeftAddition)
                                                        && <br />}
                                                    {`L: `}
                                                    {item.PowerDetails?.Left?.LeftSphericalPower ? `Sph: ${item.PowerDetails?.Left?.LeftSphericalPower > 0 ? `+` : ``}${item.PowerDetails?.Left?.LeftSphericalPower}` : `Sph: `}
                                                    {item.PowerDetails?.Left?.LeftCylinderPower ? ` Cyl: ${item.PowerDetails?.Left?.LeftCylinderPower > 0 ? `+` : ``}${item.PowerDetails?.Left?.LeftCylinderPower}` : ` Cyl: `}
                                                    {item.PowerDetails?.Left?.LeftAxis ? ` Axis: ${item.PowerDetails?.Left?.LeftAxis > 0 ? `+` : ``}${item.PowerDetails?.Left?.LeftAxis}` : ` Axis: `}
                                                    {item.PowerDetails?.Left?.LeftAddition ? ` Add: ${item.PowerDetails?.Left?.LeftAddition > 0 ? `+` : ``}${item.PowerDetails?.Left?.LeftAddition}` : ` Add: `}
                                                    {item.Size && <br />}{item.Size}

                                                    {(typeof item?.BatchCode) === 'string' && <br />}{(typeof item?.BatchCode) === 'string' ? `BatchCode: ${item.BatchCode}` : ``}
                                                    {(typeof item?.BatchCode) === 'string' && (item?.Expiry || item?.CLBatchExpiry) && ` Expiry: ${item.Expiry || item?.CLBatchExpiry}`}
                                                    {item?.ProductDetails?.HSN && <br />}{`HSN: ${item?.ProductDetails?.HSN}`}
                                                    {item?.FittingPrice && <br />} {item?.FittingPrice && `FittingCharge: ₹${item?.FittingPrice}`}
                                                </TableCell>
                                                : null
                                }

                                <TableCell>{(item.GRNQty || 0)}</TableCell>
                                <TableCell>{(item.GRNPrice || 0)}</TableCell>
                                <TableCell>{(item.FittingPrice || 0)}</TableCell>
                                {/* <TableCell>₹{" "}{grnData?.step1?.vendorDetails?.DCGRNPrice === 1 ? "" : (parseFloat(parseFloat(item?.GRNPrice * item?.GRNQty) * (parseFloat(item?.TaxPercent) / 100)) + parseFloat(item?.GRNPrice * item?.GRNQty) + parseFloat(item?.FittingPrice || 0) + ((Number(item?.FittingPrice) * (Number(item?.FittingGSTPercentage) / 100)) || 0)).toFixed(2)}</TableCell> */}
                                <TableCell>
                                    ₹{" "}
                                    {(parseFloat(parseFloat(item?.GRNPrice * item?.GRNQty) * (parseFloat(item?.TaxPercent) / 100)) +
                                        parseFloat(item?.GRNPrice * item?.GRNQty) +
                                        parseFloat(item?.FittingPrice || 0) +
                                        ((Number(item?.FittingPrice) * (Number(item?.FittingGSTPercentage) / 100)) || 0)).toFixed(2)}
                                    <button
                                        onClick={() => openPriceEditModal(index, item.GRNDetailId, item.GRNPrice, item.FittingPrice)}
                                        className="ml-2 inline-flex items-center"
                                    >
                                        <PenIcon className="h-4 w-4 text-blue-500 hover:text-blue-700" />
                                    </button>
                                </TableCell>
                            </TableRow>
                        )}
                    />
                </div>

                {/* Save and Preview Button */}
                <div className="flex justify-end mt-6">
                    <button
                        onClick={handleSaveAndPreview}
                        className={`px-4 py-2 rounded-lg text-white transition-colors ${selectedRows.size > 0
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "bg-gray-400 cursor-not-allowed"
                            }`}
                        disabled={selectedRows.size === 0}
                    >
                        Save and Preview
                    </button>
                </div>

            </motion.div>


            {/* Price Edit Modal */}
            <AnimatePresence>
                {editPriceModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center z-50"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-white rounded-lg p-6 w-full max-w-md"
                        >
                            <h3 className="text-lg font-semibold mb-4">Edit Prices</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">GRN Price</label>
                                    <input
                                        type="number"
                                        name="GRNPrice"
                                        value={editPriceData.GRNPrice}
                                        onChange={handlePriceInputChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter GRN Price"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Fitting Price</label>
                                    <input
                                        type="number"
                                        name="FittingPrice"
                                        value={editPriceData.FittingPrice}
                                        onChange={handlePriceInputChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter Fitting Price"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-4">
                                <button
                                    onClick={closePriceEditModal}
                                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePriceUpdate}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}