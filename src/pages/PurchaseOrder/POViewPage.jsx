import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ArrowLeft, PenIcon, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetAllPoDetailsForNewOrderMutation, useGetAllPoDetailsMutation } from "../../api/purchaseOrderApi";
import { calculateTotalQuantity } from "./helperFunction";

export function POViewPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, hasMultipleLocations } = useSelector((state) => state.auth);

    const [getAllPoDetails] = useGetAllPoDetailsMutation();
    const [getAllPoDetailsForNewOrder] = useGetAllPoDetailsForNewOrderMutation();



    // Get parameters from navigation state
    const {
        poData
    } = location.state || {};

    console.log("Get data ---------- ",
        poData);

    const [poreviewDetails, setPoreviewDetails] = useState([]);
    const [formState, setFormState] = useState({
        shiptoAddress: "against",
        remarks: "",
        vendorId: null
    });
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [currentStep, setCurrentStep] = useState(4);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [orderToRemove, setOrderToRemove] = useState(null);
    const [createdPOMainId, setCreatedPOMainId] = useState(null);


    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const payload = {
                    locationId: poData.createdCompanyID,
                    ApplicationUserId: poData.applicationUser, // Replace with actual user ID
                    vendorId: poData.vendor.Id,
                    againstOrder: String(poData.againstOrder),
                    status: 1,
                    poMainId: poData.id,
                    poMain: poData.id
                };

                if (poData.againstOrder === 1) {
                    console.log("Hi");
                    const response = await getAllPoDetails(payload);
                    setPoreviewDetails(response.data || []);
                } else if (poData.againstOrder === 0) {
                    const poDetailsResponse = await getAllPoDetailsForNewOrder(payload);
                    console.log("poDetailsResponse --------------- ", poDetailsResponse);
                    setPoreviewDetails(poDetailsResponse.data.data || []);
                }
            } catch (error) {
                console.error("Error fetching PO details:", error);
            }
        };

        fetchOrderDetails();
    }, [poData]);

    console.log("poreviewDetails --------------------- ", poreviewDetails);


    const calculateTotalAmount = () => {
        if (poData.againstOrder === 1) {
            return poreviewDetails.reduce((total, order) => {
                const quantity = order.poQty ?? (order.orderQty - order.billedQty - order.cancelledQty);
                const price = order.productType === 3
                    ? parseFloat(order.poPrice ?? order?.priceMaster?.buyingPrice) || 0
                    : parseFloat(order.poPrice ?? order?.pricing?.buyingPrice) || 0;
                const taxPercentage = parseFloat(order.taxPercentage) / 100 || 0;

                return total + (price * quantity * (1 + taxPercentage));
            }, 0);
        } else {
            return poreviewDetails.reduce((total, order) => {
                const quantity = order.poQty ?? order.POQty;
                const price = order?.ProductDetails?.ProductType === 3
                    ? parseFloat(order.poPrice ?? order?.ProductDetails?.price?.BuyingPrice) || 0
                    : parseFloat(order.poPrice ?? order?.ProductDetails?.Stock?.BuyingPrice) || 0;
                const taxPercentage = parseFloat(order?.ProductDetails?.GSTPercentage) / 100 || 0;

                return total + (price * quantity * (1 + taxPercentage));
            }, 0);
        }
    };

    const renderProductDetails = (order) => {
        switch (order.productType) {
            case 0: // Optical Lens
                return (
                    <td className="px-6 py-4 whitespace-wrap min-w-72">
                        {order?.productDescName}
                        {/* Lens specifications rendering */}
                        {(order?.specs?.powerDetails?.right?.sphericalPower ||
                            order?.specs?.powerDetails?.right?.cylindricalPower ||
                            order?.specs?.powerDetails?.right?.axis ||
                            order?.specs?.powerDetails?.right?.additional) && (
                                <>
                                    <br />
                                    R: {order?.specs?.powerDetails?.right?.sphericalPower &&
                                        `SPH: ${order?.specs?.powerDetails?.right?.sphericalPower > 0 ?
                                            `+${order?.specs?.powerDetails?.right?.sphericalPower}` :
                                            order?.specs?.powerDetails?.right?.sphericalPower}`}
                                    {order?.specs?.powerDetails?.right?.cylindricalPower &&
                                        ` CYL: ${order?.specs?.powerDetails?.right?.cylindricalPower > 0 ?
                                            `+${order?.specs?.powerDetails?.right?.cylindricalPower}` :
                                            order?.specs?.powerDetails?.right?.cylindricalPower}`}
                                    {order?.specs?.powerDetails?.right?.axis && ` Axis: ${order?.specs?.powerDetails?.right?.axis}`}
                                    {order?.specs?.powerDetails?.right?.additional &&
                                        ` Add: ${order?.specs?.powerDetails?.right?.additional > 0 ?
                                            `+${order?.specs?.powerDetails?.right?.additional}` :
                                            order?.specs?.powerDetails?.right?.additional}`}
                                </>
                            )}
                        {/* Left lens specifications */}
                        {(order?.specs?.powerDetails?.left?.sphericalPower ||
                            order?.specs?.powerDetails?.left?.cylindricalPower ||
                            order?.specs?.powerDetails?.left?.axis ||
                            order?.specs?.powerDetails?.left?.additional) && (
                                <>
                                    <br />
                                    L: {order?.specs?.powerDetails?.left?.sphericalPower &&
                                        `SPH: ${order?.specs?.powerDetails?.left?.sphericalPower > 0 ?
                                            `+${order?.specs?.powerDetails?.left?.sphericalPower}` :
                                            order?.specs?.powerDetails?.left?.sphericalPower}`}
                                    {order?.specs?.powerDetails?.left?.cylindricalPower &&
                                        ` CYL: ${order?.specs?.powerDetails?.left?.cylindricalPower > 0 ?
                                            `+${order?.specs?.powerDetails?.left?.cylindricalPower}` :
                                            order?.specs?.powerDetails?.left?.cylindricalPower}`}
                                    {order?.specs?.powerDetails?.left?.axis && ` Axis: ${order?.specs?.powerDetails?.left?.axis}`}
                                    {order?.specs?.powerDetails?.left?.additional &&
                                        ` Add: ${order?.specs?.powerDetails?.left?.additional > 0 ?
                                            `+${order?.specs?.powerDetails?.left?.additional}` :
                                            order?.specs?.powerDetails?.left?.additional}`}
                                </>
                            )}
                        {order?.specs?.addOn?.addOnId && (
                            <><br /><span className="font-medium">AddOn: {order?.specs?.addOn?.addOnName}</span></>
                        )}
                        {order?.specs?.tint?.tintCode && (
                            <><br /><span className="font-medium">Tint: {order?.specs?.tint?.tintName}</span></>
                        )}
                        {order?.hSN && <><br /><span className="font-medium">HSN: {order?.hSN}</span></>}
                    </td>
                );
            case 1: // Frame
                return (
                    <td className="px-6 py-4 whitespace-wrap">
                        {order?.productDescName}
                        <br />{order?.size}-{order?.dBL}-{order?.templeLength}
                        <br />{order?.category === 0 ? `Sunglass` : `OpticalFrame`}
                        <br />{order?.barcode && `Barcode: ${order?.barcode}`}
                        <br />{order?.hSN && `HSN: ${order?.hSN}`}
                    </td>
                );
            case 2: // Accessory
                return (
                    <td className="px-6 py-4 whitespace-wrap">
                        {order?.productDescName}
                        {order?.variationName && <><br />Variation: {order?.variationName}</>}
                        {order?.barcode && <><br />Barcode: {order?.barcode}</>}
                        {order?.hSN && <><br />HSN: {order?.hSN}</>}
                    </td>
                );
            case 3: // Contact Lens
                return (
                    <td className="px-6 py-4 whitespace-wrap">
                        {order?.productDescName}
                        <br />{order?.sphericalPower && `Sph: ${order?.sphericalPower > 0 ? `+${order?.sphericalPower}` : order?.sphericalPower}`}
                        {order?.cylindricalPower && ` Cyld: ${order?.cylindricalPower > 0 ? `+${order?.cylindricalPower}` : order?.cylindricalPower}`}
                        {order?.axis && ` Axis: ${order?.axis}`}
                        {order?.additional && ` Add: ${order?.additional > 0 ? `+${order?.additional}` : order?.additional}`}
                        {order?.color && <><br />Clr: {order?.color}</>}
                        {order?.barcode && <><br />Barcode: {order?.barcode}</>}
                        {order?.hSN && <><br />HSN: {order?.hSN}</>}
                    </td>
                );
            default:
                return <td className="px-6 py-4 whitespace-wrap">N/A</td>;
        }
    };

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6"
        >
            <div className=" items-center mb-4">
                <button
                    className="text-[#000060] hover:text-[#0000a0] transition-colors flex items-center mb-3"
                    onClick={() => { navigate('/purchase-order') }}
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to dashboard
                </button>
                <h1 className="text-3xl lg:text-4xl font-bold text-[#000060] mb-2">
                    Purchase Order
                </h1>

            </div>

            <div key={poData.vendor.Id} className=" gap-12 my-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <p className="text-gray-700 ">
                        <span className="font-bold flex">Vendor Name </span>
                        <span>{poData.vendor.VendorName}</span>
                    </p>
                    <p className="text-gray-700">
                        <span className="font-bold flex">Mobile Number</span>
                        <span>{poData.vendor.MobNumber}</span>
                    </p>
                    <p className="text-gray-700">
                        <span className="font-bold flex">Address</span>
                        <span className="flex">{poData.vendor.Address1} {poData.vendor.Address2}</span>
                        <span>{poData.vendor.City}</span>
                    </p>
                    <p className="text-gray-700">
                        <span className="font-bold flex">GST Number</span>
                        <span className="">{poData.vendor.TAXNo}</span>
                    </p>
                </div>
            </div>

            <div className="overflow-auto rounded-lg shadow">
                {poData.againstOrder === 1 ? (
                    <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-blue-50">
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
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {poreviewDetails.map((order, index) => (
                                <tr key={order.id || index}>
                                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{order.orderPrefix}/{order.orderNo}/{order.slNo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {order.productType === 0 ? 'OL' :
                                            order.productType === 1 ? 'F' :
                                                order.productType === 2 ? 'Acc' :
                                                    order.productType === 3 ? 'CL' : 'N/A'}
                                    </td>
                                    {renderProductDetails(order)}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {order.productType === 3 ?
                                            (order.poPrice ?? order?.priceMaster?.buyingPrice) :
                                            (order.poPrice ?? order?.pricing?.buyingPrice)
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{order?.orderQty}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {order.poQty ?? (order.orderQty - order.billedQty - order.cancelledQty)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {order.productType === 3 ?
                                            (order?.stock?.reduce((total, item) => total + item.quantity, 0) || 0) :
                                            (order?.pricing?.quantity || 0)
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {(() => {
                                            const quantity = order.poQty ?? (order.orderQty - order.billedQty - order.cancelledQty);
                                            const price = order.productType === 3 ?
                                                parseFloat(order.poPrice ?? order?.priceMaster?.buyingPrice) || 0 :
                                                parseFloat(order.poPrice ?? order?.pricing?.buyingPrice) || 0;
                                            const taxPercentage = parseFloat(order.taxPercentage) / 100 || 0;

                                            return (price * quantity * (1 + taxPercentage)).toFixed(2);
                                        })()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : poData.againstOrder === 0 ? (
                    <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-blue-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">SL No.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Product Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Barcode</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Product Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Buying Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">PO Qty</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Avl. Qty</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {poreviewDetails.map((order, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {order?.ProductDetails?.ProductType === 0 ? 'OL' :
                                            order?.ProductDetails?.ProductType === 1 ? 'F' :
                                                order?.ProductDetails?.ProductType === 2 ? 'Acc' :
                                                    order?.ProductDetails?.ProductType === 3 ? 'CL' : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{order?.ProductDetails?.ProductType == 0 ? "" : order?.ProductDetails?.barcode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
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
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {order?.ProductDetails?.ProductType === 3 ?
                                            (order.poPrice ?? order?.ProductDetails?.price?.BuyingPrice) :
                                            (order.poPrice ?? order?.ProductDetails?.Stock?.BuyingPrice)
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {order.poQty ?? order?.POQty}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{order?.ProductDetails?.Stock?.Quantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {order?.ProductDetails?.ProductType === 3 ? (
                                            (
                                                ((order?.poPrice ?? order?.ProductDetails?.price?.BuyingPrice) * (order.poQty ?? order?.POQty)) +
                                                ((order?.poPrice ?? order?.ProductDetails?.price?.BuyingPrice) *
                                                    (order.poQty ?? order?.POQty) *
                                                    ((order?.taxPercent) / 100) || 1)
                                                ).toFixed(2)
                                            ) : (
                                            // Default calculation
                                            (
                                                ((order?.poPrice ?? order?.ProductDetails?.Stock?.BuyingPrice) * (order.poQty ?? order?.POQty)) +
                                                ((order?.poPrice ?? order?.ProductDetails?.Stock?.BuyingPrice) *
                                                    (order.poQty ?? order?.POQty) *
                                                    ((order?.taxPercent) / 100) || 1)
                                            ).toFixed(2)
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : null}
            </div>

            {/* Calculation Summary Section */}
            <div className="flex mt-10 justify-between px-5 rounded-2xl shadow p-8">
                <div className="flex justify-between gap-4">
                    <span className="text-gray-600 font-bold text-lg">Total Quantity:</span>
                    <span className="font-bold text-lg">
                        {Number(poData.totalQty)}
                    </span>
                </div>

                <div className="flex justify-between gap-4">
                    <span className="text-gray-600 font-bold text-lg">Total Gross Value:</span>
                    <span className="font-bold text-lg">
                        ₹ {Number(poData.totalGrossValue).toFixed}
                    </span>
                </div>

                <div className="flex justify-between gap-4">
                    <span className="text-gray-600 font-bold text-lg">Total GST:</span>
                    <span className="font-bold text-lg">
                        ₹ {Number(poData.totalGSTValue).toFixed(2)}
                    </span>
                </div>

                <div className="flex justify-between gap-4">
                    <span className="text-gray-600 font-bold text-lg">Total Net Value:</span>
                    <span className="font-bold text-lg">
                        ₹ {Number(poData.totalValue).toFixed(2)}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}