import { InferSchemaType, Schema, Types, model } from "mongoose";

export enum StoreCategories {
  market = "Mercado",
  retail = "Varejo",
  eletronics = "Eletrônicos",
  fastFood = "Fast Food",
}

const storeSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    cnpj: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: Object.values(StoreCategories),
    },
  },
  {
    timestamps: true,
  }
);

export type Store = InferSchemaType<typeof storeSchema> & {
  _id: Types.ObjectId;
};

export default model<Store>("Store", storeSchema);
