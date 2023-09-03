import { Types, startSession } from "mongoose";
import ShoppingListModel, {
  ShoppingList,
  ShoppingListItem,
} from "../models/shoppingList";

export interface IShoppingListService {
  createOrUpdateShoppingList(
    creatorId: Types.ObjectId,
    storeId: Types.ObjectId,
    products: ShoppingListItem[]
  ): Promise<ShoppingList>;

  getShoppingListsByUser(
    userId: Types.ObjectId,
    storeId: Types.ObjectId
  ): Promise<ShoppingList | null>;

  finishShoppingList(
    creatorId: Types.ObjectId,
    storeId: Types.ObjectId,
    products: ShoppingListItem[]
  ): Promise<void>;
}

interface GetShoppingListsByUserFilter {
  creatorId: Types.ObjectId;
  storeId?: Types.ObjectId;
}

export class ShoppingListService implements IShoppingListService {
  private shoppingListRepository;

  constructor() {
    this.shoppingListRepository = ShoppingListModel;
  }

  async createOrUpdateShoppingList(
    creatorId: Types.ObjectId,
    storeId: Types.ObjectId,
    products: ShoppingListItem[]
  ): Promise<ShoppingList> {
    let shoppingList = await this.shoppingListRepository
      .findOne({
        creatorId,
        storeId,
      })
      .exec();

    //check if there is enough stock to create/update

    if (shoppingList) {
      shoppingList.products = products.map((item) => ({
        product: new Types.ObjectId(item.product),
        quantity: item.quantity,
      }));

      await shoppingList.save();
    } else {
      shoppingList = await this.shoppingListRepository.create({
        storeId,
        creatorId,
        products: products.map((item) => ({
          product: new Types.ObjectId(item.product),
          quantity: item.quantity,
        })),
      });
    }

    return shoppingList;
  }

  async getShoppingListsByUser(
    userId: Types.ObjectId,
    storeId: Types.ObjectId
  ): Promise<ShoppingList | null> {
    const filter: GetShoppingListsByUserFilter = {
      creatorId: new Types.ObjectId(userId),
      storeId: new Types.ObjectId(storeId),
    };

    const shoppingLists = await this.shoppingListRepository
      .aggregate([
        {
          $match: filter,
        },
        {
          $lookup: {
            from: "users",
            localField: "creatorId",
            foreignField: "_id",
            as: "creator",
          },
        },
        {
          $unwind: "$creator",
        },
        { $unset: "creator.password" },
        {
          $lookup: {
            from: "stores",
            localField: "storeId",
            foreignField: "_id",
            as: "store",
          },
        },
        {
          $unwind: "$store",
        },
        {
          $lookup: {
            from: "products",
            localField: "products.product",
            foreignField: "_id",
            as: "populatedProducts",
          },
        },
        {
          $addFields: {
            products: {
              $map: {
                input: "$products",
                as: "productObj",
                in: {
                  product: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$populatedProducts",
                          as: "populatedProduct",
                          cond: {
                            $eq: [
                              "$$populatedProduct._id",
                              "$$productObj.product",
                            ],
                          },
                        },
                      },
                      0,
                    ],
                  },
                  quantity: "$$productObj.quantity",
                },
              },
            },
          },
        },
        { $unset: "populatedProducts" },
      ])
      .exec();

    return shoppingLists[0] || null;
  }

  async finishShoppingList(
    creatorId: Types.ObjectId,
    storeId: Types.ObjectId,
    products: ShoppingListItem[]
  ) {
    const session = await startSession();
    session.startTransaction();
    try {
      await this.createOrUpdateShoppingList(creatorId, storeId, products);
      //remove from stock the products
      //call history
      await this.shoppingListRepository
        .findOneAndDelete({ creatorId, storeId })
        .session(session);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}
