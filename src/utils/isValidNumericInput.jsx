// utils/validators.js
export function isValidNumericInput(value) {
  // Allow only numbers or decimal values (e.g., 123, 12.34, .5, 0.5)
  const regex = /^\d*\.?\d*$/;

  return regex.test(value);
}
