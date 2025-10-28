// App.jsx
import { RouterProvider } from "react-router-dom";
import { router } from "./layouts/index";
import { Provider } from "react-redux";
import { persistor, store } from "./app/store";
import { Toaster } from "react-hot-toast";
import { PersistGate } from "redux-persist/integration/react";
import { FormProvider } from "./features/dataContext";
import { FormMasterProvider } from "./features/frameMasterContext";
import { CustomerProvider } from "./features/customerContext";
import { OrderProvider } from "./features/OrderContext";
import ConnectionStatus from "./components/ErrorHandling/ConnectionStatus";

export default function App() {
  return (
    <Provider store={store}>
      <FormMasterProvider>
        <FormProvider>
          <OrderProvider>
            <CustomerProvider>
              <PersistGate loading={null} persistor={persistor}>
                <Toaster position="top-center" reverseOrder={false} />
                <ConnectionStatus /> 

                <RouterProvider router={router} />
              </PersistGate>
            </CustomerProvider>
          </OrderProvider>
        </FormProvider>
      </FormMasterProvider>
    </Provider>
  );
}
