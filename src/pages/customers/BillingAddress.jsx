import React, { useEffect, useState } from "react";
import { useLazyGetPinCodeQuery } from "../../api/customerApi";

// Assuming Loader is a custom component; replace with your actual Loader
const Loader = () => <div>Loading...</div>; // Placeholder; replace with actual Loader component

const countries = ["United States", "India", "United Kingdom", "Canada"];
const statesByCountry = {
  "United States": ["California", "Texas", "New York"],
  India: ["Maharashtra", "Delhi", "Karnataka"],
  "United Kingdom": ["England", "Scotland", "Wales"],
  Canada: ["Ontario", "Quebec", "British Columbia"],
};

const AddressForm = ({ title, data, onChange, errors, onFetchLocation, isFetching }) => (
  <div className="p-6 border border-gray-200 rounded-lg mb-6 bg-white shadow-sm">
    <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Address Line 1*
        </label>
        <input
          type="text"
          name="line1"
          value={data.line1 || ""}
          onChange={onChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors[`${title.toLowerCase().replace(" ", "")}Line1`] && (
          <p className="text-red-500 text-sm mt-1">
            {errors[`${title.toLowerCase().replace(" ", "")}Line1`]}
          </p>
        )}
      </div>
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
      </div>
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
      </div>
      <div className="space-y-1">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              Pincode*
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
        {errors[`${title.toLowerCase().replace(" ", "")}Pincode`] && (
          <p className="text-red-500 text-sm mt-1">
            {errors[`${title.toLowerCase().replace(" ", "")}Pincode`]}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">City*</label>
        <input
          type="text"
          name="city"
          value={data.city || ""}
          onChange={onChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors[`${title.toLowerCase().replace(" ", "")}City`] && (
          <p className="text-red-500 text-sm mt-1">
            {errors[`${title.toLowerCase().replace(" ", "")}City`]}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Country*
        </label>
        <select
          name="country"
          value={data.country || ""}
          onChange={onChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select Country</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
        {errors[`${title.toLowerCase().replace(" ", "")}Country`] && (
          <p className="text-red-500 text-sm mt-1">
            {errors[`${title.toLowerCase().replace(" ", "")}Country`]}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          State*
        </label>
        <select
          name="state"
          value={data.state || ""}
          onChange={onChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={!data.country}
        >
          <option value="">Select State</option>
          {(statesByCountry[data.country] || []).map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        {errors[`${title.toLowerCase().replace(" ", "")}State`] && (
          <p className="text-red-500 text-sm mt-1">
            {errors[`${title.toLowerCase().replace(" ", "")}State`]}
          </p>
        )}
      </div>
    </div>
  </div>
);

const BillingAddress = ({
  billing,
  setBilling,
  shipping,
  setShipping,
  useDifferentShipping,
  setUseDifferentShipping,
  errors,
  setErrors,
  validatePincode,
}) => {
  const [getPinCode, { isFetching }] = useLazyGetPinCodeQuery();
  const [fetchingType, setFetchingType] = useState(null); // Tracks whether billing or shipping is fetching

  const handleChange = (e, isShipping = false) => {
    const { name, value } = e.target;
    const prefix = isShipping ? "shippingaddress" : "billingaddress";
    if (isShipping) {
      setShipping((prev) => {
        const updatedShipping = { ...prev, [name]: value };
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          if (name === "line1" && value) delete newErrors[`${prefix}Line1`];
          if (name === "city" && value) delete newErrors[`${prefix}City`];
          if (name === "pincode" && validatePincode(value))
            delete newErrors[`${prefix}Pincode`];
          if (name === "country" && value) delete newErrors[`${prefix}Country`];
          if (name === "state" && value) delete newErrors[`${prefix}State`];
          return newErrors;
        });
        return updatedShipping;
      });
    } else {
      setBilling((prev) => {
        const updatedBilling = { ...prev, [name]: value };
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          if (name === "line1" && value) delete newErrors[`${prefix}Line1`];
          if (name === "city" && value) delete newErrors[`${prefix}City`];
          if (name === "pincode" && validatePincode(value))
            delete newErrors[`${prefix}Pincode`];
          if (name === "country" && value) delete newErrors[`${prefix}Country`];
          if (name === "state" && value) delete newErrors[`${prefix}State`];
          return newErrors;
        });
        return updatedBilling;
      });
    }
  };

  const fetchLocationDetails = async (pincode, isShipping = false) => {
    if (!pincode) return;

    setFetchingType(isShipping ? "shipping" : "billing");
    try {
      const response = await getPinCode({ pincode }).unwrap();
      console.log("Fetch Location Response:", response);

      if (response?.success && response.data.length > 0) {
        const location = response.data[0];
        const updatedFields = {
          city: location.CityName || "",
          state: location.StateName || "",
          country: location.CountryName || "",
          pincode: location.PinCode || pincode,
        };

        if (isShipping) {
          setShipping((prev) => ({ ...prev, ...updatedFields }));
          setErrors((prevErrors) => {
            const prefix = "shippingaddress";
            const newErrors = { ...prevErrors };
            delete newErrors[`${prefix}City`];
            delete newErrors[`${prefix}State`];
            delete newErrors[`${prefix}Country`];
            delete newErrors[`${prefix}Pincode`];
            return newErrors;
          });
        } else {
          setBilling((prev) => ({ ...prev, ...updatedFields }));
          setErrors((prevErrors) => {
            const prefix = "billingaddress";
            const newErrors = { ...prevErrors };
            delete newErrors[`${prefix}City`];
            delete newErrors[`${prefix}State`];
            delete newErrors[`${prefix}Country`];
            delete newErrors[`${prefix}Pincode`];
            return newErrors;
          });
        }
      } else {
        alert("Location not found for this pincode.");
      }
    } catch (error) {
      console.error("Failed to fetch location:", error);
      alert("Failed to fetch location.");
    } finally {
      setFetchingType(null);
    }
  };

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
          />
        )}
      </div>
    </div>
  );
}

export default BillingAddress