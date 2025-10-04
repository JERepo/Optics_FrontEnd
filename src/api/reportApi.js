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
  }),
});

export const { useLazyGetOrderReportQuery } = reportApi;
