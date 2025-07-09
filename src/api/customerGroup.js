import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const customerGroup = createApi({
  reducerPath: "customerGroup",
  baseQuery: customBaseQuery,
  tagTypes: ["CustomerGroup"],
  endpoints: (builder) => ({
    createCustomerGroup: builder.mutation({
      query: ({ companyId, id, payload }) => ({
        url: `/api/v1/customer-groups/create?CompanyID=${companyId}&ApplicationUserId=${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["CustomerGroup"],
    }),
    getAllCustomerGroups: builder.query({
      query: () => ({
        url: `/api/v1/customer-groups`,
      }),
      providesTags: ["CustomerGroup"],
    }),
    getCustomerGroupById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/customer-groups/getbyid/${id}`,
      }),
      providesTags : ["CustomerGroup"]
    }),
    updateCustomerGroup: builder.mutation({
      query: ({ id,companyId, payload }) => ({
        url: `/api/v1/customer-groups/update/${id}?CompanyID=${companyId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["CustomerGroup"],
    }),
    deActivate: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/customer-groups/deactivate/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["CustomerGroup"],
    }),
  }),
});

export const {
  useCreateCustomerGroupMutation,
  useGetAllCustomerGroupsQuery,
  useGetCustomerGroupByIdQuery,
  useDeActivateMutation,
  useUpdateCustomerGroupMutation,
} = customerGroup;
