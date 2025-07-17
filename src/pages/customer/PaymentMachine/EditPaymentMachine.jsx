import React, { useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import toast from "react-hot-toast";
import HasPermission from "../../../components/HasPermission";
import {
  useGetAllLocationsQuery,
  useGetPageByIdQuery,
} from "../../../api/roleManagementApi";
import Loader from "../../../components/ui/Loader";
import { useGetAllBankMastersQuery } from "../../../api/bankMasterApi";
import {
  useCreatePaymentMachineMutation,
  useGetPaymentMachineByIdQuery,
  useUpdatePaymentMachineMutation,
} from "../../../api/paymentMachineApi";
import { useSelector } from "react-redux";

const machineType = [
  { value: 0, label: "Card" },
  { value: 1, label: "UPI" },
];
const validators = {
  Bank: (val) => (!val ? "Bank is required" : ""),
  MachineName: (val) =>
    !val
      ? "Machine name is required"
      : val.length > 50
      ? "Machine name must not exceed 50 characters"
      : "",
  Locations: (val) =>
    !val || val.length === 0 ? "At least one location must be selected" : "",
};

const EditPaymentMachine = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const [formData, setFormData] = useState({
    Bank: null,
    MachineName: null,
    MachineType: 0,
    Locations: [],
  });
  const [errors, setErrors] = useState({});
  const { data: paymentMachineData, isLoading } = useGetPaymentMachineByIdQuery(
    { id }
  );
  const { data: allLocations, isLoading: isLocationsLoading } =
    useGetAllLocationsQuery();

  const { data: bankMasterData, isLoading: isBankMasterLoading } =
    useGetAllBankMastersQuery();
  const [createPaymentMachine, { isLoading: isCreating }] =
    useCreatePaymentMachineMutation();
  const [updatePaymentMachine, { isLoading: isUpdating }] =
    useUpdatePaymentMachineMutation();

  useEffect(() => {
    if (paymentMachineData?.data?.data) {
      const account = paymentMachineData.data.data;
      setFormData({
        Bank: account.BankMasterID.toString(),
        Locations: account.CompanyLinks?.map((c) => c.CompanyID) ?? [],
        MachineName: account.MachineName,
        MachineType: 0,
      });
    }
  }, [paymentMachineData]);
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === "radio" ? parseInt(value) : value;
    const newForm = {
      ...formData,
      [name]: val,
    };
    setFormData(newForm);
    validateField(name, val, newForm);
  };

  const validateField = (name, value, data = formData) => {
    if (validators[name]) {
      const error = validators[name](value, data);
      setErrors((prev) => ({
        ...prev,
        [name]: error || undefined,
      }));
    }
  };

  const validateAll = () => {
    const newErrors = {};
    for (const field in validators) {
      const error = validators[field](formData[field], formData);
      if (error) newErrors[field] = error;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleLocationChange = (event) => {
    const { value, checked } = event.target;
    const numericValue = parseInt(value);
    const currentLocations = formData.Locations;

    let updatedLocations = checked
      ? [...currentLocations, numericValue]
      : currentLocations.filter((locId) => locId !== numericValue);

    const newForm = {
      ...formData,
      Locations: updatedLocations,
    };

    setFormData(newForm);
    validateField("Locations", updatedLocations);
  };

  const isEnabled = location.pathname.includes("/view");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    const payload = {
      bankMasterId: parseInt(formData.Bank),
      machine_name: formData.MachineName,
      machine_type: formData.MachineType,
      ledgerId: 1,
      companyIds: formData.Locations,
    };

    try {
      if (id) {
        await updatePaymentMachine({ id, userId: user.Id, payload }).unwrap();
        toast.success("Bank Account details updated successfully");
      } else {
        await createPaymentMachine({ userId: user.Id, payload }).unwrap();
        toast.success("Bank Account details created successfully");
      }
      navigate(-1);
    } catch (err) {
      console.error(err);
      toast.error("Please try agian after some time!");
    }
  };

  if (isLoading) return <h1>Loading..</h1>;

  return (
    <div className="max-w-2xl bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Go Back"
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
        {isBankMasterLoading ? (
          <Loader />
        ) : (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Bank *
            </label>
            <select
              name="Bank"
              onChange={handleChange}
              value={formData.Bank}
              className="input w-full p-2 border rounded-md"
              disabled={isEnabled}
            >
              <option value="">Select bank</option>
              {bankMasterData?.data?.data.map((bank) => (
                <option key={bank.Id} value={bank.Id}>
                  {bank.BankName}
                </option>
              ))}
            </select>
            {errors.Bank && (
              <p className="text-red-500 text-sm">{errors.Bank}</p>
            )}
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Machine Name *
          </label>
          <input
            type="text"
            name="MachineName"
            value={formData.MachineName}
            onChange={handleChange}
            className="input w-full p-2 border rounded-md"
            disabled={isEnabled}
          />
          {errors.MachineName && (
            <p className="text-red-500 text-sm">{errors.MachineName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Type *
          </label>
          <div className="flex gap-3 items-center">
            {machineType.map((r, i) => (
              <div key={i} className="flex items-center gap-2 align-middle">
                <input
                  id={`${r.label}${i}`}
                  name="MachineType"
                  type="radio"
                  value={r.value}
                  checked={formData.MachineType === r.value}
                  onChange={handleChange}
                  disabled={isEnabled}
                  required
                />
                <label htmlFor={`${r.label}${i}`}>{r.label}</label>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            Locations *
          </label>
          {isLocationsLoading ? (
            <div className="flex justify-center py-4">
              <Loader />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 border border-gray-200 rounded-lg">
              {allLocations?.data?.map((loc) => (
                <div key={loc.Id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`location-${loc.Id}`}
                    value={loc.Id}
                    checked={formData.Locations.includes(loc.Id)}
                    onChange={handleLocationChange}
                    disabled={isEnabled}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`location-${loc.Id}`}
                    className="ml-2 text-sm text-gray-700"
                  >
                    {loc.LocationName}
                  </label>
                </div>
              ))}
            </div>
          )}
          {errors.Locations && (
            <p className="text-red-500 text-sm">{errors.Locations}</p>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          {!isEnabled && (
            <HasPermission module="Payment Machine" action={["edit", "create"]}>
              <Button
                type="submit"
                disabled={isCreating || isUpdating}
                loading={isCreating || isUpdating}
              >
                {isCreating || isUpdating
                  ? id
                    ? "Updating..."
                    : "Creating..."
                  : id
                  ? "Update Payment Machine"
                  : "Create Payment Machine"}
              </Button>
            </HasPermission>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditPaymentMachine;
