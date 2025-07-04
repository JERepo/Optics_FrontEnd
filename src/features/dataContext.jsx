import { createContext, useContext, useState, useMemo } from "react";
import { useGetAllLocationsQuery } from "../api/roleManagementApi";

const FormContext = createContext();

export const useFormData = () => useContext(FormContext);

export const FormProvider = ({ children }) => {
  const { data: allLocations } = useGetAllLocationsQuery();
  const [formData, setFormData] = useState({
    BrandID: "",
    ProductName: "",
    ProductCode: "",
    HSN: "",
    TaxID: "",
  });

  const [variationData, setVariationData] = useState({
    Id: null, // 👈 Add variation Id
    OPVariationID: "",
    SKUCode: "",
    Barcode: "",
    OPMRP: "",
    StockId: null,
  });

  const [pricingData, setPricingData] = useState([]);

  const [variationsList, setVariationsList] = useState([]);

  const addVariationToList = () => {
    const allLocationIds =
      allLocations?.data?.map((loc) => String(loc.Id)) || [];

    // Build pricing array
    const pricingArray = pricingData.map((row) => ({
      id: String(row.id),
      buyingPrice: Number(row.buyingPrice) || 0,
      sellingPrice: Number(row.sellingPrice) || 0,
    }));

    // Build flattened pricing fields
    const pricingObject = pricingArray.reduce((acc, row) => {
      acc[`BuyingPrice${row.id}`] = row.buyingPrice;
      acc[`SellingPrice${row.id}`] = row.sellingPrice;
      acc[`AvgPrice${row.id}`] = row.buyingPrice;
      acc[`Quantity${row.id}`] = 0;
      acc[`DefectiveQty${row.id}`] = 0;
      return acc;
    }, {});

    // Find existing variation to preserve Id and Stock.Id
    const existingVariation = variationsList.find(
      (v) => String(v.OPVariationID) === String(variationData.OPVariationID)
    );

    // Construct new variation
    const newVariation = {
      Id: existingVariation?.Id || null, // 👈 Include variation Id
      ...variationData,
      OPVariationID: String(variationData.OPVariationID),
      Stock: {
        Id: existingVariation?.Stock?.Id || null, // 👈 Preserve Stock.Id
        OPBatchCode: 1,
        OPMRP: Number(variationData.OPMRP) || 0,
        location: allLocationIds,
        ...pricingObject,
      },
    };

    // Update or append variation
    if (variationData.OPVariationID && existingVariation) {
      setVariationsList((prev) =>
        prev.map((v) =>
          String(v.OPVariationID) === String(variationData.OPVariationID)
            ? { ...newVariation }
            : v
        )
      );
    } else {
      setVariationsList((prev) => [...prev, newVariation]);
    }

    // Reset form inputs
    setVariationData({
      Id: null, // 👈 Reset variation Id
      OPVariationID: "",
      SKUCode: "",
      Barcode: "",
      OPMRP: "",
      stockId: null,
    });
    setPricingData([]);
  };

  const finalProductPayload = useMemo(
    () => ({
      ...formData,
      Variations: variationsList,
    }),
    [formData, variationsList]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [existingProductId, setExistingProductId] = useState(null);

  const populateExistingProduct = (productData) => {
    if (!productData) return;

    setIsEditing(true);
    setExistingProductId(productData.Id);

    // Set main form data
    setFormData({
      BrandID: productData.Brand.Id,
      ProductName: productData.ProductName,
      ProductCode: productData.ProductCode,
      HSN: productData.HSN,
      TaxID: productData.TaxID,
    });

    // Process variations
    const variations = productData.OtherProductsDetails.map((detail) => {
      const stock = detail.Stock || {};
      const allLocationIds =
        allLocations?.data?.map((loc) => String(loc.Id)) || [];

      return {
        Id: detail.Id, // 👈 Include variation Id
        OPVariationID: detail.OPVariationID,
        SKUCode: detail.SKUCode,
        Barcode: detail.Barcode,
        OPMRP: stock.OPMRP,
        Stock: {
          ...stock,
          Id: stock?.Id || null, // 👈 Ensure Stock.Id is included
          location: stock.location || allLocationIds,
        },
      };
    });

    setVariationsList(variations);
  };

  const resetVariationData = () => {
    setVariationData({
      Id: null,
      OPVariationID: "",
      SKUCode: "",
      Barcode: "",
      OPMRP: "",
      StockId: null,
    });
    setPricingData([]);
  };

  return (
    <FormContext.Provider
      value={{
        formData,
        setFormData,
        variationData,
        setVariationData,
        pricingData,
        setPricingData,
        variationsList,
        addVariationToList,
        finalProductPayload,
        setVariationsList,
        allLocations,
        isEditing,
        existingProductId,
        populateExistingProduct,
        resetVariationData
      }}
    >
      {children}
    </FormContext.Provider>
  );
};
