import createHttpError from "http-errors";
import { Store } from "../models/store";
import StoreModel from "../models/store";
import { Types } from "mongoose";
export interface IStoreService {
  getStore(storeId: Types.ObjectId): Promise<Store>;
}

export class StoreService implements IStoreService {
  private storeRepository;
  constructor() {
    this.storeRepository = StoreModel;
  }
  async getStore(storeId: Types.ObjectId): Promise<Store> {
    const store = await this.storeRepository.findById(storeId).exec();

    if (!store) throw createHttpError(404, "Store não encontrada");

    return store;
  }
}
