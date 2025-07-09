import React, { useState } from "react";
import CustomerForm from "./CustomerForm";
import PersonalDetailsModal from "./PersonalDetailsModal";
import BillingAddress from "./BillingAddress";

import { Table, TableCell, TableRow } from "../../components/Table";
import { FiEye, FiEdit2, FiCopy } from "react-icons/fi";
import { useGetAllRimTypeQuery } from "../../api/materialMaster";
import { useGetAllIndicesQuery } from "../../api/customerApi";
import {useCustomerContext} from '../../features/customerContext'
import Button from "../../components/ui/Button";

const Customer = () => {
  const { formData, setFormData } = useCustomerContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [personalDetailsData, setPersonalDetailsData] = useState([]);

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

  const [useDifferentShipping, setUseDifferentShipping] = useState(false);

  const { data: rimData } = useGetAllRimTypeQuery();
  const { data: indexData } = useGetAllIndicesQuery();

  const rimTypes = rimData?.data?.filter((r) => r.IsActive === 1) || [];
  const indices = indexData?.data?.data || [];

  const [fittingType, setFittingType] = useState("standard");
  const [fittingPrices, setFittingPrices] = useState({
    singleVision: {},
    others: {},
  });

  const [enableLoyalty, setEnableLoyalty] = useState(0); // 0 = disabled, 1 = enabled
  const [billingMethod, setBillingMethod] = useState(0); // 0 = disabled, 1 = enabled

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const [enableCreditBilling, setEnableCreditBilling] = useState(0); // 0 = No, 1 = Yes
  const [creditBalanceType, setCreditBalanceType] = useState("Dr"); // Dr or Cr
  const [creditDetails, setCreditDetails] = useState({
    openingBalance: 0,
    creditLimit: 0,
    creditDays: 0,
    paymentTerms: "",
  });

  // ... (previous handlers remain the same)

  const handleCreditDetailChange = (e) => {
    const { name, value } = e.target;
    setCreditDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  const handleAddDetail = (detail) => {
    setPersonalDetailsData((prev) =>
      editingIndex !== null
        ? prev.map((item, i) => (i === editingIndex ? detail : item))
        : [...prev, detail]
    );
    setEditingIndex(null);
    setIsModalOpen(false);
  };

  const handlePriceChange = (focality, rimId, indexId, value) => {
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

  const handleSave = () => {
    // Prepare all form data to be saved
    const formDataToSave = {
      customerInfo: formData,
      personalDetails: personalDetailsData,
      addresses: {
        billing: billingAddress,
        shipping: shippingAddress,
        useDifferentShipping,
      },
      fittingPrices: fittingType === "fixed" ? fittingPrices : null,
      loyaltySettings: {
        enableLoyalty,
      },
      billingSettings: {
        billingMethod,
      },
      creditBilling:
        enableCreditBilling === 1
          ? {
              ...creditDetails,
              creditBalanceType,
            }
          : null,
    };

    console.log("Saving form data:", formDataToSave);
    // Here you would typically make an API call to save the data
    alert("Form data saved successfully!");
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
                        fittingPrices[focalityKey]?.[rim.Id]?.[index.Id] || ""
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Customer Information
      </h2>

      <CustomerForm
        formData={formData}
        handleChange={handleChange}
        locations={["New York", "Los Angeles", "Chicago", "Houston", "Miami"]}
        customerGroups={[
          "Retail",
          "Wholesale",
          "VIP",
          "Corporate",
          "Government",
        ]}
        countryCodes={[
          "+1 (US)",
          "+44 (UK)",
          "+91 (IN)",
          "+86 (CN)",
          "+81 (JP)",
        ]}
        onSubmit={handleSubmit}
      />

      {/* Personal Details Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Personal Details</h2>
          <Button onClick={() => setIsModalOpen(true)}>Add Details</Button>
        </div>

        <Table
          columns={[
            "S.No",
            "Name",
            "Mobile No",
            "Tel No",
            "Email Id",
            "DOB",
            "Engraving",
            "Annivarsary",
            "Action",
          ]}
          data={personalDetailsData}
          renderRow={(detail, index) => (
            <TableRow key={index}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{detail.name}</TableCell>
              <TableCell>{detail.mobile}</TableCell>
              <TableCell>{detail.tel}</TableCell>
              <TableCell>{detail.email}</TableCell>
              <TableCell>{detail.dob}</TableCell>
              <TableCell>{detail.engraving}</TableCell>
              <TableCell>{detail.anniversary}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <FiEye className="text-xl cursor-pointer" />
                  <button
                    className="text-neutral-600 hover:text-primary"
                    aria-label="Edit"
                    onClick={() => {
                      setEditingIndex(index);
                      setIsModalOpen(true);
                    }}
                  >
                    <FiEdit2 size={18} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          )}
        />
      </div>

      <PersonalDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingIndex(null);
        }}
        onSave={handleAddDetail}
        initialData={
          editingIndex !== null ? personalDetailsData[editingIndex] : null
        }
      />

      {/* Billing Address */}
      <BillingAddress
        billing={billingAddress}
        setBilling={setBillingAddress}
        shipping={shippingAddress}
        setShipping={setShippingAddress}
        useDifferentShipping={useDifferentShipping}
        setUseDifferentShipping={setUseDifferentShipping}
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
                value="standard"
                checked={fittingType === "standard"}
                onChange={() => setFittingType("standard")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-gray-700">Standard Price</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="fittingType"
                value="fixed"
                checked={fittingType === "fixed"}
                onChange={() => setFittingType("fixed")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-gray-700">Fixed Price</span>
            </label>
          </div>

          {fittingType === "fixed" && (
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

      {/* Billing details */}
      <div className="flex gap-2 items-center mt-5">
        Billing Method:
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="billingMethod"
              value="1"
              checked={billingMethod === 1}
              onChange={() => setBillingMethod(1)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-gray-700">Enable</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="billingMethod"
              value="0"
              checked={billingMethod === 0}
              onChange={() => setBillingMethod(0)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-gray-700">Disable</span>
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
          <div className="space-y-4 mt-4  ">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Balance
                </label>
                <input
                  type="number"
                  name="openingBalance"
                  value={creditDetails.openingBalance}
                  onChange={handleCreditDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Limit
                </label>
                <input
                  type="number"
                  name="creditLimit"
                  value={creditDetails.creditLimit}
                  onChange={handleCreditDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Days
                </label>
                <input
                  type="number"
                  name="creditDays"
                  value={creditDetails.creditDays}
                  onChange={handleCreditDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <textarea
                name="paymentTerms"
                value={creditDetails.paymentTerms}
                onChange={handleCreditDetailChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Enter payment terms and conditions"
              />
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
  );
};

export default Customer;
