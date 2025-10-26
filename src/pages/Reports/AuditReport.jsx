import { Autocomplete, TextField, Chip, Box } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { enGB } from "date-fns/locale";
import React, { useState } from "react";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import Button from "../../components/ui/Button";
import { useLazyGetAuditReportQuery } from "../../api/reportApi";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const reportTypes = [
  { value: 0, label: "All Pages" },
  { value: 1, label: "Accessory Master" },
  // { value: 2, label: "Audit" },
  { value: 3, label: "Bank Account Details" },
  { value: 4, label: "Bank Master" },
  { value: 5, label: "Brand" },
  { value: 6, label: "Brand Category" },
  { value: 7, label: "Brand Group" },
  // { value: 8, label: "Communication" },
  { value: 9, label: "Companies" },
  // { value: 10, label: "Contact-Lens" },
  { value: 11, label: "Contact-Lens-Details" },
  { value: 12, label: "Customer" },
  { value: 13, label: "Customer Group" },
  { value: 14, label: "Customer-Payment" },
  { value: 15, label: "Customer-Refund" },
  // { value: 16, label: "Dashboard" },
  { value: 17, label: "Frame Master" },
  // { value: 18, label: "Frame Rim Type" },
  { value: 19, label: "Gift-Voucher" },
  { value: 20, label: "GRN From Order" },
  { value: 21, label: "GRN DC" },
  { value: 22, label: "Invoice" },
  { value: 23, label: "Location-setting" },
  { value: 24, label: "Material Master" },
  { value: 25, label: "Offer" },
  // { value: 26, label: "OLFitting Standard Charges" },
  // { value: 27, label: "Optical-lens" },
  { value: 28, label: "Order" },
  { value: 29, label: "Order-Report" },
  // { value: 30, label: "Page Management" },
  { value: 31, label: "Payment Machine" },
  { value: 32, label: "Pool" },
  { value: 33, label: "Prescription" },
  { value: 34, label: "Profit Report" },
  { value: 35, label: "Purchase Order" },
  { value: 36, label: "Purchase-Report" },
  { value: 37, label: "Purchase-Return" },
  { value: 38, label: "Purchase-Return-Report" },
  { value: 39, label: "Role Management" },
  { value: 40, label: "Sales Person" },
  { value: 41, label: "Sales-Report" },
  { value: 42, label: "Sales-Return-Report" },
  { value: 43, label: "SalesReturn" },
  { value: 44, label: "Season Master" },
  { value: 45, label: "Shape Master" },
  { value: 46, label: "StockTranserIn" },
  // { value: 47, label: "StockTransfer" },
  { value: 48, label: "User Management" },
  { value: 49, label: "Variation Master" },
  { value: 50, label: "Vendor" },
  { value: 51, label: "Stock Transfer Out" },
  { value: 52, label: "Vendor Payment" },
  { value: 53, label: "Contact Lens Master" },
  { value: 54, label: "Email Template" },
  { value: 55, label: "Whatsapp Template" },
];

const dateOptions = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "90days", label: "Last 90 Days" },
  { value: "6months", label: "Last 6 Months" },
  { value: "1year", label: "Last 1 Year" },
  { value: "custom", label: "Custom Date" },
];

const formatDate = (date) => format(date, "yyyy-MM-dd");

const AuditReport = () => {
  const { user } = useSelector((state) => state.auth);
  const [selectedReports, setSelectedReports] = useState([]); // Start with "All Pages" selected
  const [dateType, setDateType] = useState("today");
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());

  const [getReport, { isFetching: isReportLoading }] =
    useLazyGetAuditReportQuery();

  const handleReportChange = (_, newValue) => {
    if (!newValue || newValue.length === 0) {
      setSelectedReports([]);
      return;
    }

    // Check if "All Pages" is being selected
    const allPagesSelected = newValue.some((item) => item.value === 0);

    if (allPagesSelected) {
      setSelectedReports([]);
    } else {
      const filteredSelection = newValue.filter((item) => item.value !== 0);
      setSelectedReports(filteredSelection.map((item) => item.value));
    }
  };

  const handleDeleteReport = (valueToDelete) => {
    setSelectedReports(
      selectedReports.filter((item) => item !== valueToDelete)
    );
  };

  const handleDateTypeChange = (_, newValue) => {
    if (!newValue) return;
    setDateType(newValue.value);

    const today = new Date();
    let start, end;

    switch (newValue.value) {
      case "today":
        start = startOfDay(today);
        end = endOfDay(today);
        break;
      case "yesterday":
        start = startOfDay(subDays(today, 1));
        end = endOfDay(subDays(today, 1));
        break;
      case "7days":
        start = startOfDay(subDays(today, 6));
        end = endOfDay(today);
        break;
      case "30days":
        start = startOfDay(subDays(today, 29));
        end = endOfDay(today);
        break;
      case "90days":
        start = startOfDay(subDays(today, 89));
        end = endOfDay(today);
        break;
      case "6months":
        start = startOfDay(subMonths(today, 6));
        end = endOfDay(today);
        break;
      case "1year":
        start = startOfDay(subMonths(today, 12));
        end = endOfDay(today);
        break;
      case "custom":
      default:
        start = today;
        end = today;
    }

    setFromDate(start);
    setToDate(end);
  };

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };
  const handleSubmit = async () => {
    const payload = {
      reportType: selectedReports.includes(0) ? 0 : selectedReports, // Send 0 for "All Pages" or array of selected types
      fromDate: formatDate(fromDate),
      toDate: formatDate(toDate),
    };
    const selectedReportLabels = reportTypes
      .filter((item) =>
        Array.isArray(payload.reportType)
          ? payload.reportType.includes(item.value)
          : item.value === payload.reportType
      )
      .map((item) => item.label)
      .join(",");

    try {
      const blob = await getReport({
        fromDate: payload.fromDate,
        toDate: payload.toDate,
        page: selectedReportLabels,
        type: 0,
      }).unwrap();
      downloadFile(blob, "AuditReport.xlsx");
      toast.success("Audit Report Generated successfully!");
      setDateType("today");

      setFromDate(new Date());
      setToDate(new Date());
    } catch (error) {
      console.log(error);

      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Looks like there are no AuditReports right now.";

      toast.error(errorMsg);
    }
  };

  const selectedReportObjects = selectedReports.map((value) =>
    reportTypes.find((report) => report.value === value)
  );

  const isAllPagesSelected = selectedReports.includes(0);

  return (
    <div>
      <div className="max-w-8xl">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden p-6">
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Audit Report</h2>
            <p className="text-gray-600 mt-2">
              Select report types and date range to generate reports
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Report Types Section */}
            <div className="space-y-4">
              <Autocomplete
                multiple
                options={reportTypes}
                getOptionLabel={(option) => option.label}
                value={selectedReportObjects}
                onChange={handleReportChange}
                disableCloseOnSelect
                disabled={isAllPagesSelected}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Choose Page Types"
                    placeholder={
                      isAllPagesSelected
                        ? "All Pages selected"
                        : "Select reports..."
                    }
                    size="medium"
                  />
                )}
                renderOption={(props, option, { selected }) => (
                  <li {...props} className="flex items-center space-x-3 p-2">
                    <span className="text-gray-600">{option.icon}</span>
                    <span className={selected ? "font-semibold" : ""}>
                      {option.label}
                    </span>
                  </li>
                )}
                fullWidth
              />

              {/* Selected Chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedReportObjects.map((report) => (
                  <Chip
                    key={report.value}
                    label={
                      <div className="flex items-center space-x-1">
                        <span>{report.icon}</span>
                        <span>{report.label}</span>
                      </div>
                    }
                    onDelete={() => handleDeleteReport(report.value)}
                    color={report.value === 0 ? "white" : "default"}
                    variant={report.value === 0 ? "filled" : "outlined"}
                    className="flex items-center space-x-1"
                  />
                ))}
              </div>

              {/* {isAllPagesSelected && (
                <div className="text-sm text-neutral-50 bg-blue-50 p-3 rounded-lg">
                  <strong>All Pages</strong> is selected. All report types will
                  be included in the generated report.
                </div>
              )} */}
            </div>

            {/* Date Range Section */}
            <div className="space-y-4">
              <Autocomplete
                options={dateOptions}
                getOptionLabel={(option) => option.label}
                value={dateOptions.find((item) => item.value === dateType)}
                onChange={handleDateTypeChange}
                renderInput={(params) => (
                  <TextField {...params} label="Date Range" size="medium" />
                )}
                fullWidth
              />

              {/* Custom Date Pickers */}
              {dateType === "custom" && (
                <LocalizationProvider
                  dateAdapter={AdapterDateFns}
                  adapterLocale={enGB}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DatePicker
                      label="From Date"
                      value={fromDate}
                      onChange={(newValue) => setFromDate(newValue)}
                      inputFormat="dd/MM/yyyy"
                      maxDate={new Date()}
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
                    <DatePicker
                      label="To Date"
                      value={toDate}
                      onChange={(newValue) => setToDate(newValue)}
                      inputFormat="dd/MM/yyyy"
                      minDate={fromDate}
                      maxDate={new Date()}
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
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-8 flex justify-end border-t border-gray-200 mt-8">
            <Button
              onClick={handleSubmit}
              isLoading={isReportLoading}
              disabled={isReportLoading || selectedReports.length === 0}
              className="min-w-[160px]"
            >
              Generate Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditReport;
