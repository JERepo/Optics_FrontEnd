import { createContext, useContext, useState } from "react";

const CustomerContext = createContext();

export const useCustomerContext = () => useContext(CustomerContext);

export const CustomerProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    location: null,
    name: null,
    legalName: null,
    customerType: "B2C",
    GSTINType: 0,
    GSTNumber: null,
    PANNumber: null,
    customerGroup: null,
    countryCode: null,
    telPhone: null,
    phone: null,
    email: null,
    sendAlert: false,
    sendPhoneAlert: false,
    customerUniqueId: null,
    BrandName: null,
    whatsAppGroupId: null,
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
              MobAlert: parseInt(patient.MobAlert) || 0,
            })),
          ];

    return {
      CustomerCode: null,
      CustomerName: formData.name ? formData.name : formData.legalName,
      CustomerUID: formData.customerUniqueId,
      CustomerBrand: formData.BrandName,
      CustomerGroupID: parseInt(formData.customerGroup),
      Email: formData.email,
      EmailAlert: formData.sendAlert ? 1 : 0,
      MobileISDCode: formData.countryCode,
      MobNumber: formData.phone,
      MobAlert: formData.sendPhoneAlert ? 1 : 0,
      TelNumber: formData.telPhone,
      WAGroupID: parseInt(formData.whatsAppGroupId),
      WAGroupAlert: formData.whatsappAlert ? 1 : 0,
      BillAddress1: billingAddress.line1,
      BillAddress2: billingAddress.line2,
      BillLandmark: billingAddress.landmark,
      BillPin: billingAddress.pincode,
      BillCity: billingAddress.city,
      BillStateID: parseInt(billingAddress.state),
      BillCountryID: parseInt(billingAddress.country),
      SameShipTo: useDifferentShipping ? 0 : 1,
      ShipAddress1: shippingAddress.line1 || null,
      ShipAddress2: shippingAddress.line2 || null,
      ShipLandmark: shippingAddress.landmark || null,
      ShipPin: shippingAddress.pincode || null,
      ShipCity: shippingAddress.city || null,
      ShipStateID: parseInt(shippingAddress.state),
      ShipCountryID: parseInt(shippingAddress.country),
      PANNumber: formData.PANNumber,
      TAXRegisteration:
        formData.customerType === "B2C" ? 0 : formData.GSTINType == 0 ? 1 : 0,
      TAXNo: formData.GSTNumber,
      BillingMethod: parseInt(billingMethod),
      FittingPrice: parseInt(fittingType),
      LoyaltyEnrollment: parseInt(enableLoyalty),
      CreditBilling: parseInt(enableCreditBilling),
      OpeningBalance: Number(creditDetails.openingBalance),
      CreditLimit: Number(creditDetails.creditLimit),
      CreditDays: Number(creditDetails.creditDays),
      PaymentTerms: creditDetails.paymentTerms,
      OBType: creditBalanceType === "Dr" ? 0 : 1,
      IsActive: 1,
      EnableCustomerLogin: 1,
      CustomerType: formData.customerType === "B2C" ? 0 : 1,
      EnableLoyalty: parseInt(enableLoyalty),
      CompanyID: parseInt(locationById.data.data.Id),
      PatientDetails: finalPatientDetails.map((detail) => ({
        CustomerName: detail.name,
        MobileISDCode: "+91",
        MobNumber: detail.mobile,
        MobAlert: parseInt(detail.MobAlert),
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
      location: null,
      name: null,
      legalName: null,
      customerType: "B2C",
      GSTINType: 0,
      GSTNumber: null,
      PANNumber: null,
      customerGroup: null,
      countryCode: null,
      telPhone: null,
      phone: null,
      email: null,
      sendAlert: false,
      sendPhoneAlert: false,
      customerUniqueId: null,
      BrandName: null,
      whatsAppGroupId: null,
      whatsappAlert: false,
    });
  };

  /* Vendor functionalities  */

  const [vendorFormData, setVendorFormData] = useState({
    company_id: null,
    gstStatus: 1,
    vendor_type: 0,
    tax_registration: null,
    gst_no: null,
    pan_no: null,
    legal_name: null,
    isServiceProvider: 0,
    isReverseChargeApplicable: 0,
    billingMethod: 0,
    vendor_address1: null,
    vendor_address2: null,
    vendor_landmark:null,
    vendor_pincode: null,
    vendor_city: null,
    vendor_state: null,
    vendor_country: null,
    email: null,
    mobileISDCode: null,
    mobile_no: null,
    telephone: null,
    other_contacts: [],
    FittingPrice: 0,
    fittingCharges: [],
    OBType: 0,
    credit_form: 0,
    credit_days: null,
    opening_balance: null,
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
