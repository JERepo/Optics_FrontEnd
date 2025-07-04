import React from "react";
import { FiDollarSign, FiGlobe } from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { LuIndianRupee } from "react-icons/lu";

const PricingTable = ({
  pricing,
  onPriceChange,
  applyAll,
  onApplyAllChange,
  onApplyToAll,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <FiGlobe className="text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Location-Based Pricing
        </h3>
      </div>

      {/* Apply All Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
        {["buyingPrice", "sellingPrice"].map((field) => (
          <div className="space-y-2" key={field}>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              {field === "buyingPrice" ? (
                <LuIndianRupee  className="text-blue-500" />
              ) : (
                <LuIndianRupee className="text-blue-500" />
              )}
              Apply {field === "buyingPrice" ? "Buying" : "Selling"} Price to All
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name={field}
                placeholder="0.00"
                value={applyAll[field]}
                onChange={(e) =>
                  onApplyAllChange((prev) => ({
                    ...prev,
                    [field]: e.target.value,
                  }))
                }
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Button
                type="button"
                onClick={() => onApplyToAll(field, applyAll[field])}
                variant="primary"
                size="sm"
              >
                Apply
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Rows */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Buying Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Selling Price
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pricing.map((row, idx) => (
              <tr key={row.location} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {row.location}
                </td>
                {["buyingPrice", "sellingPrice"].map((field) => (
                  <td className="px-6 py-4" key={field}>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm"><LuIndianRupee/></span>
                      </div>
                      <input
                        type="text"
                        value={row[field]}
                        onChange={(e) =>
                          onPriceChange(idx, field, e.target.value)
                        }
                        placeholder="0.00"
                        className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PricingTable;
