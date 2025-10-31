import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const contactLensMasterApi = createApi({
  reducerPath: "contactLensMasterApi",
  baseQuery: customBaseQuery,
  tagTypes: ["cl"],
  endpoints: (builder) => ({
    getMaterials: builder.query({
      query: () => ({
        url: `/api/v1/material-master`,
      }),
    }),
    getCLMasterFile: builder.query({
      query: () => ({
        url: `/api/v1/contact-lens/sampleexcel`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),
    createCLMaster: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/contact-lens/create`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["cl"],
    }),
    updateCLMaster: builder.mutation({
      query: ({ masterId, payload }) => ({
        url: `/api/v1/contact-lens/update/${masterId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["cl"],
    }),
    getCLMasterById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/contact-lens/getbyid/${id}`,
      }),
      providesTags: ["cl"],
    }),
    getAllCLMasters: builder.query({
      query: () => ({
        url: `/api/v1/contact-lens/allmain`,
      }),
      providesTags: ["cl"],
    }),
    updateCLMain: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/contact-lens/deactivate/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["cl"],
    }),
    getClOtherLocationStock: builder.query({
      query: ({ companyId, detailId, batchcode }) => ({
        url: `/api/v1/contact-lens/getclOtherStock?companyId=${companyId}&detailId=${detailId}&batchCode=${batchcode}`,
      }),
    }),
  }),
});

export const {
  useGetMaterialsQuery,
  useLazyGetCLMasterFileQuery,
  useCreateCLMasterMutation,
  useUpdateCLMasterMutation,
  useGetCLMasterByIdQuery,
  useGetAllCLMastersQuery,
  useUpdateCLMainMutation,
  useLazyGetClOtherLocationStockQuery
} = contactLensMasterApi;
