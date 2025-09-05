import { useOrder } from "../../features/OrderContext";
import { useSelector } from "react-redux";
import { useGetLocationByIdQuery } from "../../api/roleManagementApi";
import { useEffect, useState } from "react";
import SelectVendor from "./StepOne/SelectVendor";
import PurchaseReturnDetails from "./StepFour/PurchaseReturnDetails";
import SelectTwoMain from "./StepTwo/StepTwoMain";
import StepThreeMain from "./StepThree";
import { useGetCompanyIdQuery } from "../../api/customerApi";

const TotalPurchaseReturn = () => {
  const [location, setLocation] = useState(null);
  const {
    currentPurchaseStep,
    pustomerPurchase,
    setCustomerPurchase,
    setPurchaseDraftData,
  } = useOrder();

  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const { data: locationById } = useGetLocationByIdQuery(
    { id: location },
    { skip: !location }
  );

  const companyId = locationById?.data?.data.Id;
  const countrId = locationById?.data?.data.BillingCountryCode;
  const { data: companySettings } = useGetCompanyIdQuery(
    { id: companyId },
    { skip: !companyId }
  );
  const vendorPoolId = companySettings?.data?.data.VendorPoolID;

  useEffect(() => {
    setCustomerPurchase((prev) => ({
      ...prev,
      countryId: countrId,
      companyId: companyId,
      vendorPoolId: vendorPoolId,
    }));
  }, [countrId, locationById, companyId,companySettings]);

  // Location handling
  useEffect(() => {
    const locations = Array.isArray(hasMultipleLocations)
      ? hasMultipleLocations
      : hasMultipleLocations !== undefined && hasMultipleLocations !== null
      ? [hasMultipleLocations]
      : [];

    if (locations.length === 1) {
      setCustomerPurchase((prev) => ({
        ...prev,
        locationId: parseInt(locations[0]),
      }));
      setLocation(locations[0]);
    }
  }, [hasMultipleLocations]);

  const renderStep = () => {
    switch (currentPurchaseStep) {
      case 1:
        return <SelectVendor />;
      case 2:
        return <SelectTwoMain />;
      case 3:
        return <StepThreeMain />;
      case 4:
        return <PurchaseReturnDetails />;
    }
  };

  return <div>{renderStep()}</div>;
};

export default TotalPurchaseReturn;
