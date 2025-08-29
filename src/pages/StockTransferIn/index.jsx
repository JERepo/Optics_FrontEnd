import { useOrder } from "../../features/OrderContext";
import { useSelector } from "react-redux";
import { useGetLocationByIdQuery } from "../../api/roleManagementApi";
import { useEffect, useState } from "react";
import SelectStock from "./StepOne/SelectStock";
import StepTwoMain from "./StepTwo/StepTwoMain";
import CompleteStockTransferIn from "./StepFour/CompleteStockTransferIn";
import StepThreeMain from "./StepThree";

const TotalStockTransferIn = () => {
  const [location, setLocation] = useState(null);
  const {
    setStockTransferInDraftData,
    customerStockTransferIn,
    setCustomerStockTransferIn,
    currentStockTransferInStep,
  } = useOrder();

  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const { data: locationById } = useGetLocationByIdQuery(
    { id: location },
    { skip: !location }
  );

  const companyId = locationById?.data?.data.Id;
  const countrId = locationById?.data?.data.BillingCountryCode;

  useEffect(() => {
    setCustomerStockTransferIn((prev) => ({
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
      setCustomerStockTransferIn((prev) => ({
        ...prev,
        locationId: parseInt(locations[0]),
      }));
      setLocation(locations[0]);
    }
  }, [hasMultipleLocations]);

  const renderStep = () => {
    switch (currentStockTransferInStep) {
      case 1:
        return <SelectStock />;
      case 2:
        return <StepTwoMain />;
      case 3:
        return <StepThreeMain />;
      case 4:
        return <CompleteStockTransferIn />;
    }
  };

  return <div>{renderStep()}</div>;
};

export default TotalStockTransferIn;
