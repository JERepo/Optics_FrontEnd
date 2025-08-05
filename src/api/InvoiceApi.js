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
  }),
});

export const { useGetPatientsQuery, useGetAllOrderMasterQuery, useLazyGetBatchDetailsQuery } = InvoiceApi;
