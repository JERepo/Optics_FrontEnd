import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const InvoiceApi = createApi({
  reducerPath: "InvoiceApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Invoice", "EInvoice", "CancelInvoice"],
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

    // getProductDetails: builder.mutation({
    //   query: ({ payload }) => ({
    //     url: `/api/v1/order/productdetails`,
    //     method: "POST",
    //     body: payload,
    //   }),
    //   invalidatesTags: ["Invoice"],
    // }),
    getProductDetails: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/order/productdetails`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Invoice"],
      transformResponse: (response) => {
        // Sort by slNo ascending
        return response.sort((a, b) => a.slNo - b.slNo);
      },
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
      providesTags: ["CancelInvoice"],
    }),
    getInvoiceDetails: builder.query({
      query: ({ detailId, locationId }) => ({
        url: `/api/v1/invoice/details/${detailId}?locationId=${locationId}`,
      }),
      providesTags: ["CancelInvoice"],
    }),
    createEInvoice: builder.mutation({
      query: ({ companyId, userId, payload }) => ({
        url: `/api/v1/einvoice?companyId=${companyId}&ApplicationUserId=${userId}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["EInvoice"],
    }),
    getEInvoiceData: builder.query({
      query: ({ id, type }) => ({
        url: `/api/v1/einvoice?type=${type}&recordId=${id}`,
      }),
      providesTags: ["EInvoice"],
    }),

    getPaymentDetails: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/invoice/PaymentDetails/${id}`,
      }),
      providesTags: ["Invoice"],
    }),
    cancelInvoice: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/invoice/cancel`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["CancelInvoice"],
    }),
    printPdf: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/pdf/generate-invoice/${id}`,
        responseHandler: (response) => response.blob(),
      }),
      transformResponse: (response) => response,
    }),
    invoiceConfirm: builder.mutation({
      query: (formData) => ({
        url: `/api/v1/emailwa/invoice`,
        method: "POST",
        body: formData,
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
  useGetInvoiceDetailsQuery,
  useCreateEInvoiceMutation,
  useGetEInvoiceDataQuery,
  useGetPaymentDetailsQuery,
  useCancelInvoiceMutation,
  useLazyPrintPdfQuery,
  useInvoiceConfirmMutation
} = InvoiceApi;
