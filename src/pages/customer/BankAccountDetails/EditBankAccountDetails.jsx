import React, { useEffect, useState } from "react";
import { FiArrowLeft, FiMapPin } from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import HasPermission from "../../../components/HasPermission";
import { useGetAllBankMastersQuery } from "../../../api/bankMasterApi";
import Loader from "../../../components/ui/Loader";
import {
  useCreateBankAccountMutation,
  useGetBankAccountByIdQuery,
  useUpdateBankAccountMutation,
} from "../../../api/BankAccountDetailsApi";
import { useGetAllLocationsQuery } from "../../../api/roleManagementApi";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const accountType = [
  { value: 0, label: "Savings" },
  { value: 1, label: "Current" },
  { value: 2, label: "OD" },
];
const validators = {
  Bank: (val) => (!val ? "Bank is required" : ""),
  AccountNumber: (val) =>
    !val
      ? "Account number is required"
      : !/^\d{8,20}$/.test(val)
      ? "Account number must be 8–20 digits"
      : "",
  Branch: (val) =>
    !val
      ? "Branch is required"
      : val.length > 100
      ? "Branch must not exceed 100 characters"
      : "",
  IFSC: (val, form) =>
    !val && !form.Swift
      ? "Either IFSC or SWIFT code is required"
      : val && val.length > 12
      ? "IFSC code must not exceed 12 characters"
      : "",
  Swift: (val, form) =>
    !val && !form.IFSC
      ? "Either SWIFT or IFSC code is required"
      : val && val.length > 50
      ? "SWIFT code must not exceed 50 characters"
      : "",
  Locations: (val) =>
    !val || val.length === 0 ? "At least one location must be selected" : "",
};

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
    AccountType: 0,
    Locations: [],
  });

  const [errors, setErrors] = useState({});
  const isEnabled = location.pathname.includes("/view");
  const { user } = useSelector((state) => state.auth);

  const { data: bankMasterData, isLoading: isBankMasterLoading } =
    useGetAllBankMastersQuery();
  const { data: bankAccountDataById, isLoading: isDataLoading } =
    useGetBankAccountByIdQuery({ id });
  const [createBankAccount, { isLoading: isBankAccountCreating }] =
    useCreateBankAccountMutation();
  const [updateBankAccount, { isLoading: isBankAccountUpdating }] =
    useUpdateBankAccountMutation();
  const { data: allLocations, isLoading: isLocationsLoading } =
    useGetAllLocationsQuery();

  useEffect(() => {
    if (bankAccountDataById?.data?.data) {
      const account = bankAccountDataById.data.data;
      setFormData({
        Bank: account.BankMasterID.toString(),
        AccountNumber: account.AccountNo,
        Branch: account.Branch,
        IFSC: account.IfscCode,
        Swift: account.SwiftCode ?? "",
        AccountType: account.Type,
        Locations: account.LinkedCompanies?.map((c) => c.CompanyID) ?? [],
      });
    }
  }, [bankAccountDataById]);

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

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === "radio" ? parseInt(value) : value;
    const newForm = {
      ...formData,
      [name]: val,
    };
    setFormData(newForm);
    validateField(name, val, newForm);
    // Special case: if IFSC or Swift changes, revalidate both
    if (name === "IFSC" || name === "Swift") {
      validateField("IFSC", newForm.IFSC, newForm);
      validateField("Swift", newForm.Swift, newForm);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    const payload = {
      bankMasterId: parseInt(formData.Bank),
      account_no: formData.AccountNumber,
      branch: formData.Branch,
      ifscCode: formData.IFSC,
      swiftCode: formData.Swift ? formData.Swift : null,
      type: formData.AccountType,
      ledgerId: 1,
      companyIds: formData.Locations,
    };

    try {
      if (id) {
        await updateBankAccount({ id, userId: user.Id, payload }).unwrap();
        toast.success("Bank Account details updated successfully");
      } else {
        await createBankAccount({ userId: user.Id, payload }).unwrap();
        toast.success("Bank Account details created successfully");
      }
      navigate(-1);
    } catch (err) {
      console.error(err);
      toast.error("Please try agian after some time!");
    }
  };

  if (isDataLoading) return <h1>Loading..</h1>;
  return (
    <div className="max-w-2xl bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
          aria-label="Go Back"
        >
          <FiArrowLeft className="text-gray-600" size={20} />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800">
          {id
            ? isEnabled
              ? "View Bank Account Details"
              : "Edit Bank Account Details"
            : "Create New Bank Account Details"}
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
            Account Number *
          </label>
          <input
            type="text"
            name="AccountNumber"
            value={formData.AccountNumber}
            onChange={handleChange}
            className="input w-full p-2 border rounded-md"
            disabled={isEnabled}
          />
          {errors.AccountNumber && (
            <p className="text-red-500 text-sm">{errors.AccountNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Type *
          </label>
          <div className="flex gap-3 items-center">
            {accountType.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  id={`${r.label}${i}`}
                  name="AccountType"
                  type="radio"
                  value={r.value}
                  checked={formData.AccountType === r.value}
                  onChange={handleChange}
                  disabled={isEnabled}
                />
                <label htmlFor={`${r.label}${i}`}>{r.label}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Branch *
          </label>
          <input
            type="text"
            name="Branch"
            value={formData.Branch}
            onChange={handleChange}
            className="input w-full p-2 border rounded-md"
            disabled={isEnabled}
          />
          {errors.Branch && (
            <p className="text-red-500 text-sm">{errors.Branch}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            IFSC Code *
          </label>
          <input
            type="text"
            name="IFSC"
            value={formData.IFSC}
            onChange={handleChange}
            className="input w-full p-2 border rounded-md"
            disabled={isEnabled}
          />
          {errors.IFSC && <p className="text-red-500 text-sm">{errors.IFSC}</p>}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            SWIFT Code *
          </label>
          <input
            type="text"
            name="Swift"
            value={formData.Swift}
            onChange={handleChange}
            className="input w-full p-2 border rounded-md"
            disabled={isEnabled}
          />
          {errors.Swift && (
            <p className="text-red-500 text-sm">{errors.Swift}</p>
          )}
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
            <HasPermission
              module="Bank Account Details"
              action={["edit", "create"]}
            >
              <Button
                type="submit"
                disabled={isBankAccountCreating || isBankAccountUpdating}
                loading={isBankAccountCreating || isBankAccountUpdating}
              >
                {isBankAccountCreating || isBankAccountUpdating
                  ? id
                    ? "Updating..."
                    : "Creating..."
                  : id
                  ? "Update Bank Account Details"
                  : "Create Bank Account Details"}
              </Button>
            </HasPermission>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditBankAccountDetails;
