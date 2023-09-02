import { InferSchemaType, Schema, model } from "mongoose";

export enum MapCellTypes {
  shelf = "Prateleira",
  fridge = "Frios",
  checkoutCounter = "Caixa",
  obstacle = "Obstáculo",
}

const mapSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store" },
    items: [
      {
        x: { type: Number },
        y: { type: Number },
        type: {
          type: String,
          enum: Object.values(MapCellTypes),
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

type Map = InferSchemaType<typeof mapSchema>;

export default model<Map>("Map", mapSchema);
