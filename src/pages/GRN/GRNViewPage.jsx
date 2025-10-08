import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ArrowLeft, PenIcon, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetAllPoDetailsForNewOrderMutation, useGetAllPoDetailsMutation } from "../../api/purchaseOrderApi";
import { useGetGRNDetailsMutation } from "../../api/grnApi";
import { Table, TableRow, TableCell } from "../../components/Table";



export function GRNViewPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, hasMultipleLocations } = useSelector((state) => state.auth);

    const [getAllPoDetails] = useGetAllPoDetailsMutation();
    const [getAllPoDetailsForNewOrder] = useGetAllPoDetailsForNewOrderMutation();
    const [getGRNDetails, {
        isLoading: isLoadingGRNDetails,
        error: errorGRNDetails
    }] = useGetGRNDetailsMutation();



    // Get parameters from navigation state
    const {
        grnData
    } = location.state || {};

    console.log("Get data ---------- ",
        grnData);

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
    const [grnViewDetails, setGrnViewDetails] = useState([]);


    useEffect(() => {
        const fetchGRNDetails = async () => {
            const payload = {
                companyId: grnData?.CompanyID,
                grnMain: grnData?.id,
                // againstPo: String(grnData?.AgainstPO),
                // applicationUserId: grnData?.applicationUser,
                status: 1
            }

            try {

                console.log("fetchGRNDetails payload -------------- ", payload);
                const response = await getGRNDetails(payload);

                if (response?.data) {
                    console.log("getAllGRNDetails response -------------- ", response?.data);

                    setGrnViewDetails(response?.data?.data || []);
                    // updateStep1Data({
                    //     GrnMainId: response?.data?.data[0]?.GRNMainId || null,
                    // });
                }
            } catch (error) {
                console.error("Error fetching GRN details:", error);
                toast.error("Failed to fetch GRN details. Please try again.");
            }
        }

        fetchGRNDetails();
    }, [grnData]);

    console.log("poreviewDetails --------------------- ", poreviewDetails);


    const calculateTotalAmount = () => {
        if (grnData.againstOrder === 1) {
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
                    onClick={() => { navigate('/grn') }}
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to dashboard
                </button>
                <h1 className="text-3xl lg:text-4xl font-bold text-[#000060] mb-2">
                    GRN Order View
                </h1>

            </div>

            <div key={grnData.vendor.Id} className=" gap-12 my-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <p className="text-gray-700 ">
                        <span className="font-bold flex">Vendor Name </span>
                        <span>{grnData.vendor.VendorName}</span>
                    </p>
                    <p className="text-gray-700">
                        <span className="font-bold flex">Mobile Number</span>
                        <span>{grnData.vendor.MobNumber}</span>
                    </p>
                    <p className="text-gray-700">
                        <span className="font-bold flex">Address</span>
                        <span className="flex">{grnData.vendor.Address1} {grnData.vendor.Address2}</span>
                        <span>{grnData.vendor.City}</span>
                    </p>
                    <p className="text-gray-700">
                        <span className="font-bold flex">GST Number</span>
                        <span className="">{grnData.vendor.TAXNo}</span>
                    </p>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">GRN Items</h3>
                <Table
                    columns={["Sl No.", <>PO No.<br />(Order No.)</>, "Supplier Order No.", "Type", "Product Name", "MRP", "GST", "QTY", "Buying Price", "Total Amount"]}
                    data={grnViewDetails}
                    renderRow={(item, index) => (
                        <TableRow key={item.Barcode || index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{item.PONo || ''}<br />{item.OrderNo || ''}</TableCell>
                            <TableCell>{item.VendorOrderNo}</TableCell>
                            {/* <TableCell>{item.OrderNo || null}</TableCell> */}
                            <TableCell>{item?.ProductDetails?.ProductType == 0 && `OL` || item?.ProductDetails?.ProductType == 1 && `F/S` || item?.ProductDetails?.ProductType == 2 && `ACC` || item?.ProductDetails?.ProductType == 3 && `CL`}</TableCell>
                            {/* <TableCell>{item?.ProductDetails?.barcode}</TableCell> */}
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
                            {item?.ProductDetails?.ProductType === 1 ? (
                                <TableCell>₹ {item?.ProductDetails?.Stock?.MRP}</TableCell>
                            ) : item?.ProductDetails?.ProductType === 2 ? (
                                <TableCell>₹ {item?.ProductDetails?.Stock?.OPMRP}</TableCell>
                            ) : item?.ProductDetails?.ProductType === 3 ? (
                                <TableCell>₹ {item?.ProductDetails?.Stock?.find(stock => stock.BatchCode === item.BatchCode)?.MRP || (item?.ProductDetails?.price?.MRP || item?.ProductDetails?.Stock?.MRP || item?.ProductDetails?.Stock?.OPMRP || null)}</TableCell>
                            ) : <TableCell></TableCell>}
                            {/* <TableCell>₹ {item?.ProductDetails?.price?.MRP || item?.ProductDetails?.Stock?.MRP || item?.ProductDetails?.Stock?.OPMRP || null}</TableCell> */}
                            <TableCell>₹{" "} {parseFloat(parseInt(item?.GRNPrice) * (parseInt(item?.ProductDetails?.GSTPercentage || item?.TaxPercent) / 100)).toFixed(2)}<br />{`(${item?.ProductDetails?.GSTPercentage || item?.TaxPercent}%)`}</TableCell>
                            <TableCell>{item.GRNQty}</TableCell>
                            <TableCell>{(grnViewDetails[0]?.GRNType === 1 && grnViewDetails[0]?.DCGRNPrice === 1) ? '' : `₹ ${item.GRNPrice}`}</TableCell>
                            {/* <TableCell>₹{" "}{parseFloat(parseInt(item?.GRNPrice * item?.GRNQty) * (parseInt(item?.TaxPercent) / 100)) + parseInt(item?.GRNPrice * item?.GRNQty)} </TableCell>*/}
                            <TableCell>{(grnViewDetails[0]?.GRNType === 1 && grnViewDetails[0]?.DCGRNPrice === 1) ? '' : `₹ ${(parseFloat(parseFloat(item?.GRNPrice * item?.GRNQty) * (parseFloat(item?.TaxPercent) / 100)) + parseFloat(item?.GRNPrice * item?.GRNQty) + parseFloat(item?.FittingPrice || 0) + ((parseFloat(item?.FittingPrice) * (parseFloat(item?.FittingGSTPercentage) / 100)) || 0)).toFixed(2)}`}</TableCell>

                        </TableRow>
                    )}
                />
            </div>

            {/* Calculation Summary Section */}
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
                        {
                            (grnViewDetails[0]?.GRNType === 1 && grnViewDetails[0]?.DCGRNPrice === 1) ? '' :

                                `₹ ${grnViewDetails
                                    .reduce((total, order) => {
                                        const quantity = order.GRNQty;
                                        const price = parseFloat(order.GRNPrice) || 0;

                                        if (price && !isNaN(price) && !isNaN(quantity)) {
                                            return total + (price * quantity) + parseFloat(order?.FittingPrice || 0);
                                        }
                                        return total;
                                    }, 0)
                                    ?.toFixed?.(2) ?? '0.00'
                                }`
                        }
                    </span>
                </div>

                <div className="flex justify-between gap-4">
                    <span className="text-gray-600 font-bold text-lg">Total GST :</span>
                    <span className="font-bold text-lg">
                        {
                            (grnViewDetails[0]?.GRNType === 1 && grnViewDetails[0]?.DCGRNPrice === 1) ? '' :

                                `₹ ${grnViewDetails
                                    .reduce((total, order) => {
                                        const quantity = order.GRNQty;
                                        const price = parseFloat(order.GRNPrice + order.FittingPrice) || 0;
                                        const taxPercentage = parseFloat((order?.TaxPercent || order?.ProductDetails?.GSTPercentage) / 100) || 0;
                                        if (price && !isNaN(price) && !isNaN(quantity)) {
                                            return total + (price * quantity * taxPercentage) + parseFloat(order?.FittingGSTPercentage || 0);
                                        }
                                        return total;
                                    }, 0)
                                    ?.toFixed?.(2) ?? '0.00'}`
                        }
                    </span>
                </div>

                <div className="flex justify-between gap-4">
                    <span className="text-gray-600 font-bold text-lg">Total Net Value :</span>
                    <span className="font-bold text-lg">
                        {
                            (grnViewDetails[0]?.GRNType === 1 && grnViewDetails[0]?.DCGRNPrice === 1) ? '' :

                                `₹ ${grnViewDetails
                                    .reduce((total, item) => {
                                        const quantity = item.GRNQty || 0;
                                        const price = (item.GRNPrice) || 0;
                                        const gstPercentage = parseFloat(item?.TaxPercent || item?.ProductDetails?.GSTPercentage) || 0;

                                        if (price && !isNaN(price) && !isNaN(quantity)) {
                                            const subtotal = price * quantity;
                                            const gstAmount = subtotal * (gstPercentage / 100);
                                            return total + subtotal + gstAmount + parseFloat(item?.FittingPrice || 0) + ((parseFloat(item?.FittingPrice || 0) * (parseFloat(item?.FittingGSTPercentage || 0) / 100)) || 0);
                                        }
                                        return total;
                                    }, 0)
                                    ?.toFixed?.(2) ?? '0.00'}`
                        }
                    </span>
                </div>
            </div>
        </motion.div>
    );
}