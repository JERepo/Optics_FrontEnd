import React, { useEffect } from "react";
import Radio from "../../components/Form/Radio";
import Input from "../../components/Form/Input";
import Checkbox from "../../components/Form/Checkbox";
import Button from "../../components/ui/Button";
import Select from "../../components/Form/Select";
import { useLazyGetPinCodeQuery } from "../../api/customerApi";

// Section Wrapper for clean layout
const Section = ({ title, children }) => (
  <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6 space-y-4">
    {title && <h2 className="text-xl font-semibold text-gray-800">{title}</h2>}
    {children}
  </div>
);

const VendorForm = ({
  formData,
  setFormData,
  errors,
  setErrors,
  handleVerifyGST,
  countries,
  states,
  isVerifyGSTLoading,
  countryIsd,
  isView
}) => {
  const [getPinCode, { isFetching: isFetchingPincode }] =
    useLazyGetPinCodeQuery();

  // Auto-fill ISD code
  useEffect(() => {
    if (countryIsd?.country?.ISDCode) {
      setFormData((prev) => ({
        ...prev,
        mobileISDCode: countryIsd?.country?.ISDCode,
        vendor_country: countryIsd?.country?.Id,
      }));
    }
  }, [countryIsd, setFormData]);

  useEffect(() => {
    if (formData.vendor_pincode && formData.vendor_type === 0) {
      fetchLocationByPincode(formData.vendor_pincode);
    }
  }, [formData.vendor_pincode]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      pan_no: formData.gst_no?.substring(2, 12),
    }));
  }, [formData.gst_no]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
            ? 1
            : 0
          : type === "radio"
          ? parseInt(value)
          : name.includes("gst_no") || name.includes("pan_no")
          ? value.toUpperCase()
          : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const fetchLocationByPincode = async () => {
    const pincode = formData.vendor_pincode;

    if (!/^\d{6}$/.test(pincode)) {
      setErrors((prev) => ({
        ...prev,
        vendor_pincode: "Please enter a valid 6-digit PIN code.",
      }));
      return;
    }

    // Clear pincode error before calling API
    setErrors((prev) => ({
      ...prev,
      vendor_pincode: "",
    }));

    try {
      const response = await getPinCode({ pincode }).unwrap();
      if (response?.success && response.data.length > 0) {
        const location = response.data[0];
        const matchedCountry = countries.find(
          (c) =>
            c.CountryName.toLowerCase() ===
            location.CountryName?.trim().toLowerCase()
        );
        const matchedState = states.find(
          (s) =>
            s.StateCode == location?.StateId ||
            s.StateName.toLowerCase() ===
              location?.StateName?.trim().toLowerCase()
        );

        setFormData((prev) => ({
          ...prev,
          vendor_city: location.CityName || prev.vendor_city,
          vendor_state: matchedState?.Id || prev.vendor_state,
          vendor_country: matchedCountry?.Id || prev.vendor_country,
        }));

        setErrors((prev) => ({
          ...prev,
          vendor_city: "",
          vendor_state: "",
          vendor_country: "",
          vendor_pincode: "",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          vendor_pincode: "No location found for this PIN code.",
        }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        vendor_pincode: "Failed to fetch location. Please try again.",
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Vendor Type */}
      <Section title="Billing Details">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-700">
              Vendor Type Field*
            </label>
            <div className="flex gap-6">
              <Radio
                label="Indian"
                name="vendor_type"
                value="0"
                checked={formData.vendor_type === 0}
                onChange={handleChange}
                disabled={isView}
              />
              <Radio
                label="International"
                name="vendor_type"
                value="1"
                checked={formData.vendor_type === 1}
                onChange={handleChange}
                  disabled={isView}
              />
            </div>
          </div>
          <div className="grid grid-cols-1">
            <div className="grid grid-cols-2 mb-5">
              <div>
                <label className="font-medium text-gray-700">
                  IsReverse Charges Applicable *
                </label>
                <div className="flex gap-6 mt-2">
                  <Radio
                    label="No"
                    name="isReverseChargeApplicable"
                    value="0"
                    checked={formData.isReverseChargeApplicable === 0}
                    onChange={handleChange}
                      disabled={isView}
                  />
                  <Radio
                    label="Yes"
                    name="isReverseChargeApplicable"
                    value="1"
                    checked={formData.isReverseChargeApplicable === 1}
                    onChange={handleChange}
                      disabled={isView}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-5">
                <div>
                  <label className="font-medium text-gray-700">
                    Billing Method *
                  </label>
                  <div className="flex gap-6 mt-2">
                    <Radio
                      label="Invoice"
                      name="billingMethod"
                      value="0"
                      checked={formData.billingMethod === 0}
                      onChange={handleChange}
                        disabled={isView}
                    />
                    <Radio
                      label="Delivery Challan (DC)"
                      name="billingMethod"
                      value="1"
                      checked={formData.billingMethod === 1}
                      onChange={handleChange}
                        disabled={isView}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2">
              <Checkbox
                label="Is Service Provider?"
                name="isServiceProvider"
                checked={formData.isServiceProvider === 1}
                onChange={handleChange}
                className="mt-5"
                  disabled={isView}
              />
              {formData.billingMethod === 1 && (
                <div className="flex items-center gap-3">
                  <label>Show Buying Price</label>
                  <Radio
                    label="No"
                    name="dCGRNPrice"
                    value="0"
                    onChange={handleChange}
                    checked={formData.dCGRNPrice === 0}
                      disabled={isView}
                  />
                  <Radio
                    label="Yes"
                    name="dCGRNPrice"
                    value="1"
                    onChange={handleChange}
                    checked={formData.dCGRNPrice === 1}
                      disabled={isView}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* GST and PAN */}
      <Section title="GST Details">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-700">GSTIN Status *</label>
            <div className="flex gap-6">
              <Radio
                label="Registered"
                name="gstStatus"
                value="1"
                checked={formData.gstStatus === 1}
                onChange={handleChange}
                  disabled={isView}
              />
              <Radio
                label="Unregistered"
                name="gstStatus"
                value="0"
                checked={formData.gstStatus === 0}
                onChange={handleChange}
                  disabled={isView}
              />
              <Radio
                label="Composite"
                name="gstStatus"
                value="2"
                checked={formData.gstStatus === 2}
                onChange={handleChange}
                  disabled={isView}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-10">
            {(formData.gstStatus === 1 || formData.gstStatus === 2) && (
              <div className="flex gap-3 items-center ">
                <Input
                  label="GST Number *"
                  name="gst_no"
                  value={formData.gst_no}
                  onChange={handleChange}
                  placeholder="Enter GSTIN"
                  error={errors.gst_no}
                  className="w-full"
                    disabled={isView}
                />
                <Button
                  onClick={handleVerifyGST}
                  disabled={isVerifyGSTLoading || isFetchingPincode || isView}
                >
                  {isVerifyGSTLoading ? "Verifying..." : "Verify"}
                </Button>
              </div>
            )}

            <Input
              label={`PAN Number ${formData.vendor_type === 0 ? "*" : ""}`}
              name="pan_no"
              value={formData.pan_no}
              onChange={handleChange}
              placeholder="Enter PAN Number"
              error={errors.pan_no}
                disabled={isView}
            />
          </div>
        </div>
      </Section>

      {/* Address */}
      <Section title="Vendor Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Legal Name *"
            name="legal_name"
            value={formData.legal_name}
            onChange={handleChange}
            placeholder="Enter Legal Name"
            className=""
            error={errors.legal_name}
              disabled={isView}
          />
          <div></div>
          <Input
            label="Address 1 *"
            name="vendor_address1"
            value={formData.vendor_address1}
            onChange={handleChange}
            placeholder="Enter Address 1"
            error={errors.vendor_address1}
              disabled={isView}
          />
          <Input
            label="Address 2"
            name="vendor_address2"
            value={formData.vendor_address2}
            onChange={handleChange}
            placeholder="Enter Address 2"
              disabled={isView}
          />
          <Input
            label="Landmark"
            name="vendor_landmark"
            value={formData.vendor_landmark}
            onChange={handleChange}
            placeholder="Enter Landmark"
              disabled={isView}
          />
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-3 items-center">
              <Input
                label="Pin Code *"
                name="vendor_pincode"
                value={formData.vendor_pincode}
                onChange={handleChange}
                placeholder="Enter PIN Code"
                className="w-full"
                error={errors.vendor_pincode}
                  disabled={isView}
              />
              {formData.vendor_type === 0 && (
                <Button
                  onClick={fetchLocationByPincode}
                  disabled={isFetchingPincode}
                >
                  {isFetchingPincode ? "Fetching..." : "Fetch"}
                </Button>
              )}
            </div>
          </div>
          <Input
            label="City *"
            name="vendor_city"
            value={formData.vendor_city}
            onChange={handleChange}
            placeholder="Enter City"
            error={errors.vendor_city}
              disabled={isView}
          />
          <Select
            label="State *"
            name="vendor_state"
            value={formData.vendor_state}
            onChange={handleChange}
            options={states}
            optionValue="Id"
            optionLabel="StateName"
            error={errors.vendor_state}
            disabled={formData.vendor_type === 1}
            greyOut={formData.vendor_type === 1}
              disabled={isView}
          />
          <Select
            label="Country *"
            name="vendor_country"
            value={formData.vendor_country}
            onChange={handleChange}
            options={countries}
            optionValue="Id"
            optionLabel="CountryName"
            error={errors.vendor_country}
              disabled={isView}
          />
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter Email"
            error={errors.email}
            className=""
              disabled={isView}
          />
          <div></div>
          <div className="grid grid-cols-2 items-center gap-5 col-span-2">
            <div className="flex flex-col gap-2">
              <label className="font-medium text-gray-700">Mobile Number</label>
              <div className="flex gap-4">
                <Select
                  name="mobileISDCode"
                  value={formData.mobileISDCode}
                  onChange={handleChange}
                  options={countries?.map((c) => ({
                    Id: c.ISDCode,
                    CountryName: `${c.CountryName} (${c.ISDCode})`,
                  }))}
                  optionValue="Id"
                  optionLabel="CountryName"
                  className="w-36"
                    disabled={isView}
                />
                <Input
                  name="mobile_no"
                  value={formData.mobile_no}
                  onChange={handleChange}
                  placeholder="Enter Mobile Number"
                  error={errors.mobile_no}
                  className="flex-1"
                    disabled={isView}
                />
              </div>
            </div>

            <Input
              label="Telephone"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              placeholder="Enter Telephone"
              error={errors.telephone}
                disabled={isView}
            />
          </div>
        </div>
      </Section>
    </div>
  );
};

export default VendorForm;
