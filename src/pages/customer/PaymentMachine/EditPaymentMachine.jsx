import React, { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import toast from "react-hot-toast";
import HasPermission from "../../../components/HasPermission";

const machineType = [
  { value: 0, label: "Card" },
  { value: 1, label: "UPI" },
];

const EditPaymentMachine = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [formData, setFormData] = useState({
    Bank: "",
    MachineName: "",
    MachineType: "",
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
              ? "View Payment Machine"
              : "Edit Payment Machine"
            : "Create New Payment Machine"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Bank
          </label>
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
          <label className="block text-sm font-medium text-gray-700">
            Machine Name
          </label>
          <input
            type="text"
            name="MachineName"
            value={formData.MachineName}
            onChange={handleChange}
            className="input w-full p-2 border rounded-md"
            disabled={isEnabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Type
          </label>
          <div className="flex gap-3 items-center">
            {machineType.map((r, i) => (
              <div key={i} className="flex items-center gap-2 align-middle">
                <input
                  id={`${r.label}${i}`}
                  name="MachineType"
                  type="radio"
                  value={r.value}
                  checked={formData.MachineType === r.value.toString()}
                  onChange={handleChange}
                  disabled={isEnabled}
                  required
                />
                <label htmlFor={`${r.label}${i}`}>{r.label}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          {!isEnabled && (
            <HasPermission
              module="Payment Machine"
              action={["edit", "create"]}
            >
              <Button type="submit">
                {id ? "Update payment machine" : "Create payment machine"}
              </Button>
            </HasPermission>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditPaymentMachine;
