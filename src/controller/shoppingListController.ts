import { RequestHandler } from "express";
import mongoose, { ObjectId } from "mongoose";
import createHttpError from "http-errors";
import ShoppingListModel from "../models/shoppingList";

interface CreateShoppingListBody {
  storeId?: ObjectId;
  products?: { product: string; quantity: number }[];
}

export const createShoppingList: RequestHandler<
  unknown,
  unknown,
  CreateShoppingListBody,
  unknown
> = async (req, res, next) => {
  try {
    const creatorId = req.userId;
    const { storeId, products } = req.body;

    if (!mongoose.isValidObjectId(creatorId || storeId)) {
      throw createHttpError(400, "Id inválido");
    }

    if (!products || products?.length == 0) {
      throw createHttpError(
        400,
        "Não é possível criar uma lista de compras sem produtos"
      );
    }

    let shoppingList = await ShoppingListModel.findOne({
      creatorId,
      storeId,
    }).exec();

    if (shoppingList) {
      shoppingList.products = products.map((item) => {
        return {
          product: new mongoose.Types.ObjectId(item.product),
          quantity: item.quantity,
        };
      });
      await shoppingList.save();
    } else {
      shoppingList = await ShoppingListModel.create({
        storeId,
        creatorId,
        products,
      });
    }

    res.status(200).json(shoppingList);
  } catch (error) {
    next(error);
  }
};

interface GetShoppingListsByUserParams {
  storeId: string;
}
interface GetShoppingListsByUserFilter {
  creatorId: mongoose.Types.ObjectId;
  storeId?: mongoose.Types.ObjectId;
}

interface Filter {
  $match: GetShoppingListsByUserFilter;
}

export const getShoppingListsByUser: RequestHandler<
  GetShoppingListsByUserParams,
  unknown,
  unknown,
  unknown
> = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!mongoose.isValidObjectId(userId)) {
      throw createHttpError(400, "Id do usuário inválido");
    }
    const { storeId } = req.params;

    if (!storeId || (storeId && !mongoose.isValidObjectId(storeId))) {
      throw createHttpError(400, "Id da loja inválido");
    }

    const filter: Filter = {
      $match: { creatorId: new mongoose.Types.ObjectId(userId) },
    };

    if (storeId) {
      filter.$match.storeId = new mongoose.Types.ObjectId(storeId);
    }

    const shoppingLists = await ShoppingListModel.aggregate([
      filter,
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
    ]).exec();

    res.status(200).json(shoppingLists[0]);
  } catch (error) {
    next(error);
  }
};
