import React, { useRef, useState, useEffect } from "react";
import { useOrder } from "../../../features/OrderContext";
import { FiArrowLeft, FiPlus, FiSearch, FiX, FiTrash2 } from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { useGetAllBrandsQuery } from "../../../api/brandsApi";
import {
  useCreateNewCustomerMutation,
  useGetPatientDetailsByIdQuery,
  useLazyGetByBarCodeQuery,
  useLazyGetByBrandAndModalQuery,
  useSaveFrameMutation,
} from "../../../api/orderApi";
import toast from "react-hot-toast";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import { Autocomplete, TextField } from "@mui/material";
import Modal from "../../../components/ui/Modal";
import { useGetCountriesQuery, useGetIsdQuery } from "../../../api/customerApi";
import Input from "../../../components/Form/Input";
import Select from "../../../components/Form/Select";
import { useSelector } from "react-redux";

const FrameSunglass = () => {
  const {
    selectedProduct,
    customerId,
    prevStep,
    currentStep,
    goToStep,
    setCustomerId,
  } = useOrder();
  const [barcode, setBarcode] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [brandInput, setBrandInput] = useState(""); // for user typing
  const [brandId, setBrandId] = useState(null); // selected BrandGroupID

  const [modelNo, setModelNo] = useState(null);
  const [items, setItems] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [warningPayload, setWarningPayload] = useState(null);
  const brandInputRef = useRef(null);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [openChange, setOpenChange] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);

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
  const { data: countryIsd } = useGetIsdQuery(
    { id: customerId.countryId },
    { skip: !customerId.countryId }
  );
  const { data: patientDetails, isLoading: isPatientDetailsLoading } =
    useGetPatientDetailsByIdQuery({ id: customerId.customerId });
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        brandInputRef.current &&
        !brandInputRef.current.contains(event.target)
      ) {
        setShowBrandDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode) return;
    const res = await fetchByBarcode({
      barcode,
      locationId: customerId.locationId,
    });
    const data = res?.data?.data;
    if (data) {
      setItems((prev) => {
        const existing = prev.find((i) => i.Barcode === data.Barcode);
        if (existing) {
          return prev.map((i) =>
            i.Barcode === data.Barcode
              ? { ...i, Quantity: Number(i.Quantity) + 1 }
              : i
          );
        }
        return [{ ...data, Quantity: 1 },...prev];
      });
    } else {
      toast.error(`Barcode doesn't exist!`);
    }
    setBarcode("");
  };

  const handleBrandModelSubmit = async (e) => {
    e.preventDefault();
    if (!brandId) return;

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

  const handleRefresh = () => {
    setSearchMode(false);
    setBarcode("");
    setBrandInput("");
    setBrandId(null);
    setModelNo("");
    setSearchResults([]);
    setSelectedRows([]);
  };

  const handleCheckboxChange = (item) => {
    const exists = selectedRows.find((i) => i.Barcode === item.Barcode);
    if (exists) {
      // Remove from selectedRows
      setSelectedRows((prev) => prev.filter((i) => i.Barcode !== item.Barcode));
    } else {
      // Add to selectedRows
      setSelectedRows((prev) => [...prev, item]);
    }
  };

  const handleAddSelectedItems = () => {
    setItems((prev) => {
      const updatedItems = prev.map((item) => {
        const matched = selectedRows.find((s) => s.Barcode === item.Barcode);
        if (matched) {
          return { ...item, Quantity: Number(item.Quantity) + 1 };
        }
        return item;
      });

      // Add new items (not already in prev)
      const newItems = selectedRows
        .filter((s) => !prev.find((p) => p.Barcode === s.Barcode))
        .map((s) => ({ ...s, Quantity: 1 }));

      return [...updatedItems, ...newItems];
    });

    setSelectedRows([]);
    setSearchResults([]);
  };

  const handleQtyChange = (barcode, qty) => {
    setItems((prev) =>
      prev.map((i) =>
        i.Barcode === barcode ? { ...i, Quantity: Number(qty) } : i
      )
    );
  };

  const handleDelete = (barcode) => {
    setItems((prev) => prev.filter((i) => i.Barcode !== barcode));
    setSelectedRows((prev) => prev.filter((i) => i.Barcode !== barcode));
  };

  const handleConfirmBypassWarnings = async () => {
    if (!warningPayload) return;
    const warnedIds = warningPayload.map((w) => w.frameDetailId);
    const newPayload = {
      products: items.map((item) => ({
        frameDetailId: item.Id,
        qty: item.Quantity,
        PatientID: customerId.patientId,
        locationId: customerId.locationId,
        bypassWarnings: true,
      })),
    };
    try {
      await saveFrame({
        orderId: customerId.orderId,
        payload: newPayload,
      }).unwrap();
      toast.success("Frames saved with warnings bypassed.");
      setShowConfirmModal(false);
      goToStep(4);
    } catch (err) {
      setShowConfirmModal(false);
      toast.error("Failed to save after confirming warnings.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (items.length <= 0) return toast.error("Please add at least one item");
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
      if (response?.warnings?.length > 0) {
        setWarningPayload(response.warnings);
        setShowConfirmModal(true);
      } else {
        goToStep(4);
        toast.success("Frames saved successfully!");
      }
    } catch (error) {
      toast.error("Cannot save Frames!");
    }
  };

  const filteredBrands = allBrands?.filter(
    (b) =>
      b.FrameActive === 1 &&
      b.IsActive === 1 &&
      b.BrandName.toLowerCase().includes(brandInput.toLowerCase())
  );

  return (
    <div className="max-w-7xl h-auto">
      <div className="bg-white rounded-xl shadow-sm ">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Patient Name : {customerId.patientName}
                </h3>
                <Button onClick={() => setOpenChange(true)}>Change</Button>
                <Button variant="outline" onClick={() => setOpenAdd(true)}>
                  Add
                </Button>
                <ModifyPatient
                  customerId={customerId}
                  setCustomerId={setCustomerId}
                  isOpen={openChange}
                  onClose={() => {
                    setOpenChange(false);
                  }}
                  patientDetails={patientDetails}
                />
                <AddPatient
                  customerId={customerId}
                  setCustomerId={setCustomerId}
                  isOpen={openAdd}
                  onClose={() => {
                    setOpenAdd(false);
                  }}
                  country={countryIsd?.country}
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Step {currentStep}: {selectedProduct.label}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {searchMode
                  ? "Search by brand and model"
                  : "Scan or enter product barcode to add items"}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button onClick={prevStep} icon={FiArrowLeft} variant="outline">
                Back
              </Button>
              <Button
                onClick={handleRefresh}
                icon={FiPlus}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>
        <div className="p-6 border-gray-100">
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
                      setShowBrandDropdown(true);
                    }}
                    onChange={(event, newValue) => {
                      if (newValue) {
                        setBrandInput(newValue.BrandName);
                        setBrandId(newValue.Id);
                        setShowBrandDropdown(false);
                      }
                    }}
                    value={
                      filteredBrands.find((b) => b.BrandName === brandInput) ||
                      null
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
                    isLoading={isBrandModelLoading || isBrandAndModalFetching}
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
        {items.length > 0 && (
          <div className="p-6">
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
                    {item.Category == "O" ? "Optical Frame" : "Sunglass"}
                  </TableCell>
                  <TableCell>{item.PO}</TableCell>
                  <TableCell>{item.MRP}</TableCell>
                  <TableCell>{item.SellingPrice}</TableCell>
                  <TableCell>
                    <input
                      type="number"
                      value={item.Quantity}
                      onChange={(e) =>
                        handleQtyChange(item.Barcode, e.target.value)
                      }
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                    />
                  </TableCell>
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
              <h3 className="font-semibold">Select Frames</h3>
              <div className="">
                {selectedRows.length > 0 ? (
                  <Button
                    onClick={handleAddSelectedItems}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Selected Items
                  </Button>
                ) : (
                  <Button
                    onClick={() => setSearchResults([])}
                    variant="outline"
                    icon={FiX}
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
            <Table
              columns={[
                "",
                "Barcode",
                "Name",
                "Frame Size",
                "S/O",
                "pRODUCR DETAILS",
                "MRP",
                "Selling Price",
              ]}
              data={searchResults}
              renderRow={(item, index) => (
                <TableRow key={item.Barcode}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedRows.some(
                        (i) => i.Barcode === item.Barcode
                      )}
                      onChange={() => handleCheckboxChange(item)}
                    />
                  </TableCell>
                  <TableCell>{item.Barcode}</TableCell>
                  <TableCell>{item.Name}</TableCell>
                  <TableCell>{item.Size}</TableCell>
                  <TableCell>
                    {item.Category == 0 ? "Optical Frame" : "Sunglass"}
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
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBypassWarnings}
        title="Stock Warning"
        message={
          warningPayload && warningPayload.length > 0 ? (
            <>
              <p className="mb-2">Some frames have stock issues:</p>
              <ul className="list-disc pl-5">
                {warningPayload.map((warning, idx) => {
                  const indexInItems =
                    items.findIndex(
                      (item) => item.Id === warning.frameDetailId
                    ) + 1;
                  return (
                    <li key={warning.frameDetailId}>
                      Frame #{indexInItems}: {warning.message}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2">Do you want to proceed anyway?</p>
            </>
          ) : (
            "Some frames are out of stock. Do you want to proceed anyway?"
          )
        }
        confirmText="Yes, Proceed"
        cancelText="Cancel"
        danger={false}
        isLoading={isFrameSaving}
      />
    </div>
  );
};

export default FrameSunglass;

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
          patientName: response?.data.data.contact.CustomerName,
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
