import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from "./customBaseQuery"

export const purchaseOrderApi = createApi({
    reducerPath: 'purchaseOrderApi',
    baseQuery: customBaseQuery,
    tagTypes: ['PurchaseOrder'],
    endpoints: (builder) => ({
        savePurchaseOrder: builder.mutation({
            query: ({ id, payload }) => ({
                url: '/api/v1/purchase-order/create?ApplicationUserId=' + id,
                method: 'POST',
                body: payload,
            }),
            providesTags: ['PurchaseOrder'],
        }),

        savePurchaseOrderDetails: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/purchase-order/create-details`,
                method: 'POST',
                body: { orderDetails: payload }
            }),
            providesTags: ['PurchaseOrderDetails'],
        }),

        getAllPoDetails: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/purchase-order/get-all`,
                method: 'POST',
                body: payload
            }),
            providesTags: ['PurchaseOrderDetails'],
        }),

        updatePoBuyingPrice: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/purchase-order/update-price`,
                method: 'PUT',
                body: payload
            })
        }),

        updatePoQty: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/purchase-order/update-quantity`,
                method: 'PUT',
                body: payload
            })
        }),

        deletePo: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/purchase-order/delete`,
                method: 'DELETE',
                body: payload
            })
        }),

        updatePoMain: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/purchase-order/update-main`,
                method: 'PUT',
                body: payload
            })
        }),

        getOlByBarcode: builder.query({
            query: ({ barcode, locationId }) => ({
                url: `/api/v1/optical-lens/getbybarcode?Barcode=${barcode}&LocationID=${locationId}`,
                method: 'GET'
            })
        }),

        getOlByDetailId: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/optical-lens/getOlbyDetailId`,
                method: 'POST',
                body: payload
            })
        }),

        getAllPoDetailsForNewOrder: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/purchase-order/getpodetailsforneworder`,
                method: 'POST',
                body: payload
            })
        }),
        getPOview: builder.query({
            query: (po) => ({
                url: `/api/v1/purchase-order/getpo?po=`,
                method: 'GET'
            })
        }),
        getPOMain: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/purchase-order/get-pomain`,
                method: 'POST',
                body: payload
            })
        }),
        updatePOMainData: builder.mutation({
            query: ({ poMainId, refNo }) => ({
                url: `/api/v1/purchase-order/update-pomain?poMainId=${poMainId}&refNo=${refNo}`,
                method: 'PUT',
            }),
            invalidatesTags: ['PurchaseOrder'],
        }),
    })
});




export const {
    useSavePurchaseOrderMutation,
    useSavePurchaseOrderDetailsMutation,
    useGetAllPoDetailsMutation,
    useUpdatePoBuyingPriceMutation,
    useUpdatePoQtyMutation,
    useDeletePoMutation,
    useUpdatePoMainMutation,
    useLazyGetOlByBarcodeQuery,
    useGetOlByDetailIdMutation,
    useGetAllPoDetailsForNewOrderMutation,
    useGetPOviewQuery,
    useGetPOMainMutation,
    useUpdatePOMainDataMutation
} = purchaseOrderApi;