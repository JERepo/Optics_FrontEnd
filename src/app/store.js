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

const persistConfig = {
  key: "auth",
  storage,
  whitelist: ["token", "user", "isAuthenticated", "roles", "access"],
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    [userApi.reducerPath]: userApi.reducer,
    [roleManageApi.reducerPath]: roleManageApi.reducer,
    [poolApi.reducerPath]: poolApi.reducer,
    [brandApi.reducerPath]: brandApi.reducer,
    [brandGroup.reducerPath]:brandGroup.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(
      userApi.middleware,
      roleManageApi.middleware,
      poolApi.middleware,
      brandApi.middleware,
      brandGroup.middleware
    ),
});

setupListeners(store.dispatch);

export const persistor = persistStore(store);
