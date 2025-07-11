import { createContext, useContext, useState } from "react";

const CustomerContext = createContext();

export const useCustomerContext = () => useContext(CustomerContext);

export const CustomerProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    location: "",
    name: "",
    customerType: "B2C",
    customerGroup: "",
    countryCode: "+91",
    telPhone: "",
    phone: "",
    email: "",
    sendAlert: false,
    sendPhoneAlert: false,
  });

  const constructPayload = (
    formData,
    patientDetails,
    billingAddress,
    shippingAddress,
    useDifferentShipping,
    fittingType,
    fittingPrices,
    enableLoyalty,
    billingMethod,
    enableCreditBilling,
    creditDetails,
    creditBalanceType,
    rimTypes,
    indices,
    companyId,
    locationById
  ) => {
    const finalPatientDetails = [
      {
        name: formData.name || null,
        mobile: formData.phone || null,
        tel: formData.telPhone || null,
        email: formData.email || null,
        dob: null,
        engraving: "",
        anniversary: null,
        MobAlert: formData.sendPhoneAlert ? 1 : 0,
      },
      ...patientDetails.map((patient) => ({
        name: patient.name || null,
        mobile: patient.mobile || null,
        tel: patient.tel || null,
        email: patient.email || null,
        dob: patient.dob || null,
        engraving: patient.engraving || null,
        anniversary: patient.anniversary || null,
        MobAlert: patient.MobAlert || 0,
      })),
    ];

    return {
      CustomerCode: null,
      CustomerName: formData.name,
      CustomerUID: null,
      CustomerBrand: null,
      CustomerGroupID: formData.customerGroup,
      Email: formData.email,
      EmailAlert: formData.sendAlert ? 1 : 0,
      MobileISDCode: "+91",
      MobNumber: formData.phone,
      MobAlert: formData.sendPhoneAlert ? 1 : 0,
      TelNumber: formData.telPhone,
      WAGroupID: 0,
      WAGroupAlert: 0,
      BillAddress1: billingAddress.line1,
      BillAddress2: billingAddress.line2,
      BillLandmark: billingAddress.landmark,
      BillPin: billingAddress.pincode,
      BillCity: billingAddress.city,
      BillStateID: billingAddress.state,
      BillCountryID: billingAddress.country,
      SameShipTo: useDifferentShipping ? 0 : 1,
      ShipAddress1: shippingAddress.line1 || null,
      ShipAddress2: shippingAddress.line2 || null,
      ShipLandmark: shippingAddress.landmark || null,
      ShipPin: shippingAddress.pincode || null,
      ShipCity: shippingAddress.city || null,
      ShipStateID: shippingAddress.state,
      ShipCountryID: shippingAddress.country,
      PANNumber: null,
      TAXRegisteration: formData.customerType === "B2C" ? 0 : 1,
      TAXNo: null,
      BillingMethod: billingMethod,
      FittingPrice: fittingType,
      LoyaltyEnrollment: enableLoyalty,
      CreditBilling: enableCreditBilling,
      OpeningBalance: creditDetails.openingBalance,
      CreditLimit: creditDetails.creditLimit,
      CreditDays: creditDetails.creditDays,
      PaymentTerms: creditDetails.paymentTerms,
      OBType: creditBalanceType === "Dr" ? 0 : 1,
      IsActive: 1,
      EnableCustomerLogin: 1,
      CustomerType: formData.customerType === "B2C" ? 0 : 1,
      EnableLoyalty: enableLoyalty,
      CompanyID: locationById.data.data.Id,
      PatientDetails: finalPatientDetails.map((detail) => ({
        CustomerName: detail.name,
        MobileISDCode: "+91",
        MobNumber: detail.mobile,
        MobAlert: detail.MobAlert,
        Email: detail.email,
        EmailAlert: detail.email ? 1 : 0,
        DOB: detail.dob,
        Engraving: detail.engraving,
        Anniversary: detail.anniversary,
      })),
      FittingCharges:
        fittingType === 1
          ? rimTypes.flatMap((rim) =>
              indices
                .map((index) => ({
                  focality: 0,
                  indexIds: index.Id,
                  frameTypes: rim.Id,
                  amount: parseFloat(
                    fittingPrices.singleVision?.[rim.Id]?.[index.Id]
                  ),
                }))
                .concat(
                  indices.map((index) => ({
                    focality: 1,
                    indexIds: index.Id,
                    frameTypes: rim.Id,
                    amount: parseFloat(
                      fittingPrices.others?.[rim.Id]?.[index.Id]
                    ),
                  }))
                )
            )
          : [],
    };
  };

  return (
    <CustomerContext.Provider
      value={{
        formData,
        setFormData,
        constructPayload,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};
