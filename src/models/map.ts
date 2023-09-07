import { InferSchemaType, Schema, model } from "mongoose";

export enum MapCellTypes {
  entrance = "Entrada",
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
        x: { type: Number, required: true },
        y: { type: Number, required: true },
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

export type Map = InferSchemaType<typeof mapSchema>;

export default model<Map>("Map", mapSchema);
