import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout, setCredentials } from "../features/auth/authSlice";

// prepare headers for authorization
const baseQuery = fetchBaseQuery({
  baseUrl: "http://uat.opticstest.in",
  credentials: "include",
  prepareHeaders: (headers, { getState, endpoint }) => {
    const token = getState().auth.token;
    
    // Safer fallback: don't add token for login/refresh endpoints
    const url = typeof endpoint === "string" ? endpoint.toLowerCase() : "";
    if (!url.includes("login") && !url.includes("refresh") && token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

// use this custom base query to have any refresh token or something
export const customBaseQuery = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401 || result.error?.status === 403) {
    // try to refresh the token
    const refreshResult = await baseQuery(
      {
        url: "/api/v1/auth/refresh-token",
        method: "POST",
      },
      api,
      extraOptions
    );

    if (refreshResult.data?.token) {
      // save new token
      api.dispatch(setCredentials(refreshResult.data));

      // retry original request
      result = await baseQuery(args, api, extraOptions);
    } else {
      // refresh failed, logout user
      api.dispatch(logout());
    }
  }

  return result;
};

