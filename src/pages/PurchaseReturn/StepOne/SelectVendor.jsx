import React, { useState } from "react";
import {
  useGetVendorsQuery,
  useLazyGetDraftDataQuery,
  useSaveDraftMutation,
} from "../../../api/purchaseReturn";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { useOrder } from "../../../features/OrderContext";
import Button from "../../../components/ui/Button";
import { Autocomplete, TextField } from "@mui/material";
import toast from "react-hot-toast";

const SelectVendor = () => {
  const navigate = useNavigate();
  const { user, hasMultipleLocations } = useSelector((state) => state.auth);
  const {
    customerPurchase,
    currentPurchaseStep,
    goToPurchaseStep,
    setPurchaseDraftData,
    setCustomerPurchase,
  } = useOrder();
  const [selectedVendor, setSelectedVendor] = useState(null);

  const { data: vendorsData, isLoading } = useGetVendorsQuery({
    locationId: customerPurchase.locationId,
  });
  const [purchaseDraft, { isLoading: isDraftLoading }] =
    useLazyGetDraftDataQuery();

  const [saveDraft, { isLoading: draftSaving }] = useSaveDraftMutation();
  const vendorOptions = React.useMemo(() => {
    const vendors = vendorsData?.data?.data || [];
    const unique = new Map();

    vendors.forEach((v) => {
      const key = v.VendorName?.toLowerCase().trim();
      if (key && !unique.has(key)) {
        unique.set(key, v);
      }
    });

    return Array.from(unique.values());
  }, [vendorsData]);
console.log(customerPurchase)
  const handleSaveDraft = async () => {
    if (!selectedVendor) return;

    try {
      const res = await purchaseDraft({
        vendorId: selectedVendor.Id,
        companyId: customerPurchase.locationId,

        userId: user.Id,
      }).unwrap();

      const data = res?.data?.data[0];
      const existingDraft =
        data?.Status === 0 &&
        data?.ApplicationUserId === user.Id &&
        data?.CompanyId === customerPurchase.companyId;
      if (existingDraft) {
        setPurchaseDraftData(data);
        setCustomerPurchase((prev) => ({
          ...prev,
          customerData: selectedVendor,
        }));
        goToPurchaseStep(4);
        return;
      }
    } catch (error) {
      console.log(error);
    }

    try {
      const payload = {
        CompanyId: customerPurchase.locationId,
        VendorId: selectedVendor.Id,
        ApplicationUserId: user.Id,
      };

      const response = await saveDraft({
        payload,
      }).unwrap();
      setPurchaseDraftData(response?.data?.data);
      setCustomerPurchase((prev) => ({
        ...prev,
        customerData: selectedVendor,
      }));
      goToPurchaseStep(2);
      toast.success("Purchase return is created");
    } catch (error) {
      console.error(error);
      toast.error(error?.data?.error || "Error saving draft");
    }
  };

  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Step {currentPurchaseStep}
            </h1>

            <Button variant="outline" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>

          <div className="w-1/2 mt-3">
            <label className="font-medium text-neutral-700">
              Select Vendor
            </label>
            <Autocomplete
              options={vendorOptions}
              getOptionLabel={(option) => option.VendorName}
              value={
                vendorOptions.find(
                  (contact) => contact.Id === selectedVendor?.Id
                ) || null
              }
              onChange={(_, newValue) => {
                setSelectedVendor(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select Vendor"
                  size="medium"
                />
              )}
              isOptionEqualToValue={(option, value) => option.Id === value.Id}
              loading={isLoading}
              fullWidth
            />
          </div>

          {selectedVendor && (
            <div className="mt-5 grid grid-cols-3 gap-4 text-sm">
              <div className="flex gap-1">
                <strong>Vendor Name:</strong>
                {selectedVendor.VendorName}
              </div>

              <div className="flex gap-1">
                <strong>Mobile Number:</strong>
                {selectedVendor.MobNumber}
              </div>

              {selectedVendor?.TAXRegisteration === 1 && (
                <>
                  <div className="flex gap-1">
                    <strong>GST No:</strong> {selectedVendor?.TAXNo}
                  </div>
                  <div className="flex gap-1">
                    <strong>PAN Number:</strong>
                    {selectedVendor.PANNumber}
                  </div>
                  <div className="flex gap-1">
                    <strong>Address:</strong>
                    {`${selectedVendor?.Address1}, ${selectedVendor?.City}, ${selectedVendor?.Pin}`}
                  </div>
                </>
              )}
            </div>
          )}
          <div className="flex justify-end mt-5">
            <Button
              onClick={handleSaveDraft}
              isLoading={draftSaving || isDraftLoading}
              disabled={draftSaving || isDraftLoading}
            >
              Select & Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectVendor;
