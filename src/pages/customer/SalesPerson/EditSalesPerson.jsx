import React, { useEffect, useState } from "react";
import { FiArrowLeft, FiUser, FiType, FiMapPin } from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import toast from "react-hot-toast";
import HasPermission from "../../../components/HasPermission";
import {
  useCreateBrandGroupMutation,
  useGetAllBrandGroupsQuery,
  useGetBrandGroupByIdQuery,
  useUpdateBrandGroupMutation,
} from "../../../api/brandGroup";
import { useGetAllLocationsQuery } from "../../../api/roleManagementApi";
import Loader from "../../../components/ui/Loader";

const SalesType = [
  { value: 0, label: "Sales Person" },
  { value: 1, label: "Executive" },
  { value: 2, label: "Others" },
];

const EditSalesPerson = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [brandName, setBrandName] = useState("");
  const [salesPersonType, setSelectPersonType] = useState("");
  const [selectedLocation, setSelectedLocations] = useState([]);

  const {
    data: brandCategory,
    isLoading: isBrandCatLoading,
    isSuccess,
  } = useGetBrandGroupByIdQuery({ id });
  const [createBrandGroup, { isLoading: isBrandCatCreatingLoading }] =
    useCreateBrandGroupMutation();
  const [updateBrandGroup, { isLoading: isBrandCatUpdating }] =
    useUpdateBrandGroupMutation();
  const { data: allBrands } = useGetAllBrandGroupsQuery();
  const { data: allLocations, isLoading: isLocationsLoading } = useGetAllLocationsQuery();

  const isEnabled = location.pathname.includes("/view");

  // Prefill values if editing
  useEffect(() => {
    if (id && isSuccess && brandCategory?.data) {
      setBrandName(brandCategory.data.BrandGroupName || "");
      // You should also set the salesPersonType and selectedLocation from the fetched data
      // setSelectPersonType(brandCategory.data.SalesType);
      // setSelectedLocations(brandCategory.data.Locations || []);
    }
  }, [id, brandCategory, isSuccess]);

  const handleLocationChange = (event) => {
    const { value, checked } = event.target;
    const numericValue = parseInt(value);

    if (checked) {
      setSelectedLocations((prev) => [...prev, numericValue]);
    } else {
      setSelectedLocations((prev) =>
        prev.filter((locationId) => locationId !== numericValue)
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!brandName) {
      toast.error("Please fill all fields!");
      return;
    }
    if (brandName.length > 50) {
      toast.error("Cannot exceed more than 50 characters");
      return;
    }
    if (!salesPersonType) {
      toast.error("Please select sales person type");
      return;
    }
    if (selectedLocation.length === 0) {
      toast.error("Please select at least one location");
      return;
    }

    const userBrand = allBrands?.data?.find((p) => p.ApplicationUserId);
    const ApplicationUserId = userBrand?.ApplicationUserId || null;
    const payload = {
      SalesName: brandName,
      SalesType: salesPersonType,
      Locations: selectedLocation,
    };

    console.log(payload);
    // try {
    //   if (id) {
    //     await updateBrandGroup({ id, payload }).unwrap();
    //     toast.success("Sales person updated successfully");
    //   } else {
    //     await createBrandGroup({
    //       id: ApplicationUserId,
    //       payload,
    //     }).unwrap();
    //     toast.success("Sales person created successfully");
    //     setBrandName("");
    //   }
    //   navigate(-1);
    // } catch (error) {
    //   toast.error("Something went wrong!");
    //   console.error(error);
    // }
  };

  if (id && isBrandCatLoading) return <Loader fullScreen />;

  return (
    <div className="max-w-2xl bg-white rounded-lg shadow-sm p-6">
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
              ? "View Sales Person"
              : "Edit Sales Person"
            : "Create New Sales Person"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sales Person Name */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <FiUser className="mr-2 text-gray-500" />
            Sales Person Name
          </label>
          <input
            type="text"
            className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition"
            placeholder="Enter sales person name"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            autoFocus
            disabled={isEnabled}
            maxLength={50}
          />
          <div className="text-xs text-gray-500 text-right">
            {brandName.length}/50 characters
          </div>
        </div>

        {/* Sales Person Type */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <FiType className="mr-2 text-gray-500" />
            Sales Person Type
          </label>
          <select
            onChange={(e) => setSelectPersonType(e.target.value)}
            value={salesPersonType}
            className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            disabled={isEnabled}
          >
            <option value="">Select type</option>
            {SalesType.map((s) => (
              <option value={s.value} key={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Locations */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <FiMapPin className="mr-2 text-gray-500" />
            Locations
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
                    checked={selectedLocation.includes(loc.Id)}
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
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end">
          {!isEnabled && (
            <HasPermission module="Sales Person" action={["edit", "create"]}>
              <Button
                type="submit"
                disabled={isBrandCatCreatingLoading || isBrandCatUpdating}
                className="w-full sm:w-auto"
                variant="primary"
                size="md"
                isLoading={isBrandCatCreatingLoading || isBrandCatUpdating}
                loadingText={
                  id ? "Updating..." : "Creating..."
                }
              >
                {id ? "Update Sales Person" : "Create Sales Person"}
              </Button>
            </HasPermission>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditSalesPerson;