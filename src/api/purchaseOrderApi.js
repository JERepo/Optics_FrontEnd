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
            query: () => ({  // Remove the unused po parameter
                url: `/api/v1/purchase-order/getpo`,
                method: 'GET'
            }),
            providesTags: ['PurchaseOrders'], // Add this tag
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
        approvePo: builder.query({
            query: ({ poMainId }) => ({
                url: `/api/v1/purchase-order/approve-po?poMainId=${poMainId}`,
                method: 'GET',
            }),
            invalidatesTags: ['PurchaseOrders'],
        }),
        approveUpdatePrice: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/purchase-order/approve/update-price`,
                method: 'POST',
                body: payload
            }),
            // invalidatesTags: ['PurchaseOrders'],
        }),
        approveUpdateQty: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/purchase-order/approve/update-qty`,
                method: 'POST',
                body: payload
            }),
            // invalidatesTags: ['PurchaseOrders'],
        }),
        downloadFrameSampleExcel: builder.query({
            query: () => ({
                url: `/api/v1/purchase-order/frame-sample-excel`,
                method: 'GET',
                responseHandler: (response) => response.blob(),
            })
        }),
        bulkUploadFrame: builder.mutation({
            query: ({ formData, applicationUserId, poMainId }) => ({
                url: `/api/v1/purchase-order/frame-bulk-upload?ApplicationUserId=${applicationUserId}&poMainId=${poMainId}`,
                method: 'POST',
                body: formData
            })
        }),
        downloadAccessorySampleExcel: builder.query({
            query: () => ({
                url: `/api/v1/purchase-order/accessory-sample-excel`,
                method: 'GET',
                responseHandler: (response) => response.blob(),
            })
        }),
        bulkUploadAccessory: builder.mutation({
            query: ({ formData, applicationUserId, poMainId }) => ({
                url: `/api/v1/purchase-order/accessory-bulk-upload?ApplicationUserId=${applicationUserId}&poMainId=${poMainId}`,
                method: 'POST',
                body: formData
            })
        }),
        downloadCLSampleExcel: builder.query({
            query: () => ({
                url: `/api/v1/purchase-order/contactlens-sample-excel`,
                method: 'GET',
                responseHandler: (response) => response.blob(),
            })
        }),
        bulkUploadContactLens: builder.mutation({
            query: ({ formData, applicationUserId, poMainId }) => ({
                url: `/api/v1/purchase-order/cl-bulk-upload?ApplicationUserId=${applicationUserId}&poMainId=${poMainId}`,
                method: 'POST',
                body: formData
            })
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
    useUpdatePOMainDataMutation,
    useLazyApprovePoQuery,
    useApproveUpdatePriceMutation,
    useApproveUpdateQtyMutation,
    useLazyDownloadFrameSampleExcelQuery,
    useBulkUploadFrameMutation,
    useLazyDownloadAccessorySampleExcelQuery,
    useBulkUploadAccessoryMutation,
    useLazyDownloadCLSampleExcelQuery,
    useBulkUploadContactLensMutation
} = purchaseOrderApi;