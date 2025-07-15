import { createContext, useContext, useState } from "react";

const CustomerContext = createContext();

export const useCustomerContext = () => useContext(CustomerContext);

export const CustomerProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    location: "",
    name: "",
    legalName: "",
    customerType: "B2C",
    GSTINType: "0",
    GSTNumber: "",
    PANNumber: "",
    customerGroup: "",
    countryCode: "",
    telPhone: "",
    phone: "",
    email: "",
    sendAlert: false,
    sendPhoneAlert: false,
    customerUniqueId: "",
    BrandName: "",
    whatsAppGroupId: "",
    whatsappAlert: false,
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
    const finalPatientDetails =
      formData.customerType === "B2B"
        ? patientDetails.map((patient) => ({
            name: patient.name || null,
            mobile: patient.mobile || null,
            tel: patient.tel || null,
            email: patient.email || null,
            dob: patient.dob || null,
            engraving: patient.engraving || null,
            anniversary: patient.anniversary || null,
            MobAlert: patient.MobAlert || 0,
          }))
        : [
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
      CustomerName: formData.name ? formData.name : formData.legalName,
      CustomerUID: formData.customerUniqueId,
      CustomerBrand: formData.BrandName,
      CustomerGroupID: formData.customerGroup,
      Email: formData.email,
      EmailAlert: formData.sendAlert ? 1 : 0,
      MobileISDCode: formData.countryCode,
      MobNumber: formData.phone,
      MobAlert: formData.sendPhoneAlert ? 1 : 0,
      TelNumber: formData.telPhone,
      WAGroupID: formData.whatsAppGroupId,
      WAGroupAlert: formData.whatsappAlert ? 1 : 0,
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
      PANNumber: formData.PANNumber,
      TAXRegisteration:
        formData.customerType === "B2C" ? 0 : formData.GSTINType == 0 ? 1 : 0,
      TAXNo: formData.GSTNumber,
      BillingMethod: billingMethod,
      FittingPrice: fittingType,
      LoyaltyEnrollment: enableLoyalty,
      CreditBilling: enableCreditBilling,
      OpeningBalance: Number(creditDetails.openingBalance),
      CreditLimit: Number(creditDetails.creditLimit),
      CreditDays: Number(creditDetails.creditDays),
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

  const resetFormForCustomerType = () => {
    setFormData({
      location: "",
      name: "",
      legalName: "",
      customerType: "B2C",
      GSTINType: "0",
      GSTNumber: "",
      PANNumber: "",
      customerGroup: "",
      countryCode: "",
      telPhone: "",
      phone: "",
      email: "",
      sendAlert: false,
      sendPhoneAlert: false,
      customerUniqueId: "",
      BrandName: "",
      whatsAppGroupId: "",
      whatsappAlert: false,
    });
  };

  /* Vendor functionalities  */

  const [vendorFormData, setVendorFormData] = useState({
    CompanyID: "",
    gstStatus: 0,
    vendor_type: 0,
    gst_no: "",
    pan_no: "",
    legal_name: "",
    isServiceProvider: 0,
    isReverseChargeApplicable: 0,
    billingMethod: 0,
    vendor_address1: "",
    vendor_address2: "",
    vendor_landmark: "",
    vendor_pincode: "",
    vendor_city: "",
    vendor_state: "",
    vendor_country: "",
    email: "",
    mobileISDCode: "",
    mobile_no: "",
    telephone: "",
    other_contacts: [],
    FittingPrice: 0,
    fittingCharges: [],
    credit_form: 0,
    credit_days: "",
    opening_balance: "",
  });

  return (
    <CustomerContext.Provider
      value={{
        formData,
        setFormData,
        constructPayload,
        resetFormForCustomerType,
        vendorFormData,
        setVendorFormData,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};
