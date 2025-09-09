import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const offerApi = createApi({
  reducerPath: "offerApi",
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    getCustomerGroup: builder.query({
      query: ({ poolId }) => ({
        url: `/api/v1/customer-groups?CustomerPoolID=${poolId}`,
      }),
    }),
    createOffer: builder.mutation({
      query: (payload) => ({
        url: `/api/v1/offer/create`,
        method: "POST",
        body: payload,
      }),
    }),
    saveOfferProduct: builder.mutation({
      query: (payload) => ({
        url: `/api/v1/offer/create/OfferType3`,
        method: "POST",
        body: payload,
      }),
    }),
    getAddOnByBrandId: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/optical-lens/getaddon/${id}`,
      }),
    }),
    getCoatingsByBrand:builder.query({
      query : ({id}) => ({
        url : `/api/v1/optical-lens/getcoatings/${id}`
      })
    }),
    getTreatmentsByBrand: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/optical-lens/gettreatment/${id}`
      })
    })
  }),
});

export const {
  useGetCustomerGroupQuery,
  useCreateOfferMutation,
  useSaveOfferProductMutation,
  useGetAddOnByBrandIdQuery,
  useGetCoatingsByBrandQuery,
  useGetTreatmentsByBrandQuery
} = offerApi;
