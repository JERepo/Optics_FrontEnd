import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { useGetGRNDetailsMutation, useLazyDeleteGRNDetailQuery, useSaveCompleteGRNMutation } from "../../api/grnApi";
import toast from "react-hot-toast";
import { PenIcon, Trash2 } from "lucide-react";
import { Table, TableRow, TableCell } from "../../components/Table";
import { useNavigate } from "react-router-dom";
import { useGRNDC } from "../../features/GRNDcContext";
import { useGetGRNDCdataMutation, useSaveGRNDetailsMutation, useUpdateGRNPriceAndFittingMutation } from "../../api/grnDcApi";


export default function GRNDCStep3() {
    const { grnData, currentStep, setCurrentStep, updateStep3Data, nextStep, prevStep, resetGRN } = useGRNDC();
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

    // RTK mutation hooks --------------------------------------------------------------------------------
    const [getGRNDetails] = useGetGRNDCdataMutation();
    const [saveCompleteGRN] = useSaveGRNDetailsMutation();
    const [updateGRNPriceAndFitting] = useUpdateGRNPriceAndFittingMutation();


    // Handler Functions ---------------------------------------------------------------------------------

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchFilters((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState((prev) => ({
            ...prev,
            [name]: value
        }));
    };


    const handleCompleteGRN = async () => {
        
        if (filteredGrnViewDetails.length === 0) {
            toast.error("Please select at least one item to proceed");
            return;
        }

        const payload = {
            // companyId: grnData.step1.selectedLocation,
            grnDetails: filteredGrnViewDetails.map((item, index) => ({
                GRNMainID: grnData.step1.GrnMainId,
                GRNDetailID: item.GRNDetailId,
                GRNSlNo: index + 1,
                ProductType: item.ProductDetails?.ProductType,
                detailId: item.ProductDetails?.Id,
                BatchCode: item.BatchCode || null,
                OrderDetailId: item.OrderDetailId || null,
                VendorOrderNo: item.VendorOrderNo || null,
                PODetailsId: item.PODetailsId || null,
                GRNQty: Number(item.GRNQty) || 0,
                GRNPrice: Number(item.GRNPrice) || 0,
                TaxPercent: Number(item.TaxPercent || item.ProductDetails?.GSTPercentage) || 0,
                FittingPrice: Number(item.FittingPrice) || 0,
                FittingGSTPercentage: Number(item.FittingGSTPercentage) || 0,
                ApplicationUserId: user.Id
            })),
            remarks: formState.remarks
        };

        try {
            console.log("saveCompleteGRN payload:", payload);
            const response = await saveCompleteGRN(payload).unwrap();
            console.log("saveCompleteGRN response:", response);

            // Update context with selected items and API response
            // updateStep3Data({
            //     selectedItems,
            //     savedGRNDetails: response.data || []
            // });

            toast.success("GRN saved successfully");
            setCurrentStep(1);
        } catch (error) {
            console.error("Error saving GRN:", error);
            toast.error(`Failed to save GRN: ${error?.data?.message || error.message}`);
        }
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

    // Set table data from context
    useEffect(() => {
        if (grnData?.step3?.selectedItems) {
            setFilteredGrnViewDetails(grnData.step3.selectedItems);
        } else {
            setFilteredGrnViewDetails([]);
        }
    }, [grnData?.step3?.selectedItems]);


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
                        onClick={() => { setCurrentStep(2) }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                    >
                        BACK
                    </button>
                </div>


                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">GRN Items</h3>
                    <Table
                        columns={[
                            <><input
                                type="text"
                                name="GRNNo"
                                value={searchFilters.GRNNo}
                                onChange={handleSearchChange}
                                placeholder="Search GRN No."
                                className="w-full px-2 py-1 text-xs border rounded"
                            />
                                GRN No.
                            </>,
                            <><input
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
                            </>, <><input
                                type="text"
                                name="VendorOrderNo"
                                value={searchFilters.VendorOrderNo}
                                onChange={handleSearchChange}
                                placeholder="Search Supplier Order No."
                                className="w-full px-2 py-1 text-xs border rounded"
                            />Supplier Order No.
                            </>, "Product Details", "QTY", "GRN Price", "Fitting Price", "Total Amount"]}
                        data={filteredGrnViewDetails}
                        renderRow={(item, index) => (
                            <TableRow key={item.Barcode || index}>
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
                                        Barcode: {item?.ProductDetails?.barcode}<br />
                                        Category: {item?.category === 0 ? `Sunglass` : `OpticalFrame`} <br />
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

                                <TableCell>{grnData?.step1?.vendorDetails?.DCGRNPrice === 1 ? "" : (item.GRNQty || 0)}</TableCell>
                                <TableCell>{grnData?.step1?.vendorDetails?.DCGRNPrice === 1 ? "" : (item.GRNPrice || 0)}</TableCell>
                                <TableCell>{grnData?.step1?.vendorDetails?.DCGRNPrice === 1 ? "" : (item.FittingPrice || 0)}</TableCell>
                                {/* <TableCell>₹{" "}{grnData?.step1?.vendorDetails?.DCGRNPrice === 1 ? "" : (parseFloat(parseFloat(item?.GRNPrice * item?.GRNQty) * (parseFloat(item?.TaxPercent) / 100)) + parseFloat(item?.GRNPrice * item?.GRNQty) + parseFloat(item?.FittingPrice || 0) + ((Number(item?.FittingPrice) * (Number(item?.FittingGSTPercentage) / 100)) || 0)).toFixed(2)}</TableCell> */}
                                <TableCell>
                                    ₹{" "}
                                    {grnData?.step1?.vendorDetails?.DCGRNPrice === 1
                                        ? ""
                                        : (parseFloat(parseFloat(item?.GRNPrice * item?.GRNQty) * (parseFloat(item?.TaxPercent) / 100)) +
                                            parseFloat(item?.GRNPrice * item?.GRNQty) +
                                            parseFloat(item?.FittingPrice || 0) +
                                            ((Number(item?.FittingPrice) * (Number(item?.FittingGSTPercentage) / 100)) || 0)).toFixed(2)}

                                </TableCell>
                            </TableRow>
                        )}
                    />
                </div>


                {/* Calculation Summary Section */}
                {grnData?.step1?.vendorDetails?.DCGRNPrice === 1 ? null : (
                    <div className="flex mt-10 justify-between px-5 rounded-2xl shadow p-8">
                        {/* Total Quantity */}
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-600 font-bold text-lg">Total Quantity:</span>
                            <span className="font-bold text-lg">
                                {filteredGrnViewDetails.reduce((total, order) => total + (Number(order.GRNQty) || 0), 0)}
                            </span>
                        </div>

                        {/* Total Gross Value */}
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-600 font-bold text-lg">Total Gross Value:</span>
                            <span className="font-bold text-lg">
                                ₹{filteredGrnViewDetails
                                    .reduce((total, order) => {
                                        const quantity = Number(order.GRNQty) || 0;
                                        const price = Number(order.GRNPrice) || 0;
                                        const fittingPrice = Number(order.FittingPrice) || 0;
                                        return total + (price * quantity) + fittingPrice;
                                    }, 0)
                                    .toFixed(2)}
                            </span>
                        </div>

                        {/* Total GST */}
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-600 font-bold text-lg">Total GST:</span>
                            <span className="font-bold text-lg">
                                ₹{filteredGrnViewDetails
                                    .reduce((total, order) => {
                                        const quantity = Number(order.GRNQty) || 0;
                                        const price = Number(order.GRNPrice) || 0;
                                        const fittingPrice = Number(order.FittingPrice) || 0;
                                        const taxPercentage = Number(order.TaxPercent || order?.ProductDetails?.GSTPercentage) / 100 || 0;
                                        const fittingTaxPercentage = Number(order.FittingGSTPercentage) / 100 || 0;
                                        return total + (price * quantity * taxPercentage) + (fittingPrice * fittingTaxPercentage);
                                    }, 0)
                                    .toFixed(2)}
                            </span>
                        </div>

                        {/* Total Net Value */}
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-600 font-bold text-lg">Total Net Value:</span>
                            <span className="font-bold text-lg">
                                ₹{filteredGrnViewDetails
                                    .reduce((total, order) => {
                                        const quantity = Number(order.GRNQty) || 0;
                                        const price = Number(order.GRNPrice) || 0;
                                        const fittingPrice = Number(order.FittingPrice) || 0;
                                        const taxPercentage = Number(order.TaxPercent || order?.ProductDetails?.GSTPercentage) / 100 || 0;
                                        const fittingTaxPercentage = Number(order.FittingGSTPercentage) / 100 || 0;
                                        const subtotal = price * quantity;
                                        const gstAmount = subtotal * taxPercentage;
                                        const fittingGstAmount = fittingPrice * fittingTaxPercentage;
                                        return total + subtotal + gstAmount + fittingPrice + fittingGstAmount;
                                    }, 0)
                                    .toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}


                {/* Footer Complete GRN button */}
                <div className="flex items-center justify-between w-full">
                    {/* Remarks Section - takes available space */}
                    <div className="flex gap-5 items-center flex-1">
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

                    {/* Button container - fixed width */}
                    <div className="flex-shrink-0 ml-4">
                        <button
                            onClick={handleCompleteGRN}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 whitespace-nowrap"
                        // disabled={!createdPOMainId || poreviewDetails.length === 0}
                        >
                            Complete Purchase
                        </button>
                    </div>
                </div>

                {/* Save and Preview Button */}
                {/* <div className="flex justify-end mt-6">
                    <button
                        onClick={handleSaveAndPreview}
                        className="px-4 py-2 rounded-lg text-white transition-colors bg-blue-500 hover:bg-blue-600"
                    >
                        Complete Purchase
                    </button>
                </div> */}

            </motion.div>

        </>
    )
}