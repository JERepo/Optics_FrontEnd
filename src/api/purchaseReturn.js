import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const purchaseReturnApi = createApi({
  reducerPath: "purchaseReturnApi",
  baseQuery: customBaseQuery,
  tagTypes: ["PurchaseReturn"],
  endpoints: (builder) => ({
    getVendors: builder.query({
      query: ({ locationId }) => ({
        url: `/api/v1/purchase-Return/vender/${locationId}`,
      }),
    }),
    getDraftData: builder.query({
      query: ({ vendorId, companyId, userId }) => ({
        url: `/api/v1/purchase-Return/getpurchasereturn?vendorId=${vendorId}&companyId=${companyId}&applicationUserId=${userId}`,
      }),
    }),
    saveDraft: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/purchase-Return/purchasereturn/draft`,
        method: "POST",
        body: payload,
      }),
    }),
    savePurchaseReturnProduct: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/purchase-Return/Prdetails`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["PurchaseReturn"],
    }),
    getPurchaseDetails: builder.query({
      query: ({ mainId, locationId }) => ({
        url: `/api/v1/purchase-Return/getPrdetails/${mainId}?locationId=${locationId}`,
      }),
      providesTags: ["PurchaseReturn"],
    }),
    deleteUpdatePR: builder.mutation({
      query: ({ prId, userId, locationId, payload }) => ({
        url: `/api/v1/purchase-Return/deleteupdate?PRMasterId=${prId}&ApplicationUserId=${userId}&locationId=${locationId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["PurchaseReturn"],
    }),
    getAllPR: builder.query({
      query: () => ({
        url: `/api/v1/purchase-Return/PRmasters`,
      }),
      providesTags: ["PurchaseReturn"],
    }),
    getPRById: builder.query({
      query: (id) => ({
        url: `/api/v1/purchase-Return/PR/${id}`,
      }),
    }),
    getPRDataForView: builder.query({
      query: ({ id, locationId }) => ({
        url: `/api/v1/purchase-Return/getPrdetails/${id}?locationId=${locationId}`,
      }),
    }),
    printPdf: builder.query({
      query: ({ prId, companyId }) => ({
        url: `/api/v1/pdf/debit-note-receipt?purchaseReturnId=${prId}&companyId=${companyId}`,
        responseHandler: (response) => response.blob(),
      }),
      transformResponse: (response) => response,
    }),

    getOlSupplierNo: builder.query({
      query: ({ vendorId, companyId }) => ({
        url: `/api/v1/purchase-Return/orderno?vendorId=${vendorId}&companyId=${companyId}`,
      }),
    }),
  }),
});

export const {
  useGetVendorsQuery,
  useLazyGetDraftDataQuery,
  useSaveDraftMutation,
  useSavePurchaseReturnProductMutation,
  useGetPurchaseDetailsQuery,
  useDeleteUpdatePRMutation,
  useGetAllPRQuery,
  useGetPRByIdQuery,
  useGetPRDataForViewQuery,
  useLazyPrintPdfQuery,
  useGetOlSupplierNoQuery
} = purchaseReturnApi;
