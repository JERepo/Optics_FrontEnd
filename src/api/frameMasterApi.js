import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const frameMasterApi = createApi({
  reducerPath: "frameMasterApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Frame"],
  endpoints: (builder) => ({
    getAllFrameMaster: builder.query({
      query: () => ({
        url: `/api/v1/frame-main`,
      }),
      providesTags: ["Frame"],
    }),
    getFrameMasterById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/frame-main/getbyid/${id}`,
      }),
      providesTags: ["Frame"],
    }),
    deActivate: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/frame-main/deactivate/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Frame"],
    }),
    createFrameMaster: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/frame-main/create?ApplicationUserId=${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Frame"],
    }),
    updateFramemaster: builder.mutation({
      query: ({ id, payload, appId }) => ({
        url: `/api/v1/frame-main/update/${id}?ApplicationUserId=${appId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Frame"],
    }),
  }),
});

export const {
  useGetAllFrameMasterQuery,
  useDeActivateMutation,
  useCreateFrameMasterMutation,
  useGetFrameMasterByIdQuery,
  useUpdateFramemasterMutation,
} = frameMasterApi;
