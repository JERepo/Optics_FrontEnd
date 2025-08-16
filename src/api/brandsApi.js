import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const brandsApi = createApi({
  reducerPath: "brandsApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Brands"],
  endpoints: (builder) => ({
    createBrands: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/brands/create?ApplicationUserId=${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Brands"],
    }),
    getAllBrands: builder.query({
      query: () => ({
        url: `/api/v1/brands`,
      }),
      providesTags: ["Brands"],
      transformResponse: (response) => {
        const sorted = (response?.data || []).sort((a, b) =>
          (a?.BrandName || "").localeCompare(b?.BrandName || "", "en", {
            numeric: true,
            sensitivity: "base",
          })
        );
        return sorted;
      },
    }),

    getBrandById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/brands/${id}`,
      }),
      providesTags: ["Brands"],
    }),
    updateBrands: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/brands/update/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Brands"],
    }),
    deActivate: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/brands/deactivate/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Brands"],
    }),
  }),
});

export const {
  useCreateBrandsMutation,
  useGetAllBrandsQuery,
  useUpdateBrandsMutation,
  useDeActivateMutation,
  useGetBrandByIdQuery,
} = brandsApi;
