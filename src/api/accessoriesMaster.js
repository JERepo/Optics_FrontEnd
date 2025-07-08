import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const accessoriesMaster = createApi({
  reducerPath: "accessoriesMaster",
  baseQuery: customBaseQuery,
  tagTypes: ["Accessory"],
  endpoints: (builder) => ({
    createAccessoriesMaster: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/other-products/create?ApplicationUserId=${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Accessory"],
    }),
    getBarCode: builder.query({
      query: () => ({
        url: `/api/v1/other-products/get/barcode`,
      }),
    }),
    getTax: builder.query({
      query: () => ({
        url: `/api/v1/other-products/get/taxmain`,
      }),
    }),
    getAllMaster: builder.query({
      query: () => ({
        url: `/api/v1/other-products`,
      }),
      providesTags: ["Accessory"],
    }),
    getMasterById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/other-products/getbyid/${id}`,
      }),
    }),
    updateMaster: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/other-products/update/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Accessory"],
    }),
    deActivate: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/other-products/deactivate/details/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Accessory"],
    }),
    deActivateMain: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/other-products/deactivate/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Accessory"],
    }),
  }),
});

export const {
  useCreateAccessoriesMasterMutation,
  useGetBarCodeQuery,
  useGetTaxQuery,
  useGetAllMasterQuery,
  useGetMasterByIdQuery,
  useUpdateMasterMutation,
  useDeActivateMutation,
  useDeActivateMainMutation,
} = accessoriesMaster;
