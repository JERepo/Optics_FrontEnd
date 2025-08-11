import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const InvoiceApi = createApi({
  reducerPath: "InvoiceApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Invoice"],
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
      invalidatesTags: ["Invoice"],
    }),
    saveBatchDetails: builder.mutation({
      query: ({ orderDetailedId, locationId, payload }) => ({
        url: `/api/v1/invoice/batch/${orderDetailedId}/${locationId}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Invoice"],
    }),

    generateInvoice: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/invoice/generateinvoice/Dc`,
        method: "POST",
        body: payload,
      }),
    }),
    getAllInvoice: builder.query({
      query: () => ({
        url: `/api/v1/invoice`,
      }),
    }),
    getInvoiceById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/invoice/getbyid/${id}`,
      }),
    }),
    getInvoiceDetails: builder.query({
      query: ({ detailId }) => ({
        url: `/api/v1/invoice/details/${detailId}`,
      }),
    }),
  }),
});

export const {
  useGetPatientsQuery,
  useGetAllOrderMasterQuery,
  useLazyGetBatchDetailsQuery,
  useGetProductDetailsMutation,
  useSaveBatchDetailsMutation,
  useGenerateInvoiceMutation,
  useGetAllInvoiceQuery,
  useGetInvoiceByIdQuery,
  useGetInvoiceDetailsQuery
} = InvoiceApi;
