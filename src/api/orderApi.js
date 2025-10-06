import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Order", "Patient", "Prescription", "OfferD"],
  endpoints: (builder) => ({
    searchCustomer: builder.query({
      query: ({ input }) => ({
        url: `/api/v1/customer/search?name=${input}&mobile=""`,
      }),
    }),

    createNewCustomer: builder.mutation({
      query: ({ userId, payload }) => ({
        url: `/api/v1/customer/createinorder?ApplicationUserId=${userId}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Order", "Patient"],
    }),
    createSalesOrder: builder.mutation({
      query: ({ userId, payload }) => ({
        url: `/api/v1/order/create?ApplicationUserId=${userId}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Order"],
    }),
    getOrder: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/order?patientId=${id}`,
      }),
      providesTags: ["Order", "Patient"],
    }),
    getCustomerContactDetails: builder.query({
      query: () => ({
        url: `/api/v1/customer/getdetailsall`,
      }),
      providesTags: ["Order", "Patient"],
    }),
    getByBarCode: builder.query({
      query: ({ barcode, locationId }) => ({
        url: `/api/v1/frame-main/getbybarcode?barcode=${barcode}&locationId=${locationId}`,
      }),
    }),
    getByBrandAndModal: builder.query({
      query: ({ brand, modal, locationId }) => ({
        url: `/api/v1/frame-main/getbybrandmodel?brand=${brand}&locationId=${locationId}&search=${modal}`,
      }),
    }),
    saveFrame: builder.mutation({
      query: ({ orderId, payload }) => ({
        url: `/api/v1/order/add-frame/${orderId}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Order"],
    }),
    getOrderDetails: builder.query({
      query: ({ patientId, customerId }) => ({
        url: `/api/v1/order?PatientID=${patientId}&customerId=${customerId}`,
      }),
      providesTags: ["Order", "Patient"],
    }),
    getByBrandAndProductName: builder.query({
      query: ({ brand, product, locationId }) => ({
        url: `/api/v1/other-products/getbybrand/product?brandId=${brand}&locationId=${locationId}&productName=${product}`,
      }),
    }),
    fetchBarcodeForAccessory: builder.query({
      query: ({ barcode, locationId }) => ({
        url: `/api/v1/other-products/getby/barcode?barcode=${barcode}&locationId=${locationId}`,
      }),
    }),
    saveAccessory: builder.mutation({
      query: ({ orderId, payload }) => ({
        url: `/api/v1/order/add-otherproduct/${orderId}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Order"],
    }),

    getModalities: builder.query({
      query: () => ({
        url: `/api/v1/contact-lens/Modalities`,
      }),
    }),
    getProductNamesByModality: builder.query({
      query: ({ brandId, modalityId }) => ({
        url: `/api/v1/contact-lens/product?BrandId=${brandId}&ModalityId=${modalityId}`,
      }),
    }),
    getColour: builder.query({
      query: ({ clMainId }) => ({
        url: `/api/v1/contact-lens/colour?CLMainId=${clMainId}`,
      }),
    }),
    getPowerDetails: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/contact-lens/lensdetails`,
        method: "POST",
        body: payload,
      }),
    }),

    saveContactLens: builder.mutation({
      query: ({ orderId, payload }) => ({
        url: `/api/v1/order/add-contactlens/${orderId}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Order"],
    }),
    getPatientDetailsById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/customer/getbymasterid/${id}`,
      }),
      providesTags: ["Patient"],
    }),
    getSavedOrderDetails: builder.query({
      query: ({ orderId }) => ({
        url: `/api/v1/order/getorderdetails/${orderId}`,
      }),
      providesTags: ["Order", "OfferD"],
    }),
    applyFrameDiscount: builder.mutation({
      query: ({ locationId, orderId, detailId, payload }) => ({
        url: `/api/v1/order/applydiscount?locationId=${locationId}&orderId=${orderId}&detailId=${detailId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Order"],
    }),
    removeFrameDiscount: builder.mutation({
      query: ({ orderId, detailId }) => ({
        url: `/api/v1/order/remove-discount?orderId=${orderId}&detailId=${detailId}`,
        method: "PUT",
      }),
      invalidatesTags: ["Order"],
    }),
    applyAccessoryDiscount: builder.mutation({
      query: ({ locationId, orderId, detailId, payload }) => ({
        url: `/api/v1/order/otherproduct/applydiscount?locationId=${locationId}&orderId=${orderId}&detailId=${detailId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Order"],
    }),
    removeAccessoryDiscount: builder.mutation({
      query: ({ orderId, detailId }) => ({
        url: `/api/v1/order/otherproduct/remove-discount?orderId=${orderId}&detailId=${detailId}`,
        method: "PUT",
      }),
      invalidatesTags: ["Order"],
    }),
    applyContactLensDiscount: builder.mutation({
      query: ({ locationId, orderId, detailId, payload }) => ({
        url: `/api/v1/order/contactlens/applydiscount?locationId=${locationId}&orderId=${orderId}&detailId=${detailId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Order"],
    }),
    removeContactLensDiscount: builder.mutation({
      query: ({ orderId, detailId }) => ({
        url: `/api/v1/order/contactlens/remove-discount?orderId=${orderId}&detailId=${detailId}`,
        method: "PUT",
      }),
      invalidatesTags: ["Order"],
    }),

    removeOrder: builder.mutation({
      query: ({ orderId, payload }) => ({
        url: `/api/v1/order/addcomment?orderId=${orderId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Order"],
    }),
    completeOrderFinal: builder.mutation({
      query: ({ orderId, payload }) => ({
        url: `/api/v1/order/final/${orderId}`,
        method: "PUT",
        body: payload,
      }),
    }),
    // OPTICAL LENS API'S

    getOrderPreference: builder.query({
      query: ({ orderId }) => ({
        url: `/api/v1/optical-lens/order-reference?orderId=${orderId}`,
      }),
    }),
    getFocality: builder.query({
      query: ({ brandId, productType }) => ({
        url: `/api/v1/optical-lens/focality?brandId=${brandId}&productType=${productType}`,
      }),
    }),
    getFamily: builder.query({
      query: ({ brandId, productType, focalityId }) => ({
        url: `/api/v1/optical-lens/product-families?brandId=${brandId}&productType=${productType}&focalityId=${focalityId}`,
      }),
    }),
    getProductDesign: builder.query({
      query: ({ brandId, productType, focalityId, familyId }) => ({
        url: `/api/v1/optical-lens/product-designs?brandId=${brandId}&productType=${productType}&focalityId=${focalityId}&familyId=${familyId}`,
      }),
    }),
    getIndexValues: builder.query({
      query: ({ brandId, productType, focalityId, familyId, designId }) => ({
        url: `api/v1/optical-lens/index-values?brandId=${brandId}&productType=${productType}&focalityId=${focalityId}&familyId=${familyId}&designId=${designId}`,
      }),
    }),
    getCoatings: builder.query({
      query: ({ masterId }) => ({
        url: `/api/v1/optical-lens/get-coatings?masterIds=${masterId}`,
      }),
    }),
    getTreatments: builder.query({
      query: ({ masterId, coatingId }) => ({
        url: `/api/v1/optical-lens/get-treatments?masterIds=${masterId}&coatingId=${coatingId}`,
      }),
    }),
    checkTint: builder.query({
      query: ({ comboId, locationId }) => ({
        url: `/api/v1/optical-lens/check-tint?coatingComboId=${comboId}&locationId=${locationId}`,
      }),
    }),
    getAddOn: builder.query({
      query: ({ comboId, locationId }) => ({
        url: `/api/v1/optical-lens/getAddOns?coatingComboId=${comboId}&locationId=${locationId}`,
      }),
    }),

    getDIaDetails: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/optical-lens/getdia`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [],
    }),

    getPrice: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/optical-lens/getprice`,
        method: "POST",
        body: payload,
      }),
    }),

    // Get order details by orderMasterId, companyId and productType
    getOrderDetailsById: builder.mutation({
      query: (payload) => ({
        url: `/api/v1/order/getorderdetails-byproduct/`,
        method: "POST",
        body: payload,
      }),
      providesTags: ["OrderDetails"],
    }),

    getOrderDetailsAll: builder.mutation({
      query: (payload) => ({
        url: `/api/v1/order/productdetails`,
        method: "POST",
        body: payload,
      }),
      providesTags: ["OrderDetails"],
    }),

    saveOpticalLens: builder.mutation({
      query: ({ orderId, payload }) => ({
        url: `/api/v1/order/add-opticallens/${orderId}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Order"],
    }),

    mainApplyDiscount: builder.mutation({
      query: ({ locationId, orderId, detailId, productType, payload }) => ({
        url: `/api/v1/order/applydiscount?locationId=${locationId}&orderId=${orderId}&detailId=${detailId}&productType=${productType}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Order"],
    }),
    mainApplyRemoveDiscount: builder.mutation({
      query: ({ locationId, orderId, detailId, productType, payload }) => ({
        url: `/api/v1/order/remove-discount?orderId=${orderId}&detailId=${detailId}&productType=${productType}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Order"],
    }),

    // PRESCRIPTION API'S
    createNewPrescription: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/prescription/create`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Prescription"],
    }),
    updatePrescription: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/prescription/update/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Prescription"],
    }),
    deActivatePrescription: builder.mutation({
      query: ({ id }) => ({
        url: `/api/v1/prescription/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Prescription"],
    }),
    getAllPrescription: builder.query({
      query: ({ patientId }) => ({
        url: `/api/v1/prescription?PatientID=${patientId}`,
      }),
      transformResponse: (response) => {
        return response?.data?.data?.sort(
          (a, b) => new Date(b.PrescriptionDate) - new Date(a.PrescriptionDate)
        );
      },
      providesTags: ["Prescription"],
    }),

    getAllPrescriptionByPatient: builder.query({
      query: ({ patientId }) => ({
        url: `/api/v1/prescription?PatientID=${patientId}`,
      }),
      transformResponse: (response) => {
        return response?.data?.data?.sort(
          (a, b) => new Date(b.PrescriptionDate) - new Date(a.PrescriptionDate)
        );
      },
      providesTags: ["Prescription"],
    }),
    getAllPrescriptions: builder.query({
      query: () => ({
        url: `/api/v1/prescription/all`,
      }),
      providesTags: ["Prescription"],
    }),
    getPrescriptionById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/prescription/getbyid/${id}`,
      }),
    }),
    getAllVisualAcuity: builder.query({
      query: () => ({
        url: `/api/v1/prescription/all-visual-acuity`,
      }),
    }),

    getPrescriptionPrint: builder.query({
      query: ({ id, patientId, companyId }) => ({
        url: `/api/v1/pdf/prescription-receipt?id=${id}&patientId=${patientId}&companyId=${companyId}`,
        responseHandler: (response) => response.blob(),
      }),

      transformResponse: (response) => response,
    }),

    generateOpticalLensReceipt: builder.query({
      query: ({ orderDetailid, companyId }) => ({
        url: `/api/v1/pdf/optical-lens-receipt?orderDetailid=${orderDetailid}&companyId=${companyId}`,
        responseHandler: (response) => response.blob(),
      }),
      transformResponse: (response) => response,
    }),

    saveFinalPayment: builder.mutation({
      query: ({ orderId, payload }) => ({
        url: `/api/v1/order/withadvance/${orderId}`,
        method: "PUT",
        body: payload,
      }),
    }),

    // MAIN PAGE AND VIEW PAGE
    getAllOrders: builder.query({
      query: () => ({
        url: `/api/v1/order/all`,
      }),
      providesTags: ["Order"],
    }),
    getIdentifier: builder.query({
      query: () => ({
        url: `/api/v1/order/identifer`,
      }),
    }),
    updateIdentifier: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/order/update/${id}`,
        method: "PUT",
        body: payload,
      }),
    }),
    getOrderViewById: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/order/getorder/${id}`,
      }),
      providesTags: ["Order"],
    }),

    // Get order for GRN OL dd (companyId and status 0, 2, 6)
    getOrderdd: builder.mutation({
      query: (payload) => ({
        url: `/api/v1/order/productdetails-dd/`,
        method: "POST",
        body: payload,
      }),
    }),
    itemCancel: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/order/cancelitem/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Order"],
    }),
    cancelOrder: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/api/v1/order/cancelorder/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Order"],
    }),
    generateInvoiceFromOrder: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/invoice/generateinvoicefromorder`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Order"],
    }),
    getAdvanceAmt: builder.query({
      query: ({ orderId }) => ({
        url: `/api/v1/order/getAdvanceAmount/${orderId}`,
      }),
    }),

    getOfferCodeDetails: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/offer/applyoffertype3`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["OfferD"],
    }),
    getOfferDetails: builder.query({
      query: ({ userId }) => ({
        url: `/api/v1/offer/getOfferDetails/${userId}`,
      }),
      providesTags: ["OfferD"],
    }),
    getOfferByMainId: builder.query({
      query: ({ mainId }) => ({
        url: `/api/v1/offer/getMainOfferById/${mainId}`,
      }),
    }),
    removeOfferType3: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/offer/removeoffertype3`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Order"],
    }),
    applyOfferType4: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/offer/applyoffertype4`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Order"],
    }),
    removeOfferType4: builder.mutation({
      query: ({ payload }) => ({
        url: `/api/v1/offer/removeoffertype4`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Order"],
    }),
  }),
});

export const {
  // MAIN PAGE AND VIEW PAGE
  useGetAllOrdersQuery,
  useGetOrderViewByIdQuery,
  useItemCancelMutation,
  useCancelOrderMutation,
  useGenerateInvoiceFromOrderMutation,
  useLazyGetAdvanceAmtQuery,
  useLazyGenerateOpticalLensReceiptQuery,

  // Offer
  useGetOfferCodeDetailsMutation,
  useGetOfferDetailsQuery,
  useGetOfferByMainIdQuery,
  useRemoveOfferType3Mutation,
  useApplyOfferType4Mutation,
  useRemoveOfferType4Mutation,

  // OPTICAL LENS
  useGetAllVisualAcuityQuery,
  useGetOrderPreferenceQuery,
  useGetFocalityQuery,
  useGetFamilyQuery,
  useGetProductDesignQuery,
  useGetIndexValuesQuery,
  useGetCoatingsQuery,
  useGetTreatmentsQuery,
  useCheckTintQuery,
  useGetAddOnQuery,
  useCreateNewPrescriptionMutation,
  useGetAllPrescriptionQuery,
  useGetDIaDetailsMutation,
  useGetPriceMutation,
  useSaveOpticalLensMutation,
  useMainApplyDiscountMutation,
  useMainApplyRemoveDiscountMutation,
  useGetIdentifierQuery,
  useUpdateIdentifierMutation,
  useSaveFinalPaymentMutation,

  // PRESCRIPTION
  useGetAllPrescriptionsQuery,
  useGetPrescriptionByIdQuery,
  useUpdatePrescriptionMutation,
  useDeActivatePrescriptionMutation,
  useLazyGetAllPrescriptionByPatientQuery,
  useLazyGetPrescriptionPrintQuery,

  useLazySearchCustomerQuery,
  useCreateNewCustomerMutation,
  useCreateSalesOrderMutation,
  useGetOrderQuery,
  useGetCustomerContactDetailsQuery,
  useLazyGetByBarCodeQuery,
  useLazyGetByBrandAndModalQuery,
  useSaveFrameMutation,
  useGetOrderDetailsQuery,
  useLazyGetByBrandAndProductNameQuery,
  useSaveAccessoryMutation,
  useLazyFetchBarcodeForAccessoryQuery,
  useGetModalitiesQuery,
  useGetProductNamesByModalityQuery,
  useGetColourQuery,
  useGetPowerDetailsMutation,
  useSaveContactLensMutation,
  useGetPatientDetailsByIdQuery,
  useGetSavedOrderDetailsQuery,
  useApplyFrameDiscountMutation,
  useRemoveFrameDiscountMutation,
  useRemoveOrderMutation,
  useApplyAccessoryDiscountMutation,
  useRemoveAccessoryDiscountMutation,
  useApplyContactLensDiscountMutation,
  useRemoveContactLensDiscountMutation,
  useCompleteOrderFinalMutation,
  useGetOrderDetailsByIdMutation,
  useGetOrderDetailsAllMutation,
  useGetOrderddMutation,
} = orderApi;
