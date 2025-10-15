import React, { useEffect, useState } from "react";
import Button from "../../../components/ui/Button";
import Radio from "../../../components/Form/Radio";
import Input from "../../../components/Form/Input";
import Checkbox from "../../../components/Form/Checkbox";
import { Autocomplete, TextField } from "@mui/material";
import { useGetAllBrandsQuery } from "../../../api/brandsApi";
import {
  useCreateOfferMutation,
  useGetCustomerGroupQuery,
  useGetOfferAvlQuery,
  useGetOfferViewQuery,
} from "../../../api/offerApi";
import { useOrder } from "../../../features/OrderContext";
import { useSelector } from "react-redux";
import { useGetAllLocationsQuery } from "../../../api/roleManagementApi";
import Loader from "../../../components/ui/Loader";
import { FiMapPin } from "react-icons/fi";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router";

const Offers = [
  { value: 3, label: "Product Discount (% OR VALUE)" },
  { value: 4, label: "Order Discount (% OR VALUE)" },
];

const OfferViewPage = () => {
  // local state
  const navigate = useNavigate();
   const { search } = useLocation();
    const params = new URLSearchParams(search);
    const offerId = params.get("offerId");
  const { customerOffer, setCusomerOffer, goToOfferStep } = useOrder();
  const { user, hasMultipleLocations } = useSelector((state) => state.auth);
  const [selectedOffer, setSelectedOffer] = useState(3);
  const [selectedLocation, setSelectedLocations] = useState([]);
  const [offerDisabled, setOfferDisabled] = useState(false);

  const [offer, setOffer] = useState({
    offerCode: null,
    offerDetails: null,
    isBrandOffer: 0,
    offerOnGRN: 0,
    othersDiscountApplicable: 0,
    customerGroup: false,
    selectedCustomerGroup: null,
    approvalRequired:0
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
  const { data: offerAvl, isLoading: isOfferChecking } = useGetOfferViewQuery({
    mainId: parseInt(parseInt(offerId)),
  });

  // data manipulation
  // prefill offer if available
  useEffect(() => {
    if (offerAvl?.data?.data) {
      const o = offerAvl.data.data;
      setSelectedOffer(o.OfferType);
      setOffer({
        offerCode: o.OfferCode || "",
        offerDetails: o.OfferName || "",
        isBrandOffer: o.IsBrandOffer ?? null,
        offerOnGRN: o.OfferOnGRN ?? null,
        othersDiscountApplicable: o.OtherOffer ?? null,
        customerGroup: !!o.CustomerGroupId,
        selectedCustomerGroup: o.CustomerGroupId || null,
        ApprvRequired :o.ApprvRequired || 0
      });
       setCusomerOffer((prev) => ({
          ...prev,
          offerMainId: o.Id,
          selectedProduct: selectedOffer,
        }));
      setSelectedLocations((prev) => [
        ...prev,
        ...(o.locations?.map((ite) => ite.Id) || []),
      ]);
      setOfferDisabled(true);
    }
  }, [offerAvl,offerId]);

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
 

  if (isOfferChecking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader color="black" width="w-10" height="h-10" />
      </div>
    );
  }
  return (
    <div>
      <div className="max-w-8xl">
        <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-semibold text-neutral-700">
              Offer Details
            </span>
            <div>
              <Button variant="outline" onClick={() => navigate("/offer")}>
                Back
              </Button>
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
                    disabled={offerDisabled}
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
                    disabled={offerDisabled}
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
                      disabled={offerDisabled}
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
                      disabled={offerDisabled}
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
                      disabled={offerDisabled}
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
                      disabled={offerDisabled}
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
                      disabled={offerDisabled}
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
                      disabled={offerDisabled}
                    />
                  </div>
                </div>
                  <div className="flex items-center gap-5">
                  <label className="text-sm font-medium text-gray-700">
                    Approval Required
                  </label>
                  <div className="flex items-center gap-5">
                    <Radio
                      name="apprR"
                      value="1"
                      onChange={() => {
                        setOffer((prev) => ({
                          ...prev,
                          approvalRequired: 1,
                        }));
                      }}
                      checked={offer.approvalRequired === 1}
                      label="Yes"
                      disabled={offerDisabled}
                    />
                    <Radio
                      name="apprR"
                      value="0"
                      onChange={() => {
                        setOffer((prev) => ({
                          ...prev,
                          approvalRequired: 0,
                        }));
                      }}
                      checked={offer.approvalRequired === 0}
                      label="No"
                      disabled={offerDisabled}
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
                    disabled={offerDisabled}
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
                        disabled={offerDisabled}
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
                            disabled={offerDisabled}
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
         
        </div>
      </div>
    </div>
  );
};

export default OfferViewPage;
