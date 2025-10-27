import React, { useRef, useState, useEffect } from "react";
import { useGetAllLocationsQuery } from "../../api/roleManagementApi";
import {
  useGetAllPoolsQuery,
  useGetCompanySettingsQuery,
  useGetLabelsQuery,
  useGetTaxesQuery,
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
  FiPackage,
  FiSliders,
  FiBookOpen, // Replaces FiBuilding
} from "react-icons/fi";
import Loader from "../../components/ui/Loader";
import Radio from "../../components/Form/Radio";
import Button from "../../components/ui/Button";
import {
  useGetCountriesQuery,
  useGetStatesQuery,
  useLazyGetPinCodeQuery,
} from "../../api/customerApi";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { enGB } from "date-fns/locale";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useGetAllCustomerGroupsQuery } from "../../api/customerGroup";
import toast from "react-hot-toast";
import { isValidNumericInput } from "../../utils/isValidNumericInput";

const API_BASE = import.meta.env.VITE_LOCAL;

const EInvoiceGSTOptions = [
  { value: 1, name: "PCS" },
  { value: 2, name: "NOS" },
  { value: 3, name: "BOX" },
];

const FrameOptions = [
  { value: "BrandID", label: "Brand" },
  { value: "ModelNo", label: "ModelNo" },
  { value: "FrameSRP", label: "MRP" },
  { value: "SellingPrice", label: "Selling Price" },
  { value: "Barcode", label: "Barcode" },
  { value: "Size", label: "Size" },
  { value: "DBL", label: "DBL" },
  { value: "TempleLength", label: "Temple Length" },
  { value: "ColourCode", label: "Colour Code" },
];

const AccOptions = [
  { value: "BrandID", label: "Brand" },
  { value: "SKUCode", label: "SKU Code" },
  { value: "VariationName", label: "Variation" },
  { value: "Barcode", label: "Barcode" },
  { value: "OPMRP", label: "MRP" },
  { value: "SellingPrice", label: "Selling Price" },
];

const CompanySettings = () => {
  const [expandedSection, setExpandedSection] = useState(null); // first accordion open
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [qrCode, setQrCode] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const qrInputRef = useRef(null);
  const [fromDate, setFromDate] = useState(new Date());

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
  const { data: customerGroups } = useGetAllCustomerGroupsQuery();
  const [getPinCodeData, { isFetching: isPinCodeFetching }] =
    useLazyGetPinCodeQuery();
  const { data: alltaxes } = useGetTaxesQuery();
  const { data: allLabels } = useGetLabelsQuery();

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
    billingAddress2: "",
    zipcode: "",
    olGstUnit: "",
    clGstUnit: "",
    fsGstUnit: "",
    accGstUnit: "",
    enableEIInvoice: "",
    enableEICreditNote: "",
    enableEIDebitNote: "",
    enableEInStockOut: "",
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
    NoOfColumns: null,
    frameLabel: null,
    frameColumn1: "",
    frameColumn2: "",
    frameColumn3: "",
    frameColumn4: "",
    frameColumn5: "",
    showBuyingPriceDc: 0,
    invoiceDcPdf: 0, // 0 show MRP, 1 selling
    editInvoicePrice: 0,
    salesReturnAgainstInvoiceOnly: 0,
    accessoryLabel: null,
    accessoryColumn1: "",
    accessoryColumn2: "",
    accessoryColumn3: "",
    accessoryColumn4: "",
    accessoryColumn5: "",
    poApproval: "",
    gvMultipleUse: "",
    dcBilling: "",
    creditBilling: "",
    loyaltyEnable: "",
    orderDiscountApproval: "",
    discountPercentage: "",
    prefixRollOff: "", // date
    clMinExpPeriod: "",
    clExpiryGracePeriod: "",
    orderCancellationApproval: "",
    invoiceCancellationApproval: "",
    emailApproval: "",
    mobileNoApproval: "",
    countryCodeForMobileApproval: "",
    defaultCustomerPool: "",
    discountValue: "",
    ClientEmail: "",
    EInvoiceInstanceID: "",
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
        billingAddress2: data.Company?.BillingAddress2,
        zipcode: data?.Company.BillingZipCode,
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
        invoicePrefix: data.SalesInvoicePrefix,
        invoiceDcPrefix: data.SalesDCPrefix,
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
        frameLabel: data?.BarcodeLabelId,
        frameColumn1: data.FSBL1,
        frameColumn2: data.FSBL2,
        frameColumn3: data.FSBL3,
        frameColumn4: data.FSBL4,
        frameColumn5: data.FSBL5,
        showBuyingPriceDc: 0,
        invoiceDcPdf: 0, // 0 show MRP, 1 selling
        editInvoicePrice: 0,
        salesReturnAgainstInvoiceOnly: 0,
        // NoOfColumns: allLabels?.data?.find(
        //   (item) => data?.BarcodeLabelId == item.Id
        // ).NoOfColumns || null,
        NoOfColumns: typeof allLabels.data.find(l => l.Id == data?.BarcodeLabelId)?.NoOfColumns === 'number' ? allLabels.data.find(l => l.Id == data?.BarcodeLabelId)?.NoOfColumns : null,
        accessoryLabel: data?.AccBarcodeLableId,
        accessoryColumn1: data.AccBL1,
        accessoryColumn2: data.AccBL2,
        accessoryColumn3: data.AccBL3,
        accessoryColumn4: data.AccBL4,
        accessoryColumn5: data.AccBL5,
        olGstUnit: data.OLGSTINunit,
        clGstUnit: data.CLGSTINunit,
        accGstUnit: data.AccGSTINunit,
        fsGstUnit: data.FSGSTINunit,
        enableEICreditNote: data.CNEInvoiceEnable,
        enableEIDebitNote: data.DNEInvoiceEnable,
        poApproval: data.POApproval,
        gvMultipleUse: data.GVMultipleUse,
        dcBilling: data.DCBilling,
        creditBilling: data.CreditBilling,
        loyaltyEnable: data.EnableCustomerLoyalty,
        prefixRollOff: data.PrefixRollOff,
        clMinExpPeriod: data.CLMinExpiryPeriod,
        clExpiryGracePeriod: data.ClExpiryGracePeriod,
        orderCancellationApproval: data.OrderCancellationAppr,
        invoiceCancellationApproval: data.InvCancellationAppr,
        emailApproval: data.ApprovalEmail,
        countryCodeForMobileApproval: data.ApprovalMobCountryCode,
        mobileNoApproval: data.AprrovalMobNo,
        defaultCustomerPool: data.CustomerGroupDefault,
        discountValue: data?.DiscountMaxValue,
        ClientEmail: data?.ClientEmail,
        EInvoiceInstanceID: data?.EInvoiceInstanceID,
        discountPercentage: data?.DiscountMaxSlabPerct,
        enableEInStockOut: data?.STEInvoiceEnable,
        orderDiscountApproval: data?.DiscountApproval,
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
  }, [companySettingData, allLabels]);
  const fetchLocationDetails = async (pincode) => {
    try {
      const response = await getPinCodeData({ pincode }).unwrap();

      if (response?.success && response.data.length > 0) {
        const location = response.data[0];
        setFormData((prev) => ({
          ...prev,
          state: location?.StateId,
          country: location?.CountryId,
          city: location?.CityName,
        }));
      }
    } catch (error) {
      toast.error("Entered Pincode not valid!");
    }
  };
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
      className={`transition-transform duration-300 ${expandedSection ? "rotate-180" : ""
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
        BillingAddress2: formData.billingAddress2,
        BillingCity: formData.city,
        BillingZipCode: formData.zipcode,
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
      SalesInvoicePrefix: formData.invoicePrefix, // Was empty in initial setFormData
      SalesDCPrefix: formData.invoiceDcPrefix, // Add if needed
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
      BarcodeLabelId: formData.frameLabel, // Assuming it's an ID
      FSBL1: formData.frameColumn1,
      FSBL2: formData.frameColumn2,
      FSBL3: formData.frameColumn3,
      FSBL4: formData.frameColumn4,
      FSBL5: formData.frameColumn5,
      ShowBuyingPriceDc: formData.showBuyingPriceDc,
      InvoiceDcPdf: formData.invoiceDcPdf, // 0=MRP, 1=selling
      EditInvoicePrice: formData.editInvoicePrice,
      SalesReturnAgainstInvoiceOnly: formData.salesReturnAgainstInvoiceOnly,
      AccessoryLabelId: formData.accessoryLabel, // Assuming ID
      AccBL1: formData.accessoryColumn1,
      AccBL2: formData.accessoryColumn2,
      AccBL3: formData.accessoryColumn3,
      AccBL4: formData.accessoryColumn4,
      AccBL5: formData.accessoryColumn5,
      OLGSTINunit: formData.olGstUnit,
      CLGSTINunit: formData.clGstUnit,
      AccGSTINunit: formData.accGstUnit,
      FSGSTINunit: formData.fsGstUnit,
      CNEInvoiceEnable: formData.enableEICreditNote,
      DNEInvoiceEnable: formData.enableEIDebitNote,
      STEInvoiceEnable: formData.enableEInStockOut,
      POApproval: formData.poApproval,
      GVMultipleUse: formData.gvMultipleUse,
      DCBilling: formData.dcBilling,
      CreditBilling: formData.creditBilling,
      EnableCustomerLoyalty: formData.loyaltyEnable,
      PrefixRollOff: formData.prefixRollOff,
      CLMinExpiryPeriod: formData.clMinExpPeriod,
      ClExpiryGracePeriod: formData.clExpiryGracePeriod,
      OrderCancellationAppr: formData.orderCancellationApproval,
      InvCancellationAppr: formData.invoiceCancellationApproval,
      ApprovalEmail: formData.emailApproval,
      ApprovalMobCountryCode: formData.countryCodeForMobileApproval,
      AprrovalMobNo: formData.mobileNoApproval,
      CustomerGroupDefault: formData.defaultCustomerPool,
      DiscountMaxValue: formData.discountValue,
      EInvoiceInstanceID: formData.EInvoiceInstanceID,
      ClientEmail: formData.ClientEmail,
      DiscountMaxSlabPerct: formData?.discountPercentage,
      DiscountApproval: formData?.orderDiscountApproval,
    };

    // If logo/QR need uploading (assuming multipart form)
    const formDataPayload = new FormData();
    formDataPayload.append("settings", JSON.stringify(payload));
    if (logo) formDataPayload.append("logo", logo);
    if (qrCode) formDataPayload.append("qrCode", qrCode);

    try {
      //    api call
      await updateSettings({ payload: formDataPayload }).unwrap();
      toast.success("Location settings successfully updated!");
    } catch (error) {
      //   alert("Update failed");
      console.log(error);
      toast.error(
        error?.data?.error?.message || "Looks like something went wrong!"
      );
    }
  };
  console.log(formData);
  if (isLocationsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader color="black" width="w-10" height="h-10" />
      </div>
    );
  }

  const accordionSections = [
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
              <label className="text-neutral-800 font-semibold text-base">
                GST Register{" "}
              </label>
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
                label="Billing Address2"
                placeholder="Enter Address 2"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.billingAddress2}
                onChange={handleChange("billingAddress2")}
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
            <div className="flex gap-2">
              <TextField
                label="PinCode"
                placeholder="Enter PinCode"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.zipcode}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow only digits and max 6 characters
                  if (/^\d{0,6}$/.test(val)) {
                    setFormData((prev) => ({ ...prev, zipcode: val }));
                  }
                }}
              />

              <Button
                variant="primary"
                onClick={() => fetchLocationDetails(formData?.zipcode)}
                isLoading={isPinCodeFetching}
                disabled={isPinCodeFetching}
              >
                Search
              </Button>
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
      id: "standard",
      title: "Pool Settings",
      icon: <FiSettings className="text-green-600 text-xl" />,
      content: (
        <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Autocomplete
            options={allPool?.data?.customer?.filter || []}
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
      id: "invoice",
      title: "E-Invoice & GST Settings",
      icon: <FiFileText className="text-purple-600 text-xl" />,
      content: (
        <Box className="flex gap-4 flex-col">
          <div className="flex gap-5">
            <div className="flex items-center gap-5">
              <label className="text-neutral-800 font-semibold text-base">
                Enable GST Verification{" "}
              </label>
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
            {formData?.enableGstVerification === 1 && (
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
            )}
          </div>
          <div className="flex items-center gap-5">
            <label className="text-neutral-800 font-semibold text-base">
              {" "}
              Enable E-Invoice{" "}
            </label>
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

          {formData.enableEInvoice === 1 && (
            <>
              <div className="flex-grow flex">
                <TextField
                  label="E-Invoice Instance ID"
                  placeholder="Enter E-Invoice Instance ID"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={formData.EInvoiceInstanceID}
                  onChange={handleChange("EInvoiceInstanceID")}
                />
              </div>
              <div className="grid grid-cols-4 gap-5">
                <div>
                  <Autocomplete
                    options={EInvoiceGSTOptions || []}
                    getOptionLabel={(option) => option.name || ""}
                    value={
                      EInvoiceGSTOptions?.find(
                        (pool) => pool.name == formData.olGstUnit
                      ) || null
                    }
                    onChange={(_, newValue) =>
                      setFormData({
                        ...formData,
                        olGstUnit: newValue?.name || null,
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Optical Lens GSTIN Unit"
                        placeholder="Select Optical Lens GSTIN Unit"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    fullWidth
                  />
                </div>
                <div>
                  <Autocomplete
                    options={EInvoiceGSTOptions || []}
                    getOptionLabel={(option) => option.name || ""}
                    value={
                      EInvoiceGSTOptions?.find(
                        (pool) => pool.name == formData.clGstUnit
                      ) || null
                    }
                    onChange={(_, newValue) =>
                      setFormData({
                        ...formData,
                        clGstUnit: newValue?.name || null,
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Contact Lens GSTIN Unit"
                        placeholder="Select Contact Lens GSTIN Unit"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    fullWidth
                  />
                </div>
                <div>
                  <Autocomplete
                    options={EInvoiceGSTOptions || []}
                    getOptionLabel={(option) => option.name || ""}
                    value={
                      EInvoiceGSTOptions?.find(
                        (pool) => pool.name == formData.fsGstUnit
                      ) || null
                    }
                    onChange={(_, newValue) =>
                      setFormData({
                        ...formData,
                        fsGstUnit: newValue?.name || null,
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Frame/Sunglassess Lens GSTIN Unit"
                        placeholder="Select Frame/Sunglassess Lens GSTIN Unit"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    fullWidth
                  />
                </div>
                <div>
                  <Autocomplete
                    options={EInvoiceGSTOptions || []}
                    getOptionLabel={(option) => option.name || ""}
                    value={
                      EInvoiceGSTOptions?.find(
                        (pool) => pool.name == formData.accGstUnit
                      ) || null
                    }
                    onChange={(_, newValue) =>
                      setFormData({
                        ...formData,
                        accGstUnit: newValue?.name || null,
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Accessory Lens GSTIN Unit"
                        placeholder="Select Accessory Lens GSTIN Unit"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    fullWidth
                  />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-5">
                <div className="flex items-center gap-3">
                  <label className="text-neutral-800 font-semibold text-base">
                    Enable E-Invoice for Invoice
                  </label>
                  <Radio
                    name="E-1"
                    value="1"
                    checked={formData.enableEIInvoice === 1}
                    onChange={() => handleRadioChange("enableEIInvoice", "1")}
                    label="Yes"
                  />
                  <Radio
                    name="E-1"
                    value="0"
                    checked={formData.enableEIInvoice === 0}
                    onChange={() => handleRadioChange("enableEIInvoice", "0")}
                    label="No"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-neutral-800 font-semibold text-base">
                    Enable E-Invoice for Credit Note{" "}
                  </label>
                  <Radio
                    name="E-2"
                    value="1"
                    checked={formData.enableEICreditNote === 1}
                    onChange={() =>
                      handleRadioChange("enableEICreditNote", "1")
                    }
                    label="Yes"
                  />
                  <Radio
                    name="E-2"
                    value="0"
                    checked={formData.enableEICreditNote === 0}
                    onChange={() =>
                      handleRadioChange("enableEICreditNote", "0")
                    }
                    label="No"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-neutral-800 font-semibold text-base">
                    Enable E-Invoice for Debit Note{" "}
                  </label>
                  <Radio
                    name="E-3"
                    value="1"
                    checked={formData.enableEIDebitNote === 1}
                    onChange={() => handleRadioChange("enableEIDebitNote", "1")}
                    label="Yes"
                  />
                  <Radio
                    name="E-3"
                    value="0"
                    checked={formData.enableEIDebitNote === 0}
                    onChange={() => handleRadioChange("enableEIDebitNote", "0")}
                    label="No"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-neutral-800 font-semibold text-base">
                    Enable E-Invoice for Stock out
                  </label>
                  <Radio
                    name="E-5"
                    value="1"
                    checked={formData.enableEInStockOut === 1}
                    onChange={() => handleRadioChange("enableEInStockOut", "1")}
                    label="Yes"
                  />
                  <Radio
                    name="E-5"
                    value="0"
                    checked={formData.enableEInStockOut === 0}
                    onChange={() => handleRadioChange("enableEInStockOut", "0")}
                    label="No"
                  />
                </div>
              </div>
            </>
          )}
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
          <div className="w-full">
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={enGB}
            >
              <div className="w-full">
                <DatePicker
                  className="w-full"
                  label="Prefix Roll Off"
                  value={fromDate}
                  onChange={(newValue) => setFromDate(newValue)}
                  inputFormat="dd/MM/yyyy"
                  // maxDate={new Date()}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      inputProps={{
                        ...params.inputProps,
                        placeholder: "dd/MM/yyyy",
                      }}
                      size="small"
                      fullWidth
                      variant="outlined"
                    />
                  )}
                />
              </div>
            </LocalizationProvider>
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
        <Box className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              label="Email Address for Mail notifications"
              placeholder="Enter Email Address for Mail notifications"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.ClientEmail}
              onChange={handleChange("ClientEmail")}
            />
          </div>
        </Box>
      ),
    },
    {
      id: "FittingCharges",
      title: "Fitting Charges Settings",
      icon: <FiSliders className="text-indigo-600 text-xl" />,
      content: (
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-5">
            <label className="text-neutral-800 font-semibold text-base">
              Optical Lens Fitting Label
            </label>
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

          <div>
            <Autocomplete
              options={alltaxes?.data || []}
              getOptionLabel={(option) => option.Name || ""}
              value={
                alltaxes?.data?.find(
                  (pool) => pool.Id === formData.opticalLensFittingGst
                ) || null
              }
              onChange={(_, newValue) =>
                setFormData({
                  ...formData,
                  opticalLensFittingGst: newValue?.Id || null,
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tax Percentage"
                  placeholder="Select TaxPercentage"
                  size="small"
                  variant="outlined"
                />
              )}
              fullWidth
            />
          </div>
          <div className="flex items-center gap-5 ">
            <label className="text-neutral-800 font-semibold text-base">
              Fitting Charges Purchase
            </label>

            <div className="flex items-center gap-6">
              <Radio
                name="fittingChargesPurchase"
                value="1"
                checked={formData.fittingChargesPurchase === 1}
                onChange={() =>
                  handleRadioChange("fittingChargesPurchase", "1")
                }
                className="accent-blue-600 w-5 h-5 cursor-pointer"
              />
              <Radio
                name="fittingChargesPurchase"
                value="0"
                checked={formData.fittingChargesPurchase === 0}
                onChange={() =>
                  handleRadioChange("fittingChargesPurchase", "0")
                }
                className="accent-blue-600 w-5 h-5 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-5 flex-1/2">
            <label className="text-neutral-800 font-semibold text-base">
              Fitting Charges Sales
            </label>
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
        </Box>
      ),
    },
    {
      id: "tcs",
      title: "T&C Settings",
      icon: <FiBookOpen className="text-blue-600 text-xl" />,
      content: (
        <Box className="grid grid-cols-1 gap-4">
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
      title: "Barcode Label Settings",
      icon: <FiBox className="text-pink-600 text-xl" />,
      content: (
        <Box className="flex flex-col gap-5">
          {/* Barcode Label (Frame) */}
          <div>
            <div className="mb-3">Barcode Label (Frame)</div>
            <div>
              <div className="col-span-3">
                <Autocomplete
                  options={allLabels?.data || []}
                  getOptionLabel={(option) => option.LabelName || ""}
                  value={
                    allLabels?.data
                      ? allLabels.data.find(
                        (item) =>
                          String(item.Id) === String(formData.frameLabel)
                      ) || null
                      : null
                  }
                  onChange={(_, newValue) =>
                    setFormData({
                      ...formData,
                      frameLabel: newValue?.Id || null,
                      NoOfColumns: newValue?.NoOfColumns || null,
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Label"
                      placeholder="Select Label"
                      size="small"
                      variant="outlined"
                    />
                  )}
                  fullWidth
                />
              </div>
              {formData?.frameLabel && formData?.NoOfColumns && (
                <div className="grid grid-cols-3 gap-5 w-full mt-5">
                  {Array.from({ length: formData?.NoOfColumns }).map(
                    (_, index) => (
                      <div key={index}>
                        <Autocomplete
                          multiple
                          options={FrameOptions || []}
                          getOptionLabel={(option) => option.label || ""}
                          value={
                            FrameOptions.filter((item) =>
                              (formData[`frameColumn${index + 1}`] || "")
                                .split(",")
                                .includes(item.label)
                            ) || []
                          }
                          onChange={(_, newValue) => {
                            const concatenated = newValue
                              .map((item) => item.label)
                              .join(",");
                            handleChange(`frameColumn${index + 1}`)({
                              target: { value: concatenated },
                            });
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={`Column ${index + 1}`}
                              placeholder={`Select Column ${index + 1}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          fullWidth
                        />
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Barcode Label (Accessory) */}
          <div>
            <div className="mb-3">Barcode Label (Accessory)</div>
            <div>
              <div className="col-span-3">
                <Autocomplete
                  options={allLabels?.data || []}
                  getOptionLabel={(option) => option.LabelName || ""}
                  value={
                    allLabels?.data
                      ? allLabels.data.find(
                        (item) =>
                          String(item.Id) === String(formData.accessoryLabel)
                      ) || null
                      : null
                  }
                  onChange={(_, newValue) =>
                    setFormData({
                      ...formData,
                      accessoryLabel: newValue?.Id || null,
                      NoOfColumns: newValue?.NoOfColumns || null,
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Label"
                      placeholder="Select Label"
                      size="small"
                      variant="outlined"
                    />
                  )}
                  fullWidth
                />
              </div>
              {formData?.accessoryLabel && formData?.NoOfColumns && (
                <div className="grid grid-cols-3 gap-5 w-full mt-5">
                  {Array.from({ length: formData?.NoOfColumns }).map(
                    (_, index) => (
                      <div key={index}>
                        <Autocomplete
                          multiple
                          options={AccOptions || []}
                          getOptionLabel={(option) => option.label || ""}
                          value={
                            AccOptions.filter((item) =>
                              (formData[`accessoryColumn${index + 1}`] || "")
                                .split(",")
                                .includes(item.label)
                            ) || []
                          }
                          onChange={(_, newValue) => {
                            const concatenated = newValue
                              .map((item) => item.label)
                              .join(",");
                            handleChange(`accessoryColumn${index + 1}`)({
                              target: { value: concatenated },
                            });
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={`Column ${index + 1}`}
                              placeholder={`Select Column ${index + 1}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          fullWidth
                        />
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </Box>
      ),
    },
    {
      id: "otherSettings",
      title: "Other Settings",
      icon: <FiTool className="text-orange-600 text-xl" />,
      content: (
        <Box className="">
          {/* Approval Section */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-neutral-800 mb-4 underline">
              Approval
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-neutral-800 font-semibold text-base">
                  Order Discount Approval Required
                </label>
                <div className="flex items-center gap-5 mt-2">
                  <Radio
                    name="orderDiscountApproval"
                    value="1"
                    checked={formData.orderDiscountApproval === 1}
                    onChange={() =>
                      handleRadioChange("orderDiscountApproval", "1")
                    }
                    label="Yes"
                  />
                  <Radio
                    name="orderDiscountApproval"
                    value="0"
                    checked={formData.orderDiscountApproval === 0}
                    onChange={() =>
                      handleRadioChange("orderDiscountApproval", "0")
                    }
                    label="No"
                  />
                </div>
              </div>
              {formData?.orderDiscountApproval == 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="Discount % above which Approval is Required"
                    placeholder="Enter Discount %"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={formData.discountPercentage}
                    onChange={handleChange("discountPercentage")}
                  />
                  <TextField
                    label="Discount Value above which Approval is Required"
                    placeholder="Enter Discount Value"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={formData.discountValue}
                    onChange={handleChange("discountValue")}
                  />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-5">
                  <label className="text-neutral-800 font-semibold text-base">
                    Order Cancellation Approval
                  </label>
                  <Radio
                    name="orderCancellationApproval"
                    value="1"
                    checked={formData.orderCancellationApproval === 1}
                    onChange={() =>
                      handleRadioChange("orderCancellationApproval", "1")
                    }
                    label="Yes"
                  />
                  <Radio
                    name="orderCancellationApproval"
                    value="0"
                    checked={formData.orderCancellationApproval === 0}
                    onChange={() =>
                      handleRadioChange("orderCancellationApproval", "0")
                    }
                    label="No"
                  />
                </div>
                <div className="flex items-center gap-5">
                  <label className="text-neutral-800 font-semibold text-base">
                    Invoice Cancellation Approval
                  </label>
                  <Radio
                    name="invoiceCancellationApproval"
                    value="1"
                    checked={formData.invoiceCancellationApproval === 1}
                    onChange={() =>
                      handleRadioChange("invoiceCancellationApproval", "1")
                    }
                    label="Yes"
                  />
                  <Radio
                    name="invoiceCancellationApproval"
                    value="0"
                    checked={formData.invoiceCancellationApproval === 0}
                    onChange={() =>
                      handleRadioChange("invoiceCancellationApproval", "0")
                    }
                    label="No"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Approval Email"
                  placeholder="Enter Approval Email"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={formData.emailApproval}
                  onChange={handleChange("emailApproval")}
                />
                <div className="flex gap-4">
                  <Autocomplete
                    options={countries?.country || []}
                    getOptionLabel={(option) =>
                      `${option.CountryName}(${option.ISDCode})`
                    }
                    value={
                      countries?.country?.find(
                        (pool) =>
                          pool.Id == formData.countryCodeForMobileApproval
                      ) || null
                    }
                    onChange={(_, newValue) =>
                      setFormData({
                        ...formData,
                        countryCodeForMobileApproval: newValue?.Id || null,
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Country"
                        placeholder="Select Country Code"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    fullWidth
                  />
                  <TextField
                    label="Mobile No For Whatsapp Approval"
                    placeholder="Enter Mobile No"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={formData.mobileNoApproval}
                    onChange={handleChange("mobileNoApproval")}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* CreditNote Section */}
          <section className="mb-8">
            <h3 className="text-xl underline font-semibold text-neutral-800 mb-4">
              Credit Note
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <label className="text-neutral-800 font-semibold text-base">
                  Sales Return Against Invoice Only
                </label>
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
              <TextField
                label="Credit Note Return Period (in days)"
                placeholder="Enter Credit Note Return Period"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.creditNoteReturnPeriod}
                onChange={handleChange("creditNoteReturnPeriod")}
              />
            </div>
          </section>

          {/* Customer Section */}
          <section className="mb-8">
            <h3 className="text-xl underline font-semibold text-neutral-800 mb-4">
              Customer
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="flex items-center gap-5">
                <label className="text-neutral-800 font-semibold text-base">
                  Customer DC Billing
                </label>
                <Radio
                  name="dcBilling"
                  value="1"
                  checked={formData.dcBilling === 1}
                  onChange={() => handleRadioChange("dcBilling", "1")}
                  label="Yes"
                />
                <Radio
                  name="dcBilling"
                  value="0"
                  checked={formData.dcBilling === 0}
                  onChange={() => handleRadioChange("dcBilling", "0")}
                  label="No"
                />
              </div>
              <div className="flex items-center gap-5">
                <label className="text-neutral-800 font-semibold text-base">
                  Customer Credit Billing
                </label>
                <Radio
                  name="creditBilling"
                  value="1"
                  checked={formData.creditBilling === 1}
                  onChange={() => handleRadioChange("creditBilling", "1")}
                  label="Yes"
                />
                <Radio
                  name="creditBilling"
                  value="0"
                  checked={formData.creditBilling === 0}
                  onChange={() => handleRadioChange("creditBilling", "0")}
                  label="No"
                />
              </div>
              <div className="flex items-center gap-5">
                <label className="text-neutral-800 font-semibold text-base">
                  Customer Loyalty Enable
                </label>
                <Radio
                  name="loyaltyEnable"
                  value="1"
                  checked={formData.loyaltyEnable === 1}
                  onChange={() => handleRadioChange("loyaltyEnable", "1")}
                  label="Yes"
                />
                <Radio
                  name="loyaltyEnable"
                  value="0"
                  checked={formData.loyaltyEnable === 0}
                  onChange={() => handleRadioChange("loyaltyEnable", "0")}
                  label="No"
                />
              </div>
              <Autocomplete
                options={customerGroups?.data?.data || []}
                getOptionLabel={(option) => option.GroupName || ""}
                value={
                  customerGroups?.data?.data?.find(
                    (pool) => pool.Id === formData.defaultCustomerPool
                  ) || null
                }
                onChange={(_, newValue) =>
                  setFormData({
                    ...formData,
                    defaultCustomerPool: newValue?.Id || null,
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer Group"
                    placeholder="Select Customer Group"
                    size="small"
                    variant="outlined"
                  />
                )}
                fullWidth
              />
            </div>
          </section>

          {/* Invoice Section */}
          <section className="mb-8">
            <h3 className="text-xl underline font-semibold text-neutral-800 mb-4">
              Invoice
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-2">
              <div className="flex items-center gap-5">
                <label className="text-neutral-800 font-semibold text-base">
                  Invoice DC PDF
                </label>
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
                <label className="text-neutral-800 font-semibold text-base">
                  Edit Invoice Price
                </label>
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
            </div>
          </section>

          {/* Others Section */}
          <section className="mb-8">
            <h3 className="text-xl underline font-semibold text-neutral-800 mb-4">
              Others
            </h3>
            <div className="grid grid-cols-3 gap-5">
              <div className="flex items-center gap-5">
                <label className="text-neutral-800 font-semibold text-base">
                  GV Multiple Use
                </label>
                <Radio
                  name="gvMultipleUse"
                  value="1"
                  checked={formData.gvMultipleUse === 1}
                  onChange={() => handleRadioChange("gvMultipleUse", "1")}
                  label="Yes"
                />
                <Radio
                  name="gvMultipleUse"
                  value="0"
                  checked={formData.gvMultipleUse === 0}
                  onChange={() => handleRadioChange("gvMultipleUse", "0")}
                  label="No"
                />
              </div>
              <TextField
                label="CL Min Expiry Period (in months)"
                placeholder="Enter Period"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.clMinExpPeriod}
                onChange={handleChange("clMinExpPeriod")}
              />
              <TextField
                label="CL Expiry Grace Period (in days)"
                placeholder="Enter days"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.clExpiryGracePeriod}
                onChange={handleChange("clExpiryGracePeriod")}
              />
              {/* <TextField
                label="Email for Approval"
                placeholder="Enter email"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.emailApproval}
                onChange={handleChange("emailApproval")}
              /> */}
              {/* <div className="flex gap-4">
                <Autocomplete
                  options={countries?.country || []}
                  getOptionLabel={(option) =>
                    `${option.CountryName}(${option.ISDCode})`
                  }
                  value={
                    countries?.country?.find(
                      (pool) =>
                        pool.Id === formData.countryCodeForMobileApproval
                    ) || null
                  }
                  onChange={(_, newValue) =>
                    setFormData({
                      ...formData,
                      countryCodeForMobileApproval: newValue?.Id || null,
                    })
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
                <TextField
                  label="Mobile No For Approval"
                  placeholder="Enter Mobile No"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={formData.mobileNoApproval}
                  onChange={handleChange("mobileNoApproval")}
                />
              </div> */}
            </div>
          </section>
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
              Location Settings
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Manage your company locations, pools, and configuration settings
            </Typography>
          </div>

          {selectedLocation && (
            <div className="flex justify-end mt-5">
              <Button
                color="primary"
                onClick={handleSubmit}
                isLoading={isUpdating}
                disabled={isUpdating}
              >
                Update Settings
              </Button>
            </div>
          )}
        </div>
      </Box>

      {/* Accordion Sections */}
      <Paper elevation={0} className="">
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

        <Box className="mt-5">
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
          <Button
            color="primary"
            onClick={handleSubmit}
            isLoading={isUpdating}
            disabled={isUpdating}
          >
            Update Settings
          </Button>
        </div>
      )}
    </Box>
  );
};

export default CompanySettings;
