import React, { useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import toast from "react-hot-toast";
import HasPermission from "../../../components/HasPermission";

import {
  useCreateBrandsMutation,
  useGetAllBrandsQuery,
  useGetBrandByIdQuery,
  useUpdateBrandsMutation,
} from "../../../api/brandsApi";
import { BRAND_CATEGORIES } from "../../../utils/constants/brands";
import { useGetAllBrandGroupsQuery } from "../../../api/brandGroup";
import { useGetAllBrandCatsQuery } from "../../../api/brandCategory";
import { useSelector } from "react-redux";

const EditBrands = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const isEnabled = location.pathname.includes("/view");

  const [brandName, setBrandName] = useState("");
  const [selectedBrandGroup, setSelectedBrandGroup] = useState("");
  const [selectedBrandCat, setSelectedBrandCat] = useState("");
  const [categoryToggles, setCategoryToggles] = useState({
    ContactLensActive: false,
    OpticalLensActive: false,
    FrameActive: false,
    OthersProductsActive: false,
  });

  const [isSelectedCLBatchCode, setIsSelectCLBatchCode] = useState(false);
  const [isSelectedOLBarcode, setIsSelectOLBarcode] = useState(false);

  const {
    data: brand,
    isLoading: isBrandLoading,
    isSuccess,
  } = useGetBrandByIdQuery({ id });
  const [createBrands, { isLoading: isBrandCreating }] =
    useCreateBrandsMutation();
  const [updateBrands, { isLoading: isBrandUpdating }] =
    useUpdateBrandsMutation();
  const { data: allBrands } = useGetAllBrandsQuery();
  const { data: allBrandGroups } = useGetAllBrandGroupsQuery();
  const { data: allBrandCats } = useGetAllBrandCatsQuery();

  useEffect(() => {
    if (id && isSuccess && brand?.data) {
      const data = brand.data;

      console.log(data);

      setBrandName(data.BrandName || "");
      setSelectedBrandGroup(data.BrandGroupID || "");
      setSelectedBrandCat(data.BrandCategoryId || "");

      setCategoryToggles({
        ContactLensActive: data.ContactLensActive === 1,
        OpticalLensActive: data.OpticalLensActive === 1,
        FrameActive: data.FrameActive === 1,
        OthersProductsActive: data.OthersProductsActive === 1,
      });
      setIsSelectCLBatchCode(data.CLBatchCode === 1);
      setIsSelectOLBarcode(data.OLStockBarcode === 1);
    }
  }, [id, brand, isSuccess]);

  const handleToggle = (key) => {
    setCategoryToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!brandName) {
      toast.error("Please fill all fields!");
      return;
    }

    const isAnyCategoryActive = Object.values(categoryToggles).some(
      (value) => value === true
    );
    if (!isAnyCategoryActive) {
      toast.error("please select at least one field");
      return;
    }

    const payload = {
      BrandName: brandName,
      BrandGroupID: parseInt(selectedBrandGroup),
      BrandCategoryId: parseInt(selectedBrandCat),
      ContactLensActive: categoryToggles.ContactLensActive ? 1 : 0,
      OpticalLensActive: categoryToggles.OpticalLensActive ? 1 : 0,
      FrameActive: categoryToggles.FrameActive ? 1 : 0,
      OthersProductsActive: categoryToggles.OthersProductsActive ? 1 : 0,
      CLBatchCode: isSelectedCLBatchCode ? 1 : 0,
      OLStockBarcode: isSelectedOLBarcode ? 1 : 0
    };

    try {
      if (id) {

        console.log("Payload - ", payload);

        await updateBrands({ id, payload }).unwrap();
        toast.success("Brand updated successfully");
      } else {
        await createBrands({ id: user.Id, payload }).unwrap();
        toast.success("Brand created successfully");
        setBrandName("");
        setSelectedBrandGroup("");
        setSelectedBrandCat("");
        setCategoryToggles({
          ContactLensActive: false,
          OpticalLensActive: false,
          FrameActive: false,
          OthersProductsActive: false,
        });
      }
      navigate(-1);
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  if (id && isBrandLoading) return <h1>Loading brand...</h1>;

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
          {id ? (isEnabled ? "View Brand" : "Edit Brand") : "Create New Brand"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand Name */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Brand Name
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

        {/* Category Toggles */}
        <div className="flex flex-wrap gap-4">
          {BRAND_CATEGORIES.map((category) => (
            <div key={category.key} className="flex items-center">
              <input
                type="checkbox"
                id={category.key}
                checked={categoryToggles[category.key] || false}
                onChange={() => handleToggle(category.key)}
                disabled={isEnabled}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label
                htmlFor={category.key}
                className="ml-2 text-sm text-gray-700"
              >
                {category.name}
              </label>
            </div>
          ))}
        </div>
        {(categoryToggles.ContactLensActive || categoryToggles.OpticalLensActive) && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {/* <p className="text-sm font-medium text-gray-700 mb-3">
              Additional Settings
            </p> */}
            <div className="flex flex-wrap gap-6">
              {categoryToggles.ContactLensActive && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="clBatchCode"
                    checked={isSelectedCLBatchCode || false}
                    onChange={(e) => setIsSelectCLBatchCode(e.target.checked)}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    disabled={isEnabled}
                  />
                  <label htmlFor="clBatchCode" className="ml-2 text-sm text-gray-700">
                    Maintain CLBatchCode
                  </label>
                </div>
              )}
              {categoryToggles.OpticalLensActive && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="olBarcode"
                    checked={isSelectedOLBarcode || false}
                    onChange={(e) => setIsSelectOLBarcode(e.target.checked)}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    disabled={isEnabled}
                  />
                  <label htmlFor="olBarcode" className="ml-2 text-sm text-gray-700">
                    Maintain Barcode
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Brand Group Dropdown */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Brand Group
          </label>
          <select
            value={selectedBrandGroup}
            onChange={(e) => setSelectedBrandGroup(e.target.value)}
            disabled={isEnabled}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition"
          >
            <option value="">Select Brand Group</option>

            {allBrandGroups?.data
              .filter((group) => group.IsActive === 1)
              .sort((a, b) => a.BrandGroupName.localeCompare(b.BrandGroupName))
              ?.map((g) => (
                <option key={g.Id} value={g.Id}>
                  {g.BrandGroupName}
                </option>
              ))}
          </select>
        </div>

        {/* Brand Category Dropdown */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Brand Category
          </label>
          <select
            value={selectedBrandCat}
            onChange={(e) => setSelectedBrandCat(e.target.value)}
            disabled={isEnabled}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition"
          >
            <option value="">Select Brand</option>
            {allBrandCats?.data
              ?.filter((cat) => cat.IsActive)
              ?.sort((a, b) =>
                a.BrandCategoryName.localeCompare(b.BrandCategoryName)
              )
              ?.map((cat) => (
                <option key={cat.Id} value={cat.Id}>
                  {cat.BrandCategoryName}
                </option>
              ))}
          </select>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end">
          {!isEnabled && (
            <HasPermission module="Brand" action={["edit", "create"]}>
              <Button disabled={isBrandCreating || isBrandUpdating}>
                {id
                  ? isBrandUpdating
                    ? "Updating..."
                    : "Update Brand"
                  : isBrandCreating
                    ? "Creating..."
                    : "Create Brand"}
              </Button>
            </HasPermission>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditBrands;
