import { Autocomplete, TextField } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { enGB } from "date-fns/locale";
import React, { useState } from "react";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import Button from "../../components/ui/Button";
import { useLazyGetStockAgeingReportQuery } from "../../api/reportApi";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useGetAllLocationsQuery } from "../../api/roleManagementApi";
import { useRef } from "react";
import { useEffect } from "react";
import { FiChevronDown, FiMapPin } from "react-icons/fi";
import Radio from "../../components/Form/Radio";

const productTypes = [
  { value: 1, label: "Frame" },
  { value: 2, label: "Accessory" },
  { value: 3, label: "CL" },
];

const StockAgeingReport = () => {
  const { user, hasMultipleLocations } = useSelector((state) => state.auth);
  const [selectedProduct, setSelectedProduct] = useState(productTypes[0]);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [getReport, { isFetching: isReportLoading }] =
    useLazyGetStockAgeingReportQuery();
  const { data: allLocations } = useGetAllLocationsQuery();
  const [selectedLocation, setSelectedLocation] = useState(null);
  useEffect(() => {
    if (allLocations?.data?.length && hasMultipleLocations?.length) {
      const firstAllowed = allLocations?.data.find((loc) =>
        hasMultipleLocations.includes(Number(loc.Id))
      );
      setSelectedLocation(firstAllowed || null);
    }
  }, [allLocations?.data, hasMultipleLocations]);
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setIsLocationOpen(false);
  };
  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };
  const handleSubmit = async () => {
    try {
      const blob = await getReport({
        companyId: selectedLocation?.Id,
        productType : selectedProduct?.value
      }).unwrap();
      downloadFile(blob, `Stock Ageing Report(${selectedProduct?.label}).xlsx`);
      toast.success(`Stock Ageing Report for ${selectedProduct?.label} Generated successfully!`);
    } catch (error) {
      console.log(error);

      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Looks like No Stock Ageing data found!";

      toast.error(errorMsg);
    }
  };

  return (
    <div>
      <div className="max-w-8xl">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden p-6">
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900">
              Stock Ageing Report
            </h2>
          </div>
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            {productTypes?.map((item) => (
              <Radio
                key={item.value}
                name="product"
                label={item.label}
                value={item.value}
                checked={selectedProduct?.value === item.value}
                onChange={() => setSelectedProduct(item)}
              />
            ))}
          </div>
          <div className="relative w-full flex justify-end" ref={dropdownRef}>
            <button
              onClick={() => setIsLocationOpen(!isLocationOpen)}
              className="w-64 flex justify-between space-x-1 bg-neutral-50 px-3 py-2 rounded-sm transition-all duration-200"
              disabled={hasMultipleLocations.length <= 1}
            >
              <div className="flex items-center gap-2">
                <FiMapPin className="text-neutral-500" />
                <span className="text-sm text-neutral-700 font-medium">
                  {selectedLocation?.LocationName}
                </span>
              </div>
              <FiChevronDown
                className={`text-neutral-500 transition-transform duration-200  ${
                  isLocationOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isLocationOpen && (
              <div className="absolute right-0 mt-10 w-64 bg-white rounded-md shadow-lg overflow-hidden z-999 border border-gray-100 animate-fadeIn ">
                <div className="py-1">
                  {allLocations?.data
                    ?.filter((loc) =>
                      hasMultipleLocations?.includes(Number(loc.Id))
                    )
                    .map((location) => (
                      <button
                        key={location.Id}
                        onClick={() => handleLocationSelect(location)}
                        className={`block w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                          selectedLocation.Id === location.Id
                            ? "bg-neutral-50 text-neutral-700 font-medium"
                            : "text-neutral-700 hover:bg-gray-50"
                        }`}
                      >
                        {location.LocationName}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
          </div>
          {/* Submit Button */}
          <div className="pt-10 flex justify-end mt-10">
            <Button
              onClick={handleSubmit}
              isLoading={isReportLoading}
              disabled={isReportLoading}
            >
              Generate Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAgeingReport;
