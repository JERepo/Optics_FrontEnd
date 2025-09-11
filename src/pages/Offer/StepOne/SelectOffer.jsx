import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import Radio from "../../../components/Form/Radio";
import Input from "../../../components/Form/Input";
import Checkbox from "../../../components/Form/Checkbox";
import { Autocomplete, TextField } from "@mui/material";
import { useGetAllBrandsQuery } from "../../../api/brandsApi";
import {
  useCreateOfferMutation,
  useGetCustomerGroupQuery,
} from "../../../api/offerApi";
import { useOrder } from "../../../features/OrderContext";
import { useSelector } from "react-redux";
import { useGetAllLocationsQuery } from "../../../api/roleManagementApi";
import Loader from "../../../components/ui/Loader";
import { FiMapPin } from "react-icons/fi";
import toast from "react-hot-toast";

const Offers = [
  { value: 3, label: "Product Discount (% OR VALUE)" },
  { value: 4, label: "Order Discount (% OR VALUE)" },
];

const SelectOffer = () => {
  // local state
  const { customerOffer, setCusomerOffer, goToOfferStep } = useOrder();
  const { user } = useSelector((state) => state.auth);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedLocation, setSelectedLocations] = useState([]);

  const [offer, setOffer] = useState({
    offerCode: null,
    offerDetails: null,
    isBrandOffer: null,
    offerOnGRN: null,
    othersDiscountApplicable: null,
    customerGroup: false,
    selectedCustomerGroup: null,
  });

  //   api quiries

  const { data: customerGroups, isLoading: isCustomerGroupsLoading } =
    useGetCustomerGroupQuery(
      { poolId: customerOffer.customerPoolId },
      { skip: !customerOffer.customerPoolId }
    );
  const { data: allLocations, isLoading: isLocationsLoading } =
    useGetAllLocationsQuery();
  const [createOffer, { isLoading: isOfferCreating }] =
    useCreateOfferMutation();
  // data manipulation
  console.log(offer);
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
  const handleNext = async () => {
    // basic validations
    if (!selectedOffer) {
      toast.error("Please select an offer type");
      return;
    }
    if (!offer.offerCode?.trim()) {
      toast.error("Offer Code is required");
      return;
    }
    if (!offer.offerDetails?.trim()) {
      toast.error("Offer Details are required");
      return;
    }
    if (offer.isBrandOffer === null) {
      toast.error("Please select if this is a Brand Offer");
      return;
    }
    if (offer.offerOnGRN === null) {
      toast.error("Please select if Offer on GRN is applicable");
      return;
    }
    if (offer.othersDiscountApplicable === null) {
      toast.error("Please select if Other Discounts are applicable");
      return;
    }
    if (offer.customerGroup && !offer.selectedCustomerGroup) {
      toast.error("Please select a customer group");
      return;
    }
    if (selectedLocation.length === 0) {
      toast.error("Please select at least one location");
      return;
    }
    try {
      const payload = {
        OfferCode: offer.offerCode,
        OfferName: offer.offerDetails,
        OfferType: selectedOffer,
        LowerValue: 0,
        SamePower: 0,
        IsBrandOffer: offer.isBrandOffer,
        OfferOnGRN: offer.offerOnGRN,
        OtherOffer: offer.othersDiscountApplicable,
        SameOrder: 0,
        NoOfDays: 0,
        Status: 0,
        ApplicationUserId: user.Id,
        CustomerGroupId: offer.selectedCustomerGroup,
        LocationIds: selectedLocation,
      };
      const res = await createOffer(payload).unwrap();
      if (res?.data?.data) {
        setCusomerOffer((prev) => ({
          ...prev,
          offerMainId: res?.data?.data?.Id,
          selectedProduct: selectedOffer,
        }));
        toast.success("Offer created successfully");
        if (selectedOffer === 3) {
          goToOfferStep(2);
        } else if (selectedOffer === 4) {
          goToOfferStep(4);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <div className="max-w-8xl">
        <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-semibold text-neutral-700">
              Step 1: Select Offer
            </span>
            <div>
              <Button variant="outline">Back</Button>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex items-center gap-5">
              {Offers.map((item) => (
                <div>
                  <Radio
                    name="Offer"
                    value={item.value}
                    onChange={() => setSelectedOffer(item.value)}
                    checked={selectedOffer === item.value}
                    label={item.label}
                  />
                </div>
              ))}
            </div>
          </div>
          {selectedOffer && (
            <div className="mt-5">
              <div className="flex flex-col gap-3">
                <div>
                  <Input
                    className="w-1/2"
                    value={offer.offerCode}
                    label="Offer Code"
                    onChange={(e) => {
                      setOffer((prev) => ({
                        ...prev,
                        offerCode: e.target.value,
                      }));
                    }}
                  />
                  <Input
                    className="w-1/2"
                    value={offer.offerDetails}
                    label="Offer Details"
                    onChange={(e) => {
                      setOffer((prev) => ({
                        ...prev,
                        offerDetails: e.target.value,
                      }));
                    }}
                  />
                </div>
                <div className="flex items-center gap-5">
                  <label className="text-sm font-medium text-gray-700">
                    Is Brand Offer
                  </label>
                  <div className="flex items-center gap-5">
                    <Radio
                      name="OfferB"
                      value="1"
                      onChange={() => {
                        setOffer((prev) => ({
                          ...prev,
                          isBrandOffer: 1,
                        }));
                      }}
                      checked={offer.isBrandOffer === 1}
                      label="Yes"
                    />
                    <Radio
                      name="OfferB"
                      value="0"
                      onChange={() => {
                        setOffer((prev) => ({
                          ...prev,
                          isBrandOffer: 0,
                        }));
                      }}
                      checked={offer.isBrandOffer === 0}
                      label="No"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <label className="text-sm font-medium text-gray-700">
                    Offer on GRN
                  </label>
                  <div className="flex items-center gap-5">
                    <Radio
                      name="GRN"
                      value="1"
                      onChange={() => {
                        setOffer((prev) => ({
                          ...prev,
                          offerOnGRN: 1,
                        }));
                      }}
                      checked={offer.offerOnGRN === 1}
                      label="Yes"
                    />
                    <Radio
                      name="GRN"
                      value="0"
                      onChange={() => {
                        setOffer((prev) => ({
                          ...prev,
                          offerOnGRN: 0,
                        }));
                      }}
                      checked={offer.offerOnGRN === 0}
                      label="No"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <label className="text-sm font-medium text-gray-700">
                    Other Discounts Applicable
                  </label>
                  <div className="flex items-center gap-5">
                    <Radio
                      name="othersDiscountApplicable"
                      value="1"
                      onChange={() => {
                        setOffer((prev) => ({
                          ...prev,
                          othersDiscountApplicable: 1,
                        }));
                      }}
                      checked={offer.othersDiscountApplicable === 1}
                      label="Yes"
                    />
                    <Radio
                      name="othersDiscountApplicable"
                      value="0"
                      onChange={() => {
                        setOffer((prev) => ({
                          ...prev,
                          othersDiscountApplicable: 0,
                        }));
                      }}
                      checked={offer.othersDiscountApplicable === 0}
                      label="No"
                    />
                  </div>
                </div>
                <div className="flex gap-5">
                  <Checkbox
                    label="Specific Customer Group"
                    value={offer.customerGroup}
                    onChange={() => {
                      setOffer((prev) => ({
                        ...prev,
                        customerGroup: !prev.customerGroup,
                        selectedCustomerGroup: null,
                      }));
                    }}
                  />
                  {offer.customerGroup && (
                    <div className="space-y-1 w-1/3">
                      <Autocomplete
                        options={customerGroups?.data?.data}
                        getOptionLabel={(option) => option.GroupName || ""}
                        value={
                          customerGroups?.data?.data?.find(
                            (g) => g.Id === offer.selectedCustomerGroup
                          ) || null
                        }
                        onChange={(_, newValue) =>
                          setOffer((prev) => ({
                            ...prev,
                            selectedCustomerGroup: newValue?.Id || null,
                          }))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Select customer group"
                            size="small"
                          />
                        )}
                        loading={isCustomerGroupsLoading}
                        fullWidth
                      />
                    </div>
                  )}
                </div>
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
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
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
              </div>
            </div>
          )}
          {selectedOffer && (
            <div className="flex mt-5">
              <Button
                onClick={handleNext}
                isLoading={isOfferCreating}
                disabled={isOfferCreating}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectOffer;
