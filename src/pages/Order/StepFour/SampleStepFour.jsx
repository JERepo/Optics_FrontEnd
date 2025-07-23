import React from "react";
import { useOrder } from "../../../features/OrderContext";
import Button from "../../../components/ui/Button";

const SampleStepFour = () => {
  const { goToStep } = useOrder();

  const handleAddproduct = () => {
    goToStep(2);
  };
  return (
    <div>
      SampleStepFour
      <Button onClick={handleAddproduct}>Add Product</Button>
    </div>
  );
};

export default SampleStepFour;
