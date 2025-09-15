import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const customerRefundApi = createApi({
  reducerPath: "customerRefundApi",
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    getAdvanceData: builder.query({
      query: ({ customerId, companyId }) => ({
        url: `/api/v1/customer-refund/advancebyCm?customerId=${customerId}&CompanyId=${companyId}`,
      }),
    }),
    getAdvanceDataForInvoice: builder.query({
      query: ({ customerId, companyId }) => ({
        url: `/api/v1/customer-refund/advancebyCm?customerId=${customerId}&CompanyId=${companyId}`,
      }),
    }),
    createCustomerRefund: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/customer-refund/create`,
        method: "POST",
        body: payload,
      }),
    }),

    getAllCR: builder.query({
      query: () => ({
        url: `/api/v1/customer-refund/getAllCR`,
      }),
    }),

    getCRById :builder.query({
      query : (id) => ({
        url : `/api/v1/customer-refund/getCRById/${id}`
      })
    })
  }),
});

export const {
  useLazyGetAdvanceDataQuery,
  useCreateCustomerRefundMutation,
  useGetAdvanceDataForInvoiceQuery,
  useGetAllCRQuery,
  useGetCRByIdQuery
} = customerRefundApi;
