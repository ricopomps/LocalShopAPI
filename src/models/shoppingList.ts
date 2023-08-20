import { InferSchemaType, Schema, model } from "mongoose";
import { Product } from "./product";

export type ShoppingListProducts = {
  product: Product;
  quantity: number;
};

const shoppingListSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

type ShoppingList = InferSchemaType<typeof shoppingListSchema>;

export default model<ShoppingList>("ShoppingList", shoppingListSchema);
