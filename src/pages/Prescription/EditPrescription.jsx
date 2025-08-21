import NewPrescription from "../Order/StepThree/OptcalLens/NewPerscription";
import { useOrder } from "../../features/OrderContext";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiRefreshCw,
  FiUserPlus,
  FiArrowLeft,
  FiFilter,
} from "react-icons/fi";
import { Table, TableCell, TableRow } from "../../components/Table";
import Loader from "../../components/ui/Loader";
import Select from "../../components/Form/Select";
import {
  useGetAllCompanyLocationsQuery,
  useGetAllCustomersQuery,
  useGetCompanyIdQuery,
  useGetCountriesQuery,
  useGetIsdQuery,
} from "../../api/customerApi";
import Input from "../../components/Form/Input";
import Modal from "../../components/ui/Modal";
import { useSelector } from "react-redux";
import Customer from "../../pages/customers/Customer";
import toast from "react-hot-toast";
import {
  useCreateNewCustomerMutation,
  useGetAllVisualAcuityQuery,
  useGetCustomerContactDetailsQuery,
} from "../../api/orderApi";
import Button from "../../components/ui/Button";
import { useGetLocationByIdQuery } from "../../api/roleManagementApi";
import { useGetAllSalesPersonsQuery } from "../../api/salesPersonApi";
import Checkbox from "../../components/Form/Checkbox";

const EditPrescription = () => {
  const navigate = useNavigate();
  const { setCustomerId, draftData, goToStep, customerId } = useOrder();
  const { hasMultipleLocations, user } = useSelector((state) => state.auth);
  const [input, setInput] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [openCustomer, setOpenCustomer] = useState(false);
  const [openPrescription, setOpenPrescription] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [creatinfCustomerLoading, setCreatingCustomerLoading] = useState(false);
  const [location, setLocation] = useState(null);

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

  const { data: locationById } = useGetLocationByIdQuery(
    { id: location },
    { skip: !location }
  );
  const { data: salesPersons } = useGetAllSalesPersonsQuery();

  const countrId = locationById?.data?.data.BillingCountryCode;
  const companyId = locationById?.data?.data.Id;

  const { data: countryIsd } = useGetIsdQuery(
    { id: countrId },
    { skip: !countrId }
  );

  const { data: companySettings } = useGetCompanyIdQuery(
    { id: companyId },
    { skip: !companyId }
  );
  const CustomerPoolID = companySettings?.data?.data.CustomerPoolID;

  // Location handling
  useEffect(() => {
    const locations = Array.isArray(hasMultipleLocations)
      ? hasMultipleLocations
      : hasMultipleLocations !== undefined && hasMultipleLocations !== null
      ? [hasMultipleLocations]
      : [];

    if (locations.length === 1) {
      setLocation(locations[0]);
    }
  }, [hasMultipleLocations]);

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
  const { data: acuity } = useGetAllVisualAcuityQuery();

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

  const handleCustomerSelect = (customerWithContact) => {
    const patient = customerWithContact.CustomerContactDetails?.[0];
    console.log("patient", patient);

    if (!patient) {
      toast.error("No patient (contact) found for selected customer.");
      return;
    }

    setCustomerOpen(false);

    setCustomerId((prev) => ({
      ...prev,
      patientName: customerWithContact.CustomerContactDetails?.[0].CustomerName,
      patientId: customerWithContact.CustomerContactDetails?.[0].Id,
      locationId: parseInt(location),
      customerId: customerWithContact.Id,
      mobileNo: patient.MobNumber,
    }));
    setCreatingCustomerLoading(false);
    setOpenPrescription(true);
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

  return (
    <>
      {!openPrescription ? (
        <div className="max-w-8xl p-6 bg-white rounded-lg shadow-md pb-6">
          <div className="mb-6">
            <span className="text-lg font-semibold text-neutral-700">
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
              <button className="cursor-pointer absolute right-2 bg-neutral-300 text-neutral-700 px-4 py-1.5 rounded-md text-sm font-medium transition-colors">
                Search
              </button>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-neutral-700 hover:bg-gray-50 text-sm"
              >
                <FiArrowLeft />
                <span>Back</span>
              </button>
              <button
                onClick={handleRefresh}
                className=" flex items-center gap-2 px-3 py-2 bg-neutral-300 text-neutral-700 rounded-lg text-sm"
              >
                <FiRefreshCw />
                <span className="text-neutral-700">Refresh</span>
              </button>
              <button
                onClick={handleOpenNewCustomer}
                className="flex items-center gap-2 px-3 py-2 bg-neutral-300 text-neutral-700 rounded-lg text-sm"
              >
                <FiUserPlus  />
                <span className="text-neutral-700">New Customer</span>
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
                renderHeader={(col) => {
                  if (col === "Patient name")
                    return renderFilterInput("name", col);
                  if (col === "Mobile no")
                    return renderFilterInput("mobileNo", col);
                  if (col === "Customer name")
                    return renderFilterInput("customerName", col);
                  return (
                    <span className="font-medium text-gray-700">{col}</span>
                  );
                }}
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
        <div className="max-w-6xl p-6 bg-white rounded-lg shadow-md pb-6">
          <NewPrescription
            visualAcuityOptions={acuity?.data.data}
            customerId={customerId}
            onOpen={openPrescription}
            onClose={() => navigate("/prescription")}
            salesPersons={salesPersons?.data.data}
            lensData={[]}
            isPrescription={true}
          />
        </div>
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

// Reusable Detail Display Component
const Detail = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium">{value || "N/A"}</p>
  </div>
);

export default EditPrescription;
