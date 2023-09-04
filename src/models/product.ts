import { InferSchemaType, Schema, Types, model } from "mongoose";

export enum ProductCategories {
  food = "Comida",
  medicine = "Medicamento",
  eletronics = "Eletrônicos",
  fastFood = "Fast Food",
  pets = "Pets",
}

export const productSchema = new Schema(
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
    sale: { type: Boolean, required: true, default: false },
    oldPrice: { type: Number },
    salePercentage: { type: Number },
    stock: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  }
);

export type Product = InferSchemaType<typeof productSchema> & {
  _id: Types.ObjectId;
};

export default model<Product>("Product", productSchema);
