import { createContext, useContext, useState } from "react";

const TOTAL_STEPS = 7;

const OrderContext = createContext();

export const useOrder = () => {
  return useContext(OrderContext);
};

export const OrderProvider = ({ children, initialStep = 1 }) => {
  const [customerId, setCustomerId] = useState({
    countryId: null,
    companyId: null,
    patientName: null,
    patientId: null,
    locationId: null,
    customerId: null,
    orderId: null,
  });
  const [draftData, setDraftData] = useState(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [currentSubStep, setCurrentSubStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState({
    value: 1,
    label: "Frame/Sunglass",
  });
  const [customerDetails, setCustomerDetails] = useState(null);

  const [FrameDetailedId,setFrameDetaildId] = useState(null)

  const goToStep = (step) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
      setCurrentSubStep(1);
    }
  };

  const nextStep = () => {
    setCurrentStep((prev) => (prev < TOTAL_STEPS ? prev + 1 : prev));
    setCurrentSubStep(1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev > 1 ? prev - 1 : prev));
    setCurrentSubStep(1);
  };

  // Sub-step navigation
  const goToSubStep = (subStep) => {
    setCurrentSubStep(subStep);
  };

  const nextSubStep = () => {
    setCurrentSubStep((prev) => prev + 1);
  };

  const prevSubStep = () => {
    setCurrentSubStep((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const setSubStep = (step) => {
    setCurrentSubStep(step);
  };

  const setFrameId = (id) =>{
    setFrameDetaildId(id)
  }
  return (
    <OrderContext.Provider
      value={{
        currentStep,
        currentSubStep,
        totalSteps: TOTAL_STEPS,
        goToStep,
        nextStep,
        prevStep,
        goToSubStep,
        nextSubStep,
        prevSubStep,
        customerId,
        setCustomerId,
        selectedProduct,
        setSelectedProduct,
        draftData,
        setDraftData,
        customerDetails,
        setCustomerDetails,
        setSubStep,
        setFrameId,
        FrameDetailedId
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
