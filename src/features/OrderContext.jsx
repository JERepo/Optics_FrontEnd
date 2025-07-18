import { Children, createContext, useContext, useState } from "react";

const OrderContext = createContext();

export const useOrder = () => {
  return useContext(OrderContext);
};

export const OrderProvider = ({ children }) => {
  const [sample, setSample] = useState("Hello");
  return (
    <OrderContext.Provider value={{ sample }}>{children}</OrderContext.Provider>
  );
};
