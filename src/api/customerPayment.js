import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const cusomerPaymentApi = createApi({
  reducerPath: "cusomerPaymentApi",
  baseQuery: customBaseQuery,
  tagTypes : ["CustomerPayment"],
  endpoints: (builder) => ({
    getCustomerPayment: builder.query({
      query: ({ companyId, customerId }) => ({
        url: `/api/v1/customer-payment/customerPaymentDetails?companyId=${companyId}&customerId=${customerId}`,
      }),
    }),
    saveCustomerPayment: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/customer-payment/saveCustomerPayment`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags : ["CustomerPayment"]
    }),
    saveAdvanceAmount: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/customer-payment/collectadvance`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags : ["CustomerPayment"]
    }),
    getAllCP: builder.query({
      query: () => ({
        url: `/api/v1/customer-payment/getallcp`,
      }),
      providesTags : ["CustomerPayment"]
    }),
    getPaymentsById:builder.query({
      query :(id) => ({
        url : `/api/v1/customer-payment/getCPDetailById/${id}`
      })
    })
  }),
});

export const {
  useLazyGetCustomerPaymentQuery,
  useSaveCustomerPaymentMutation,
  useSaveAdvanceAmountMutation,
  useGetAllCPQuery,
  useGetPaymentsByIdQuery
} = cusomerPaymentApi;
