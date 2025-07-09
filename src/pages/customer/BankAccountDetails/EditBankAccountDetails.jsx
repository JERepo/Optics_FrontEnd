import React, { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import toast from "react-hot-toast";
import HasPermission from "../../../components/HasPermission";

const accountType = [
  { value: 0, label: "Savings" },
  { value: 1, label: "Current" },
  { value: 2, label: "OD" },
];

const EditBankAccountDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [formData, setFormData] = useState({
    Bank: "",
    AccountNumber: "",
    Branch: "",
    IFSC: "",
    Swift: "",
    AccountType: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isEnabled = location.pathname.includes("/view");

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Submit logic here
    console.log(formData)
  };

  return (
    <div className="max-w-2xl bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <FiArrowLeft className="text-gray-600" size={20} />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800">
          {id
            ? isEnabled
              ? "View Bank Account details"
              : "Edit Bank Account details"
            : "Create New Bank Account details"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Bank</label>
          <select
            onChange={handleChange}
            value={formData.Bank}
            className="input w-full p-2 border rounded-md"
            name="Bank"
            disabled={isEnabled}
            required
          >
            <option value="">Select bank</option>
            <option value="SBI">SBI</option>
            <option value="HDFC">HDFC</option>
            <option value="AXIS">AXIS</option>
            <option value="ICICI">ICICI</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Account Number</label>
          <input
            type="text"
            name="AccountNumber"
            value={formData.AccountNumber}
            onChange={handleChange}
            className="input w-full p-2 border rounded-md"
            disabled={isEnabled}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
          <div className="flex gap-3 items-center">
            {accountType.map((r, i) => (
              <div key={i} className="flex items-center gap-2 align-middle">
                <input
                  id={`${r.label}${i}`}
                  name="AccountType"
                  type="radio"
                  value={r.value}
                  checked={formData.AccountType === r.value.toString()}
                  onChange={handleChange}
                  disabled={isEnabled}
                  required
                />
                <label htmlFor={`${r.label}${i}`}>{r.label}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Branch</label>
          <input
            type="text"
            name="Branch"
            value={formData.Branch}
            onChange={handleChange}
            className="input w-full p-2 border rounded-md"
            disabled={isEnabled}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
          <input
            type="text"
            name="IFSC"
            value={formData.IFSC}
            onChange={handleChange}
            className="input w-full p-2 border rounded-md"
            disabled={isEnabled}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">SWIFT Code</label>
          <input
            type="text"
            name="Swift"
            value={formData.Swift}
            onChange={handleChange}
            className="input w-full p-2 border rounded-md"
            disabled={isEnabled}
          />
        </div>

        <div className="pt-4 flex justify-end">
          {!isEnabled && (
            <HasPermission
              module="Bank Account Details"
              action={["edit", "create"]}
            >
              <Button type="submit">
                {id ? "Update Account" : "Create Account"}
              </Button>
            </HasPermission>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditBankAccountDetails;