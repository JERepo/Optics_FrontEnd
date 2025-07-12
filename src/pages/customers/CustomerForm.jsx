import React, { useEffect } from "react";

const CustomerForm = ({
  formData,
  handleChange,
  customerGroups,
  countryCodes,
  onSubmit,
  errors,
  countryIsd,
  setFormData,
  setErrors,
  companyType,
}) => {
  // Auto-fill country code when countryIsd is available
  useEffect(() => {
    if (countryIsd?.country?.ISDCode) {
      setFormData((prev) => ({
        ...prev,
        countryCode: countryIsd.country.ISDCode,
      }));
    }
  }, [countryIsd, setFormData]);

  // Auto-fill and disable PAN number when GST number is valid
  useEffect(() => {
    if (formData.GSTNumber && formData.GSTNumber.length === 15) {
      const pan = formData.GSTNumber.substring(2, 12);
      setFormData((prev) => ({
        ...prev,
        PANNumber: pan,
      }));
    } else if (formData.GSTNumber.length < 15 && formData.PANNumber) {
      setFormData((prev) => ({
        ...prev,
        PANNumber: "",
      }));
    }
  }, [formData.GSTNumber, setFormData]);

  // Validation functions
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone, countryCode) =>
    countryCode === countryCode ? /^\d{10}$/.test(phone) : phone.length >= 10;

  // Enhanced handleChange to validate and clear errors in real-time
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    // Update form data
    setFormData((prev) => {
      const updatedFormData = {
        ...prev,
        [name]: newValue,
      };

      // Validate and update errors
      const newErrors = { ...errors };

      // Customer Type validation
      if (name === "customerType" && value) {
        delete newErrors.customerType;
      } else if (name === "customerType" && !value) {
        newErrors.customerType = "Customer type is required";
      }

      // GST Number validation
      if (name === "GSTNumber") {
        if (value && value.length === 15) {
          delete newErrors.GSTNumber;
        } else {
          newErrors.GSTNumber = "GSTIN number should be 15 characters";
        }
      }

      // PAN Number validation
      if (name === "PANNumber") {
        if (value && value.length === 10) {
          delete newErrors.PANNumber;
        } else {
          newErrors.PANNumber = "PAN number should be 10 characters";
        }
      }

      // Legal Name validation
      if (name === "legalName") {
        if (value) {
          delete newErrors.legalName;
        } else {
          newErrors.legalName = "Legal name is required";
        }
      }

      // Name validation
      if (name === "name") {
        if (value && value.length >= 2 && value.length <= 100) {
          delete newErrors.name;
        } else {
          newErrors.name =
            "Name is required and must be between 2 and 100 characters";
        }
      }

      // Customer Group validation
      if (name === "customerGroup" && value) {
        delete newErrors.customerGroup;
      } else if (
        name === "customerGroup" &&
        !value &&
        customerGroups?.data?.data.length
      ) {
        newErrors.customerGroup = "Customer group is required";
      }

      // Telephone Number validation
      if (name === "telPhone") {
        if (value.length <= 15) {
          delete newErrors.telPhone;
        } else {
          newErrors.telPhone = "Telephone number cannot exceed 15 characters";
        }
      }

      // Phone Number validation
      if (name === "phone" || name === "countryCode") {
        const phone = name === "phone" ? value : formData.phone;
        const countryCode =
          name === "countryCode" ? value : formData.countryCode;
        if (phone && validatePhone(phone, countryCode)) {
          delete newErrors.phone;
        } else {
          newErrors.phone =
            "Valid phone number is required (10 digits for +91)";
        }
      }

      // Email validation
      if (name === "email") {
        if (value && validateEmail(value) && value.length <= 150) {
          delete newErrors.email;
        } else {
          newErrors.email =
            value.length > 150
              ? "Email cannot exceed 150 characters"
              : "Valid email is required";
        }
      }
      setErrors(newErrors);
      return updatedFormData;
    });

    handleChange(e);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Type *
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="customerType"
                  value="B2C"
                  checked={formData.customerType === "B2C"}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-gray-700">Individual (B2C)</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="customerType"
                  value="B2B"
                  checked={formData.customerType === "B2B"}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-gray-700">Business (B2B)</span>
              </label>
            </div>
            {errors.customerType && (
              <p className="text-red-500 text-sm mt-1">{errors.customerType}</p>
            )}
          </div>
           {formData.customerType === "B2C" && (
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
              )}
          {(formData?.customerType === "B2B" ||
            (companyType?.data.CompanyType === 0 &&
              formData?.customerType === "B2C")) && (
            <>
              {formData.customerType === "B2B" && (
                <>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GSTIN Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="GSTINType"
                          value="0"
                          checked={formData.GSTINType === "0"}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-gray-700">Registered</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="GSTINType"
                          value="1"
                          checked={formData.GSTINType === "1"}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-gray-700">
                          Un-Registered
                        </span>
                      </label>
                    </div>
                  </div>
                  {formData.GSTINType == 0 &&
                    formData.customerType === "B2B" && (
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GST Number
                        </label>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            name="GSTNumber"
                            value={formData.GSTNumber}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            className="whitespace-nowrap px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            Verify GST
                          </button>
                        </div>
                        {errors.GSTNumber && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.GSTNumber}
                          </p>
                        )}
                      </div>
                    )}

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PAN Number*
                    </label>
                    <input
                      type="text"
                      name="PANNumber"
                      value={formData.PANNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={formData.GSTNumber.length === 15}
                    />
                    {errors.PANNumber && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.PANNumber}
                      </p>
                    )}
                  </div>
                </>
              )}
              {/* legal name */}
              {formData.customerType === "B2B" && (
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Name *
                  </label>
                  <input
                    type="text"
                    name="legalName"
                    value={formData.legalName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.legalName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.legalName}
                    </p>
                  )}
                </div>
              )}
             

              {companyType?.data.CompanyType === 0 && (
                <>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      name="BrandName"
                      value={formData.BrandName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.BrandName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.BrandName}
                      </p>
                    )}
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unique Customer Id
                    </label>
                    <input
                      type="text"
                      name="customerUniqueId"
                      value={formData.customerUniqueId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.customerUniqueId && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.customerUniqueId}
                      </p>
                    )}
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Whatsapp Group Id
                    </label>
                    <input
                      type="text"
                      name="whatsAppGroupId"
                      value={formData.whatsAppGroupId}
                      onChange={handleInputChange}
                      placeholder=""
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.whatsAppGroupId && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.whatsAppGroupId}
                      </p>
                    )}
                    <div className="mt-2">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="whatsappAlert"
                          checked={formData.whatsappAlert}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Send whatsapp alerts
                        </span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
          

          {/* customer group */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Group *
            </label>
            <select
              name="customerGroup"
              value={formData.customerGroup}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select customer group</option>
              {customerGroups?.data?.data.map((group) => (
                <option key={group.Id} value={group.Id}>
                  {group.GroupName}
                </option>
              ))}
            </select>
            {errors.customerGroup && (
              <p className="text-red-500 text-sm mt-1">
                {errors.customerGroup}
              </p>
            )}
          </div>
          {/* telephone number */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telephone Number
            </label>
            <div className="flex">
              <input
                type="text"
                name="telPhone"
                value={formData.telPhone}
                onChange={handleInputChange}
                placeholder="Telephone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.telPhone && (
              <p className="text-red-500 text-sm mt-1">{errors.telPhone}</p>
            )}
          </div>
          {/* mobile number */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number *
            </label>
            <div className="flex">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleInputChange}
                className="w-28 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select code</option>
                {countryCodes?.map((code) => (
                  <option key={code.Id} value={code.ISDCode}>
                    {code.ISDCode}
                  </option>
                ))}
              </select>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone number"
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="sendPhoneAlert"
                  checked={formData.sendPhoneAlert}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Send phone alerts
                </span>
              </label>
            </div>
          </div>
          {/* email address */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="customer@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="sendAlert"
                  checked={formData.sendAlert}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Send email alerts
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CustomerForm;
