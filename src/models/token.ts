import { InferSchemaType, Schema, model } from "mongoose";

const tokenSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expireAt: { type: Date, required: true },
});

tokenSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

type Token = InferSchemaType<typeof tokenSchema>;

export default model<Token>("Token", tokenSchema);
