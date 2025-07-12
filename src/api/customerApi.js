import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Customer"],
  endpoints: (builder) => ({
    getAllIndices: builder.query({
      query: () => ({
        url: `/api/v1/opfitting-standard/allIndices`,
      }),
    }),
    getCompanyId: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/location-settings/getbyid/${id}`,
      }),
    }),
    createCustomer: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/customer/create?ApplicationUserId=${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Customer"],
    }),
    getAllCustomers: builder.query({
      query: () => ({
        url: `/api/v1/customer`,
      }),
      providesTags: ["Customer"],
    }),
    getCustomerById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/customer/byid/${id}`,
      }),
    }),
    deActivate: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/customer/deactivate/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Customer"],
    }),
    getPinCode: builder.query({
      query: ({ pincode }) => ({
        url: `/api/v1/createall/?pincode=${pincode}`,
      }),
    }),
    getStates: builder.query({
      query: () => ({
        url: `/api/v1/createall/get/allstate`,
      }),
    }),
    getCountries: builder.query({
      query: () => ({
        url: `/api/v1/createall/get/allcountry`,
      }),
    }),
    getIsd: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/createall/getisd/?BillCountryID=${id}`,
      }),
    }),
  }),
});

export const {
  useGetAllIndicesQuery,
  useGetCompanyIdQuery,
  useCreateCustomerMutation,
  useGetAllCustomersQuery,
  useGetCustomerByIdQuery,
  useDeActivateMutation,
  useLazyGetPinCodeQuery,
  useGetStatesQuery,
  useGetCountriesQuery,
  useGetIsdQuery,
} = customerApi;
