import { createContext, useContext, useState } from "react";

const TOTAL_STEPS = 6;
const TOTAL_SALES_STEPS = 4;
const TOTAL_STOCK_STEPS = 4;
const TOTAL_PURCHASE_STEPS = 4;
const TOTAL_STOCKIN_STEPS = 4;
const TOTAL_OFFER_STEPS = 4;

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
    customerData: null,
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

  const updateFullPayments = (data) => {
    setFullPayments(data);
  };
  const updateSelectedOrderDetails = (details) => {
    setSelectedOrderDetails(details);
  };
  const resetOrderContext = () => {
    setCustomerId({
      countryId: null,
      companyId: null,
      patientName: null,
      patientId: null,
      locationId: null,
      customerId: null,
      orderId: null,
      mobileNo: null,
      customerData: null,
    });
    setDraftData(null);
    setCurrentStep(0);
    setCurrentSubStep(1);
    setSelectedProduct({ value: 1, label: "Frame/Sunglass" });
    setCustomerDetails(null);
    setFrameDetaildId(null);
    setPaymentDetails(null);
    setFullPayments([]);
    setSelectedOrderDetails(null);
    setIdentifiers({ frameDetailedId: null, identifier: null });
  };

  // Sales Return Data

  const [customerSalesId, setCustomerSalesId] = useState({
    countryId: null,
    companyId: null,
    patientName: null,
    patientId: null,
    locationId: null,
    customerId: null,
    mobileNo: null,
    customerData: null,
  });

  const [salesDraftData, setSalesDraftData] = useState(null);

  const [currentSalesStep, setCurrentSalesStep] = useState(0);
  const [currentSalesSubStep, setCurrentSalesSubStep] = useState(1);
  const [selectedSalesProduct, setSelectedSalesProduct] = useState({
    value: 1,
    label: "Frame/Sunglass",
  });
  const [selectedPatient, setSelectedMainPatient] = useState(null);
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

  const updateSelectedPatient = (data) => {
    setSelectedMainPatient(data);
  };
  const calculateGST = (sellingPrice, taxPercentage) => {
    const price = parseFloat(sellingPrice);
    const taxRate = parseFloat(taxPercentage) / 100;
    const gstAmount = price - price / (1 + taxRate);
    return {
      gstAmount: isNaN(gstAmount) ? 0 : gstAmount.toFixed(2),
      taxPercentage: isNaN(taxPercentage)
        ? 0
        : parseFloat(taxPercentage).toFixed(2),
    };
  };
  const findGSTPercentage = (item) => {
    const price = parseFloat(item.returnPrice || 0);

    const gstPercent = (() => {
      if (!item.TaxDetails || item.TaxDetails.length === 0) {
        return 0; // no tax data
      }

      if (item.TaxDetails.length === 1) {
        // Only one tax slab → use its SalesTaxPerct directly
        return parseFloat(item.TaxDetails[0].SalesTaxPerct) || 0;
      }

      // Multiple slabs → find based on range
      const matchingSlab = item.TaxDetails.find((slab) => {
        const start = parseFloat(slab.SlabStart);
        const end = parseFloat(slab.SlabEnd);
        return price >= start && price <= end;
      });

      return matchingSlab ? parseFloat(matchingSlab.SalesTaxPerct) || 0 : 0;
    })();
    return calculateGST(price, gstPercent);
  };

  // Stock Transfer
  const [customerStock, setCustomerStockOut] = useState({
    countryId: null,
    companyId: null,
    patientName: null,
    patientId: null,
    locationId: null,
    customerId: null,
    mobileNo: null,
    customerData: null,
    inState: null,
  });

  const [stockDraftData, setStockDraftData] = useState(null);

  const [currentStockStep, setCurrentStockStep] = useState(1);
  const [currentStockSubStep, setCurrentStockSubStep] = useState(1);
  const [selectedStockProduct, setSelectedStockProduct] = useState({
    value: 1,
    label: "Frame/Sunglass",
  });
  const [selectedStockPatient, setSelectedStockPatient] = useState(null);

  const goToStockStep = (step) => {
    if (step >= 1 && step <= TOTAL_STOCK_STEPS) {
      setCurrentStockStep(step);
      setCurrentStockSubStep(1);
    }
  };

  const nextStockStep = () => {
    setCurrentStockStep((prev) => (prev < TOTAL_STOCK_STEPS ? prev + 1 : prev));
    setCurrentStockSubStep(1);
  };

  const prevStockStep = () => {
    setCurrentStockStep((prev) => (prev > 1 ? prev - 1 : prev));
    setCurrentStockSubStep(1);
  };

  const goToSubStockStep = (subStep) => {
    setCurrentStockSubStep(subStep);
  };

  const nextSubStockStep = () => {
    setCurrentStockSubStep((prev) => prev + 1);
  };

  const prevSubStockStep = () => {
    setCurrentStockSubStep((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const setSubStockStep = (step) => {
    setCurrentStockSubStep(step);
  };
  const updateCurrentStockStep = (step) => {
    setCurrentStockStep(step);
  };

  // Purchase Return
  const [customerPurchase, setCustomerPurchase] = useState({
    countryId: null,
    companyId: null,
    patientName: null,
    patientId: null,
    locationId: null,
    customerId: null,
    mobileNo: null,
    customerData: null,
    vendorPoolId: null,
  });

  const [purchaseDraftData, setPurchaseDraftData] = useState(null);

  const [currentPurchaseStep, setCurrentPurchaseStep] = useState(1);
  const [currentPurchaseSubStep, setCurrentPurchaseSubStep] = useState(1);
  const [selectedPurchaseProduct, setSelectedPurchaseProduct] = useState({
    value: 1,
    label: "Frame/Sunglass",
  });
  const [selectedPurchasePatient, setSelectedPurchasePatient] = useState(null);

  const goToPurchaseStep = (step) => {
    if (step >= 1 && step <= TOTAL_PURCHASE_STEPS) {
      setCurrentPurchaseStep(step);
      setCurrentPurchaseSubStep(1);
    }
  };

  const nextPurchaseStep = () => {
    setCurrentPurchaseStep((prev) =>
      prev < TOTAL_PURCHASE_STEPS ? prev + 1 : prev
    );
    setCurrentPurchaseSubStep(1);
  };

  const prevPurchaseStep = () => {
    setCurrentPurchaseStep((prev) => (prev > 1 ? prev - 1 : prev));
    setCurrentPurchaseSubStep(1);
  };

  const goToSubPurchaseStep = (subStep) => {
    setCurrentPurchaseSubStep(subStep);
  };

  const nextSubPurchaseStep = () => {
    setCurrentPurchaseSubStep((prev) => prev + 1);
  };

  const prevSubPurchaseStep = () => {
    setCurrentPurchaseSubStep((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const setSubPurchaseStep = (step) => {
    setCurrentPurchaseSubStep(step);
  };

  // StockTransferIn
  const [customerStockTransferIn, setCustomerStockTransferIn] = useState({
    countryId: null,
    companyId: null,
    patientName: null,
    patientId: null,
    locationId: null,
    customerId: null,
    mobileNo: null,
    mainId: null,
    customerData: null,
  });

  const [stockTransferInDraftData, setStockTransferInDraftData] =
    useState(null);

  const [currentStockTransferInStep, setCurrentStockTransferInStep] =
    useState(1);
  const [currentStockTransferInSubStep, setCurrentStockTransferInSubStep] =
    useState(1);
  const [selectedStockTransferInProduct, setSelectedStockTransferInProduct] =
    useState({
      value: 1,
      label: "Frame/Sunglass",
    });
  const [selectedStockTransferInPatient, setSelectedStockTransferInPatient] =
    useState(null);

  const goToStockTransferInStep = (step) => {
    if (step >= 1 && step <= TOTAL_STOCKIN_STEPS) {
      setCurrentStockTransferInStep(step);
      setCurrentStockTransferInSubStep(1);
    }
  };

  const nextStockTransferInStep = () => {
    setCurrentStockTransferInStep((prev) =>
      prev < TOTAL_STOCKIN_STEPS ? prev + 1 : prev
    );
    setCurrentStockTransferInSubStep(1);
  };

  const prevStockTransferInStep = () => {
    setCurrentStockTransferInStep((prev) => (prev > 1 ? prev - 1 : prev));
    setCurrentStockTransferInSubStep(1);
  };

  const goToSubStockTransferInStep = (subStep) => {
    setCurrentStockTransferInSubStep(subStep);
  };

  const nextSubStockTransferInStep = () => {
    setCurrentStockTransferInSubStep((prev) => prev + 1);
  };

  const prevSubStockTransferInStep = () => {
    setCurrentStockTransferInSubStep((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const setSubStockTransferInStep = (step) => {
    setCurrentStockTransferInSubStep(step);
  };
  const updateCurrentSTINStep = (step) => {
    setCurrentStockTransferInStep(step);
  };

  // Offer Module
  const [customerOffer, setCusomerOffer] = useState({
    countryId: null,
    companyId: null,
    patientName: null,
    patientId: null,
    locationId: null,
    customerId: null,
    mobileNo: null,
    customerData: null,
    inState: null,
    customerPoolId:null,
    offerMainId:null,
    selectedProduct:null,
  });

  const [offerData, setOfferData] = useState(null);

  const [currentOfferStep, setCurrentOfferStep] = useState(1);
  const [currentOfferSubStep, setCurrentOfferSubStep] = useState(1);
  const [selectedOfferProduct, setSelectedOfferProduct] = useState({
    value: 1,
    label: "Frame/Sunglass",
  });
  const [selectedOfferPatient, setSelectedOfferPatient] = useState(null);

  const goToOfferStep = (step) => {
    if (step >= 1 && step <= TOTAL_OFFER_STEPS) {
      setCurrentOfferStep(step);
      setCurrentOfferSubStep(1);
    }
  };

  const nextOfferStep = () => {
    setCurrentOfferStep((prev) => (prev < TOTAL_OFFER_STEPS ? prev + 1 : prev));
    setCurrentOfferSubStep(1);
  };

  const prevOfferStep = () => {
    setCurrentOfferStep((prev) => (prev > 1 ? prev - 1 : prev));
    setCurrentOfferSubStep(1);
  };

  const goToSubOfferStep = (subStep) => {
    setCurrentOfferSubStep(subStep);
  };

  const nextSubOfferStep = () => {
    setCurrentOfferSubStep((prev) => prev + 1);
  };

  const prevSubOfferStep = () => {
    setCurrentOfferSubStep((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const setSubOfferStep = (step) => {
    setCurrentOfferSubStep(step);
  };
  const updateCurrentOfferStep = (step) => {
    setCurrentOfferStep(step);
  };

  return (
    <OrderContext.Provider
      value={{
        // offer values
        customerOffer,
        setCusomerOffer,
        offerData,
        setOfferData,
        currentOfferStep,
        setCurrentOfferStep,
        currentOfferSubStep,
        setCurrentOfferSubStep,
        selectedOfferProduct,
        setSelectedOfferProduct,
        selectedOfferPatient,
        setSelectedOfferPatient,
        goToOfferStep,
        nextOfferStep,
        prevOfferStep,
        goToSubOfferStep,
        nextSubOfferStep,
        prevSubOfferStep,
        setSubOfferStep,
        updateCurrentOfferStep,

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
        updateFullPayments,
        resetOrderContext,

        // sales return
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
        customerSalesId,
        setCustomerSalesId,
        findGSTPercentage,
        calculateGST,
        selectedPatient,
        setSelectedMainPatient,
        updateSelectedPatient,

        //  stock transfer out
        totalStockSteps: TOTAL_STOCK_STEPS,
        selectedStockProduct,
        setSelectedStockProduct,
        currentStockStep,
        setCurrentStockStep,
        currentStockSubStep,
        setCurrentStockSubStep,
        stockDraftData,
        setStockDraftData,
        goToStockStep,
        nextStockStep,
        goToSubStockStep,
        nextSubStockStep,
        prevSubStockStep,
        prevStockStep,
        setSubStockStep,
        customerStock,
        setCustomerStockOut,
        selectedStockPatient,
        setSelectedStockPatient,
        updateCurrentStockStep,

        // purchase return
        totalPurchaseSteps: TOTAL_PURCHASE_STEPS,
        selectedPurchaseProduct,
        setSelectedPurchaseProduct,
        currentPurchaseStep,
        setCurrentPurchaseStep,
        currentPurchaseSubStep,
        setCurrentPurchaseSubStep,
        purchaseDraftData,
        setPurchaseDraftData,
        goToPurchaseStep,
        nextPurchaseStep,
        goToSubPurchaseStep,
        nextSubPurchaseStep,
        prevSubPurchaseStep,
        prevPurchaseStep,
        setSubPurchaseStep,
        customerPurchase,
        setCustomerPurchase,
        selectedPurchasePatient,
        setSelectedPurchasePatient,

        // Stock transfer In
        totalStockTransferInSteps: TOTAL_STOCKIN_STEPS,
        selectedStockTransferInProduct,
        setSelectedStockTransferInProduct,
        currentStockTransferInStep,
        setCurrentStockTransferInStep,
        currentStockTransferInSubStep,
        setCurrentStockTransferInSubStep,
        stockTransferInDraftData,
        setStockTransferInDraftData,
        goToStockTransferInStep,
        nextStockTransferInStep,
        goToSubStockTransferInStep,
        nextSubStockTransferInStep,
        prevSubStockTransferInStep,
        prevStockTransferInStep,
        setSubStockTransferInStep,
        customerStockTransferIn,
        setCustomerStockTransferIn,
        selectedStockTransferInPatient,
        setSelectedStockTransferInPatient,
        updateCurrentSTINStep,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
