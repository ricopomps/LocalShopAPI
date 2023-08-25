import { InferSchemaType, Schema, model } from "mongoose";

export enum ProductCategories {
  food = "Comida",
  medicine = "Medicamento",
  eletronics = "Eletrônicos",
  fastFood = "Fast Food",
  pets = "Pets",
}

const productSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    category: {
      type: String,
      required: true,
      enum: Object.values(ProductCategories),
    },
    price: { type: Number, required: true },
    location: {
      x: { type: Number },
      y: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

export type Product = InferSchemaType<typeof productSchema>;

export default model<Product>("Product", productSchema);
