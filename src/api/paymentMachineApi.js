import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const paymentMachineApi = createApi({
  reducerPath: "paymentMachineApi",
  baseQuery: customBaseQuery,
  tagTypes: ["PaymentMachine"],
  endpoints: (builder) => ({
    getAllPaymentMachines: builder.query({
      query: () => ({
        url: "/api/v1/payment-machine/",
      }),
      providesTags: ["PaymentMachine"],
    }),
    getPaymentMachineById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/payment-machine/${id}`,
      }),
      providesTags: ["PaymentMachine"],
    }),
    createPaymentMachine: builder.mutation({
      query: ({ userId, payload }) => ({
        url: `/api/v1/payment-machine/create?ApplicationUserId=${userId}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["PaymentMachine"],
    }),
    updatePaymentMachine: builder.mutation({
      query: ({ id, userId, payload }) => ({
        url: `/api/v1/payment-machine/update/${id}?ApplicationUserId=${userId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["PaymentMachine"],
    }),
    deActivate: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/payment-machine/update-status/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["PaymentMachine"],
    }),
  }),
});

export const {
  useGetAllPaymentMachinesQuery,
  useGetPaymentMachineByIdQuery,
  useCreatePaymentMachineMutation,
  useUpdatePaymentMachineMutation,
  useDeActivateMutation,
} = paymentMachineApi;
