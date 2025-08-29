import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer from "../features/auth/authSlice";
import { userApi } from "../api/userApi";
import { roleManageApi } from "../api/roleManagementApi";
import { poolApi } from "../api/poolApi";
import { brandApi } from "../api/brandCategory";
import { brandGroup } from "../api/brandGroup";
import { brandsApi } from "../api/brandsApi";
import { variationsApi } from "../api/variations";
import { accessoriesMaster } from "../api/accessoriesMaster";
import { shapeMasterApi } from "../api/shapeMasterApi";
import { seasonMasterApi } from "../api/seasonMaster";
import { materialMasterApi } from "../api/materialMaster";
import { frameMasterApi } from "../api/frameMasterApi";
import { customerGroup } from "../api/customerGroup";
import { customerApi } from "../api/customerApi";
import { externalApi } from "../api/externalApi";
import { vendorApi } from "../api/vendorApi";
import { salesPersonApi } from "../api/salesPersonApi";
import { bankMasterApi } from "../api/bankMasterApi";
import { BankAccountDetailsApi } from "../api/BankAccountDetailsApi";
import { paymentMachineApi } from "../api/paymentMachineApi";
import { orderApi } from "../api/orderApi";
import { contactLensApi } from "../api/clBatchDetailsApi";
import { purchaseOrderApi } from "../api/purchaseOrderApi";
import { companySettingsApi } from "../api/companySettingsApi";
import { companiesApi } from "../api/companiesApi";
import { InvoiceApi } from "../api/InvoiceApi";
import { salesReturnApi } from "../api/salesReturnApi";
import { stockTransferApi } from "../api/stockTransfer";
import { purchaseReturnApi } from "../api/purchaseReturn";
import { grnApi } from "../api/grnApi";

const persistConfig = {
  key: "auth",
  storage,
  whitelist: [
    "token",
    "user",
    "isAuthenticated",
    "roles",
    "access",
    "hasMultipleLocations",
    "companyId"
  ],
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    [userApi.reducerPath]: userApi.reducer,
    [roleManageApi.reducerPath]: roleManageApi.reducer,
    [poolApi.reducerPath]: poolApi.reducer,
    [brandApi.reducerPath]: brandApi.reducer,
    [brandGroup.reducerPath]: brandGroup.reducer,
    [brandsApi.reducerPath]: brandsApi.reducer,
    [variationsApi.reducerPath]: variationsApi.reducer,
    [accessoriesMaster.reducerPath]: accessoriesMaster.reducer,
    [shapeMasterApi.reducerPath]: shapeMasterApi.reducer,
    [seasonMasterApi.reducerPath]: seasonMasterApi.reducer,
    [materialMasterApi.reducerPath]: materialMasterApi.reducer,
    [frameMasterApi.reducerPath]: frameMasterApi.reducer,
    [customerGroup.reducerPath]: customerGroup.reducer,
    [customerApi.reducerPath]: customerApi.reducer,
    [externalApi.reducerPath]: externalApi.reducer,
    [vendorApi.reducerPath]: vendorApi.reducer,
    [salesPersonApi.reducerPath]: salesPersonApi.reducer,
    [bankMasterApi.reducerPath]: bankMasterApi.reducer,
    [BankAccountDetailsApi.reducerPath]: BankAccountDetailsApi.reducer,
    [paymentMachineApi.reducerPath]: paymentMachineApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [contactLensApi.reducerPath]: contactLensApi.reducer,
    [purchaseOrderApi.reducerPath]: purchaseOrderApi.reducer,
    [companySettingsApi.reducerPath]: companySettingsApi.reducer,
    [companiesApi.reducerPath]: companiesApi.reducer,
    [InvoiceApi.reducerPath]: InvoiceApi.reducer,
    [salesReturnApi.reducerPath]: salesReturnApi.reducer,
    [stockTransferApi.reducerPath]: stockTransferApi.reducer,
    [purchaseReturnApi.reducerPath]:purchaseReturnApi.reducer,
    [grnApi.reducerPath]: grnApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(
      userApi.middleware,
      roleManageApi.middleware,
      poolApi.middleware,
      brandApi.middleware,
      brandGroup.middleware,
      brandsApi.middleware,
      variationsApi.middleware,
      accessoriesMaster.middleware,
      shapeMasterApi.middleware,
      seasonMasterApi.middleware,
      materialMasterApi.middleware,
      frameMasterApi.middleware,
      customerGroup.middleware,
      customerApi.middleware,
      externalApi.middleware,
      vendorApi.middleware,
      salesPersonApi.middleware,
      bankMasterApi.middleware,
      BankAccountDetailsApi.middleware,
      paymentMachineApi.middleware,
      orderApi.middleware,
      contactLensApi.middleware,
      purchaseOrderApi.middleware,
      companySettingsApi.middleware,
      companiesApi.middleware,
      InvoiceApi.middleware,
      salesReturnApi.middleware,
      stockTransferApi.middleware,
      purchaseReturnApi.middleware,
      // salesReturnApi.middleware,
      grnApi.middleware
    ),
});

setupListeners(store.dispatch);

export const persistor = persistStore(store);
