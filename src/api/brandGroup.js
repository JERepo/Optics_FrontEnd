import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";
import { BRAND_GROUP } from "../utils/constants/apiRoutes";

export const brandGroup = createApi({
  reducerPath: "brandGroup",
  baseQuery: customBaseQuery,
  tagTypes: ["Group"],
  endpoints: (builder) => ({
    createBrandGroup: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/brandgroup/create?ApplicationUserId=${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Group"],
    }),
    getAllBrandGroups: builder.query({
      query: () => ({
        url: `/api/v1/brandgroup`,
      }),
      providesTags: ["Group"],
    }),
    getBrandGroupById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/brandgroup/getbyid/${id}`,
      }),
      providesTags: (result, error, { id }) => [
        { type: "Group", id },
        "Group"
      ],
    }),
    updateBrandGroup: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/brandgroup/update/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Group",
        { type: "Group", id }
      ],
    }),
    deActivate: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/brandgroup/deactivate/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Group",
        { type: "Group", id }
      ],
    }),
  }),
});

export const {
  useCreateBrandGroupMutation,
  useGetAllBrandGroupsQuery,
  useDeActivateMutation,
  useGetBrandGroupByIdQuery,
  useUpdateBrandGroupMutation,
} = brandGroup;
