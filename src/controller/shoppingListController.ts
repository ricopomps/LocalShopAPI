import { RequestHandler } from "express";
import mongoose, { ObjectId } from "mongoose";
import createHttpError from "http-errors";
import ShoppingListModel, {
  ShoppingListProducts,
} from "../models/shoppingList";

interface CreateShoppingListBody {
  storeId?: ObjectId;
  products?: ShoppingListProducts[];
  totalValue?: number;
}

export const createShoppingList: RequestHandler<
  unknown,
  unknown,
  CreateShoppingListBody,
  unknown
> = async (req, res, next) => {
  try {
    const creatorId = req.userId;
    const { storeId, products, totalValue } = req.body;

    if (!mongoose.isValidObjectId(creatorId || storeId)) {
      throw createHttpError(400, "Id inválido");
    }

    if (products?.length == 0) {
      throw createHttpError(
        400,
        "Não é possível criar uma lista de compras sem produtos"
      );
    }

    const shoppingList = await ShoppingListModel.create({
      storeId,
      creatorId,
      products,
      totalValue,
    });

    res.status(200).json(shoppingList);
  } catch (error) {
    next(error);
  }
};

interface GetShoppingListsByUserParams {
  userId: string;
}

interface GetShoppingListsByUserQuery {
  storeId?: string;
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
  GetShoppingListsByUserQuery
> = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      throw createHttpError(400, "Id do usuário inválido");
    }

    const { storeId } = req.query;

    if (storeId && !mongoose.isValidObjectId(storeId)) {
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
                  $arrayElemAt: ["$populatedProducts", 0],
                },
                quantity: "$$productObj.quantity",
              },
            },
          },
        },
      },
      { $unset: "populatedProducts" },
    ]).exec();

    res.status(203).json(shoppingLists);
  } catch (error) {
    next(error);
  }
};
