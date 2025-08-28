import { useOrder } from "../../../features/OrderContext";
import Button from "../../../components/ui/Button";
import Radio from "../../../components/Form/Radio";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

const Products = [
  { value: 1, label: "Frame/Sunglass" },
  { value: 2, label: "Optical Lens" },
  { value: 3, label: "Contact Lens" },
  { value: 4, label: "Accessories" },
];

const SelectProduct = () => {
  const navigate = useNavigate();
  const {
    setStockTransferInDraftData,
    customerStockTransferIn,
    setCustomerStockTransferIn,
    currentStockTransferInStep,
    goToStockTransferInStep,
    prevStockTransferInStep,
    selectedStockTransferInProduct,
    setSelectedStockTransferInProduct,
    goToSubStockTransferInStep,
  } = useOrder();
  const handleAddProduct = () => {
    if (selectedStockTransferInProduct?.value === 1) {
      console.log("comin", selectedStockTransferInProduct);
      goToStockTransferInStep(3);
      goToSubStockTransferInStep(1); // Frame/Sunglass
    } else if (selectedStockTransferInProduct?.value === 4) {
      goToStockTransferInStep(3);
      goToSubStockTransferInStep(2); // AccessoryFrame
    } else if (selectedStockTransferInProduct?.value === 3) {
      goToStockTransferInStep(3);
      goToSubStockTransferInStep(3); // Contact Lens
    } else if (selectedStockTransferInProduct?.value === 2) {
      goToStockTransferInStep(3);
      goToSubStockTransferInStep(4); // Optical Lens
    } else {
      toast.error("Invalid selection type no product available");
      console.warn("Invalid product selection. No matching substep.");
    }
  };

  return (
    <div className="max-w-6xl p-6 bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">
          Step 2: Select Product
        </h1>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* <Button
            onClick={() => navigate(-1)}
            
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            CN Main Page
          </Button> */}
          <Button
            onClick={() => goToStockTransferInStep(4)}
            // icon={FiPlus}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
            disabled={!selectedStockTransferInProduct.value}
          >
            StockIn Details
          </Button>
          <Button
            onClick={handleAddProduct}
            // icon={FiPlus}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
            disabled={!selectedStockTransferInProduct?.value}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Product options */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-700 mb-3">
          Product Types
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {Products.map((product, i) => (
            <div className="flex items-center" key={product.value}>
              <Radio
                onClick={() => setSelectedStockTransferInProduct(product)}
                label={product.label}
                value={product.value}
                name="productType"
                checked={
                  selectedStockTransferInProduct?.value === product.value
                }
                onChange={() => setSelectedStockTransferInProduct(product)}
                className="text-gray-700"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectProduct;
