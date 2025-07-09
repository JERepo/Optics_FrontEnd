import React, { useEffect } from "react";
import HasAccess from "../../components/HasPermission";
import { ROLES } from "../../utils/constants/roles";
import { useDispatch, useSelector } from "react-redux";
import { useGetUserByIdQuery } from "../../api/roleManagementApi";
import { setLocations } from "../../features/auth/authSlice";

const AdminDashboard = () => {
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const authUser = useSelector((state) => state.auth.user);

  const userId = authUser.Id;

  const {
    data: userLocationData,
    isSuccess: isUserLoaded,
    isLoading,
  } = useGetUserByIdQuery(
    { id: userId },
    { skip: !isAuthenticated || !userId }
  );

  useEffect(() => {
    if (isUserLoaded && userLocationData?.data?.Locations) {
      const locationArray =
        userLocationData.data.Locations.split(",").map(Number);

      console.log("📦 Location array:", locationArray);

      if (locationArray.length > 1) {
        dispatch(setLocations(locationArray));
        console.log("📣 Dispatched setLocations with:", locationArray);
      }
    }
  }, [isUserLoaded, userLocationData, dispatch]);
  if (isLoading) return <h1>Loading...</h1>;
  return <div>Dashboard</div>;
};

export default AdminDashboard;
