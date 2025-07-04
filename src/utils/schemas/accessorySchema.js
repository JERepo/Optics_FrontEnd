import { z } from "zod";

export const accessoriesMasterSchema = z.object({
  BrandID: z.coerce.string().min(1, "Brand is required"),
  ProductName: z.string().min(1, "Product Name is required").max(100,"Product name cannot exceed 100 chars"),
  ProductCode: z.string().min(1, "Product Code is required").max(30,"Product code cannot exceed 30 chars"),
  HSN: z.string().min(1, "HSN is required").max(6,"Cannot exceed more than 6"),
  TaxID: z.coerce.string().min(1, "Tax is required"),
});
