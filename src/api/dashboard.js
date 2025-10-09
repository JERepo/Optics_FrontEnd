import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    getOrderData: builder.query({
      query: ({ companies, range }) => ({
        url: `/api/v1/dashboard/order-data?range=${range}&companies=${companies}`,
      }),
    }),
    getPurchaseData: builder.query({
      query: ({ companies, range }) => ({
        url: `/api/v1/dashboard/purchase-data?range=${range}&companies=${companies}`,
      }),
    }),
    getSalesData: builder.query({
      query: ({ companies, range }) => ({
        url: `/api/v1/dashboard/sales-data?range=${range}&companies=${companies}`,
      }),
    }),
    getStatsData: builder.query({
      query: ({ companies }) => ({
        url: `/api/v1/dashboard/stats-data?companies=${companies}`,
      }),
    }),
  }),
});

export const {
  useGetOrderDataQuery,
  useGetPurchaseDataQuery,
  useGetSalesDataQuery,
  useGetStatsDataQuery,
} = dashboardApi;
