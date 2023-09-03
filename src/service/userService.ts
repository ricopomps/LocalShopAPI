import { Types } from "mongoose";
import UserModel, { User } from "../models/user";

export interface IUserService {
  getUsersByFavoriteProduct(productId: Types.ObjectId): Promise<User[]>;
}

export class UserService implements IUserService {
  private userRepository;
  constructor() {
    this.userRepository = UserModel;
  }

  async getUsersByFavoriteProduct(productId: Types.ObjectId): Promise<User[]> {
    const users = await this.userRepository.find({
      favoriteProducts: productId,
    });
    return users;
  }
}
