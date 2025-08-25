import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const stockTransferApi = createApi({
  reducerPath: "stockTransferApi",
  baseQuery: customBaseQuery,
  tagTypes: ["StockTransfer"],
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
    }),
    getStockTransferOutById:builder.query({
      query:({mainId,locationId}) => ({
        url :  `/api/v1/stock-transfer/out/getbyid/${mainId}?locationId=${locationId}`
      })
    })
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
  useGetStockTransferOutByIdQuery
} = stockTransferApi;
