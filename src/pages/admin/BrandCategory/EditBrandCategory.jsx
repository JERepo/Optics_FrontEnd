import React, { useEffect, useState } from "react";

import { FiArrowLeft } from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import HasPermission from "../../../components/HasPermission";
import {
  useCreateBrandCategoryMutation,
  useGetAllBrandCatsQuery,
  useGetBrandCatByIdQuery,
  useUpdateBrandCategoryMutation,
} from "../../../api/brandCategory";

const EditBrandCategory = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const access = useSelector((state) => state.auth.access);
  const [brandName, setBrandName] = useState("");

  const {
    data: brandCategory,
    isLoading: isBrandCatLoading,
    isSuccess,
  } = useGetBrandCatByIdQuery({ id });
  const [createBrandCategory, { isLoading: isBrandCatCreatingLoading }] =
    useCreateBrandCategoryMutation();
  const [updateBrandCategory, { isLoading: isBrandCatUpdating }] =
    useUpdateBrandCategoryMutation();
  const { data: allBrands } = useGetAllBrandCatsQuery();

  const isEnabled = location.pathname.includes("/view");

  // Prefill values if editing
  useEffect(() => {
    if (id && isSuccess && brandCategory?.data) {
      setBrandName(brandCategory.data.BrandCategoryName || "");
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
      return;
    }
    const userBrand = allBrands.data?.find((p) => p.ApplicationUserId);
    const ApplicationUserId = userBrand?.ApplicationUserId || null;
    console.log("application user id", userBrand);
    const brandId = ApplicationUserId;
    const payload = {
      BrandCategoryName: brandName,
    };
    try {
      if (id) {
        await updateBrandCategory({ id, payload }).unwrap();
        toast.success("Brand updated successfully");
      } else {
        await createBrandCategory({
          id: brandId,
          payload,
        }).unwrap();
        toast.success("Brand created successfully");
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
              ? "View Brand Category"
              : "Edit Brand Category"
            : "Create New Brand Category"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Brand Category
          </label>
          <input
            type="text"
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary placeholder-gray-400 transition"
            placeholder="e.g. Summer Tournament 2023"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            autoFocus
            disabled={isEnabled}
          />
        </div>

        <div className="pt-4 flex justify-end">
          {!isEnabled && (
            <HasPermission module="Pool" action={["edit", "create"]}>
              <Button
                disabled={isBrandCatCreatingLoading || isBrandCatUpdating}
              >
                {id
                  ? isBrandCatUpdating
                    ? "Updating..."
                    : "Update category"
                  : isBrandCatCreatingLoading
                  ? "Creating..."
                  : "Create category"}
              </Button>
            </HasPermission>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditBrandCategory;
