import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import Button from "../../components/ui/Button";
import {
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiSearch,
  FiCheck,
  FiTag,
  FiBox,
  FiActivity,
  FiEye,
} from "react-icons/fi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useGetAllBrandGroupsQuery } from "../../api/brandGroup";
import { Table, TableCell, TableRow } from "../../components/Table";
import {
  useGetFrameSizesQuery,
  useLazyGetFrameOtherLocationStockQuery,
} from "../../api/frameMasterApi";
import {
  useGetFrameStockQuery,
  useLazyGetFreshDataQuery,
} from "../../api/searchStock";
import { useSelector } from "react-redux";
import { useLazyPrintLabelsQuery } from "../../api/reportApi";
import { toast } from "react-hot-toast";
import Modal from "../../components/ui/Modal";
import { useGetAllLocationsQuery } from "../../api/roleManagementApi";
import { useLazyGetStockHistoryQuery } from "../../api/vendorPayment";
import { RefreshCcw } from "lucide-react";

const toTitleCase = (str) =>
  str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const typesOptions = [
  { Id: "F", Name: "Full Rim(F)" },
  { Id: "H", Name: "Half Rim(H)" },
  { Id: "R", Name: "Rim Less(R)" },
];
const rimOptions = [
  { Id: "F", Name: "Full Rim" },
  { Id: "H", Name: "Half Rim" },
  { Id: "R", Name: "Rimless" },
];
const rimOptionsF = [
  { Id: 0, Name: "Full Rim" },
  { Id: 1, Name: "Half Rim" },
  { Id: 2, Name: "Rimless" },
];

const categoryOptions = [
  { Id: 0, Name: "Frame(O)" },
  { Id: 1, Name: "Sunglass(S)" },
];

const othersOptions = [
  { Id: "Rxable", Name: "Rxable(Rx)", apiKey: "isRxable" },
  {
    Id: "Photochromatic",
    Name: "Photochromatic(Ph)",
    apiKey: "isPhotochromatic",
  },
  { Id: "Polarised", Name: "Polarised(Po)", apiKey: "isPolarised" },
  { Id: "ClipOn", Name: "ClipOn(Cl)", apiKey: "isClipOn" },
];

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const buildQueryParams = ({
  brandGroupDropdown,
  brandNameDropdown,
  columnSearchTerms,
  selectedOthers,
  category,
  type,
  modelNo,
  colourCode,
  frameColour,
  barcode,
  location,
  size,
  dbl,
  templeLength,
  frameFrontColor,
  templeColor,
  lensColor,
  isRxable,
  isClipOn,
  noOfClips,
  page,
  requiredRow,
}) => {
  const combineDropdownAndSearch = (dropdownValues, searchTerm, keyName) => {
    const names = dropdownValues?.map((v) => v[keyName]) || [];
    if (searchTerm && searchTerm.trim() !== "") {
      const searchTerms = searchTerm
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== "");
      names.push(...searchTerms);
    }
    return names.length > 0 ? names.join(",") : null; // return null if empty
  };

  const flags = {
    isRxable: null,
    isClipOn: null,
    isPhotochromatic: null,
    isPolarised: null,
  };

  selectedOthers?.forEach((o) => {
    const key = o.apiKey;
    if (key in flags) flags[key] = 1;
  });

  const typeFromDropdown = type?.map((t) => t.Name) || [];
  const typeFromTable = columnSearchTerms["type"]?.trim();
  const finalTypeList = [
    ...typeFromDropdown,
    ...(typeFromTable && typeFromTable.length >= 2 ? [typeFromTable] : []),
  ];
  const FrameRimType =
    finalTypeList.length > 0 ? finalTypeList.join(",") : null;
  const catFromDropdown = category?.map((c) => c.Id) || [];
  const catFromTable = columnSearchTerms["cat"]?.trim();
  const finalCatList = [
    ...catFromDropdown,
    ...(catFromTable && (catFromTable === "0" || catFromTable === "1")
      ? [parseInt(catFromTable)]
      : []),
  ];
  const categoryParam = finalCatList.length > 0 ? finalCatList.join(",") : null;

  const paramsObj = {
    brandGroup: combineDropdownAndSearch(
      brandGroupDropdown,
      columnSearchTerms["brand group"],
      "BrandGroupName"
    ),
    brandName: combineDropdownAndSearch(
      brandNameDropdown,
      columnSearchTerms["brand name"],
      "BrandName"
    ),
    category: categoryParam, // will be set below
    FrameRimType,
    colourCode: colourCode || null,
    frameFrontColor: frameColour || null,
    barcode: barcode || null,
    location: location || null,
    size: size?.join(",") || null,
    dbl: dbl || null,
    modelNo: modelNo || null,
    templeLength: templeLength || null,
    // frameFrontColor: frameFrontColor || null,
    templeColor: templeColor || null,
    lensColor: lensColor || null,
    isRxable: flags.isRxable,
    isClipOn: flags.isClipOn,
    photochromatic: flags.isPhotochromatic,
    isPolarised: flags.isPolarised,
    noOfClips: noOfClips || null,
    page: page || null,
    requiredRow: requiredRow || null,
  };

  // Only include keys that have a value
  const queryString = Object.entries(paramsObj)
    .filter(
      ([_, value]) => value !== null && value !== undefined && value !== ""
    )
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return queryString ? `?${queryString}` : "";
};

const SearchFrameStock = () => {
  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const { data: allBrands } = useGetAllBrandsQuery();
  const { data: allBrandGroups } = useGetAllBrandGroupsQuery();
  const { data: allSizes } = useGetFrameSizesQuery();
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedBrandGroups, setSelectedBrandGroups] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedOthers, setSelectedOthers] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [tempBrands, setTempBrands] = useState([]);
  const [tempBrandGroups, setTempBrandGroups] = useState([]);
  const [tempTypes, setTempTypes] = useState([]);
  const [tempCategories, setTempCategories] = useState([]);
  const [tempOthers, setTempOthers] = useState([]);
  const [tempSizes, setTempSizes] = useState([]);
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
  const [columnSearchTerms, setColumnSearchTerms] = useState({
    "brand group": "",
    "brand name": "",
    cat: "",
    FrameRimType: "",
    "model no": "",
    "colour code": "",
    "size-dbl-length": "",
    barcode: "",
    "frame colour": "",
    others: "",
    mrp: "",
    stock: "",
    "stock avl": "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const brandRef = useRef(null);
  const brandGroupRef = useRef(null);
  const typesRef = useRef(null);
  const categoryRef = useRef(null);
  const othersRef = useRef(null);
  const sizesRef = useRef(null);
  const queryString = useMemo(() => {
    return buildQueryParams({
      brandGroupDropdown: selectedBrandGroups,
      brandNameDropdown: selectedBrands,
      columnSearchTerms,
      selectedOthers,
      category: selectedCategories,
      type: selectedTypes,
      modelNo: columnSearchTerms["model no"] || null,
      colourCode: columnSearchTerms["colour code"] || null,
      frameColour: columnSearchTerms["frame colour"] || null,
      barcode: columnSearchTerms["barcode"] || null,
      location: parseInt(hasMultipleLocations[0]),
      size: selectedSizes.map((s) => s.Size) || null,
      dbl: null,
      templeLength: null,
      frameFrontColor: null,
      templeColor: null,
      lensColor: null,
      isRxable: null,
      isClipOn: null,
      noOfClips: null,
      page: currentPage,
      requiredRow: pageSize,
    });
  }, [
    selectedBrands,
    selectedBrandGroups,
    selectedCategories,
    selectedTypes,
    selectedSizes,
    selectedOthers,
    columnSearchTerms,
    hasMultipleLocations,
    currentPage,
    pageSize,
  ]);
  const [columnInput, setColumnInput] = useState({ ...columnSearchTerms });
  const [stockOpen, setStockOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [catInputError, setCatInputError] = useState(false);
  const handleCatInputChange = (value) => {
    const cleaned = value.trim().toUpperCase();
    setColumnInput((prev) => ({ ...prev, cat: value }));

    if (cleaned === "") {
      setCatInputError(false);
      setColumnSearchTerms((prev) => ({ ...prev, cat: "" }));
    } else if (cleaned === "F") {
      setCatInputError(false);
      setColumnSearchTerms((prev) => ({ ...prev, cat: "0" })); // Frame
    } else if (cleaned === "S") {
      setCatInputError(false);
      setColumnSearchTerms((prev) => ({ ...prev, cat: "1" })); // Sunglass
    } else {
      setCatInputError(true);
      toast.error("Please enter 'F' for Frame or 'S' for Sunglass only.");
    }
  };

  // On input change
  const handleColumnInputChange = (column, value) => {
    console.log("type", column, value);
    setColumnInput((prev) => ({ ...prev, [column]: value }));
  };
  const { data: allLocations } = useGetAllLocationsQuery();
  const [syncData, { refetch: refreshData }] = useLazyGetFreshDataQuery();

  // Debounce effect: updates columnSearchTerms after 500ms of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      setColumnSearchTerms(columnInput);
    }, 500); // adjust debounce delay as needed

    return () => clearTimeout(timer); // cleanup on new input
  }, [columnInput]);

  const {
    data: framData,
    isFetching: isDataLoading,
    isLoading,
    refetch,
  } = useGetFrameStockQuery(queryString);

  const debouncedColumnSearch = useCallback(
    debounce((column, value) => {
      setColumnSearchTerms((prev) => ({ ...prev, [column]: value }));
    }, 300),
    []
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !brandRef.current?.contains(event.target) &&
        !brandGroupRef.current?.contains(event.target) &&
        !typesRef.current?.contains(event.target) &&
        !categoryRef.current?.contains(event.target) &&
        !othersRef.current?.contains(event.target) &&
        !sizesRef.current?.contains(event.target)
      ) {
        setShowBrandDropdown(false);
        setShowBrandGroupDropdown(false);
        setShowTypesDropdown(false);
        setShowCategoryDropdown(false);
        setShowOthersDropdown(false);
        setShowSizesDropdown(false);
      }
    };

    const isAnyDropdownOpen =
      showBrandDropdown ||
      showBrandGroupDropdown ||
      showTypesDropdown ||
      showCategoryDropdown ||
      showOthersDropdown ||
      showSizesDropdown;

    if (isAnyDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    showBrandDropdown,
    showBrandGroupDropdown,
    showTypesDropdown,
    showCategoryDropdown,
    showOthersDropdown,
    showSizesDropdown,
  ]);

  // Toggle temp selections
  const toggleTempBrand = (brand) => {
    setTempBrands((prev) =>
      prev.some((b) => b.Id === brand.Id)
        ? prev.filter((b) => b.Id !== brand.Id)
        : [...prev, brand]
    );
  };

  const toggleTempBrandGroup = (brandGroup) => {
    setTempBrandGroups((prev) =>
      prev.some((bg) => bg.Id === brandGroup.Id)
        ? prev.filter((bg) => bg.Id !== brandGroup.Id)
        : [...prev, brandGroup]
    );
  };

  const toggleTempType = (type) => {
    setTempTypes((prev) =>
      prev.some((t) => t.Id === type.Id)
        ? prev.filter((t) => t.Id !== type.Id)
        : [...prev, type]
    );
  };

  const toggleTempCategory = (category) => {
    setTempCategories((prev) =>
      prev.some((c) => c.Id === category.Id)
        ? prev.filter((c) => c.Id !== category.Id)
        : [...prev, category]
    );
  };

  const toggleTempOthers = (other) => {
    setTempOthers((prev) =>
      prev.some((o) => o.Id === other.Id)
        ? prev.filter((o) => o.Id !== other.Id)
        : [...prev, other]
    );
  };

  const toggleTempSize = (size) => {
    setTempSizes((prev) =>
      prev.some((s) => s.Id === size.Id)
        ? prev.filter((s) => s.Id !== size.Id)
        : [...prev, size]
    );
  };

  // Apply and clear functions
  const applyBrands = () => {
    setSelectedBrands(tempBrands);
    setShowBrandDropdown(false);
  };

  const clearAllBrands = () => setTempBrands([]);

  const applyBrandGroups = () => {
    setSelectedBrandGroups(tempBrandGroups);
    setShowBrandGroupDropdown(false);
  };

  const clearAllBrandGroups = () => setTempBrandGroups([]);

  const applyTypes = () => {
    setSelectedTypes(tempTypes);
    setShowTypesDropdown(false);
  };

  const clearAllTypes = () => setTempTypes([]);

  const applyCategories = () => {
    setSelectedCategories(tempCategories);
    setShowCategoryDropdown(false);
  };

  const clearAllCategories = () => setTempCategories([]);

  const applyOthers = () => {
    setSelectedOthers(tempOthers);
    setShowOthersDropdown(false);
  };

  const clearAllOthers = () => setTempOthers([]);

  const applySizes = () => {
    setSelectedSizes(tempSizes);
    setShowSizesDropdown(false);
  };

  const clearAllSizes = () => setTempSizes([]);

  // Toggle dropdowns and set temp states
  const toggleBrandDropdown = () => {
    if (!showBrandDropdown) {
      setTempBrands(selectedBrands);
      setShowBrandGroupDropdown(false);
      setShowTypesDropdown(false);
      setShowCategoryDropdown(false);
      setShowOthersDropdown(false);
      setShowSizesDropdown(false);
    }
    setShowBrandDropdown(!showBrandDropdown);
  };

  const toggleBrandGroupDropdown = () => {
    if (!showBrandGroupDropdown) {
      setTempBrandGroups(selectedBrandGroups);
      setShowBrandDropdown(false);
      setShowTypesDropdown(false);
      setShowCategoryDropdown(false);
      setShowOthersDropdown(false);
      setShowSizesDropdown(false);
    }
    setShowBrandGroupDropdown(!showBrandGroupDropdown);
  };

  const toggleTypesDropdown = () => {
    if (!showTypesDropdown) {
      setTempTypes(selectedTypes);
      setShowBrandDropdown(false);
      setShowBrandGroupDropdown(false);
      setShowCategoryDropdown(false);
      setShowOthersDropdown(false);
      setShowSizesDropdown(false);
    }
    setShowTypesDropdown(!showTypesDropdown);
  };

  const toggleCategoryDropdown = () => {
    if (!showCategoryDropdown) {
      setTempCategories(selectedCategories);
      setShowBrandDropdown(false);
      setShowBrandGroupDropdown(false);
      setShowTypesDropdown(false);
      setShowOthersDropdown(false);
      setShowSizesDropdown(false);
    }
    setShowCategoryDropdown(!showCategoryDropdown);
  };

  const toggleOthersDropdown = () => {
    if (!showOthersDropdown) {
      setTempOthers(selectedOthers);
      setShowBrandDropdown(false);
      setShowBrandGroupDropdown(false);
      setShowTypesDropdown(false);
      setShowCategoryDropdown(false);
      setShowSizesDropdown(false);
    }
    setShowOthersDropdown(!showOthersDropdown);
  };

  const toggleSizesDropdown = () => {
    if (!showSizesDropdown) {
      setTempSizes(selectedSizes);
      setShowBrandDropdown(false);
      setShowBrandGroupDropdown(false);
      setShowTypesDropdown(false);
      setShowCategoryDropdown(false);
      setShowOthersDropdown(false);
    }
    setShowSizesDropdown(!showSizesDropdown);
  };

  // Handle column search input changes (debounced)
  const handleColumnSearch = (column, value) => {
    debouncedColumnSearch(column, value);
  };

  // Filtered options
  const filteredTypes =
    typesSearchTerm.trim() === ""
      ? rimOptions
      : rimOptions.filter((type) =>
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
      ) || [];

  const filteredBrands =
    allBrands?.filter(
      (brand) =>
        brand.FrameActive === 1 &&
        (brandSearchTerm.trim() === "" ||
          brand.BrandName.toLowerCase().includes(brandSearchTerm.toLowerCase()))
    ) || [];

  const validBrandGroupIds = new Set(filteredBrands.map((b) => b.BrandGroupID));

  const filteredBrandGroups =
    brandGroupSearchTerm.trim() === ""
      ? (allBrandGroups?.data || []).filter((bg) =>
        validBrandGroupIds.has(bg.Id)
      )
      : (allBrandGroups?.data || []).filter(
        (brandGroup) =>
          brandGroup.BrandGroupName.toLowerCase().includes(
            brandGroupSearchTerm.toLowerCase()
          ) && validBrandGroupIds.has(brandGroup.Id)
      );

  const handleRefresh = async () => {
    // Reset dropdown selections
    setSelectedBrands([]);
    setSelectedBrandGroups([]);
    setSelectedCategories([]);
    setSelectedTypes([]);
    setSelectedOthers([]);
    setSelectedSizes([]);

    // Reset temp states (to ensure dropdowns are cleared visually)
    setTempBrands([]);
    setTempBrandGroups([]);
    setTempCategories([]);
    setTempTypes([]);
    setTempOthers([]);
    setTempSizes([]);

    // Reset column searches
    const clearedColumns = Object.keys(columnSearchTerms).reduce((acc, key) => {
      acc[key] = "";
      return acc;
    }, {});
    setColumnSearchTerms(clearedColumns);
    setColumnInput(clearedColumns);

    // Reset search terms for dropdown filters
    setBrandSearchTerm("");
    setBrandGroupSearchTerm("");
    setTypesSearchTerm("");
    setCategorySearchTerm("");
    setOthersSearchTerm("");
    setSizeSearchTerm("");

    // Reset pagination
    setCurrentPage(1);

    try {
      await syncData().unwrap();
    } catch (error) {
      console.log(error);
    }
  };

  const [getlabels, { isFetching: isLabelsFetching }] =
    useLazyPrintLabelsQuery();
  const [getStockHistory, { data: stockData }] = useLazyGetStockHistoryQuery();
  const [getOtherLocationStock, { data: otherStockData }] =
    useLazyGetFrameOtherLocationStockQuery();
  const [printId, setprintId] = useState(null);
  const [stockId, setstockId] = useState(null);
  const [otherstockId, othersetstockId] = useState(null);
  const [otherStockOpen, setOtherStockOpen] = useState(false);

  const handleLabels = async (detailId) => {
    setprintId(detailId);
    try {
      const blob = await getlabels({
        frameDetailId: detailId,
        companyId: parseInt(hasMultipleLocations[0]),
      }).unwrap();

      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" })
      );
      const newWindow = window.open(url);
      if (newWindow) {
        newWindow.onload = () => {
          newWindow.focus();
          newWindow.print();
        };
      }
      setprintId(null);
    } catch (error) {
      console.log(error);
      toast.error(
        "Unable to print the frame label please try again after some time!"
      );
      setprintId(null);
    }
  };

  const handleStockHistory = async (id) => {
    setstockId(id);
    try {
      await getStockHistory({
        companyId: selectedLocation
          ? selectedLocation
          : parseInt(hasMultipleLocations[0]),
        productType: 1,
        detailId: id,
      }).unwrap();
      setStockOpen(true);
      setstockId(null);
    } catch (error) {
      console.log(error);
      setstockId(null);
      setStockOpen(false);
    }
  };
  const handleOtherStockHistory = async (id) => {
    othersetstockId(id);
    try {
      const res = await getOtherLocationStock({
        companyId: selectedLocation
          ? selectedLocation
          : parseInt(hasMultipleLocations[0]),
        // companyId : 1,
        detailId: id,
      }).unwrap();
      if (!res?.data?.length) {
        toast.error("View access to other locations stock is not allowed");
        return;
      }
      setOtherStockOpen(true);
      othersetstockId(null);
    } catch (error) {
      console.log(error);
      othersetstockId(null);
      setOtherStockOpen(false);
    }
  };

  // Get column value for filtering and display
  const getColumnValue = (item, column) => {
    switch (column) {
      case "brand group":
        return item.BrandGroup || "";
      case "brand name":
        return item.BrandName || "";
      case "cat":
        return item.Category === 0 ? "O" : "S";
      case "type": {
        const typeObj = rimOptions.find((t) => t.Name == item.FrameRimType);

        return typeObj ? typeObj.Name : "";
      }

      case "model no":
        return item.ModelNo || "";
      case "colour code":
        return item.ColourCode || "";
      case "size-dbl-length":
        return `${item.Size || ""}-${item.DBL || ""}-${item.TempleLength || ""
          }`;
      case "barcode":
        return item.Barcode || "";
      case "frame colour":
        return item.FrameFrontColor || "";
      case "others":
        const othersArr = [];
        if (item.IsRxable === "Yes") othersArr.push("Rxable");
        if (item.IsClipOn === "Yes") othersArr.push("ClipOn");
        // Add more if available in data, e.g., Polarised, Photochromatic
        return othersArr.join(", ");
      case "mrp":
        return item.FrameSRP || "";

      case "stock":
        return item.Quantity;
      default:
        return "";
    }
  };

  const paginatedData = framData?.data || [];

  const totalPages = useMemo(() => {
    if (!framData?.total || !framData?.requiredRow) return 1;
    return Math.ceil(framData.total / framData.requiredRow);
  }, [framData]);
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    // page will be reset by the effect above
  };
  const renderHeader = (column) => (
    <div className="flex flex-col">
      {toTitleCase(column)}
      {column !== "s.no" &&
        column !== "others" &&
        column !== "mrp" &&
        column !== "stock" &&
        column !== "size-dbl-length" &&
        column !== "action" && (
          <div className="relative mt-1">
            <input
              type="text"
              placeholder={`Search ${toTitleCase(column)}...`}
              className={`w-full pl-2 pr-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 ${
                catInputError && column === "cat"
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              value={columnInput[column]}
              onChange={(e) => {
                if (column === "cat") handleCatInputChange(e.target.value);
                else handleColumnInputChange(column, e.target.value);
              }}
            />
          </div>
        )}
    </div>
  );

  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Header */}
        <div className="flex justify-between items-center ">
          <h2 className="text-2xl font-semibold text-gray-800">
            Frame Stock Search
          </h2>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 items-center">
              {/* <Button variant="outline" className="flex items-center gap-2">
                <FiChevronDown className="transform rotate-90" />
                Back
              </Button> */}
              <Button
                onClick={handleRefresh}
                variant="outline"
              >
                <RefreshCcw className={isLoading ? "animate-spin" : ""} />

                Refresh
              </Button>
            </div>

            <div className="">
              {Array.isArray(hasMultipleLocations) &&
                hasMultipleLocations.length > 1 && (
                  <div className="">
                    <Autocomplete
                      options={
                        allLocations?.data?.filter((loc) =>
                          hasMultipleLocations.includes(loc.Id)
                        ) || []
                      }
                      getOptionLabel={(option) => option.LocationName}
                      onChange={(event, newValue) => {
                        if (newValue) {
                          setSelectedLocation(newValue?.Id);
                        }
                      }}
                      value={
                        allLocations?.data?.find(
                          (b) => b.Id === selectedLocation
                        ) || null
                      }
                      isOptionEqualToValue={(option, value) =>
                        option.Id === value.Id
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Location"
                          variant="outlined"
                          fullWidth
                        />
                      )}
                      sx={{ width: 400 }}
                    />
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <p className="italic text-sm text-red-300"> Please Refresh to get the latest stock data!</p>
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Brand Selector */}
          <div className="relative" ref={brandRef}>
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
                          className={`flex items-center p-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${tempBrands.some((b) => b.Id === brand.Id)
                            ? "bg-blue-50"
                            : ""
                            }`}
                          onClick={() => toggleTempBrand(brand)}
                        >
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center mr-2 ${tempBrands.some((b) => b.Id === brand.Id)
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300"
                              }`}
                          >
                            {tempBrands.some((b) => b.Id === brand.Id) && (
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
                    onClick={applyBrands}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Brand Group Selector */}
          <div className="relative" ref={brandGroupRef}>
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
                          className={`flex items-center p-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${tempBrandGroups.some(
                            (bg) => bg.Id === brandGroup.Id
                          )
                            ? "bg-blue-50"
                            : ""
                            }`}
                          onClick={() => toggleTempBrandGroup(brandGroup)}
                        >
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center mr-2 ${tempBrandGroups.some(
                              (bg) => bg.Id === brandGroup.Id
                            )
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300"
                              }`}
                          >
                            {tempBrandGroups.some(
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
                    onClick={applyBrandGroups}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Types Selector */}
          <div className="relative" ref={typesRef}>
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
                          className={`flex items-center p-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${tempTypes.some((t) => t.Id === type.Id)
                            ? "bg-blue-50"
                            : ""
                            }`}
                          onClick={() => toggleTempType(type)}
                        >
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center mr-2 ${tempTypes.some((t) => t.Id === type.Id)
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300"
                              }`}
                          >
                            {tempTypes.some((t) => t.Id === type.Id) && (
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
                    onClick={applyTypes}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Category Selector */}
          <div className="relative" ref={categoryRef}>
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
                          className={`flex items-center p-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${tempCategories.some((c) => c.Id === category.Id)
                            ? "bg-blue-50"
                            : ""
                            }`}
                          onClick={() => toggleTempCategory(category)}
                        >
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center mr-2 ${tempCategories.some((c) => c.Id === category.Id)
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300"
                              }`}
                          >
                            {tempCategories.some(
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
                    onClick={applyCategories}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Others Selector */}
          <div className="relative" ref={othersRef}>
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
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-[100] w-[600px]">
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
                          className={`flex items-center p-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${tempOthers.some((o) => o.Id === other.Id)
                            ? "bg-blue-50"
                            : ""
                            }`}
                          onClick={() => toggleTempOthers(other)}
                        >
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center mr-2 ${tempOthers.some((o) => o.Id === other.Id)
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300"
                              }`}
                          >
                            {tempOthers.some((o) => o.Id === other.Id) && (
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
                    onClick={applyOthers}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sizes Selector */}
          <div className="relative" ref={sizesRef}>
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
                  {filteredSizes.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 p-3">
                      {filteredSizes.map((size) => (
                        <div
                          key={size.Id}
                          className={`flex items-center p-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${tempSizes.some((s) => s.Id === size.Id)
                            ? "bg-blue-50"
                            : ""
                            }`}
                          onClick={() => toggleTempSize(size)}
                        >
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center mr-2 ${tempSizes.some((s) => s.Id === size.Id)
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300"
                              }`}
                          >
                            {tempSizes.some((s) => s.Id === size.Id) && (
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
                    onClick={applySizes}
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
          freeze={true}
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
            "action",
          ]}
          data={paginatedData || []}
          renderHeader={renderHeader}
          renderRow={(item, index) => {
            const startRow = (currentPage - 1) * pageSize + 1;
            return (
              <TableRow key={item.id}>
                <TableCell>{index + startRow}</TableCell>
                <TableCell>{getColumnValue(item, "brand group")}</TableCell>
                <TableCell>{getColumnValue(item, "brand name")}</TableCell>
                <TableCell>{getColumnValue(item, "cat")}</TableCell>
                <TableCell>{getColumnValue(item, "type")}</TableCell>
                <TableCell>{getColumnValue(item, "model no")}</TableCell>
                <TableCell>{getColumnValue(item, "colour code")}</TableCell>
                <TableCell>{getColumnValue(item, "size-dbl-length")}</TableCell>
                <TableCell>{getColumnValue(item, "barcode")}</TableCell>
                <TableCell>{getColumnValue(item, "frame colour")}</TableCell>
                <TableCell className="w-[80px]">
                  <div className="grid grid-cols-2 gap-2 w-auto">
                    {[
                      item.IsPolarised ? "PH" : null,
                      item.IsPhotochromatic ? "PO" : null,
                      item.NoOfClips ? `CL: ${item.NoOfClips}` : null,
                      item.IsRxable ? "Rx" : null,
                    ]
                      .filter(Boolean)
                      .map((val, idx) => (
                        <div key={idx}>{val}</div>
                      ))}
                  </div>
                </TableCell>
                <TableCell>{getColumnValue(item, "mrp")}</TableCell>
                <TableCell>{getColumnValue(item, "stock")}</TableCell>
                <TableCell className="flex gap-1 justify-center">
                  <Button
                    icon={FiEye}
                    size="xs"
                    variant="outline"
                    title="Other Location Stock"
                    onClick={() => handleOtherStockHistory(item.DetailId)}
                    isLoading={otherstockId === item.DetailId}
                    loadingText=""
                  ></Button>
                  <Button
                    size="xs"
                    variant="outline"
                    title="Barcode Label Printing"
                    icon={FiTag}
                    onClick={() => handleLabels(item.DetailId)}
                    isLoading={printId === item.DetailId}
                    loadingText=""
                  ></Button>

                  {/* <Button
                    size="xs"
                    variant="outline"
                    title="Stock History"
                    icon={FiBox}
                  ></Button> */}
                  <Button
                    size="xs"
                    variant="outline"
                    title="Transaction History"
                    icon={FiActivity}
                    onClick={() => handleStockHistory(item.DetailId)}
                    isLoading={stockId === item.DetailId}
                    loadingText=""
                  ></Button>
                </TableCell>
              </TableRow>
            );
          }}
          emptyMessage={isDataLoading ? "Loading..." : "No data found"}
          isLoading={isDataLoading}
          pagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          totalItems={framData?.total ?? 0}
        />

        <Modal
          isOpen={stockOpen}
          onClose={() => setStockOpen(false)}
          width="max-w-4xl"
        >
          <div className="my-5 mx-3">
            <div className="my-5 text-lg text-neutral-800 font-semibold">
              Transaction History
            </div>
            <Table
              expand={true}
              freeze={true}
              columns={[
                "s.no",
                "transaction date",
                "grn qty",
                "stin qty",
                "sr qty",
                "salesqty",
                "stout qty",
                "pr qty",
              ]}
              data={stockData?.data || []}
              renderRow={(item, index) => {
                return (
                  <TableRow key={item.DetailId}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {item?.TransactionDate?.split("-").reverse().join("/")}
                    </TableCell>
                    <TableCell>{item?.GRNQty}</TableCell>
                    <TableCell>{item?.STInQty}</TableCell>
                    <TableCell>{item?.SRQty}</TableCell>
                    <TableCell>{item?.SalesQty}</TableCell>
                    <TableCell>{item?.STOutQty}</TableCell>
                    <TableCell>{item?.PRQty}</TableCell>
                  </TableRow>
                );
              }}
            />
          </div>
        </Modal>
        <Modal
          isOpen={otherStockOpen}
          onClose={() => setOtherStockOpen(false)}
          width="max-w-3xl"
        >
          <div className="my-5 mx-3">
            <div className="my-5 text-lg text-neutral-800 font-semibold">
              Other Location Frame Stock List
            </div>

            <Table
              expand={true}
              freeze={true}
              columns={["S.No", "Location Name", "Stock"]}
              data={otherStockData?.data || []}
              renderRow={(item, index) => (
                <TableRow key={item.locationId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{`${item.companyName} (${item.locationName})`}</TableCell>
                  <TableCell>{item.stock?.LocationQuantity ?? 0}</TableCell>
                </TableRow>
              )}
            />

            {otherStockData?.data?.[0]?.stock && (
              <div className="mt-6 p-4 border rounded-2xl bg-gray-50">
                <div className="text-lg font-semibold mb-3 text-neutral-700">
                  Frame Details
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-neutral-900">
                  <p>
                    <strong className="font-medium">Brand:</strong>{" "}
                    {otherStockData.data[0].stock.BrandName}
                  </p>
                  <p>
                    <strong className="font-medium">Category:</strong>{" "}
                    {otherStockData.data[0].stock.Category === 0 ? "Optical Frame" : "Sunglasses"}
                  </p>
                  <p>
                    <strong className="font-medium">Type:</strong>{" "}
                    {
                      rimOptionsF?.find(
                        (item) => item.Id == otherStockData.data[0].stock.Type
                      )?.Name
                    }
                  </p>
                  <p>
                    <strong className="font-medium">Model No:</strong>{" "}
                    {otherStockData.data[0].stock.ModelNo}
                  </p>
                  <p>
                    <strong className="font-medium">Colour Code:</strong>{" "}
                    {otherStockData.data[0].stock.ColourCode}
                  </p>
                  <p>
                    <strong className="font-medium">Size-DBL-Length:</strong>
                    {`${otherStockData.data[0].stock.Size || ""}-${
                      otherStockData.data[0].stock.DBL || ""
                    }-${otherStockData.data[0].stock.TempleLength || ""}`}
                  </p>
                  <p>
                    <strong className="font-medium">Barcode:</strong>{" "}
                    {otherStockData.data[0].stock.Barcode}
                  </p>
                  <p>
                    <strong className="font-medium">Shape Name:</strong>{" "}
                    {otherStockData.data[0].stock.ShapeName || "N/A"}
                  </p>
                  <p>
                    <strong className="font-medium">Front Material:</strong>{" "}
                    {otherStockData.data[0].stock.FrontMaterial || "N/A"}
                  </p>
                  <p>
                    <strong className="font-medium">Temple Material:</strong>{" "}
                    {otherStockData.data[0].stock.TempleMaterial || "N/A"}
                  </p>
                  <p>
                    <strong className="font-medium">Frame Colour:</strong>{" "}
                    {otherStockData.data[0].stock.FrameFrontColor}
                  </p>
                  <p>
                    <strong className="font-medium">Temple Colour:</strong>{" "}
                    {otherStockData.data[0].stock.TempleColor || "N/A"}
                  </p>
                  <p>
                    <strong className="font-medium">Lens Colour:</strong>{" "}
                    {otherStockData.data[0].stock.LensColor}
                  </p>
                  <p>
                    <strong className="font-medium">Rxable:</strong>{" "}
                    {otherStockData.data[0].stock.IsRxable ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong className="font-medium">Photochromatic:</strong>{" "}
                    {otherStockData.data[0].stock.IsPhotochromatic
                      ? "Yes"
                      : "No"}
                  </p>
                  <p>
                    <strong className="font-medium">Polarised:</strong>{" "}
                    {otherStockData.data[0].stock.IsPolarised ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong className="font-medium">ClipOn:</strong>{" "}
                    {otherStockData.data[0].stock.IsClipOn ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default SearchFrameStock;
