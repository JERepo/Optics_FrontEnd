import React, { useEffect, useState } from "react";

import { FiArrowLeft } from "react-icons/fi";
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

const EditBankMaster = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [brandName, setBrandName] = useState("");

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

  const isEnabled = location.pathname.includes("/view");

  // Prefill values if editing
  useEffect(() => {
    if (id && isSuccess && brandCategory?.data) {
      setBrandName(brandCategory.data.BrandGroupName || "");
    }
  }, [id, brandCategory, isSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!brandName) {
      toast.error("Please fill all fields!");
      return;
    }
    if (brandName.length > 50) {
      toast.error("Cannot exceed more than 50 characters");
    }
    const userBrand = allBrands.data.find((p) => p.ApplicationUserId);
    const ApplicationUserId = userBrand?.ApplicationUserId || null;
    const payload = {
      BrandGroupName: brandName,
    };
    try {
      if (id) {
        await updateBrandGroup({ id, payload }).unwrap();
        toast.success("Group updated successfully");
      } else {
        await createBrandGroup({
          id: ApplicationUserId,
          payload,
        }).unwrap();
        toast.success("Group created successfully");
        setBrandName("");
      }

      navigate(-1);
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  if (id && isBrandCatLoading) return <h1>Loading brands category...</h1>;

  return (
    <div className="max-w-2xl bg-white rounded-lg shadow-sm p-4">
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
              ? "View Bank Master"
              : "Edit Bank Master"
            : "Create New Bank Master"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Bank Name
          </label>
          <input
            type="text"
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary placeholder-gray-400 transition"
            placeholder=""
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            autoFocus
            disabled={isEnabled}
          />
        </div>

        <div className="pt-4 flex justify-end">
          {!isEnabled && (
            <HasPermission module="Brand group" action={["edit", "create"]}>
              <Button
                disabled={isBrandCatCreatingLoading || isBrandCatUpdating}
              >
                {id
                  ? isBrandCatUpdating
                    ? "Updating..."
                    : "Update bank"
                  : isBrandCatCreatingLoading
                  ? "Creating..."
                  : "Create bank"}
              </Button>
            </HasPermission>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditBankMaster;
