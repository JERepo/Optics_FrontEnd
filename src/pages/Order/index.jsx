import React, { useEffect, useState } from "react";

import AddOrder from "./StepOne/AddOrder";
import { useGetOrderDetailsQuery, useGetOrderQuery } from "../../api/orderApi";
import { useSelector } from "react-redux";
import { useGetLocationByIdQuery } from "../../api/roleManagementApi";
import { useGetCompanyIdQuery, useGetIsdQuery } from "../../api/customerApi";
import { useOrder } from "../../features/OrderContext";
import StepTwoMain from "./StepTwo/StepTwoMain";
import StepThreeMain from "./StepThree";
import OrderDetails from "./StepFour/OrderDetails";
import CompleteOrder from "./StepFive/CompleteOrder";

const TotalOrder = () => {
  const [patientId, setPatientId] = useState(null);
  const [customerId, setMainCustomerId] = useState(null);
  const [location, setLocation] = useState(null);
  const { currentStep, setDraftData, setCustomerId, setCustomerDetails } =
    useOrder();

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
    { patientId: patientId, customerId: customerId },
    { skip: !patientId && !customerId }
  );

  console.log("draft details", draftDetails);

  useEffect(() => {
    if (draftDetails?.data.data) {
      setDraftData(draftDetails?.data?.data);
    } else {
      setDraftData(null);
    }
  }, [patientId, draftDetails, customerId]);

  const companyType = locationById?.data?.data.CompanyType;
  const companyId = locationById?.data?.data.Id;
  const countrId = locationById?.data?.data.BillingCountryCode;

  const { data: countryIsd } = useGetIsdQuery(
    { id: countrId },
    { skip: !countrId }
  );

  useEffect(() => {
    setCustomerId((prev) => ({
      ...prev,
      countryId: countrId,
      companyId: companyId,
    }));
  }, [countrId, locationById, companyId]);
  const { data: companySettings } = useGetCompanyIdQuery(
    { id: companyId },
    { skip: !companyId }
  );

  const CustomerPoolID = companySettings?.data?.data.CustomerPoolID;

  console.log("location data", locationById);
  console.log("company data", companySettings);

  const handleGetPatient = (id, customerId, data) => {
    console.log("patienr id is oming", id, customerId);
    setPatientId(id);
    setMainCustomerId(customerId);
    setCustomerDetails(data);
  };

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
        return <OrderDetails />;
      case 5:
        return <CompleteOrder />;
      default:
        return <AddOrder {...commonProps} />;
    }
  };

  return <div>{renderStep()}</div>;
};

export default TotalOrder;
