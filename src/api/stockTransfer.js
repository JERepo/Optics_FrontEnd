import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const stockTransferApi = createApi({
  reducerPath: "stockTransferApi",
  baseQuery: customBaseQuery,
  tagTypes: ["StockTransfer", "StockTransferIn"],
  endpoints: (builder) => ({
    saveStockTransferDraft: builder.mutation({
      query: ({ toCompanyId, fromCompanyId, userId }) => ({
        url: `/api/v1/stock-transfer/draft?ToCompanyId=${toCompanyId}&FromCompanyId=${fromCompanyId}&ApplicationUserID=${userId}`,
        method: "POST",
      }),
    }),
    getDraftData: builder.query({
      query: ({ toCompanyId, fromCompanyId, userId }) => ({
        url: `/api/v1/stock-transfer/stockoutmain?ToCompanyId=${toCompanyId}&FromCompanyId=${fromCompanyId}&ApplicationUserID=${userId}`,
      }),
    }),
    saveStockDetails: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/stock-transfer/stockoutdetails`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["StockTransfer"],
    }),
    getStockLocations: builder.query({
      query: ({ locationId }) => ({
        url: `/api/v1/location-settings/billingcity?locationId=${locationId}`,
      }),
    }),
    getStockOutDetails: builder.query({
      query: ({ mainId, locationId }) => ({
        url: `/api/v1/stock-transfer/bymainid/${mainId}?locationId=${locationId}`,
      }),
      providesTags: ["StockTransfer"],
    }),
    updateStockTransferOut: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/stock-transfer/completestocktransfer`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["StockTransfer"],
    }),
    getOLByBarcode: builder.query({
      query: ({ barcode, locationId }) => ({
        url: `/api/v1/optical-lens/getbybarcode?Barcode=${barcode}&LocationID=${locationId}`,
      }),
    }),
    getOlDetailsByOlDetailId: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/optical-lens/getOlbyDetailId`,
        method: "POST",
        body: payload,
      }),
    }),
    getAllStockOutDetails: builder.query({
      query: () => ({
        url: `/api/v1/stock-transfer/out/all`,
      }),
      providesTags: ["StockTransfer"],
    }),
    getStockTransferOutById: builder.query({
      query: ({ mainId, locationId }) => ({
        url: `/api/v1/stock-transfer/out/getbyid/${mainId}?locationId=${locationId}`,
      }),
    }),

    // Stock transfer In APIs

    getStockOutDataForStockIn: builder.query({
      query: ({ mainId, locationId }) => ({
        url: `/api/v1/stock-transfer/inbyout/details?STOutMainId=${mainId}&locationId=${locationId}`,
      }),
    }),

    getSelectStock: builder.query({
      query: ({ locationId }) => ({
        url: `/api/v1/stock-transfer/openstocktransfer?locationId=${locationId}`,
      }),
    }),
    saveSTKIDraft: builder.mutation({
      query: ({ locationId, mainId, userId }) => ({
        url: `/api/v1/stock-transfer/in/draft?locationId=${locationId}&STOutMainId=${mainId}&applicationUserId=${userId}`,
        method: "POST",
      }),
    }),
    getSTKIDraftData: builder.query({
      query: ({ locationId, mainId, userId }) => ({
        url: `/api/v1/stock-transfer/in/getallmain?CompanyId=${locationId}&STOutMainId=${mainId}&ApplicationUserId=${userId}`,
      }),
    }),
    saveSTI: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/stock-transfer/in/stockdetails`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["StockTransferIn"],
    }),
    getStockInDetails: builder.query({
      query: ({ mainId, locationId }) => ({
        url: `/api/v1/stock-transfer/in/details?STInMainID=${mainId}&locationId=${locationId}`,
      }),
      providesTags: ["StockTransferIn"],
    }),
    deleteUpdateSTKIn: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/stock-transfer/completestockintransfer`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["StockTransferIn"],
    }),
    getAllStockInData: builder.query({
      query: () => ({
        url: `/api/v1/stock-transfer/in/all`,
      }),
    }),
    getStockInById: builder.query({
      query: ({ mainId, locationId }) => ({
        url: `/api/v1/stock-transfer/in/details?STInMainID=${mainId}&locationId=${locationId}`,
      }),
    }),
    printPdf: builder.query({
      query: ({ mainId, companyId }) => ({
        url: `/api/v1/pdf/sto-receipt?STOId=${mainId}&companyId=${companyId}`,
        responseHandler: (response) => response.blob(),
      }),
      transformResponse: (response) => response,
    }),
    printLabels: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/pdf/stout-qr`,
        method :"POST",
        body : payload,
        responseHandler: (response) => response.blob(),
      }),
      transformResponse: (response) => response,
    }),
  }),
});

export const {
  useSaveStockTransferDraftMutation,
  useLazyGetDraftDataQuery,
  useSaveStockDetailsMutation,
  useGetStockLocationsQuery,
  useGetStockOutDetailsQuery,
  useUpdateStockTransferOutMutation,
  useLazyGetOLByBarcodeQuery,
  useGetOlDetailsByOlDetailIdMutation,
  useGetAllStockOutDetailsQuery,
  useGetStockTransferOutByIdQuery,
  useLazyPrintPdfQuery,
  usePrintLabelsMutation,

  // Stock transfer In APIs
  useGetStockOutDataForStockInQuery,
  useGetSelectStockQuery,
  useSaveSTKIDraftMutation,
  useLazyGetSTKIDraftDataQuery,
  useSaveSTIMutation,
  useGetStockInDetailsQuery,
  useDeleteUpdateSTKInMutation,
  useGetAllStockInDataQuery,
  useGetStockInByIdQuery,
} = stockTransferApi;
