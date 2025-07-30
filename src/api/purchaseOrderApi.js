import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from "./customBaseQuery"

export const purchaseOrderApi = createApi({
    reducerPath: 'purchaseOrderApi',
    baseQuery: customBaseQuery,
    tagTypes: ['PurchaseOrder'],
    endpoints: (builder) => ({
        savePurchaseOrder: builder.mutation({
            query: ({id, payload}) => ({
                url: '/api/v1/purchase-order/create?ApplicationUserId=' + id,
                method: 'POST',
                body: payload,
            }),
            providesTags: ['PurchaseOrder'],
        })
    })
});


export const { 
    useSavePurchaseOrderMutation
} = purchaseOrderApi;