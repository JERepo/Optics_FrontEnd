import React, { useEffect, useState } from "react";
import { useLazyGetPinCodeQuery } from "../../api/customerApi";

const Loader = () => <div>Loading...</div>;

const AddressForm = ({
  title,
  data,
  onChange,
  errors,
  onFetchLocation,
  isFetching,
  countries,
  states,
  countryIsd,
  formData,
  disabledFields = {},
  useDifferentShipping,
}) => {
  const prefix = title.toLowerCase().replace(" ", "");

  return (
    <div className="p-6 border border-gray-200 rounded-lg mb-6 bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Address Line 1 */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Address Line 1
            {prefix.includes("billing") ||
            (prefix.includes("shipping") && useDifferentShipping)
              ? "*"
              : ""}
          </label>
          <input
            type="text"
            name="line1"
            value={data.line1 || ""}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors[`${prefix}Line1`] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`${prefix}Line1`]}
            </p>
          )}
        </div>

        {/* Address Line 2 */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Address Line 2
          </label>
          <input
            type="text"
            name="line2"
            value={data.line2 || ""}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors[`${prefix}Line2`] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`${prefix}Line2`]}
            </p>
          )}
        </div>

        {/* Landmark */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Landmark
          </label>
          <input
            type="text"
            name="landmark"
            value={data.landmark || ""}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors[`${prefix}Landmark`] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`${prefix}Landmark`]}
            </p>
          )}
        </div>

        {/* Pincode */}
        <div className="space-y-1">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Pincode
                {prefix.includes("billing") ||
                (prefix.includes("shipping") && useDifferentShipping)
                  ? "*"
                  : ""}
              </label>
              <input
                type="text"
                name="pincode"
                value={data.pincode || ""}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={onFetchLocation}
              disabled={!data.pincode || isFetching}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isFetching ? <Loader /> : "Fetch Location"}
            </button>
          </div>
          {errors[`${prefix}Pincode`] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`${prefix}Pincode`]}
            </p>
          )}
        </div>

        {/* City */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            City
            {prefix.includes("billing") ||
            (prefix.includes("shipping") && useDifferentShipping)
              ? "*"
              : ""}
          </label>
          <input
            type="text"
            name="city"
            value={data.city || ""}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors[`${prefix}City`] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`${prefix}City`]}
            </p>
          )}
        </div>

        {/* Country */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Country
            {prefix.includes("billing") ||
            (prefix.includes("shipping") && useDifferentShipping)
              ? "*"
              : ""}
          </label>
          <select
            name="country"
            value={data.country || ""}
            onChange={onChange}
            disabled={disabledFields.country}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Country</option>
            {countries?.map((country) => (
              <option key={country.Id} value={country.Id}>
                {country.CountryName}
              </option>
            ))}
          </select>
          {errors[`${prefix}Country`] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`${prefix}Country`]}
            </p>
          )}
        </div>

        {/* State */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            State
            {prefix.includes("billing") ||
            (prefix.includes("shipping") && !useDifferentShipping)
              ? "*"
              : ""}
          </label>
          <select
            name="state"
            value={data.state}
            onChange={onChange}
            disabled={disabledFields.state || !data.country}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select State</option>
            {(
              states?.filter((s) => s.Id === Number(data.state)) || []
            ).map((state) => (
              <option key={state.Id} value={state.Id}>
                {state.StateName}
              </option>
            ))}
          </select>
          {errors[`${prefix}State`] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`${prefix}State`]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const BillingAddress = ({
  billing,
  setBilling,
  shipping,
  setShipping,
  useDifferentShipping,
  setUseDifferentShipping,
  errors,
  setErrors,
  countries,
  states,
  countryIsd,
  formData,
}) => {
  const [getPinCode, { isFetching, isError }] = useLazyGetPinCodeQuery();
  const [fetchingType, setFetchingType] = useState(null);
  const validatePincode = (pincode) => /^\d{6}$/.test(pincode);

  const clearErrors = (prefix, setErrors) => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[`${prefix}City`];
      delete newErrors[`${prefix}State`];
      delete newErrors[`${prefix}Country`];
      delete newErrors[`${prefix}Pincode`];
      return newErrors;
    });
  };

  const handleChange = (e, isShipping = false) => {
    const { name, value } = e.target;
    const prefix = isShipping ? "shippingaddress" : "billingaddress";

    const updateFunc = isShipping ? setShipping : setBilling;

    updateFunc((prev) => {
      const updated = { ...prev, [name]: value };
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };

        // Clear relevant errors when fields change
        if (name === "line1" && value) delete newErrors[`${prefix}Line1`];
        if (name === "line2" && value) delete newErrors[`${prefix}Line2`];
        if (name === "landmark" && value) delete newErrors[`${prefix}Landmark`];
        if (name === "city" && value) delete newErrors[`${prefix}City`];

        if (name === "pincode") {
          if (validatePincode(value)) {
            delete newErrors[`${prefix}Pincode`];
          }
        }

        if (name === "country" && value) {
          delete newErrors[`${prefix}Country`];
          // Also clear state error when country changes
          delete newErrors[`${prefix}State`];
        }

        if (name === "state" && value) delete newErrors[`${prefix}State`];

        return newErrors;
      });
      return updated;
    });
  };

  const fetchLocationDetails = async (pincode, isShipping = false) => {
    if (!pincode) return;
    setFetchingType(isShipping ? "shipping" : "billing");

    try {
      const response = await getPinCode({ pincode }).unwrap();

      if (response?.success && response.data.length > 0) {
        const location = response.data[0];

        const matchedCountry = countries.find(
          (c) =>
            c.CountryName.toLowerCase() ===
            location.CountryName?.trim().toLowerCase()
        );
        console.log("matched country", matchedCountry);
        const matchedState = states.find(
          (s) =>
            s.StateCode == location?.StateId ||
            s.StateName.toLowerCase() ===
              location?.StateName?.trim().toLowerCase()
        );
        console.log("matched state", matchedState);
        const updatedFields = {
          city: location.CityName,
          state: matchedState?.Id,
          country: matchedCountry?.Id,
          pincode: location.PinCode || pincode,
        };

        if (isShipping) {
          setShipping((prev) => ({ ...prev, ...updatedFields }));
          clearErrors("shippingaddress", setErrors);
        } else {
          setBilling((prev) => ({ ...prev, ...updatedFields }));
          clearErrors("billingaddress", setErrors);

          // Also update shipping address if not using different shipping
          if (!useDifferentShipping) {
            setShipping((prev) => ({ ...prev, ...updatedFields }));
            clearErrors("shippingaddress", setErrors);
          }
        }
      } else {
        // Error handling remains the same
      }
    } catch (error) {
      // Error handling remains the same
    } finally {
      setFetchingType(null);
    }
  };
  // Auto-fetch location details when billing pincode changes
  useEffect(() => {
    if (billing.pincode && validatePincode(billing.pincode) && !isFetching) {
      fetchLocationDetails(billing.pincode, false);
    }
  }, [billing.pincode]);
  // Auto-fill and disable state/country for B2B
  useEffect(() => {
    if (
      formData.customerType === "B2B" &&
      formData.GSTNumber?.length >= 2 &&
      /^\d{2}/.test(formData.GSTNumber)
    ) {
      const gstStateCode = parseInt(formData.GSTNumber.substring(0, 2), 10);
      const matchedState = states.find((s) => s.StateCode == gstStateCode);

      if (matchedState) {
        const matchedCountry = countries.find(
          (c) => c.Id === matchedState.CountryId
        );

        setBilling((prev) => ({
          ...prev,
          state: matchedState.Id,
          country: matchedCountry?.Id || "",
        }));

        setShipping((prev) => ({
          ...prev,
          state: matchedState.Id,
          country: matchedCountry?.Id || "",
        }));

        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors["billingaddressState"];
          delete newErrors["billingaddressCountry"];
          delete newErrors["shippingaddressState"];
          delete newErrors["shippingaddressCountry"];
          return newErrors;
        });
      } else {
        console.warn(`No state found for GST state code: ${gstStateCode}`);
      }
    }
  }, [formData.customerType, formData.GSTNumber, states, countries]);
  return (
    <div className="p-6 bg-gray-50 rounded-xl mt-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Address Information
      </h2>
      <div className="space-y-6">
        <AddressForm
          title="Billing Address"
          data={billing}
          onChange={(e) => handleChange(e, false)}
          errors={errors}
          onFetchLocation={() => fetchLocationDetails(billing.pincode, false)}
          isFetching={isFetching && fetchingType === "billing"}
          countries={countries}
          states={states}
          countryIsd={countryIsd}
          formData={formData}
          disabledFields={
            formData.customerType === "B2B" ||
            (billing.state && billing.country)
              ? { state: true, country: true }
              : {}
          }
        />

        <div className="flex items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <input
            type="checkbox"
            id="differentShipping"
            checked={useDifferentShipping}
            onChange={(e) => setUseDifferentShipping(e.target.checked)}
            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="differentShipping"
            className="ml-3 text-sm font-medium text-gray-700"
          >
            Use different shipping address
          </label>
        </div>

        {useDifferentShipping && (
          <AddressForm
            title="Shipping Address"
            data={shipping}
            onChange={(e) => handleChange(e, true)}
            errors={errors}
            onFetchLocation={() => fetchLocationDetails(shipping.pincode, true)}
            isFetching={isFetching && fetchingType === "shipping"}
            countries={countries}
            states={states}
            countryIsd={countryIsd}
            formData={formData}
            disabledFields={
              formData.customerType === "B2B" ||
              (shipping.state && shipping.country) ||
              (!useDifferentShipping && billing.state && billing.country)
                ? { state: true, country: true }
                : {}
            }
            useDifferentShipping={useDifferentShipping}
          />
        )}
      </div>
    </div>
  );
};

export default BillingAddress;
