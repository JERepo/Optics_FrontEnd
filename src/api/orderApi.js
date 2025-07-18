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
  }),
});

export const { useLazySearchCustomerQuery } = orderApi;
