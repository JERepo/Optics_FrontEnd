import { z } from "zod";

export const frameMasterSchema = z.object({
  BrandID: z.string().min(1, "Brand is required"),
  ModelNo: z
    .string()
    .min(1, "Model Number is required")
    .max(30, "Cannot exceed 30 characters"),
  Category: z.union([z.literal("0"), z.literal("1")], {
    errorMap: () => ({ message: "Category is required" }),
  }),
  Type: z.string().min(1, "Rim Type is required"),
  HSN: z.string().min(1, "HSN Code is required"),
  TaxID: z.string().min(1, "Tax is required"),

  // Optional fields (not required)
  ShapeID: z.string().optional(),
  FrontMaterialID: z.string().optional(),
  TempleMaterialID: z.string().optional(),
  Gender: z.string().optional(),
  IsClipOn: z.boolean().optional(),
  NoOfClips: z.union([z.string(), z.number()]).optional(),
  IsRxable: z.boolean().optional(),
  CaptureSlNo: z.union([z.string(), z.number()]).optional(),
});

export const defaultFrameMasterValues = {
  BrandID: "", // Changed from 0 to "0"
  ModelNo: "",
  Category: "0",
  Type: "", // Changed from 0 to "0"
  ShapeID: "0", // Changed from 0 to "0"
  FrontMaterialID: "0", // Changed from 0 to "0"
  TempleMaterialID: "0", // Changed from 0 to "0"
  Gender: "",
  IsClipOn: false,
  NoOfClips: "0", // Changed from 0 to "0"
  IsRxable: true,
  CaptureSlNo: "0", // Changed from 0 to "0"
  HSN: "",
  TaxID: "", // Changed from 0 to "0"
};
