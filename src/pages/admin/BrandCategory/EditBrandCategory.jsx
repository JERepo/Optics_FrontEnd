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
import { useGetAllBrandsQuery } from "../../../api/brandsApi";

const EditBrandCategory = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { access, user } = useSelector((state) => state.auth);
  const [brandName, setBrandName] = useState("");
  const [Brands, setBrands] = useState("");

  const {
    data: brandCategory,
    isLoading: isBrandCatLoading,
    isSuccess,
  } = useGetBrandCatByIdQuery({ id });
  const [createBrandCategory, { isLoading: isBrandCatCreatingLoading }] =
    useCreateBrandCategoryMutation();
  const [updateBrandCategory, { isLoading: isBrandCatUpdating }] =
    useUpdateBrandCategoryMutation();
  const { data: allBrands, isLoading: isBrandLoading } =
    useGetAllBrandCatsQuery();
  const {
    data: mainBrands,
    isLoading: isMainLoading,
    isSuccess: isMainSucces,
  } = useGetAllBrandsQuery();

  const isEnabled = location.pathname.includes("/view");

  // Prefill values if editing
  useEffect(() => {
    if (!id || !brandCategory?.data || !mainBrands) return;

    setBrandName(brandCategory.data.BrandCategoryName || "");
    const filteredBrands = mainBrands
      ?.filter((b) => b.BrandCategoryId == id)
      .map((n) => n.BrandName)
      .join(", ");
  

    setBrands(filteredBrands);
  }, [id, brandCategory?.data, mainBrands]);

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
      BrandCategoryName: brandName,
    };
    try {
      if (id) {
        await updateBrandCategory({ id, payload }).unwrap();
        toast.success("Brand category updated successfully");
      } else {
        await createBrandCategory({
          id: user.Id,
          payload,
        }).unwrap();
        toast.success("Brand category created successfully");
        setBrandName("");
      }

      navigate(-1);
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  if (id && (isBrandCatLoading || isMainLoading))
    return <h1>Loading brands category...</h1>;

  return (
    <div className="max-w-2xl bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center mb-3">
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
              ? "View Brand Category"
              : "Edit Brand Category"
            : "Create Brand Category"}
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
                    : "Update Brand Category"
                  : isBrandCatCreatingLoading
                  ? "Creating..."
                  : "Create Brand Category"}
              </Button>
            </HasPermission>
          )}
        </div>
      </form>
      {isEnabled && (
        <div className=" p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Applicable Brands
          </h4>
          <div className="flex flex-wrap gap-2">
            {Brands ? (
              Brands.split(", ").map((brand, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-sm font-medium text-blue-700"
                >
                  {brand}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">
                No brands available for this category
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditBrandCategory;
