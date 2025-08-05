import React, { useState } from "react";
import { useGetCustomerContactDetailsQuery } from "../../api/orderApi";
import { Autocomplete, TextField } from "@mui/material";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import Loader from "../../components/ui/Loader";
import {
  useGetAllOrderMasterQuery,
  useGetPatientsQuery,
  useLazyGetBatchDetailsQuery,
} from "../../api/InvoiceApi";
import { useSelector } from "react-redux";
import Radio from "../../components/Form/Radio";
import Input from "../../components/Form/Input";
import Button from "../../components/ui/Button";
import { Table, TableCell, TableRow } from "../../components/Table";
import Modal from "../../components/ui/Modal";

const CustomerSelect = () => {
  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const [selectedPatient, setSelectedpatient] = useState(null);
  const [BillInTheName, setBillInTheName] = useState(0);
  const [isNextClicked, setIsNextClicked] = useState(false);
  const [isBatchCodeOpen, setIsBatchCodeOpen] = useState(false);

  const { data: contactResp, isLoading: isPatientLoading } =
    useGetPatientsQuery({ companyId: hasMultipleLocations[0] });

  const { data: customerData, isLoading: isCustomerLoading } =
    useGetCustomerByIdQuery(
      { id: selectedPatient?.CustomerMasterID },
      { skip: !selectedPatient?.CustomerMasterID }
    );

  const { data: allMaster, isLoading: isMasterLoading } =
    useGetAllOrderMasterQuery(
      { patientId: selectedPatient?.Id },
      { skip: !selectedPatient?.Id }
    );

  const [getbatches, { data: batchDetails, isFetching: isBatchesFetching }] =
    useLazyGetBatchDetailsQuery();

  return (
    <div className="max-w-7xl">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          {!isNextClicked && (
            <div className="w-1/2">
              <Autocomplete
                options={contactResp?.data?.patients || []}
                getOptionLabel={(option) =>
                  `${option.CustomerName} ${option.MobNumber}`
                }
                value={
                  contactResp?.data?.patients.find(
                    (master) => master.CustomerMasterID === selectedPatient?.CustomerMasterID
                  ) || null
                }
                onChange={(_, newValue) => setSelectedpatient(newValue || null)}
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
          )}

          {isCustomerLoading && <Loader color="black" />}
          {/* Display Customer Details */}
          {!isNextClicked &&
            !isCustomerLoading &&
            selectedPatient &&
            customerData && (
              <div className="p-6 grid grid-cols-5 gap-4 text-sm">
                <div>
                  <strong>Patient Name:</strong> {selectedPatient.CustomerName}
                </div>
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
                      <strong>GST No:</strong> {customerData?.data?.data?.TAXNo}
                    </div>
                    <div>
                      <strong>Address:</strong>{" "}
                      {`${customerData?.data?.data.BillAddress1} ${customerData?.data?.data.BillAddress2} ${customerData?.data?.data.BillCity}`}
                    </div>
                  </>
                )}
                {customerData?.data?.data?.BillingMethod === 1 && (
                  <div>
                    <strong>Billing Method:</strong> Delivery Challan(DC)
                  </div>
                )}
                {customerData?.data?.data?.CreditBilling === 1 && (
                  <>
                    <div>
                      <strong>Credit Billing:</strong> Yes
                    </div>
                    <div>
                      <strong>Credit Limit Available:</strong>{" "}
                      {parseFloat(
                        customerData?.data?.data?.CreditLimit
                      ).toLocaleString()}
                    </div>
                  </>
                )}

                <div className="flex items-center gap-3 flex-grow col-span-2">
                  <label>Bill in the name:</label>
                  <div className="flex items-center gap-3">
                    <Radio
                      name="bill"
                      label="Patient Name"
                      value="0"
                      checked={BillInTheName === 0}
                      onChange={() => setBillInTheName(0)}
                    />
                    <Radio
                      name="bill"
                      label="Customer Name"
                      value="1"
                      checked={BillInTheName === 1}
                      onChange={() => setBillInTheName(1)}
                    />
                  </div>
                </div>
              </div>
            )}

          {selectedPatient && !isNextClicked && !isCustomerLoading && (
            <div className="flex justify-end">
              <Button onClick={() => setIsNextClicked(true)}>
                Select & Next
              </Button>
            </div>
          )}

          {/* table data */}
          {isNextClicked && (
            <div>
              <div className="flex justify-between items-center mb-10">
                <div className=" grid grid-cols-5 gap-4 text-sm">
                  <div>
                    <strong>Patient Name:</strong>{" "}
                    {selectedPatient?.CustomerName}
                  </div>
                  <div>
                    <strong>Customer Name:</strong>{" "}
                    {customerData?.data?.data?.CustomerName}
                  </div>
                  <div>
                    <strong>Mobile Number:</strong> {selectedPatient?.MobNumber}
                  </div>
                </div>
                <Button
                  onClick={() => setIsNextClicked(false)}
                  variant="outline"
                >
                  Back
                </Button>
              </div>
              <Table
                columns={[
                  "Bill",
                  "Order No.",
                  "Product Type",
                  "Product Details",
                  "SRP",
                  "Selling Price",
                  "Order Qty",
                  "Qty",
                  "Avl qty",
                  "Total amount",
                  "advance",
                  "balance",
                  "action",
                ]}
                data={[]}
                renderRow={(pool, index) => <TableRow key={pool.id}></TableRow>}
              />
            </div>
          )}

          <BatchCode
            isOpen={isBatchCodeOpen}
            onClose={() => setIsBatchCodeOpen(false)}
            batchDetails={batchDetails}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerSelect;

const BatchCode = ({ isOpen, onClose }) => {
  const [batchData, setbatchData] = useState({
    isBatchSelectorEnter: 0,
    batchCode: null,
    expiryDate: null,
    avlQty: null,
    toBillQty: 1,
    batchData: [],
  });

  const [newItem, setNewItem] = useState({
    avlQty: null,
    toBillQty: 1,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setbatchData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Radio
            label="Select Batch Code"
            name="isBatchSelectorEnter"
            value="0"
            checked={batchData.isBatchSelectorEnter == 0}
            onChange={handleChange}
          />
          <Radio
            label="Enter Batch Code"
            name="isBatchSelectorEnter"
            value="1"
            checked={batchData.isBatchSelectorEnter == 1}
            onChange={handleChange}
          />
        </div>

        <div className="w-1/2">
          <Autocomplete
            // options={contactResp?.data?.patients || []}
            getOptionLabel={(option) =>
              `${option.CustomerName} ${option.MobNumber}`
            }
            // value={
            //   contactResp?.data?.patients.find(
            //     (master) => master.CustomerMasterID === selectedPatient
            //   ) || null
            // }
            onChange={(_, newValue) =>
              setbatchData((prev) => ({
                ...prev,
                batchCode: newValue.Id,
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select Batch Code"
                size="small"
              />
            )}
            isOptionEqualToValue={(option, value) =>
              option.CustomerMasterID === value.CustomerMasterID
            }
            fullWidth
          />
        </div>

        <div>
          <Input label="Expiry date" value="04/08/2025" disabled />
        </div>
        <div className="flex items-center gap-4">
          <Input label="Avl. Qty" value="1000" placeholder="Avl Qty" />
          <Input label="To Bill Qty" value="1000" />
          <Button>Save</Button>
        </div>
        {/* after adding avl qty,to bill qty show in the table can able to add multiple */}
        <div>
          <Table
            columns={["batch code", "expiry date", "to bill qty", "action"]}
            data={[]}
            renderRow={(pool, index) => <TableRow key={pool.id}></TableRow>}
          />
        </div>
        <div className="flex justify-end">
          <Button>Submit</Button>
        </div>
      </div>
    </Modal>
  );
};
