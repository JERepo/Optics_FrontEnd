import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    getAllIndices: builder.query({
      query: () => ({
        url: `/api/v1/opfitting-standard/allIndices`,
      }),
    }),
  }),
});

export const { useGetAllIndicesQuery } = customerApi;
