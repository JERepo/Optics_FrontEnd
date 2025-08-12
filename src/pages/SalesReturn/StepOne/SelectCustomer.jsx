import { Autocomplete, TextField } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router";
import Button from "../../../components/ui/Button";
import { useOrder } from "../../../features/OrderContext";

const SelectCustomer = () => {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const { referenceApplicable, updateReferenceApplicable, goToSalesStep } =
    useOrder();

  const contactResp = [];
  const isPatientLoading = false;

  return (
    <div>
      <div className="max-w-7xl">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between">
              <div className="w-1/2">
                <Autocomplete
                  options={contactResp?.data?.patients || []}
                  getOptionLabel={(option) =>
                    `${option.CustomerName} (${option.MobNumber})`
                  }
                  value={
                    contactResp?.data?.patients.find(
                      (master) =>
                        master.CustomerMasterID ===
                        selectedPatient?.CustomerMasterID
                    ) || null
                  }
                  onChange={(_, newValue) =>
                    setSelectedPatient(newValue || null)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select by Patient name or mobile"
                      size="medium"
                    />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.CustomerMasterID === value.CustomerMasterID
                  }
                  loading={isPatientLoading}
                  fullWidth
                />
              </div>
              <div>
                <Button variant="outline" onClick={() => navigate("/invoice")}>
                  Back
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => goToSalesStep(2)}>Save & Next</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectCustomer;
