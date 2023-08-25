import { InferSchemaType, Schema, model } from "mongoose";

const shoppingListHistorySchema = new Schema(
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
    totalValue: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

type ShoppingListHistory = InferSchemaType<typeof shoppingListHistorySchema>;

export default model<ShoppingListHistory>(
  "ShoppingListHistory",
  shoppingListHistorySchema
);