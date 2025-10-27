import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";

const PatientDetails = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  validateEmail,
  validateDate,
  validatePhone,
  countries = [],
  countryIsd,
  companyType,
}) => {
  const [formState, setFormState] = useState({
    name: "",
    MobileISDCode: countryIsd?.country.ISDCode || "",
    MobAlert: 0,
    mobile: "",
    tel: "",
    email: "",
    dob: "",
    engraving: "",
    anniversary: "",
  });

  const [errors, setErrors] = useState({});


  useEffect(() => {
    if (initialData) {
      setFormState(initialData);
    } else {
      setFormState({
        name: "",
        MobileISDCode: countryIsd?.country.ISDCode || "",
        MobAlert: 0,
        mobile: "",
        tel: "",
        email: "",
        dob: "",
        engraving: "",
        anniversary: "",
      });
    }
    setErrors({});
  }, [initialData, isOpen, countryIsd, countries]);

  const validateForm = (updatedFormState) => {
    const newErrors = {};

    // Name validation
    if (!updatedFormState.name || updatedFormState.name.trim().length < 2) {
      newErrors.name = "Name is required and must be at least 2 characters";
    } else if (updatedFormState.name.length > 150) {
      newErrors.name = "Name cannot exceed 150 characters";
    }

    // Mobile ISD Code - Mandatory
    if (!updatedFormState.MobileISDCode) {
      newErrors.MobileISDCode = "Country code is required";
    }

    // Mobile Number - Mandatory
    if (!updatedFormState.mobile || updatedFormState.mobile.trim() === "") {
      newErrors.mobile = "Mobile number is required";
    } else if (
      !validatePhone(updatedFormState.mobile, updatedFormState.MobileISDCode)
    ) {
      newErrors.mobile = "Enter valid mobile number";
    }

    // Email (optional but valid if provided)
    if (updatedFormState.email && !validateEmail(updatedFormState.email)) {
      newErrors.email = "Enter valid email address";
    }

    // DOB & Anniversary (optional but valid if provided)
    if (updatedFormState.dob && !validateDate(updatedFormState.dob)) {
      newErrors.dob = "Enter valid date of birth";
    }

    if (updatedFormState.anniversary && !validateDate(updatedFormState.anniversary)) {
      newErrors.anniversary = "Enter valid anniversary date";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => {
      const updatedFormState = { ...prev, [name]: value };
      setErrors(validateForm(updatedFormState));
      return updatedFormState;
    });
  };

  const handleDelete = () => {
    if (
      initialData &&
      window.confirm("Are you sure you want to delete this patient detail?")
    ) {
      onSave(null); // Passing null to indicate deletion
      onClose();
    }
  };


  return (
    <div>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={initialData ? "Edit Patient Details" : "Add Patient Details"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const validationErrors = validateForm(formState);
            if (Object.keys(validationErrors).length === 0) {
              onSave(formState);
              if (!initialData) {
                setFormState({
                  name: "",
                  MobileISDCode: countryIsd?.country.ISDCode || "",
                  MobAlert: 0,
                  mobile: "",
                  tel: "",
                  email: "",
                  dob: "",
                  engraving: "",
                  anniversary: "",
                });
              }
              setErrors({});
            } else {
              setErrors(validationErrors);
            }
          }}
          className="space-y-4"
        >
          {/* Name */}
          <div className="flex flex-col">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formState.name}
              onChange={handleChange}
              className="mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Mobile with ISD Code */}
          {/* Mobile with ISD Code */}
          <div className="flex flex-col">
            <label htmlFor="mobile" className="text-sm font-medium text-gray-700">
              Mobile No <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative">
                <select
                  name="MobileISDCode"
                  value={formState.MobileISDCode}
                  onChange={handleChange}
                  className={`w-28 border rounded px-3 py-2 bg-white focus:outline-none focus:ring focus:border-blue-500 ${errors.MobileISDCode ? "border-red-500" : "border-gray-300"
                    }`}
                >
                  <option value="">Select</option>
                  {countries?.map((c) => (
                    <option key={c.Id} value={c.ISDCode}>
                      {c.ISDCode}
                    </option>
                  ))}
                </select>
                {errors.MobileISDCode && (
                  <p className="absolute left-0 -bottom-6 text-red-500 text-xs">
                    {errors.MobileISDCode}
                  </p>
                )}
              </div>

              <div className="flex-1 relative">
                <input
                  type="text"
                  name="mobile"
                  value={formState.mobile}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500 ${errors.mobile ? "border-red-500" : "border-gray-300"
                    }`}
                  placeholder="Enter mobile number"
                />
                {errors.mobile && (
                  <p className="absolute left-0 -bottom-6 text-red-500 text-xs">
                    {errors.mobile}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Optional Fields */}
          {[
            ["email", "Email Id"],
            ["dob", "DOB"],
            ["engraving", "Engraving"],
            ["anniversary", "Anniversary"],
          ]
            .filter(([field]) => {
              if (companyType?.data.CompanyType === 0) {
                return !["dob", "engraving", "anniversary"].includes(field);
              }
              return true;
            })
            .map(([field, label]) => (
              <div key={field} className="flex flex-col">
                <label
                  htmlFor={field}
                  className="text-sm font-medium text-gray-700"
                >
                  {label}
                </label>
                <input
                  type={
                    field === "dob" || field === "anniversary" ? "date" : "text"
                  }
                  name={field}
                  value={formState[field]}
                  onChange={handleChange}
                  className="mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500"
                />
                {errors[field] && (
                  <p className="text-red-500 text-sm mt-1">{errors[field]}</p>
                )}
              </div>
            ))}

          <div className="flex justify-between pt-4">
            {initialData && (
              <Button
                type="button"
                onClick={handleDelete}
                variant="danger"
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </Button>
            )}
            <div className="flex justify-end space-x-3 ml-auto">
              <Button type="button" onClick={onClose} variant="secondary">
                Cancel
              </Button>
              <Button type="submit">{initialData ? "Update" : "Save"}</Button>
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default PatientDetails;
