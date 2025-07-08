import React, { useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import toast from "react-hot-toast";
import HasPermission from "../../../components/HasPermission";
import {
  useCreatematerialMasterMutation,
  useGetAllmaterialsQuery,
  useGetmaterialByIdQuery,
  useUpdatematerialMutation,
} from "../../../api/materialMaster";

const EditmaterialMaster = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [brandName, setBrandName] = useState("");
  const [materialFor, setMaterialFor] = useState(null); // 0 for Frame, 1 for Contact Lens

  const {
    data: brandCategory,
    isLoading: isBrandCatLoading,
    isSuccess,
  } = useGetmaterialByIdQuery({ id });

  const [createBrandGroup, { isLoading: isBrandCatCreatingLoading }] =
    useCreatematerialMasterMutation();
  const [updateBrandGroup, { isLoading: isBrandCatUpdating }] =
    useUpdatematerialMutation();
  const { data: allBrands } = useGetAllmaterialsQuery();

  const isEnabled = location.pathname.includes("/view");

  // Prefill values if editing
  useEffect(() => {
    if (id && isSuccess && brandCategory?.data) {
      setBrandName(brandCategory.data.MaterialName || "");
      setMaterialFor(
        brandCategory.data.MaterialFor !== undefined
          ? String(brandCategory.data.MaterialFor)
          : null
      );
    }
  }, [id, brandCategory, isSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!brandName || materialFor === null) {
      toast.error("Please fill all fields!");
      return;
    }

    if (brandName.length > 50) {
      toast.error("Cannot exceed more than 50 characters");
      return;
    }

    const userBrand = allBrands?.data?.find((p) => p.ApplicationUserId);
    const ApplicationUserId = userBrand?.ApplicationUserId || null;

    const payload = {
      MaterialName: brandName,
      MaterialFor: parseInt(materialFor), // Convert back to number
    };

    try {
      if (id) {
        await updateBrandGroup({ id, payload }).unwrap();
        toast.success("Season updated successfully");
      } else {
        await createBrandGroup({
          id: ApplicationUserId,
          payload,
        }).unwrap();
        toast.success("Season created successfully");
        setBrandName("");
        setMaterialFor(null);
      }

      navigate(-1);
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  if (id && isBrandCatLoading) return <h1>Loading seasons...</h1>;

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
          {id ? "Edit Material" : "Create New Material"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Season Name Field */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Frame material name
          </label>
          <input
            type="text"
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary placeholder-gray-400 transition"
            // placeholder="e.g. Summer Tournament 2023"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            autoFocus
            disabled={isEnabled}
          />
        </div>

        {/* MaterialFor Radio Buttons */}
        <div className="space-y-2">
          <p className="block text-sm font-medium text-gray-700">
            Applicable For
          </p>
          <div className="flex items-center gap-6">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="materialFor"
                value="0"
                checked={materialFor === "0"}
                onChange={(e) => setMaterialFor(e.target.value)}
                disabled={isEnabled}
              />
              <span>Frame</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="materialFor"
                value="1"
                checked={materialFor === "1"}
                onChange={(e) => setMaterialFor(e.target.value)}
                disabled={isEnabled}
              />
              <span>Contact Lens</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end">
          <HasPermission module="Brand group" action={["edit", "create"]}>
            <Button disabled={isBrandCatCreatingLoading || isBrandCatUpdating}>
              {id
                ? isBrandCatUpdating
                  ? "Updating..."
                  : "Update material"
                : isBrandCatCreatingLoading
                ? "Creating..."
                : "Create material"}
            </Button>
          </HasPermission>
        </div>
      </form>
    </div>
  );
};

export default EditmaterialMaster;
