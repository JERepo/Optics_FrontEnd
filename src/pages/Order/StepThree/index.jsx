import React from "react";
import { useOrder } from "../../../features/OrderContext";
import FrameSunglass from "./FrameSunglass";
import AccessoryFrame from "./AccessoryFrame";
import ContactLens from "./ContactLens";

const StepThreeMain = (props) => {
  const { currentSubStep, nextSubStep, prevSubStep, goToStep } = useOrder();
console.log("current sub steps",currentSubStep)
  const renderSubStep = () => {
    switch (currentSubStep) {
      case 1:
        return <FrameSunglass />;
      case 2:
        return <AccessoryFrame />;
      case 3:
        return <ContactLens />
      default:
        return <div></div>;
    }
  };

  return <div>{renderSubStep()}</div>;
};

export default StepThreeMain;
