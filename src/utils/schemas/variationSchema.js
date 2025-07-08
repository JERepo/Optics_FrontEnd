import { z } from "zod";

export const variationSchema = z.object({
  OPVariationID: z.string().nonempty("Variation is required"),
  SKUCode: z.string().nonempty("SKU Code is required"),
  Barcode: z.string().nonempty("Barcode is required"),
  OPMRP: z
    .string()
    .nonempty("SRP is required")
    .regex(/^\d{0,10}(\.\d{0,2})?$/, "Invalid price format (max 2 decimal places)"),
});