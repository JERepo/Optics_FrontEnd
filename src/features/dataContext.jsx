import { createContext, useContext, useState } from "react";

const FormContext = createContext();

export const useFormData = () => useContext(FormContext);

export const FormProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    BrandID: "",
    ProductName: "",
    ProductCode: "",
    HSN: "",
    TaxID: "",
  });

  const [variationData, setVariationData] = useState([]);
  const [stock, setStock] = useState([]);

  const [pricingData, setPricingData] = useState([]);
  const resetFrameMasterState = () => {
    setVariationData([]);
    setPricingData([]);
    setStock([]);
    setFormData({});
  };

  return (
    <FormContext.Provider
      value={{
        formData,
        setFormData,
        variationData,
        setVariationData,
        stock,
        setStock,
        pricingData,
        setPricingData,
        resetFrameMasterState,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};
