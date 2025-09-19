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
        }),
        getOrderDetailsByorderDetasilId: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/grn/get-order-details-byorderDetasilId`,
                method: 'POST',
                body: payload
            })
        }),
        checkSupplierOrderNo: builder.query({
            query: ({ vendorOrderNo, vendorId, companyId }) => ({
                url: `/api/v1/grn/check-unique-order/${vendorOrderNo}/${vendorId}/${companyId}`,
                method: 'GET'
            })
        }),
        getGRNMain: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/grn/get-grn-main`,
                method: 'POST',
                body: payload
            })
        }),
        updateGRNMain: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/grn/update-grn-main`,
                method: 'POST',
                body: payload
            })
        }),
        getFrameByBarcode: builder.query({
            query: ({ barcode, locationId, vendorId, productType }) => ({
                url: `/api/v1/grn/get-frame-bybarcode?barcode=${barcode}&locationId=${locationId}&vendorId=${vendorId ?? null}&createdCompanyId=${locationId ?? null}&productType=${productType ?? null}`,
                method: 'GET'
            })
        }),
        getFrameByBrandModel: builder.query({
            query: ({ brand, search, locationId, vendorId, productType }) => ({
                url: `/api/v1/grn/get-frame-byBrandModel?brand=${brand}&search=${search}&locationId=${locationId}&vendorId=${vendorId ?? null}&createdCompanyId=${locationId ?? null}&productType=${productType ?? null}`,
                method: 'GET'
            })
        }),
        getAccessoryByBarcode: builder.query({
            query: ({ barcode, locationId, vendorId, productType }) => ({
                url: `/api/v1/grn/get-accessory-bybarcode?barcode=${barcode}&locationId=${locationId}&vendorId=${vendorId ?? null}&createdCompanyId=${locationId ?? null}&productType=${productType ?? null}`,
                method: 'GET'
            })
        }),
        getAccessoryByDetailId: builder.query({
            query: ({ accessoryDetailId, locationId }) => ({
                url: `/api/v1/grn/get-accessory-bydetailId?accessoryDetailId=${accessoryDetailId}&locationId=${locationId}`,
                method: 'GET'
            })
        }),
        getGRNPOdetailsById: builder.mutation({
            query: (payload) => ({
                url: `/api/v1/grn/get-frame-bydetailId`,
                method: 'POST',
                body: payload
            })
        }),
        checkGRNQtyValidation: builder.query({
            query: ({ PODetailsId, GRNQty, grnMainId }) => ({
                url: `/api/v1/grn/update-grn-qty?PODetailsId=${PODetailsId}&GRNQty=${GRNQty}&grnMainId=${grnMainId}`,
                method: 'GET'
            })
        }),
        getCLByBarcode: builder.query({
            query: ({ barcode, locationId, vendorId, productType }) => ({
                url: `/api/v1/grn/get-cl-bybarcode?barcode=${barcode}&locationId=${locationId}&vendorId=${vendorId ?? null}&createdCompanyId=${locationId ?? null}&productType=${productType ?? null}`,
                method: 'GET'
            })
        }),
        getCLByDetailId: builder.query({
            query: ({ clDetailId, locationId, vendorId, productType }) => ({
                url: `/api/v1/grn/get-cl-byClDetailId?clDetailId=${clDetailId}&locationId=${locationId}&vendorId=${vendorId}&createdCompanyId=${locationId}&productType=${productType}`,
                method: 'GET'
            })
        }),
        deleteGRNDetail: builder.query({
            query: ({grnDetailId}) => ({
                url: `/api/v1/grn/delete-grn-details?grnDetailId=${grnDetailId}`,
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
    useGetAllGRNmainQuery,
    useGetOrderDetailsByorderDetasilIdMutation,
    useCheckSupplierOrderNoQuery,
    useGetGRNMainMutation,
    useUpdateGRNMainMutation,
    useLazyGetFrameByBarcodeQuery,
    useLazyGetFrameByBrandModelQuery,
    useLazyGetAccessoryByBarcodeQuery,
    useLazyGetAccessoryByDetailIdQuery,
    useGetGRNPOdetailsByIdMutation,
    useLazyCheckGRNQtyValidationQuery,
    useLazyGetCLByBarcodeQuery,
    useLazyGetCLByDetailIdQuery,
    useLazyDeleteGRNDetailQuery
} = grnApi;