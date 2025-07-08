export const constructCreatePayload = (formData, variationsList) => {
  const getStockPayload = (variation) => {
    const stock = {
      OPBatchCode: "1", // Default or can be dynamic if required
      OPMRP: variation.OPMRP || 0,
      location: [],
    };

    variation.pricingData.forEach((price, index) => {
      const i = index + 1;
      stock[`BuyingPrice${i}`] = price.buyingPrice;
      stock[`SellingPrice${i}`] = price.sellingPrice;
      stock[`AvgPrice${i}`] = price.buyingPrice; // Always equal to BuyingPrice
      stock[`Quantity${i}`] = 0;
      stock[`DefectiveQty${i}`] = 0;
      stock.location.push(price.id);
    });

    return stock;
  };

  const details = variationsList.map((variation, idx) => ({
    SKUCode: variation.SKUCode,
    Barcode: variation.Barcode,
    OPVariationID: variation.OPVariationID || idx + 1,
    Stock: getStockPayload(variation),
  }));

  return {
    ProductCode: formData.ProductCode,
    ProductName: formData.ProductName,
    HSN: formData.HSN,
    BrandID: formData.BrandID,
    TaxID: formData.TaxID,
    Details: details,
  };
};
