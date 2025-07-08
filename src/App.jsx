import { RouterProvider } from "react-router-dom";
import { router } from "./layouts/index";
import { Provider } from "react-redux";
import { persistor, store } from "./app/store";
import { Toaster } from "react-hot-toast";
import { PersistGate } from "redux-persist/integration/react";
import { FormProvider } from "./features/dataContext";
import { FormMasterProvider } from "./features/frameMasterContext";

export default function App() {
  return (
    <Provider store={store}>
      <FormMasterProvider>
        <FormProvider>
          <PersistGate loading={null} persistor={persistor}>
            <Toaster position="top-center" reverseOrder={false} />
            <RouterProvider router={router} />
          </PersistGate>
        </FormProvider>
      </FormMasterProvider>
    </Provider>
  );
}
