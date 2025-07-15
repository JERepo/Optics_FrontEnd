import React, { useEffect, useState } from "react";
import { FiEye, FiEdit2, FiCopy, FiTrash2, FiX } from "react-icons/fi";
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
import { useNavigate } from "react-router";
import { useVerifyGSTQuery } from "../../api/externalApi";
import Modal from "../../components/ui/Modal";

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

const Customer = () => {
  const navigate = useNavigate();
  // State and context
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

  // Address states
  const [billingAddress, setBillingAddress] = useState({
    line1: "",
    line2: "",
    landmark: "",
    pincode: "",
    city: "",
    country: "",
    state: "",
  });

  const [shippingAddress, setShippingAddress] = useState({
    line1: "",
    line2: "",
    landmark: "",
    pincode: "",
    city: "",
    country: "",
    state: "",
  });

  const [creditDetails, setCreditDetails] = useState({
    openingBalance: 0,
    creditLimit: 0,
    creditDays: 0,
    paymentTerms: "",
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

  // Location data
  const { data: locationById } = useGetLocationByIdQuery(
    { id: formData?.location },
    { skip: !formData.location }
  );
  const companyType = locationById?.data?.data.CompanyType;

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      customerType: companyType === 0 ? "B2B" : "B2C",
    }));
  }, [locationById, companyType]);
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

  useEffect(() => {
    const exactDefaultId = allCustomerGroupIds?.data?.data.find(
      (c) => c.CustomerPoolID === CustomerPoolID
    );
    const allMatching = allCustomerGroupIds?.data?.data.filter(
      (c) => c.CustomerPoolID === CustomerPoolID
    );

    // Get an array of matching CompanyIDs
    const matchingCompanyIds = allMatching?.map((item) => item.CompanyId);

    // Filter customer groups by matching CompanyID
    const filteredGroups = customerGroups?.data?.data.filter((group) =>
      matchingCompanyIds?.includes(group.CompanyID)
    );

    if (filteredGroups) {
      setFilteredCustomerGroups(filteredGroups);
    }

    setFormData((prev) => ({
      ...prev,
      customerGroup: exactDefaultId?.CustomerGroupDefault,
    }));
  }, [allCustomerGroupIds, CustomerPoolID]);

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

  // Set default location if only one exists
  useEffect(() => {
    const locations = Array.isArray(hasMultipleLocations)
      ? hasMultipleLocations
      : hasMultipleLocations !== undefined && hasMultipleLocations !== null
      ? [hasMultipleLocations]
      : [];

    if (locations.length === 1 && !formData.location) {
      setFormData((prev) => ({
        ...prev,
        location: locations[0],
      }));
    }
  }, [hasMultipleLocations, formData.location, setFormData]);

  // Handlers

  const handleVerifyGST = () => {
    if (companySettings?.data?.data?.GSTSerachEnable === 0) {
      // setErrors((prev) => ({
      //   ...prev,
      //   GSTNumber:
      //     "GST searching or verification is not enabled. Please contact the admin.",
      // }));
      toast.error("GST verification is disabled. Please contact the admin.");
      return;
    }
    setVerifyGst(true);
  };
  useEffect(() => {
    if (GSTData?.data) {
      setVerifyGst(false); // reset after fetch
      setIsGstModalOpen(true);
      setSelectedIndex(null);
    } else if (error || isError) {
      setVerifyGst(false);
      setIsGstModalOpen(true);
      toast.error("The Entered GST Number is not valid");
    }
  }, [GSTData, error, isError]);

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
    // Handle deletion case
    if (detail === null) {
      setPatientDetailsData((prev) =>
        prev.filter((_, i) => i !== editingIndex)
      );
    }
    // Handle update or add new
    else {
      setPatientDetailsData((prev) =>
        editingIndex !== null
          ? prev.map((item, i) => (i === editingIndex ? detail : item))
          : [...prev, detail]
      );
    }

    // Clear patient details error if we have any entries now
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

    if (formData.customerType === "B2B" && formData.GSTINType == 0) {
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

    if (formData.email.length > 150) {
      newErrors.email = "Email cannot exceed 150 characters";
    }

    if (formData.telPhone.length > 15) {
      newErrors.telPhone = "Telephone number cannot exceed 15 characters";
    }
    if (formData.BrandName.length > 100) {
      newErrors.BrandName = "Brand name cannot exceed 100 characters";
    }

    if (formData.customerUniqueId.length > 50) {
      newErrors.customerUniqueId = "Unique Id cannot exceed 50 characters";
    }
    if (formData.whatsAppGroupId.length > 50) {
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

    // Billing address validations

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

    // Shipping address validations
    if (useDifferentShipping) {
      if (!shippingAddress.line1) {
        newErrors.shippingaddressLine1 = "Shipping address line 1 is required";
      } else if (shippingAddress.line1.length > 150) {
        newErrors.shippingaddressLine1 =
          "Shipping address line 1 cannot exceed 150 characters";
      }

      if (shippingAddress.line2.length > 150) {
        newErrors.shippingaddressLine2 =
          "Shipping address line 2 cannot exceed 150 characters";
      }

      if (shippingAddress.landmark.length > 150) {
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
    }

    // Credit details validations
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

      if (
        !creditDetails.paymentTerms ||
        creditDetails.paymentTerms.trim().length < 5
      ) {
        newErrors.paymentTerms =
          "Payment terms are required and must be at least 5 characters";
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
      locationById
    );

    try {
      await createCustomer({
        id: user.Id,
        payload: payload,
      }).unwrap();
      toast.success("Form data saved successfully!");
      navigate(-1);
    } catch (error) {
      console.error(error);
      toast.error("Customer creation failed");
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
          Customer Information
        </h2>
        <Button className="" variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
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
          />

          {/* Patient Details Section */}
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
                      <FiEye
                        className="text-xl cursor-pointer text-blue-500 hover:text-blue-700"
                        // onClick={() => handleViewDetail(detail)}
                      />
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
                      <button
                        className="text-neutral-600 hover:text-red-600"
                        aria-label="Delete"
                        onClick={() => handleDeleteDetail(index)}
                      >
                        <FiTrash2 size={18} />
                      </button>
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
          {/* Billing Address */}
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
          />

          {/* Fitting Price Section */}
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

          {/* Loyalty point */}
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

          {/* Billing method */}
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

          {/* Credit Billing */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Credit Billing
            </h2>

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
                  {errors.paymentTerms && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.paymentTerms}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm"
            >
              Save Customer Information
            </Button>
          </div>
        </div>
      )}
      {isGstModalOpen && GSTData?.data?.data && (
        <GstAddressSelector
          gstData={GSTData.data.data}
          onCopy={(data) => {
            console.log("copy data", data);
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
    </div>
  );
};

export default Customer;

const GstAddressSelector = ({ gstData, onCopy, onCancel }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Combine primary and additional addresses
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
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            GST Verification Details
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Select an address to copy to the form
          </p>
        </div>

        {/* Address List */}
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

        {/* Footer with Actions */}
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
