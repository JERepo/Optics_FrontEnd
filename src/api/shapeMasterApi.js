import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const shapeMasterApi = createApi({
  reducerPath: "shapeMasterApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Shape"],
  endpoints: (builder) => ({
    createShapeMaster: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/shape-master/create?ApplicationUserId=${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Shape"],
    }),
    getAllShapes: builder.query({
      query: () => ({
        url: `/api/v1/shape-master`,
      }),
      providesTags: ["Shape"],
      transformResponse: (response) => {
        const sorted = response?.data?.sort(
          (a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate)
        );
        return sorted || [];
      },
    }),
    getShapeById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/shape-master/getbyid/${id}`,
      }),
    }),
    updateShape: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/shape-master/update/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Shape"],
    }),
    deActivate: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/shape-master/deactivate/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Shape"],
    }),
  }),
});

export const {
  useCreateShapeMasterMutation,
  useGetAllShapesQuery,
  useGetShapeByIdQuery,
  useDeActivateMutation,
  useUpdateShapeMutation,
} = shapeMasterApi;
