import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const roleManageApi = createApi({
  reducerPath: "roleManageApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Roles", "User Management"],
  endpoints: (builder) => ({
    getAllPages: builder.query({
      query: () => "/api/v1/role-privileges/getallrole",
    }),
    getPageById: builder.query({
      query: (id) => `/api/v1/role-privileges/role/${id}`,
      providesTags: ["Roles"],
    }),
    getAllPageName: builder.query({
      query: () => "/api/v1/pages/active",
    }),
    updatePrevilage: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/api/v1/role-privileges/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Roles"],
    }),
    createRole: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/role-privileges/create`,
        method: "POST",
        body: payload,
      }),
    }),
    createUser: builder.mutation({
      query: ({ payload }) => ({
        url: "/api/v1/user-management/create",
        method: "POST",
        body: payload,
      }),
    }),
    getAllRoles: builder.query({
      query: () => "/api/v1/role-privileges/getallrole",
      providesTags: ["Roles"],
    }),
    getAllLocations: builder.query({
      query: () => "/api/v1/user-management/all/location",
    }),
    getUserById: builder.query({
      query: ({ id }) => `/api/v1/user-management/${id}`,
    }),
    updateUserManagement: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/user-management/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["User Management"],
    }),
    getAllUserData: builder.query({
      query: () => "/api/v1/user-management",
      providesTags: ["User Management"],
    }),
    updateUserStatus: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/v1/user-management/${id}`,
        method: "PUT",
        body: data,
      }),
    }),
    deactiveUser: builder.mutation({
      query: ({ id }) => ({
        url: `/api/v1/user-management/deactivate/${id}`,
        method: "PUT",
      }),
    }),
    deactiveRole: builder.mutation({
      query: ({ id }) => ({
        url: `/api/v1/role-privileges/deactivate/${id}`,
        method: "PUT",
      }),
      invalidatesTags: ["Roles"],
    }),
    updateRole: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/v1/role-privileges/active/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Roles"],
    }),
  }),
});

export const {
  useGetAllPagesQuery,
  useGetPageByIdQuery,
  useUpdatePrevilageMutation,
  useGetAllPageNameQuery,
  useCreateRoleMutation,
  useCreateUserMutation,
  useGetAllRolesQuery,
  useGetAllLocationsQuery,
  useGetUserByIdQuery,
  useUpdateUserManagementMutation,
  useGetAllUserDataQuery,
  useUpdateUserStatusMutation,
  useDeactiveUserMutation,
  useDeactiveRoleMutation,
  useUpdateRoleMutation,
} = roleManageApi;
