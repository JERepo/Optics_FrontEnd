import { Autocomplete, TextField } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { enGB } from "date-fns/locale";
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import Button from "../../components/ui/Button";
import { useLazyGetDailyPaymentsQuery } from "../../api/reportApi";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useGetAllLocationsQuery } from "../../api/roleManagementApi";

const PAYMENT_TYPES = [
  "Cash",
  "Card",
  "UPI",
  "Cheque",
  "Bank Transfer",
  "Gift Voucher",
  // "Advance",
];

const CustomerPaymentReport = () => {
  const { user, hasMultipleLocations } = useSelector((state) => state.auth);
  const [fromDate, setFromDate] = useState(new Date());
  const [showPastReports, setShowPastReports] = useState(false);

  const [getReport, { data: reportData, isFetching: isReportLoading }] =
    useLazyGetDailyPaymentsQuery();

  const { data: allLocations } = useGetAllLocationsQuery();

  const allowedLocationIds = hasMultipleLocations || [];

  // Map location names to IDs
  const locationNameToIdMap = React.useMemo(() => {
    if (!allLocations?.data) return {};
    return Object.fromEntries(
      allLocations.data.map((loc) => [loc.LocationName, loc.Id])
    );
  }, [allLocations?.data]);

  // Fetch today's report on mount
  useEffect(() => {
    fetchTodaysReport();
  }, []);

  const fetchTodaysReport = async () => {
    try {
      await getReport().unwrap();
    } catch (error) {
      console.error("Failed to fetch today's report:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      await getReport().unwrap();
      toast.success("Payment Report Generated successfully!");
    } catch (error) {
      const errorMsg = error?.data?.message || "Failed to fetch payments.";
      toast.error(errorMsg);
    }
  };

  const transformPayments = (data = [], selectedDate, allowedIds = []) => {
    const grouped = {};
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

    const filteredData = data?.filter((item) => {
      const matchesDate = item["Payment Received Date"] === selectedDateStr;
      const locationId = locationNameToIdMap[item.Location];
      if (locationId === undefined) return false;

      const hasAccess =
        allowedIds.length === 0 || allowedIds.includes(locationId);
      return matchesDate && hasAccess;
    });

    filteredData?.forEach((item) => {
      const location = item.Location;
      const paymentMode = item["Payment Mode"];
      const total = parseFloat(item["Total Collection"]) || 0;

      if (!grouped[location]) grouped[location] = {};
      if (!grouped[location][selectedDateStr])
        grouped[location][selectedDateStr] = {};
      grouped[location][selectedDateStr][paymentMode] =
        (grouped[location][selectedDateStr][paymentMode] || 0) + total;
    });

    Object.keys(grouped).forEach((location) => {
      const dateKey = selectedDateStr;
      if (!grouped[location][dateKey]) grouped[location][dateKey] = {};
      PAYMENT_TYPES.forEach((type) => {
        if (!(type in grouped[location][dateKey]))
          grouped[location][dateKey][type] = 0;
      });
    });

    return grouped;
  };

  const todaysData = transformPayments(
    reportData?.data,
    new Date(),
    allowedLocationIds
  );
  const pastData = transformPayments(
    reportData?.data,
    fromDate,
    allowedLocationIds
  );

  // Determine if user has access to past reports
  const hasLocationAccess = allowedLocationIds.length > 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Daily Payment Report
            </h2>
          
          </div>

          {/* Today's Report */}
          <div className="border-b border-gray-200">
            <div className="px-6 py-4 bg-neutral-50">
              <h3 className="text-lg font-medium text-neutral-900">
                Today's Payment Report ({format(new Date(), "dd/MM/yyyy")})
              </h3>
            </div>

            <div className="p-6">
              {isReportLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-600"></div>
                  <p className="mt-2 text-gray-600">
                    Loading today's payments...
                  </p>
                </div>
              ) : Object.keys(todaysData).length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-600 font-medium">No payments today</p>
                </div>
              ) : (
                Object.entries(todaysData).map(([location, dates]) => (
                  <div
                    key={location}
                    className="border border-neutral-200 rounded-lg mb-4"
                  >
                    <div className="bg-neutral-100 px-4 py-3 border-b border-neutral-200">
                      <h3 className="text-lg font-medium text-neutral-900">
                        {location}
                      </h3>
                    </div>
                    <div className="p-4">
                      {Object.entries(dates).map(([date, payments]) => (
                        <div
                          key={date}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                        >
                          {PAYMENT_TYPES.map((type) => (
                            <div
                              key={type}
                              className="border border-neutral-200 rounded-lg p-4 bg-white"
                            >
                              <div className="text-sm font-medium text-neutral-600 mb-1">
                                {type}
                              </div>
                              <div className="text-xl font-semibold text-neutral-900">
                                ₹{" "}
                                {payments[type].toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Past Reports */}
          {hasLocationAccess && (
            <>
              <div className="px-6 py-4 border-b border-gray-200">
                <button
                  onClick={() => setShowPastReports(!showPastReports)}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <span className="font-medium">Select Date to view past Payment Collection Data</span>
                  <svg
                    className={`w-4 h-4 transform transition-transform ${
                      showPastReports ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>

              {showPastReports && (
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                    <div className="flex-1 max-w-xs">
                      <LocalizationProvider
                        dateAdapter={AdapterDateFns}
                        adapterLocale={enGB}
                      >
                        <DatePicker
                          label="Select Past Date"
                          value={fromDate}
                          onChange={setFromDate}
                          maxDate={
                            new Date(
                              new Date().setDate(new Date().getDate() - 1)
                            )
                          }
                          slotProps={{
                            textField: {
                              size: "small",
                              fullWidth: true,
                              variant: "outlined",
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </div>
                    <Button
                      onClick={handleSubmit}
                      isLoading={isReportLoading}
                      disabled={isReportLoading}
                      className="min-w-[140px]"
                    >
                      Generate Report
                    </Button>
                  </div>
                </div>
              )}

              {showPastReports && (
                <div className="p-6">
                  {Object.keys(pastData).length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-600 font-medium">
                        No payments found for {format(fromDate, "dd/MM/yyyy")}
                      </p>
                    </div>
                  ) : (
                    Object.entries(pastData).map(([location, dates]) => (
                      <div
                        key={location}
                        className="border border-gray-200 rounded-lg mb-4"
                      >
                        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900">
                            {location}
                          </h3>
                        </div>
                        <div className="p-4">
                          {Object.entries(dates).map(([date, payments]) => (
                            <div
                              key={date}
                              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                            >
                              {PAYMENT_TYPES.map((type) => (
                                <div
                                  key={type}
                                  className="border border-gray-200 rounded-lg p-4 bg-white"
                                >
                                  <div className="text-sm font-medium text-neutral-600 mb-1">
                                    {type}
                                  </div>
                                  <div className="text-xl font-semibold text-neutral-900">
                                    ₹{" "}
                                    {payments[type].toLocaleString("en-IN", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerPaymentReport;
