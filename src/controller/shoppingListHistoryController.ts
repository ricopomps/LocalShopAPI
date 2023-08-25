import { RequestHandler } from "express";
import mongoose, { ObjectId } from "mongoose";
import createHttpError from "http-errors";
import ShoppingListHistoryModel from "../models/shoppingListHistory";

interface CreateShoppingListHistoryBody {
  storeId?: ObjectId;
  products?: { product: string; quantity: number }[];
  totalValue?: number;
}

export const createShoppingListHistory: RequestHandler<
  unknown,
  unknown,
  CreateShoppingListHistoryBody,
  unknown
> = async (req, res, next) => {
  try {
    const creatorId = req.userId;
    const { storeId, products, totalValue } = req.body;

    if (!mongoose.isValidObjectId(creatorId || storeId)) {
      throw createHttpError(400, "Id inválido");
    }

    if (!products || products?.length == 0) {
      throw createHttpError(
        400,
        "Não é possível salvar uma lista de compras sem produtos."
      );
    }

    if (!totalValue) {
      throw createHttpError(
        400,
        "Deve ser informado o valor total da lista de compras."
      );
    }

    await ShoppingListHistoryModel.create({
      storeId,
      creatorId,
      products,
      totalValue,
    });

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

interface GetShoppingListsHistoryByUserParams {
  storeId: string;
}
interface GetShoppingListsHistoryByUserFilter {
  creatorId: mongoose.Types.ObjectId;
  storeId?: mongoose.Types.ObjectId;
}

interface Filter {
  $match: GetShoppingListsHistoryByUserFilter;
}

export const getShoppingListsHistoryByUser: RequestHandler<
  GetShoppingListsHistoryByUserParams,
  unknown,
  unknown,
  unknown
> = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!mongoose.isValidObjectId(userId)) {
      throw createHttpError(400, "Id do usuário inválido.");
    }
    const { storeId } = req.params;

    if (!storeId || (storeId && !mongoose.isValidObjectId(storeId))) {
      throw createHttpError(400, "Id da loja inválido.");
    }

    const filter: Filter = {
      $match: { creatorId: new mongoose.Types.ObjectId(userId) },
    };

    if (storeId) {
      filter.$match.storeId = new mongoose.Types.ObjectId(storeId);
    }

    const shoppingListsHistory = await ShoppingListHistoryModel.aggregate([
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

    res.status(200).json(shoppingListsHistory);
  } catch (error) {
    next(error);
  }
};
