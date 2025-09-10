import toast from "react-hot-toast";

// utils/validators.js
// export function isValidNumericInput(value) {
//   // Allow only positive integers or decimals (e.g., 123, 12.34, .5, 0.5)
//   const regex = /^(?:\d+|\d*\.\d+)$/;
//   return regex.test(value);
// }

export function isValidNumericInput(value) {
  // Allow empty, or positive integers/decimals (e.g., "", 123, 12.34, .5, 0.5)
  const regex = /^(?:\d+|\d*\.\d+)?$/;
  return regex.test(value);
}


export const validateQuantity = (item, barcodeField = "Barcode") => {
  const qty = Number(item.Quantity);
  if (qty <= 0) {
    toast.error(`Available quantity is 0 for ${item[barcodeField]}. Please add another product.`);
    return false;
  }
  return true;
};

// Validate stkQty against AvlQty
export const validateStockQty = (item, newStkQty, barcodeField = "Barcode") => {
  const avlQty = Number(item.Quantity);
  if (newStkQty > avlQty) {
    toast.error(
      `Stock quantity (${newStkQty}) cannot exceed available quantity (${avlQty}) for ${item[barcodeField]}.`
    );
    return false;
  }
  return true;
};