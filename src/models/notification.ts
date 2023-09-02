import { InferSchemaType, Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    text: { type: String, required: true },
    read: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  }
);

export type Notification = InferSchemaType<typeof notificationSchema>;

export default model<Notification>("Notification", notificationSchema);
