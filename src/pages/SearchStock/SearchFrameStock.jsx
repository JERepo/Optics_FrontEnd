import React, { useState } from "react";
import Button from "../../components/ui/Button";
import {
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiSearch,
  FiCheck,
} from "react-icons/fi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useGetAllBrandGroupsQuery } from "../../api/brandGroup";
import { Table, TableCell, TableRow } from "../../components/Table";
import { useGetFrameSizesQuery } from "../../api/frameMasterApi";

const toTitleCase = (str) =>
  str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const typesOptions = [
  { Id: "F", Name: "Full Rim" },
  { Id: "H", Name: "Half Rim" },
  { Id: "R", Name: "Rimless" },
];

const categoryOptions = [
  { Id: "O", Name: "Frame" },
  { Id: "S", Name: "Sunglass" },
];

const othersOptions = [
  { Id: "Rxable", Name: "Rxable" },
  { Id: "Photochromatic", Name: "Photochromatic" },
  { Id: "Polarised", Name: "Polarised" },
  { Id: "ClipOn", Name: "ClipOn" },
];

const SearchFrameStock = () => {
  const { data: allBrands } = useGetAllBrandsQuery();
  const { data: allBrandGroups } = useGetAllBrandGroupsQuery();
  const { data: allSizes } = useGetFrameSizesQuery();
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedBrandGroups, setSelectedBrandGroups] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedOthers, setSelectedOthers] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showBrandGroupDropdown, setShowBrandGroupDropdown] = useState(false);
  const [showTypesDropdown, setShowTypesDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showOthersDropdown, setShowOthersDropdown] = useState(false);
  const [showSizesDropdown, setShowSizesDropdown] = useState(false);
  const [brandSearchTerm, setBrandSearchTerm] = useState("");
  const [brandGroupSearchTerm, setBrandGroupSearchTerm] = useState("");
  const [typesSearchTerm, setTypesSearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [othersSearchTerm, setOthersSearchTerm] = useState("");
  const [sizeSearchTerm, setSizeSearchTerm] = useState("");
  // State for individual column search terms
  const [columnSearchTerms, setColumnSearchTerms] = useState({
    "s.no": "",
    "brand group": "",
    "brand name": "",
    cat: "",
    type: "",
    "model no": "",
    "colour code": "",
    "size-dbl-length": "",
    barcode: "",
    "frame colour": "",
    others: "",
    mrp: "",
    stock: "",
    "stock avl": "",
    action: "",
  });

  // Toggle brand selection
  const toggleBrand = (brand) => {
    if (selectedBrands.some((b) => b.Id === brand.Id)) {
      setSelectedBrands(selectedBrands.filter((b) => b.Id !== brand.Id));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  // Toggle brand group selection
  const toggleBrandGroup = (brandGroup) => {
    if (selectedBrandGroups.some((bg) => bg.Id === brandGroup.Id)) {
      setSelectedBrandGroups(
        selectedBrandGroups.filter((bg) => bg.Id !== brandGroup.Id)
      );
    } else {
      setSelectedBrandGroups([...selectedBrandGroups, brandGroup]);
    }
  };

  // Toggle type selection
  const toggleType = (type) => {
    if (selectedTypes.some((t) => t.Id === type.Id)) {
      setSelectedTypes(selectedTypes.filter((t) => t.Id !== type.Id));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  // Toggle category selection
  const toggleCategory = (category) => {
    if (selectedCategories.some((c) => c.Id === category.Id)) {
      setSelectedCategories(
        selectedCategories.filter((c) => c.Id !== category.Id)
      );
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Toggle others selection
  const toggleOthers = (other) => {
    if (selectedOthers.some((o) => o.Id === other.Id)) {
      setSelectedOthers(selectedOthers.filter((o) => o.Id !== other.Id));
    } else {
      setSelectedOthers([...selectedOthers, other]);
    }
  };

  // Toggle sizes selection
  const toggleSizes = (size) => {
    if (selectedSizes.some((o) => o.Id === size.Id)) {
      setSelectedSizes(selectedSizes.filter((o) => o.Id !== size.Id));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  // Clear all selections
  const clearAllBrands = () => setSelectedBrands([]);
  const clearAllBrandGroups = () => setSelectedBrandGroups([]);
  const clearAllTypes = () => setSelectedTypes([]);
  const clearAllCategories = () => setSelectedCategories([]);
  const clearAllOthers = () => setSelectedOthers([]);
  const clearAllSizes = () => setSelectedSizes([]);

  // Toggle dropdowns (only one open at a time)
  const toggleBrandDropdown = () => {
    setShowBrandDropdown(!showBrandDropdown);
    setShowBrandGroupDropdown(false);
    setShowTypesDropdown(false);
    setShowCategoryDropdown(false);
    setShowOthersDropdown(false);
    setShowSizesDropdown(false);
  };

  const toggleBrandGroupDropdown = () => {
    setShowBrandGroupDropdown(!showBrandGroupDropdown);
    setShowBrandDropdown(false);
    setShowTypesDropdown(false);
    setShowCategoryDropdown(false);
    setShowOthersDropdown(false);
    setShowSizesDropdown(false);
  };

  const toggleTypesDropdown = () => {
    setShowTypesDropdown(!showTypesDropdown);
    setShowBrandDropdown(false);
    setShowBrandGroupDropdown(false);
    setShowCategoryDropdown(false);
    setShowOthersDropdown(false);
    setShowSizesDropdown(false);
  };

  const toggleCategoryDropdown = () => {
    setShowCategoryDropdown(!showCategoryDropdown);
    setShowBrandDropdown(false);
    setShowBrandGroupDropdown(false);
    setShowTypesDropdown(false);
    setShowOthersDropdown(false);
    setShowSizesDropdown(false);
  };

  const toggleOthersDropdown = () => {
    setShowOthersDropdown(!showOthersDropdown);
    setShowBrandDropdown(false);
    setShowBrandGroupDropdown(false);
    setShowTypesDropdown(false);
    setShowCategoryDropdown(false);
    setShowSizesDropdown(false);
  };

  const toggleSizesDropdown = () => {
    setShowSizesDropdown(!showSizesDropdown);
    setShowBrandDropdown(false);
    setShowBrandGroupDropdown(false);
    setShowTypesDropdown(false);
    setShowCategoryDropdown(false);
    setShowOthersDropdown(false);
  };

  // Handle column search input changes
  const handleColumnSearch = (column, value) => {
    setColumnSearchTerms((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  const filteredTypes =
    typesSearchTerm.trim() === ""
      ? typesOptions
      : typesOptions.filter((type) =>
          type.Name.toLowerCase().includes(typesSearchTerm.toLowerCase())
        );

  const filteredCategories =
    categorySearchTerm.trim() === ""
      ? categoryOptions
      : categoryOptions.filter((category) =>
          category.Name.toLowerCase().includes(categorySearchTerm.toLowerCase())
        );

  const filteredOthers =
    othersSearchTerm.trim() === ""
      ? othersOptions
      : othersOptions.filter((other) =>
          other.Name.toLowerCase().includes(othersSearchTerm.toLowerCase())
        );

  const filteredSizes =
    sizeSearchTerm.trim() === ""
      ? allSizes?.data
      : allSizes?.data?.filter((size) =>
          size.Size.toLowerCase().includes(sizeSearchTerm.toLowerCase())
        );

  // Filtered brands
  const filteredBrands =
    allBrands?.filter(
      (brand) =>
        brand.FrameActive === 1 &&
        (brandSearchTerm.trim() === "" ||
          brand.BrandName.toLowerCase().includes(brandSearchTerm.toLowerCase()))
    ) || [];

  // Collect all BrandGroupIDs that exist in filtered brands
  const validBrandGroupIds = new Set(filteredBrands.map((b) => b.BrandGroupID));

  // Filtered brand groups
  const filteredBrandGroups =
    brandGroupSearchTerm.trim() === ""
      ? (allBrandGroups?.data || []).filter((bg) =>
          validBrandGroupIds.has(bg.Id)
        )
      : allBrandGroups?.filter(
          (brandGroup) =>
            brandGroup.BrandGroupName.toLowerCase().includes(
              brandGroupSearchTerm.toLowerCase()
            ) && validBrandGroupIds.has(brandGroup.Id)
        ) || [];

  // Mock data (replace with actual data from an API or other source)
  const mockData = [
    {
      id: 1,
      sno: "1",
      brandGroup: "Group A",
      brandName: "Brand X",
      cat: "Frame",
      type: "Full",
      modelNo: "ABC123",
      colourCode: "BLK",
      sizeDblLength: "55-18-140",
      barcode: "123456789",
      frameColour: "Black",
      others: "Rxable",
      mrp: "1000",
      stock: "10",
      stockAvl: "8",
    },
    {
      id: 2,
      sno: "2",
      brandGroup: "Group B",
      brandName: "Brand Y",
      cat: "Sunglass",
      type: "Rimless",
      modelNo: "XYZ789",
      colourCode: "BRN",
      sizeDblLength: "53-20-145",
      barcode: "987654321",
      frameColour: "Brown",
      others: "Polarised",
      mrp: "1500",
      stock: "5",
      stockAvl: "3",
    },
  ];

  // Filter data based on column search terms and selected filters
  const filteredData = mockData.filter((item) => {
    const matchesColumnSearch = Object.keys(columnSearchTerms).every((key) => {
      if (columnSearchTerms[key].trim() === "") return true;
      const value = item[key.replace(" ", "")] || "";
      return value
        .toString()
        .toLowerCase()
        .includes(columnSearchTerms[key].toLowerCase());
    });

    const matchesSelectedFilters =
      (selectedBrands.length === 0 ||
        selectedBrands.some((brand) =>
          item.brandName.toLowerCase().includes(brand.BrandName.toLowerCase())
        )) &&
      (selectedBrandGroups.length === 0 ||
        selectedBrandGroups.some((bg) =>
          item.brandGroup
            .toLowerCase()
            .includes(bg.BrandGroupName.toLowerCase())
        )) &&
      (selectedTypes.length === 0 ||
        selectedTypes.some((type) =>
          item.type.toLowerCase().includes(type.Name.toLowerCase())
        )) &&
      (selectedCategories.length === 0 ||
        selectedCategories.some((cat) =>
          item.cat.toLowerCase().includes(cat.Name.toLowerCase())
        )) &&
      (selectedOthers.length === 0 ||
        selectedOthers.some((other) =>
          item.others.toLowerCase().includes(other.Name.toLowerCase())
        )) &&
      (selectedSizes.length === 0 ||
        selectedSizes.some((size) =>
          item.sizeDblLength.toLowerCase().includes(size.Size.toLowerCase())
        ));

    return matchesColumnSearch && matchesSelectedFilters;
  });

  // Render header with search input

  const renderHeader = (column) => (
    <div className="flex flex-col">
      {toTitleCase(column)}
      {column !== "action" &&
      column !== "s.no" &&
        column !== "mrp" &&
        column !== "stock" &&
        column !== "stock avl" && (
          <div className="relative mt-1">
            {/* <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" /> */}
            <input
              type="text"
              placeholder={`Search ${toTitleCase(column)}...`}
              className="w-full pl-2 pr-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={columnSearchTerms[column]}
              onChange={(e) => handleColumnSearch(column, e.target.value)}
            />
          </div>
        )}
    </div>
  );

  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Frame Stock</h2>
          <Button variant="outline" className="flex items-center gap-2">
            <FiChevronDown className="transform rotate-90" />
            Back
          </Button>
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Brand Selector */}
          <div className="relative">
            <div
              className="flex justify-between items-center p-3 border border-gray-300 rounded-lg cursor-pointer bg-white shadow-sm hover:border-blue-400 transition-colors"
              onClick={toggleBrandDropdown}
            >
              <span className="text-gray-700">
                {selectedBrands.length > 0
                  ? `${selectedBrands.length} Brand(s) Selected`
                  : "Select Brands(s)"}
              </span>
              {showBrandDropdown ? <FiChevronUp /> : <FiChevronDown />}
            </div>

            {showBrandDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-[100] w-[600px]">
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search brands..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={brandSearchTerm}
                      onChange={(e) => setBrandSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredBrands.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 p-3">
                      {filteredBrands.map((brand) => (
                        <div
                          key={brand.Id}
                          className={`flex items-center p-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${
                            selectedBrands.some((b) => b.Id === brand.Id)
                              ? "bg-blue-50"
                              : ""
                          }`}
                          onClick={() => toggleBrand(brand)}
                        >
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center mr-2 ${
                              selectedBrands.some((b) => b.Id === brand.Id)
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedBrands.some((b) => b.Id === brand.Id) && (
                              <FiCheck className="text-white text-sm" />
                            )}
                          </div>
                          <span className="text-gray-700 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                            {toTitleCase(brand.BrandName)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-gray-500">
                      No brands found
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-gray-200 flex justify-between">
                  <button
                    onClick={clearAllBrands}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear all
                  </button>
                  <Button
                    variant="primary"
                    className="px-4 py-2"
                    onClick={() => setShowBrandDropdown(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Brand Group Selector */}
          <div className="relative">
            <div
              className="flex justify-between items-center p-3 border border-gray-300 rounded-lg cursor-pointer bg-white shadow-sm hover:border-blue-400 transition-colors"
              onClick={toggleBrandGroupDropdown}
            >
              <span className="text-gray-700">
                {selectedBrandGroups.length > 0
                  ? `${selectedBrandGroups.length} Brand Group(s) Selected`
                  : "Select Brand Group(s)"}
              </span>
              {showBrandGroupDropdown ? <FiChevronUp /> : <FiChevronDown />}
            </div>

            {showBrandGroupDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-[100] w-[600px]">
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search brand groups..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={brandGroupSearchTerm}
                      onChange={(e) => setBrandGroupSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredBrandGroups.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 p-3">
                      {filteredBrandGroups.map((brandGroup) => (
                        <div
                          key={brandGroup.Id}
                          className={`flex items-center p-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${
                            selectedBrandGroups.some(
                              (bg) => bg.Id === brandGroup.Id
                            )
                              ? "bg-blue-50"
                              : ""
                          }`}
                          onClick={() => toggleBrandGroup(brandGroup)}
                        >
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center mr-2 ${
                              selectedBrandGroups.some(
                                (bg) => bg.Id === brandGroup.Id
                              )
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedBrandGroups.some(
                              (bg) => bg.Id === brandGroup.Id
                            ) && <FiCheck className="text-white text-sm" />}
                          </div>
                          <span className="text-gray-700 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                            {toTitleCase(brandGroup.BrandGroupName)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-gray-500">
                      No brand groups found
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-gray-200 flex justify-between">
                  <button
                    onClick={clearAllBrandGroups}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear all
                  </button>
                  <Button
                    variant="primary"
                    className="px-4 py-2"
                    onClick={() => setShowBrandGroupDropdown(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Types Selector */}
          <div className="relative">
            <div
              className="flex justify-between items-center p-3 border border-gray-300 rounded-lg cursor-pointer bg-white shadow-sm hover:border-blue-400 transition-colors"
              onClick={toggleTypesDropdown}
            >
              <span className="text-gray-700">
                {selectedTypes.length > 0
                  ? `${selectedTypes.length} Type(s) Selected`
                  : "Select Type(s)"}
              </span>
              {showTypesDropdown ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {showTypesDropdown && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-[100] w-[600px]">
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search types..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={typesSearchTerm}
                      onChange={(e) => setTypesSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredTypes.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 p-3">
                      {filteredTypes.map((type) => (
                        <div
                          key={type.Id}
                          className={`flex items-center p-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${
                            selectedTypes.some((t) => t.Id === type.Id)
                              ? "bg-blue-50"
                              : ""
                          }`}
                          onClick={() => toggleType(type)}
                        >
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center mr-2 ${
                              selectedTypes.some((t) => t.Id === type.Id)
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedTypes.some((t) => t.Id === type.Id) && (
                              <FiCheck className="text-white text-sm" />
                            )}
                          </div>
                          <span className="text-gray-700 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                            {toTitleCase(type.Name)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-gray-500">
                      No types found
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-gray-200 flex justify-between">
                  <button
                    onClick={clearAllTypes}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear all
                  </button>
                  <Button
                    variant="primary"
                    className="px-4 py-2"
                    onClick={() => setShowTypesDropdown(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Category Selector */}
          <div className="relative">
            <div
              className="flex justify-between items-center p-3 border border-gray-300 rounded-lg cursor-pointer bg-white shadow-sm hover:border-blue-400 transition-colors"
              onClick={toggleCategoryDropdown}
            >
              <span className="text-gray-700">
                {selectedCategories.length > 0
                  ? `${selectedCategories.length} Category(s) Selected`
                  : "Select Category(s)"}
              </span>
              {showCategoryDropdown ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {showCategoryDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-[100] w-[600px]">
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search categories..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={categorySearchTerm}
                      onChange={(e) => setCategorySearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredCategories.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 p-3">
                      {filteredCategories.map((category) => (
                        <div
                          key={category.Id}
                          className={`flex items-center p-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${
                            selectedCategories.some((c) => c.Id === category.Id)
                              ? "bg-blue-50"
                              : ""
                          }`}
                          onClick={() => toggleCategory(category)}
                        >
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center mr-2 ${
                              selectedCategories.some(
                                (c) => c.Id === category.Id
                              )
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedCategories.some(
                              (c) => c.Id === category.Id
                            ) && <FiCheck className="text-white text-sm" />}
                          </div>
                          <span className="text-gray-700 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                            {toTitleCase(category.Name)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-gray-500">
                      No categories found
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-gray-200 flex justify-between">
                  <button
                    onClick={clearAllCategories}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear all
                  </button>
                  <Button
                    variant="primary"
                    className="px-4 py-2"
                    onClick={() => setShowCategoryDropdown(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Others Selector */}
          <div className="relative">
            <div
              className="flex justify-between items-center p-3 border border-gray-300 rounded-lg cursor-pointer bg-white shadow-sm hover:border-blue-400 transition-colors"
              onClick={toggleOthersDropdown}
            >
              <span className="text-gray-700">
                {selectedOthers.length > 0
                  ? `${selectedOthers.length} Other(s) Selected`
                  : "Select Other(s)"}
              </span>
              {showOthersDropdown ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {showOthersDropdown && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-[100] w-[600px]">
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search others..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={othersSearchTerm}
                      onChange={(e) => setOthersSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredOthers.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 p-3">
                      {filteredOthers.map((other) => (
                        <div
                          key={other.Id}
                          className={`flex items-center p-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${
                            selectedOthers.some((o) => o.Id === other.Id)
                              ? "bg-blue-50"
                              : ""
                          }`}
                          onClick={() => toggleOthers(other)}
                        >
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center mr-2 ${
                              selectedOthers.some((o) => o.Id === other.Id)
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedOthers.some((o) => o.Id === other.Id) && (
                              <FiCheck className="text-white text-sm" />
                            )}
                          </div>
                          <span className="text-gray-700 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                            {toTitleCase(other.Name)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-gray-500">
                      No others found
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-gray-200 flex justify-between">
                  <button
                    onClick={clearAllOthers}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear all
                  </button>
                  <Button
                    variant="primary"
                    className="px-4 py-2"
                    onClick={() => setShowOthersDropdown(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sizes Selector */}
          <div className="relative">
            <div
              className="flex justify-between items-center p-3 border border-gray-300 rounded-lg cursor-pointer bg-white shadow-sm hover:border-blue-400 transition-colors"
              onClick={toggleSizesDropdown}
            >
              <span className="text-gray-700">
                {selectedSizes.length > 0
                  ? `${selectedSizes.length} Size(s) Selected`
                  : "Select Size(s)"}
              </span>
              {showSizesDropdown ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {showSizesDropdown && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-[100] w-[600px]">
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search Sizes..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={sizeSearchTerm}
                      onChange={(e) => setSizeSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredSizes && filteredSizes.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 p-3">
                      {filteredSizes.map((size) => (
                        <div
                          key={size.Id}
                          className={`flex items-center p-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${
                            selectedSizes.some((s) => s.Id === size.Id)
                              ? "bg-blue-50"
                              : ""
                          }`}
                          onClick={() => toggleSizes(size)}
                        >
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center mr-2 ${
                              selectedSizes.some((s) => s.Id === size.Id)
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedSizes.some((s) => s.Id === size.Id) && (
                              <FiCheck className="text-white text-sm" />
                            )}
                          </div>
                          <span className="text-gray-700 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                            {toTitleCase(size.Size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-gray-500">
                      No sizes found
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-gray-200 flex justify-between">
                  <button
                    onClick={clearAllSizes}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear all
                  </button>
                  <Button
                    variant="primary"
                    className="px-4 py-2"
                    onClick={() => setShowSizesDropdown(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table with search inputs in headers */}
        <Table
          expand={true}
          columns={[
            "s.no",
            "brand group",
            "brand name",
            "cat",
            "type",
            "model no",
            "colour code",
            "size-dbl-length",
            "barcode",
            "frame colour",
            "others",
            "mrp",
            "stock",
            "stock avl",
            "action",
          ]}
          data={filteredData}
          renderHeader={renderHeader}
          renderRow={(item, index) => (
            <TableRow key={item.id}>
              <TableCell>{item.sno}</TableCell>
              <TableCell>{item.brandGroup}</TableCell>
              <TableCell>{item.brandName}</TableCell>
              <TableCell>{item.cat}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{item.modelNo}</TableCell>
              <TableCell>{item.colourCode}</TableCell>
              <TableCell>{item.sizeDblLength}</TableCell>
              <TableCell>{item.barcode}</TableCell>
              <TableCell>{item.frameColour}</TableCell>
              <TableCell>{item.others}</TableCell>
              <TableCell>{item.mrp}</TableCell>
              <TableCell>{item.stock}</TableCell>
              <TableCell>{item.stockAvl}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  Action
                </Button>
              </TableCell>
            </TableRow>
          )}
        />
      </div>
    </div>
  );
};

export default SearchFrameStock;
