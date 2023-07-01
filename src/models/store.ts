import { InferSchemaType, Schema, model } from "mongoose";

const storeSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
  },
  {
    timestamps: true,
  }
);

type Store = InferSchemaType<typeof storeSchema>;

export default model<Store>("Store", storeSchema);
