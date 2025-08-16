import { useOrder } from "../../features/OrderContext";
import StepTwoMain from "./StepTwo/StepTwoMain";
import StepThreeMain from "./StepThree";
import SelectCustomer from "./StepOne/SelectCustomer";
import SalesList from "./MainSalesReturn/SalesList";
import { useSelector } from "react-redux";
import { useGetLocationByIdQuery } from "../../api/roleManagementApi";
import { useEffect, useState } from "react";
import CompleteSalesReturn from "./StepFour/CompleteSalesReturn";

const TotalSales = () => {
  const [location, setLocation] = useState(null);
  const {
    currentSalesStep,
    salesDraftData,
    setSalesDraftData,
    setCustomerSalesId,
  } = useOrder();

  const { hasMultipleLocations, user } = useSelector((state) => state.auth);
  const { data: locationById } = useGetLocationByIdQuery(
    { id: location },
    { skip: !location }
  );

  const companyType = locationById?.data?.data.CompanyType;
  const companyId = locationById?.data?.data.Id;
  const countrId = locationById?.data?.data.BillingCountryCode;

  useEffect(() => {
    setCustomerSalesId((prev) => ({
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
      setCustomerSalesId((prev) => ({
        ...prev,
        locationId: parseInt(locations[0]),
      }));
      setLocation(locations[0]);
    }
  }, [hasMultipleLocations]);
  const renderStep = () => {
    switch (currentSalesStep) {
      case 1:
        return <SelectCustomer />;
      case 2:
        return <StepTwoMain />;
      case 3:
        return <StepThreeMain />;
      case 4:
        return <CompleteSalesReturn />;
      default:
        return <SalesList />;
    }
  };

  return <div>{renderStep()}</div>;
};

export default TotalSales;
