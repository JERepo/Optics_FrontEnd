import React, { useEffect, useState } from "react";

import { FiArrowLeft } from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import toast from "react-hot-toast";
import HasPermission from "../../../components/HasPermission";

import {
  useCreateCustomerGroupMutation,
  useGetAllCustomerGroupsQuery,
  useGetCustomerGroupByIdQuery,
  useUpdateCustomerGroupMutation,
} from "../../../api/customerGroup";
import { useSelector } from "react-redux";
import { useGetAllLocationsQuery } from "../../../api/roleManagementApi";

const EditCustomerGroup = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [brandName, setBrandName] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");


  const { hasMultipleLocations,user } = useSelector((state) => state.auth);

  const {
    data: brandCategory,
    isLoading: isBrandCatLoading,
    isSuccess,
  } = useGetCustomerGroupByIdQuery({ id });
  const [createBrandGroup, { isLoading: isBrandCatCreatingLoading }] =
    useCreateCustomerGroupMutation();
  const [updateBrandGroup, { isLoading: isBrandCatUpdating }] =
    useUpdateCustomerGroupMutation();
  const { data: allBrands } = useGetAllCustomerGroupsQuery();
  const { data: allLocations } = useGetAllLocationsQuery();

  const isEnabled = location.pathname.includes("/view");

  // Prefill values if editing
  useEffect(() => {
    if (id && isSuccess && brandCategory?.data) {
      setBrandName(brandCategory.data.data.GroupName || "");
      setSelectedLocation(String(brandCategory.data.data.CompanyID));
    }
  }, [id, brandCategory, isSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!brandName || !selectedLocation) {
      toast.error("Please fill all fields!");
      return;
    }
    if (brandName.length > 50) {
      toast.error("Cannot exceed more than 50 characters");
    }
    
    const payload = {
      GroupName: brandName,
    };
    try {
      if (id) {
        await updateBrandGroup({
          companyId: selectedLocation,
          id,
          payload,
        }).unwrap();
        toast.success("Customer Group updated successfully");
      } else {
        await createBrandGroup({
          id: user.Id,
          companyId: selectedLocation,
          payload,
        }).unwrap();
        toast.success("Customer Group created successfully");
        setBrandName("");
      }

      navigate(-1);
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  if (id && isBrandCatLoading) return <h1>Loading...</h1>;

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
          {id ? isEnabled ? "View Customer Group" :"Edit Customer Group" : "Create New Customer Group"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          {Array.isArray(hasMultipleLocations) &&
            hasMultipleLocations.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Select Location
                </label>
                <select
                  className="input"
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  value={selectedLocation}
                  disabled={isEnabled}
                >
                  <option value="">Select location</option>
                  {allLocations?.data
                    ?.filter((loc) => hasMultipleLocations.includes(loc.Id))
                    .map((loc) => (
                      <option key={loc.Id} value={loc.Id}>
                        {loc.LocationName}
                      </option>
                    ))}
                </select>
              </div>
            )}
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Customer Group Name
          </label>
          <input
            type="text"
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg  placeholder-gray-400 transition"
            placeholder=""
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            autoFocus
            disabled={isEnabled}
          />
        </div>

        <div className="pt-4 flex justify-end">
          {!isEnabled && (
            <HasPermission module="Customer Group" action={["edit", "create"]}>
              <Button
                disabled={isBrandCatCreatingLoading || isBrandCatUpdating}
              >
                {id
                  ? isBrandCatUpdating
                    ? "Updating..."
                    : "Update Customer Group"
                  : isBrandCatCreatingLoading
                  ? "Creating..."
                  : "Create Customer Group"}
              </Button>
            </HasPermission>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditCustomerGroup;
