import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const vendorApi = createApi({
  reducerPath: "vendorApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Vendor"],
  endpoints: (builder) => ({
    getAllVendor: builder.query({
      query: () => ({
        url: `/api/v1/vendor/`,
      }),
      providesTags: ["Vendor"],
    }),
    deActivate: builder.mutation({
      query: ({ id, appId, payload }) => ({
        url: `/api/v1/vendor/status-update/${id}?ApplicationUserId=${appId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Vendor"],
    }),
    createVendor: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/vendor/create?ApplicationUserId=${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Vendor"],
    }),
    updateVendor: builder.mutation({
      query: ({ id, payload }) => ({
        query: `/api/v1/vendor/update/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Vendor"],
    }),
  }),
});

export const {
  useGetAllVendorQuery,
  useDeActivateMutation,
  useCreateVendorMutation,
  useUpdateVendorMutation,
} = vendorApi;
