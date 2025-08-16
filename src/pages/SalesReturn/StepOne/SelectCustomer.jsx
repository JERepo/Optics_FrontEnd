import { Autocomplete, TextField, createFilterOptions } from "@mui/material";
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import Button from "../../../components/ui/Button";
import { useOrder } from "../../../features/OrderContext";
import {
  useGetDraftDataByIdQuery,
  useGetPatientsQuery,
  useGetSalesReturnByIdQuery,
  useSalesMasterDraftMutation,
} from "../../../api/salesReturnApi";
import { useSelector } from "react-redux";
import Radio from "../../../components/Form/Radio";
import toast from "react-hot-toast";

const SelectCustomer = () => {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const { hasMultipleLocations, user } = useSelector((state) => state.auth);
  const {
    referenceApplicable,
    updateReferenceApplicable,
    goToSalesStep,
    setSalesDraftData,
    setSelectedMainPatient,
    setCustomerSalesId,
  } = useOrder();

  const { data: contactResp, isLoading: isPatientLoading } =
    useGetPatientsQuery({ locationId: parseInt(hasMultipleLocations[0]) });

  const [saveSalesDraft, { isLoading: isDraftLoading }] =
    useSalesMasterDraftMutation();
  const { data: draftData } = useGetDraftDataByIdQuery(
    { id: selectedPatient?.Id },
    { skip: !selectedPatient?.Id }
  );

  const allContacts = useMemo(() => {
    if (!contactResp?.data?.data) return [];

    const patients = contactResp.data.data.flatMap((mainCustomer) =>
      mainCustomer.CustomerContactDetails.map((contact) => ({
        ...contact,
        mainCustomerObject: mainCustomer, // attach main customer
      }))
    );

    // Remove duplicates based on both name + mobile
    return patients.filter(
      (p, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            t.CustomerName?.trim().toLowerCase() ===
              p.CustomerName?.trim().toLowerCase() &&
            t.MobNumber === p.MobNumber
        )
    );
  }, [contactResp]);

  const handleSaveDraft = async () => {
    if (!selectedPatient) return;

    try {
      const existingDraft = draftData?.data.find(
        (draft) =>
          draft.Status === 0 &&
          draft.CompanyID === parseInt(hasMultipleLocations[0]) &&
          draft.PatientID === selectedPatient.Id &&
          draft.ApplicationUserId === user.Id
      );

      if (existingDraft) {
        setSalesDraftData(existingDraft);
        goToSalesStep(4);
        return;
      }

      const payload = {
        ReferenceApplicable: referenceApplicable === 1,
        CustomerID: selectedPatient.mainCustomerObject.Id,
        PatientID: selectedPatient.Id,
      };

      const response = await saveSalesDraft({
        userId: user.Id,
        locationId: parseInt(hasMultipleLocations[0]),
        payload,
      }).unwrap();

      setSalesDraftData(response?.data?.data);
      goToSalesStep(2);
      toast.success("Sales Return is created");
    } catch (error) {
      console.error(error);
      toast.error(error?.data?.error || "Error saving draft");
    }
  };

  // Allow search by both name and mobile
  const filter = createFilterOptions({
    stringify: (option) => `${option.CustomerName} ${option.MobNumber}`,
  });

  return (
    <div>
      <div className="max-w-7xl">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between">
              <div className="w-1/2">
                <label className="font-medium text-neutral-700">
                  Select Patient
                </label>
                <Autocomplete
                  options={allContacts}
                  getOptionLabel={(option) =>
                    `${option.CustomerName} (${option.MobNumber})`
                  }
                  filterOptions={filter}
                  value={
                    allContacts.find(
                      (contact) => contact.Id === selectedPatient?.Id
                    ) || null
                  }
                  onChange={(_, newValue) => {
                    setSelectedPatient(newValue || null);
                    setSelectedMainPatient(newValue || null);
                    setCustomerSalesId((prev) => ({
                      ...prev,
                      patientId: newValue?.Id || null,
                      patientName: newValue?.CustomerName || "",
                      customerId: newValue?.mainCustomerObject?.Id || null,
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
                  loading={isPatientLoading}
                  fullWidth
                />
              </div>
              <div>
                <Button
                  variant="outline"
                  onClick={() => navigate("/sales-return")}
                >
                  Back
                </Button>
              </div>
            </div>

            {selectedPatient && (
              <div className="p-6 grid grid-cols-3 gap-4 text-sm">
                <div className="flex gap-1">
                  <strong>Customer Name:</strong>
                  {selectedPatient.mainCustomerObject.CustomerName}
                </div>
                <div className="flex gap-1">
                  <strong>Customer Name:</strong>
                  {selectedPatient.CustomerName}
                </div>
                <div className="flex gap-1">
                  <strong>Mobile Number:</strong>
                  {selectedPatient.MobNumber}
                </div>

                {selectedPatient.mainCustomerObject?.TAXRegisteration === 1 && (
                  <>
                    <div className="flex gap-1">
                      <strong>GST No:</strong>{" "}
                      {selectedPatient.mainCustomerObject?.TAXNo}
                    </div>
                    <div className="flex gap-1">
                      <strong>Address:</strong>
                      {`${selectedPatient.mainCustomerObject?.BillAddress1}, ${selectedPatient.mainCustomerObject?.BillAddress2}, ${selectedPatient.mainCustomerObject?.BillCity}`}
                    </div>
                  </>
                )}

                {selectedPatient.mainCustomerObject?.CreditBilling === 1 && (
                  <>
                    <div className="flex gap-1">
                      <strong>Credit Billing:</strong> Yes
                    </div>
                    <div className="flex gap-1">
                      <strong>Credit Limit Available:</strong>
                      {parseFloat(
                        selectedPatient.mainCustomerObject?.CreditLimit
                      ).toLocaleString()}
                    </div>
                  </>
                )}

                <div className="flex items-center gap-3 flex-grow col-span-2">
                  <label>Reference Applicable</label>
                  <div className="flex items-center gap-3">
                    <Radio
                      name="reference"
                      label="Yes"
                      value="1"
                      checked={referenceApplicable === 1}
                      onChange={() => updateReferenceApplicable()}
                    />
                    <Radio
                      name="reference"
                      label="No"
                      value="0"
                      checked={referenceApplicable === 0}
                      onChange={() => updateReferenceApplicable()}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedPatient && (
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveDraft}
                  isLoading={isDraftLoading}
                  disabled={isDraftLoading}
                >
                  Save & Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectCustomer;
