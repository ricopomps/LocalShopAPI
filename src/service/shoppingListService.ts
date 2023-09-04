import { Types, startSession } from "mongoose";
import ShoppingListModel, {
  ShoppingList,
  ShoppingListItem,
} from "../models/shoppingList";
import { IProductService, ProductService } from "./productService";
import createHttpError from "http-errors";
import { Store } from "../models/store";
import { User } from "../models/user";
import { Product } from "../models/product";
import {
  IShoppingListHistoryService,
  ShoppingListHistoryService,
} from "./shoppingListHistoryService";

export type PopulatedShoppingList = {
  store: Store;
  creator: User;
  products: {
    product: Product;
    quantity: number;
  }[] &
    ShoppingList;
};

export interface IShoppingListService {
  createOrUpdateShoppingList(
    creatorId: Types.ObjectId,
    storeId: Types.ObjectId,
    products: ShoppingListItem[]
  ): Promise<ShoppingList>;

  getShoppingListsByUser(
    userId: Types.ObjectId,
    storeId: Types.ObjectId
  ): Promise<PopulatedShoppingList | null>;

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
  private productsService: IProductService;
  private shoppingListHistoryService: IShoppingListHistoryService;
  private shoppingListRepository;

  constructor() {
    this.productsService = new ProductService();
    this.shoppingListHistoryService = new ShoppingListHistoryService();
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

    const productsInStock = await this.productsService.getProducts(
      products.map((item) => item.product)
    );

    products.forEach((product) => {
      const productInStock = productsInStock.find((stockProduct) =>
        stockProduct._id.equals(product.product)
      );
      if (productInStock) {
        if (productInStock.stock < product.quantity)
          throw createHttpError(
            400,
            `O produto '${productInStock.name}' não está mais em estoque (Estoque disponível: ${productInStock.stock})`
          );
      } else {
        throw createHttpError(404, `O produto não está mais disponivel`);
      }
    });

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
  ): Promise<PopulatedShoppingList | null> {
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

      const productsInStock = await this.productsService.getProducts(
        products.map((item) => item.product)
      );

      const removeStockPromises = products.map((product) => {
        const productInStock = productsInStock.find((stockProduct) =>
          stockProduct._id.equals(product.product)
        );
        if (productInStock) {
          if (productInStock.stock < product.quantity)
            throw createHttpError(
              400,
              `O produto '${productInStock.name}' não está mais em estoque (Estoque disponível: ${productInStock.stock})`
            );
          return this.productsService.removeStock(
            productInStock._id.toString(),
            product.quantity,
            session
          );
        } else {
          throw createHttpError(404, `O produto não está mais disponivel`);
        }
      });

      await Promise.all(removeStockPromises);

      const shoppingList = await this.getShoppingListsByUser(
        creatorId,
        storeId
      );

      if (!shoppingList)
        throw createHttpError(404, `Lista de compras não está mais disponível`);

      await this.shoppingListHistoryService.createHistory(
        shoppingList,
        session
      );

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
