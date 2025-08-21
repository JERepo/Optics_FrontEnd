import React, { useEffect, useState } from "react";
import { useOrder } from "../../../features/OrderContext";
import {
  useCreateNewCustomerMutation,
  useGetIdentifierQuery,
  useGetPatientDetailsByIdQuery,
  useLazyGetByBarCodeQuery,
  useLazyGetByBrandAndModalQuery,
  useSaveFrameMutation,
} from "../../../api/orderApi";
import { useGetCountriesQuery, useGetIsdQuery } from "../../../api/customerApi";
import { FiArrowLeft, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { useSelector } from "react-redux";
import Modal from "../../../components/ui/Modal";
import { Autocomplete, TextField } from "@mui/material";
import Input from "../../../components/Form/Input";
import Select from "../../../components/Form/Select";
import toast from "react-hot-toast";
import { useGetAllBrandsQuery } from "../../../api/brandsApi";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import { Table, TableCell, TableRow } from "../../../components/Table";

const FrameSunglassAndOpticalLens = () => {
  const {
    selectedProduct,
    customerId,
    prevStep,
    currentStep,
    goToStep,
    setCustomerId,
    setCurrentSubStep,
    goToSubStep,
    setFrameId,
    Identifiers,
    setIdentifiers,
  } = useOrder();

  const [openChange, setOpenChange] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [brandInput, setBrandInput] = useState("");
  const [brandId, setBrandId] = useState(null);
  const [modelNo, setModelNo] = useState(null);
  const [items, setItems] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [warningPayload, setWarningPayload] = useState(null);

  const { data: Identifier } = useGetIdentifierQuery();

  const { data: patientDetails, isLoading: isPatientDetailsLoading } =
    useGetPatientDetailsByIdQuery({ id: customerId.customerId });
  const { data: countryIsd } = useGetIsdQuery(
    { id: customerId.countryId },
    { skip: !customerId.countryId }
  );
  const { data: allBrands } = useGetAllBrandsQuery();
  const [
    fetchByBarcode,
    { isLoading: isBarcodeLoading, isFetching: isBarCodeFetching },
  ] = useLazyGetByBarCodeQuery();
  const [
    fetchByBrandModal,
    { isLoading: isBrandModelLoading, isFetching: isBrandAndModalFetching },
  ] = useLazyGetByBrandAndModalQuery();
  const [saveFrame, { isLoading: isFrameSaving }] = useSaveFrameMutation();

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode || items.length > 0) return;
    const res = await fetchByBarcode({
      barcode,
      locationId: customerId.locationId,
    });
    const data = res?.data?.data;
    if (data) {
      setItems([{ ...data, Quantity: 1 }]);
      setBarcode("");
    } else {
      toast.error(`Barcode doesn't exist!`);
    }
  };

  const handleBrandModelSubmit = async (e) => {
    e.preventDefault();
    if (!brandId || items.length > 0) return;

    try {
      const res = await fetchByBrandModal({
        brand: brandId,
        modal: modelNo,
        locationId: customerId.locationId,
      });

      const data = res?.data?.data;

      if (data && data.length > 0) {
        setSearchResults(data);
        setBrandInput("");
        setBrandId(null);
        setModelNo("");
        setSearchMode(false);
      } else {
        toast.error(res?.data?.message || "No matching models found");
        setBrandInput("");
        setBrandId(null);
        setModelNo("");
        setSearchMode(false);
      }
    } catch (err) {
      const msg = err?.data?.message || err?.error || "Failed to fetch models";
      toast.error(msg);
      setBrandInput("");
      setBrandId(null);
      setModelNo("");
      setSearchMode(false);
    }
  };

  const handleSelectItem = (item) => {
    if (items.length > 0) return;
    setItems([{ ...item, Quantity: 1 }]);
    setSearchResults([]);
    setSearchMode(false);
  };

  const handleConfirmBypassWarnings = async () => {
    if (!warningPayload) return;
    const warnedIds = warningPayload.map((w) => w.frameDetailId);
    const newPayload = {
      products: items.map((item) => ({
        frameDetailId: item.Id,
        qty: item.Quantity,
        locationId: customerId.locationId,
        bypassWarnings: warnedIds.includes(item.Id),
      })),
    };
    try {
      const response = await saveFrame({
        orderId: customerId.orderId,
        payload: newPayload,
      }).unwrap();
      const frameId = response?.inserted[0]?.frameDetailId;
      setFrameId(frameId);
      setIdentifiers((prev) => ({
        ...prev,
        frameDetailedId: frameId,
        identifier: Identifier.identifier,
      }));
      toast.success("Frame saved with warnings bypassed.");
      setShowConfirmModal(false);

      goToSubStep(4);
    } catch (err) {
      setShowConfirmModal(false);
      toast.error("Failed to save after confirming warnings.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (items.length !== 1) return toast.error("Please add exactly one item");
    const basePayload = {
      products: items.map((item) => ({
        frameDetailId: item.Id,
        qty: item.Quantity,
        PatientID: customerId.patientId,
        locationId: customerId.locationId,
        bypassWarnings: false,
      })),
    };
    try {
      const response = await saveFrame({
        orderId: customerId.orderId,
        payload: basePayload,
      }).unwrap();
      const frameId = response?.inserted[0]?.frameDetailId;
      setFrameId(frameId);
      setIdentifiers((prev) => ({
        ...prev,
        frameDetailedId: frameId,
        identifier: Identifier.identifier,
      }));
      if (response?.warnings?.length > 0) {
        setWarningPayload(response.warnings);
        setShowConfirmModal(true);
      } else {
        goToSubStep(4);
        toast.success("Frame saved successfully!");
      }
    } catch (error) {
      toast.error("Cannot save Frame!");
    }
  };

  const handleDelete = (barcode) => {
    setItems([]);
  };

  const filteredBrands = allBrands?.filter(
    (b) =>
      b.FrameActive === 1 &&
      b.IsActive === 1 &&
      b.BrandName.toLowerCase().includes(brandInput.toLowerCase())
  );

  return (
    <div>
      <div className="max-w-8xl h-auto">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Patient Name: {customerId.patientName}
                  </h3>
                  <Button onClick={() => setOpenChange(true)}>Change</Button>
                  <Button variant="outline" onClick={() => setOpenAdd(true)}>
                    Add
                  </Button>
                  <ModifyPatient
                    customerId={customerId}
                    setCustomerId={setCustomerId}
                    isOpen={openChange}
                    onClose={() => setOpenChange(false)}
                    patientDetails={patientDetails}
                  />
                  <AddPatient
                    customerId={customerId}
                    setCustomerId={setCustomerId}
                    isOpen={openAdd}
                    onClose={() => setOpenAdd(false)}
                    country={countryIsd?.country}
                  />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Step {currentStep}(a): Frame/Sunglass
                </h1>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button onClick={prevStep} icon={FiArrowLeft} variant="outline">
                  Back
                </Button>
                <Button icon={FiPlus} className="bg-blue-600 hover:bg-blue-700">
                  Refresh
                </Button>
              </div>
            </div>
            {items.length === 0 && (
              <div className="border-gray-100 mt-5">
                {!searchMode ? (
                  <form onSubmit={handleBarcodeSubmit} className="space-y-2">
                    <div className="flex flex-col gap-3">
                      <label
                        htmlFor="barcode"
                        className="text-sm font-medium text-gray-700"
                      >
                        Enter Barcode
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex items-center">
                          <input
                            id="barcode"
                            type="text"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            placeholder="Scan or enter barcode"
                            className="w-[400px] pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                          />
                          <FiSearch className="absolute left-3 text-gray-400" />
                        </div>
                        <Button
                          type="submit"
                          isLoading={isBarcodeLoading || isBarCodeFetching}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setSearchMode(true)}
                          variant="outline"
                        >
                          Search
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleBrandModelSubmit} className="space-y-2">
                    <div className="flex flex-col gap-3">
                      <label className="text-sm font-medium text-gray-700">
                        Search by Brand & Model *
                      </label>
                      <div className="flex gap-2">
                        <Autocomplete
                          options={filteredBrands}
                          getOptionLabel={(option) => option.BrandName}
                          onInputChange={(event, value) => {
                            setBrandInput(value);
                          }}
                          onChange={(event, newValue) => {
                            if (newValue) {
                              setBrandInput(newValue.BrandName);
                              setBrandId(newValue.Id);
                            }
                          }}
                          value={
                            filteredBrands.find(
                              (b) => b.BrandName === brandInput
                            ) || null
                          }
                          isOptionEqualToValue={(option, value) =>
                            option.Id === value.Id
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Search Brand"
                              variant="outlined"
                              fullWidth
                            />
                          )}
                          sx={{ width: 400 }}
                        />
                        <input
                          type="text"
                          value={modelNo}
                          onChange={(e) => setModelNo(e.target.value)}
                          placeholder="Model Number"
                          className="flex-1 pl-4 pr-4 py-3 border border-gray-300 rounded-lg"
                        />
                        <Button
                          type="submit"
                          disabled={isBrandModelLoading || !brandId}
                          isLoading={
                            isBrandModelLoading || isBrandAndModalFetching
                          }
                        >
                          Search
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setSearchMode(false)}
                          variant="outline"
                          icon={FiX}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
            {items.length > 0 && (
              <div className="mt-5">
                <Table
                  columns={[
                    "S.No",
                    "Barcode",
                    "Name",
                    "Frame Size",
                    "S/O",
                    "Product details",
                    "MRP",
                    "Selling Price",
                    "Qty",
                    "Action",
                  ]}
                  data={items}
                  renderRow={(item, index) => (
                    <TableRow key={item.Barcode}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.Barcode}</TableCell>
                      <TableCell>{item.Name}</TableCell>
                      <TableCell>{item.Size}</TableCell>
                      <TableCell>
                        {item.Category === "O" ? "Optical Frame" : "Sunglass"}
                      </TableCell>
                      <TableCell>{item.PO}</TableCell>
                      <TableCell>{item.MRP}</TableCell>
                      <TableCell>{item.SellingPrice}</TableCell>
                      <TableCell>{item.Quantity}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleDelete(item.Barcode)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiTrash2 />
                        </button>
                      </TableCell>
                    </TableRow>
                  )}
                />
                <div className="flex justify-end mt-6">
                  <Button
                    type="submit"
                    isLoading={isFrameSaving}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700"
                    onClick={handleSave}
                  >
                    Save & Continue
                  </Button>
                </div>
              </div>
            )}
            {!searchMode && searchResults.length > 0 && (
              <div className="p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">Select Frame</h3>
                  <Button
                    onClick={() => setSearchResults([])}
                    variant="outline"
                    icon={FiX}
                  >
                    Close
                  </Button>
                </div>
                <Table
                  columns={[
                    "",
                    "Barcode",
                    "Name",
                    "Frame Size",
                    "S/O",
                    "Product Details",
                    "MRP",
                    "Selling Price",
                  ]}
                  data={searchResults}
                  renderRow={(item, index) => (
                    <TableRow key={item.Barcode}>
                      <TableCell>
                        <Button
                          onClick={() => handleSelectItem(item)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Select
                        </Button>
                      </TableCell>
                      <TableCell>{item.Barcode}</TableCell>
                      <TableCell>{item.Name}</TableCell>
                      <TableCell>{item.Size}</TableCell>
                      <TableCell>
                        {item.Category === "O" ? "Optical Frame" : "Sunglass"}
                      </TableCell>
                      <TableCell>{item.PO}</TableCell>
                      <TableCell>{item.MRP}</TableCell>
                      <TableCell>{item.SellingPrice}</TableCell>
                    </TableRow>
                  )}
                />
              </div>
            )}
          </div>
        </div>
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmBypassWarnings}
          title="Stock Warning"
          message={
            warningPayload && warningPayload.length > 0 ? (
              <>
                <p className="mb-2">The frame has stock issues:</p>
                <ul className="list-disc pl-5">
                  {warningPayload.map((warning, idx) => (
                    <li key={warning.frameDetailId}>
                      Frame: {warning.message}
                    </li>
                  ))}
                </ul>
                <p className="mt-2">Do you want to proceed anyway?</p>
              </>
            ) : (
              "The frame is out of stock. Do you want to proceed anyway?"
            )
          }
          confirmText="Yes, Proceed"
          cancelText="Cancel"
          danger={false}
          isLoading={isFrameSaving}
        />
      </div>
    </div>
  );
};

export default FrameSunglassAndOpticalLens;

const ModifyPatient = ({
  customerId,
  setCustomerId,
  onClose,
  isOpen,
  patientDetails,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>
        <div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Patient
            </label>
            <Autocomplete
              options={patientDetails?.data || []}
              getOptionLabel={(option) => option?.CustomerName || ""}
              value={
                patientDetails?.data.find(
                  (p) => p.Id === customerId.patientId
                ) || null
              }
              onChange={(_, newValue) => {
                setCustomerId((prev) => ({
                  ...prev,
                  patientId: newValue?.Id,
                  patientName: newValue?.CustomerName,
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search or select patient"
                  size="small"
                />
              )}
              isOptionEqualToValue={(option, value) => option.Id === value.id}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

const AddPatient = ({
  customerId,
  setCustomerId,
  onClose,
  isOpen,
  country,
}) => {
  const [errors, setErrors] = useState({});
  const { user } = useSelector((state) => state.auth);
  const [newCustomer, setNewCustomer] = useState({
    name: null,
    mobileISD: null,
    mobileNo: null,
    mobileAlert: 0,
    emailId: null,
    DOB: null,
    Engraving: null,
    ExistingCustomer: 1,
    ExistingCustomerId: customerId.customerId,
  });
  const { data: allCountries } = useGetCountriesQuery();
  const [
    createNewCustomer,
    { data: newCustomerData, isLoading: isNewCustomerLoading },
  ] = useCreateNewCustomerMutation();
  console.log(country, customerId);
  useEffect(() => {
    if (isOpen && country?.ISDCode) {
      setNewCustomer({
        name: null,
        mobileISD: country.ISDCode,
        mobileNo: null,
        mobileAlert: 0,
        emailId: null,
        DOB: null,
        Engraving: null,
        ExistingCustomer: 1,
        ExistingCustomerId: customerId.customerId,
      });
      setErrors({});
    }
  }, [isOpen, country, customerId.customerId]);

  const customerHandleChange = (e) => {
    const { name, value, checked, type } = e.target;

    if (name === "ExistingCustomer") {
      const isChecked = checked ? 1 : 0;

      setNewCustomer((prev) => ({
        ...prev,
        [name]: isChecked,
        ExistingCustomerId: isChecked === 0 ? null : prev.ExistingCustomerId,
      }));
    } else {
      setNewCustomer((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
      }));
    }

    setErrors((prevErrors) => {
      const updatedErrors = { ...prevErrors };

      if (name === "name" && value.trim() !== "") {
        delete updatedErrors.name;
      }

      if (name === "mobileNo") {
        if (/^\d{10}$/.test(value)) {
          delete updatedErrors.mobileNo;
        }
      }

      return updatedErrors;
    });
  };
  const validateCustomer = () => {
    const newErrors = {};

    if (!newCustomer.name || newCustomer.name.trim() === "") {
      newErrors.name = "Name is required";
    }

    if (!newCustomer.mobileNo || newCustomer.mobileNo.trim() === "") {
      newErrors.mobileNo = "Mobile number is required";
    } else if (!/^\d{10}$/.test(newCustomer.mobileNo)) {
      newErrors.mobileNo = "Mobile number must be exactly 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async () => {
    const payload = {
      AssignToExistingCustomer: newCustomer.ExistingCustomer,
      CustomerMasterID: newCustomer.ExistingCustomerId,
      CustomerName: newCustomer.name,
      Email: newCustomer.emailId,
      EmailAlert: 1,
      MobileISDCode: newCustomer.mobileISD,
      MobNumber: newCustomer.mobileNo,
      MobAlert: newCustomer.mobileAlert,
      CompanyID: customerId.companyId,
      Engraving: newCustomer.Engraving,
    };
    try {
      const response = await createNewCustomer({
        userId: user.Id,
        payload,
      }).unwrap();
      if (response?.data?.data.contact) {
        setCustomerId((prev) => ({
          ...prev,
          patientId: response?.data.data.contact.Id,
          patientName: response?.data.data.CustomerName,
        }));
      }

      toast.success("New patient created successfully");
      onClose();
    } catch (error) {
      console.log(error);
      toast.error("Failed to create patient");
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <Input
          label="Name *"
          name="name"
          onChange={customerHandleChange}
          value={newCustomer.name}
          error={errors.name}
        />

        <div className="flex gap-4">
          <div className="w-28">
            <Select
              label="Country Code"
              name="mobileISD"
              onChange={customerHandleChange}
              value={newCustomer.mobileISD}
              options={allCountries?.country}
              optionLabel="ISDCode"
              optionValue="ISDCode"
            />
          </div>
          <div className="flex-grow">
            <Input
              label="Mobile No. *"
              name="mobileNo"
              onChange={customerHandleChange}
              value={newCustomer.mobileNo}
              error={errors.mobileNo}
            />
          </div>
        </div>

        {/* Mobile Alert Checkbox */}
        <div>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="mobileAlert"
              checked={newCustomer.mobileAlert === 1}
              onChange={customerHandleChange}
              className="mr-2"
            />
            Mobile Alert
          </label>
        </div>

        <Input
          label="Email"
          name="emailId"
          onChange={customerHandleChange}
          value={newCustomer.emailId || ""}
        />

        <Input
          label="Date of Birth"
          type="date"
          name="DOB"
          onChange={customerHandleChange}
          value={newCustomer.DOB || ""}
        />

        <Input
          label="Engraving"
          name="Engraving"
          onChange={customerHandleChange}
          value={newCustomer.Engraving || ""}
        />

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={() => {
              if (validateCustomer()) {
                handleSubmit(newCustomer);
              }
            }}
            isLoading={isNewCustomerLoading}
            loadingText="Creating customer"
          >
            {isNewCustomerLoading ? "Saving" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
