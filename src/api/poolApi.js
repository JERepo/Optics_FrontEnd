import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const poolApi = createApi({
  reducerPath: "poolApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Pool"],
  endpoints: (builder) => ({
    getAllPool: builder.query({
      query: () => "/api/v1/pool",
      providesTags: ["Pool"],
    }),

    createPool: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/pool/create?ApplicationUserID=${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Pool"],
    }),
    updatePool: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/pool/update/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Pool"],
    }),
    getPoolById: builder.query({
      query: ({ id }) => `/api/v1/pool/${id}`,
    }),
    deActivate: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/pool/deactivate/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Pool"],
    }),
  }),
});

export const {
  useGetAllPoolQuery,
  useCreatePoolMutation,
  useGetPoolByIdQuery,
  useUpdatePoolMutation,
  useDeActivateMutation,
} = poolApi;
