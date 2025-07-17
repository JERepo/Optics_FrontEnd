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
import { hasPermission } from "../../../utils/permissionUtils";
import { useSelector } from "react-redux";
import HasPermission from "../../../components/HasPermission";

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

  // Prefill values if editing
  useEffect(() => {
    if (id && isSuccess && data?.data) {
      setPoolName(data.data.PoolName);
      setSelectedCategoryId(data?.data.PoolCategory);
    }
  }, [id, data, isSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!poolName || selectedCategoryId === null) {
      toast.error("Please fill all fields!");
      return;
    }

    const payload = {
      PoolName: poolName,
      PoolCategory: selectedCategoryId,
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
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  if (id && isPoolLoading) return <h1>Loading pool...</h1>;

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
    </div>
  );
};

export default EditPool;
