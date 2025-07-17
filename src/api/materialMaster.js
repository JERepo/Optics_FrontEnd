import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const materialMasterApi = createApi({
  reducerPath: "materialMasterApi",
  baseQuery: customBaseQuery,
  tagTypes: ["material"],
  endpoints: (builder) => ({
    creatematerialMaster: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/material-master/create?ApplicationUserId=${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["material"],
    }),
    getAllmaterials: builder.query({
      query: () => ({
        url: `/api/v1/material-master`,
      }),
      providesTags: ["material"],
      transformResponse: (response) => {
        const sorted = response?.data?.sort(
          (a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate)
        );
        return sorted || [];
      },
    }),
    getmaterialById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/material-master/getbyid/${id}`,
      }),
    }),
    updatematerial: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/material-master/update/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["material"],
    }),
    deActivate: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/material-master/deactivate/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["material"],
    }),
    getAllRimType : builder.query({
      query : () => ({
        url : `/api/v1/frame-rim-type`
      })
    })
  }),
});

export const {
  useCreatematerialMasterMutation,
  useGetAllmaterialsQuery,
  useGetmaterialByIdQuery,
  useDeActivateMutation,
  useUpdatematerialMutation,
  useGetAllRimTypeQuery
} = materialMasterApi;
