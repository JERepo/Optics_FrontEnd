import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiRefreshCw,
  FiUserPlus,
  FiArrowLeft,
  FiFilter,
} from "react-icons/fi";
import { Table, TableCell, TableRow } from "../../../components/Table";
import Loader from "../../../components/ui/Loader";
import Select from "../../../components/Form/Select";
import {
  useGetAllCompanyLocationsQuery,
  useGetAllCustomersQuery,
  useGetCompanyIdQuery,
  useGetCountriesQuery,
  useGetIsdQuery,
} from "../../../api/customerApi";
import { useGetAllSalesPersonsQuery } from "../../../api/salesPersonApi";
import Input from "../../../components/Form/Input";
import Modal from "../../../components/ui/Modal";
import { useSelector } from "react-redux";
import { useGetLocationByIdQuery } from "../../../api/roleManagementApi";
import Customer from "../../customers/Customer";
import toast from "react-hot-toast";
import {
  useCreateNewCustomerMutation,
  useCreateSalesOrderMutation,
  useGetCustomerContactDetailsQuery,
  useGetOrderQuery,
} from "../../../api/orderApi";
import Button from "../../../components/ui/Button";
import { useOrder } from "../../../features/OrderContext";
import Checkbox from "../../../components/Form/Checkbox";

const AddOrder = ({
  handleGetPatient,
  getOrderData,
  isGetOrderDataLoading,
  location,
  locationById,
  companyType,
  countryIsd,
  companySettings,
  CustomerPoolID,
  setLocation,
}) => {
  const navigate = useNavigate();
  const { setCustomerId, goToStep } = useOrder();
  const { hasMultipleLocations, user } = useSelector((state) => state.auth);
  const [input, setInput] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [openCustomer, setOpenCustomer] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tempCustomer, setTempCustomer] = useState(null);
  const [loadingCustomerId, setLoadingCustomerId] = useState(null);
  const [creatinfCustomerLoading, setCreatingCustomerLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const [filters, setFilters] = useState({
    name: "",
    mobileNo: "",
    customerName: "",
  });

  const [newCustomer, setNewCustomer] = useState({
    name: null,
    mobileISD: null,
    mobileNo: null,
    mobileAlert: 0,
    emailId: null,
    DOB: null,
    Engraving: null,
    ExistingCustomer: 0,
    ExistingCustomerId: null,
  });

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

  const { data: allCountries } = useGetCountriesQuery();

  const { data: allCompanyLocationData } = useGetAllCompanyLocationsQuery();
  const [
    createNewCustomer,
    { data: newCustomerData, isLoading: isNewCustomerLoading },
  ] = useCreateNewCustomerMutation();
  const { data: contactResp, refetch: refetchPatient } =
    useGetCustomerContactDetailsQuery();
  const {
    data: customersResp,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllCustomersQuery();
  // --- derived data ---
  const allCus = useMemo(() => {
    if (!customersResp?.data?.data || !contactResp?.data) return [];

    const contacts = contactResp.data; // flat array of contacts
    const customers = customersResp.data.data; // array of customers

    // Create a flat list where each contact is merged with its customer
    const combinedList = contacts.map((contact) => {
      const customer = customers.find((c) => c.Id === contact.CustomerMasterID);
      if (!customer) return null;

      return {
        ...customer,
        CustomerContactDetails: [contact], // only that one contact
      };
    });

    // Remove any nulls (if customer was not found)
    return combinedList.filter(Boolean);
  }, [customersResp, contactResp]);

  // Location data

  const handleFilterChange = (e, field) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }));
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setInput("");
    setFilters({ name: "", mobileNo: "", customerName: "" });
    setCurrentPage(1);
  };
  useEffect(() => {
    if (tempCustomer) {
      setSelectedCustomer(tempCustomer);
      setTempCustomer(null);
    }
  }, [getOrderData, tempCustomer]);

  const handleCustomerSelect = (customerWithContact) => {
    const patient = customerWithContact.CustomerContactDetails?.[0];

    if (!patient) {
      toast.error("No patient (contact) found for selected customer.");
      return;
    }

    const selectedData = {
      ...customerWithContact,
      CustomerContactDetails: [patient],
    };

    // Set loading for the selected row
    setLoadingCustomerId(customerWithContact.Id);
    setCustomerOpen(false);
    setTempCustomer(selectedData);
    handleGetPatient(
      customerWithContact.CustomerContactDetails?.[0].Id,
      customerWithContact.Id,
      customerWithContact
    );
    setCustomerId((prev) => ({
      ...prev,
      patientName: customerWithContact.CustomerContactDetails?.[0].CustomerName,
      patientId: customerWithContact.CustomerContactDetails?.[0].Id,
      locationId: parseInt(location),
      customerId: customerWithContact.Id,
      customerData: customerWithContact,
    }));
    setCreatingCustomerLoading(false);
  };

  const onBack = () => setSelectedCustomer(null);
  const handleOpenNewCustomer = () => {
    if (!location && hasMultipleLocations?.length > 0) {
      setLocation(hasMultipleLocations[0]);
    }
    setNewCustomer((prev) => ({
      ...prev,
      mobileISD: countryIsd?.country?.ISDCode || prev.mobileISD || null,
    }));
    setCustomerOpen(true);
  };

  const handleCloseCustomer = () => {
    setCustomerOpen(false);
    setErrors({});
    setNewCustomer({
      name: null,
      mobileISD: countryIsd?.country.Id || null,
      mobileNo: null,
      mobileAlert: 0,
      emailId: null,
      DOB: null,
      Engraving: null,
      ExistingCustomer: 0,
      ExistingCustomerId: null,
    });
  };
  const filteredData = allCus.filter((c) => {
    const customerName = (c.CustomerName || "").toLowerCase();

    const firstContact = c.CustomerContactDetails[0] || {};
    const patientName = (firstContact.CustomerName || "").toLowerCase();
    const mobileNo = (firstContact.MobNumber || "").toLowerCase();

    const matchesMainSearch =
      !input ||
      customerName.includes(input.toLowerCase()) ||
      patientName.includes(input.toLowerCase()) ||
      mobileNo.includes(input.toLowerCase());

    const matchesPatientName = patientName.includes(filters.name.toLowerCase());
    const matchesMobile = mobileNo.includes(filters.mobileNo.toLowerCase());
    const matchesCustomerName = customerName.includes(
      filters.customerName.toLowerCase()
    );

    return (
      matchesMainSearch &&
      matchesPatientName &&
      matchesMobile &&
      matchesCustomerName
    );
  });

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCustomers = filteredData.slice(
    startIndex,
    startIndex + pageSize
  );
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const hasSearchInput =
    input || filters.name || filters.mobileNo || filters.customerName;

  const handleSubmit = async (newCustomer, data) => {
    if (newCustomer) {
      setCreatingCustomerLoading(true);
      const locationData = locationById?.data?.data || {};

      const payload = {
        AssignToExistingCustomer: parseInt(newCustomer.ExistingCustomer),
        CustomerName: newCustomer.name,
        Email: newCustomer.emailId,
        EmailAlert: 0,
        MobileISDCode: newCustomer.mobileISD,
        MobNumber: newCustomer.mobileNo,
        MobAlert: newCustomer.mobileAlert,
        DOB: newCustomer.DOB,
        Engraving: newCustomer.Engraving,
        CustomerGroupID: companySettings?.data?.data?.CustomerGroupDefault,
        BillingAddress1: locationData?.BillingAddress1,
        BillStateID: locationData.BillingStateCode,
        BillCountryID: locationData.BillingCountryCode,
        SameShipTo: 1,
        ShipStateID: locationData.BillingStateCode,
        ShipCountryID: locationData.BillingCountryCode,
        TAXRegisteration: 0,
        BillingMethod: 0,
        FittingPrice: 0,
        LoyaltyEnrollment: 0,
        IsActive: locationData.isActive,
        EnableCustomerLogin: 1,
        CustomerType: 0,
        CompanyID: companySettings?.data.data.CompanyId,
      };

      if (parseInt(newCustomer.ExistingCustomer) === 1) {
        payload.CustomerMasterID = parseInt(newCustomer.ExistingCustomerId);
      }

      try {
        const response = await createNewCustomer({
          userId: user.Id,
          payload,
        }).unwrap();

        const updatedCustomers = await refetch().unwrap();
        const updatePatientDetails = await refetchPatient().unwrap();

        const masterId =
          response?.data?.data?.contact?.CustomerMasterID ||
          response?.data?.data.customerId;

        const createdCustomer = updatedCustomers?.data?.data.find(
          (c) => c.Id === masterId
        );

        if (createdCustomer) {
          const matchingContact = updatePatientDetails?.data?.find(
            (c) => c.CustomerMasterID === createdCustomer.Id
          );

          if (matchingContact) {
            const enrichedCustomer = {
              ...createdCustomer,
              CustomerContactDetails: [matchingContact],
            };
            toast.success("New customer created successfully");
            handleCustomerSelect(enrichedCustomer);
          } else {
            toast.error("Customer created, but no associated contact found.");
            setCreatingCustomerLoading(false);
          }
        }
      } catch (error) {
        toast.error("Failed to create new customer");
        setCreatingCustomerLoading(false);
      }
    } else {
      const updatedCustomers = await refetch();

      const masterId = data?.data?.data.customerId;

      const createdCustomer = updatedCustomers?.data?.data?.data.find(
        (c) => c.Id === masterId
      );

      if (createdCustomer) {
        setOpenCustomer(false);

        handleCustomerSelect(createdCustomer);
      } else {
        toast.error("Customer created but not found in the updated list");
      }
    }
  };

  const renderFilterInput = (field, label) => (
    <div className="flex flex-col space-y-1">
      <span className="font-medium text-gray-700">{label}</span>
      <div className="relative">
        <input
          type="text"
          placeholder="Filter..."
          value={filters[field]}
          onChange={(e) => handleFilterChange(e, field)}
          className="w-full px-2 py-2.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        <FiFilter className="absolute right-2 top-2 text-gray-400 text-xs" />
      </div>
    </div>
  );
  console.log("by id", locationById);
  return (
    <>
      {!selectedCustomer ? (
        <div className="max-w-6xl p-6 bg-white rounded-lg shadow-md pb-6">
          <div className="mb-6">
            <span className="text-lg font-semibold text-blue-600">
              Step 1: Select Customer
            </span>
          </div>

          <div className="text-xl font-semibold text-neutral-700 mb-4">
            Customer Information
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-grow flex items-center">
              <div className="absolute left-3 text-gray-400">
                <FiSearch />
              </div>
              <input
                type="text"
                placeholder="Search by name or mobile number..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full pl-10 pr-24 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="cursor-pointer absolute right-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors">
                Search
              </button>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => navigate("/order-list")}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
              >
                <FiArrowLeft />
                <span>Back</span>
              </button>
              <button
                onClick={handleRefresh}
                className=" flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                <FiRefreshCw />
                <span className="text-neutral-50">Refresh</span>
              </button>
              <button
                onClick={handleOpenNewCustomer}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
              >
                <FiUserPlus />
                <span className="text-neutral-50">New Customer</span>
              </button>
            </div>
          </div>

          {(isLoading || isFetching) && (
            <div className="flex justify-center items-center">
              <Loader />
            </div>
          )}

          {hasSearchInput && !isLoading && !isFetching && (
            <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 shadow-sm p-4">
              <Table
                columns={[
                  "S.No",
                  "Patient name",
                  "Mobile no",
                  "Customer name",
                  "Action",
                ]}
                data={paginatedCustomers}
                renderRow={(customer, index) => (
                  <TableRow key={customer.id} className="hover:bg-gray-50">
                    <TableCell className="px-4 py-3 text-sm">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {customer.CustomerContactDetails[0]?.CustomerName}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {customer.CustomerContactDetails[0]?.MobNumber}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {customer.CustomerName}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      <Button
                        // isLoading={loadingCustomerId === customer.Id}
                        onClick={() => handleCustomerSelect(customer)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-xs font-medium"
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
                headerClassName="bg-gray-100"
                rowClassName="border-b border-gray-200 last:border-0"
                emptyMessage="No customers found matching your search"
                pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                totalItems={filteredData.length}
              />
            </div>
          )}
        </div>
      ) : (
        <StepB
          selectedCustomer={selectedCustomer}
          onBack={onBack}
          user={user}
          setCustomerId={setCustomerId}
          location={locationById}
        />
      )}
      <AddNewCustomer
        newCustomer={newCustomer}
        onChange={customerHandleChange}
        isOpen={customerOpen}
        onClose={handleCloseCustomer}
        setNewCustomer={setNewCustomer}
        allCountries={allCountries?.country}
        countryIsd={countryIsd?.country}
        allCompanyLocationData={allCompanyLocationData}
        CustomerPoolID={CustomerPoolID}
        setOpenCustomer={setOpenCustomer}
        handleSave={handleSubmit}
        isNewCustomerLoading={isNewCustomerLoading}
        setErrors={setErrors}
        errors={errors}
        creatinfCustomerLoading={creatinfCustomerLoading}
      />
      <CustomerPage
        isOpen={openCustomer}
        onClose={() => {
          setOpenCustomer(false);
          setCustomerOpen(false);
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default AddOrder;

const AddNewCustomer = ({
  newCustomer,
  onChange,
  isOpen,
  onClose,
  allCountries,
  countryIsd,
  setNewCustomer,
  allCompanyLocationData,
  CustomerPoolID,
  setOpenCustomer,
  handleSave,
  isNewCustomerLoading,
  setErrors,
  errors,
  creatinfCustomerLoading,
}) => {
  const { data: allCustomers } = useGetAllCustomersQuery();

  const allCus = allCustomers?.data.data || [];
  const matchingCompanyIds = allCompanyLocationData?.data.data
    ?.filter((loc) => loc.CustomerPoolID === CustomerPoolID)
    .map((loc) => loc.CompanyId);
  countryIsd;

  const matchingCustomers = allCus.filter((customer) =>
    matchingCompanyIds?.includes(customer.CompanyID)
  );

  useEffect(() => {
    setNewCustomer((prev) => ({
      ...prev,
      mobileISD: countryIsd?.ISDCode,
    }));
  }, [countryIsd, setNewCustomer]);
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

  const [searchQuery, setSearchQuery] = useState("");

  const filteredMatchingCustomers = matchingCustomers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    const name = customer.CustomerName?.toLowerCase() || "";
    const mobile = customer.MobNumber?.toLowerCase() || "";
    return name.includes(query) || mobile.includes(query);
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-2">
        <Input
          label="Name *"
          name="name"
          onChange={onChange}
          value={newCustomer.name}
          error={errors.name}
        />

        <div className="flex gap-4 ">
          <div className="w-28">
            <Select
              label="Country Code"
              name="mobileISD"
              onChange={onChange}
              value={newCustomer.mobileISD}
              options={allCountries}
              optionLabel="ISDCode"
              optionValue="ISDCode"
            />
          </div>
          <div className="flex-grow">
            <Input
              label="Mobile No. *"
              name="mobileNo"
              onChange={onChange}
              value={newCustomer.mobileNo}
              error={errors.mobileNo}
            />
          </div>
          <div className="flex items-center">
            <Checkbox
              label="Mobile Alert"
              name="mobileAlert"
              checked={newCustomer.mobileAlert === 1}
              onChange={onChange}
              value={newCustomer.mobileAlert}
              error={errors.mobileAlert}
            />
          </div>
        </div>

        <Input
          label="Email"
          name="emailId"
          onChange={onChange}
          value={newCustomer.emailId || ""}
        />
        <div className="flex w-full gap-4">
          <Input
            label="Date of Birth"
            type="date"
            name="DOB"
            onChange={onChange}
            value={newCustomer.DOB || ""}
            className="flex-grow"
          />

          <Input
            label="Engraving"
            name="Engraving"
            onChange={onChange}
            value={newCustomer.Engraving || ""}
            className="flex-grow"
          />
        </div>
        {/* Existing Customer Checkbox */}
        <div>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="ExistingCustomer"
              checked={newCustomer.ExistingCustomer === 1}
              onChange={onChange}
              className="mr-2"
            />
            Assign to Existing Customer
          </label>
        </div>

        {/* Existing Customer Dropdown */}
        {newCustomer.ExistingCustomer === 1 && (
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Existing Customer
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Search by name or mobile number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && filteredMatchingCustomers.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md max-h-60 overflow-auto shadow-lg">
                {filteredMatchingCustomers.map((customer) => (
                  <li
                    key={customer.Id}
                    onClick={() => {
                      onChange({
                        target: {
                          name: "ExistingCustomerId",
                          value: customer.Id,
                        },
                      });
                      setSearchQuery(
                        `${customer.CustomerName} (${customer.MobNumber})`
                      );
                    }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    {customer.CustomerName} ({customer.MobNumber})
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {newCustomer.ExistingCustomer === 0 && (
          <button
            onClick={() => {
              setOpenCustomer(true);
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all"
          >
            <span className="text-sm font-medium">More details</span>
          </button>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={() => {
              if (validateCustomer()) {
                handleSave(newCustomer, null);
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

const CustomerPage = ({ isOpen, onClose, onSubmit }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-6xl"
      className="z-[60]"
    >
      <Customer isPop={true} onSubmit={onSubmit} />
    </Modal>
  );
};

const StepB = ({
  selectedCustomer,
  onBack,
  user,
  setCustomerId,

  location,
}) => {
  const { draftData } = useOrder();
  console.log("location", draftData);
  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const [orderReference, setOrderReference] = useState("");
  const [selectedSalesPerson, setSelectedSalesPerson] = useState(null);
  const { goToStep } = useOrder();
  const { data: salesPersons, isLoading: isSalesPersonsLoading } =
    useGetAllSalesPersonsQuery();
  const [createSalesOrder, { isLoading: isSalesCreating }] =
    useCreateSalesOrderMutation();

  const handleSaveSales = async () => {
    if (!selectedSalesPerson) {
      toast.error("Please select a sales person type");
      return;
    }

    if (draftData && draftData.Status === 0) {
      setCustomerId((prev) => ({
        ...prev,
        orderId: draftData?.Id,
      }));
      goToStep(4);
      return;
    }

    const payload = {
      CompanyId: location?.data.data.Id,
      CustomerId: selectedCustomer.Id,
      PatientID: selectedCustomer.CustomerContactDetails[0].Id,
      OrderReference: orderReference,
      SalesPersonID: parseInt(selectedSalesPerson),
    };
    console.log(payload);
    try {
      const response = await createSalesOrder({
        userId: user.Id,
        payload,
      }).unwrap();
      setCustomerId((prev) => ({
        ...prev,
        orderId: response?.data.data.Id,
      }));
      toast.success("Order created");
      goToStep(2);
    } catch (error) {
      toast.error("Please try agian after some time!");
    }
  };

  useEffect(() => {
    if (draftData) {
      setOrderReference(draftData?.OrderReference || null);
      setSelectedSalesPerson(draftData?.SalesPersonId || null);
    }
  }, [draftData, isSalesPersonsLoading]);

  const filteredData = salesPersons?.data.data
    ?.filter(
      (person) =>
        person.Type !== 1 &&
        person.IsActive === 1 &&
        person.SalesPersonLinks?.some((link) =>
          hasMultipleLocations.includes(link.Company?.Id)
        )
    )
    .map((person) => ({
      ...person,
      SalesPersonLinks: person.SalesPersonLinks.filter((link) =>
        hasMultipleLocations.includes(link.Company?.Id)
      ),
    }));
  console.log("selec", selectedCustomer);
  return (
    <div className="max-w-4xl p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-blue-600 mb-4">
        Step 1: Customer Details
      </h2>

      <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Customer Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Detail label="Customer Name" value={selectedCustomer.CustomerName} />
          <Detail
            label="Patient Name"
            value={selectedCustomer.CustomerContactDetails[0].CustomerName}
          />
          <Detail
            label="Mobile Number"
            value={`${selectedCustomer.MobileISDCode} ${selectedCustomer.MobNumber}`}
          />
          {selectedCustomer?.BillingMethod === 1 && (
            <Detail
              label="Billing Method"
              value={selectedCustomer.BillingMethod === 0 ? "Invoice" : "DC"}
            />
          )}
          {selectedCustomer?.TAXRegisteration === 1 && (
            <>
              <Detail label="GST Number" value={selectedCustomer.TAXNo} />
              <div>
                {selectedCustomer.BillAddress1 && (
                  <div className="">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">
                      {selectedCustomer.BillAddress1}
                      {selectedCustomer.BillAddress2 &&
                        `, ${selectedCustomer.BillAddress2}`}
                      {selectedCustomer.BillCity &&
                        `, ${selectedCustomer.BillCity}`}
                      {selectedCustomer.BillPin &&
                        ` - ${selectedCustomer.BillPin}`}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
          {selectedCustomer?.CreditBilling === 1 && (
            <Detail
              label="Credit Billing"
              value={selectedCustomer.CreditBilling === 0 ? "No" : "Yes"}
            />
          )}
        </div>
      </div>

      <h3 className="text-lg font-medium text-gray-800 mb-4">Order Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {isSalesPersonsLoading ? (
          <Loader />
        ) : (
          <Select
            label="Sales Person"
            value={selectedSalesPerson || null}
            onChange={(e) => setSelectedSalesPerson(e.target.value)}
            options={filteredData}
            optionLabel="PersonName"
            optionValue="Id"
            defaultOption="Select Sales person"
          />
        )}

        <div>
          <Input
            label="Order Reference"
            type="text"
            value={orderReference}
            onChange={(e) => setOrderReference(e.target.value)}
            placeholder="Enter order reference"
          />
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Back
        </button>

        <Button onClick={handleSaveSales} isLoading={isSalesCreating}>
          {!isSalesCreating ? "Next" : "Saving.."}
        </Button>
      </div>
    </div>
  );
};

// Reusable Detail Display Component
const Detail = ({ label, value }) => (
  <div className="flex items-center gap-3">
    <p className="text-sm text-gray-500">{label}</p>:
    <p className="font-medium">{value || "N/A"}</p>
  </div>
);
