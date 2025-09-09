import React, { useEffect, useState } from "react";

import { useSelector } from "react-redux";
import { useGetLocationByIdQuery } from "../../api/roleManagementApi";
import { useGetCompanyIdQuery, useGetIsdQuery } from "../../api/customerApi";
import { useOrder } from "../../features/OrderContext";
import SelectOffer from "./StepOne/SelectOffer";
import StepTwoMain from "./StepTwo/StepTwoMain";
import StepThreeMain from "./StepThree";

const OfferModule = () => {
  const [location, setLocation] = useState(null);
  const { currentOfferStep, setOfferData, customerOffer, setCusomerOffer } =
    useOrder();

  const { hasMultipleLocations, user } = useSelector((state) => state.auth);

  const { data: locationById } = useGetLocationByIdQuery(
    { id: location },
    { skip: !location }
  );

  const companyType = locationById?.data?.data.CompanyType;
  const companyId = locationById?.data?.data.Id;
  const countrId = locationById?.data?.data.BillingCountryCode;



  const { data: companySettings } = useGetCompanyIdQuery(
    { id: companyId },
    { skip: !companyId }
  );
  const CustomerPoolID = companySettings?.data?.data.CustomerPoolID;
  useEffect(() => {
    setCusomerOffer((prev) => ({
      ...prev,
      countryId: countrId,
      companyId: companyId,
      customerPoolId :CustomerPoolID,
      locationId:parseInt(location)
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
      setLocation(locations[0]);
    }
  }, [hasMultipleLocations]);

  // Step rendering logic
  const renderStep = () => {
    switch (currentOfferStep) {
      case 1:
        return <SelectOffer />
      case 2:
        return <StepTwoMain />
      case 3:
        return <StepThreeMain />
    }
  };

  return <div>{renderStep()}</div>;
};

export default OfferModule;
