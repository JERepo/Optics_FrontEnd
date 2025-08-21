import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const contactLensApi = createApi({
    reducerPath: 'contactLensApi',
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        getContactLensDetails: builder.mutation({
            query: ({ barcode, locationId }) => ({
                url: '/api/v1/contact-lens-details/fetch',
                method: 'POST',
                body: {
                    Barcode: barcode,
                    locationId: locationId,
                },
            }),
        }),
        saveContactLensDetails: builder.mutation({
            query: ({ batchData, applicationUserId }) => ({
                url: `/api/v1/contact-lens-details/save?ApplicationUserId=${applicationUserId}`,
                method: 'POST',
                body: batchData,
            }),
        }),
    }),
});


export const {
    useGetContactLensDetailsMutation,
    useSaveContactLensDetailsMutation
} = contactLensApi;