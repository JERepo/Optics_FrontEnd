// src/api/searchStock.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { ThirdPartyQuery } from "./ThirdPartyQuery";

export const searchStock = createApi({
  reducerPath: "searchStock",
  baseQuery: ThirdPartyQuery,
  endpoints: (builder) => ({
    getFrameStock: builder.query({
      query: (queryString) => ({
        url: `/api/v1/frame-main/framesearch${queryString}`,
      }),
    }),
    getAccessoryStock: builder.query({
      query: (queryString) => ({
        url: `/api/v1/other-products/get/stocks${queryString}`,
      }),
    }),
  }),
});

export const { 
  useGetFrameStockQuery,
  useLazyGetAccessoryStockQuery
} = searchStock;