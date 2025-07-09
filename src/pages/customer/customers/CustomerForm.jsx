import React from "react";

const CustomerForm = ({
  formData,
  handleChange,
  locations,
  customerGroups,
  countryCodes,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Location Dropdown */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location *
          </label>
          <select
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a location</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Name Field */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Customer Type Radio Buttons */}
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
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                required
              />
              <span className="ml-2 text-gray-700">Individual (B2C)</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="customerType"
                value="B2B"
                checked={formData.customerType === "B2B"}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-gray-700">Business (B2B)</span>
            </label>
          </div>
        </div>

        {/* Customer Group Dropdown */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Group
          </label>
          <select
            name="customerGroup"
            value={formData.customerGroup}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select customer group</option>
            {customerGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        {/* Phone Number with Country Code */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <div className="flex">
            <select
              name="countryCode"
              value={formData.countryCode}
              onChange={handleChange}
              className="w-28 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {countryCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone number"
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Email with Send Alert Checkbox */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="customer@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="mt-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="sendAlert"
                checked={formData.sendAlert}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Send email alerts
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Additional fields can be added in new grid sections */}
      
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        // More fields here...
      </div> */}
    </form>
  );
};

export default CustomerForm;