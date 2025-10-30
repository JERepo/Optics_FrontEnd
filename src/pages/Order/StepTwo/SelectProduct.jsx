import React, { useState } from "react";
import { useOrder } from "../../../features/OrderContext";
import { FiArrowLeft, FiPlus } from "react-icons/fi";
import Button from "../../../components/ui/Button";
import Radio from "../../../components/Form/Radio";
import toast from "react-hot-toast";
import { useGetSavedOrderDetailsQuery } from "../../../api/orderApi";

const Products = [
  { value: 6, label: "Frame/Sunglass + lens" },
  { value: 1, label: "Frame/Sunglass" },
  { value: 2, label: "Optical Lens" },
  { value: 3, label: "Contact Lens" },
  { value: 4, label: "Accessories" },
  { value: 5, label: "Bulk Process" },
];

const SelectProduct = () => {
  const {
    goToSubStep,
    goToStep,
    setSelectedProduct,
    selectedProduct,
    customerId,
  } = useOrder();
  const { data: savedOrders, isLoading: savedOrdersLoading } =
    useGetSavedOrderDetailsQuery({ orderId: customerId.orderId });
  const handleAddProduct = () => {
     if (savedOrders?.length && savedOrders?.every((item) => item.offer?.offerType === 4)) {
      toast.error("Offers got applied for all the products in OrderDetails please remove them to add products!");
      return;
    }
    if (selectedProduct?.value === 1) {
      setSelectedProduct(selectedProduct);
      goToStep(3);
      goToSubStep(1); // Frame/Sunglass
    } else if (selectedProduct?.value === 4) {
      setSelectedProduct(selectedProduct);
      goToStep(3);
      goToSubStep(2); // AccessoryFrame
    } else if (selectedProduct?.value === 3) {
      setSelectedProduct(selectedProduct);
      goToStep(3);
      goToSubStep(3); // Contact Lens
    } else if (selectedProduct?.value === 2) {
      setSelectedProduct(selectedProduct);
      goToStep(3);
      goToSubStep(4); // Optical Lens
    } else if (selectedProduct?.value === 6) {
      setSelectedProduct(selectedProduct);
      goToStep(3);
      goToSubStep(5); // Optical Lens
    } else {
      toast.error("Invalid selection type no product available");
      console.warn("Invalid product selection. No matching substep.");
    }
  };

  return (
    <div className="max-w-6xl p-6 bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Select Product</h1>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={() => goToStep(1)}
            icon={FiArrowLeft}
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            Back
          </Button>
          <Button
            onClick={() => goToStep(4)}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
            disabled={!selectedProduct.value}
          >
            Order Details
          </Button>
          <Button
            onClick={handleAddProduct}
            icon={FiPlus}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
            disabled={!selectedProduct.value}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Product options */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-700 mb-3">
          Product Types
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Products.map((product) => (
            <div
              key={product.value}
              onClick={() => setSelectedProduct(product)}
              className={`p-4 border rounded-lg transition-all cursor-pointer ${
                selectedProduct.value === product.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="flex items-center">
                <Radio
                  label={product.label}
                  value={product.value}
                  name="productType"
                  checked={selectedProduct.value === product.value}
                  onChange={() => setSelectedProduct(product)}
                  className="text-gray-700"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectProduct;
