import { createContext, useContext, useState } from "react";

const TOTAL_STEPS = 6;
const TOTAL_SALES_STEPS = 4;

const OrderContext = createContext();

export const useOrder = () => {
  return useContext(OrderContext);
};

export const OrderProvider = ({ children, initialStep = 1 }) => {
  // Order Data
  const [customerId, setCustomerId] = useState({
    countryId: null,
    companyId: null,
    patientName: null,
    patientId: null,
    locationId: null,
    customerId: null,
    orderId: null,
    mobileNo: null,
  });
  const [draftData, setDraftData] = useState(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [currentSubStep, setCurrentSubStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState({
    value: 1,
    label: "Frame/Sunglass",
  });

  const [customerDetails, setCustomerDetails] = useState(null);

  const [FrameDetailedId, setFrameDetaildId] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [fullPayments, setFullPayments] = useState([]);

  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [Identifiers, setIdentifiers] = useState({
    frameDetailedId: null,
    identifier: null,
  });

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

  const setFrameId = (id) => {
    setFrameDetaildId(id);
  };

  const updatePaymentDetails = (details) => {
    setPaymentDetails(details);
  };

  const updateSelectedOrderDetails = (details) => {
    setSelectedOrderDetails(details);
  };

  // Sales Return Data

  const [customerSalesId, setCustomerSalesId] = useState({
    countryId: null,
    companyId: null,
    patientName: null,
    patientId: null,
    locationId: null,
    customerId: null,
    orderId: null,
    mobileNo: null,
  });

  const [salesDraftData, setSalesDraftData] = useState(null);

  const [currentSalesStep, setCurrentSalesStep] = useState(0);
  const [currentSalesSubStep, setCurrentSalesSubStep] = useState(1);
  const [selectedSalesProduct, setSelectedSalesProduct] = useState({
    value: 1,
    label: "Frame/Sunglass",
  });

  const [referenceApplicable, setReferenceApplicable] = useState(1);
  const goToSalesStep = (step) => {
    if (step >= 1 && step <= TOTAL_SALES_STEPS) {
      setCurrentSalesStep(step);
      setCurrentSalesSubStep(1);
    }
  };

  const nextSalesStep = () => {
    setCurrentSalesStep((prev) => (prev < TOTAL_SALES_STEPS ? prev + 1 : prev));
    setCurrentSalesSubStep(1);
  };

  const prevSalesStep = () => {
    setCurrentSalesStep((prev) => (prev > 1 ? prev - 1 : prev));
    setCurrentSalesSubStep(1);
  };

  const goToSubSalesStep = (subStep) => {
    setCurrentSalesSubStep(subStep);
  };

  const nextSubSalesStep = () => {
    setCurrentSalesSubStep((prev) => prev + 1);
  };

  const prevSubSalesStep = () => {
    setCurrentSalesSubStep((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const setSubSalesStep = (step) => {
    setCurrentSalesSubStep(step);
  };

  const updateReferenceApplicable = () => {
    setReferenceApplicable((prev) => (prev === 0 ? 1 : 0));
  };

  return (
    <OrderContext.Provider
      value={{
        // Order values
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
        FrameDetailedId,
        updatePaymentDetails,
        paymentDetails,
        updateSelectedOrderDetails,
        selectedOrderDetails,
        Identifiers,
        setIdentifiers,
        fullPayments,
        setFullPayments,

        // sales values
        totalSalesSteps: TOTAL_SALES_STEPS,
        selectedSalesProduct,
        setSelectedSalesProduct,
        currentSalesStep,
        setCurrentSalesStep,
        currentSalesSubStep,
        setCurrentSalesSubStep,
        salesDraftData,
        setSalesDraftData,
        goToSalesStep,
        nextSalesStep,
        goToSubSalesStep,
        nextSubSalesStep,
        prevSubSalesStep,
        prevSalesStep,
        setSubSalesStep,
        referenceApplicable,
        updateReferenceApplicable,
        customerSalesId, setCustomerSalesId
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
