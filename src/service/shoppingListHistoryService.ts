import { ClientSession, Types } from "mongoose";
import ShoppingListHistoryModel, {
  ShoppingListHistory,
} from "../models/shoppingListHistory";
import { PopulatedShoppingList } from "./shoppingListService";
import createHttpError from "http-errors";

export interface IShoppingListHistoryService {
  createHistory(
    shoppingList: PopulatedShoppingList,
    session: ClientSession
  ): Promise<void>;
  getShoppingListHistory(
    shoppingListHistoryId: Types.ObjectId
  ): Promise<ShoppingListHistory>;
}

export class ShoppingListHistoryService implements IShoppingListHistoryService {
  private shoppingListHistoryRepository;
  constructor() {
    this.shoppingListHistoryRepository = ShoppingListHistoryModel;
  }

  async createHistory(
    shoppingList: PopulatedShoppingList,
    session: ClientSession
  ): Promise<void> {
    let totalValue = 0;
    shoppingList?.products.forEach(
      (productItem) =>
        (totalValue += productItem.product.price * productItem.quantity)
    );

    await this.shoppingListHistoryRepository.create(
      [
        {
          storeId: shoppingList.store._id,
          creatorId: shoppingList.creator._id,
          products: shoppingList?.products,
          totalValue,
        },
      ],
      { session }
    );
  }

  async getShoppingListHistory(
    shoppingListHistoryId: Types.ObjectId
  ): Promise<ShoppingListHistory> {
    const shoppingListsHistory = await this.shoppingListHistoryRepository
      .findById(shoppingListHistoryId)
      .exec();

    if (!shoppingListsHistory)
      throw createHttpError(404, "Histórico não encontrado");
    return shoppingListsHistory;
  }
}
