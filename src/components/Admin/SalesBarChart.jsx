import React, { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useGetAllLocationsQuery } from "../../api/roleManagementApi";
import { useGetSalesDataQuery } from "../../api/dashboard";
import convertAmountToWords from "../../utils/helpers";
import { hasPermission } from "../../utils/permissionUtils";
import { useSelector } from "react-redux";

const SalesBarChart = ({ companies }) => {
  const { access } = useSelector((state) => state.auth);
  const [selectedRange, setSelectedRange] = useState("daily");
  const [activeCities, setActiveCities] = useState({});
  const { data: allLocations } = useGetAllLocationsQuery();
  const salesPermission = hasPermission(
    access,
    ["Invoice", "Sales-Report"],
    "view"
  );
  const salesReturnPermission = hasPermission(
    access,
    ["SalesReturn", "Sales-Return-Report"],
    "view"
  );

  const {
    data: chartData = [],
    isLoading,
    isFetching,
    error,
  } = useGetSalesDataQuery(
    { companies, range: selectedRange },
    { skip: !companies?.length || !allLocations?.data }
  );

  // Map company IDs to readable names
  const idToName = useMemo(() => {
    if (!allLocations?.data || !companies?.length) return {};
    const mapping = {};
    companies.forEach((id) => {
      const loc = allLocations.data.find((loc) => loc.Id === id);
      if (loc) mapping[id] = loc.LocationName || loc.CompanyName;
    });
    return mapping;
  }, [allLocations, companies]);

  const locationNames = useMemo(
    () => companies.map((id) => idToName[id]).filter(Boolean),
    [idToName, companies]
  );

  useEffect(() => {
    if (!locationNames.length) return;
    const initial = {};
    locationNames.forEach((name) => (initial[name] = true));
    setActiveCities(initial);
  }, [locationNames]);

  // Format label based on range type
  const formatLabel = (d) => {
    if (selectedRange === "daily") {
      const date = new Date(d.Date);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
      });
    } else if (selectedRange === "weekly") {
      const start = new Date(d["Week Start Date"]);
      const end = new Date(d["Week End Date"]);
      const startStr = start.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
      });
      const endStr = end.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
      });
      return `${startStr} - ${endStr}`;
    } else if (selectedRange === "6months") {
      return d.Month;
    }
    return "";
  };

  const normalizedData = useMemo(() => {
    if (!chartData?.data) return [];
    return chartData.data.map((d) => {
      let sales = Number(d.SalesValue);
      let returns = Number(d.SalesReturn);
      if (sales === 0) sales = 0.0001;
      if (returns === 0) returns = 0.0001;
      return {
        label: formatLabel(d),
        companyId: d.CompanyID,
        sales,
        returns,
      };
    });
  }, [chartData, selectedRange]);

  const mergedData = useMemo(() => {
    if (!normalizedData.length) return [];
    let periods = [...new Set(normalizedData.map((d) => d.label))];

    // Sort periods chronologically ascending
    periods.sort((a, b) => {
      let da, db;
      const currentYear = new Date().getFullYear(); // Use current year for parsing
      if (selectedRange === "daily") {
        const [d1, m1] = a.split("/");
        da = new Date(currentYear, m1 - 1, d1);
        const [d2, m2] = b.split("/");
        db = new Date(currentYear, m2 - 1, d2);
      } else if (selectedRange === "weekly") {
        const [startA] = a.split(" - ");
        const [d1, m1] = startA.split("/");
        da = new Date(currentYear, m1 - 1, d1);
        const [startB] = b.split(" - ");
        const [d2, m2] = startB.split("/");
        db = new Date(currentYear, m2 - 1, d2);
      } else if (selectedRange === "6months") {
        const [monA, yrA] = a.split(" ");
        const monthIndexA = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ].indexOf(monA);
        da = new Date(yrA, monthIndexA, 1);
        const [monB, yrB] = b.split(" ");
        const monthIndexB = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ].indexOf(monB);
        db = new Date(yrB, monthIndexB, 1);
      }
      return da - db;
    });

    return periods.map((period) => {
      const row = { label: period };
      const periodData = normalizedData.filter((d) => d.label === period);
      periodData.forEach((d) => {
        const name = idToName[d.companyId];
        if (name) {
          row[`${name}_Sales`] = d.sales;
          row[`${name}_Returns`] = d.returns;
        }
      });
      locationNames.forEach((name) => {
        if (!(`${name}_Sales` in row)) row[`${name}_Sales`] = 0.0001;
        if (!(`${name}_Returns` in row)) row[`${name}_Returns`] = 0.0001;
      });
      return row;
    });
  }, [normalizedData, idToName, locationNames, selectedRange]);

  const generateColorPair = (index) => {
    const baseColors = [
      ["#1f77b4", "#aec7e8"], // Blue
      ["#ff7f0e", "#ffbb78"], // Orange
      ["#2ca02c", "#98df8a"], // Green
      ["#d62728", "#ff9896"], // Red
      ["#9467bd", "#c5b0d5"], // Purple
      ["#8c564b", "#c49c94"], // Brown
    ];
    return baseColors[index % baseColors.length];
  };
  // Calculate total sales and returns for stats cards
  const stats = useMemo(() => {
    if (!normalizedData.length) return { totalSales: 0, totalReturns: 0 };
    const totals = normalizedData.reduce(
      (acc, d) => {
        const sales = d.sales < 1 ? 0 : d.sales;
        const returns = d.returns < 1 ? 0 : d.returns;
        return {
          totalSales: acc.totalSales + sales,
          totalReturns: acc.totalReturns + returns,
        };
      },
      { totalSales: 0, totalReturns: 0 }
    );
    return totals;
  }, [normalizedData]);
  const formatINR = (v) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(v);

  const formatTick = (v) => {
    if (v < 1) return "₹0";
    if (v >= 1e9) return `₹${(v / 1e9).toFixed(0)}B`;
    if (v >= 1e6) return `₹${(v / 1e6).toFixed(0)}M`;
    if (v >= 1e3) return `₹${(v / 1e3).toFixed(0)}K`;
    return `₹${Math.round(v)}`;
  };

  const CustomTooltip = ({ active, payload, label }) =>
    active && payload?.length ? (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-200">
        <p className="font-semibold text-gray-800 border-b pb-2 mb-3">
          {label}
        </p>
        {payload.map((e, i) => {
          const value = e.value < 1 ? 0 : e.value;
          return (
            <div
              key={i}
              className="flex justify-between items-center text-sm mb-1"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: e.color }}
                ></span>
                <span className="text-gray-700">{e.name}</span>
              </div>
              <span className="font-medium text-gray-900">
                {formatINR(value)}
              </span>
            </div>
          );
        })}
      </div>
    ) : null;

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
  if (error)
    return (
      <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 text-red-600">
        Error loading data
      </div>
    );

  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-5">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Sales vs Returns
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedRange.charAt(0).toUpperCase() + selectedRange.slice(1)}{" "}
            period overview
          </p>
        </div>
        <select
          value={selectedRange}
          onChange={(e) => setSelectedRange(e.target.value)}
          className="mt-4 lg:mt-0 border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="6months">6 Months</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {locationNames.map((city, i) => {
          const [salesColor] = generateColorPair(i);
          return (
            <button
              key={city}
              onClick={() =>
                setActiveCities((p) => ({ ...p, [city]: !p[city] }))
              }
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCities[city]
                  ? "bg-blue-50 border border-blue-200 text-blue-700"
                  : "bg-gray-50 border border-gray-200 text-gray-500"
              }`}
            >
              <span
                className="w-2.5 h-2.5 inline-block rounded-md mr-2"
                style={{
                  backgroundColor: activeCities[city] ? salesColor : "#d1d5db",
                }}
              ></span>
              {city}
            </button>
          );
        })}
      </div>

      <div className="w-full h-96">
        <ResponsiveContainer>
          <BarChart
            data={mergedData}
            margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
              tickFormatter={formatTick}
            />
            <Tooltip content={<CustomTooltip />} />{" "}
            <Legend
              iconType="circle"
              iconSize={10}
              wrapperStyle={{ paddingTop: 10 }}
            />
            {locationNames.map((city, i) => {
              if (!activeCities[city]) return null;
              const [salesColor, returnColor] = generateColorPair(i);

              return (
                <React.Fragment key={city}>
                  {salesPermission && (
                    <Bar
                      dataKey={`${city}_Sales`}
                      name={`${city} Sales`}
                      fill={salesColor}
                      barSize={20}
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                  {salesReturnPermission && (
                    <Bar
                      dataKey={`${city}_Returns`}
                      name={`${city} Returns`}
                      fill={returnColor}
                      barSize={20}
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {salesPermission && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Total Sales</h3>
            <p className="text-xl font-semibold text-neutral-800 mt-1">
              {formatINR(stats.totalSales)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Total sales for {selectedRange} period
            </p>
          </div>
        )}

        {salesReturnPermission && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="text-sm font-medium text-neutral-700">
              Total Returns
            </h3>
            <p className="text-xl font-semibold text-neutral-800 mt-1">
              {formatINR(stats.totalReturns)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Total returns for {selectedRange} period
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesBarChart;
