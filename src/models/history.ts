import { InferSchemaType, Schema, model } from "mongoose";
import shoppingList, { ShoppingListProducts } from "./shoppingList";

  const historySchema = new Schema(
    {
      storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
      creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      shoppingList: {type: shoppingList, ref: "shoppingList", required: true},
      date: {type: Date, ref: "data", required: true}
    },
    {
      timestamps: true,
    }
  );
  
  type History = InferSchemaType<typeof historySchema>;
  
  export default model<History>("History", historySchema);