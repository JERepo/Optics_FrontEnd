import React, { useEffect, useState } from "react";
import Button from "../../../components/ui/Button";
import { FiMapPin, FiPlus, FiSearch } from "react-icons/fi";
import { useSelector } from "react-redux";
import {
  useGetAllLocationsQuery,
  useGetLocationByIdQuery,
} from "../../../api/roleManagementApi";
import { useGetCompanyIdQuery } from "../../../api/customerApi";
import Radio from "../../../components/Form/Radio";
import {
  useCreateGiftVoucherForRefundMutation,
  useCreateGVVoucherMutation,
  useGetAllCustomersForVoucherQuery,
  useLazyGenerateGiftVoucherQuery,
} from "../../../api/giftVoucher";
import Input from "../../../components/Form/Input";
import { isValidNumericInput } from "../../../utils/isValidNumericInput";
import toast from "react-hot-toast";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { enGB } from "date-fns/locale";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Autocomplete, TextField } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import Loader from "../../../components/ui/Loader";
import { useNavigate } from "react-router";

const NewGV = ({
  collectGiftAmount = false,
  handleAddGiftAmount,
  remainingRefundAmt,
}) => {
  const navigate = useNavigate();

  const today = new Date();
  const [expiryDate, setExpiryDate] = useState(null);
  const [selectedLocation, setSelectedLocations] = useState([]);

  const [gvData, setGVData] = useState({
    giftCode: null,
    gvType: 0,
    partialUse: 0,
    amount: null,
    activateNow: 0,
    days: null,
    allCustomer: 0,
    selectCustomer: null,
  });

  const { hasMultipleLocations, user } = useSelector((state) => state.auth);
  const { data: locationById } = useGetLocationByIdQuery({
    id: parseInt(hasMultipleLocations[0]),
  });
  const companyType = locationById?.data?.data.CompanyType;
  const companyId = locationById?.data?.data.Id;

  const { data: companySettings } = useGetCompanyIdQuery(
    { id: companyId },
    { skip: !companyId }
  );
  useEffect(() => {
    setGVData((prev) => ({
      ...prev,
      gvType: companySettings?.data.data.GVMultipleUse === 1 ? 1 : 0,
    }));
  }, [locationById, companySettings]);

  useEffect(() => {
    setGVData((prev) => ({
      ...prev,
      amount: remainingRefundAmt,
    }));
  }, [collectGiftAmount, remainingRefundAmt]);

  // API quries
  const [
    generateVoucher,
    {
      isLoading: isVoucherLoading,
      isFetching: isVoucherFetching,
      data: voucherData,
    },
  ] = useLazyGenerateGiftVoucherQuery();
  const { data: customersData, isLoading: isCustoersLoading } =
    useGetAllCustomersForVoucherQuery({
      locationId: parseInt(hasMultipleLocations[0]),
    });
  const { data: allLocations, isLoading: isLocationsLoading } =
    useGetAllLocationsQuery();
  const [creatGV, { isLoading: isCreating }] = useCreateGVVoucherMutation();
  const [createGVForRefund, { isLoading: isGVRefundLoading }] =
    useCreateGiftVoucherForRefundMutation();
  useEffect(() => {
    if (voucherData?.data?.GVCode) {
      setGVData((prev) => ({
        ...prev,
        giftCode: voucherData.data.GVCode,
      }));
    }
  }, [voucherData]);
  const handleGenerateCode = async (e) => {
    e.preventDefault();
    try {
      await generateVoucher().unwrap();
    } catch (error) {
      console.log(error);
    }
  };
  const handleLocationChange = (event) => {
    const { value, checked } = event.target;
    const numericValue = parseInt(value);

    if (checked) {
      setSelectedLocations((prev) => [...prev, numericValue]);
    } else {
      setSelectedLocations((prev) =>
        prev.filter((locationId) => locationId !== numericValue)
      );
    }
  };
  const handleChange = (field, value, type = "text") => {
    let newValue = value;

    if (type === "number") {
      if (!isValidNumericInput(value)) {
        toast.error("Enter a valid number");
        return;
      }

      if (collectGiftAmount && parseFloat(newValue) > remainingRefundAmt) {
        toast.error("Amount cannot exceed the total Refund amount!");
        return;
      }
      newValue = value === "" ? null : Number(value);
    }

    setGVData((prev) => ({
      ...prev,
      [field]: newValue,
    }));
  };
  const handleSubmit = async () => {
    if (!gvData.amount) {
      toast.error("Please enter the amount!");
      return;
    }

    if (gvData.activateNow === 1 && !gvData.days) {
      toast.error("Please enter validaty days");
      return;
    }
    if (gvData.activateNow === 0 && !expiryDate) {
      toast.error("Please enter Expiry date!");
      return;
    }
    if(gvData.partialUse === null){
      toast.error("Please select Partial use!")
      return;
    }

    if(selectedLocation.length <= 0){
      toast.error("Please select atleast one location!")
      return;
    }
    try {
      if (collectGiftAmount) {
        const payload = {
          GVCode: gvData.giftCode ?? null, // optional, will auto-generate if missing
          amount: gvData.amount, // mandatory, must be > 0
          useType: gvData.gvType, // 0 = One-Time, 1 = Multiple
          partPayment: gvData.partialUse, // 0 = No, 1 = Yes
          activateNow: gvData.activateNow === 0, // true = activate now, false = activate later
          expiryDate: expiryDate
            ? new Date(expiryDate).toISOString().split("T")[0]
            : null, // required if activateNow = true
          //"validityDays": 30,            // required if activateNow = false
          customerId: gvData.selectCustomer,
          ApplicationUserID: user.Id,
          locationIds: selectedLocation, // array of locations to link voucher
        };
        handleAddGiftAmount({...payload });
        toast.success("Gift Voucher collected successfully!");
      } else {
        const payload = {
          GVCode: gvData.giftCode ?? null,
          amount: gvData.amount,
          useType: gvData.gvType,
          partPayment: gvData.partialUse,
          activateNow: gvData.activateNow === 0,
          expiryDate: expiryDate
            ? new Date(expiryDate).toISOString().split("T")[0]
            : null,
          validityDays: gvData.days ?? null,
          customerId: gvData.selectCustomer,
          ApplicationUserID: user.Id,
          locationIds: selectedLocation,
        };

        console.log("Gift Voucher Payload:", payload);
        await creatGV({ payload }).unwrap();
        toast.success("Gift Voucher created successfully!");
        navigate(-1);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while creating the Gift Voucher.");
    }
  };
  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-3">
          <div className="text-2xl text-neutral-700 font-semibold">
            New Gift Voucher
          </div>
          {!collectGiftAmount && (
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Back
              </Button>
            </div>
          )}
        </div>
        <div>
          <form onSubmit={handleGenerateCode} className="space-y-2 mt-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between w-1/2">
                <label
                  htmlFor="giftCode"
                  className="text-sm font-medium text-gray-700"
                >
                  Enter Gift Code
                </label>
              </div>
              <div className="flex gap-2">
                <div className="relative flex items-center">
                  <input
                    id="giftCode"
                    type="text"
                    value={gvData.giftCode || ""}
                    onChange={(e) =>
                      handleChange("giftCode", e.target.value, "text")
                    }
                    placeholder="gift voucher"
                    className="w-[400px] pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                    readOnly
                  />

                  <FiSearch className="absolute left-3 text-gray-400" />
                </div>
                <Button
                  type="submit"
                  isLoading={isVoucherLoading || isVoucherFetching}
                  disabled={isVoucherLoading || isVoucherFetching}
                >
                  Generate
                </Button>
              </div>
            </div>
          </form>
          <div className="mt-5">
            <div className="flex items-center gap-5 mb-3">
              <label
                htmlFor="barcode"
                className="text-sm font-medium text-gray-700"
              >
                GV Type
              </label>
              <div className="flex items-center gap-5">
                <Radio
                name="type"
                  value="0"
                  onChange={() => handleChange("gvType", 0, "number")}
                  checked={gvData.gvType === 0}
                  label="One time use"
                />
                <Radio
                                name="type"

                  value="1"
                  onChange={() => handleChange("gvType", 1, "number")}
                  checked={gvData.gvType === 1}
                  label="Multiple use"
                  disabled={companySettings?.data.data.GVMultipleUse === 0}
                />
              </div>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex items-center gap-5 mb-3">
              <label className="text-sm font-medium text-gray-700">
                Partial use
              </label>
              <div className="flex items-center gap-5">
                <Radio
                name="use"
                  value="0"
                  onChange={() => handleChange("partialUse", 0, "number")}
                  checked={gvData.partialUse === 0}
                  label="No"
                />
                <Radio
                name="use"
                  value="1"
                  onChange={() => handleChange("partialUse", 1, "number")}
                  checked={gvData.partialUse === 1}
                  label="Yes"
                />
              </div>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex items-center gap-5">
              <Input
                className="w-[500px]"
                label="Amount"
                value={gvData.amount || ""}
                onChange={(e) =>
                  handleChange("amount", e.target.value, "number")
                }
              />
            </div>
          </div>
          <div className="mt-5">
            <div className="flex  gap-5 mb-3">
              <label className="text-sm font-medium text-gray-700">
                Activation
              </label>
              <div className="flex gap-10">
                <div className="flex flex-col items-start gap-3">
                  <Radio
                    name="act"
                    value="0"
                    onChange={() => handleChange("activateNow", 0, "number")}
                    checked={gvData.activateNow === 0}
                    label="Activate Now"
                  />
                  {gvData.activateNow === 0 && (
                    <LocalizationProvider
                      dateAdapter={AdapterDateFns}
                      adapterLocale={enGB}
                    >
                      <DatePicker
                        label="Expiry Date"
                        value={expiryDate}
                        onChange={(newValue) => setExpiryDate(newValue)}
                        minDate={today}
                        inputFormat="dd/MM/yyyy"
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            fullWidth
                            variant="outlined"
                            placeholder="dd/MM/yyyy"
                          />
                        )}
                      />
                    </LocalizationProvider>
                  )}
                </div>
                <div className="flex flex-col items-start gap-3">
                  <Radio
                    name="act"
                    value="1"
                    onChange={() => handleChange("activateNow", 1, "number")}
                    checked={gvData.activateNow === 1}
                    label="Activate Later"
                    disabled={collectGiftAmount}
                  />
                  {gvData.activateNow === 1 && (
                    <Input
                      label="Days"
                      value={gvData.days || ""}
                      onChange={(e) =>
                        handleChange("days", e.target.value, "number")
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          {!collectGiftAmount && (
            <div className="mt-5">
              <div className="flex  gap-5 mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Customer Selection
                </label>
                <div className="flex gap-10">
                  <div className="flex flex-col items-start gap-3">
                    <Radio
                      name="cus"
                      value="0"
                      onChange={() => handleChange("allCustomer", 0, "number")}
                      checked={gvData.allCustomer === 0}
                      label="All Customer"
                    />
                  </div>
                  <div className="flex flex-col  gap-3">
                    <Radio
                      name="cus"
                      value="1"
                      onChange={() => handleChange("allCustomer", 1, "number")}
                      checked={gvData.allCustomer === 1}
                      label="Select Customer"
                      disabled={gvData.gvType === 1}
                    />
                    {gvData.allCustomer === 1 && (
                      <div className="w-[400px]">
                        <Autocomplete
                          options={customersData?.data.data || []}
                          getOptionLabel={(option) =>
                            `${option.CustomerName} (${option.MobNumber})`
                          }
                          value={
                            customersData?.data?.data?.find(
                              (master) => master.Id === gvData?.selectCustomer
                            ) || null
                          }
                          onChange={(_, newValue) => {
                            setGVData((prev) => ({
                              ...prev,
                              selectCustomer: newValue.Id,
                            }));
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Select by Patient name or mobile"
                              size="medium"
                            />
                          )}
                          isOptionEqualToValue={(option, value) =>
                            option.Id === value.Id
                          }
                          loading={isCustoersLoading}
                          fullWidth
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Locations */}
          <div className="space-y-2 w-1/2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <FiMapPin className="mr-2 text-gray-500" />
              Locations
            </label>
            {isLocationsLoading ? (
              <div className="flex justify-start py-4">
                <Loader color="black" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 border border-gray-200 rounded-lg">
                {allLocations?.data?.map((loc) => (
                  <div key={loc.Id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`location-${loc.Id}`}
                      value={loc.Id}
                      checked={selectedLocation.includes(loc.Id)}
                      onChange={handleLocationChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`location-${loc.Id}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {loc.LocationName}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-5 flex justify-start">
            <Button
              onClick={handleSubmit}
              isLoading={isCreating || isGVRefundLoading}
              disabled={isCreating ||isGVRefundLoading}
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewGV;
