import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const vendorPaymentApi = createApi({
  reducerPath: "vendorPaymentApi",
  baseQuery: customBaseQuery,
  tagTypes: ["VendorPayment"],
  endpoints: (builder) => ({
    getVendorPayment: builder.query({
      query: ({ companyId, vendorId }) => ({
        url: `/api/v1/vendor-payment/vendorPaymentDetails?companyId=${companyId}&vendorId=${vendorId}`,
      }),
    }),
    saveVendorPayment: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/vendor-payment/saveVendorPayment`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["VendorPayment"],
    }),
    saveAdvanceAmount: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/vendor-payment/collectVendorAdvance`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["VendorPayment"],
    }),
    getAllCP: builder.query({
      query: () => ({
        url: `/api/v1/vendor-payment/getallcp`,
      }),
      providesTags: ["VendorPayment"],
    }),
    getPaymentsById: builder.query({
      query: (id) => ({
        url: `/api/v1/vendor-payment/getCPDetailById/${id}`,
      }),
    }),
    getAdvanceDataForVendor: builder.query({
      query: ({ vendorId, companyId }) => ({
        url: `/api/v1/vendor-payment/getAdvancebyVendor?vendorId=${vendorId}&companyId=${companyId}`,
      }),
    }),
    getPODetails: builder.query({
      query: ({ vendorId, companyId }) => ({
        url: `/api/v1/vendor-payment/podetailsforvendor?vendorId=${vendorId}&companyId=${companyId}`,
      }),
    }),
  }),
});

export const {
  useLazyGetVendorPaymentQuery,
  useSaveVendorPaymentMutation,
  useSaveAdvanceAmountMutation,
  useGetAdvanceDataForVendorQuery,
  useGetPODetailsQuery
} = vendorPaymentApi;
