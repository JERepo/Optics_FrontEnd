import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const emailAndWhatsaApp = createApi({
  reducerPath: "emailAndWhatsaApp",
  baseQuery: customBaseQuery,
  tagTypes: ["Email"],
  endpoints: (builder) => ({
    getParameters: builder.query({
      query: ({ type }) => ({
        url: `/api/v1/communication/params?moduleType=${type}`,
      }),
      providesTags: ["Email"],
    }),

    createEmail: builder.mutation({
      query: (payload) => ({
        url: `/api/v1/communication/email`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Email"],
    }),
    getEmailByModule: builder.query({
      query: ({ module, companyId }) => ({
        url: `/api/v1/communication/all?moduleType=${module}&companyId=${companyId}`,
      }),
      providesTags: ["Email"],
    }),
    updateEmail: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/communication/update`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Email"],
    }),
  }),
});

export const {
  useGetParametersQuery,
  useCreateEmailMutation,
  useGetEmailByModuleQuery,
  useUpdateEmailMutation,
} = emailAndWhatsaApp;
