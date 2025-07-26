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
import { useSelector } from "react-redux";
import { useGetAllBrandsQuery } from "../../../api/brandsApi";

const EditBrandGroup = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [brandName, setBrandName] = useState("");
  const { user } = useSelector((state) => state.auth);
  const [Brands, setBrands] = useState("");

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
  const {
    data: mainBrands,
    isLoading: isMainLoading,
    isSuccess: isMainSucces,
  } = useGetAllBrandsQuery();

  const isEnabled = location.pathname.includes("/view");

  // Prefill values if editing
  useEffect(() => {
    if (!id || !brandCategory?.data || !mainBrands) return;
    setBrandName(brandCategory.data.BrandGroupName || "");

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
    }

    const payload = {
      BrandGroupName: brandName,
    };
    try {
      if (id) {
        await updateBrandGroup({ id, payload }).unwrap();
        toast.success("Brand group updated successfully");
      } else {
        await createBrandGroup({
          id: user.Id,
          payload,
        }).unwrap();
        toast.success("Brand group created successfully");
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
              ? "View Brand Group"
              : "Edit Brand Group"
            : "Create Brand Group"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Brand Group
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
                    : "Update Brand Group"
                  : isBrandCatCreatingLoading
                  ? "Creating..."
                  : "Create Brand Group"}
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

export default EditBrandGroup;
