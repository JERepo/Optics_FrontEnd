import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useOrder } from "../../../features/OrderContext";
import { useNavigate } from "react-router";
import Button from "../../../components/ui/Button";
import { Autocomplete, TextField } from "@mui/material";
import {
  useGetStockLocationsQuery,
  useLazyGetDraftDataQuery,
  useSaveStockTransferDraftMutation,
} from "../../../api/stockTransfer";
import toast from "react-hot-toast";

const SelectLocation = () => {
  const {
    customerStock,
    setCustomerStockOut,
    setStockDraftData,
    currentStockStep,
    goToStockStep,
  } = useOrder();
  const navigate = useNavigate();
  const { hasMultipleLocations, user } = useSelector((state) => state.auth);
  const [locations, setLocation] = useState(null);

  const { data: allLocations, isLoading: isLocationsLoading } =
    useGetStockLocationsQuery({
      locationId: parseInt(hasMultipleLocations[0]),
    });
  const [saveDraft, { isLoading: isDraftSavingLoading }] =
    useSaveStockTransferDraftMutation();

  const [getDraftData, { data: draftData, isLoading: isDraftLoading }] =
    useLazyGetDraftDataQuery();

  const handleSave = async () => {
    if (!locations) {
      toast.error("Please select preferred location!");
      return;
    }

    try {
      const res = await getDraftData({
        toCompanyId: locations.Id,
        fromCompanyId: customerStock.companyId,
        userId: user.Id,
      }).unwrap();

      const draft = res?.data?.records[0];
      const existDraft =
        draft?.Status === 0 &&
        draft?.FromCompanyId === customerStock.companyId &&
        draft?.ToCompanyId === locations.Id &&
        draft?.ApplicationUserID === user.Id;

      if (existDraft) {
        setCustomerStockOut((prev) => ({
          ...prev,
          inState: draft?.InState,
        }));
        setStockDraftData(draft);
        goToStockStep(4);
        return;
      }
    } catch (error) {
      toast.error(error?.data.error);
    }

    try {
      const response = await saveDraft({
        toCompanyId: locations.Id,
        fromCompanyId: customerStock.companyId,
        userId: user.Id,
      }).unwrap();
      toast.success("Stock transfer out successfully created!");
      setCustomerStockOut((prev) => ({
        ...prev,
        inState: response?.data.data.InState,
      }));
      setStockDraftData(response?.data.data);
      goToStockStep(2);
    } catch (error) {
      toast.error(error.data.error);
    }
  };

  return (
    <div>
      <div className="max-w-8xl">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                Step {currentStockStep}
              </h1>

              <div>
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Back
                </Button>
              </div>
            </div>
            <div className="w-1/2 mt-3">
              <label className="font-medium text-neutral-700">
                Select Location
              </label>
              <Autocomplete
                options={allLocations?.data?.data?.filter(
                  (l) => l.Id !== parseInt(hasMultipleLocations[0])
                )}
                getOptionLabel={(option) => option.DisplayName}
                value={
                  allLocations?.data?.data?.find(
                    (contact) => contact.Id === locations?.Id
                  ) || null
                }
                onChange={(_, newValue) => {
                  setLocation(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Location"
                    size="medium"
                  />
                )}
                isOptionEqualToValue={(option, value) => option.Id === value.Id}
                loading={isLocationsLoading}
                fullWidth
              />
            </div>
            <div className="flex justify-end mt-5">
              <Button
                onClick={handleSave}
                isLoading={isDraftSavingLoading || isDraftLoading}
                disabled={isDraftSavingLoading || isDraftLoading}
              >
                Select & Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectLocation;
