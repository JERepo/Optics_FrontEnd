import { createContext, useContext, useState } from "react";

const FormMasterContext = createContext();

export const useFrameMaster = () => useContext(FormMasterContext);

export const FormMasterProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    BrandID: "",
    ModelNo: "",
    Category: "",
    Type: "",
    ShapeID: "",
    FrontMaterialID: "",
    TempleMaterialID: "",
    Gender: "",
    IsClipOn: false,
    NoOfClips: null,
    IsRxable: true,
    CaptureSlNo: "",
    HSN: "",
    TaxID: "",
  });

  const [variationData, setVariationData] = useState([]);
  const [stock, setStock] = useState([]);

  // ✅ Add pricingData and its setter
  const [pricingData, setPricingData] = useState([]);

  const resetFrameMasterState = () => {
    setVariationData([]);
    setPricingData([]);
    setStock([]);
    setFormData({});
  };

  return (
    <FormMasterContext.Provider
      value={{
        formData,
        setFormData,
        variationData,
        setVariationData,
        stock,
        setStock,
        pricingData,
        setPricingData, // ✅ expose it
        resetFrameMasterState,
      }}
    >
      {children}
    </FormMasterContext.Provider>
  );
};
