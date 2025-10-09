import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const emailAndWhatsaApp = createApi({
  reducerPath: "emailAndWhatsaApp",
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    getParameters: builder.query({
      query: ({ type }) => ({
        url: `/api/v1/communication/params?moduleType=${type}`,
      }),
    }),

    createEmail: builder.mutation({
      query: (payload) => ({
        url: `/api/v1/communication/email`,
        method: "POST",
        body: payload,
      }),
    }),
    getEmailByModule: builder.query({
      query: ({ module, companyId }) => ({
        url: `/api/v1/communication/all?moduleType=${module}&companyId=${companyId}`,
      }),
    }),
  }),
});

export const { useGetParametersQuery, useCreateEmailMutation,useGetEmailByModuleQuery } =
  emailAndWhatsaApp;
