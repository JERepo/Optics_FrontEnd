import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout, setCredentials } from "../features/auth/authSlice";

// prepare headers for authorization
const baseQuery = fetchBaseQuery({
  baseUrl: 
    import.meta.env.MODE === "development"
      ? import.meta.env.VITE_LOCAL
      :import.meta.env.VITE_DEV,
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

  if (result.error?.status === 401) {
    // try to refresh the token
    const refreshResult = await baseQuery(
      {
        url: "/api/v1/auth/refresh-token",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      api,
      extraOptions
    );

    // if (refreshResult?.data?.accessToken) {
    //   api.dispatch(setCredentials(refreshResult.data));
    //   result = await baseQuery(args, api, extraOptions);
    // } else {
    //   console.error("Token refresh failed:", refreshResult);
    //   api.dispatch(logout());
    // }
  }

  return result;
};
