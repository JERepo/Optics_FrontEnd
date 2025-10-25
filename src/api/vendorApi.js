import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const vendorApi = createApi({
  reducerPath: "vendorApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Vendor"],
  endpoints: (builder) => ({
    getAllVendor: builder.mutation({
      query: (payload) => ({
        url: `/api/v1/vendor/`,
        method: "POST",
        body: payload,
      }),
      providesTags: ["Vendor"],
    }),
    getAllvendorByLocation: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/vendor/all-vendors/${id}`
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

    getVendorById: builder.mutation({
      query: (payload) => ({
        url: `/api/v1/vendor`,
        method: "POST",
        body: payload,
      }),
    }),
    updateVendor: builder.mutation({
      query: ({ id, userId, payload }) => {
        return {
          url: `/api/v1/vendor/update/${id}?ApplicationUserId=${userId}`,
          method: "PUT",
          body: payload,
        };
      },
    }),
  }),
});

export const {
  useGetAllVendorMutation,
  useGetAllvendorByLocationQuery,
  useDeActivateMutation,
  useCreateVendorMutation,
  useGetVendorByIdMutation,
  useUpdateVendorMutation
} = vendorApi;
