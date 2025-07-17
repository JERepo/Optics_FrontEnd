import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const BankAccountDetailsApi = createApi({
  reducerPath: "BankAccountDetailsApi",
  baseQuery: customBaseQuery,
  tagTypes: ["BankAccount"],
  endpoints: (builder) => ({
    getAllBankAccounts: builder.query({
      query: () => ({
        url: "/api/v1/bank-account-details/",
      }),
      providesTags: ["BankAccount"],
    }),
    getBankAccountById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/bank-account-details/${id}`,
      }),
      providesTags: ["BankAccount"],
    }),
    createBankAccount: builder.mutation({
      query: ({ userId, payload }) => ({
        url: `/api/v1/bank-account-details/create?ApplicationUserId=${userId}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["BankAccount"],
    }),
    updateBankAccount: builder.mutation({
      query: ({ id, userId, payload }) => ({
        url: `/api/v1/bank-account-details/update/${id}?ApplicationUserId=${userId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["BankAccount"],
    }),
    deActivate: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/bank-account-details/update-status/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["BankAccount"],
    }),
  }),
});

export const {
  useGetAllBankAccountsQuery,
  useGetBankAccountByIdQuery,
  useCreateBankAccountMutation,
  useUpdateBankAccountMutation,
  useDeActivateMutation,
} = BankAccountDetailsApi;
