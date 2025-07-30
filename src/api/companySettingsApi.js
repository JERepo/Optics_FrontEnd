import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const companySettingsApi = createApi({
    reducerPath: "companySettingsApi",
    baseQuery: customBaseQuery,
    tagTypes: ["CompanySettings"],
    endpoints: (builder) => ({
        getCompanySettings: builder.query({
            query: ({ id }) => ({
                url: `/api/v1/location-settings/getbyid/${id}`,
                method: "GET",
            }),
            providesTags: ["CompanySettings"],
        }),
    })
});

export const {
    useGetCompanySettingsQuery
} = companySettingsApi;
