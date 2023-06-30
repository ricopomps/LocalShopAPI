import { InferSchemaType, Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
  },
  {
    timestamps: true,
  }
);

type Product = InferSchemaType<typeof productSchema>;

export default model<Product>("Product", productSchema);
