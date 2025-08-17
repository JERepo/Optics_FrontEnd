import React, { useEffect, useState } from "react";
import { useOrder } from "../../../features/OrderContext";
import { FiArrowLeft, FiPlus, FiRefreshCw } from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { Table, TableCell, TableRow } from "../../../components/Table";
import TextField from "@mui/material/TextField";
import { useGetAllBrandsQuery } from "../../../api/brandsApi";
import {
  useCreateNewCustomerMutation,
  useGetColourQuery,
  useGetModalitiesQuery,
  useGetPatientDetailsByIdQuery,
  useGetPowerDetailsMutation,
  useGetProductNamesByModalityQuery,
  useSaveContactLensMutation,
} from "../../../api/orderApi";
import { Autocomplete } from "@mui/material";
import Input from "../../../components/Form/Input";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { useGetCountriesQuery, useGetIsdQuery } from "../../../api/customerApi";
import Modal from "../../../components/ui/Modal";
import Select from "../../../components/Form/Select";

// Validation helpers
const isMultipleOfQuarter = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && Math.abs(num * 100) % 25 === 0;
};

const isValidAxis = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num >= 1 && num <= 180;
};

const DisplayInformation = ({ items, onSave, isContactLensCreating }) => {
  const totalQty = items.reduce(
    (sum, item) => sum + Number(item.orderQty || 0),
    0
  );
  const totalAmount = items.reduce(
    (sum, item) =>
      sum + Number(item.sellingPrice || 0) * Number(item.orderQty || 0),
    0
  );

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Quantity</p>
            <p className="text-lg font-semibold text-gray-800">{totalQty}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Amount</p>
            <p className="text-lg font-semibold text-gray-800">
              ₹{totalAmount.toFixed(2)}
            </p>
          </div>
        </div>
        <Button
          onClick={onSave}
          isLoading={isContactLensCreating}
          className="bg-green-600 hover:bg-green-700"
          size="lg"
        >
          Save & Next
        </Button>
      </div>
    </div>
  );
};

const ContactLens = () => {
  const {
    selectedProduct,
    prevStep,
    currentStep,
    customerId,
    draftData,
    goToStep,
    setCustomerId,
  } = useOrder();

  const [openChange, setOpenChange] = useState(false);
  const [searchFethed, setSearchFetched] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [items, setItems] = useState([]);
  const [showInputRow, setShowInputRow] = useState(true);
  const [lensData, setLensData] = useState({
    orderReference: null,
    brandId: null,
    modalityId: null,
    productId: null,
    color: null,
  });

  const [newItem, setNewItem] = useState({
    CLDetailId: null,
    sphericalPower: null,
    cylindricalPower: null,
    axis: null,
    additional: null,
    avlQty: null,
    orderQty: null,
    sellingPrice: null,
  });

  const [errors, setErrors] = useState({});

  const { data: modalities, isLoading: modalitiesLoading } =
    useGetModalitiesQuery();
  const { data: allBrands } = useGetAllBrandsQuery();
  const { data: productNames, isLoading: isProductsLoading } =
    useGetProductNamesByModalityQuery(
      { brandId: lensData.brandId, modalityId: lensData.modalityId },
      { skip: !lensData.brandId || !lensData.modalityId }
    );

  const { data: colorData, isLoading: colorDataLoading } = useGetColourQuery(
    { clMainId: lensData.productId },
    { skip: !lensData.productId }
  );
  const { data: countryIsd } = useGetIsdQuery(
    { id: customerId.countryId },
    { skip: !customerId.countryId }
  );
  const [saveContactLens, { isLoading: isContactLensCreating }] =
    useSaveContactLensMutation();
  const [getPowerDetails, { isLoading: isPowerDetailsLoading }] =
    useGetPowerDetailsMutation();
  const { data: patientDetails, isLoading: isPatientDetailsLoading } =
    useGetPatientDetailsByIdQuery({ id: customerId.customerId });

  const handleRefresh = () => {
    setLensData({
      orderReference: null,
      brandId: null,
      modalityId: null,
      productId: null,
      color: null,
    });
    setSearchFetched(false);
  };

  const handleRefeshPowerTable = () => {
    setNewItem({
      CLDetailId: "",
      sphericalPower: "",
      cylindricalPower: "",
      axis: "",
      additional: "",
      avlQty: "",
      orderQty: "",
      sellingPrice: "",
    });
    setErrors({});
    setSearchFetched(false);
  };

  const handleInputChangeTop = (e) => {
    const { name, value } = e.target;
    setLensData((prev) => ({ ...prev, [name]: value }));
  };

  const filteredBrands =
    allBrands?.filter(
      (brand) => brand.ContactLensActive === 1 && brand.IsActive === 1
    ) || [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));

    let message = "";

    if (["sphericalPower", "cylindricalPower", "additional"].includes(name)) {
      if (value && !isMultipleOfQuarter(value)) {
        message = "Power should only be in multiples of 0.25";
      }
    }

    if (name === "axis" && value && !isValidAxis(value)) {
      message = "Axis is incorrect";
    }

    if (name === "additional") {
      const additionalValue = parseFloat(value);
      if (value && (!isMultipleOfQuarter(value) || additionalValue < 0)) {
        message = "Additional power must be a positive multiple of 0.25";
      }
    }

    setErrors((prev) => ({ ...prev, [name]: message }));
  };

  const isFormValid = () => {
    const validationErrors = {};

    if (
      !newItem.sphericalPower ||
      !isMultipleOfQuarter(newItem.sphericalPower)
    ) {
      validationErrors.sphericalPower =
        "Power should only be in multiples of 0.25";
    }

    if (
      newItem.cylindricalPower &&
      !isMultipleOfQuarter(newItem.cylindricalPower)
    ) {
      validationErrors.cylindricalPower =
        "Power should only be in multiples of 0.25";
    }

    if (newItem.additional) {
      const additionalValue = parseFloat(newItem.additional);
      if (!isMultipleOfQuarter(additionalValue) || additionalValue < 0) {
        validationErrors.additional =
          "Additional power must be a positive multiple of 0.25";
      }
    }

    if (newItem.axis && !isValidAxis(newItem.axis)) {
      validationErrors.axis = "Axis is incorrect";
    }

    if (isNaN(newItem.avlQty)) {
      validationErrors.avlQty = "AvlQty should be number";
    } else if (newItem.avlQty < 0) {
      validationErrors.avlQty = "AvlQty should be greater than 0";
    }
    if (isNaN(newItem.orderQty)) {
      validationErrors.orderQty = "orderQty should be number";
    } else if (newItem.orderQty < 0) {
      validationErrors.orderQty = "orderQty should be greater than 0";
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleAdd = () => {
    if (!isFormValid()) return;

    const updatedItem = { ...newItem };

    const existingIndex = items.findIndex(
      (item) => item.CLDetailId === newItem.CLDetailId
    );

    let updatedItems;
    if (existingIndex >= 0) {
      updatedItems = [...items];
      updatedItems[existingIndex] = updatedItem;
    } else {
      updatedItems = [...items, updatedItem];
    }

    setItems(updatedItems);
    setShowInputRow(false);
    handleRefeshPowerTable();
  };

  const handleSearch = async () => {
    if (!newItem.sphericalPower) {
      toast.error("Please enter Spherical Power before searching.");
      return;
    }

    const payload = {
      CLMainId: lensData.productId,
      Spherical: parseFloat(newItem.sphericalPower),
      Cylindrical: parseFloat(newItem.cylindricalPower) || null,
      Axis: parseInt(newItem.axis) || null,
      Additional: parseInt(newItem.additional) || null,
      Colour: lensData.color || null,
      locationId: customerId.locationId,
    };

    try {
      const response = await getPowerDetails({ payload }).unwrap();
      if (response?.data?.data) {
        const data = response.data.data;
        toast.success(`${response?.data.message}`);
        setNewItem({
          CLDetailId: data.CLDetailId,
          sphericalPower: data.SphericalPower,
          cylindricalPower: data.CylindricalPower,
          axis: data.Axis,
          additional: data.Additional,
          avlQty: parseInt(data.AvlQty),
          orderQty: data.DefaultOrderQty,
          sellingPrice: data.SellingPrice,
        });
        setSearchFetched(true);
      } else {
        toast.error("No matching power found");
      }
    } catch (error) {
      console.error("error", error);
      toast.error("No matching power found");
      setSearchFetched(false);
    }
  };

  const handleDelete = (indexToDelete) => {
    const updatedItems = items.filter((_, index) => index !== indexToDelete);
    setItems(updatedItems);
  };

  const handlePreviousBack = () => {
    prevStep();
  };

  const handleSaveOrder = async () => {
    if (items.length === 0) {
      toast.error("Please add at least one item before saving");
      return;
    }
    console.log("selected items", items);
    const payload = {
      lenses: items.map((item) => ({
        CLDetailId: item.CLDetailId,
        PatientID: customerId.patientId,
        OrderQty: parseInt(item.orderQty),
        locationId: customerId.locationId,
      })),
    };

    try {
      await saveContactLens({ orderId: customerId.orderId, payload }).unwrap();
      toast.success("Contact lens order saved successfully!");
      goToStep(4);
    } catch (error) {
      console.error("Failed to save order:", error);
      toast.error("Failed to save contact lens order");
    }
  };
  const inputTableColumns = [
    "Spherical Power",
    "Cylindrical Power",
    "Axis",
    "Additional Power",
  ];

  if (newItem.CLDetailId) {
    inputTableColumns.push("Avl.Qty", "Order Qty");
  }

  inputTableColumns.push("Action");

  return (
    <div className="max-w-7xl h-auto">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
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
                Step {currentStep}
                {selectedProduct.value === 6 ? "(b)" : ""}:{" "}
                {selectedProduct.value === 6
                  ? "Optical Lens"
                  : selectedProduct.label}
              </h1>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handlePreviousBack}
                icon={FiArrowLeft}
                variant="outline"
              >
                Back
              </Button>
              <Button onClick={handleRefresh}>Refresh</Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-2 w-[400px] mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Order Reference
            </label>
            <input
              type="text"
              name="orderReference"
              value={lensData.orderReference || draftData?.OrderReference}
              onChange={handleInputChangeTop}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter order reference"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Brand
              </label>
              <Autocomplete
                options={filteredBrands || []}
                getOptionLabel={(option) => option.BrandName || ""}
                value={
                  allBrands?.find((brand) => brand.Id === lensData.brandId) ||
                  null
                }
                onChange={(_, newValue) => {
                  setLensData((prev) => ({
                    ...prev,
                    brandId: newValue?.Id || null,
                    modalityId: null,
                    productId: null,
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search or select brand"
                    size="small"
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={lensData.modalityId}
              />
            </div>

            {lensData.brandId && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Modality
                </label>
                <Autocomplete
                  options={modalities?.data || []}
                  getOptionLabel={(option) => option.ModalityName || ""}
                  value={
                    modalities?.data.find(
                      (modality) => modality.Id === lensData.modalityId
                    ) || null
                  }
                  onChange={(_, newValue) => {
                    setLensData((prev) => ({
                      ...prev,
                      modalityId: newValue?.Id || null,
                      productId: null,
                    }));
                  }}
                  loading={modalitiesLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search or select modality"
                      size="small"
                    />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  disabled={lensData.productId}
                />
              </div>
            )}

            {lensData.modalityId && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Product Name
                </label>
                <Autocomplete
                  options={productNames?.data?.data || []}
                  getOptionLabel={(option) => option.ProductName || ""}
                  value={
                    productNames?.data.data.find(
                      (product) => product.Id === lensData.productId
                    ) || null
                  }
                  onChange={(_, newValue) => {
                    setLensData((prev) => ({
                      ...prev,
                      productId: newValue?.Id || null,
                    }));
                    setShowInputRow(true);
                  }}
                  loading={isProductsLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search or select product"
                      size="small"
                    />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                />
              </div>
            )}
            {lensData.productId && colorData?.data?.data.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Colour
                </label>
                <Autocomplete
                  options={colorData?.data?.data || []}
                  getOptionLabel={(option) => option.Colour || ""}
                  value={
                    colorData?.data.data.find(
                      (product) => product.Colour === lensData.color
                    ) || null
                  }
                  onChange={(_, newValue) => {
                    setLensData((prev) => ({
                      ...prev,
                      color: newValue?.Colour || null,
                    }));
                  }}
                  loading={colorDataLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search or select color"
                      size="small"
                    />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.Color === value.Color
                  }
                />
              </div>
            )}
          </div>
        </div>

        {lensData.productId && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Power Details</h2>
              <div className="flex gap-4">
                <Button
                  onClick={() => setShowInputRow(true)}
                  icon={FiPlus}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add Power Details
                </Button>
                <Button
                  onClick={handleRefeshPowerTable}
                  icon={FiRefreshCw}
                  variant="outline"
                />
              </div>
            </div>

            {showInputRow && (
              <Table
                columns={inputTableColumns}
                data={[{}]}
                renderRow={() => (
                  <TableRow key="input-row">
                    <TableCell>
                      <Input
                        name="sphericalPower"
                        value={newItem.sphericalPower}
                        onChange={handleInputChange}
                        error={errors.sphericalPower}
                        // className={`${searchFethed ? "bg-neutral-400 pointer-events-none" : ""}`}
                        grayOut={searchFethed}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        name="cylindricalPower"
                        value={newItem.cylindricalPower}
                        onChange={handleInputChange}
                        error={errors.cylindricalPower}
                        grayOut={searchFethed}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        name="axis"
                        value={newItem.axis}
                        onChange={handleInputChange}
                        error={errors.axis}
                        grayOut={searchFethed}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        name="additional"
                        value={newItem.additional}
                        onChange={handleInputChange}
                        error={errors.additional}
                        grayOut={searchFethed}
                      />
                    </TableCell>

                    {newItem.CLDetailId && (
                      <>
                        <TableCell>
                          <Input
                            name="avlQty"
                            value={newItem.avlQty}
                            onChange={handleInputChange}
                            error={errors.avlQty}
                            grayOut={searchFethed}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            name="orderQty"
                            value={newItem.orderQty}
                            onChange={handleInputChange}
                            error={errors.orderQty}
                          />
                        </TableCell>
                      </>
                    )}

                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSearch}
                        disabled={isPowerDetailsLoading}
                        variant="outline"
                      >
                        {isPowerDetailsLoading ? "Searching..." : "Search"}
                      </Button>

                      {newItem.CLDetailId && (
                        <>
                          <Button size="sm" onClick={handleAdd}>
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRefeshPowerTable}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              />
            )}
          </div>
        )}

        {/* Items Display */}
        {items.length > 0 && (
          <div className="p-6">
            <Table
              columns={[
                "Spherical",
                "Cylindrical",
                "Axis",
                "Additional",
                "Avl.Qty",
                "Order Qty",
                "Selling Price",
                "Action",
              ]}
              data={items}
              renderRow={(item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.sphericalPower}</TableCell>
                  <TableCell>{item.cylindricalPower}</TableCell>
                  <TableCell>{item.axis}</TableCell>
                  <TableCell>{item.additional}</TableCell>
                  <TableCell>{item.avlQty}</TableCell>
                  <TableCell>{item.orderQty}</TableCell>
                  <TableCell>₹{item.sellingPrice}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(index)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            />

            <DisplayInformation
              items={items}
              onSave={handleSaveOrder}
              isContactLensCreating={isContactLensCreating}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactLens;

const ModifyPatient = ({
  customerId,
  setCustomerId,
  onClose,
  isOpen,
  patientDetails,
}) => {
  console.log("pp", patientDetails);
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
