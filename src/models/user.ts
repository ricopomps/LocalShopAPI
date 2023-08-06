import { InferSchemaType, Schema, model } from "mongoose";

export enum UserType {
  shopper = "shopper",
  store = "lojista",
}

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, select: false },
  password: { type: String, required: true, select: false },
  cpf: { type: String, required: true, unique: true, select: false},
  userType: {
    type: String,
    required: true,
    default: UserType.shopper,
    enum: Object.values(UserType),
  },
});

export type User = InferSchemaType<typeof userSchema>;

export default model<User>("User", userSchema);
