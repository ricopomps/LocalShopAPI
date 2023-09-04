import { InferSchemaType, Schema, model } from "mongoose";
import { productSchema } from "./product";

const shoppingListHistorySchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    products: [
      {
        product: productSchema,
        quantity: { type: Number, required: true },
      },
    ],
    totalValue: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

export type ShoppingListHistory = InferSchemaType<
  typeof shoppingListHistorySchema
>;

export default model<ShoppingListHistory>(
  "ShoppingListHistory",
  shoppingListHistorySchema
);
