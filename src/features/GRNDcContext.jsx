import { createContext, useContext, useState } from 'react';

const GRNDCContext = createContext();

export const useGRNDC = () => {
  const context = useContext(GRNDCContext);
  if (!context) {
    throw new Error('useGRN must be used within a GRNProvider');
  }
  return context;
};

export const GRNDCProvider = ({ children }) => {
  const [grnData, setGRNData] = useState({
    step1: {
      selectedLocation: null,
      selectedVendor: null,
      vendorDetails: null,
      documentNo: null,
      documentDate: null,
      billingMethod: null,
      againstPO: null,
      GrnMainId: null
    },
    step2: {
      productType: null,
    },
    step3: {
      selectedItems: null,
    },
    step4: {
      // Add step4 specific data
    }
  });

  const [currentStep, setCurrentStep] = useState(1);

  const updateStep1Data = (data) => {
    setGRNData(prev => ({
      ...prev,
      step1: { ...prev.step1, ...data }
    }));
  };

  const updateStep2Data = (data) => {
    setGRNData(prev => ({
      ...prev,
      step2: { ...prev.step2, ...data }
    }));
  };

  const updateStep3Data = (data) => {
    setGRNData(prev => ({
      ...prev,
      step3: { ...prev.step3, ...data }
    }));
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const resetGRN = () => {
    setGRNData({
      step1: {
        selectedLocation: null,
        selectedVendor: null,
        vendorDetails: null,
        documentNo: null,
        documentDate: null,
        billingMethod: "invoice",
        againstPO: 1
      },
      step2: { productType: null },
      step3: {},
      step4: {}
    });
    setCurrentStep(1);
  };

  const value = {
    grnData,
    setGRNData,
    currentStep,
    setCurrentStep,
    updateStep1Data,
    updateStep2Data,
    updateStep3Data,
    nextStep,
    prevStep,
    resetGRN
  };

  return (
    <GRNDCContext.Provider value={value}>
      {children}
    </GRNDCContext.Provider>
  );
};