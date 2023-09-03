import { Types } from "mongoose";
import UserModel, { User } from "../models/user";
import createHttpError from "http-errors";

export interface IUserService {
  getUsersByFavoriteProduct(productId: Types.ObjectId): Promise<User[]>;
  getFavoriteStores(userId: Types.ObjectId): Promise<Types.ObjectId[]>;
  getFavoriteProducts(userId: Types.ObjectId): Promise<Types.ObjectId[]>;
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

  async getFavoriteStores(userId: Types.ObjectId): Promise<Types.ObjectId[]> {
    const user = await this.userRepository.findById(userId).exec();
    if (!user) throw createHttpError(404, "Usuário não encontrado");
    return user.favoriteStores;
  }

  async getFavoriteProducts(userId: Types.ObjectId): Promise<Types.ObjectId[]> {
    const user = await this.userRepository.findById(userId).exec();
    if (!user) throw createHttpError(404, "Usuário não encontrado");
    return user.favoriteProducts;
  }
}
