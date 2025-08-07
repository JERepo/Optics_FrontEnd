import React, { useEffect } from "react";
import HasAccess from "../../components/HasPermission";
import { ROLES } from "../../utils/constants/roles";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetAllLocationsQuery,
  useGetLocationByIdQuery,
  useGetUserByIdQuery,
} from "../../api/roleManagementApi";
import { setCompanyId, setLocations } from "../../features/auth/authSlice";
import { useState } from "react";

const AdminDashboard = () => {
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const authUser = useSelector((state) => state.auth.user);
  const { data: allLocations } = useGetAllLocationsQuery();
  const [location, setLocation] = useState(null);

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
        dispatch(setLocations(locationArray));
      } else {
        setLocation(userLocationData.data.Locations[0]);
        dispatch(setLocations(userLocationData.data.Locations));
      }
    }
  }, [isUserLoaded, userLocationData, dispatch]);
  if (isLoading) return <h1>Loading...</h1>;
  return <div>Dashboard</div>;
};

export default AdminDashboard;
