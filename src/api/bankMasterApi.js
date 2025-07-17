import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const bankMasterApi = createApi({
  reducerPath: "bankMasterApi",
  baseQuery: customBaseQuery,
  tagTypes: ["BankMaster"],
  endpoints: (builder) => ({
    getAllBankMasters: builder.query({
      query: () => ({
        url: "/api/v1/bank-master/",
      }),
      providesTags: ["BankMaster"],
    }),
    getBankMasterById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/bank-master/${id}`,
      }),
    }),
    createBankMaster: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/bank-master/create`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["BankMaster"],
    }),
    updateBankMaster: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/bank-master/update/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["BankMaster"],
    }),
    deActivate: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/bank-master/update-status/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["BankMaster"],
    }),
  }),
});

export const {
  useGetAllBankMastersQuery,
  useGetBankMasterByIdQuery,
  useCreateBankMasterMutation,
  useUpdateBankMasterMutation,
  useDeActivateMutation,
} = bankMasterApi;
