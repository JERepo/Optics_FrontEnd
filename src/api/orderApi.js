import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    searchCustomer: builder.query({
      query: ({ input }) => ({
        url: `/api/v1/customer/search?name=${input}&mobile=""`,
      }),
    }),

    createNewCustomer: builder.mutation({
      query: ({ userId, payload }) => ({
        url: `/api/v1/customer/createinorder?ApplicationUserId=${userId}`,
        method: "POST",
        body: payload,
      }),
    }),
    createSalesOrder: builder.mutation({
      query: ({ userId, payload }) => ({
        url: `/api/v1/order/create?ApplicationUserId=${userId}`,
        method: "POST",
        body: payload,
      }),
    }),
    getOrder: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/order?patientId=${id}`,
      }),
    }),
    getCustomerContactDetails: builder.query({
      query: () => ({
        url: `/api/v1/customer/getdetailsall`,
      }),
    }),
    getByBarCode: builder.query({
      query: ({ barcode, locationId }) => ({
        url: `/api/v1/frame-main/getbybarcode?barcode=${barcode}&locationId=${locationId}`,
      }),
    }),
    getByBrandAndModal: builder.query({
      query: ({ brand, modal, locationId }) => ({
        url: `/api/v1/frame-main/getbybrandmodel?brand=${brand}&locationId=${locationId}&search=${modal}`,
      }),
    }),
    saveFrame: builder.mutation({
      query: ({ orderId, payload }) => ({
        url: `/api/v1/order/add-frame/${orderId}`,
        method: "POST",
        body: payload,
      }),
    }),
    getOrderDetails: builder.query({
      query: ({ patientId,customerId }) => ({
        url: `/api/v1/order?patientId=${patientId}&CustomerId=${customerId}`,
      }),
    }),
    getByBrandAndProductName: builder.query({
      query: ({ brand, product, locationId }) => ({
        url: `/api/v1/other-products/getbybrand/product?brandId=${brand}&locationId=${locationId}&productName=${product}`,
      }),
    }),
    fetchBarcodeForAccessory: builder.query({
      query: ({ barcode, locationId }) => ({
        url: `/api/v1/other-products/getby/barcode?barcode=${barcode}&locationId=${locationId}`,
      }),
    }),
    saveAccessory: builder.mutation({
      query: ({ orderId, payload }) => ({
        url: `/api/v1/order/add-otherproduct/${orderId}`,
        method: "POST",
        body: payload,
      }),
    }),

    getModalities: builder.query({
      query: () => ({
        url: `/api/v1/contact-lens/Modalities`,
      }),
    }),
    getProductNamesByModality: builder.query({
      query: ({ brandId, modalityId }) => ({
        url: `/api/v1/contact-lens/product?BrandId=${brandId}&ModalityId=${modalityId}`,
      }),
    }),
    getColour: builder.query({
      query: ({ clMainId }) => ({
        url: `/api/v1/contact-lens/colour?CLMainId=${clMainId}`,
      }),
    }),
    getPowerDetails: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/contact-lens/lensdetails`,
        method: "POST",
        body: payload,
      }),
    }),

    saveContactLens: builder.mutation({
      query: ({ orderId, payload }) => ({
        url: `/api/v1/order/add-contactlens/${orderId}`,
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const {
  useLazySearchCustomerQuery,
  useCreateNewCustomerMutation,
  useCreateSalesOrderMutation,
  useGetOrderQuery,
  useGetCustomerContactDetailsQuery,
  useLazyGetByBarCodeQuery,
  useLazyGetByBrandAndModalQuery,
  useSaveFrameMutation,
  useGetOrderDetailsQuery,
  useLazyGetByBrandAndProductNameQuery,
  useSaveAccessoryMutation,
  useLazyFetchBarcodeForAccessoryQuery,
  useGetModalitiesQuery,
  useGetProductNamesByModalityQuery,
  useGetColourQuery,
  useGetPowerDetailsMutation,
  useSaveContactLensMutation,
} = orderApi;
