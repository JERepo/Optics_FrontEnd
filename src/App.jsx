import { RouterProvider } from "react-router-dom";
import { router } from "./layouts/index";
import { Provider } from "react-redux";
import { store } from "./app/store";

export default function App() {
  return (
    <>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </>
  );
}
