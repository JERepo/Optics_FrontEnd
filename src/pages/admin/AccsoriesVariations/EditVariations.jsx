import React, { useEffect, useState } from "react";

import { FiArrowLeft } from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import toast from "react-hot-toast";
import HasPermission from "../../../components/HasPermission";
import {
  useCreateVariationMutation,
  useGetVariationByIdQuery,
  useGetVariationsQuery,
  useUpdateVariationMutation,
} from "../../../api/variations";
import { useSelector } from "react-redux";

const EditVariations = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [brandName, setBrandName] = useState("");
  const { user } = useSelector((state) => state.auth);

  const {
    data: variation,
    isLoading: isVariationLoading,
    isSuccess,
  } = useGetVariationByIdQuery({ id });

  const [createVariation, { isLoading: isVariationCreating }] =
    useCreateVariationMutation();
  const [updateVariation, { isLoading: isVariationUpdating }] =
    useUpdateVariationMutation();
  const { data: allVariations } = useGetVariationsQuery();

  const isEnabled = location.pathname.includes("/view");

  // Prefill values if editing
  useEffect(() => {
    if (id && isSuccess && variation?.data) {
      setBrandName(variation.data.VariationName || "");
    }
  }, [id, variation, isSuccess]);

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
   
    const payload = {
      VariationName: brandName,
    };
    try {
      if (id) {
        await updateVariation({ id, payload }).unwrap();
        toast.success("Variation updated successfully");
      } else {
        await createVariation({
          id: user.Id,
          payload,
        }).unwrap();
        toast.success("Variation created successfully");
        setBrandName("");
      }

      navigate(-1);
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  if (id && isVariationLoading) return <h1>Loading variations...</h1>;

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
          {id
            ? isEnabled
              ? "View Variation"
              : "Edit Variation"
            : "Create New Variation"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Variation
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
            <HasPermission
              module="Variation Master"
              action={["edit", "create"]}
            >
              <Button disabled={isVariationCreating || isVariationUpdating}>
                {id
                  ? isVariationUpdating
                    ? "Updating..."
                    : "Update Variation"
                  : isVariationCreating
                  ? "Creating..."
                  : "Create Variation"}
              </Button>
            </HasPermission>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditVariations;
