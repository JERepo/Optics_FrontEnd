import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const variationsApi = createApi({
  reducerPath: "variationsApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Variation"],
  endpoints: (builder) => ({
    createVariation: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/other-product-variation/create?ApplicationUserId=${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Variation"],
    }),
    getVariations: builder.query({
      query: () => ({
        url: `/api/v1/other-product-variation`,
      }),
      providesTags: ["Variation"],
    }),
    getVariationById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/other-product-variation/getbyid/${id}`,
      }),
      invalidatesTags: ["Variation"],
    }),
    updateVariation: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/other-product-variation/update/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Variation"],
    }),
    deActivate: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/other-product-variation/deactivate/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Variation"],
    }),
  }),
});

export const {
  useCreateVariationMutation,
  useGetVariationsQuery,
  useGetVariationByIdQuery,
  useUpdateVariationMutation,
  useDeActivateMutation,
} = variationsApi;


