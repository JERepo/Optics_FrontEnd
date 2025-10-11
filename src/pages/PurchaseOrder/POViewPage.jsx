import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, PenIcon, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
    useApproveUpdatePriceMutation,
    useGetAllPoDetailsForNewOrderMutation,
    useGetAllPoDetailsMutation,
    useLazyApprovePoQuery,
    useApproveUpdateQtyMutation,
    useGetPOMainMutation,
} from "../../api/purchaseOrderApi";
import HasPermission from "../../components/HasPermission";
import toast from "react-hot-toast";

export function POViewPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [getAllPoDetails] = useGetAllPoDetailsMutation();
    const [getAllPoDetailsForNewOrder] = useGetAllPoDetailsForNewOrderMutation();
    const [triggerApprovePo] = useLazyApprovePoQuery();
    const [triggerUpdatePrice] = useApproveUpdatePriceMutation();
    const [triggerUpdateQty] = useApproveUpdateQtyMutation();
    const [fetchPoMain] = useGetPOMainMutation();

    // Get parameters from navigation state and make poData mutable
    const { poData: initialPoData } = location.state || {};
    const [poData, setPoData] = useState(initialPoData || {});
    const [poreviewDetails, setPoreviewDetails] = useState([]);
    const [poMainStatus, setPoMainStatus] = useState(null);

    // State for price edit popup
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [newBuyingPrice, setNewBuyingPrice] = useState("");

    // State for quantity edit popup
    const [showQtyModal, setShowQtyModal] = useState(false);
    const [newQty, setNewQty] = useState("");

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                // Skip if poData.id is not available
                if (!poData.id || !poData.createdCompanyID || !poData.applicationUser || !poData.vendor?.Id) {
                    console.error("Missing required poData fields:", poData);
                    toast.error("Invalid purchase order data");
                    return;
                }

                const payload = {
                    locationId: poData.createdCompanyID,
                    ApplicationUserId: poData.applicationUser,
                    vendorId: poData.vendor.Id,
                    againstOrder: String(poData.againstOrder),
                    status: poData.status==="Approved" ? 2 : 1,
                    poMainId: poData.id,
                    poMain: poData.id,
                };

                // Fetch PO details
                let poDetailsResponse;
                if (poData.againstOrder === 1) {
                    poDetailsResponse = await getAllPoDetails(payload);
                    console.log("poDetailsResponse-----", poDetailsResponse);
                    setPoreviewDetails(poDetailsResponse.data || []);
                    setPoMainStatus(poDetailsResponse?.data[0]?.Status || null);
                } else if (poData.againstOrder === 0) {
                    poDetailsResponse = await getAllPoDetailsForNewOrder(payload);
                    console.log("poDetailsResponse-----", poDetailsResponse);
                    setPoreviewDetails(poDetailsResponse.data?.data || []);
                    setPoMainStatus(poDetailsResponse.data?.data[0]?.Status || null);
                }

                // Fetch PurchaseOrderMain data for calculation summary
                const poMainRes = await fetchPoMain({ poMainId: poData.id }).unwrap();
                console.log("poMainRes (initial load)", poMainRes);
                if (poMainRes.status === "success" && poMainRes.data && poMainRes.data[0]) {
                    const mainData = poMainRes.data[0];
                    setPoData((prev) => ({
                        ...prev,
                        vendor: prev.vendor || {}, // Preserve vendor object
                        totalQty: mainData.TotalQty || 0,
                        totalGrossValue: mainData.TotalBasicValue || 0,
                        totalGSTValue: mainData.TotalGSTValue || 0,
                        totalValue: mainData.TotalValue || 0,
                    }));
                } else {
                    console.error("Invalid poMainRes structure:", poMainRes);
                    toast.error("Failed to fetch purchase order summary");
                }
            } catch (error) {
                console.error("Error fetching PO details:", error);
                toast.error("Error loading purchase order data");
            }
        };

        fetchOrderDetails();
    }, [poData.id, poData.createdCompanyID, poData.applicationUser, poData.vendor?.Id, poData.againstOrder]);

    const approvePo = async () => {
        try {
            const response = await triggerApprovePo({ poMainId: poData.id }).unwrap();
            if (response.status == "success") {
                toast.success("PO Approved successfully");
                navigate("/purchase-order");
            }
        } catch (error) {
            console.error("Error approving PO:", error);
            toast.error("Error approving PO");
        }
    };

    const updateBuyingPrice = async () => {
        if (!newBuyingPrice || isNaN(newBuyingPrice) || newBuyingPrice <= 0) {
            toast.error("Please enter a valid buying price");
            return;
        }

        try {
            const payload = {
                poDetailId: selectedOrder.poDetailId,
                p_buyingPrice: parseFloat(newBuyingPrice),
            };
            const response = await triggerUpdatePrice(payload).unwrap();

            if (response.status === "success") {
                toast.success("Buying price updated successfully");
                setPoreviewDetails((prev) =>
                    prev.map((order) =>
                        order.poDetailId === selectedOrder.poDetailId
                            ? { ...order, poPrice: parseFloat(newBuyingPrice) }
                            : order
                    )
                );

                // Fetch updated poMain data
                const poMainRes = await fetchPoMain({ poMainId: poData.id }).unwrap();
                console.log("poMainRes (price update)", poMainRes);
                if (poMainRes.status === "success" && poMainRes.data && poMainRes.data[0]) {
                    const mainData = poMainRes.data[0];
                    setPoData((prev) => ({
                        ...prev,
                        vendor: prev.vendor,
                        totalQty: mainData.TotalQty || 0,
                        totalGrossValue: mainData.TotalBasicValue || 0,
                        totalGSTValue: mainData.TotalGSTValue || 0,
                        totalValue: mainData.TotalValue || 0,
                    }));
                } else {
                    toast.error("Failed to fetch updated PO data");
                }

                setShowPriceModal(false);
                setNewBuyingPrice("");
                setSelectedOrder(null);
            } else {
                toast.error(response.message || "Failed to update buying price");
            }
        } catch (error) {
            console.error("Error updating buying price:", error);
            toast.error("Error updating buying price");
        }
    };

    const updateQty = async () => {
        if (!newQty || isNaN(newQty) || newQty < 0) {
            toast.error("Please enter a valid quantity");
            return;
        }
        if (poData.againstOrder === 1 && selectedOrder.orderQty && Number(newQty) > Number(selectedOrder.orderQty)) {
            toast.error("PO Quantity cannot be greater than Order Quantity");
            return;
        }

        try {
            const payload = {
                poDetailId: selectedOrder.poDetailId,
                p_qty: Number(newQty),
            };
            const response = await triggerUpdateQty(payload).unwrap();

            if (response.status === "success") {
                toast.success("PO Quantity updated successfully");
                setPoreviewDetails((prev) =>
                    prev.map((order) =>
                        order.poDetailId === selectedOrder.poDetailId
                            ? { ...order, poQty: Number(newQty) }
                            : order
                    )
                );

                // Fetch updated poMain data
                const poMainRes = await fetchPoMain({ poMainId: poData.id }).unwrap();
                console.log("poMainRes (qty update)", poMainRes);
                if (poMainRes.status === "success" && poMainRes.data && poMainRes.data[0]) {
                    const mainData = poMainRes.data[0];
                    setPoData((prev) => ({
                        ...prev,
                        vendor: prev.vendor,
                        totalQty: mainData.TotalQty || 0,
                        totalGrossValue: mainData.TotalBasicValue || 0,
                        totalGSTValue: mainData.TotalGSTValue || 0,
                        totalValue: mainData.TotalValue || 0,
                    }));
                } else {
                    toast.error("Failed to fetch updated PO data");
                }

                setShowQtyModal(false);
                setNewQty("");
                setSelectedOrder(null);
            } else {
                toast.error(response.message || "Failed to update PO quantity");
            }
        } catch (error) {
            console.error("Error updating PO quantity:", error);
            toast.error("Error updating PO quantity");
        }
    };

    const renderProductDetails = (order) => {
        switch (order.productType) {
            case 0: // Optical Lens
                return (
                    <td className="px-6 py-4 whitespace-wrap min-w-72">
                        {order?.productDescName}
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
                                    {order?.specs?.powerDetails?.right?.axis && ` Axis: ${order?.specs?.powerDetails?.right?.axis}`}
                                    {order?.specs?.powerDetails?.right?.additional &&
                                        ` Add: ${order?.specs?.powerDetails?.right?.additional > 0
                                            ? `+${order?.specs?.powerDetails?.right?.additional}`
                                            : order?.specs?.powerDetails?.right?.additional}`}
                                </>
                            )}
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
                                    {order?.specs?.powerDetails?.left?.axis && ` Axis: ${order?.specs?.powerDetails?.left?.axis}`}
                                    {order?.specs?.powerDetails?.left?.additional &&
                                        ` Add: ${order?.specs?.powerDetails?.left?.additional > 0
                                            ? `+${order?.specs?.powerDetails?.left?.additional}`
                                            : order?.specs?.powerDetails?.left?.additional}`}
                                </>
                            )}
                        {order?.specs?.addOn?.addOnId && (
                            <>
                                <br />
                                <span className="font-medium">AddOn: {order?.specs?.addOn?.addOnName}</span>
                            </>
                        )}
                        {order?.specs?.tint?.tintCode && (
                            <>
                                <br />
                                <span className="font-medium">Tint: {order?.specs?.tint?.tintName}</span>
                            </>
                        )}
                        {order?.hSN && (
                            <>
                                <br />
                                <span className="font-medium">HSN: {order?.hSN}</span>
                            </>
                        )}
                    </td>
                );
            case 1: // Frame
                return (
                    <td className="px-6 py-4 whitespace-wrap">
                        {order?.productDescName}
                        <br />
                        {order?.size}-{order?.dBL}-{order?.templeLength}
                        <br />
                        {order?.category === 0 ? `Sunglass` : `OpticalFrame`}
                        <br />
                        {order?.barcode && `Barcode: ${order?.barcode}`}
                        <br />
                        {order?.hSN && `HSN: ${order?.hSN}`}
                    </td>
                );
            case 2: // Accessory
                return (
                    <td className="px-6 py-4 whitespace-wrap">
                        {order?.productDescName}
                        {order?.variationName && (
                            <>
                                <br />
                                Variation: {order?.variationName}
                            </>
                        )}
                        {order?.barcode && (
                            <>
                                <br />
                                Barcode: {order?.barcode}
                            </>
                        )}
                        {order?.hSN && (
                            <>
                                <br />
                                HSN: {order?.hSN}
                            </>
                        )}
                    </td>
                );
            case 3: // Contact Lens
                return (
                    <td className="px-6 py-4 whitespace-wrap">
                        {order?.productDescName}
                        <br />
                        {order?.sphericalPower &&
                            `Sph: ${order?.sphericalPower > 0 ? `+${order?.sphericalPower}` : order?.sphericalPower}`}
                        {order?.cylindricalPower &&
                            ` Cyld: ${order?.cylindricalPower > 0 ? `+${order?.cylindricalPower}` : order?.cylindricalPower}`}
                        {order?.axis && ` Axis: ${order?.axis}`}
                        {order?.additional &&
                            ` Add: ${order?.additional > 0 ? `+${order?.additional}` : order?.additional}`}
                        {order?.color && (
                            <>
                                <br />
                                Clr: {order?.color}
                            </>
                        )}
                        {order?.barcode && (
                            <>
                                <br />
                                Barcode: {order?.barcode}
                            </>
                        )}
                        {order?.hSN && (
                            <>
                                <br />
                                HSN: {order?.hSN}
                            </>
                        )}
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
            <div className="flex justify-between">
                <div className="items-center mb-4">
                    <button
                        className="text-[#000060] hover:text-[#0000a0] transition-colors flex items-center mb-3"
                        onClick={() => navigate("/purchase-order")}
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to dashboard
                    </button>
                    <h1 className="text-3xl lg:text-4xl font-bold text-[#000060] mb-2">Purchase Order</h1>
                </div>
                {console.log(poData?.vendor?.POApproval)}
                {console.log(poMainStatus)}
                {(poMainStatus === 1 && poData?.vendor?.POApproval === 1) && (
                    <HasPermission module="Purchase Order" action={["edit"]}>
                        <div>
                            <button
                                className="flex gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                                onClick={approvePo}
                            >
                                <CheckCircle />
                                Approve PO
                            </button>
                        </div>
                    </HasPermission>
                )}
            </div>
            {console.log("PODATA ----", poData)}
            <div key={poData.vendor?.Id || "vendor"} className="gap-12 my-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <p className="text-gray-700">
                        <span className="font-bold flex">Vendor Name</span>
                        <span>{poData.vendor?.VendorName || "N/A"}</span>
                    </p>
                    <p className="text-gray-700">
                        <span className="font-bold flex">Mobile Number</span>
                        <span>{poData.vendor?.MobNumber || "N/A"}</span>
                    </p>
                    <p className="text-gray-700">
                        <span className="font-bold flex">Address</span>
                        <span className="flex">{poData.vendor?.Address1 || ""} {poData.vendor?.Address2 || ""}</span>
                        <span>{poData.vendor?.City || "N/A"}</span>
                    </p>
                    <p className="text-gray-700">
                        <span className="font-bold flex">GST Number</span>
                        <span>{poData.vendor?.TAXNo || "N/A"}</span>
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
                                        {order.productType === 0 ? "OL" :
                                            order.productType === 1 ? "F/S" :
                                                order.productType === 2 ? "ACC" :
                                                    order.productType === 3 ? "CL" : "N/A"}
                                    </td>
                                    {renderProductDetails(order)}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {order.poPrice ?? order?.priceMaster?.buyingPrice}
                                        {poMainStatus === 1 && (
                                            <HasPermission module="Purchase Order" action={["edit"]}>
                                                <button
                                                    className="ml-2"
                                                    style={{ color: "#2563EB" }}
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setNewBuyingPrice(order.poPrice ?? order?.priceMaster?.buyingPrice);
                                                        setShowPriceModal(true);
                                                    }}
                                                >
                                                    <PenIcon style={{ width: "16px", height: "16px" }} />
                                                </button>
                                            </HasPermission>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{order?.orderQty}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {order.poQty ?? (order.orderQty - order.billedQty - order.cancelledQty)}
                                        {poMainStatus === 1 && (
                                            <HasPermission module="Purchase Order" action={["edit"]}>
                                                <button
                                                    className="ml-2"
                                                    style={{ color: "#2563EB" }}
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setNewQty(order.poQty ?? (order.orderQty - order.billedQty - order.cancelledQty));
                                                        setShowQtyModal(true);
                                                    }}
                                                >
                                                    <PenIcon style={{ width: "16px", height: "16px" }} />
                                                </button>
                                            </HasPermission>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {order.productType === 3
                                            ? (order?.stock?.reduce((total, item) => total + item.quantity, 0) || 0)
                                            : (order?.pricing?.quantity || 0)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {(() => {
                                            const bothLens = order?.specs?.powerDetails?.bothLens === 1;
                                            const quantity = order.poQty ?? (order.orderQty - order.billedQty - order.cancelledQty);
                                            const price = parseFloat(order.poPrice ?? order?.priceMaster?.buyingPrice) || 0;
                                            const taxPercentage = parseFloat(order.taxPercentage) / 100 || 0;

                                            const tintBuying = parseFloat(order?.specs?.tint?.tintBuyingPrice || 0) || 0;
                                            const addonBuying = Array.isArray(order?.specs?.addOn)
                                                ? order.specs.addOn.reduce(
                                                    (sum, add) => sum + (parseFloat(add?.addOnBuyingPrice || 0) || 0),
                                                    0
                                                )
                                                : parseFloat(order?.specs?.addOn?.addOnBuyingPrice || 0) || 0;

                                            let total;
                                            if (bothLens) {
                                                total = (price * quantity) + tintBuying + addonBuying;
                                            } else {
                                                total = (price * quantity) + tintBuying / 2 + addonBuying / 2;
                                            }

                                            return (total + total * taxPercentage).toFixed(2);
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
                                        {order?.ProductDetails?.ProductType === 0 ? "OL" :
                                            order?.ProductDetails?.ProductType === 1 ? "F/S" :
                                                order?.ProductDetails?.ProductType === 2 ? "ACC" :
                                                    order?.ProductDetails?.ProductType === 3 ? "CL" : "N/A"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {order?.ProductDetails?.ProductType === 0 ? "" : order?.ProductDetails?.barcode}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {order?.ProductDetails?.ProductType === 0 ? (
                                            <td className="px-6 py-4 whitespace-wrap min-w-72">
                                                {order?.ProductDetails?.productName}
                                                <br />
                                                {order?.ProductDetails?.Specs?.Spherical ? `Sph: ${order?.ProductDetails?.Specs?.Spherical} ` : `Sph: `}
                                                {order?.ProductDetails?.Specs?.Cylinder ? `Cyl: ${order?.ProductDetails?.Specs?.Cylinder} ` : `Cyl: `}
                                                {order?.ProductDetails?.Specs?.Diameter ? `Dia: ${order?.ProductDetails?.Specs?.Diameter} ` : `Dia: `}
                                                <br />
                                                {order?.ProductDetails?.HSN && `HSN: ${order?.ProductDetails?.HSN}`}
                                            </td>
                                        ) : order?.ProductDetails?.ProductType === 1 ? (
                                            <td className="px-6 py-4 whitespace-wrap">
                                                {order?.ProductDetails?.productName}
                                                <br />
                                                Size: {order?.ProductDetails?.Size?.Size}
                                                <br />
                                                {order?.ProductDetails?.ProductType === 0 ? `Category: Sunglass` : `Category: OpticalFrame`}
                                                <br />
                                                {order?.ProductDetails?.HSN && `HSN: ${order?.ProductDetails?.HSN}`}
                                            </td>
                                        ) : order?.ProductDetails?.ProductType === 2 ? (
                                            <td className="px-6 py-4 whitespace-wrap">
                                                {order?.ProductDetails?.productName}
                                                {order?.ProductDetails?.Variation?.Variation && (
                                                    <>
                                                        <br />
                                                        Variation: {order?.ProductDetails?.Variation?.Variation}
                                                    </>
                                                )}
                                                <br />
                                                {order?.ProductDetails?.HSN && `HSN: ${order?.ProductDetails?.HSN}`}
                                            </td>
                                        ) : order?.ProductDetails?.ProductType === 3 ? (
                                            <td className="px-6 py-4 whitespace-wrap">
                                                {order?.ProductDetails?.productName}
                                                <br />
                                                {order?.ProductDetails?.PowerSpecs?.Sph ? `Sph: ${order?.ProductDetails?.PowerSpecs?.Sph} ` : `Sph: `}
                                                {order?.ProductDetails?.PowerSpecs?.Cyl ? `Cyl: ${order?.ProductDetails?.PowerSpecs?.Cyl} ` : `Cyl: `}
                                                {order?.ProductDetails?.PowerSpecs?.Axis ? `Axis: ${order?.ProductDetails?.PowerSpecs?.Axis} ` : `Axis: `}
                                                {order?.ProductDetails?.PowerSpecs?.Add ? `Add: ${order?.ProductDetails?.PowerSpecs?.Add} ` : `Add: `}
                                                <br />
                                                {order?.ProductDetails?.HSN && `HSN: ${order?.ProductDetails?.HSN}`}
                                            </td>
                                        ) : (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {order?.ProductDetails?.productName}
                                                <br />
                                                {order?.ProductDetails?.hsncode ? `HSN: ${order?.ProductDetails?.hsncode}` : null}
                                            </td>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {order.poPrice ?? order?.ProductDetails?.price?.BuyingPrice}
                                        {poMainStatus === 1 && (
                                            <HasPermission module="Purchase Order" action={["edit"]}>
                                                <button
                                                    className="ml-2"
                                                    style={{ color: "#2563EB" }}
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setNewBuyingPrice(order.poPrice ?? order?.ProductDetails?.price?.BuyingPrice);
                                                        setShowPriceModal(true);
                                                    }}
                                                >
                                                    <PenIcon style={{ width: "16px", height: "16px" }} />
                                                </button>
                                            </HasPermission>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {order.poQty ?? order?.POQty}
                                        {poMainStatus === 1 && (
                                            <HasPermission module="Purchase Order" action={["edit"]}>
                                                <button
                                                    className="ml-2"
                                                    style={{ color: "#2563EB" }}
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setNewQty(order.poQty ?? order?.POQty);
                                                        setShowQtyModal(true);
                                                    }}
                                                >
                                                    <PenIcon style={{ width: "16px", height: "16px" }} />
                                                </button>
                                            </HasPermission>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {order?.ProductDetails?.ProductType === 3
                                            ? order?.ProductDetails?.Stock.reduce((total, item) => total + item.Quantity, 0)
                                            : order?.ProductDetails?.Stock?.Quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {(((order?.poPrice ?? order?.ProductDetails?.price?.BuyingPrice) * (order.poQty ?? order?.POQty)) +
                                            ((order?.poPrice ?? order?.ProductDetails?.price?.BuyingPrice) *
                                                (order.poQty ?? order?.POQty) *
                                                (order?.taxPercent / 100 || 0))).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : null}
            </div>

            {showPriceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-[#000060]">Edit Buying Price</h2>
                            <button
                                onClick={() => {
                                    setShowPriceModal(false);
                                    setNewBuyingPrice("");
                                    setSelectedOrder(null);
                                }}
                            >
                                <X className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-2">New Buying Price</label>
                            <input
                                type="number"
                                value={newBuyingPrice}
                                onChange={(e) => setNewBuyingPrice(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                                placeholder="Enter new buying price"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="flex justify-end gap-4">
                            <button
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                                onClick={() => {
                                    setShowPriceModal(false);
                                    setNewBuyingPrice("");
                                    setSelectedOrder(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                                onClick={updateBuyingPrice}
                            >
                                Update Price
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showQtyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-[#000060]">Edit PO Quantity</h2>
                            <button
                                onClick={() => {
                                    setShowQtyModal(false);
                                    setNewQty("");
                                    setSelectedOrder(null);
                                }}
                            >
                                <X className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-2">New PO Quantity</label>
                            <input
                                type="number"
                                value={newQty}
                                onChange={(e) => setNewQty(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                                placeholder="Enter new PO quantity"
                                min="0"
                                step="1"
                            />
                            {poData.againstOrder === 1 && selectedOrder.orderQty && (
                                <p className="text-sm text-gray-600 mt-2">Maximum allowed: {selectedOrder.orderQty}</p>
                            )}
                        </div>
                        <div className="flex justify-end gap-4">
                            <button
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                                onClick={() => {
                                    setShowQtyModal(false);
                                    setNewQty("");
                                    setSelectedOrder(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                                onClick={updateQty}
                            >
                                Update Quantity
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex mt-10 justify-between px-5 rounded-2xl shadow p-8">
                <div className="flex justify-between gap-4">
                    <span className="text-gray-600 font-bold text-lg">Total Quantity:</span>
                    <span className="font-bold text-lg">{Number(poData.totalQty) || 0}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-gray-600 font-bold text-lg">Total Gross Value:</span>
                    <span className="font-bold text-lg">₹ {Number(poData.totalGrossValue).toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-gray-600 font-bold text-lg">Total GST:</span>
                    <span className="font-bold text-lg">₹ {Number(poData.totalGSTValue).toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-gray-600 font-bold text-lg">Total Net Value:</span>
                    <span className="font-bold text-lg">₹ {Number(poData.totalValue).toFixed(2) || "0.00"}</span>
                </div>
            </div>
        </motion.div>
    );
}