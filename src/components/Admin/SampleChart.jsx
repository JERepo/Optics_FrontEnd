import React, { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useGetAllLocationsQuery } from "../../api/roleManagementApi";
import { useGetOrderDataQuery } from "../../api/dashboard";

const SampleChart = ({ companies }) => {
  const [selectedRange, setSelectedRange] = useState("daily");
  const [activeCities, setActiveCities] = useState({});
  const { data: allLocations } = useGetAllLocationsQuery();

  const {
    data: chartData = [],
    isLoading,
    isFetching,
    error,
  } = useGetOrderDataQuery(
    { companies, range: selectedRange },
    { skip: !companies?.length || !allLocations?.data }
  );

  const normalizedChartData = useMemo(() => {
    if (!chartData?.data) return [];

    if (selectedRange === "daily") {
      return chartData.data.map((d) => ({
        date: d.Date,
        companyId: d.CompanyID,
        orderValue: Number(d.OrderValue),
      }));
    }

    if (selectedRange === "weekly") {
      return chartData.data.map((d) => ({
        date: d["Week Start Date"],
        weekEndDate: d["Week End Date"],
        companyId: d.CompanyID,
        orderValue: Number(d["OrderValue"]),
      }));
    }

    if (selectedRange === "6months") {
      return chartData.data.map((d) => ({
        date: d["Month"],
        monthStart: d["Month Start"],
        monthEnd: d["Month End"],
        companyId: d.CompanyID,
        orderValue: Number(d["OrderValue"]),
      }));
    }

    return [];
  }, [chartData, selectedRange]);

  // Generate color palette dynamically
  const generateColor = (index) => {
    const colors = [
      "#0EA5E9",
      "#0369A1",
      "#0D9488",
      "#10B981",
      "#3B82F6",
      "#8B5CF6",
      "#EC4899",
      "#F97316",
      "#14B8A6",
      "#64748B",
    ];
    return colors[index % colors.length];
  };

  // Map company IDs to location names
  const idToName = useMemo(() => {
    if (!allLocations?.data || !companies?.length) return {};

    const mapping = {};
    companies.forEach((id) => {
      const loc = allLocations.data.find((loc) => loc.Id === id);
      if (loc) mapping[id] = loc.LocationName || loc.CompanyName;
    });
    return mapping;
  }, [allLocations, companies]);

  const locationNames = useMemo(() => {
    return companies.map((id) => idToName[id]).filter((name) => name); // Filter out undefined/null names
  }, [idToName, companies]);

  // Initialize activeCities state
  useEffect(() => {
    if (locationNames.length === 0) return;
    const initialState = {};
    locationNames.forEach((name) => {
      initialState[name] = true;
    });
    setActiveCities(initialState);
  }, [locationNames]);

  const formatLabel = (dateStr, range) => {
    const date = new Date(dateStr);

    if (range === "daily") {
      return `${String(date.getDate()).padStart(2, "0")}/${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
    }

    if (range === "weekly") {
      return `${String(date.getDate()).padStart(2, "0")}/${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
    }

    if (range === "6months") {
      return dateStr;
    }

    return dateStr;
  };

  const mergedData = useMemo(() => {
    if (!normalizedChartData.length) return [];

    const periods = [...new Set(normalizedChartData.map((d) => d.date))].sort(
      (a, b) => new Date(a) - new Date(b)
    );

    return periods.map((period) => {
      const row = { label: formatLabel(period, selectedRange) };
      const periodData = normalizedChartData.filter((d) => d.date === period);

      periodData.forEach((d) => {
        const name = idToName[d.companyId];
        if (name && companies.includes(d.companyId)) {
          row[name] = d.orderValue;
        }
      });

      // Fill missing with 0 for only selected companies
      locationNames.forEach((name) => {
        if (!(name in row)) row[name] = 0;
      });

      return row;
    });
  }, [normalizedChartData, idToName, selectedRange, companies]);

  const toggleCity = (city) => {
    setActiveCities((prev) => ({
      ...prev,
      [city]: !prev[city],
    }));
  };

  const getRangeDisplayName = (range) => {
    const rangeNames = {
      daily: "Daily",
      weekly: "Weekly",
      "6months": "Last 6 Months",
    };
    return rangeNames[range] || range;
  };

  const formatIndianCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 min-w-48 backdrop-blur-sm">
          <p className="font-bold text-neutral-800 mb-3 border-b pb-2 text-sm">
            {label}
          </p>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600 font-medium">
                    {entry.name}:
                  </span>
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ color: entry.color }}
                >
                  {formatIndianCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Enhanced Loader Component
  const ChartLoader = () => (
    <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="mb-4 lg:mb-0">
          <div className="h-8 bg-gray-200 rounded-lg w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="h-12 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
      </div>

      {/* Toggle Buttons Skeleton */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse"
          ></div>
        ))}
      </div>

      {/* Chart Area Skeleton */}
      <div className="w-full h-80 bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mx-auto"></div>
          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse mx-auto mt-2"></div>
        </div>
      </div>

      {/* Summary Skeleton */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-16 bg-gray-100 rounded-lg animate-pulse"
          ></div>
        ))}
      </div>
    </div>
  );

  if (isLoading || isFetching) {
    return <ChartLoader />;
  }

  if (error) {
    return (
      <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Data
          </h3>
          <p className="text-gray-600">
            There was a problem loading the chart data. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-200 -z-1 mb-5">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="mb-4 lg:mb-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Report
          </h2>
          <p className="text-gray-600 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {getRangeDisplayName(selectedRange)} performance across locations
          </p>
        </div>

        <div className="relative">
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-12 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer font-medium text-sm hover:border-neutral-300 transition-colors"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="6months">6 Months</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
            <svg
              className="h-5 w-5"
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
          </div>
        </div>
      </div>

      {/* Enhanced City Toggles */}
      <div className="flex flex-wrap gap-3 mb-8">
        {locationNames.map((city, i) => (
          <button
            key={city}
            onClick={() => toggleCity(city)}
            className={`px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-3 text-sm border-2 ${
              activeCities[city]
                ? "bg-blue-50 text-blue-800 border-blue-200 "
                : "bg-gray-50 text-gray-500 border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300"
            }`}
          >
            <div
              className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
              style={{
                backgroundColor: activeCities[city]
                  ? generateColor(i)
                  : "#94A3B8",
              }}
            />
            {city}
          </button>
        ))}
      </div>

      {/* Enhanced Chart Container */}
      <div className="w-full h-80 rounded-2xl border border-neutral-200">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={mergedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E2E8F0"
              strokeOpacity={0.7}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
              tickFormatter={(value) =>
                `₹${
                  value >= 1000
                    ? `${(value / 1000).toFixed(0)}k`
                    : value.toLocaleString()
                }`
              }
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#DBDBDB",
                strokeWidth: 2,
                strokeDasharray: "5 5",
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={10}
              wrapperStyle={{
                paddingBottom: "20px",
                fontSize: "13px",
                fontWeight: "600",
              }}
              formatter={(value) => (
                <span className="text-neutral-700">{value}</span>
              )}
            />
            {locationNames.map((city, i) =>
              activeCities[city] ? (
                <Line
                  key={city}
                  type="monotone"
                  dataKey={city}
                  stroke={generateColor(i)}
                  strokeWidth={3}
                  dot={{
                    fill: generateColor(i),
                    strokeWidth: 2,
                    r: 5,
                    stroke: "#fff",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                  }}
                  activeDot={{
                    r: 8,
                    fill: generateColor(i),
                    stroke: "#fff",
                    strokeWidth: 2,
                    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))",
                  }}
                  strokeLinecap="round"
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {locationNames.map((city, i) => {
          if (!activeCities[city]) return null;
          const total = mergedData.reduce(
            (sum, item) => sum + (item[city] || 0),
            0
          );
          return (
            <div
              key={city}
              className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full border-2 border-white shadow-sm group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: generateColor(i) }}
                  />
                  <span className="font-bold text-neutral-700 text-sm">
                    {city}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-neutral-700 group-hover:text-gray-700 transition-colors">
                    {formatIndianCurrency(total)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SampleChart;