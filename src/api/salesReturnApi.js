import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const salesReturnApi = createApi({
  reducerPath: "salesReturnApi",
  baseQuery: customBaseQuery,
  tagTypes: ["SalesReturn"],
  endpoints: (builder) => ({
    getBatchBarCode: builder.mutation({
      query: ({ batchCode, locationId }) => ({
        url: `/api/v1/contact-lens-details/fetch`,
        method: "POST",
        body: {
          Barcode: batchCode,
          locationId: locationId,
        },
      }),
    }),
    getPatients: builder.query({
      query: ({ locationId }) => ({
        url: `/api/v1/sales-Return/Patient/${locationId}`,
      }),
    }),
    salesMasterDraft: builder.mutation({
      query: ({ userId, locationId, payload }) => ({
        url: `api/v1/sales-Return/salesmasterdraft?ApplicationUserId=${userId}&locationID=${locationId}`,
        method: "POST",
        body: payload,
      }),
    }),
    getPowerDetails: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/contact-lens/lensdetails`,
        method: "POST",
        body: payload,
      }),
    }),
    getPriceByCoatingComboId: builder.query({
      query: ({ coatingComboId, locationId }) => ({
        url: `/api/v1/optical-lens/getpricebycotingcomboid?CoatingComboId=${coatingComboId}&LocationID=${locationId}`,
      }),
    }),
    saveProducts: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/sales-Return/salesdetails`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["SalesReturn"],
    }),
    getSavedSalesReturn: builder.query({
      query: ({ id, locationId }) => ({
        url: `/api/v1/sales-Return/getsalesdetails/${id}?locationid=${locationId}`,
      }),
      providesTags: ["SalesReturn"],
    }),
    completeSaleReturn: builder.mutation({
      query: ({ id, userId, locationId, payload }) => ({
        url: `/api/v1/sales-Return/deleteupdate?SRMasterID=${id}&ApplicationUserId=${userId}&locationID=${locationId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["SalesReturn"],
    }),
    getAllSalesReturn: builder.query({
      query: () => ({
        url: `/api/v1/sales-Return/salesmasters`,
      }),
      providesTags: ["SalesReturn"],
    }),
    getSalesReturnById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/sales-Return/salesmaster/${id}`,
      }),
    }),
    getMainSalesById: builder.query({
      query: ({ id, locationId }) => ({
        url: `/api/v1/sales-Return/getsalesdetails/${id}?locationid=${locationId}`,
      }),
    }),
    getDraftDataById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/sales-Return/getbyPatient/${id}`,
      }),
    }),
    getInvoiceDetails: builder.query({
      query: ({ productType, detailId, batchCode, patientId, locationId }) => ({
        url: `/api/v1/sales-Return/invoicedetails?productType=${productType}&DetailId=${detailId}&batchCode=${batchCode}&PatientID=${patientId}&locationId=${locationId}`,
      }),
    }),
    getBatchesForCL: builder.query({
      query: ({ detailId, locationId }) => ({
        url: `/api/v1/contact-lens/batchcode/${detailId}?locationid=${locationId}`,
      }),
    }),
    // OPTICAL LENS
    getOlInvoiceDetails: builder.query({
      query: ({ id, locationId }) => ({
        url: `/api/v1/sales-Return/Olinvoicedetails?PatientID=${id}&locationId=${locationId}`,
      }),
    }),
    getDraftDetails: builder.query({
      query: ({ userId, companyId, patientId, reference }) => ({
        url: `/api/v1/sales-Return/getsalesreturn?ApplicationUserId=${userId}&CompanyId=${companyId}&PatientId=${patientId}&ReferenceApplicable=${reference}`,
      }),
    }),
    printPdf: builder.query({
      query: ({returnId,companyId}) => ({
        url: `/api/v1/pdf/credit-note-receipt?salesReturnId=${returnId}&companyId=${companyId}`,
        responseHandler: (response) => response.blob(),
      }),
      transformResponse: (response) => response,
    }),
     salesReturnConfirm: builder.mutation({
      query: (formData) => ({
        url: `/api/v1/emailwa/Sr`,
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const {
  useGetBatchBarCodeMutation,
  useGetPatientsQuery,
  useSalesMasterDraftMutation,
  useGetPowerDetailsMutation,
  useGetPriceByCoatingComboIdQuery,
  useSaveProductsMutation,
  useGetSavedSalesReturnQuery,
  useCompleteSaleReturnMutation,
  useGetAllSalesReturnQuery,
  useGetSalesReturnByIdQuery,
  useGetMainSalesByIdQuery,
  useGetDraftDataByIdQuery,
  useLazyGetInvoiceDetailsQuery,
  useLazyGetBatchesForCLQuery,
  useGetOlInvoiceDetailsQuery,
  useLazyGetDraftDetailsQuery,
  useLazyPrintPdfQuery,
  useSalesReturnConfirmMutation
} = salesReturnApi;
