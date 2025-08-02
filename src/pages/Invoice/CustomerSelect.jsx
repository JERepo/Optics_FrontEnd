import React, { useState } from "react";
import { useGetCustomerContactDetailsQuery } from "../../api/orderApi";
import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import Loader from "../../components/ui/Loader";

const CustomerSelect = () => {
  const [selectedPatient, setSelectedpatient] = useState(null);

  const {
    data: contactResp,
    refetch: refetchPatient,
    isLoading: isPatientLoading,
  } = useGetCustomerContactDetailsQuery();

  const { data: customerData, isLoading: isCustomerLoading } =
    useGetCustomerByIdQuery(
      { id: selectedPatient },
      { skip: !selectedPatient }
    );

  return (
    <div className="max-w-7xl">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="w-1/2">
            <Autocomplete
              options={contactResp?.data || []}
              getOptionLabel={(option) =>
                `${option.CustomerName} ${option.MobNumber}`
              }
              value={
                contactResp?.data?.find(
                  (master) => master.CustomerMasterID === selectedPatient
                ) || null
              }
              onChange={(_, newValue) =>
                setSelectedpatient(newValue?.CustomerMasterID || null)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select by Customer name or mobile"
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
        </div>

        {isCustomerLoading && <Loader color="black" />}
        {/* Display Customer Details */}
        {!isCustomerLoading && selectedPatient && customerData && (
          <div className="p-6 grid grid-cols-4 gap-4 text-sm">
            <div>
              <strong>Customer Name:</strong>{" "}
              {customerData?.data?.data?.CustomerName}
            </div>
            <div>
              <strong>Mobile Number:</strong>{" "}
              {customerData?.data?.data?.MobNumber}
            </div>
            {customerData?.data?.data?.TAXRegisteration === 1 && (
              <>
                <div>
                  <strong>GST No.:</strong>{" "}
                  {customerData?.data?.data?.Company?.TaxNumber}
                </div>
                <div>
                  <strong>Address:</strong>{" "}
                  {customerData?.data?.data?.BillAddress1}
                </div>
              </>
            )}
            <div>
              <strong>Billing Method:</strong>{" "}
              {customerData?.data?.data?.BillingMethod}
            </div>
            <div>
              <strong>Credit Billing:</strong>{" "}
              {customerData?.data?.data?.CreditBilling ? "Yes" : "No"}
            </div>
            <div>
              <strong>Credit Limit Available:</strong>{" "}
              {parseFloat(
                customerData?.data?.data?.CreditLimit
              ).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSelect;
