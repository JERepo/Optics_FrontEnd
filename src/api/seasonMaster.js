import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const seasonMasterApi = createApi({
  reducerPath: "seasonMasterApi",
  baseQuery: customBaseQuery,
  tagTypes: ["season"],
  endpoints: (builder) => ({
    createseasonMaster: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/season-master/create?ApplicationUserId=${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["season"],
    }),
    getAllseasons: builder.query({
      query: () => ({
        url: `/api/v1/season-master`,
      }),
      providesTags: ["season"],
    }),
    getseasonById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/season-master/getbyid/${id}`,
      }),
      providesTags: (result, error, { id }) => [
        { type: "season", id },
        "season"
      ],
    }),
    updateseason: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/season-master/update/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (result, error, { id }) => [
        "season",
        { type: "season", id }
      ],
    }),
    deActivate: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/season-master/deactivate/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (result, error, { id }) => [
        "season",
        { type: "season", id }
      ],
    }),
  }),
});

export const {
  useCreateseasonMasterMutation,
  useGetAllseasonsQuery,
  useGetseasonByIdQuery,
  useDeActivateMutation,
  useUpdateseasonMutation,
} = seasonMasterApi;
