import React from "react";

const countries = ["United States", "India", "United Kingdom", "Canada"];
const statesByCountry = {
  "United States": ["California", "Texas", "New York"],
  India: ["Maharashtra", "Delhi", "Karnataka"],
  "United Kingdom": ["England", "Scotland", "Wales"],
  Canada: ["Ontario", "Quebec", "British Columbia"],
};

const AddressForm = ({ title, data, onChange }) => (
  <div className="p-6 border border-gray-200 rounded-lg mb-6 bg-white shadow-sm">
    <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Address Line 1*</label>
        <input
          type="text"
          name="addressLine1"
          value={data.addressLine1}
          onChange={onChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
        <input
          type="text"
          name="addressLine2"
          value={data.addressLine2}
          onChange={onChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Landmark</label>
        <input
          type="text"
          name="landmark"
          value={data.landmark}
          onChange={onChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Pincode*</label>
        <input
          type="text"
          name="pincode"
          value={data.pincode}
          onChange={onChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">City*</label>
        <input
          type="text"
          name="city"
          value={data.city}
          onChange={onChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Country*</label>
        <select
          name="country"
          value={data.country}
          onChange={onChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select Country</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">State*</label>
        <select
          name="state"
          value={data.state}
          onChange={onChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          disabled={!data.country}
        >
          <option value="">Select State</option>
          {(statesByCountry[data.country] || []).map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
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
}) => {
  const handleChange = (e, isShipping = false) => {
    const { name, value } = e.target;
    if (isShipping) {
      setShipping((prev) => ({ ...prev, [name]: value }));
    } else {
      setBilling((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-xl mt-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Address Information</h2>
      
      <div className="space-y-6">
        <AddressForm 
          title="Billing Address" 
          data={billing} 
          onChange={(e) => handleChange(e, false)} 
        />

        <div className="flex items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <input
            type="checkbox"
            id="differentShipping"
            checked={useDifferentShipping}
            onChange={(e) => setUseDifferentShipping(e.target.checked)}
            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="differentShipping" className="ml-3 text-sm font-medium text-gray-700">
            Use different shipping address
          </label>
        </div>

        {useDifferentShipping && (
          <AddressForm 
            title="Shipping Address" 
            data={shipping} 
            onChange={(e) => handleChange(e, true)} 
          />
        )}
      </div>
    </div>
  );
};

export default BillingAddress;