import { ClientSession } from "mongoose";
import ShoppingListHistoryModel from "../models/shoppingListHistory";
import { PopulatedShoppingList } from "./shoppingListService";

export interface IShoppingListHistoryService {
  createHistory(
    shoppingList: PopulatedShoppingList,
    session: ClientSession
  ): Promise<void>;
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
}
