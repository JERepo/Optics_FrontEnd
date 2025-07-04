import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const brandApi = createApi({
  reducerPath: "brandApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Brand"],
  endpoints: (builder) => ({
    createBrandCategory: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/brand-category/create?ApplicationUserId=${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags : ["Brand"]
    }),
    getAllBrandCats: builder.query({
      query: () => ({
        url: `/api/v1/brand-category/getall/active`,
      }),
      providesTags: ["Brand"],
    }),
    getBrandCatById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/brand-category/${id}`,
      }),
    }),
    updateBrandCategory: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/brand-category/update/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags : ["Brand"]
    }),
    deActivate: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/brand-category/deactivate/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Brand"],
    }),
  }),
});

export const {
  useCreateBrandCategoryMutation,
  useGetAllBrandCatsQuery,
  useGetBrandCatByIdQuery,
  useDeActivateMutation,
  useUpdateBrandCategoryMutation,
} = brandApi;
