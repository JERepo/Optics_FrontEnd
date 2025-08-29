import { useOrder } from "../../features/OrderContext";
import { useSelector } from "react-redux";
import { useGetLocationByIdQuery } from "../../api/roleManagementApi";
import { useEffect, useState } from "react";
import SelectLocation from "./StepOne/SelectLocation";
import StepTwoMain from "./StepTwo/StepTwoMain";
import CompleteStockTransfer from "./StepFour/CompleteStockTransfer";
import StepThreeMain from "./StepThree";

const StockTransfer = () => {
  const [location, setLocation] = useState(null);
  const {
    setCustomerStockOut,
    setStockDraftData,
    currentStockStep,
    customerStock,
  } = useOrder();

  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const { data: locationById } = useGetLocationByIdQuery(
    { id: location },
    { skip: !location }
  );

  const companyId = locationById?.data?.data.Id;
  const countrId = locationById?.data?.data.BillingCountryCode;

  useEffect(() => {
    setCustomerStockOut((prev) => ({
      ...prev,
      countryId: countrId,
      companyId: companyId,
    }));
  }, [countrId, locationById, companyId]);

  // Location handling
  useEffect(() => {
    const locations = Array.isArray(hasMultipleLocations)
      ? hasMultipleLocations
      : hasMultipleLocations !== undefined && hasMultipleLocations !== null
      ? [hasMultipleLocations]
      : [];

    if (locations.length === 1) {
      setCustomerStockOut((prev) => ({
        ...prev,
        locationId: parseInt(locations[0]),
      }));
      setLocation(locations[0]);
    }
  }, [hasMultipleLocations]);

  const renderStep = () => {
    switch (currentStockStep) {
      case 1:
        return <SelectLocation />;
      case 2:
        return <StepTwoMain />;
      case 3:
        return <StepThreeMain />
      case 4:
        return <CompleteStockTransfer />;
    }
  };

  return <div>{renderStep()}</div>;
};

export default StockTransfer;
