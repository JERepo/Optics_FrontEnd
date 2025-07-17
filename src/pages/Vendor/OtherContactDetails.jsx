import React, { useState, useEffect } from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Input from "../../components/Form/Input";
import Select from "../../components/Form/Select";

const OtherContactDetails = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  countries = [],
  countryIsd,
}) => {
  const [formData, setFormData] = useState({
    other_contact_name: "",
    other_contact_designation: "",
    other_contact_email: "",
    other_contact_ISDcode: countryIsd?.data?.isdCode || "+91",
    other_contact_mobNumber: "",
  });
  useEffect(() => {
    if (!initialData) {
      setFormData({
        other_contact_name: "",
        other_contact_designation: "",
        other_contact_email: "",
        other_contact_ISDcode: "+91",
        other_contact_mobNumber: "",
      });
    } else {
      setFormData({
        ...initialData,
        other_contact_ISDcode:
          initialData.other_contact_ISDcode?.toString() ?? "+91",
      });
    }
  }, [initialData, isOpen]);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.other_contact_name.trim()) {
      newErrors.other_contact_name = "Name is required";
    }
    if (
      formData.other_contact_email &&
      !/^\S+@\S+\.\S+$/.test(formData.other_contact_email)
    ) {
      newErrors.other_contact_email = "Invalid email format";
    }
    if (
      formData.other_contact_mobNumber &&
      !/^\d{10}$/.test(formData.other_contact_mobNumber)
    ) {
      newErrors.other_contact_mobNumber = "Mobile number must be 10 digits";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleCancel = (e) => {
    e.preventDefault(); // Prevent form submission
    onClose(); // Just close the modal
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Contact Details" : "Add Contact Details"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name *"
          name="other_contact_name"
          value={formData.other_contact_name}
          onChange={handleChange}
          placeholder="Enter Name"
          error={errors.other_contact_name}
          required
        />
        <Input
          label="Designation"
          name="other_contact_designation"
          value={formData.other_contact_designation}
          onChange={handleChange}
          placeholder="Enter Designation"
          error={errors.other_contact_designation}
        />
        <Input
          label="Email"
          name="other_contact_email"
          value={formData.other_contact_email}
          onChange={handleChange}
          placeholder="Enter Email"
          error={errors.other_contact_email}
        />
        <div className="flex gap-4">
          <Select
            label="Country Code"
            name="other_contact_ISDcode"
            value={formData.other_contact_ISDcode?.toString()}
            onChange={handleChange}
            options={countries.map((c) => ({
              Id: c.ISDCode?.toString(),
              CountryName: `${c.CountryName} (${c.ISDCode})`,
            }))}
            optionValue="Id"
            optionLabel="CountryName"
            className="w-1/3"
          />
          <Input
            label="Mobile Number"
            name="other_contact_mobNumber"
            value={formData.other_contact_mobNumber}
            onChange={handleChange}
            placeholder="Enter Mobile Number"
            error={errors.other_contact_mobNumber}
            className="w-2/3"
          />
        </div>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
};

export default OtherContactDetails;
