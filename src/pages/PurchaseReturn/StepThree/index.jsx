import React from "react";
import { useOrder } from "../../../features/OrderContext";
import FrameSunglass from "./FrameSunglass";
import ContactLens from "./ContactLens";
import AccessoryFrame from "./AccessoryFrame";


const StepThreeMain = () => {
  const { currentPurchaseSubStep } = useOrder();

  const renderSubStep = () => {
    switch (currentPurchaseSubStep) {
      case 1:
        return <FrameSunglass />;
      case 2:
        return <AccessoryFrame />
      case 3:
        return <ContactLens />
      default:
        return <div></div>;
    }
  };

  return <div>{renderSubStep()}</div>;
};

export default StepThreeMain;
