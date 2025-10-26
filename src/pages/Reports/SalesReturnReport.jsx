import { Autocomplete, TextField } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { enGB } from "date-fns/locale";
import React, { useState } from "react";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import Button from "../../components/ui/Button";
import { useLazyGetOrderReportQuery, useLazyGetSalesReportQuery, useLazyGetSalesReturnReportQuery } from "../../api/reportApi";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const reportTypes = [
  { value: 1, label: " Detailed Sales Return" },
  // { value: 1, label: "Tally Sales Return" },
  { value: 0, label: "Sales Return by Product Type" },
 
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

const SalesReturnReport = () => {
  const { user } = useSelector((state) => state.auth);
  const [reportType, setReportType] = useState(0);
  const [dateType, setDateType] = useState("today");
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());

  const [getReport, { isFetching: isReportLoading }] =
    useLazyGetSalesReturnReportQuery();

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
      reportType,
      fromDate: formatDate(fromDate),
      toDate: formatDate(toDate),
    };
    try {
      const blob = await getReport({
        fromDate: payload.fromDate,
        toDate: payload.toDate,
        userId: user.Id,
        type :reportType
      }).unwrap();
      downloadFile(blob, "Sales Return Report.xlsx");
      toast.success("Sales Return Report Generated successfully!");
      setFromDate(new Date())
      setToDate(new Date())
            setDateType("today")

    } catch (error) {
      console.log(error);

      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Looks like No sales return data found!";

      toast.error(errorMsg);
    }
  };

  return (
    <div>
      <div className="max-w-8xl">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden p-6">
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Sales Return Report</h2>
          </div>

          <div className="grid grid-cols-4 gap-5 items-center">
            <Autocomplete
              options={reportTypes}
              getOptionLabel={(option) => option.label}
              value={reportTypes.find((item) => item.value === reportType)}
              onChange={(_, newValue) => setReportType(newValue?.value || null)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Report Type"
                  size="medium"
                />
              )}
              fullWidth
            />

            <div className="py-5 border-b border-gray-100">
              <Autocomplete
                options={dateOptions}
                getOptionLabel={(option) => option.label}
                value={dateOptions.find((item) => item.value === dateType)}
                onChange={handleDateTypeChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Date Range"
                    size="medium"
                  />
                )}
                fullWidth
              />
            </div>

            {/* Custom Date Pickers */}
            {dateType === "custom" && (
              <div className="col-span-2">
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
                      maxDate={new Date()} // ✅ prevent future dates
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
                      maxDate={new Date()} // ✅ prevent future dates
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
            )}
          </div>
          {/* Submit Button */}
          <div className="pt-5 flex justify-end">
            <Button
              onClick={handleSubmit}
              isLoading={isReportLoading}
              disabled={isReportLoading}
            >
              Generate Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReturnReport;
