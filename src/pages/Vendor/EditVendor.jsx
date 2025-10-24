import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useGetAllLocationsQuery,
  useGetLocationByIdQuery,
} from "../../api/roleManagementApi";
import {
  useGetAllIndicesQuery,
  useGetCompanyIdQuery,
  useGetCountriesQuery,
  useGetIsdQuery,
  useGetStatesQuery,
} from "../../api/customerApi";
import { useVerifyGSTQuery } from "../../api/externalApi";
import { useGetAllRimTypeQuery } from "../../api/materialMaster";
import { useCustomerContext } from "../../features/customerContext";
import Button from "../../components/ui/Button";
import Select from "../../components/Form/Select";
import VendorForm from "./VendorForm";
import OtherContactDetails from "./OtherContactDetails";
import toast from "react-hot-toast";
import { Table, TableCell, TableRow } from "../../components/Table";
import { FiCopy, FiEdit2, FiEye, FiTrash2 } from "react-icons/fi";
import Checkbox from "../../components/Form/Checkbox";
import Radio from "../../components/Form/Radio";
import Input from "../../components/Form/Input";
import {
  useCreateVendorMutation,
  useGetAllVendorMutation,
  useUpdateVendorMutation,
} from "../../api/vendorApi";

const Section = ({ title, children }) => (
  <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6 space-y-4 mt-5">
    {title && <h2 className="text-xl font-semibold text-gray-800">{title}</h2>}
    {children}
  </div>
);

const EditVendor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const locations = useLocation();
  const isView = locations.pathname.includes("/view");
  const { vendorFormData, setVendorFormData } = useCustomerContext();
  const { hasMultipleLocations, user } = useSelector((state) => state.auth);
  const [location, setLocation] = useState(null);
  const [errors, setErrors] = useState({});
  const [verifyGst, setVerifyGst] = useState(false);
  const [isGstModalOpen, setIsGstModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // API Queries
  // const { data: vendoryIdData, isLoading: isVedorLoading } =
  //   useGetVendorByIdMutation({ id: id }, { skip: !id });
  const [getAllVendorById, { data: vendoryIdData, isLoading: isVedorLoading }] =
    useGetAllVendorMutation();

  const { data: allLocations } = useGetAllLocationsQuery();
  const { data: allCountries } = useGetCountriesQuery();
  const { data: allStates } = useGetStatesQuery();
  const { data: rimData, isLoading: isRimDataFetching } =
    useGetAllRimTypeQuery();
  const { data: indexData, isLoading: isIndexDataFetching } =
    useGetAllIndicesQuery();
  const { data: locationById } = useGetLocationByIdQuery(
    { id: location },
    { skip: !location }
  );
  const companyId = locationById?.data?.data.Id;
  const { data: companySettings } = useGetCompanyIdQuery(
    { id: companyId },
    { skip: !companyId }
  );
  const countrId = locationById?.data?.data.BillingCountryCode;
  const { data: countryIsd } = useGetIsdQuery(
    { id: locationById?.data.data.BillingCountryCode },
    { skip: !locationById?.data.data.BillingCountryCode }
  );
  const {
    data: GSTData,
    isLoading: isVerifyGSTLoading,
    error,
    isError,
  } = useVerifyGSTQuery(
    {
      clientId: companySettings?.data?.data.GSTSearchInstanceID,
      gstNo: vendorFormData.gst_no,
    },
    {
      skip: !(verifyGst && vendorFormData.gst_no?.length === 15),
    }
  );

  useEffect(() => {
    if (!id) return;

    const fetchVendorData = async () => {
      const payload = {
        id: id,
      };
      try {
        await getAllVendorById(payload);
      } catch (error) {
        console.log(error);
      }
    };

    fetchVendorData();
  }, [id]);

  const [createVendor, { isLoading: isVendorCreating }] =
    useCreateVendorMutation();
  const [updateVendor, { isLoading: isVendorUpdating }] =
    useUpdateVendorMutation();

  // Derived Data
  const rimTypes = useMemo(
    () => rimData?.data?.filter((r) => r.IsActive === 1) || [],
    [rimData?.data]
  );

  const indices = useMemo(() => indexData?.data?.data || [], [indexData?.data]);
  const companyType = locationById?.data?.data.CompanyType;
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
  useEffect(() => {
    if (!vendoryIdData?.data?.data || !rimTypes.length || !indices.length)
      return;

    const vendorData = vendoryIdData.data.data;

    // Prepare new form data
    const newFormData = {
      company_id: vendorData.CompanyID,
      vendor_type: vendorData.VendorType,
      legal_name: vendorData.VendorName,
      gst_no: vendorData.TAXNo,
      gstStatus: vendorData.TAXRegisteration,
      pan_no: vendorData.PANNumber,
      billingMethod: vendorData.BillingMethod,
      vendor_address1: vendorData.Address1,
      vendor_address2: vendorData.Address2,
      vendor_landmark: vendorData.Landmark,
      vendor_pincode: vendorData.Pin,
      vendor_city: vendorData.City,
      vendor_state: vendorData.StateID,
      vendor_country: vendorData.CountryID,
      email: vendorData.Email,
      mobile_no: vendorData.MobNumber,
      mobileISDcode: vendorData.MobileISDCode,
      tel_no: vendorData.TelNumber || "",
      isServiceProvider: vendorData.IsServiceProvider,
      isReverseChargeApplicable: vendorData.IsReverseChargeApplicable,
      FittingPrice: vendorData.FittingCharges,
      pOApproval: vendorData.POApproval,
      multiDelivery: vendorData.MultiDelivery,
      deliveryLocationId: vendorData.DeliveryLocationId,
      dCGRNPrice: vendorData.DCGRNPrice,
      OBType: vendorData.OBType,
      credit_form: vendorData.CreditFrom || 0,
      credit_days: vendorData.CreditDays || 0,
      opening_balance: vendorData.OpeningBalance || 0,
      other_contacts:
        vendorData.VendorContacts?.map((contact) => ({
          other_contact_name: contact.Name,
          other_contact_designation: contact.Designation,
          other_contact_email: contact.Email,
          other_contact_mobNumber: contact.MobNumber,
          other_contact_ISDcode: contact.MobileISDCode,
        })) || [],
    };

    // Only update form data if there are actual changes
    if (JSON.stringify(vendorFormData) !== JSON.stringify(newFormData)) {
      setVendorFormData(newFormData);
    }

    // Prepare new fitting prices
    const newFittingPrices = { singleVision: {}, others: {} };

    // Initialize with zeros
    rimTypes.forEach((rim) => {
      newFittingPrices.singleVision[rim.Id] = {};
      newFittingPrices.others[rim.Id] = {};
      indices.forEach((index) => {
        newFittingPrices.singleVision[rim.Id][index.Id] = 0;
        newFittingPrices.others[rim.Id][index.Id] = 0;
      });
    });

    // Fill with actual values from API
    vendorData?.OpticalFittingChargesPurchases?.forEach((charge) => {
      const focalityKey = charge.Focality === 0 ? "singleVision" : "others";
      if (
        newFittingPrices[focalityKey]?.[charge.RimType]?.[charge.IndexID] !==
        undefined
      ) {
        newFittingPrices[focalityKey][charge.RimType][charge.IndexID] =
          parseFloat(charge.Amount) || 0;
      }
    });

    // Only update fitting prices if there are actual changes
    if (JSON.stringify(fittingPrices) !== JSON.stringify(newFittingPrices)) {
      setFittingPrices(newFittingPrices);
    }

    // Set location if different
    if (location !== vendorData?.CompanyID) {
      setLocation(vendorData?.CompanyID);
    }
  }, [
    vendoryIdData,
    id,
    isVedorLoading,
    isIndexDataFetching,
    isRimDataFetching,
  ]);
  // Set default location if only one exists
  useEffect(() => {
    const locations = Array.isArray(hasMultipleLocations)
      ? hasMultipleLocations
      : hasMultipleLocations !== undefined && hasMultipleLocations !== null
      ? [hasMultipleLocations]
      : [];

    if (locations.length === 1 && !location) {
      setLocation(locations[0]);
    }
  }, [hasMultipleLocations, location, setLocation]);
  // Validation rules
  const validateVendorForm = () => {
    const newErrors = {};

    if (!vendorFormData.legal_name?.trim()) {
      newErrors.legal_name = "Legal name is required";
    }

    if (!vendorFormData.pan_no?.trim()) {
      newErrors.pan_no = "PAN number is required for Indian vendors";
    } else if (vendorFormData.pan_no.length !== 10) {
      newErrors.pan_no = "Invalid PAN number format";
    }
    if (vendorFormData.gstStatus === 1 || vendorFormData.gstStatus === 2) {
      if (!vendorFormData.gst_no?.trim()) {
        newErrors.gst_no = "GST number is required for registered vendors";
      }
    }

    if (!vendorFormData.vendor_address1?.trim()) {
      newErrors.vendor_address1 = "Address line 1 is required";
    }
    if (!vendorFormData.vendor_pincode?.trim()) {
      newErrors.vendor_pincode = "PIN code is required";
    } else if (
      !/^\d{6}$/.test(vendorFormData.vendor_pincode) &&
      vendorFormData.vendor_type === 0
    ) {
      newErrors.vendor_pincode = "PIN code must be 6 digits";
    }
    if (!vendorFormData.vendor_city?.trim()) {
      newErrors.vendor_city = "City is required";
    }
    if (!vendorFormData.vendor_state) {
      newErrors.vendor_state = "State is required";
    }
    if (!vendorFormData.vendor_country) {
      newErrors.vendor_country = "Country is required";
    }

    if (
      vendorFormData.multiDelivery === 0 &&
      !vendorFormData.deliveryLocationId
    ) {
      newErrors.deliveryLocationId = "Location should be mandatory";
    }

    const hasAnyContact =
      vendorFormData.email?.trim() ||
      vendorFormData.telephone?.trim() ||
      vendorFormData.mobile_no?.trim();
    if (!hasAnyContact) {
      newErrors.email = "At least one contact method is required";
      newErrors.telephone = "At least one contact method is required";
      newErrors.mobile_no = "At least one contact method is required";
    } else {
      if (
        vendorFormData.email?.trim() &&
        !/^\S+@\S+\.\S+$/.test(vendorFormData.email)
      ) {
        newErrors.email = "Invalid email format";
      }

      if (
        vendorFormData.mobile_no?.trim() &&
        !/^\d{10}$/.test(vendorFormData.mobile_no)
      ) {
        newErrors.mobile_no = "Mobile number must be 10 digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    console.log("handleSave triggered, id:", id);
    const isValid = validateVendorForm();

    if (!isValid) {
      toast.error("Please fix the validation errors before submitting.");
      return;
    }
    const payload = {
      ...vendorFormData,
      company_id:
        Number(companySettings?.data?.data.CompanyId) ||
        Number(vendorFormData.company_id),
      tax_registration: vendorFormData.gstStatus,

      vendor_state: Number(vendorFormData.vendor_state),
      vendor_country: Number(vendorFormData.vendor_country),
      other_contacts: vendorFormData.other_contacts || [],
      isServiceProvider: Number(vendorFormData.isServiceProvider),
      isReverseChargeApplicable: Number(
        vendorFormData.isReverseChargeApplicable
      ),
      credit_days: Number(vendorFormData.credit_days) || 0,
      opening_balance: Number(vendorFormData.opening_balance) || 0,
      ob_type: Number(vendorFormData.OBType),
    };
    if (vendorFormData.FittingPrice === 1) {
      const fittingCharges = Object.entries(fittingPrices).flatMap(
        ([focality, rimTypes]) => {
          const focalityValue = focality === "singleVision" ? 0 : 1;
          return Object.entries(rimTypes).flatMap(([rimId, indices]) =>
            Object.entries(indices).map(([indexId, amount]) => ({
              focality: focalityValue,
              indexIds: Number(indexId),
              frameTypes: Number(rimId),
              amount: Number(amount),
            }))
          );
        }
      );
      if (fittingCharges.length > 0) {
        payload.fittingCharges = fittingCharges;
      }
    }

    try {
      if (id) {
        console.log(payload);
        await updateVendor({ id, userId: user.Id, payload }).unwrap();
        toast.success("Vendor updated successfully");
        navigate(-1);
      } else {
        await createVendor({ id: user.Id, payload }).unwrap();
        toast.success("Vendor created successfully");
        navigate(-1);
      }
    } catch (error) {
      console.error("Error in handleSave:", error);
      toast.error(
        error?.data?.message || "Something went wrong with saving Vendor!"
      );
    }
  };

  // GST Verification
  const handleVerifyGST = () => {
    console.log("coming to handle");
    if (companySettings?.data?.data?.GSTSerachEnable === 0) {
      toast.error("GST verification is disabled. Please contact the admin.");
      return;
    }
    if (!vendorFormData.gst_no || vendorFormData.gst_no.length !== 15) {
      toast.error("Please enter a valid 15-digit GST number.");
      return;
    }
    setVerifyGst(true);
  };

  // Handle GST Verification Response
  useEffect(() => {
    if (GSTData?.data) {
      setVerifyGst(false);
      setIsGstModalOpen(true);
    } else if (error || isError) {
      setVerifyGst(false);
      setIsGstModalOpen(true);
      toast.error("The entered GST number is not valid.");
    }
  }, [GSTData, error, isError]);

  // Handle Other Contact Details
  const handleOtherContactDetails = (detail, index) => {
    if (detail === null) {
      // Delete contact
      setVendorFormData((prev) => ({
        ...prev,
        other_contacts: prev.other_contacts.filter((_, i) => i !== index),
      }));
    } else {
      // Add or update contact
      setVendorFormData((prev) => ({
        ...prev,
        other_contacts:
          editingIndex !== null
            ? prev.other_contacts.map((item, i) =>
                i === editingIndex ? detail : item
              )
            : [...prev.other_contacts, detail],
      }));
    }
    setEditingIndex(null);
    setIsModalOpen(false);
  };

  // Handle Fitting Price Changes
  const handlePriceChange = (focality, rimId, indexId, value) => {
    if (value < 0) return;
    setFittingPrices((prev) => ({
      ...prev,
      [focality]: {
        ...prev[focality],
        [rimId]: {
          ...prev[focality][rimId],
          [indexId]: parseFloat(value) || 0,
        },
      },
    }));
  };

  // Copy Single Vision Prices to Others
  const handleCopyPrices = () => {
    setFittingPrices((prev) => ({
      ...prev,
      others: JSON.parse(JSON.stringify(prev.singleVision)),
    }));
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVendorFormData((prev) => ({
      ...prev,
      [name]: type === "radio" ? parseInt(value) : value,
    }));
  };
  // Render Fitting Price Table
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
      <div className="overflow-x-auto">
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
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

  if (isVedorLoading || isRimDataFetching || isIndexDataFetching)
    return <h1>Vendor loading</h1>;
  return (
    <div className="max-w-7xl p-6 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Vendor Information
        </h2>
        <Button className="" variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      {/* Location Selector */}
      {Array.isArray(hasMultipleLocations) &&
        hasMultipleLocations.length > 1 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <Select
              label="Location"
              name="location"
              value={location || ""}
              onChange={(e) => setLocation(e.target.value)}
              options={allLocations?.data?.filter((loc) =>
                hasMultipleLocations.includes(loc.Id)
              )}
              optionValue="Id"
              optionLabel="LocationName"
              defaultOption="Select Location"
              className="max-w-md"
              required
            />
          </div>
        )}
      {locationById?.data && (
        <div>
          {/* Vendor Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-3">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Vendor Information
            </h3>
            <VendorForm
              formData={vendorFormData}
              setFormData={setVendorFormData}
              errors={errors}
              setErrors={setErrors}
              handleVerifyGST={handleVerifyGST}
              countries={allCountries?.country}
              states={allStates?.country}
              isVerifyGSTLoading={isVerifyGSTLoading}
              countryIsd={countryIsd}
              isView={isView}
            />
          </div>

          {/* Other Contact Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Other Contact Details
              </h3>
             {!isView && <Button onClick={() => setIsModalOpen(true)}>Add Contact</Button>}
            </div>
            <Table
              columns={[
                "S.No",
                "Name",
                "Designation",
                "Mobile No",
                "Email ID",
                "Actions",
              ]}
              data={vendorFormData.other_contacts || []}
              renderRow={(detail, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{detail.other_contact_name}</TableCell>
                  <TableCell>{detail.other_contact_designation}</TableCell>
                  <TableCell>{detail.other_contact_mobNumber}</TableCell>
                  <TableCell>{detail.other_contact_email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <FiEye
                        className="text-xl cursor-pointer text-blue-500 hover:text-blue-700"
                        onClick={() =>
                          toast.info("View functionality not implemented yet.")
                        }
                      />
                      <FiEdit2
                        className="text-xl cursor-pointer text-neutral-600 hover:text-green-600"
                        onClick={() => {
                          setEditingIndex(index);
                          setIsModalOpen(true);
                        }}
                      />
                      <FiTrash2
                        className="text-xl cursor-pointer text-neutral-600 hover:text-red-600"
                        onClick={() => handleOtherContactDetails(null, index)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )}
            />
          </div>

          {/* OtherContactDetails Modal */}
          <OtherContactDetails
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingIndex(null);
            }}
            onSave={handleOtherContactDetails}
            initialData={
              editingIndex !== null
                ? vendorFormData.other_contacts[editingIndex]
                : null
            }
            countries={allCountries?.country || []}
            countryIsd={countryIsd}
          />

          {/* Fitting Price Configuration */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-4 mb-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Fitting Price Configuration
            </h3>
            <Checkbox
              label="Is Fitting Charges Applicable"
              name="FittingPrice"
              checked={vendorFormData.FittingPrice === 1}
              onChange={(e) =>
                setVendorFormData((prev) => ({
                  ...prev,
                  FittingPrice: e.target.checked ? 1 : 0,
                }))
              }
                disabled={isView}
            />
            {vendorFormData.FittingPrice === 1 && (
              <div className="space-y-6 mt-4">
                {renderFittingTable("Single Vision", "singleVision")}
                {renderFittingTable("Other Focal Types", "others", true)}
              </div>
            )}
          </div>

          <Section title="Purchase Order (PO)">
            <div className="flex flex-col gap-5 mt-5">
              <div className="flex items-center gap-3">
                <label>Approval Required</label>
                <Radio
                  label="No"
                  name="pOApproval"
                  value="0"
                  onChange={handleChange}
                  checked={vendorFormData.pOApproval === 0}
                    disabled={isView}
                />
                <Radio
                  label="Yes"
                  name="pOApproval"
                  value="1"
                  onChange={handleChange}
                  checked={vendorFormData.pOApproval === 1}
                    disabled={isView}
                />
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <label>Multi-Delivery Delivery</label>
                  <Radio
                    label="No"
                    name="multiDelivery"
                    value="0"
                    onChange={handleChange}
                    checked={vendorFormData.multiDelivery === 0}
                      disabled={isView}
                  />
                  <Radio
                    label="Yes"
                    name="multiDelivery"
                    value="1"
                    onChange={handleChange}
                    checked={vendorFormData.multiDelivery === 1}
                      disabled={isView}
                  />
                </div>
                {vendorFormData.multiDelivery === 0 && (
                  <div className="w-1/2">
                    <Select
                      label="Select Location *"
                      name="deliveryLocationId"
                      value={vendorFormData.deliveryLocationId}
                      options={allLocations?.data}
                      optionLabel="LocationName"
                      optionValue="Id"
                      onChange={(e) =>
                        setVendorFormData((prev) => ({
                          ...prev,
                          deliveryLocationId: e.target.value,
                        }))
                      }
                      defaultOption="Select Location"
                      error={errors.deliveryLocationId}
                        disabled={isView}
                    />
                  </div>
                )}
              </div>
            </div>
          </Section>
          {/* credit charge details */}
          <Section title="Accounting Details">
            <div>
              <div className="flex gap-5 mt-5 flex-col">
                <div className="flex gap-3 items-center">
                  <label className="font-medium text-gray-700">
                    Credit From:
                  </label>
                  <div className="flex gap-3">
                    <Radio
                      label="Delivery date"
                      name="credit_form"
                      value="0"
                      checked={vendorFormData.credit_form === 0}
                      onChange={handleChange}
                        disabled={isView}
                    />
                    <Radio
                      label="Invoice date"
                      name="credit_form"
                      value="1"
                      checked={vendorFormData.credit_form === 1}
                      onChange={handleChange}
                        disabled={isView}
                    />
                  </div>
                </div>
                <div className="flex gap-5 items-center">
                  <div>
                    <Input
                      label="Credit Days"
                      name="credit_days"
                      value={vendorFormData.credit_days}
                      onChange={handleChange}
                      placeholder="Enter Credit days"
                      error={errors.credit_days}
                        disabled={isView}
                    />
                  </div>
                  <div>
                    <Input
                      label="Opening Balance"
                      name="opening_balance"
                      value={vendorFormData.opening_balance}
                      onChange={handleChange}
                      placeholder="Enter Opening balance"
                      error={errors.opening_balance}
                        disabled={isView}
                    />
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="flex gap-3">
                      <Radio
                        label="DR"
                        name="OBType"
                        value="0"
                        checked={vendorFormData.OBType === 0}
                        onChange={handleChange}
                          disabled={isView}
                      />
                      <Radio
                        label="CR"
                        name="OBType"
                        value="1"
                        checked={vendorFormData.OBType === 1}
                        onChange={handleChange}
                          disabled={isView}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        {!isView &&  <div className="mt-8 flex justify-end">
            <Button
              onClick={handleSave}
              loadingText={
                isVendorCreating ? "Creating Vendor..." : "Vendor Updating..."
              }
              isLoading={isVendorCreating || isVendorUpdating}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm"
            >
              {id ? "Update" : "Save"}
            </Button>
          </div>}

          {/* GST Address Selector Modal */}
          {isGstModalOpen && GSTData?.data?.data && (
            <GstAddressSelector
              gstData={GSTData.data.data}
              onCopy={(data) => {
                setVendorFormData((prev) => ({
                  ...prev,
                  vendor_address1: data.bnm + data.bno,
                  vendor_address2: data.st,
                  legal_name: data.name,
                  vendor_pincode: data.pncd,
                }));
                setIsGstModalOpen(false);
              }}
              onCancel={() => setIsGstModalOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 bg-opacity-50 p-4">
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
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="radio"
                  name="address"
                  checked={selectedIndex === index}
                  onChange={() => setSelectedIndex(index)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
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
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={selectedIndex === null}
            onClick={() => onCopy(addresses[selectedIndex])}
          >
            Copy Address
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditVendor;
