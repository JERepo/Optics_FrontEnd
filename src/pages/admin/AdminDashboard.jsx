import React, { Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetAllLocationsQuery,
  useGetLocationByIdQuery,
  useGetUserByIdQuery,
} from "../../api/roleManagementApi";
import { setCompanyId, setLocations } from "../../features/auth/authSlice";
import { useState } from "react";
import Loader from "../../components/ui/Loader";
import SampleChart from "../../components/Admin/SampleChart";
import PurchaseChart from "../../components/Admin/PurchaseChart";
import SalesBarChart from "../../components/Admin/SalesBarChart";
import { useGetStatsDataQuery } from "../../api/dashboard";
import HasPermission from "../../components/HasPermission";
// Professional icons as SVG components with smaller size
const MetricIcons = {
  Orders: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  ),
  Purchases: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
  Sales: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  "Sales Return": (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  ),
};

const MetricCard = ({ locationName, metric, value, amount }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-2 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-50 rounded-lg">{MetricIcons[metric]}</div>
        <div>
          <h3 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
            {metric}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{locationName}</p>
        </div>
      </div>
    </div>

    <div className="flex justify-between items-center px-2">
      <div className="text-left">
        <p className="text-2xl font-semibold text-neutral-700">
          {value?.toLocaleString() || 0}
        </p>
        <p className="text-xs text-gray-500 mt-1">Count</p>
      </div>

      <div className="text-right">
        <p className="text-2xl font-semibold text-neutral-700">
          ₹{amount?.toLocaleString() || 0}
        </p>
        <p className="text-xs text-gray-500 mt-1">Value</p>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { hasMultipleLocations } = useSelector((state) => state.auth);

  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const authUser = useSelector((state) => state.auth.user);
  const { data: allLocations } = useGetAllLocationsQuery();
  const [location, setLocation] = useState(null);
  const [accLocations, setAccLocations] = useState(null);
  const {
    data: statsData = [],
    isFetching,
    error,
  } = useGetStatsDataQuery(
    { companies: accLocations },
    { skip: !accLocations?.length || !allLocations?.data }
  );

  const userId = authUser.Id;

  const {
    data: userLocationData,
    isSuccess: isUserLoaded,
    isLoading,
  } = useGetUserByIdQuery(
    { id: userId },
    { skip: !isAuthenticated || !userId }
  );

  const { data: locationById, isLoading: isLocationLoading } =
    useGetLocationByIdQuery({ id: location }, { skip: !location });
  const companyId = locationById?.data?.data.Id;

  useEffect(() => {
    setCompanyId(companyId);
  }, [location, locationById, isLocationLoading]);

  useEffect(() => {
    if (isUserLoaded && userLocationData?.data?.Locations) {
      const locationArray =
        userLocationData.data.Locations.split(",").map(Number);
      if (locationArray.length > 1) {
        setAccLocations(locationArray);
        dispatch(setLocations(locationArray));
      } else {
        setAccLocations(locationArray);
        setLocation(userLocationData.data.Locations[0]);
        dispatch(setLocations(userLocationData.data.Locations));
      }
    }
  }, [isUserLoaded, userLocationData, dispatch]);

  if (isLoading || !accLocations?.length >= 1) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader color="black" width="w-10" height="h-10" />
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-8xl">
        <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6">
          <div className="flex justify-between items-center mb-8">
            <div className="text-neutral-800 text-2xl font-semibold">
              Dashboard
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {accLocations.map((companyId) => {
              const companyData = statsData?.data?.find(
                (d) => d.CompanyID === companyId
              );

              const locationInfo = allLocations?.data?.find(
                (loc) => loc.Id === companyId
              );
              const locationName =
                locationInfo?.LocationName || `Location ${companyId}`;

              const metrics = [
                {
                  label: "Orders",
                  value: companyData?.TotalOrderNo,
                  amount: companyData?.TotalOrderValue,
                  permission: { module: "Order", action: "view" },
                },
                {
                  label: "Purchases",
                  value: companyData?.TotalPurchaseNo,
                  amount: companyData?.TotalPurchaseValue,
                  permission: {
                    module: ["GRN DC", "GRN", "Purchase-Report"],
                    action: "view",
                  },
                },
                {
                  label: "Sales",
                  value: companyData?.TotalSalesNo,
                  amount: companyData?.TotalSalesValue,
                  permission: {
                    module: ["Invoice", "Sales-Report"],
                    action: "view",
                  },
                },
              ];

              return metrics.map((metric) => (
                <HasPermission
                  key={`${companyId}-${metric.label}`}
                  module={metric.permission.module}
                  action={metric.permission.action}
                >
                  <MetricCard
                    locationName={locationName}
                    metric={metric.label}
                    value={metric.value}
                    amount={metric.amount}
                  />
                </HasPermission>
              ));
            })}
          </div>

          <div className="space-y-8">
            <HasPermission module="Order" action="view">
              {accLocations && <SampleChart companies={accLocations} />}
            </HasPermission>
            <HasPermission
              module={["GRN DC", "GRN", "Purchase-Report"]}
              action="view"
            >
              {accLocations && <PurchaseChart companies={accLocations} />}
            </HasPermission>
            <HasPermission
              module={[
                "Invoice",
                "Sales-Report",
                "SalesReturn",
                "Sales-Return-Report",
              ]}
              action="view"
            >
              {accLocations && <SalesBarChart companies={accLocations} />}
            </HasPermission>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
