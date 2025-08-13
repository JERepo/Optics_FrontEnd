import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const salesReturnApi = createApi({
  reducerPath: "salesReturnApi",
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    getBatchBarCode: builder.mutation({
      query: (batchCode) => ({
        url: `/api/v1/contact-lens-details/fetch`,
        method: "POST",
        body: {
          Barcode: batchCode,
        },
      }),
    }),
  }),
});

export const { useGetBatchBarCodeMutation } = salesReturnApi;
