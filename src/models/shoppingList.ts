import { InferSchemaType, Schema, Types, model } from "mongoose";

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

export type ShoppingList = InferSchemaType<typeof shoppingListSchema>;

export interface ShoppingListItem {
  product: Types.ObjectId;
  quantity: number;
}

export default model<ShoppingList>("ShoppingList", shoppingListSchema);
