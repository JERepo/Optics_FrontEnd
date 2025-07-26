import React from "react";
import { useOrder } from "../../../features/OrderContext";
import SelectProduct from "./SelectProduct";
import FrameSunglass from "../StepThree/FrameSunglass";

const StepTwoMain = () => {
  const { currentSubStep } = useOrder();

  const renderSubStep = () => {
    switch (currentSubStep) {
      case 1:
        return <SelectProduct />;

      default:
        return <div></div>;
    }
  };

  return <div>{renderSubStep()}</div>;
};

export default StepTwoMain;
