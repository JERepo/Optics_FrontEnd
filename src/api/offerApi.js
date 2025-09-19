import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./customBaseQuery";

export const offerApi = createApi({
  reducerPath: "offerApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Offer","aval"],
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
      invalidatesTags : ["aval"]
    }),
    saveOfferProduct: builder.mutation({
      query: (payload) => ({
        url: `/api/v1/offer/create/OfferType3`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags : ["Offer","aval"]
    }),
    getAddOnByBrandId: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/optical-lens/getaddon/${id}`,
      }),
    }),
    getCoatingsByBrand: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/optical-lens/getcoatings/${id}`,
      }),
    }),
    getTreatmentsByBrand: builder.query({
      query: ({ id }) => ({
        url: `/api/v1/optical-lens/gettreatment/${id}`,
      }),
    }),
    createOfferType4: builder.mutation({
      query: (payload) => ({
        url: `/api/v1/offer/create/OfferType4`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Offer","aval"],
    }),

    getAllOffers: builder.query({
      query: () => ({
        url: `/api/v1/offer/getalloffers`,
      }),
      providesTags: ["Offer"],
    }),
    getOfferAvl: builder.query({
      query: ({ userId }) => ({
        url: `/api/v1/offer/getOfferById/${userId}`,
      }),
      providesTags : ["aval"]
    }),
  }),
});

export const {
  useGetCustomerGroupQuery,
  useCreateOfferMutation,
  useSaveOfferProductMutation,
  useGetAddOnByBrandIdQuery,
  useGetCoatingsByBrandQuery,
  useGetTreatmentsByBrandQuery,
  useCreateOfferType4Mutation,
  useGetAllOffersQuery,
  useGetOfferAvlQuery,
} = offerApi;
