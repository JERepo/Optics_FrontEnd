import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiSave,
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
} from "react-icons/fi";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";

import Button from "../../../components/ui/Button";
import Loader from "../../../components/ui/Loader";
import Section from "../../../components/form/Section";
import FormInput from "../../../components/form/FormInput";
import FormSelect from "../../../components/form/FormSelect";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";

import { userSchema } from "../../../utils/schemas/userSchema";
import {
  useCreateUserMutation,
  useGetAllLocationsQuery,
  useGetAllRolesQuery,
  useGetUserByIdQuery,
  useUpdateUserManagementMutation,
} from "../../../api/roleManagementApi";
import HasPermission from "../../../components/HasPermission";

const EditUserManagement = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, access } = useSelector((state) => state.auth);
  const isReadOnly = location.pathname.toLowerCase().includes("/view");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);

  const [createUser, { isLoading: isCreatingUser }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdatingUser }] =
    useUpdateUserManagementMutation();

  const { data: rolesData, isLoading: loadingRoles } = useGetAllRolesQuery();
  const { data: locationsData, isLoading: loadingLocations } =
    useGetAllLocationsQuery();
  const { data: userData, isLoading: loadingUser } = useGetUserByIdQuery(
    { id },
    {
      skip: !id,
      refetchOnMountOrArgChange: true,
    }
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      FullName: "",
      UserName: "",
      Email: "",
      MobileNumber: "",
      Password: "",
      role: "",
      Locations: [],
    },
  });

  useEffect(() => {
    if (userData?.data && rolesData?.data) {
      const {
        FullName,
        UserName,
        Email,
        MobileNumber,
        Password,
        UserTypeData,
        Locations,
      } = userData.data;
      reset({
        FullName,
        UserName,
        Email,
        MobileNumber,
        Password,
        role: Number(UserTypeData?.Id),
        Locations: Locations ? Locations.split(",").map(String) : [],
      });
    }
  }, [userData?.data?.Id, rolesData?.data, reset]);

  const handleFormSubmit = (data) => {
    setFormData(data);
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!formData) return;

    const payload = {
      FullName: formData.FullName,
      UserName: formData.UserName,
      Email: formData.Email,
      MobileNumber: formData.MobileNumber,
      UserType: Number(formData.role),
      Locations: formData.Locations,
      ...(formData.Password && { Password: formData.Password }),
    };
    console.log("pp", payload);
    try {
      if (id) {
        await updateUser({ id, payload }).unwrap();
        toast.success("User updated successfully");
      } else {
        await createUser({ payload }).unwrap();
        toast.success("User created successfully");
      }
      navigate("/user-management");
    } catch (err) {
      toast.error("Something went wrong!", err?.message);
    } finally {
      setIsModalOpen(false);
      setFormData(null);
    }
  };

  const CheckboxGroup = ({ options, selected, onChange, isReadOnly }) => {
    const toggle = (id) => {
      onChange(
        selected.includes(id)
          ? selected.filter((item) => item !== id)
          : [...selected, id]
      );
    };

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {options.map(({ Id, LocationName }) => (
          <label
            key={Id}
            className="flex items-center space-x-2 text-sm text-gray-700"
          >
            <input
              type="checkbox"
              className="form-checkbox text-blue-600"
              checked={selected.includes(Id.toString())}
              onChange={() => toggle(Id.toString())}
              disabled={isReadOnly}
            />
            <span>{LocationName}</span>
          </label>
        ))}
      </div>
    );
  };

  if (loadingUser || loadingRoles || loadingLocations) return <Loader />;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate("/user-management")}
            variant="outline"
            icon={FiArrowLeft}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">
            {id ? "Edit User" : "Create User"}
          </h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <Section title="Personal Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="Full Name"
              name="FullName"
              register={register}
              error={errors.FullName}
              icon={FiUser}
              placeholder="John Doe"
              disabled={isReadOnly}
            />
            <FormInput
              label="Username"
              name="UserName"
              register={register}
              error={errors.UserName}
              icon={FiUser}
              placeholder="johndoe"
              disabled={isReadOnly}
            />
            <FormInput
              label="Email"
              name="Email"
              type="email"
              register={register}
              error={errors.Email}
              icon={FiMail}
              placeholder="john@example.com"
              disabled={isReadOnly}
            />
            <FormInput
              label="Phone"
              name="MobileNumber"
              register={register}
              error={errors.MobileNumber}
              icon={FiPhone}
              placeholder="123-456-7890"
              disabled={isReadOnly}
            />
          </div>
        </Section>

        <Section title="Account Settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <FormSelect
                  label="Role"
                  name="role"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.role}
                  options={
                    rolesData?.data
                      ?.filter((r) => r.Id !== 1)
                      .map((r) => ({ value: r.Id, label: r.UserType })) || []
                  }
                  disabled={isReadOnly}
                />
              )}
            />

            <FormInput
              label="Password"
              name="Password"
              type="text"
              register={register}
              error={errors.Password}
              icon={FiLock}
              placeholder="••••••••"
              disabled={isReadOnly}
            />
          </div>
        </Section>

        <Section title="Access Permissions">
          <Controller
            control={control}
            name="Locations"
            render={({ field }) => (
              <>
                <CheckboxGroup
                  options={locationsData?.data || []}
                  selected={field.value}
                  onChange={field.onChange}
                  isReadOnly={isReadOnly}
                />
                {errors.Locations && (
                  <p className="text-sm text-red-500 mt-2">
                    {errors.Locations.message}
                  </p>
                )}
              </>
            )}
          />
        </Section>

        <div className="px-6 py-4 bg-gray-50 flex justify-between border-t border-gray-200">
          <Button onClick={() => navigate("/user-management")}>Cancel</Button>
          <div className="flex space-x-3">
            <Button
              onClick={() => reset()}
              disabled={!isDirty}
              variant="outline"
            >
              Reset
            </Button>
            <HasPermission module="User Management" action={["edit", "create"]}>
              <Button
                type="submit"
                variant="primary"
                icon={FiSave}
                isLoading={isCreatingUser || isUpdatingUser}
                disabled={isReadOnly}
              >
                {id ? "Update changes" : "Save user"}
              </Button>
            </HasPermission>
          </div>
        </div>
      </form>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        title={id ? "Update User?" : "Create User?"}
        message={
          id
            ? "Are you sure you want to update this user?"
            : "Are you sure you want to create this user?"
        }
        confirmText={id ? "Update" : "Create"}
        cancelText="Cancel"
        danger={false}
        isLoading={isCreatingUser || isUpdatingUser}
      />
    </div>
  );
};

export default EditUserManagement;
