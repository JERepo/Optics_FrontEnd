import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const reportApi = createApi({
  reducerPath: "reportApi",
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    getOrderReport: builder.query({
      query: ({ fromDate, toDate, userId, type }) => ({
        url: `/api/v1/report/orderreport?fromDate=${fromDate}&toDate=${toDate}&userId=${userId}&type=${type}`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),
    getSalesReport: builder.query({
      query: ({ fromDate, toDate, userId }) => ({
        url: `/api/v1/report/salesreport?fromDate=${fromDate}&toDate=${toDate}&userId=${userId}`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),
    getSalesReturnReport: builder.query({
      query: ({ fromDate, toDate, userId, type }) => ({
        url: `/api/v1/report/salesreturnreport?fromDate=${fromDate}&toDate=${toDate}&userId=${userId}&type=${type}`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),
    getPurchaseReturnReport: builder.query({
      query: ({ fromDate, toDate, userId, type }) => ({
        url: `/api/v1/report/purchasereturnreport?fromDate=${fromDate}&toDate=${toDate}&userId=${userId}&type=${type}`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),
     getPurchaseReport: builder.query({
      query: ({ fromDate, toDate, userId, type }) => ({
        url: `/api/v1/report/purchasereport?fromDate=${fromDate}&toDate=${toDate}&userId=${userId}&type=${type}`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useLazyGetOrderReportQuery,
  useLazyGetSalesReportQuery,
  useLazyGetSalesReturnReportQuery,
  useLazyGetPurchaseReturnReportQuery,
  useLazyGetPurchaseReportQuery
} = reportApi;
