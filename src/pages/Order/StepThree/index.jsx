import React from "react";
import { useOrder } from "../../../features/OrderContext";
import FrameSunglass from "./FrameSunglass";
import AccessoryFrame from "./AccessoryFrame";
import ContactLens from "./ContactLens";
import FrameSunglassAndOpticalLens from "./FrameSunglassAndOpticalLens";
import OpticalLens from "./OptcalLens/OpticalLens";

const StepThreeMain = (props) => {
  const { currentSubStep } = useOrder();

  const renderSubStep = () => {
    console.log("current sub step",currentSubStep)
    switch (currentSubStep) {
      case 1:
        return <FrameSunglass />;
      case 2:
        return <AccessoryFrame />;
      case 3:
        return <ContactLens />;
      case 4:
        return <OpticalLens />;
      case 5:
        return <FrameSunglassAndOpticalLens />;
      default:
        return <div></div>;
    }
  };

  return <div>{renderSubStep()}</div>;
};

export default StepThreeMain;
