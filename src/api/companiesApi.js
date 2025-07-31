import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const companiesApi = createApi({
    reducerPath: "companiesApi",
    baseQuery: customBaseQuery,
    tagTypes: ["Companies"],
    endpoints: (builder) => ({
        getCompanyById: builder.query({
            query: ({ id }) => ({
                url: `/api/v1/companies/${id}`,
                method: "GET",
            }),
            providesTags: ["Companies"],
        }),
    })
});



export const {
    useGetCompanyByIdQuery
} = companiesApi;   