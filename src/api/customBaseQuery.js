import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout, setCredentials } from "../features/auth/authSlice";

// prepare headers for authorization
const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:5001",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});


// use this custom base query to have any refresh token or something
export const customBaseQuery = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    // optionally: refresh token here
    const refreshResult = await baseQuery('/auth/refresh', api, extraOptions);

    if (refreshResult.data?.token) {
      // update token
      api.dispatch(setCredentials(refreshResult.data));

      // retry original query
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

