import React from "react";

const CustomerForm = ({
  formData,
  handleChange,
  customerGroups,
  countryCodes,
  onSubmit,
  errors,
}) => {
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
                  onChange={handleChange}
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
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-gray-700">Business (B2B)</span>
              </label>
            </div>
            {errors.customerType && (
              <p className="text-red-500 text-sm mt-1">{errors.customerType}</p>
            )}
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>
         
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Group
            </label>
            <select
              name="customerGroup"
              value={formData.customerGroup}
              onChange={handleChange}
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
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telephone Number
            </label>
            <div className="flex">
              <input
                type="text"
                name="telPhone"
                value={formData.telPhone}
                onChange={handleChange}
                placeholder="Tele phone number"
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.telPhone && (
              <p className="text-red-500 text-sm mt-1">{errors.telPhone}</p>
            )}
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number *
            </label>
            <div className="flex">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="w-28 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Send phone alerts
                </span>
              </label>
            </div>
          </div>
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
      </div>
    </form>
  );
};

export default CustomerForm;
