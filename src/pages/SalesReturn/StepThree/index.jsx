import React from "react";
import { useOrder } from "../../../features/OrderContext";
import FrameSunglass from "./FrameSunglass";
import AccessoryFrame from "./AccessoryFrame";
import ContactLens from "./ContactLens";


const StepThreeMain = () => {
  const { currentSalesSubStep } = useOrder();

  const renderSubStep = () => {
    switch (currentSalesSubStep) {
      case 1:
        return <FrameSunglass />;
      case 2:
        return <AccessoryFrame />;
      case 3:
        return <ContactLens />;
     
      default:
        return <div></div>;
    }
  };

  return <div>{renderSubStep()}</div>;
};

export default StepThreeMain;
