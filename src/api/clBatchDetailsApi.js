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
            query: ({ batchData, applicationUserId, companyId }) => ({
                url: `/api/v1/contact-lens-details/save?ApplicationUserId=${applicationUserId}&CompanyId=${companyId}`,
                method: 'POST',
                body: batchData,
            }),
        }),
        getContactLensStock: builder.mutation({
            query: ({ BatchCode, BatchBarcode }) => ({
                url: '/api/v1/contact-lens-details/fetch-stock',
                method: 'POST',
                body: {
                    BatchCode: BatchCode,
                    BatchBarcode: BatchBarcode,
                },
            }),
        }),
        updateContactLensStockDetails: builder.mutation({
            query: ({ batchData, applicationUserId, companyId }) => ({
                url: `/api/v1/contact-lens-details/update?ApplicationUserId=${applicationUserId}&CompanyId=${companyId}`,
                method: 'POST',
                body: batchData,
            }),
        }),
        downloadSampleExcel: builder.query({
            query: () => ({
                url: `/api/v1/contact-lens-details/sampleexcel`,
                method: 'GET',
                responseHandler: (response) => response.blob(),
            })
        }),
        uploadBulkFile: builder.mutation({
            query: ({formData, applicationUserId, companyId}) => ({
                url: `/api/v1/contact-lens-details/bulk-upload?ApplicationUserId=${applicationUserId}&CompanyId=${companyId}`,
                method: 'POST',
                body: formData,
            })
        }),
    }),
});


export const {
    useGetContactLensDetailsMutation,
    useSaveContactLensDetailsMutation,
    useGetContactLensStockMutation,
    useUpdateContactLensStockDetailsMutation,
    useLazyDownloadSampleExcelQuery,
    useUploadBulkFileMutation,
} = contactLensApi;