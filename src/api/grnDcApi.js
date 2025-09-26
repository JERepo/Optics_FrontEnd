import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from "./customBaseQuery"

export const grnDcApi = createApi({
    reducerPath: 'grnDcApi',
    baseQuery: customBaseQuery,
    tagTypes: ['GRNDC'],
    endpoints: (builder) => ({
        getVendor: builder.query({
            query: ({ companyId }) => ({
                url: `/api/v1/grn-dc/getVendor?companyId=${companyId}`,
                method: 'GET'
            })
        }),
        getGRNMain: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/grn-dc/getGRNMain`,
                method: 'POST',
                body: payload
            })
        }),
        saveGRNMain: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/grn-dc/save-grnMain`,
                method: 'POST',
                body: payload
            })
        }),
        getGRNDetails: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/grn-dc/get-grn-details`,
                method: 'POST',
                body: payload
            })
        }),
        getGRNDCdata: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/grn-dc/get-grndc-details`,
                method: 'POST',
                body: payload
            })
        }),
        updateGRNPriceAndFitting: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/grn-dc/update-grn-details`,
                method: 'POST',
                body: payload
            })
        }),
        saveGRNDetails: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/grn-dc/create-grn-detail`,
                method: 'POST',
                body: payload
            })
        }),
        getAllGRNDCMain: builder.query({
            query: () => ({
                url: `/api/v1/grn-dc/get-all`,
                method: 'GET'
            })
        })
    })
});




export const {
    useGetVendorQuery,
    useGetGRNMainMutation,
    useSaveGRNMainMutation,
    useGetGRNDetailsMutation,
    useGetGRNDCdataMutation,
    useUpdateGRNPriceAndFittingMutation,
    useSaveGRNDetailsMutation,
    useGetAllGRNDCMainQuery
} = grnDcApi;