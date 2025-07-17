import { createContext, useContext, useState } from "react";

const FormMasterContext = createContext();

export const useFrameMaster = () => useContext(FormMasterContext);

export const FormMasterProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    BrandID: null,
    ModelNo: null,
    Category: null,
    Type: null,
    ShapeID: null,
    FrontMaterialID: null,
    TempleMaterialID: null,
    Gender: null,
    IsClipOn: false,
    NoOfClips: null,
    IsRxable: true,
    CaptureSlNo: null,
    HSN: null,
    TaxID: null,
  });

  const [variationData, setVariationData] = useState([]);
  const [stock, setStock] = useState([]);

  const [pricingData, setPricingData] = useState([]);

  const resetFrameMasterState = () => {
    setVariationData([]);
    setPricingData([]);
    setStock([]);
    setFormData({
      BrandID: null,
      ModelNo: null,
      Category: null,
      Type: null,
      ShapeID: null,
      FrontMaterialID: null,
      TempleMaterialID: null,
      Gender: null,
      IsClipOn: false,
      NoOfClips: null,
      IsRxable: true,
      CaptureSlNo: null,
      HSN: null,
      TaxID: null,
    });
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
