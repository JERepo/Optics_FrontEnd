import React, { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";

const PersonalDetailsModal = ({ isOpen, onClose, onSave ,initialData}) => {
  const [formState, setFormState] = useState({
    name: "",
    mobile: "",
    tel: "",
    email: "",
    dob: "",
    engraving: "",
    anniversary: "",
  });

   useEffect(() => {
    if (initialData) {
      setFormState(initialData);
    } else {
      setFormState({
        name: "",
        mobile: "",
        tel: "",
        email: "",
        dob: "",
        engraving: "",
        anniversary: "",
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formState);
    setFormState({
      name: "",
      mobile: "",
      tel: "",
      email: "",
      dob: "",
      engraving: "",
      anniversary: "",
    });
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
            <label htmlFor={field} className="text-sm font-medium text-gray-700">
              {label}
            </label>
            <input
              type={field === "dob" || field === "anniversary" ? "date" : "text"}
              name={field}
              value={formState[field]}
              onChange={handleChange}
              className="mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500"
            />
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

export default PersonalDetailsModal;
