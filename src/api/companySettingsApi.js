import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const companySettingsApi = createApi({
  reducerPath: "companySettingsApi",
  baseQuery: customBaseQuery,
  tagTypes: ["CompanySettings"],
  endpoints: (builder) => ({
    getCompanySettings: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/location-settings/getbyid/${id}`,
        method: "GET",
      }),
      providesTags: ["CompanySettings"],
    }),
    getAllPools: builder.query({
      query: () => ({
        url: `/api/v1/location-settings/getpool`,
      }),
    }),
    updateSettings: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/location-settings/updateLocationSettings`,
        method: "PUT",
        body: payload,
      }),
    }),
    getTaxes: builder.query({
      query: () => ({
        url: `/api/v1/location-settings/taxes`,
      }),
    }),
  }),
});

export const {
  useGetCompanySettingsQuery,
  useGetAllPoolsQuery,
  useUpdateSettingsMutation,
  useGetTaxesQuery
} = companySettingsApi;
