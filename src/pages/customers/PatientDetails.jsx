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
}) => {
  const [formState, setFormState] = useState({
    name: "",
    MobileISDCode: "+91",
    MobAlert: 1,
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
        MobileISDCode: "+91",
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
  }, [initialData, isOpen]);

  const validateForm = (updatedFormState) => {
    const newErrors = {};
    if (!updatedFormState.name || updatedFormState.name.length < 2) {
      newErrors.name = "Name is required and must be at least 2 characters";
    } else if (updatedFormState.name.length > 150) {
      newErrors.name = "Name cannot exceed 150 characters";
    }
    // if (updatedFormState.email && !validateEmail(updatedFormState.email)) {
    //   newErrors.email = "Valid email is required if provided";
    // }else if(updatedFormState.email.length > 150){
    //   newErrors.email = "Email cannot exceed 150 characters"
    // }
    if (
      updatedFormState.mobile.length > 1 ||
      !validatePhone(updatedFormState.mobile, updatedFormState.MobileISDCode)
    ) {
      newErrors.mobile = "Enter valid mobile number";
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm(formState);
    if (Object.keys(validationErrors).length === 0) {
      onSave(formState);
      setFormState({
        name: "",
        MobileISDCode: "+91",
        MobAlert: 0,
        mobile: "",
        tel: "",
        email: "",
        dob: "",
        engraving: "",
        anniversary: "",
      });
      setErrors({});
    } else {
      setErrors(validationErrors);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Personal Details">
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          ["name", "Name"],
          ["mobile", "Mobile No"],
          ["tel", "Tel No"],
          ["email", "Email Id"],
          ["dob", "DOB"],
          ["engraving", "Engraving"],
          ["anniversary", "Anniversary"],
        ].map(([field, label]) => (
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
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
};

export default PatientDetails;
