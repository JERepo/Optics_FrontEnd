import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from "./customBaseQuery"

export const grnApi = createApi({
    reducerPath: 'grnApi',
    baseQuery: customBaseQuery,
    tagTypes: ['GRN'],
    endpoints: (builder) => ({
        checkDocNoUnique: builder.query({
            query: ({ docNo, vendorId, companyId, grnMainId }) => ({
                url: `/api/v1/grn/check-unique-doc/${docNo}/${vendorId}/${companyId}/${(grnMainId) ? `?grnMainId=${grnMainId}` : ''}`,
                method: 'GET'
            }),
        }),
        saveGRNMain: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/grn/create-grn-main`,
                method: 'POST',
                body: payload
            })
        }),
        saveGRNDetails: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/grn/create-grn-detail`,
                method: 'POST',
                body: { grnDetails: payload }
            }),
            providesTags: ['GRNDetails'],
        }),
        getGRNDetails: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/grn/get-grn-details`,
                method: 'POST',
                body: payload
            })
        }),
        saveCompleteGRN: builder.mutation({
            query: ({ grnMainId, companyId, payload }) => ({
                url: `/api/v1/grn/complete-grn/${grnMainId}/${companyId}`,
                method: 'POST',
                body: payload
            })
        }),
        getAllGRNmain: builder.query({
            query: () => ({
                url: `/api/v1/grn/get-all-grn`,
                method: 'GET'
            })
        })
    })
});




export const {
    useCheckDocNoUniqueQuery,
    useSaveGRNMainMutation,
    useSaveGRNDetailsMutation,
    useGetGRNDetailsMutation,
    useSaveCompleteGRNMutation,
    useGetAllGRNmainQuery
} = grnApi;