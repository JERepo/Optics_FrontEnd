import { createContext, useContext, useState } from "react";

const CustomerContext = createContext();

export const useCustomerContext = () => useContext(CustomerContext);

export const CustomerProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    location: "",
    name: "",
    customerType: "B2C",
    customerGroup: "",
    countryCode: "+1",
    phone: "",
    email: "",
    sendAlert: false,
  });

  return (
    <CustomerContext.Provider
      value={{
        formData,
        setFormData,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};
