import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
export const externalApi = createApi({
  reducerPath: "externalApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "",
  }),
  endpoints: (builder) => ({
    verifyGST: builder.query({
      query: ({ clientId, gstNo }) => ({
        url: `https://connectje.in/api/v1/gst/verify/${clientId}/${gstNo.toUpperCase()}`,
      }),
    }),
  }),
});

export const { useVerifyGSTQuery } = externalApi;
