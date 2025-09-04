

export function PurchaseOrderVendorSection({ vendors, selectedVendor }) {
    return (
        // <div className="flex justify-start gap-12 mb-6">
        <>
            {vendors
                .filter(vendor => vendor.Id === parseInt(selectedVendor))
                .map((vendor) => (
                    <div key={vendor.Id} className=" gap-12 my-10">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <p className="text-gray-700 ">
                                <span className="font-bold flex">Vendor Name </span>
                                <span>{vendor.VendorName}</span>
                            </p>
                            <p className="text-gray-700">
                                <span className="font-bold flex">Mobile Number</span>
                                <span>{vendor.MobNumber}</span>
                            </p>
                            <p className="text-gray-700">
                                <span className="font-bold flex">Address</span>
                                <span className="flex">{vendor.Address1} {vendor.Address2}</span>
                                <span>{vendor.City}</span>
                            </p>
                            <p className="text-gray-700">
                                <span className="font-bold flex">GST Number</span>
                                <span className="">{vendor.TAXNo}</span>
                            </p>
                        </div>
                    </div>
                ))}

        </>
        // </div>
    )
}


export function POAgainstOrderTableComponent({ filteredOrderDetails, formState, selectedOrders, handleOrderSelection, selectAll, handleSelectAll }) {

    return (
        <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-blue-50"> {/* bg-blue-50 */}
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase flex justify-center space-x-3">
                        <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-neutral-600 font-semibold">Bill</span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">SL No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Order No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Product Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Buying Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Order Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">PO Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Avl Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Total Amount</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
                {filteredOrderDetails.length > 0 ? (
                    filteredOrderDetails.map((order, index) => (
                        <tr key={order.orderDetailId} className={selectedOrders.includes(order.orderDetailId) ? "bg-neutral-50" : ""}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={selectedOrders.includes(order.orderDetailId)}
                                    onChange={() => handleOrderSelection(order.orderDetailId)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{order.orderPrefix}/{order.orderNo}/{order.slNo}</td>
                            {formState.selectedOption === 'Lens' &&
                                <td className="px-6 py-4 whitespace-wrap">{order?.productDescName}
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
                            {formState.selectedOption === 'Frame/Sunglass' &&
                                <td className="px-6 py-4 whitespace-wrap">{order?.productDescName}
                                    <br></br>Size: {order?.size}-{order?.dBL}-{order?.templeLength}
                                    <br></br>{order?.category === 0 ? `Category: Sunglass` : `Category: OpticalFrame`}
                                    <br></br>{order?.barcode && `Barcode: ` + order?.barcode}
                                    <br></br>{order?.hSN && `HSN: ` + order?.hSN}
                                </td>
                            }
                            {formState.selectedOption === 'Accessories' &&
                                <td className="px-6 py-4 whitespace-wrap">{order?.productDescName}
                                    {order?.variationName && (<><br />Variation: {order?.variationName}</>)}
                                    {order?.barcode && (<><br />Barcode: {order?.barcode}</>)}
                                    {order?.hSN && (<><br />HSN: {order?.hSN}</>)}
                                </td>
                            }
                            {formState.selectedOption === 'Contact Lens' &&
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
                                <td className="px-6 py-4 whitespace-nowrap">{order.poPrice ?? order?.priceMaster?.buyingPrice}</td>
                                :
                                <td className="px-6 py-4 whitespace-nowrap">{order.poPrice ?? order?.pricing?.buyingPrice}</td>

                            }
                            <td className="px-6 py-4 whitespace-nowrap text-center">{order?.orderQty}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">{order.poQty ?? order?.orderQty - order?.billedQty - order?.cancelledQty}</td>
                            {order.productType == 3 ?
                                // logic for sum of quantities in stock
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {order?.stock.reduce((total, item) => total + item.quantity, 0)}
                                </td>
                                :
                                <td className="px-6 py-4 whitespace-nowrap text-center">{order?.pricing?.quantity}</td>
                            }
                            {/* <td className="px-6 py-4 whitespace-nowrap">{((order?.pricing?.buyingPrice * order?.orderQty) + (order?.pricing?.buyingPrice * order?.orderQty * (order?.taxPercentage / 100))).toFixed(2)}</td> */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                {order.productType == 0 ? (
                                    // Optical Lens calculation
                                    (() => {
                                        const bothLens = order?.specs?.powerDetails?.bothLens === 1;
                                        const buyingPrice = parseFloat(order?.pricing?.buyingPrice || 0);
                                        const orderQty = parseInt(order?.orderQty || 0, 10);

                                        // Tint buying price
                                        const tintBuying =
                                            parseFloat(order?.specs?.tint?.tintBuyingPrice || 0) || 0;

                                        // Sum of addon buying prices
                                        const addonBuying = Array.isArray(order?.specs?.addOn)
                                            ? order.specs.addOn.reduce(
                                                (sum, add) => sum + (parseFloat(add?.addOnBuyingPrice || 0) || 0),
                                                0
                                            )
                                            : parseFloat(order?.specs?.addOn?.addOnBuyingPrice || 0) || 0;

                                        // Calculate base
                                        let total;
                                        if (bothLens) {
                                            total = buyingPrice * orderQty + tintBuying + addonBuying;
                                        } else {
                                            total =
                                                buyingPrice * orderQty + tintBuying / 2 + addonBuying / 2;
                                        }

                                        // Add tax
                                        const totalWithTax =
                                            total + total * (parseFloat(order?.taxPercentage) / 100 || 0);

                                        return totalWithTax.toFixed(2);
                                    })()
                                ) : order.productType === 3 ? (
                                    (
                                        (order?.priceMaster?.buyingPrice * (order.poQty ?? order.orderQty - order.billedQty - order.cancelledQty)) +
                                        (order?.priceMaster?.buyingPrice *
                                            (order.poQty ?? order.orderQty - order.billedQty - order.cancelledQty) *
                                            (order?.taxPercentage / 100))
                                    ).toFixed(2)
                                ) : (
                                    // Default calculation
                                    (
                                        (order?.pricing?.buyingPrice * (order.poQty ?? order.orderQty - order.billedQty - order.cancelledQty)) +
                                        (order?.pricing?.buyingPrice *
                                            (order.poQty ?? order.orderQty - order.billedQty - order.cancelledQty) *
                                            (order?.taxPercentage / 100))
                                    ).toFixed(2)
                                )}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                            No orders found
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    )
}