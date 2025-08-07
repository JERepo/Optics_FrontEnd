import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const InvoiceApi = createApi({
  reducerPath: "InvoiceApi",
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    getPatients: builder.query({
      query: ({ companyId }) => ({
        url: `/api/v1/invoice/Patient/${companyId}`,
      }),
    }),
    getAllOrderMaster: builder.query({
      query: ({ patientId }) => ({
        url: `/api/v1/invoice/ordermaster/${patientId}`,
      }),
    }),

    getBatchDetails: builder.query({
      query: ({ clBatchId, locationId }) => ({
        url: `/api/v1/invoice/BatchDetails/${clBatchId}?Location=${locationId}`,
      }),
    }),

    getProductDetails: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/order/productdetails`,
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const {
  useGetPatientsQuery,
  useGetAllOrderMasterQuery,
  useLazyGetBatchDetailsQuery,
  useGetProductDetailsMutation,
} = InvoiceApi;
