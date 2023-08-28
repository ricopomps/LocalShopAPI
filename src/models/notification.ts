import { InferSchemaType, Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    text: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

type Notification = InferSchemaType<typeof notificationSchema>;

export default model<Notification>("Notification", notificationSchema);
