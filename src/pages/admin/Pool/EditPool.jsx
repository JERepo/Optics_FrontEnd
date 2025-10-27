import React, { useEffect, useState } from "react";
import {
  useCreatePoolMutation,
  useUpdatePoolMutation,
  useGetPoolByIdQuery,
  useGetAllPoolQuery,
} from "../../../api/poolApi";
import { FiArrowLeft } from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import { PoolCat } from "../../../utils/constants/PoolCategory";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import HasPermission from "../../../components/HasPermission";
import {
  useGetAllCompanyLocationsQuery,
  useGetCompanyIdQuery,
} from "../../../api/customerApi";
import { useGetAllLocationsQuery } from "../../../api/roleManagementApi";

const EditPool = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const { access, user } = useSelector((state) => state.auth);
  const [poolName, setPoolName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const { data: allPool } = useGetAllPoolQuery();
  const [createPool, { isLoading: isCreatingPool }] = useCreatePoolMutation();
  const [updatePool, { isLoading: isUpdatingPool }] = useUpdatePoolMutation();
  const isEnabled = location.pathname.includes("/view");
  const [locations, setLocations] = useState([]);

  const {
    data,
    isLoading: isPoolLoading,
    isSuccess,
  } = useGetPoolByIdQuery(
    { id },
    {
      skip: !id,
      refetchOnMountOrArgChange: true,
    }
  );

  const { data: allCustomerGroupIds, isLoading: isAllLocationsLoading } =
    useGetAllCompanyLocationsQuery();
  const { data: allLocations, isLoading: isLocationsLoading } =
    useGetAllLocationsQuery();

  // Prefill values if editing
  useEffect(() => {
    if (
      id &&
      isSuccess &&
      allLocations?.data &&
      allCustomerGroupIds?.data?.data
    ) {
      setPoolName(data.data.PoolName);
      setSelectedCategoryId(data?.data.PoolCategory);

      const companyIds = allCustomerGroupIds.data.data
        .filter(
          (c) =>
            c.CustomerPoolID == id ||
            c.VendorPoolID == id ||
            c.StockPoolID == id
        )
        .map((f) => f.CompanyId);

      const filteredLocations = allLocations.data.filter((l) =>
        companyIds.includes(l.Id)
      );
      setLocations(filteredLocations);
    }
  }, [id, data, isSuccess, allLocations, allCustomerGroupIds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!poolName || selectedCategoryId === null) {
      toast.error("Please fill all fields!");
      return;
    }

    const normalizedInput = poolName.toLowerCase().split(" ").join("");

    // Check for duplicate pool name, but EXCLUDE current pool if updating
    const poolExists = allPool?.data.find((p) => {
      console.log("P ---- ", p);
      const normalizedName = p.PoolName.toLowerCase().split(" ").join("");
      const isSameName = normalizedName === normalizedInput;
      // Convert both to numbers for comparison (or both to strings)
      const isDifferentPool = Number(p.Id) !== Number(id); // FIX: Convert both to numbers

      return isSameName && isDifferentPool;
    });

    console.log("poolExists - ", poolExists);
    if (poolExists) {
      toast.error("Pool name must be unique");
      return;
    }

    const payload = {
      PoolName: poolName,
      PoolCategory: String(selectedCategoryId),
    };

    try {
      if (id) {
        await updatePool({
          id: id,
          payload,
        }).unwrap();
        toast.success("Pool updated successfully");
      } else {
        await createPool({
          id: user.Id,
          payload,
        }).unwrap();
        toast.success("Pool created successfully");
        setPoolName("");
        setSelectedCategoryId(null);
      }
      navigate(-1);
    } catch (error) {
      // Show API error message if available
      const errorMessage = error?.data?.error || error?.message || "Something went wrong!";
      toast.error(errorMessage);
      console.error(error);
    }
  };

  if (id && (isPoolLoading || isLocationsLoading || isAllLocationsLoading))
    return <h1>Loading pool...</h1>;

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
          {id ? (isEnabled ? "View Pool" : "Edit Pool") : "Create New Pool"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Pool Name
          </label>
          <input
            type="text"
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary placeholder-gray-400 transition"
            placeholder="e.g. Summer Tournament 2023"
            value={poolName}
            onChange={(e) => setPoolName(e.target.value)}
            autoFocus
            disabled={isEnabled}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Pool Category
          </label>
          <div className="mt-2 flex flex-wrap gap-4">
            {PoolCat.map((pool) => (
              <div key={pool.Id} className="flex items-center gap-2">
                <input
                  type="radio"
                  id={`pool-${pool.Id}`}
                  name="poolCategory"
                  value={pool.Id}
                  checked={selectedCategoryId == pool.Id}
                  onChange={() => setSelectedCategoryId(pool.Id)}
                  className="scale-125 accent-blue-600"
                  disabled={isEnabled}
                />
                <label htmlFor={`pool-${pool.Id}`} className="text-gray-700">
                  {pool.PoolCategory}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          {!isEnabled && (
            <HasPermission module="Pool" action={["edit", "create"]}>
              <Button disabled={isCreatingPool || isUpdatingPool}>
                {id
                  ? isUpdatingPool
                    ? "Updating..."
                    : "Update Pool"
                  : isCreatingPool
                    ? "Creating..."
                    : "Create Pool"}
              </Button>
            </HasPermission>
          )}
        </div>
      </form>
      {isEnabled && (
        <div>
          <div className="text-lg">Applicable for Locations:</div>
          {locations?.length > 0 && (
            <div className="flex gap-3 items-center">
              {locations.map((l) => (
                <div className="flex">
                  {l.CompanyName}({l.LocationName})
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EditPool;
