import React, { useEffect, useState } from "react";
import {
  FiEye,
  FiEdit2,
  FiCopy,
  FiTrash2,
  FiX,
  FiCreditCard,
} from "react-icons/fi";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { useCustomerContext } from "../../features/customerContext";
import {
  useCreateCustomerMutation,
  useGetAllIndicesQuery,
  useGetCompanyIdQuery,
  useGetCountriesQuery,
  useGetIsdQuery,
  useGetStatesQuery,
  useGetAllCompanyLocationsQuery,
  useGetCustomerByIdQuery,
  useGetInvoiceDataQuery,
  useUpdateCreditLimitMutation,
  useUpdateCustomerMutation,
  useUpdatePatientMutation,
} from "../../api/customerApi";
import { useGetAllCustomerGroupsQuery } from "../../api/customerGroup";
import {
  useGetAllLocationsQuery,
  useGetLocationByIdQuery,
} from "../../api/roleManagementApi";
import { useGetAllRimTypeQuery } from "../../api/materialMaster";
import CustomerForm from "./CustomerForm";
import PatientDetails from "./PatientDetails";
import BillingAddress from "./BillingAddress";
import { Table, TableCell, TableRow } from "../../components/Table";
import Button from "../../components/ui/Button";
import { useLocation, useNavigate, useParams } from "react-router";
import { useVerifyGSTQuery } from "../../api/externalApi";
import Modal from "../../components/ui/Modal";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import Input from "../../components/Form/Input";
import HasPermission from "../../components/HasPermission";
import Toggle from "../../components/ui/Toggle";
import Radio from "../../components/Form/Radio";

// Validation functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone, countryCode) =>
  countryCode === "+91" ? /^\d{10}$/.test(phone) : phone.length >= 10;
const validateDate = (date) => {
  if (!date) return true;
  const inputDate = new Date(date);
  return inputDate < new Date() && !isNaN(inputDate);
};
const validatePincode = (pincode) => /^\d{6}$/.test(pincode);

const Customer = ({ isPop, onSubmit }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isCreate = location.pathname.includes("/create");
  const isEdit = location.pathname.includes("/edit");
  const { formData, setFormData, constructPayload, resetFormForCustomerType } =
    useCustomerContext();
  const { hasMultipleLocations, user } = useSelector((state) => state.auth);

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [patientDetails, setPatientDetailsData] = useState([]);
  const [errors, setErrors] = useState({});
  const [fittingType, setFittingType] = useState(0);
  const [enableLoyalty, setEnableLoyalty] = useState(0);
  const [billingMethod, setBillingMethod] = useState(0);
  const [enableCreditBilling, setEnableCreditBilling] = useState(0);
  const [creditBalanceType, setCreditBalanceType] = useState("Dr");
  const [useDifferentShipping, setUseDifferentShipping] = useState(false);
  const [isGstModalOpen, setIsGstModalOpen] = useState(false);
  const [verifyGst, setVerifyGst] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [filteredCustomerGroups, setFilteredCustomerGroups] = useState([]);
  const [isCreditLimitOpened, setIsCreditLimitOpened] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [creditLimit, setCreditLimit] = useState(null);
  const [isGMOpen, setIsGMOpen] = useState(false);
  const [isMobile, setIsMobile] = useState("");
  const [currentStatus, setCurrentStatus] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [isPatientStatusModalOpen, setIsPatientStatusStatusOpen] =
    useState(false);

  // Address states
  const [billingAddress, setBillingAddress] = useState({
    line1: null,
    line2: null,
    landmark: null,
    pincode: null,
    city: null,
    country: null,
    state: null,
  });

  const [shippingAddress, setShippingAddress] = useState({
    line1: null,
    line2: null,
    landmark: null,
    pincode: null,
    city: null,
    country: null,
    state: null,
  });

  const [creditDetails, setCreditDetails] = useState({
    openingBalance: 0,
    creditLimit: 0,
    creditDays: 0,
    paymentTerms: null,
  });

  // API Queries
  const { data: customerGroups } = useGetAllCustomerGroupsQuery();
  const { data: allLocations } = useGetAllLocationsQuery();
  const { data: allCountries } = useGetCountriesQuery();
  const { data: allStates } = useGetStatesQuery();
  const { data: rimData } = useGetAllRimTypeQuery();
  const { data: indexData } = useGetAllIndicesQuery();
  const [createCustomer, { isLoading: isCreating }] =
    useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] =
    useUpdateCustomerMutation();
  const { data: locationById } = useGetLocationByIdQuery(
    { id: formData?.location },
    { skip: !formData.location }
  );
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
  const { data: allCustomerGroupIds } = useGetAllCompanyLocationsQuery();
  const {
    data: GSTData,
    isLoading: isVerifyGSTLoading,
    error,
    isError,
  } = useVerifyGSTQuery(
    {
      clientId: companySettings?.data?.data.GSTSearchInstanceID,
      gstNo: formData.GSTNumber,
    },
    {
      skip: !(verifyGst && formData.GSTNumber.length === 15),
    }
  );

  const { data: customerById, isLoading: isCustomerByIdLoading } =
    useGetCustomerByIdQuery({ id: id }, { skip: !id });
  const { data: invoiceData } = useGetInvoiceDataQuery(
    { id: id },
    { skip: !id }
  );
  const [deActivate, { isLoading: isDeActivating }] =
    useUpdatePatientMutation();

  const invoice = invoiceData?.data?.data;
  // Derived data
  const rimTypes = rimData?.data?.filter((r) => r.IsActive === 1) || [];
  const indices = indexData?.data?.data || [];

  // Initialize fitting prices
  const [fittingPrices, setFittingPrices] = useState(() => {
    const initialPrices = { singleVision: {}, others: {} };
    rimTypes.forEach((rim) => {
      initialPrices.singleVision[rim.Id] = {};
      initialPrices.others[rim.Id] = {};
      indices.forEach((index) => {
        initialPrices.singleVision[rim.Id][index.Id] = 0;
        initialPrices.others[rim.Id][index.Id] = 0;
      });
    });
    return initialPrices;
  });

  // Prefill form with customer data
  useEffect(() => {
    if (customerById && !isCustomerByIdLoading) {
      const customer = customerById?.data?.data;
      setFormData({
        ...formData,
        location: customer.CompanyID,
        name: customer.CustomerName || null,
        legalName: customer.CustomerName || null,
        customerType: customer.CustomerType == 0 ? "B2C" : "B2B",
        GSTINType: String(customer.TAXRegisteration) || 0,
        GSTNumber: customer.TAXNo || null,
        PANNumber: customer.PANNumber || null,
        customerGroup: customer.CustomerGroupID || null,
        countryCode: customer.MobileISDCode || "+91",
        telPhone: customer.TelNumber || null,
        phone: customer.MobNumber || null,
        email: customer.Email || null,
        sendAlert: false,
        sendPhoneAlert: false,
        customerUniqueId: customer.CustomerUID || null,
        BrandName: customer.CustomerBrand || null,
        whatsAppGroupId: customer.WAGroupID || null,
        whatsappAlert: customer.WAGroupAlert || 0,
      });

      setBillingAddress({
        line1: customer.BillAddress1 || null,
        line2: customer.BillAddress2 || null,
        landmark: customer.BillLandmark || null,
        pincode: customer.BillPin || null,
        city: customer.BillCity || "",
        country: customer.BillCountryID || null,
        state: customer.BillStateID || null,
      });

      setShippingAddress({
        line1: customer.ShipAddress1 || null,
        line2: customer.ShipAddress2 || null,
        landmark: customer.ShipLandmark || null,
        pincode: customer.ShipPin || null,
        city: customer.ShipCity || "",
        country: customer.ShipCountryID || null,
        state: customer.ShipStateID || null,
      });

      setUseDifferentShipping(customer.SameShipTo === 0);
      setFittingType(customer.FittingPrice || 0);
      setEnableLoyalty(customer.LoyaltyEnrollment || 0);
      setBillingMethod(customer.BillingMethod || 0);
      setEnableCreditBilling(customer.CreditBilling || 0);
      setCreditLimit(customer?.CreditLimit || 0);

      setCreditDetails({
        openingBalance: parseFloat(customer.OpeningBalance) || 0,
        creditLimit: parseInt(customer.CreditLimit) || 0,
        creditDays: customer.CreditDays || 0,
        paymentTerms: customer.PaymentTerms || null,
      });

      setCreditBalanceType(customer.OBType == 0 ? "Dr" : "Cr");

      setPatientDetailsData(
        customer.CustomerContactDetails?.map((contact) => ({
          Id: contact?.Id,
          name: contact.CustomerName || null,
          email: contact.Email || null,
          // emailAlert: contact.EmailAlert || 0,
          mobile: contact.MobNumber || null,
          MobAlert: contact.MobAlert || 0,
          MobileISDCode: contact.MobileISDCode || "+91",
          dob: contact.DOB || null,
          engraving: contact.Engraving || null,
          anniversary: contact.Anniversary || null,
          IsActive: contact.IsActive,
        })) || []
      );

      // Initialize fitting prices if available
      if (customer.OpticalFittingChargesSales?.length > 0) {
        const newFittingPrices = { singleVision: {}, others: {} };

        rimTypes.forEach((rim) => {
          newFittingPrices.singleVision[rim.Id] = {};
          newFittingPrices.others[rim.Id] = {};

          indices.forEach((index) => {
            // find all fittings for this rim + index
            const fittings = customer.OpticalFittingChargesSales.filter(
              (f) => f.RimType === rim.Id && f.IndexID === index.Id
            );

            // default values
            newFittingPrices.singleVision[rim.Id][index.Id] = 0;
            newFittingPrices.others[rim.Id][index.Id] = 0;

            fittings.forEach((fitting) => {
              if (fitting.Focality === 0) {
                // Single Vision
                newFittingPrices.singleVision[rim.Id][index.Id] =
                  parseFloat(fitting.Amount) || 0;
              } else if (fitting.Focality === 1) {
                // Others (progressive, bifocal, etc.)
                newFittingPrices.others[rim.Id][index.Id] =
                  parseFloat(fitting.Amount) || 0;
              }
            });
          });
        });

        setFittingPrices(newFittingPrices);
      }
    }
  }, [customerById]);
  useEffect(() => {
    const allMatching = allCustomerGroupIds?.data?.data.filter(
      (c) => c.CustomerPoolID === CustomerPoolID
    );

    const matchingCompanyIds = allMatching?.map((item) => item.CompanyId);

    const filteredGroups = customerGroups?.data?.data.filter((group) =>
      matchingCompanyIds?.includes(group.CompanyID)
    );

    if (filteredGroups) {
      setFilteredCustomerGroups(filteredGroups);
    }

    if (!customerById) {
      setFormData((prev) => ({
        ...prev,
        customerGroup: companySettings?.data?.data?.CustomerGroupDefault,
      }));
    }
  }, [allCustomerGroupIds, CustomerPoolID, customerById]);

  useEffect(() => {
    if (!customerById) {
      setFormData((prev) => ({
        ...prev,
        customerType: companyType === 0 ? "B2B" : "B2C",
      }));
    }
  }, [locationById, companyType, customerById]);

  // Set default location if only one exists
  useEffect(() => {
    const locations = Array.isArray(hasMultipleLocations)
      ? hasMultipleLocations
      : hasMultipleLocations !== undefined && hasMultipleLocations !== null
      ? [hasMultipleLocations]
      : [];

    if (locations.length === 1 && !formData.location && !customerById) {
      setFormData((prev) => ({
        ...prev,
        location: locations[0],
      }));
    }
  }, [hasMultipleLocations, formData.location, setFormData, customerById]);

  // Handlers
  const handleVerifyGST = () => {
    if (companySettings?.data?.data?.GSTSerachEnable === 0) {
      toast.error("GST verification is disabled. Please contact the admin.");
      return;
    }
    setVerifyGst(true);
  };

  useEffect(() => {
    if (GSTData?.data) {
      setVerifyGst(false);
      setIsGstModalOpen(true);
      setSelectedIndex(null);
    } else if (error || isError) {
      setVerifyGst(false);
      setIsGstModalOpen(true);
      toast.error("The Entered GST Number is not valid");
    }
  }, [GSTData, error, isError]);

  // Reset fields when customerType or GSTINType changes
  useEffect(() => {
    if (isCreate) {
      setFormData((prev) => {
        const updatedFormData = { ...prev };

        if (prev.customerType === "B2C") {
          updatedFormData.legalName = null;
          updatedFormData.GSTNumber = null;
          updatedFormData.PANNumber = null;
          updatedFormData.GSTINType = 0;
        } else if (prev.customerType === "B2B") {
          updatedFormData.name = null;
        }

        if (prev.GSTINType === 1) {
          updatedFormData.GSTNumber = null;
        }

        return updatedFormData;
      });

      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        if (formData.customerType === "B2C") {
          delete newErrors.legalName;
          delete newErrors.GSTNumber;
          delete newErrors.PANNumber;
        } else if (formData.customerType === "B2B") {
          delete newErrors.name;
        }
        if (formData.GSTINType === 1) {
          delete newErrors.GSTNumber;
        }
        return newErrors;
      });
    }
  }, [
    formData.customerType,
    formData.GSTINType,
    setFormData,
    setErrors,
    isCreate,
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updatedFormData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        if (name === "name" && value && value.length >= 2)
          delete newErrors.name;
        if (name === "email" && value && validateEmail(value))
          delete newErrors.email;
        if (
          name === "phone" &&
          value &&
          validatePhone(value, formData.countryCode)
        )
          delete newErrors.phone;
        if (name === "customerType" && value) delete newErrors.customerType;
        if (name === "customerGroup" && value) delete newErrors.customerGroup;
        return newErrors;
      });
      return updatedFormData;
    });
  };

  const handleCreditDetailChange = (e) => {
    const { name, value } = e.target;
    setCreditDetails((prev) => {
      const updatedCreditDetails = { ...prev, [name]: value };
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        if (name === "openingBalance" && value >= 0)
          delete newErrors.openingBalance;
        if (name === "creditLimit" && value >= 0) delete newErrors.creditLimit;
        if (name === "creditDays" && value >= 0) delete newErrors.creditDays;
        if (name === "paymentTerms" && value && value.length >= 5)
          delete newErrors.paymentTerms;
        return newErrors;
      });
      return updatedCreditDetails;
    });
  };

  const handleAddDetail = (detail) => {
    if (detail === null) {
      setPatientDetailsData((prev) =>
        prev.filter((_, i) => i !== editingIndex)
      );
    } else {
      setPatientDetailsData((prev) =>
        editingIndex !== null
          ? prev.map((item, i) => (i === editingIndex ? detail : item))
          : [...prev, detail]
      );
    }

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      if (patientDetails.length > 0 || detail === null) {
        delete newErrors.patientDetails;
      }
      return newErrors;
    });

    setEditingIndex(null);
    setIsModalOpen(false);
  };

  const handlePriceChange = (focality, rimId, indexId, value) => {
    if (value < 0) return;
    setFittingPrices((prev) => ({
      ...prev,
      [focality]: {
        ...prev[focality],
        [rimId]: {
          ...(prev[focality][rimId] || {}),
          [indexId]: value,
        },
      },
    }));
  };
  const handleOpenCredit = () => {
    console.log(creditLimit);
    setSelectedItem({
      Id: id,
      CreditLimit: creditLimit,
      openingBalance: creditDetails.openingBalance,
      data: customerById?.data?.data,
    });
    setIsCreditLimitOpened(true);
  };
  const handleCopyPrices = () => {
    setFittingPrices((prev) => ({
      ...prev,
      others: JSON.parse(JSON.stringify(prev.singleVision)),
    }));
  };

  const handleDeleteDetail = (index) => {
    if (
      window.confirm("Are you sure you want to delete this patient detail?")
    ) {
      setPatientDetailsData((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const validateAll = () => {
    const newErrors = {};
    if (formData.customerType === "B2C") {
      if (!formData.name || formData.name.trim().length < 2) {
        newErrors.name = "Name is required and must be at least 2 characters";
      } else if (formData.name.length > 100) {
        newErrors.name = "Name cannot exceed 100 characters";
      }
    }

    if (formData.customerType === "B2B") {
      if (!formData.legalName || formData.legalName.trim().length === 0) {
        newErrors.legalName = "Legal name is required";
      } else if (formData.legalName.length > 100) {
        newErrors.legalName = "Legal name cannot exceed 100 characters";
      }
    }

    // if (formData.customerType === "B2B" && formData.GSTINType == 0) {
    //   if (!formData.GSTNumber) {
    //     newErrors.GSTNumber = "GSTIN number is required for B2B customers";
    //   } else if (formData.GSTNumber.length !== 15) {
    //     newErrors.GSTNumber = "GSTIN number should be 15 characters long";
    //   }
    // }
    if (formData.customerType === "B2B" && formData.GSTINType == 1) {
      delete newErrors.GSTNumber; // Explicitly clear GSTNumber error for Un-registered
    }
    if (formData.customerType === "B2B" && formData.GSTINType == 1) {
      if (!formData.GSTNumber) {
        newErrors.GSTNumber = "GSTIN number is required for B2B customers";
      } else if (formData.GSTNumber.length !== 15) {
        newErrors.GSTNumber = "GSTIN number should be 15 characters long";
      }
    }
    if (formData.customerType === "B2B") {
      if (!formData.PANNumber) {
        newErrors.PANNumber = "PANNumber is required for B2B customers";
      } else if (formData.PANNumber.length !== 10) {
        newErrors.PANNumber = "PANNumber should be 10 characters long";
      }
    }

    if (formData.email?.length > 150) {
      newErrors.email = "Email cannot exceed 150 characters";
    }

    if (formData.telPhone?.length > 15) {
      newErrors.telPhone = "Telephone number cannot exceed 15 characters";
    }
    if (formData.BrandName?.length > 100) {
      newErrors.BrandName = "Brand name cannot exceed 100 characters";
    }

    if (formData.customerUniqueId?.length > 50) {
      newErrors.customerUniqueId = "Unique Id cannot exceed 50 characters";
    }
    if (formData.whatsAppGroupId?.length > 50) {
      newErrors.whatsAppGroupId = "whatsAppGroupId cannot exceed 50 characters";
    }
    if (
      !formData.phone ||
      !validatePhone(formData.phone, formData.countryCode)
    ) {
      newErrors.phone = "Valid phone number is required (10 digits for +91)";
    }

    if (!formData.customerType) {
      newErrors.customerType = "Customer type is required";
    }

    if (customerGroups?.data?.data.length && !formData.customerGroup) {
      newErrors.customerGroup = "Customer group is required";
    }

    if (!billingAddress.line1) {
      newErrors.billingaddressLine1 = "Billing Address 1 is required";
    } else if (billingAddress.line1.length > 150) {
      newErrors.billingaddressLine1 =
        "Billing Address 1 cannot exceed 150 characters";
    }

    if (billingAddress.line2?.length > 150) {
      newErrors.billingaddressLine2 =
        "Billing Address 2 cannot exceed 150 characters";
    }

    if (billingAddress.landmark?.length > 150) {
      newErrors.billingaddressLandmark =
        "Landmark cannot exceed 150 characters";
    }

    if (!billingAddress.city) {
      newErrors.billingaddressCity = "Billing city is required";
    } else if (billingAddress.city.length > 100) {
      newErrors.billingaddressCity =
        "Billing city cannot exceed 100 characters";
    }

    if (!billingAddress.pincode || !validatePincode(billingAddress.pincode)) {
      newErrors.billingaddressPincode = "Valid 6-digit pincode is required";
    }

    if (!billingAddress.country) {
      newErrors.billingaddressCountry = "Billing country is required";
    }

    if (!billingAddress.state) {
      newErrors.billingaddressState = "Billing state is required";
    }

    if (useDifferentShipping) {
      if (!shippingAddress.line1) {
        newErrors.shippingaddressLine1 = "Shipping address line 1 is required";
      } else if (shippingAddress.line1.length > 150) {
        newErrors.shippingaddressLine1 =
          "Shipping address line 1 cannot exceed 150 characters";
      }

      if (shippingAddress.line2?.length > 150) {
        newErrors.shippingaddressLine2 =
          "Shipping address line 2 cannot exceed 150 characters";
      }

      if (shippingAddress.landmark?.length > 150) {
        newErrors.shippingaddressCity =
          "Shipping landmark cannot exceed 150 characters";
      }

      if (!shippingAddress.city) {
        newErrors.shippingaddressCity = "Shipping city is required";
      }

      if (
        !shippingAddress.pincode ||
        !validatePincode(shippingAddress.pincode)
      ) {
        newErrors.shippingaddressPincode = "Valid 6-digit pincode is required";
      }

      if (!shippingAddress.country) {
        newErrors.shippingaddressCountry = "Shipping country is required";
      }

      if (!shippingAddress.state) {
        newErrors.shippingaddressState = "Shipping state is required";
      }
      if (billingAddress.state != shippingAddress.state) {
        newErrors.shippingaddressState =
          "Both Billing Address state and shipping address state should be same";
      }
    }

    if (enableCreditBilling === 1) {
      if (
        creditDetails.openingBalance === undefined ||
        creditDetails.openingBalance === null ||
        creditDetails.openingBalance < 0
      ) {
        newErrors.openingBalance =
          "Opening balance is required and cannot be negative";
      }

      if (
        creditDetails.creditLimit === undefined ||
        creditDetails.creditLimit === null ||
        creditDetails.creditLimit < 0
      ) {
        newErrors.creditLimit =
          "Credit limit is required and cannot be negative";
      }

      if (
        creditDetails.creditDays === undefined ||
        creditDetails.creditDays === null ||
        creditDetails.creditDays < 0
      ) {
        newErrors.creditDays =
          "Credit days are required and cannot be negative";
      }

      if (!creditBalanceType) {
        newErrors.creditBalanceType = "Balance type (Dr/Cr) is required";
      }
    }

    if (
      formData.customerType === "B2B" &&
      companyType === 1 &&
      patientDetails.length === 0
    ) {
      newErrors.patientDetails =
        "At least one patient detail is required for B2B customers";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const requestToggle = (id, status) => {
    setSelectedPatientId(id);
    setCurrentStatus(status);
    setIsPatientStatusStatusOpen(true);
  };
  useEffect(() => {
    if (formData.forceUpdate) {
      handleSave();
    }
  }, [formData.forceUpdate]);

  const handleConfirmMobileOrGSTToggle = () => {
    setFormData((prev) => ({
      ...prev,
      forceUpdate: true,
    }));
    setIsGMOpen(false);
  };

  const handleConfirmToggle = async () => {
    try {
      await deActivate({
        customerId: parseInt(id),
        payload: {
          patientId: selectedPatientId,
          isActive: currentStatus ? 0 : 1,
        },
      }).unwrap();

      // Update local state
      const updated = patientDetails?.map((item) =>
        item.Id === selectedPatientId
          ? { ...item, IsActive: currentStatus ? 0 : 1 }
          : item
      );
      setPatientDetailsData(updated);
    } catch (error) {
      console.error("Toggle error:", error);
    } finally {
      setIsPatientStatusStatusOpen(false);
      setSelectedPatientId(null);
      setCurrentStatus(null);
    }
  };

  const handleSave = async () => {
    if (!validateAll()) {
      toast.error("Please fix the validation errors before saving.");
      return;
    }

    const payload = constructPayload(
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
      locationById,
      isEdit
    );

    console.log(payload);
    try {
      if (!id) {
        const response = await createCustomer({
          id: user.Id,
          payload: payload,
        }).unwrap();

        if (isPop) {
          onSubmit(null, response);
        }
        toast.success("Customer data saved successfully!");
        navigate(-1);
      } else {
        const res = await updateCustomer({
          payload: payload,
          userId: user.Id,
          customerId: id,
        }).unwrap();

        toast.success("Customer data updated successfully!");
        navigate(-1);
      }
      resetFormForCustomerType();
    } catch (error) {
      console.error(error);
      if (error?.data?.error?.warning) {
        setIsMobile(error?.data?.error?.field);
        setIsGMOpen(true);
        return;
      }
      toast.error(
        "Unable to update the customer please try again after some time!"
      );
    }
  };
  const renderFittingTable = (
    focalityLabel,
    focalityKey,
    showCopyButton = false
  ) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
          {focalityLabel} Fitting Prices
        </h3>
        {showCopyButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPrices}
            className="flex items-center gap-2"
          >
            <FiCopy size={16} />
            Copy from Single Vision
          </Button>
        )}
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 border-b border-gray-200 text-left font-medium text-gray-600">
                Rim Type
              </th>
              {indices.map((index) => (
                <th
                  key={index.Id}
                  className="p-3 border-b border-gray-200 text-left font-medium text-gray-600"
                >
                  {index.Index}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rimTypes.map((rim) => (
              <tr key={rim.Id} className="hover:bg-gray-50">
                <td className="p-3 border-b border-gray-200 font-medium text-gray-700">
                  {rim.FrameRimTypeName}
                </td>
                {indices.map((index) => (
                  <td key={index.Id} className="p-3 border-b border-gray-200">
                    <input
                      type="number"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={
                        fittingPrices[focalityKey]?.[rim.Id]?.[index.Id] ?? 0
                      }
                      onChange={(e) =>
                        handlePriceChange(
                          focalityKey,
                          rim.Id,
                          index.Id,
                          e.target.value
                        )
                      }
                      min="0"
                      step="0.01"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {isCreate ? "Create Customer" : "Update Customer"}
        </h2>
        {!isPop && (
          <Button className="" variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
        )}
      </div>
      {Array.isArray(hasMultipleLocations) &&
        hasMultipleLocations.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Select Location
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={handleChange}
              value={formData.location}
              name="location"
            >
              <option value="">Select location</option>
              {allLocations?.data
                ?.filter((loc) => hasMultipleLocations.includes(loc.Id))
                .map((loc) => (
                  <option key={loc.Id} value={loc.Id}>
                    {loc.LocationName}
                  </option>
                ))}
            </select>
          </div>
        )}
      {locationById?.data && (
        <div>
          <CustomerForm
            formData={formData}
            handleChange={handleChange}
            locations={allLocations}
            customerGroups={filteredCustomerGroups}
            pooId={CustomerPoolID}
            hasMultipleLocations={hasMultipleLocations}
            countryCodes={allCountries?.country}
            errors={errors}
            countryIsd={countryIsd}
            setFormData={setFormData}
            setErrors={setErrors}
            companyType={locationById?.data}
            handleVerifyGST={handleVerifyGST}
            isVerifyGSTLoading={isVerifyGSTLoading}
            invoice={invoice}
            isEdit={isEdit}
            customerData={customerById?.data?.data}
          />

          <div className="mt-8">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">
                {companyType === 0
                  ? "Other Contact details"
                  : "Patient Details"}
              </h2>
              <Button onClick={() => setIsModalOpen(true)}>Add Details</Button>
            </div>

            <Table
              columns={[
                "S.No",
                "Name",
                "Mobile No",
                "Email Id",
                ...(companyType === 1
                  ? ["DOB", "Engraving", "Anniversary"]
                  : []),
                "Action",
              ]}
              data={patientDetails}
              renderRow={(detail, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{detail.name}</TableCell>
                  <TableCell>{detail.mobile}</TableCell>
                  <TableCell>{detail.email}</TableCell>

                  {companyType === 1 && (
                    <>
                      <TableCell>{detail.dob}</TableCell>
                      <TableCell>{detail.engraving}</TableCell>
                      <TableCell>{detail.anniversary}</TableCell>
                    </>
                  )}

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <FiEye className="text-xl cursor-pointer text-blue-500 hover:text-blue-700" />
                      <button
                        className="text-neutral-600 hover:text-green-600"
                        aria-label="Edit"
                        onClick={() => {
                          setEditingIndex(index);
                          setIsModalOpen(true);
                        }}
                      >
                        <FiEdit2 size={18} />
                      </button>
                      {/* <HasPermission module="Customer" action="deactivate"> */}
                      <Toggle
                        enabled={detail.IsActive === 1}
                        onToggle={() =>
                          requestToggle(detail.Id, detail.IsActive)
                        }
                      />
                      {/* </HasPermission> */}
                      {!isEdit && (
                        <button
                          className="text-neutral-600 hover:text-red-600"
                          aria-label="Delete"
                          onClick={() => handleDeleteDetail(index)}
                        >
                          <FiTrash2 size={18} />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            />
          </div>

          <PatientDetails
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingIndex(null);
            }}
            onSave={handleAddDetail}
            initialData={
              editingIndex !== null ? patientDetails[editingIndex] : null
            }
            validateEmail={validateEmail}
            validateDate={validateDate}
            validatePhone={validatePhone}
            validatePincode={validatePincode}
            countries={allCountries?.country}
            countryIsd={countryIsd}
            companyType={locationById?.data}
          />
          {errors.patientDetails && (
            <span className="error text-red-500">{errors.patientDetails}</span>
          )}
          <BillingAddress
            billing={billingAddress}
            setBilling={setBillingAddress}
            shipping={shippingAddress}
            setShipping={setShippingAddress}
            useDifferentShipping={useDifferentShipping}
            setUseDifferentShipping={setUseDifferentShipping}
            errors={errors}
            setErrors={setErrors}
            validatePincode={validatePincode}
            countries={allCountries?.country}
            states={allStates?.country}
            countryIsd={countryIsd}
            formData={formData}
            locationData={locationById?.data}
          />

          <div className="mt-10">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Fitting Price Configuration
              </h2>

              <div className="flex gap-6 mb-8">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="fittingType"
                    value="0"
                    checked={fittingType === 0}
                    onChange={() => setFittingType(0)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-gray-700">Standard Price</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="fittingType"
                    value="1"
                    checked={fittingType === 1}
                    onChange={() => setFittingType(1)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={
                      companySettings?.data.data.FittingChargesSales === 0
                    }
                  />
                  <span className="ml-2 text-gray-700">Fixed Price</span>
                </label>
              </div>

              {fittingType === 1 && (
                <div className="space-y-6">
                  {renderFittingTable("Single Vision", "singleVision")}
                  {renderFittingTable("Other Focal Types", "others", true)}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 items-center mt-5">
            Enable Loyalty :
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="loyalty"
                  value="1"
                  checked={enableLoyalty === 1}
                  onChange={() => setEnableLoyalty(1)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-gray-700">Enable</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="loyalty"
                  value="0"
                  checked={enableLoyalty === 0}
                  onChange={() => setEnableLoyalty(0)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-gray-700">Disable</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 items-center mt-5">
            Billing Method:
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="billingMethod"
                  value="0"
                  checked={billingMethod === 0}
                  onChange={() => setBillingMethod(0)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-gray-700">Invoice</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="billingMethod"
                  value="1"
                  checked={billingMethod === 1}
                  onChange={() => setBillingMethod(1)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={companySettings?.data.data.DCBilling === 0}
                />
                <span className="ml-2 text-gray-700">Direct challan(DC)</span>
              </label>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Credit Billing
              </h2>
              {customerById?.data?.data.CreditBilling === 1 && (
                <div onClick={handleOpenCredit}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:shadow-xs transition-all"
                    icon={FiCreditCard}
                    iconPosition="left"
                    aria-label="Credit Limit"
                  >
                    Credit Limit
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2 items-center mb-4">
              <span className="text-gray-700">Enable Credit Billing:</span>
              <div className="flex items-center gap-3 ml-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="creditBilling"
                    value="1"
                    checked={enableCreditBilling === 1}
                    onChange={() => setEnableCreditBilling(1)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={companySettings?.data.data.CreditBilling === 0}
                  />
                  <span className="ml-2 text-gray-700">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="creditBilling"
                    value="0"
                    checked={enableCreditBilling === 0}
                    onChange={() => setEnableCreditBilling(0)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-gray-700">No</span>
                </label>
              </div>
            </div>

            {enableCreditBilling === 1 && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opening Balance*
                    </label>
                    <input
                      type="number"
                      name="openingBalance"
                      value={creditDetails.openingBalance}
                      onChange={handleCreditDetailChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      disabled={customerById?.data?.data?.CreditBilling === 1}
                    />
                    {errors.openingBalance && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.openingBalance}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Balance Type
                    </label>
                    <div className="flex gap-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="creditBalanceType"
                          value="Dr"
                          checked={creditBalanceType === "Dr"}
                          onChange={() => setCreditBalanceType("Dr")}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          disabled={
                            customerById?.data?.data?.CreditBilling === 1
                          }
                        />
                        <span className="ml-2 text-gray-700">Debit (Dr)</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="creditBalanceType"
                          value="Cr"
                          checked={creditBalanceType === "Cr"}
                          onChange={() => setCreditBalanceType("Cr")}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          disabled={
                            customerById?.data?.data?.CreditBilling === 1
                          }
                        />
                        <span className="ml-2 text-gray-700">Credit (Cr)</span>
                      </label>
                    </div>
                    {errors.creditBalanceType && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.creditBalanceType}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Limit*
                    </label>
                    <input
                      type="number"
                      name="creditLimit"
                      value={creditDetails.creditLimit}
                      onChange={handleCreditDetailChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      disabled={customerById?.data?.data?.CreditBilling === 1}
                    />
                    {errors.creditLimit && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.creditLimit}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Days*
                    </label>
                    <input
                      type="number"
                      name="creditDays"
                      value={creditDetails.creditDays}
                      onChange={handleCreditDetailChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                    {errors.creditDays && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.creditDays}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms*
                  </label>
                  <textarea
                    name="paymentTerms"
                    value={creditDetails.paymentTerms}
                    onChange={handleCreditDetailChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter payment terms and conditions"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleSave}
              loadingText={
                isCreate ? "Saving Customer.." : "Updating Customer.."
              }
              isLoading={isCreating || isUpdating}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm"
            >
              {isCreate
                ? "Save Customer Information"
                : "Update Customer Information"}
            </Button>
          </div>
        </div>
      )}
      <ApplyCreditLimit
        isOpen={isCreditLimitOpened}
        onClose={() => {
          setIsCreditLimitOpened(false);
          setSelectedItem(null);
        }}
        creditLimit={selectedItem}
      />
      {isGstModalOpen && GSTData?.data?.data && (
        <GstAddressSelector
          gstData={GSTData.data.data}
          onCopy={(data) => {
            setFormData((prev) => ({
              ...prev,
              legalName: data.name,
              GSTNumber: data.gstNo,
            }));
            setBillingAddress((prev) => ({
              ...prev,
              line1: data.bnm + data.bno,
              line2: data.st,
              pincode: data.pncd,
              city: data.loc || "",
            }));
            setIsGstModalOpen(false);
          }}
          onCancel={() => setIsGstModalOpen(false)}
        />
      )}
      <ConfirmationModal
        isOpen={isGMOpen}
        onClose={() => {
          setIsGMOpen(false);
        }}
        onConfirm={handleConfirmMobileOrGSTToggle}
        title={
          isMobile == "MobNumber"
            ? "Mobile Number Exist Warning!"
            : "GSTNo Exist Warning!"
        }
        message={
          isMobile != "MobNumber"
            ? "Another customer exists with the same GSTNo. Do you still wish to continue?"
            : "Another customer exists with the same Mobile Number. Do you still wish to continue?"
        }
        confirmText="Continue"
        danger={false}
      />
      <ConfirmationModal
        isOpen={isPatientStatusModalOpen}
        onClose={() => setIsPatientStatusStatusOpen(false)}
        onConfirm={handleConfirmToggle}
        title={`Are you sure you want to ${
          currentStatus ? "deactivate" : "activate"
        } this patient?`}
        message={`This will ${
          currentStatus ? "deactivate" : "activate"
        } the Patient.`}
        confirmText={currentStatus ? "Deactivate" : "Activate"}
        danger={currentStatus}
        isLoading={isDeActivating}
      />
    </div>
  );
};

export default Customer;

const GstAddressSelector = ({ gstData, onCopy, onCancel }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const addresses = [
    {
      ...gstData.pradr.addr,
      name: gstData.lgnm,
      gstNo: gstData.gstin,
      type: "Primary",
    },
    ...(gstData.adadr || []).map((addr) => ({
      ...addr.addr,
      name: gstData.lgnm,
      gstNo: gstData.gstin,
      type: "Additional",
    })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-80 bg-white/80">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            GST Verification Details
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Select an address to copy to the form
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {addresses.map((addr, index) => (
            <div
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                selectedIndex === index
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="radio"
                  name="address"
                  checked={selectedIndex === index}
                  onChange={() => setSelectedIndex(index)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        addr.type === "Primary"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {addr.type}
                    </span>
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                      {addr.gstNo}
                    </span>
                  </div>
                  <h3 className="mt-2 font-medium text-gray-900">
                    Legal Name: {addr.name}
                  </h3>
                  <div className="mt-2 text-sm text-gray-700 space-y-1">
                    <p>
                      Address 1:{" "}
                      {[addr.bnm, addr.bno].filter(Boolean).join(" ")}
                    </p>
                    <p>Address 2: {addr.st}</p>
                    <p>Pincode: {addr.pncd}</p>
                    <p>State: {addr.stcd}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <FiX size={16} />
            Cancel
          </button>
          <button
            disabled={selectedIndex === null}
            onClick={() => onCopy(addresses[selectedIndex])}
            className="cursor-pointer px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <FiCopy size={16} />
            Copy the value
          </button>
        </div>
      </div>
    </div>
  );
};

const ApplyCreditLimit = ({ isOpen, onClose, creditLimit }) => {
  console.log("d", creditLimit);
  const [newCreditLimit, setNewCreditLimit] = useState(0);
  const [openingBalance, setOpeningBalance] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creditBalanType, setCreditBalanType] = useState(0);
  const [higher, setHigher] = useState(false);

  const [updateCreditLimit, { isLoading: isCreditUpdating }] =
    useUpdateCreditLimitMutation();

  useEffect(() => {
    if (creditLimit?.openingBalance !== undefined) {
      setOpeningBalance(creditLimit.openingBalance);
    }
    setCreditBalanType(Number(creditLimit?.data?.OBType));
    console.log("creditBalanceType after:", Number(creditLimit?.data?.OBType));
  }, [creditLimit]);
  const handleNewCredit = (e) => {
    const value = e.target.value;
    if (isNaN(value) || parseFloat(value) < 0) return;
    setNewCreditLimit(value);
  };

  const handleUpdateCredit = () => {
    const currentLimit = parseFloat(creditLimit?.CreditLimit || 0);
    const newLimit = parseFloat(newCreditLimit || 0);
    if (newLimit < currentLimit) {
      setIsModalOpen(true);
    } else {
      saveCreditLimit(newLimit);
    }
  };

  const saveCreditLimit = async (limit) => {
    try {
      const payload = {
        id: creditLimit.Id,
        newCreditLimit: parseFloat(limit) || 0,
        currentOpeningBalance: parseFloat(creditLimit?.openingBalance),
        newOpeningBalance: parseFloat(openingBalance) || 0,
        OBType: creditBalanType,
      };
      const res = await updateCreditLimit({ payload }).unwrap();
      toast.success(res?.data?.message || "creditLimit updated successfully!");
      onClose();
      setNewCreditLimit(0);
    } catch (err) {
      console.error("Failed to update credit limit", err);
      toast.error(err?.data?.error || "Customer Not found");
    }
  };

  const handleConfirmToggle = () => {
    setHigher(true);
    saveCreditLimit(parseFloat(newCreditLimit));
    setIsModalOpen(false);
  };
  console.log(creditBalanType);
  return (
    <div>
      <Modal isOpen={isOpen} onClose={onClose}>
        <h2 className="text-lg font-semibold mb-4">Update Credit Limit</h2>
        <div className="flex flex-col gap-5 mt-5">
          <div>
            <Input
              label="Opening Balance"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Balance Type
            </label>
            <div className="flex gap-4">
              <Radio
                label="Debit (Dr)"
                name="cc"
                value="0" // Change from "0" to 0
                checked={creditBalanType == 0} // Use strict equality for clarity
                onChange={() => setCreditBalanType(0)}
              />
              <Radio
                label="Credit (Cr)"
                name="cc"
                value="1" // Change from "1" to 1
                checked={creditBalanType == 1} // Use strict equality
                onChange={() => setCreditBalanType(1)}
              />
            </div>
          </div>
          <Input
            label="Current Credit Limit"
            value={creditLimit?.CreditLimit}
            disabled
          />
          <Input
            label="Credit Limit Available"
            value={creditLimit?.data?.CustomerCreditLimit?.CreditLimitAvl}
            disabled
          />
          <Input
            name="credit"
            label="New Credit Limit"
            value={newCreditLimit}
            onChange={handleNewCredit}
          />
          <Button
            disabled={isCreditUpdating}
            isLoading={isCreditUpdating}
            onClick={handleUpdateCredit}
          >
            Save
          </Button>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setHigher(false);
        }}
        onConfirm={handleConfirmToggle}
        title="New Credit Limit value is less than the current limit"
        message="Are you sure you want to continue?"
        confirmText="Continue"
        danger={false}
      />
    </div>
  );
};
