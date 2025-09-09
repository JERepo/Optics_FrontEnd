import React from "react";
import { useOrder } from "../../../features/OrderContext";
import FrameSunglass from "./FrameSunglass";
import AccessoryFrame from "./AccessoryFrame";
import ContactLens from "./ContactLens";
import OpticalLens from "./OpticalLens";

const StepThreeMain = () => {
  const { currentOfferSubStep } = useOrder();

  const renderSubStep = () => {
    switch (currentOfferSubStep) {
      case 1:
        return <FrameSunglass />;
      case 2:
        return <AccessoryFrame />;
      case 3:
        return <ContactLens />
      case 4:
        return <OpticalLens />
      default:
        return <div></div>;
    }
  };

  return <div>{renderSubStep()}</div>;
};

export default StepThreeMain;
