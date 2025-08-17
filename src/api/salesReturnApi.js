import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const salesReturnApi = createApi({
  reducerPath: "salesReturnApi",
  baseQuery: customBaseQuery,
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
    }),
    getSavedSalesReturn: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/sales-Return/getsalesdetails/${id}`,
      }),
    }),
    completeSaleRetun: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/sales-Return/deleteupdate?SRMasterID=${id}`,
        method: "PUT",
        body: payload,
      }),
    }),
    getAllSalesReturn: builder.query({
      query: () => ({
        url: `/api/v1/sales-Return/salesmasters`,
      }),
    }),
    getSalesReturnById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/sales-Return/salesmaster/${id}`,
      }),
    }),
    getMainSalesById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/sales-Return/getsalesdetails/${id}`,
      }),
    }),
    getDraftDataById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/sales-Return/getbyPatient/${id}`,
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
  useCompleteSaleRetunMutation,
  useGetAllSalesReturnQuery,
  useGetSalesReturnByIdQuery,
  useGetMainSalesByIdQuery,
  useGetDraftDataByIdQuery
} = salesReturnApi;
