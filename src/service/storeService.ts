import createHttpError from "http-errors";
import { Store } from "../models/store";
import StoreModel from "../models/store";
import { Types } from "mongoose";
import { ListStoresFilter } from "../controller/storesController";
import { IUserService, UserService } from "./userService";
export interface IStoreService {
  getStore(storeId: Types.ObjectId): Promise<Store>;
  listStores(
    filter: ListStoresFilter,
    userId: Types.ObjectId,
    favorite?: boolean
  ): Promise<Store[]>;
}

export class StoreService implements IStoreService {
  private storeRepository;
  private userService: IUserService;

  constructor() {
    this.storeRepository = StoreModel;
    this.userService = new UserService();
  }

  async getStore(storeId: Types.ObjectId): Promise<Store> {
    const store = await this.storeRepository.findById(storeId).exec();

    if (!store) throw createHttpError(404, "Store não encontrada");

    return store;
  }

  async listStores(
    filter: ListStoresFilter,
    userId: Types.ObjectId,
    favorite?: boolean
  ): Promise<Store[]> {
    if (favorite) {
      const favoriteStores = await this.userService.getFavoriteStores(userId);
      filter._id = { $in: favoriteStores };
    }

    const stores = await this.storeRepository.find(filter).exec();

    return stores;
  }
}
