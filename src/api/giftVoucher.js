import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const giftVoucher = createApi({
  reducerPath: "giftVoucher",
  baseQuery: customBaseQuery,
  tagTypes: ["GiftVoucher"],
  endpoints: (builder) => ({
    generateGiftVoucher: builder.query({
      query: () => ({
        url: `/api/v1/gift-voucher/giftvouchercode`,
      }),
    }),
    getAllCustomersForVoucher: builder.query({
      query: ({ locationId }) => ({
        url: `/api/v1/sales-Return/Patient/${locationId}`,
      }),
    }),
    createGVVoucher: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/gift-voucher/create`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["GiftVoucher"],
    }),
    getAllGiftVouchers: builder.query({
      query: () => ({
        url: `/api/v1/gift-voucher/getall`,
      }),
      providesTags: ["GiftVoucher"],
    }),
    validateGiftVoucher: builder.query({
      query: ({ GVCode, CustomerID }) => ({
        url: `/api/v1/gift-voucher/getgvdetail?GVCode=${GVCode}&CustomerID=${CustomerID}`,
      }),
    }),
    activateVoucherCode: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/gift-voucher/active/giftvouchercode`,
        method: "PUT",
        body: payload,
      }),
    }),
    getSampleExcel: builder.query({
      query: () => ({
        url: `/api/v1/gift-voucher/sampleexcel`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),
    uploadFile: builder.mutation({
      query: (formData) => ({
        url: `/api/v1/gift-voucher/activate-vouchers-excel`,
        method: "PUT",
        body: formData,
      }),
    }),
    createGiftVoucherForRefund: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/gift-voucher/create/refund`,
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const {
  useLazyGenerateGiftVoucherQuery,
  useGetAllCustomersForVoucherQuery,
  useCreateGVVoucherMutation,
  useGetAllGiftVouchersQuery,
  useLazyValidateGiftVoucherQuery,
  useActivateVoucherCodeMutation,
  useLazyGetSampleExcelQuery,
  useUploadFileMutation,
  useCreateGiftVoucherForRefundMutation
} = giftVoucher;
