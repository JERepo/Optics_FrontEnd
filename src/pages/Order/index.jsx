import React, { useEffect, useState } from "react";

import AddOrder from "./StepOne/AddOrder";
import { useGetOrderDetailsQuery, useGetOrderQuery } from "../../api/orderApi";
import { useSelector } from "react-redux";
import { useGetLocationByIdQuery } from "../../api/roleManagementApi";
import { useGetCompanyIdQuery, useGetIsdQuery } from "../../api/customerApi";
import { useOrder } from "../../features/OrderContext";
import StepTwoMain from "./StepTwo/StepTwoMain";
import SampleStepFour from "./StepFour/SampleStepFour";
import StepThreeMain from "./StepThree";

const TotalOrder = () => {
  const [patientId, setPatientId] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [location, setLocation] = useState(null);
  const { currentStep, setDraftData } = useOrder();

  const { hasMultipleLocations, user } = useSelector((state) => state.auth);

  const { data: getOrderData, isLoading: isGetOrderDataLoading } =
    useGetOrderQuery(
      { id: patientId, customerId },
      { skip: !patientId && !customerId }
    );

  const { data: locationById } = useGetLocationByIdQuery(
    { id: location },
    { skip: !location }
  );
  const { data: draftDetails } = useGetOrderDetailsQuery(
    { patientId: patientId,customerId:customerId },
    { skip: !patientId && !customerId }
  );

  console.log("draft details", draftDetails);

  useEffect(() => {
    if (draftDetails?.data?.data) {
      setDraftData(draftDetails.data.data);
    }
  }, [patientId, draftDetails]);

  const companyType = locationById?.data?.data.CompanyType;
  const companyId = locationById?.data?.data.Id;
  const countrId = locationById?.data?.data.BillingCountryCode;

  const { data: countryIsd } = useGetIsdQuery(
    { id: countrId },
    { skip: !countrId }
  );

  const { data: companySettings } = useGetCompanyIdQuery(
    { id: companyId },
    { skip: !companyId }
  );

  const CustomerPoolID = companySettings?.data?.data.CustomerPoolID;

  const handleGetPatient = (id, customerId) => {
    console.log("patienr id is oming", id, customerId);
    setPatientId(id);
    setCustomerId(customerId);
  };

  // useEffect(() => {
  //   if (getOrderData?.data?.step) {
  //     goToStep(getOrderData.data.step);
  //   }
  // }, [getOrderData, goToStep]);

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

  const commonProps = {
    handleGetPatient,
    getOrderData,
    isGetOrderDataLoading,
    location,
    setLocation,
    locationById,
    companyType,
    countryIsd,
    companySettings,
    CustomerPoolID,
  };

  // Step rendering logic
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <AddOrder {...commonProps} />;
      case 2:
        return <StepTwoMain />;
      case 3:
        return <StepThreeMain />;
      case 4:
        return <SampleStepFour />;
      default:
        return <AddOrder {...commonProps} />;
    }
  };

  return <div>{renderStep()}</div>;
};

export default TotalOrder;
