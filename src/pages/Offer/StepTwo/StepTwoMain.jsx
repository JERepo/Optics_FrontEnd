import React from "react";
import { useOrder } from "../../../features/OrderContext";
import SelectProduct from "./SelectProduct";

const StepTwoMain = () => {
  const { currentOfferSubStep } = useOrder();

  const renderSubStep = () => {
    switch (currentOfferSubStep) {
      case 1:
        return <SelectProduct />;

      default:
        return <div></div>;
    }
  };

  return <div>{renderSubStep()}</div>;
};

export default StepTwoMain;
