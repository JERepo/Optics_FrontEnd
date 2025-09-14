import { useEffect, useState } from "react";
import { useGRN } from "../../features/GRNContext";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useGetGRNDetailsMutation, useSaveCompleteGRNMutation } from "../../api/grnApi";
import toast from "react-hot-toast";
import { PenIcon, Trash2 } from "lucide-react";
import { Table, TableRow, TableCell } from "../../components/Table";
import { useNavigate } from "react-router-dom";

export default function GRNStep4() {
    const { grnData, currentStep, setCurrentStep, updateStep1Data, nextStep, prevStep, resetGRN } = useGRN();
    const navigate = useNavigate();
    console.log("grnData in GRNStep4 ---------------- ", grnData);
    const { user, hasMultipleLocations } = useSelector((state) => state.auth);
    const [grnViewDetails, setGrnViewDetails] = useState([]);
    const [formState, setFormState] = useState({
        remarks: ""
    });

    // RTK mutation hooks --------------------------------------------------------------------------------
    const [getGRNDetails, {
        isLoading: isLoadingGRNDetails,
        error: errorGRNDetails
    }] = useGetGRNDetailsMutation();

    const [saveCompleteGRN] = useSaveCompleteGRNMutation();


    // Handler Functions ---------------------------------------------------------------------------------
    const fetchGRNDetails = async () => {
        const payload = {
            companyId: grnData?.step1?.selectedLocation,
            vendorId: grnData?.step1?.selectedVendor,
            againstPo: grnData?.step1?.againstPO,
            applicationUserId: user?.Id,

        }

        if(grnData?.step1?.GrnMainId){
            payload.grnMain = grnData?.step1?.GrnMainId;
        }

        try {

            console.log("fetchGRNDetails payload -------------- ", payload);
            const response = await getGRNDetails(payload);

            if (response?.data) {
                console.log("getAllGRNDetails response -------------- ", response);
                console.log("MAIN Id: ", response?.data?.data[0]?.GRNMainId);

                setGrnViewDetails(response?.data?.data || []);

                //Update the context
                if(response?.data?.data[0]?.GRNMainId) {
                    updateStep1Data({
                        GrnMainId: response?.data?.data[0]?.GRNMainId,
                    });
                    console.log("Updated GRNMainId in context.", response?.data?.data[0]?.GRNMainId);
                }
            }
        } catch (error) {
            console.error("Error fetching GRN details:", error);
            toast.error("Failed to fetch GRN details. Please try again.");
        }
    }

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


    const handleCompleteGRN = async () => {
        try {
            if (grnViewDetails.length === 0) {
                toast.error("Please add at least one item to complete GRN");
                return;
            }

            console.log("grnViewDetails in save --------------- ", grnViewDetails);

            // Prepare GRN details for API
            const grnDetails = grnViewDetails.map(item => ({
                GRNDetailId: item.GRNDetailId || item.Id, // Adjust based on your actual ID field
                GRNQty: item.GRNQty || 1,
                GRNPrice: item.GRNPrice || 0,
                ProductType: item?.ProductDetails?.ProductType,
                detailId: item?.ProductDetails?.ProductDetailId
            }));

            // console.log("grnDetails in save --------------- ", grnDetails);
            // return;

            const payload = {
                remarks: formState.remarks,
                grnDetails: grnDetails
            };

            const response = await saveCompleteGRN({
                grnMainId: grnData?.step1?.GrnMainId,
                companyId: grnData.step1.selectedLocation,
                payload
            }).unwrap();

            if (response.status === "success") {
                toast.success("GRN completed successfully!");
                resetGRN(); // Reset the GRN context
                // Navigate to GRN list or next step as needed
                // setCurrentStep(1); // Or navigate to GRN list
                navigate("/grn");
            } else {
                toast.error("Failed to complete GRN");
            }

        } catch (error) {
            console.error("Error completing GRN:", error);
            toast.error(error.data?.message || "Failed to complete GRN");
        }
    };

    // UseEffects ---------------------------------------------------------------------------------

    useEffect(() => {
        if (currentStep === 4 || currentStep === 5) {
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
                    <h2 className="text-xl font-bold text-[#000060] mb-6">Step 4: Review Selected GRN</h2>
                    <button
                        onClick={() => {setCurrentStep(2)}}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                    >
                        Add Product
                    </button>
                </div>


                {/* Vendor Details */}
                <div className="flex justify-start gap-12 mb-6">
                    {grnData?.step1?.vendorDetails && (
                        <div key={grnData?.step1?.vendorDetails.Id} className="mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <p className="text-gray-700 ">
                                    <span className="font-bold flex">Vendor Name </span>
                                    <span>{grnData?.step1?.vendorDetails.VendorName}</span>
                                </p>
                                <p className="text-gray-700">
                                    <span className="font-bold flex">Mobile Number</span>
                                    <span>{grnData?.step1?.vendorDetails.MobNumber}</span>
                                </p>
                                <p className="text-gray-700">
                                    <span className="font-bold flex">Address</span>
                                    <span className="flex">{grnData?.step1?.vendorDetails.Address1} {grnData?.step1?.vendorDetails.Address2}</span>
                                    <span>{grnData?.step1?.vendorDetails.City}</span>
                                </p>
                                <p className="text-gray-700">
                                    <span className="font-medium flex">GST Number</span>
                                    <span className="font-bold">{grnData?.step1?.vendorDetails.TAXNo}</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>


                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">GRN Items</h3>
                    <Table
                        columns={["Sl No.", "Order No.", "Supplier Order No.", "Type", "Barcode", "Product Name", "MRP", "GST", "QTY", "Buying Price", "Total Amount", "Action"]}
                        data={grnViewDetails}
                        renderRow={(item, index) => (
                            <TableRow key={item.Barcode || index}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{item.OrderNo || null}</TableCell>
                                <TableCell>{item.VendorOrderNo || null}</TableCell>
                                <TableCell>{item?.ProductDetails?.ProductType == 0 && `OL` || item?.ProductDetails?.ProductType == 1 && `F` || item?.ProductDetails?.ProductType == 2 && `Acc` || item?.ProductDetails?.ProductType == 3 && `CL`}</TableCell>
                                <TableCell>{item?.ProductDetails?.barcode}</TableCell>
                                <TableCell>{item?.ProductDetails?.productName}<br />
                                    Size: {item?.ProductDetails?.Size?.Size}<br />
                                    Category: {item?.category === 0 ? `Sunglass` : `OpticalFrame`} <br />
                                    HSN: {item?.ProductDetails?.HSN}
                                </TableCell>
                                <TableCell>{item.MRP || null}</TableCell>
                                <TableCell>₹{" "} {parseFloat(parseInt(item?.GRNPrice) * (parseInt(item?.TaxPercent) / 100)).toFixed(2)}</TableCell>
                                <TableCell>
                                    <input
                                        type="number"
                                        value={item?.GRNQty || 1}
                                        onChange={(e) => updateGRNItemQuantity(index, e.target.value)}
                                        className="w-16 px-2 py-1 border rounded"
                                        min="1"
                                    />
                                </TableCell>
                                <TableCell>₹{" "}
                                    <input
                                        type="number"
                                        value={grnData?.step1?.vendorDetails?.DCGRNPrice === 1 ? "" : (item.GRNPrice || 0)}
                                        onChange={(e) => updateGRNItemPrice(index, e.target.value)}
                                        className="w-20 px-2 py-1 border rounded"
                                    />
                                </TableCell>
                                <TableCell>₹{" "}{grnData?.step1?.vendorDetails?.DCGRNPrice === 1 ? "" : (parseFloat(parseInt(item?.GRNPrice * item?.GRNQty) * (parseInt(item?.TaxPercent) / 100)) + parseInt(item?.GRNPrice * item?.GRNQty)).toFixed(2)}
                                </TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => removeGRNItem(index)}
                                        className="p-1 text-red-600 hover:text-red-800"
                                        aria-label="Delete item"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </TableCell>
                            </TableRow>
                        )}
                    />
                </div>


                {/* Calculation Summary Section */}
                {grnData?.step1?.vendorDetails?.DCGRNPrice === 1 ? "" : (
                    <div className="flex mt-10 justify-between px-5 rounded-2xl shadow p-8">

                        <div className="flex justify-between gap-4">
                            <span className="text-gray-600 font-bold text-lg">Total Quantity :</span>
                            <span className="font-bold text-lg">
                                {grnViewDetails
                                    .reduce((total, order) => total + (order.GRNQty), 0)}
                            </span>
                        </div>

                        <div className="flex justify-between gap-4">
                            <span className="text-gray-600 font-bold text-lg">Total Gross Value :</span>
                            <span className="font-bold text-lg">
                                ₹{
                                    grnViewDetails
                                        .reduce((total, order) => {
                                            const quantity = order.GRNQty;
                                            const price = parseFloat(order.GRNPrice) || 0;

                                            // Ensure both price and quantity are valid numbers
                                            if (price && !isNaN(price) && !isNaN(quantity)) {
                                                return total + (price * quantity);
                                            }
                                            return total;
                                        }, 0)
                                        ?.toFixed?.(2) ?? '0.00'
                                }
                            </span>
                        </div>

                        <div className="flex justify-between gap-4">
                            <span className="text-gray-600 font-bold text-lg">Total GST :</span>
                            <span className="font-bold text-lg">
                                ₹{grnViewDetails
                                    .reduce((total, order) => {
                                        const quantity = order.GRNQty;
                                        const price = parseFloat(order.GRNPrice) || 0;
                                        const taxPercentage = parseFloat(order?.ProductDetails?.GSTPercentage / 100) || 0;
                                        if (price && !isNaN(price) && !isNaN(quantity)) {
                                            return total + (price * quantity * taxPercentage);
                                        }
                                        return total;
                                    }, 0)
                                    ?.toFixed?.(2) ?? '0.00'}
                            </span>
                        </div>

                        <div className="flex justify-between gap-4">
                            <span className="text-gray-600 font-bold text-lg">Total Net Value :</span>
                            <span className="font-bold text-lg">
                                ₹{grnViewDetails
                                    .reduce((total, item) => {
                                        const quantity = item.GRNQty || 0;
                                        const price = item.GRNPrice || 0;
                                        const gstPercentage = parseInt(item?.ProductDetails?.GSTPercentage) || 0;

                                        if (price && !isNaN(price) && !isNaN(quantity)) {
                                            const subtotal = price * quantity;
                                            const gstAmount = subtotal * (gstPercentage / 100);
                                            return total + subtotal + gstAmount;
                                        }
                                        return total;
                                    }, 0)
                                    ?.toFixed?.(2) ?? '0.00'}

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
                            Complete Purchase Order
                        </button>
                    </div>
                </div>
            </motion.div >
        </>
    )
}