import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const salesPersonApi = createApi({
  reducerPath: "salesPersonApi",
  baseQuery: customBaseQuery,
  tagTypes: ["SalesPerson"],
  endpoints: (builder) => ({
    getAllSalesPersons: builder.query({
      query: () => ({
        url: "/api/v1/sale-persons",
      }),
      providesTags: ["SalesPerson"],
    }),
    getSalesPersonById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/sale-persons/getbyid/${id}`,
      }),
      providesTags : ["SalesPerson"]
    }),
    createSalesPerson: builder.mutation({
      query: ({ userId, payload }) => ({
        url: `/api/v1/sale-persons/create?ApplicationUserId=${userId}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["SalesPerson"],
    }),
    updateSalesPerson: builder.mutation({
      query: ({ id, userId, payload }) => ({
        url: `/api/v1/sale-persons/update/${id}?ApplicationUserId=${userId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["SalesPerson"],
    }),
    deActivate: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/sale-persons/deactivate/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["SalesPerson"],
    }),
  }),
});

export const {
  useGetAllSalesPersonsQuery,
  useGetSalesPersonByIdQuery,
  useCreateSalesPersonMutation,
  useUpdateSalesPersonMutation,
  useDeActivateMutation,
} = salesPersonApi;
