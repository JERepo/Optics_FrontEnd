


export function calculateTotalQuantity(poreviewDetails, formStateShiptoAddress) {
    const totalQty = formStateShiptoAddress === "against"
        ? poreviewDetails.reduce((total, order) => total + (order.poQty ?? order.orderQty - order.billedQty - order.cancelledQty), 0)
        : poreviewDetails.reduce((total, order) => total + (order.poQty ?? order.POQty), 0);


    return totalQty;
}

export function calculateTotalGrossValue(poreviewDetails, formStateShiptoAddress) {
    const totalGrossValue = formStateShiptoAddress === "against"
        ? poreviewDetails
            .reduce((total, order) => {
                const quantity = order.poQty ?? order.orderQty - order.billedQty - order.cancelledQty;
                const price = order.productType === 3
                    ? parseFloat(order.poPrice ?? order?.priceMaster?.buyingPrice) || 0
                    : parseFloat(order.poPrice ?? order?.pricing?.buyingPrice) || 0;

                console.log("Price ----- ", price);

                let addOn = order.productType === 0
                    ? (Array.isArray(order?.specs?.addOn)
                        ? order.specs.addOn.reduce(
                            (sum, add) => sum + (parseFloat(add?.addOnBuyingPrice || 0) || 0),
                            0
                        )
                        : parseFloat(order?.specs?.addOn?.addOnBuyingPrice || 0) || 0) : 0;



                let tint = order.productType === 0
                    ? parseFloat(order?.specs?.tint?.tintBuyingPrice || 0) : 0;




                if (order?.specs?.powerDetails?.bothLens === 0) {
                    addOn = addOn / 2;
                    tint = tint / 2;
                }

                console.log("Add ON ----- ", addOn);
                console.log("tint ----- ", tint);

                // Ensure both price and quantity are valid numbers
                if (price && !isNaN(price) && !isNaN(quantity)) {
                    return total + ((addOn || 0) + (tint || 0) + (price * quantity));
                }
                return total;
            }, 0)
            ?.toFixed?.(2) ?? '0.00'

        : poreviewDetails
            .reduce((total, order) => {
                const quantity = order.poQty ?? order.POQty;
                const price = order?.ProductDetails?.ProductType === 3
                    ? parseFloat(order.poPrice ?? order?.ProductDetails?.price?.BuyingPrice) || 0
                    : parseFloat(order.poPrice ?? order?.ProductDetails?.Stock?.BuyingPrice) || 0;

                let addOn = order.productType === 0
                    ? (Array.isArray(order?.specs?.addOn)
                        ? order?.specs?.addOn.reduce(
                            (sum, add) => sum + (parseFloat(add?.addOnBuyingPrice || 0) || 0),
                            0
                        )
                        : parseFloat(order?.specs?.addOn?.addOnBuyingPrice || 0) || 0) : 0;

                let tint = order.productType === 0
                    ? parseFloat(order?.specs?.tint?.tintBuyingPrice || 0) : 0;


                if (order?.specs?.powerDetails?.bothLens === 0) {
                    addOn = addOn / 2;
                    tint = tint / 2;
                }

                console.log("Add ON ----- ", addOn);
                console.log("tint ----- ", tint);

                // Ensure both price and quantity are valid numbers
                if (price && !isNaN(price) && !isNaN(quantity)) {
                    return total + ((price + (addOn || 0) + (tint || 0)) * quantity);
                }
                return total;

            }, 0)
            ?.toFixed?.(2) ?? '0.00';


    return totalGrossValue;
}



export function calculateTotalGST(poreviewDetails, formStateShiptoAddress) {
    const totalGST = formStateShiptoAddress === "against"
        ? poreviewDetails
            .reduce((total, order) => {
                const quantity = order.poQty ?? order.orderQty - order.billedQty - order.cancelledQty;
                const price = order.productType === 3
                    ? parseFloat(order.poPrice ?? order?.priceMaster?.buyingPrice) || 0
                    : parseFloat(order.poPrice ?? order?.pricing?.buyingPrice) || 0;

                let addOn = order.productType === 0
                    ? (Array.isArray(order?.specs?.addOn)
                        ? order.specs.addOn.reduce(
                            (sum, add) => sum + (parseFloat(add?.addOnBuyingPrice || 0) || 0),
                            0
                        )
                        : parseFloat(order?.specs?.addOn?.addOnBuyingPrice || 0) || 0) : 0;

                let tint = order.productType === 0
                    ? parseFloat(order?.specs?.tint?.tintBuyingPrice || 0) : 0;

                if (order?.specs?.powerDetails?.bothLens === 0) {
                    addOn = addOn / 2;
                    tint = tint / 2;
                }

                const taxPercentage = parseFloat((order?.taxPercentage) / 100) || 1;
                console.log("Tax ------- ", taxPercentage);

                if (price && !isNaN(price) && !isNaN(quantity)) {
                    return total + (((price * quantity) + (tint || 0) + (addOn || 0)) * taxPercentage);
                }
                return total;
            }, 0)
            ?.toFixed?.(2) ?? '0.00'

        : poreviewDetails
            .reduce((total, order) => {
                const quantity = order.poQty ?? order.POQty;
                const price = order?.ProductDetails?.ProductType === 3
                    ? parseFloat(order.poPrice ?? order?.ProductDetails?.price?.BuyingPrice) || 0
                    : parseFloat(order.poPrice ?? order?.ProductDetails?.Stock?.BuyingPrice) || 0;

                const taxPercentage = order?.ProductDetails?.ProductType === 0
                    ? parseFloat(order?.taxPercent / 100) || 0
                    : parseFloat(order?.ProductDetails?.GSTPercentage / 100) || 0;


                if (price && !isNaN(price) && !isNaN(quantity)) {
                    return total + (price * quantity * (taxPercentage || 1));
                }
                return total;
            }, 0)
            ?.toFixed?.(2) ?? '0.00'


    return totalGST;
}


export function calculateTotalNetValue(poreviewDetails, formStateShiptoAddress) {
    const totalNetValue = formStateShiptoAddress === "against"
        ? poreviewDetails.reduce((total, order) => {
            const quantity = order.poQty ?? (order.orderQty - order.billedQty - order.cancelledQty);
            if (order.productType === 0) { // Optical Lens
                const bothLens = order?.specs?.powerDetails?.bothLens === 1;
                const buyingPrice = parseFloat(order?.pricing?.buyingPrice || 0);

                // Tint buying price
                const tintBuying = parseFloat(order?.specs?.tint?.tintBuyingPrice || 0) || 0;

                // Sum of addon buying prices
                const addonBuying = Array.isArray(order?.specs?.addOn)
                    ? order.specs.addOn.reduce(
                        (sum, add) => sum + (parseFloat(add?.addOnBuyingPrice || 0) || 0),
                        0
                    )
                    : parseFloat(order?.specs?.addOn?.addOnBuyingPrice || 0) || 0;

                // Calculate base
                let subtotal;
                if (bothLens) {
                    subtotal = buyingPrice * quantity + (tintBuying || 0) + (addonBuying || 0);
                } else {
                    subtotal = buyingPrice * quantity + ((tintBuying / 2) || 0) + ((addonBuying / 2) || 0);
                }

                console.log("subtotal ----------- ", subtotal);

                const taxPercentage = parseFloat((order.taxPercentage) / 100) || 1;

                // Add tax
                return total + (subtotal + subtotal * (taxPercentage || 0));
            } else if ((order.productType === 3)) {
                const price = parseFloat(order.poPrice ?? order?.priceMaster?.buyingPrice) || 0
                const tax = parseFloat(order?.taxPercentage / 100) || 1

                return total + ((price * quantity) + (price * quantity * tax))

            } else {
                const price = parseFloat(order.pricing?.buyingPrice) || 0;
                const tax = parseFloat(order?.taxPercentage / 100) || 1;
                return total + (price * quantity) + (price * quantity * tax);
            }
        }, 0)

        : poreviewDetails
            .reduce((total, order) => {
                const quantity = order.poQty ?? order.POQty;

                console.log("quantity ---------- kabdba", quantity);
                const price = order?.ProductDetails?.ProductType === 3
                    ? parseFloat(order.poPrice ?? order?.ProductDetails?.price?.BuyingPrice) || 0
                    : parseFloat(order.poPrice ?? order?.ProductDetails?.Stock?.BuyingPrice) || 0;

                const taxPercentage = order?.ProductDetails?.ProductType === 0
                    ? parseFloat(order?.taxPercent / 100) || 0
                    : parseFloat(order?.ProductDetails?.GSTPercentage / 100) || 0;

                if (price && !isNaN(price) && !isNaN(quantity)) {
                    return total + ((price * quantity) + (price * quantity * taxPercentage));
                }
                return total;
            }, 0)
            ?.toFixed?.(2) ?? '0.00'

    return totalNetValue;
}


export function calculateTotalAmount(order) {
    const totalAmount =
        order.productType == 0 ? (
            // Optical Lens calculation
            (() => {
                const bothLens = order?.specs?.powerDetails?.bothLens === 1;
                const buyingPrice = parseFloat(order?.pricing?.buyingPrice || 0);
                // Use poQty instead of orderQty for calculation
                const poQty = parseInt(order.poQty || (order.orderQty - order.billedQty - order.cancelledQty), 10);

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
                    total = (buyingPrice * poQty) + tintBuying + addonBuying;
                } else {
                    total = (buyingPrice * poQty) + tintBuying / 2 + addonBuying / 2;
                }

                // Add tax
                const totalWithTax =
                    total + total * (parseFloat(order?.taxPercentage ?? order?.taxPercent) / 100 || 0);

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
        );

    return totalAmount;
}