import React, { useRef, useState, useEffect } from "react";
import { useGetAllLocationsQuery } from "../../api/roleManagementApi";
import {
  useGetAllPoolsQuery,
  useGetCompanySettingsQuery,
  useUpdateSettingsMutation,
} from "../../api/companySettingsApi";
import {
  Autocomplete,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Paper,
} from "@mui/material";
import {
  FiMapPin,
  FiSettings,
  FiDatabase,
  FiChevronDown,
  FiHome,
  FiBriefcase,
  FiFileText,
  FiList,
  FiCreditCard,
  FiMessageSquare,
  FiTool,
  FiBox,
  FiPackage, // Replaces FiBuilding
} from "react-icons/fi";
import Loader from "../../components/ui/Loader";
import Radio from "../../components/Form/Radio";
import Button from "../../components/ui/Button";
import { useGetCountriesQuery, useGetStatesQuery } from "../../api/customerApi";

const API_BASE = import.meta.env.VITE_LOCAL;

const CompanySettings = () => {
  const [expandedSection, setExpandedSection] = useState("location"); // first accordion open
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [qrCode, setQrCode] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const qrInputRef = useRef(null);

  const { data: allLocations, isLoading: isLocationsLoading } =
    useGetAllLocationsQuery();
  const { data: allPool, isLoading: isPoolsLoading } = useGetAllPoolsQuery();
  const { data: companySettingData } = useGetCompanySettingsQuery(
    { id: selectedLocation },
    { skip: !selectedLocation }
  );
  const { data: states } = useGetStatesQuery();
  const { data: countries } = useGetCountriesQuery();
  const [updateSettings, { isLoading: isUpdating }] =
    useUpdateSettingsMutation();

  const [formData, setFormData] = useState({
    customerPool: null,
    vendorPool: null,
    stockPool: null,
    companyName: "",
    gstRegister: 0,
    gstNo: "",
    panNo: "",
    dlNo: "",
    msmeNo: "",
    billingAddress1: "",
    city: "",
    state: null,
    country: null,
    companyEmail: "",
    contactNo: "",
    whatsappNo: "",
    enableEInvoice: 0,
    enableGstVerification: 0,
    gstSearchInstanceId: "",
    orderPrefix: "",
    grnPrefix: "",
    grnDcPrefix: "",
    invoicePrefix: "",
    invoiceDcPrefix: "",
    salesReturnPrefix: "",
    purchaseReturnPrefix: "",
    stockTransferOutPrefix: "",
    stockTransferInPrefix: "",
    otherDocumentPrefix: "",
    journalPrefix: "",
    accountNo: "",
    bankName: "",
    branchName: "",
    upiId: "",
    ifscCode: "",
    whatsappInstanceId: "",
    whatsappClientId: "",
    whatsappModuleAlert: "",
    emailModuleAlert: "",
    emailSmtp: "",
    opticalLensFittingLabel: 0, // 1 for Delivery, 0 for Fitting? Wait, radio values are "1" "0" but labels Delivery/Fitting
    opticalLensFittingHsn: "",
    opticalLensFittingGst: "",
    creditNoteReturnPeriod: "",
    fittingChargesPurchase: 0,
    fittingChargesSales: 0,
    creditNoteTc: "",
    debitNoteTc: "",
    invoiceTc: "",
    frameLabel: null,
    frameColumn1: "",
    frameColumn2: "",
    frameColumn3: "",
    showBuyingPriceDc: 0,
    invoiceDcPdf: 0, // 0 show MRP, 1 selling
    editInvoicePrice: 0,
    salesReturnAgainstInvoiceOnly: 0,
    accessoryLabel: null,
    accessoryColumn1: "",
    accessoryColumn2: "",
    accessoryColumn3: "",
  });
  useEffect(() => {
    if (companySettingData?.data?.data) {
      const data = companySettingData?.data.data;
      setFormData({
        customerPool: data?.CustomerPoolID ?? null,
        vendorPool: data?.VendorPoolID ?? null,
        stockPool: data?.StockPoolID ?? null,
        companyName: data.Company?.CompanyName,
        gstRegister: data.Company?.TaxRegistration,
        gstNo: data.Company?.TaxNumber,
        panNo: data.Company?.PanNumber,
        dlNo: data.Company?.DlNo,
        msmeNo: data.Company?.MSMENo,
        billingAddress1: data.Company?.BillingAddress1,
        city: data.Company?.BillingCity,
        state: data?.Company?.BillingStateCode,
        country: data?.Company?.BillingCountryCode,
        companyEmail: data.Company?.Email,
        contactNo: data.Company?.ContactNumber,
        whatsappNo: data.Company?.WhatsappNo,
        enableEInvoice: data.EInvoiceEnable,
        enableGstVerification: data.GSTSerachEnable,
        gstSearchInstanceId: data.GSTSearchInstanceID,
        orderPrefix: data.OrderPrefix,
        grnPrefix: data.GRNInvoicePrefix,
        grnDcPrefix: data.GRNDCPrefix,
        invoicePrefix: "",
        invoiceDcPrefix: "",
        salesReturnPrefix: data.SalesReturnPrefix,
        purchaseReturnPrefix: data.PurchaseReturnPrefix,
        stockTransferOutPrefix: data.StockOutPrefix,
        stockTransferInPrefix: data.StockInPrefix,
        otherDocumentPrefix: data.OtherDocPrefix,
        journalPrefix: data.JournalPrefix,
        accountNo: data.AccountNumber,
        bankName: data.BankName,
        branchName: data.BankBranch,
        upiId: data.UpiId,
        ifscCode: data.IfscCode,
        whatsappInstanceId: data.WAInstanceID,
        whatsappClientId: data.WAClientID,
        whatsappModuleAlert: 0,
        emailModuleAlert: 0,
        emailSmtp: "",
        opticalLensFittingLabel: data.OLFittingLabel, // 1 for Delivery, 0 for Fitting? Wait, radio values are "1" "0" but labels Delivery/Fitting
        opticalLensFittingHsn: data.OLFittingHSN,
        opticalLensFittingGst: data.OLFittingGST,
        creditNoteReturnPeriod: data.CNReturnDays,
        fittingChargesPurchase: data.FittingChargesPurchase,
        fittingChargesSales: data.FittingChargesSales,
        creditNoteTc: data.CreditNoteTc,
        debitNoteTc: data.DebitNoteTc,
        invoiceTc: data.InvoiceTc,
        frameLabel: null,
        frameColumn1: "",
        frameColumn2: "",
        frameColumn3: "",
        showBuyingPriceDc: 0,
        invoiceDcPdf: 0, // 0 show MRP, 1 selling
        editInvoicePrice: 0,
        salesReturnAgainstInvoiceOnly: 0,
        accessoryLabel: null,
        accessoryColumn1: "",
        accessoryColumn2: "",
        accessoryColumn3: "",
      });
      setLogoPreview(
        companySettingData?.data?.data?.Company?.Logo
          ? `${API_BASE}${companySettingData.data.data.Company.Logo}`
          : null
      );
      setQrPreview(
        companySettingData?.data?.data?.QrCode
          ? `${API_BASE}${companySettingData.data.data.QrCode}`
          : null
      );
    }
  }, [companySettingData]);
  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleRadioChange = (field, value) => {
    setFormData({ ...formData, [field]: parseInt(value) });
  };

  const handleAutoChange = (field) => (_, newValue) => {
    setFormData({ ...formData, [field]: newValue?.Id });
  };

  const handleAccordionChange = (sectionId) => (event, isExpanded) => {
    setExpandedSection(isExpanded ? sectionId : null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match("image.*")) {
        alert("Please select an image file (JPEG, PNG, etc.)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB");
        return;
      }
      processFile(file);
    }
  };
  const handlePrefixChange = (field) => (e) => {
    const value = e.target.value.replace(/_/g, ""); // Remove underscores
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const processFile = (file) => {
    setLogo(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleQrFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match("image.*")) {
        alert("Please select an image file (JPEG, PNG, etc.)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB");
        return;
      }
      processQrFile(file);
    }
  };

  const processQrFile = (file) => {
    setQrCode(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setQrPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = () => {
    setQrCode(null);
    setQrPreview(null);
    if (qrInputRef.current) {
      qrInputRef.current.value = "";
    }
  };

  const handleQrUploadClick = () => {
    qrInputRef.current?.click();
  };

  const ExpandIcon = () => (
    <FiChevronDown
      className={`transition-transform duration-300 ${
        expandedSection ? "rotate-180" : ""
      }`}
    />
  );

  const handleSubmit = async () => {
    const payload = {
      CompanyId: parseInt(selectedLocation),
      CustomerPoolID: formData.customerPool,
      VendorPoolID: formData.vendorPool,
      StockPoolID: formData.stockPool,
      Company: {
        CompanyName: formData.companyName,
        TaxRegistration: formData.gstRegister,
        TaxNumber: formData.gstNo,
        PanNumber: formData.panNo,
        DlNo: formData.dlNo,
        MSMENo: formData.msmeNo,
        BillingAddress1: formData.billingAddress1,
        BillingCity: formData.city,
        Email: formData.companyEmail,
        ContactNumber: formData.contactNo,
        WhatsappNo: formData.whatsappNo,
        StateId: formData.state,
        CountryId: formData.country,
      },

      EInvoiceEnable: formData.enableEInvoice,
      GSTSerachEnable: formData.enableGstVerification, // Typo in original: GSTSearchEnable
      GSTSearchInstanceID: formData.gstSearchInstanceId,
      OrderPrefix: formData.orderPrefix,
      GRNInvoicePrefix: formData.grnPrefix,
      GRNDCPrefix: formData.grnDcPrefix,
      InvoicePrefix: formData.invoicePrefix, // Was empty in initial setFormData
      InvoiceDCPrefix: formData.invoiceDcPrefix, // Add if needed
      SalesReturnPrefix: formData.salesReturnPrefix,
      PurchaseReturnPrefix: formData.purchaseReturnPrefix,
      StockOutPrefix: formData.stockTransferOutPrefix,
      StockInPrefix: formData.stockTransferInPrefix,
      OtherDocPrefix: formData.otherDocumentPrefix,
      JournalPrefix: formData.journalPrefix,
      AccountNumber: formData.accountNo,
      BankName: formData.bankName,
      BankBranch: formData.branchName,
      UpiId: formData.upiId,
      IfscCode: formData.ifscCode,
      WAInstanceID: formData.whatsappInstanceId,
      WAClientID: formData.whatsappClientId,
      WAModuleAlert: formData.whatsappModuleAlert, // Assuming type
      EmailModuleAlert: formData.emailModuleAlert,
      EmailSmtp: formData.emailSmtp,
      OLFittingLabel: formData.opticalLensFittingLabel,
      OLFittingHSN: formData.opticalLensFittingHsn,
      OLFittingGST: formData.opticalLensFittingGst,
      CNReturnDays: formData.creditNoteReturnPeriod,
      FittingChargesPurchase: formData.fittingChargesPurchase,
      FittingChargesSales: formData.fittingChargesSales,
      CreditNoteTc: formData.creditNoteTc,
      DebitNoteTc: formData.debitNoteTc,
      InvoiceTc: formData.invoiceTc,
      FrameLabelId: formData.frameLabel, // Assuming it's an ID
      FrameColumn1: formData.frameColumn1,
      FrameColumn2: formData.frameColumn2,
      FrameColumn3: formData.frameColumn3,
      ShowBuyingPriceDc: formData.showBuyingPriceDc,
      InvoiceDcPdf: formData.invoiceDcPdf, // 0=MRP, 1=selling
      EditInvoicePrice: formData.editInvoicePrice,
      SalesReturnAgainstInvoiceOnly: formData.salesReturnAgainstInvoiceOnly,
      AccessoryLabelId: formData.accessoryLabel, // Assuming ID
      AccessoryColumn1: formData.accessoryColumn1,
      AccessoryColumn2: formData.accessoryColumn2,
      AccessoryColumn3: formData.accessoryColumn3,
    };

    // If logo/QR need uploading (assuming multipart form)
    const formDataPayload = new FormData();
    formDataPayload.append("settings", JSON.stringify(payload));
    if (logo) formDataPayload.append("logo", logo);
    if (qrCode) formDataPayload.append("qrCode", qrCode);

    try {
      //    api call
      await updateSettings({ payload: formDataPayload }).unwrap();
    } catch (error) {
      //   alert("Update failed");
      console.log(error);
    }
  };

  if (isLocationsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader color="black" width="w-10" height="h-10" />
      </div>
    );
  }

  const accordionSections = [
    {
      id: "location",
      title: "Location Settings",
      icon: <FiMapPin className="text-blue-600 text-xl" />,
      content: (
        <Autocomplete
          options={allLocations?.data || []}
          getOptionLabel={(option) => option.LocationName || ""}
          value={
            allLocations?.data?.find((loc) => loc.Id === selectedLocation) ||
            null
          }
          onChange={(_, newValue) => setSelectedLocation(newValue?.Id)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Location"
              placeholder="Select Location"
              size="small"
              variant="outlined"
            />
          )}
          loading={isLocationsLoading}
          fullWidth
        />
      ),
    },
    {
      id: "standard",
      title: "Standard Settings",
      icon: <FiSettings className="text-green-600 text-xl" />,
      content: (
        <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Autocomplete
            options={allPool?.data?.customer || []}
            getOptionLabel={(option) => option.PoolName || ""}
            value={
              allPool?.data?.customer?.find(
                (pool) => pool.Id === formData.customerPool
              ) || null
            }
            onChange={(_, newValue) =>
              setFormData({ ...formData, customerPool: newValue?.Id || null })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Customer Pool"
                placeholder="Select Customer Pool"
                size="small"
                variant="outlined"
              />
            )}
            loading={isPoolsLoading}
            fullWidth
          />
          <Autocomplete
            options={allPool?.data?.vendor || []}
            getOptionLabel={(option) => option.PoolName || ""}
            value={
              allPool?.data?.vendor?.find(
                (pool) => pool.Id === formData.vendorPool
              ) || null
            }
            onChange={(_, newValue) =>
              setFormData({ ...formData, vendorPool: newValue?.Id || null })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Vendor Pool"
                placeholder="Select Vendor Pool"
                size="small"
                variant="outlined"
              />
            )}
            loading={isPoolsLoading}
            fullWidth
          />
          <Autocomplete
            options={allPool?.data?.stock || []}
            getOptionLabel={(option) => option.PoolName || ""}
            value={
              allPool?.data?.vendor?.find(
                (pool) => pool.Id === formData.stockPool
              ) || null
            }
            onChange={(_, newValue) =>
              setFormData({ ...formData, stockPool: newValue?.Id || null })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Stock Pool"
                placeholder="Select Stock Pool"
                size="small"
                variant="outlined"
              />
            )}
            loading={isPoolsLoading}
            fullWidth
          />
        </Box>
      ),
    },
    {
      id: "company",
      title: "Company Details",
      icon: <FiBriefcase className="text-blue-600 text-xl" />,
      content: (
        <Box className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
            <div>
              <TextField
                label="Company Name"
                placeholder="Enter Company Name"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.companyName}
                onChange={handleChange("companyName")}
              />
            </div>
            <div className="flex items-center gap-5 flex-1/2">
              <label>GST Register </label>
              <Radio
                name="gstRegister"
                value="1"
                checked={formData.gstRegister === 1}
                onChange={() => handleRadioChange("gstRegister", "1")}
                label="Yes"
              />
              <Radio
                name="gstRegister"
                value="0"
                checked={formData.gstRegister === 0}
                onChange={() => handleRadioChange("gstRegister", "0")}
                label="No"
              />
            </div>
            <div>
              <TextField
                label="GST No."
                placeholder="Enter GST No"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.gstNo}
                onChange={handleChange("gstNo")}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="flex gap-3 items-center">
              <TextField
                label="PAN No."
                placeholder="Enter PAN No"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.panNo}
                onChange={handleChange("panNo")}
              />
            </div>
            <div>
              <TextField
                label="DL No."
                placeholder="Enter DL No"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.dlNo}
                onChange={handleChange("dlNo")}
              />
            </div>
            <div>
              <TextField
                label="MSME No."
                placeholder="Enter MSME No"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.msmeNo}
                onChange={handleChange("msmeNo")}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <TextField
                label="Billing Address1"
                placeholder="Enter Address 1"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.billingAddress1}
                onChange={handleChange("billingAddress1")}
              />
            </div>
            <div>
              <TextField
                label="City"
                placeholder="Enter City"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.city}
                onChange={handleChange("city")}
              />
            </div>
            <div>
              <Autocomplete
                options={states?.country || []}
                getOptionLabel={(option) => option.StateName || ""}
                value={
                  states?.country?.find((pool) => pool.Id === formData.state) ||
                  null
                }
                onChange={(_, newValue) =>
                  setFormData({ ...formData, state: newValue?.Id || null })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="State"
                    placeholder="Select State"
                    size="small"
                    variant="outlined"
                  />
                )}
                fullWidth
              />
            </div>
            <div>
              <Autocomplete
                options={countries?.country || []}
                getOptionLabel={(option) => option.CountryName || ""}
                value={
                  countries?.country?.find(
                    (pool) => pool.Id == formData.country
                  ) || null
                }
                onChange={(_, newValue) =>
                  setFormData({ ...formData, country: newValue?.Id || null })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Country"
                    placeholder="Select Country"
                    size="small"
                    variant="outlined"
                  />
                )}
                fullWidth
              />
            </div>
            <div>
              <TextField
                label="Company Email Address"
                placeholder="Enter Email Address"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.companyEmail}
                onChange={handleChange("companyEmail")}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="flex gap-5 items-start">
              <div className="mb-6 flex flex-col items-center">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Company Logo Preview"
                      className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <span className="text-gray-400 text-sm">No Logo</span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  onClick={handleUploadClick}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Upload Logo
                </button>

                <div className="text-center text-sm text-gray-500">
                  Supports: JPG, PNG, SVG (Max 5MB)
                </div>
              </div>
            </div>
            <div>
              <TextField
                label="Contact No"
                placeholder="Enter Contact No"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.contactNo}
                onChange={handleChange("contactNo")}
              />
            </div>
            <div>
              <TextField
                label="Whatsapp No."
                placeholder="Enter Whatsapp No"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.whatsappNo}
                onChange={handleChange("whatsappNo")}
              />
            </div>
          </div>
        </Box>
      ),
    },
    {
      id: "invoice",
      title: "E-Invoice & GST Settings",
      icon: <FiFileText className="text-purple-600 text-xl" />,
      content: (
        <Box className="flex items-center gap-4">
          <div className="flex items-center gap-5">
            <label> Enable E-Invoice </label>
            <Radio
              name="enableEInvoice"
              value="1"
              checked={formData.enableEInvoice === 1}
              onChange={() => handleRadioChange("enableEInvoice", "1")}
              label="Yes"
            />
            <Radio
              name="enableEInvoice"
              value="0"
              checked={formData.enableEInvoice === 0}
              onChange={() => handleRadioChange("enableEInvoice", "0")}
              label="No"
            />
          </div>
          <div className="flex items-center gap-5">
            <label>Enable GST Verification </label>
            <Radio
              name="enableGstVerification"
              value="1"
              checked={formData.enableGstVerification === 1}
              onChange={() => handleRadioChange("enableGstVerification", "1")}
              label="Yes"
            />
            <Radio
              name="enableGstVerification"
              value="0"
              checked={formData.enableGstVerification === 0}
              onChange={() => handleRadioChange("enableGstVerification", "0")}
              label="No"
            />
          </div>
          <div className="flex-grow flex">
            <TextField
              label="GST Search Instance ID"
              placeholder="Enter GST Search Instance ID"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.gstSearchInstanceId}
              onChange={handleChange("gstSearchInstanceId")}
            />
          </div>
        </Box>
      ),
    },
    {
      id: "prefix",
      title: "Prefix Settings",
      icon: <FiList className="text-yellow-600 text-xl" />,
      content: (
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="">
            <TextField
              label="Order Prefix"
              placeholder="Enter Order Prefix"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.orderPrefix}
              //   onChange={handleChange("orderPrefix")}
              onChange={handlePrefixChange("orderPrefix")}
            />
          </div>
          <div className="">
            <TextField
              label="GRN Prefix"
              placeholder="Enter GRN Prefix"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.grnPrefix}
              //   onChange={handleChange("grnPrefix")}
              onChange={handlePrefixChange("grnPrefix")}
            />
          </div>
          <div className="">
            <TextField
              label="GRN_DC Prefix"
              placeholder="Enter GRN_DC Prefix"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.grnDcPrefix}
              //   onChange={handleChange("grnDcPrefix")}
              onChange={handlePrefixChange("grnDcPrefix")}
            />
          </div>
          <div className="">
            <TextField
              label="Invoice Prefix"
              placeholder="Enter Invoice Prefix"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.invoicePrefix}
              //   onChange={handleChange("invoicePrefix")}
              onChange={handlePrefixChange("invoicePrefix")}
            />
          </div>
          <div className="">
            <TextField
              label="Invoice_DC Prefix"
              placeholder="Enter Invoice_DC Prefix"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.invoiceDcPrefix}
              //   onChange={handleChange("invoiceDcPrefix")}
              onChange={handlePrefixChange("invoiceDcPrefix")}
            />
          </div>
          <div className="">
            <TextField
              label="Sales Return Prefix"
              placeholder="Enter Sales Return Prefix"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.salesReturnPrefix}
              //   onChange={handleChange("salesReturnPrefix")}
              onChange={handlePrefixChange("salesReturnPrefix")}
            />
          </div>
          <div className="">
            <TextField
              label="Purchase Return Prefix"
              placeholder="Enter Purchase Return Prefix"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.purchaseReturnPrefix}
              //   onChange={handleChange("purchaseReturnPrefix")}
              onChange={handlePrefixChange("purchaseReturnPrefix")}
            />
          </div>
          <div className="">
            <TextField
              label="Stock Transfer Out Prefix"
              placeholder="Enter Stock Transfer Out Prefix"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.stockTransferOutPrefix}
              //   onChange={handleChange("stockTransferOutPrefix")}
              onChange={handlePrefixChange("stockTransferOutPrefix")}
            />
          </div>
          <div className="">
            <TextField
              label="Stock Transfer In Prefix"
              placeholder="Enter Stock Transfer In Prefix"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.stockTransferInPrefix}
              //   onChange={handleChange("stockTransferInPrefix")}
              onChange={handlePrefixChange("stockTransferInPrefix")}
            />
          </div>
          <div className="">
            <TextField
              label="Other Document Prefix"
              placeholder="Enter Other Document Prefix"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.otherDocumentPrefix}
              //   onChange={handleChange("otherDocumentPrefix")}
              onChange={handlePrefixChange("otherDocumentPrefix")}
            />
          </div>
          <div className="">
            <TextField
              label="Journal Prefix"
              placeholder="Enter Journal Prefix"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.journalPrefix}
              //   onChange={handleChange("journalPrefix")}
              onChange={handlePrefixChange("journalPrefix")}
            />
          </div>
        </Box>
      ),
    },
    {
      id: "bank",
      title: "Company Bank Settings",
      icon: <FiCreditCard className="text-green-600 text-xl" />,
      content: (
        <Box className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="">
            <TextField
              label="Account No"
              placeholder="Enter Account No"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.accountNo}
              onChange={handleChange("accountNo")}
            />
          </div>
          <div className="">
            <TextField
              label="Bank Name"
              placeholder="Enter Bank Name"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.bankName}
              onChange={handleChange("bankName")}
            />
          </div>
          <div className="">
            <TextField
              label="Branch Name"
              placeholder="Enter Branch Name"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.branchName}
              onChange={handleChange("branchName")}
            />
          </div>
          <div className="">
            <TextField
              label="UPI Id"
              placeholder="Enter UPI Id"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.upiId}
              onChange={handleChange("upiId")}
            />
          </div>
          {/* <div className="">
            <TextField
              label="Bank Name"
              placeholder="Enter Bank Name"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.bankName} // duplicate, perhaps bankName2
              onChange={handleChange("bankName")}
            />
          </div> */}
          <div className="">
            <TextField
              label="IFSC Code"
              placeholder="Enter IFSC Code"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.ifscCode}
              onChange={handleChange("ifscCode")}
            />
          </div>
          <div className="flex gap-5 items-center">
            <div className="mb-6 flex flex-col items-center">
              {qrPreview ? (
                <div className="relative">
                  <img
                    src={qrPreview}
                    alt="Company QR Preview"
                    className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg"
                  />
                  <button
                    onClick={handleRemoveQr}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 text-center">
                  <span className="text-gray-400 text-sm">
                    No Company QR Code
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <input
                type="file"
                ref={qrInputRef}
                onChange={handleQrFileChange}
                accept="image/*"
                className="hidden"
              />

              <button
                onClick={handleQrUploadClick}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Upload QR
              </button>

              <div className="text-center text-sm text-gray-500">
                Supports: JPG, PNG, SVG (Max 5MB)
              </div>
            </div>
          </div>
        </Box>
      ),
    },
    {
      id: "whatsapp",
      title: "WhatsApp and Email Settings",
      icon: <FiMessageSquare className="text-teal-600 text-xl" />,
      content: (
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="">
            <TextField
              label="Whatsapp Instance ID"
              placeholder="Enter Whatsapp Instance ID"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.whatsappInstanceId}
              onChange={handleChange("whatsappInstanceId")}
            />
          </div>
          <div className="">
            <TextField
              label="Whatsapp Client ID"
              placeholder="Enter Whatsapp Client ID"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.whatsappClientId}
              onChange={handleChange("whatsappClientId")}
            />
          </div>
          <div className="">
            <TextField
              label="Whatsapp Module Alert"
              placeholder="Enter Whatsapp Module Alert"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.whatsappModuleAlert}
              onChange={handleChange("whatsappModuleAlert")}
            />
          </div>
          <div className="">
            <TextField
              label="Email Module Alert"
              placeholder="Enter Email Module Alert"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.emailModuleAlert}
              onChange={handleChange("emailModuleAlert")}
            />
          </div>
          <div className="">
            <TextField
              label="Email SMTP"
              placeholder="Enter SMTP"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.emailSmtp}
              onChange={handleChange("emailSmtp")}
            />
          </div>
        </Box>
      ),
    },
    {
      id: "otherSettings",
      title: "Other Settings",
      icon: <FiTool className="text-orange-600 text-xl" />,
      content: (
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-5">
            <label>Optical Lens Fitting Label</label>
            <Radio
              name="opticalLensFittingLabel"
              value="1"
              checked={formData.opticalLensFittingLabel === 1}
              onChange={() => handleRadioChange("opticalLensFittingLabel", "1")}
              label="Delivery Charges"
            />
            <Radio
              name="opticalLensFittingLabel"
              value="0"
              checked={formData.opticalLensFittingLabel === 0}
              onChange={() => handleRadioChange("opticalLensFittingLabel", "0")}
              label="Fitting Charges"
            />
          </div>
          <div className="">
            <TextField
              label="Optical Lens Fitting HSN"
              placeholder="Enter Optical Lens Fitting HSN"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.opticalLensFittingHsn}
              onChange={handleChange("opticalLensFittingHsn")}
            />
          </div>
          <div className="">
            <TextField
              label="Optical Lens Fitting GST"
              placeholder="Enter Optical Lens Fitting GST"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.opticalLensFittingGst}
              onChange={handleChange("opticalLensFittingGst")}
            />
          </div>
          <div className="">
            <TextField
              label="Credit Note Return Period(in days)"
              placeholder="Enter Credit Note Return Period"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.creditNoteReturnPeriod}
              onChange={handleChange("creditNoteReturnPeriod")}
            />
          </div>
          <div className="flex items-center gap-5 flex-1/2">
            <label>Fitting Charges Purchase</label>
            <Radio
              name="fittingChargesPurchase"
              value="1"
              checked={formData.fittingChargesPurchase === 1}
              onChange={() => handleRadioChange("fittingChargesPurchase", "1")}
              label="Yes"
            />
            <Radio
              name="fittingChargesPurchase"
              value="0"
              checked={formData.fittingChargesPurchase === 0}
              onChange={() => handleRadioChange("fittingChargesPurchase", "0")}
              label="No"
            />
          </div>
          <div className="flex items-center gap-5 flex-1/2">
            <label>Fitting Charges Sales</label>
            <Radio
              name="fittingChargesSales"
              value="1"
              checked={formData.fittingChargesSales === 1}
              onChange={() => handleRadioChange("fittingChargesSales", "1")}
              label="Yes"
            />
            <Radio
              name="fittingChargesSales"
              value="0"
              checked={formData.fittingChargesSales === 0}
              onChange={() => handleRadioChange("fittingChargesSales", "0")}
              label="No"
            />
          </div>
          <div className="col-span-3">
            <TextField
              label="Credit Note TC"
              placeholder="Enter Credit Note TC"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.creditNoteTc}
              onChange={handleChange("creditNoteTc")}
            />
          </div>
          <div className="col-span-3">
            <TextField
              label="Debit Note TC"
              placeholder="Enter Debit Note TC"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.debitNoteTc}
              onChange={handleChange("debitNoteTc")}
            />
          </div>
          <div className="col-span-3">
            <TextField
              label="Invoice TC"
              placeholder="Enter Invoice TC"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.invoiceTc}
              onChange={handleChange("invoiceTc")}
            />
          </div>
        </Box>
      ),
    },
    {
      id: "bf",
      title: "Barcode Label (Frame)",
      icon: <FiBox className="text-pink-600 text-xl" />,
      content: (
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-3">
            <Autocomplete
              options={allLocations?.data || []} // perhaps change options to label templates if available
              getOptionLabel={(option) => option.LocationName || ""}
              value={formData.frameLabel}
              onChange={handleAutoChange("frameLabel")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Label"
                  placeholder="Select Label"
                  size="small"
                  variant="outlined"
                />
              )}
              loading={isLocationsLoading}
              fullWidth
            />
          </div>
          <div className="">
            <TextField
              label="Column 1"
              placeholder="Enter Column 1"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.frameColumn1}
              onChange={handleChange("frameColumn1")}
            />
          </div>
          <div className="">
            <TextField
              label="Column 2"
              placeholder="Enter Column 2"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.frameColumn2}
              onChange={handleChange("frameColumn2")}
            />
          </div>
          <div className="">
            <TextField
              label="Column 3"
              placeholder="Enter Column 3"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.frameColumn3}
              onChange={handleChange("frameColumn3")}
            />
          </div>
          <div className="flex items-center gap-5">
            <label>Show Buying Price for DC</label>
            <Radio
              name="showBuyingPriceDc"
              value="1"
              checked={formData.showBuyingPriceDc === 1}
              onChange={() => handleRadioChange("showBuyingPriceDc", "1")}
              label="Yes"
            />
            <Radio
              name="showBuyingPriceDc"
              value="0"
              checked={formData.showBuyingPriceDc === 0}
              onChange={() => handleRadioChange("showBuyingPriceDc", "0")}
              label="No"
            />
          </div>
          <div className="flex items-center gap-5">
            <label>Invoice DC PDF</label>
            <Radio
              name="invoiceDcPdf"
              value="1"
              checked={formData.invoiceDcPdf === 1}
              onChange={() => handleRadioChange("invoiceDcPdf", "1")}
              label="Show Selling Price"
            />
            <Radio
              name="invoiceDcPdf"
              value="0"
              checked={formData.invoiceDcPdf === 0}
              onChange={() => handleRadioChange("invoiceDcPdf", "0")}
              label="Show MRP"
            />
          </div>
          <div className="flex items-center gap-5">
            <label>Edit Invoice Price</label>
            <Radio
              name="editInvoicePrice"
              value="1"
              checked={formData.editInvoicePrice === 1}
              onChange={() => handleRadioChange("editInvoicePrice", "1")}
              label="Yes"
            />
            <Radio
              name="editInvoicePrice"
              value="0"
              checked={formData.editInvoicePrice === 0}
              onChange={() => handleRadioChange("editInvoicePrice", "0")}
              label="No"
            />
          </div>
          <div className="flex items-center gap-5">
            <label>Sales Return Against Invoice Only</label>
            <Radio
              name="salesReturnAgainstInvoiceOnly"
              value="1"
              checked={formData.salesReturnAgainstInvoiceOnly === 1}
              onChange={() =>
                handleRadioChange("salesReturnAgainstInvoiceOnly", "1")
              }
              label="Yes"
            />
            <Radio
              name="salesReturnAgainstInvoiceOnly"
              value="0"
              checked={formData.salesReturnAgainstInvoiceOnly === 0}
              onChange={() =>
                handleRadioChange("salesReturnAgainstInvoiceOnly", "0")
              }
              label="No"
            />
          </div>
        </Box>
      ),
    },
    {
      id: "ba",
      title: "Barcode Label (Accessory)",
      icon: <FiPackage className="text-red-600 text-xl" />,
      content: (
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-3">
            <Autocomplete
              options={allLocations?.data || []}
              getOptionLabel={(option) => option.LocationName || ""}
              value={formData.accessoryLabel}
              onChange={handleAutoChange("accessoryLabel")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Label"
                  placeholder="Select Label"
                  size="small"
                  variant="outlined"
                />
              )}
              loading={isLocationsLoading}
              fullWidth
            />
          </div>
          <div className="">
            <TextField
              label="Column 1"
              placeholder="Enter Column 1"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.accessoryColumn1}
              onChange={handleChange("accessoryColumn1")}
            />
          </div>
          <div className="">
            <TextField
              label="Column 2"
              placeholder="Enter Column 2"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.accessoryColumn2}
              onChange={handleChange("accessoryColumn2")}
            />
          </div>
          <div className="">
            <TextField
              label="Column 3"
              placeholder="Enter Column 3"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.accessoryColumn3}
              onChange={handleChange("accessoryColumn3")}
            />
          </div>
        </Box>
      ),
    },
  ];

  return (
    <Box className="max-w-8xl bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <Box className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <Typography variant="h5" className="font-bold text-gray-900 mb-1">
              Company Settings
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Manage your company locations, pools, and configuration settings
            </Typography>
          </div>
          {selectedLocation && (
            <div className="flex justify-end mt-5">
              <Button color="primary" onClick={handleSubmit}>
                Update Settings
              </Button>
            </div>
          )}
        </div>
      </Box>

      {/* Accordion Sections */}
      <Paper elevation={0} className="">
        <Box className="">
          {accordionSections.map((section, index) => {
            if (section.id !== "location" && !selectedLocation) return null;
            return (
              <Accordion
                key={section.id}
                expanded={expandedSection === section.id}
                onChange={handleAccordionChange(section.id)}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  boxShadow: "none",
                  "&:before": { display: "none" },
                  transition: "all 0.3s ease-in-out",
                  "&:hover": { borderColor: "primary.main" },
                  mb: 3, // always add bottom margin
                  "&.Mui-expanded": { margin: "0 0 12px 0" }, // override default expanded margin
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandIcon />}
                  sx={{
                    minHeight: 68,
                    "&.Mui-expanded": { minHeight: 68 },
                    backgroundColor:
                      expandedSection === section.id
                        ? "rgba(0, 0, 0, 0.02)"
                        : "transparent",
                    transition: "background-color 0.3s ease",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {section.icon}
                    <Typography variant="h6" className="font-semibold">
                      {section.title}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    padding: 3,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  {section.content}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      </Paper>
      {selectedLocation && (
        <div className="flex justify-end mt-5">
          <Button color="primary" onClick={handleSubmit}>
            Update Settings
          </Button>
        </div>
      )}
    </Box>
  );
};

export default CompanySettings;
