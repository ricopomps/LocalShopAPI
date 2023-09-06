import { RequestHandler } from "express";
import mongoose, { ObjectId, Types } from "mongoose";
import createHttpError from "http-errors";
import ShoppingListHistoryModel from "../models/shoppingListHistory";
import { Product } from "../models/product";

interface CreateShoppingListHistoryBody {
  storeId?: ObjectId;
  products?: { product: Product; quantity: number }[];
}

export const createShoppingListHistory: RequestHandler<
  unknown,
  unknown,
  CreateShoppingListHistoryBody,
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
        "Não é possível salvar uma lista de compras sem produtos."
      );
    }

    let totalValue = 0;
    products.forEach((p) => (totalValue += p.product.price * p.quantity));

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
  _id?: mongoose.Types.ObjectId;
}

export interface FilterHistory {
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

    const filter: FilterHistory = {
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
    ]).exec();

    res.status(200).json(shoppingListsHistory);
  } catch (error) {
    next(error);
  }
};

export const getAllShoppingListsHistoryByUser: RequestHandler<
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

    const filter: FilterHistory = {
      $match: { creatorId: new mongoose.Types.ObjectId(userId) },
    };

    const shoppingListsHistory = await ShoppingListHistoryModel.aggregate([
      filter,
      { $sort: { _id: -1 } },
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
    ]).exec();

    res.status(200).json(shoppingListsHistory);
  } catch (error) {
    next(error);
  }
};

interface GetShoppingListsHistoryParams {
  shoppingListId: Types.ObjectId;
}

export const getShoppingListsHistory: RequestHandler<
  GetShoppingListsHistoryParams,
  unknown,
  unknown,
  unknown
> = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!mongoose.isValidObjectId(userId)) {
      throw createHttpError(400, "Id do usuário inválido.");
    }
    const { shoppingListId } = req.params;

    if (
      !shoppingListId ||
      (shoppingListId && !mongoose.isValidObjectId(shoppingListId))
    ) {
      throw createHttpError(400, "Id do histórico inválido.");
    }

    const filter: FilterHistory = {
      $match: {
        creatorId: new mongoose.Types.ObjectId(userId),
        _id: new mongoose.Types.ObjectId(shoppingListId),
      },
    };

    const shoppingListsHistory = await ShoppingListHistoryModel.aggregate([
      filter,
      { $sort: { _id: 1 } },
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
    ]).exec();

    res.status(200).json(shoppingListsHistory[0]);
  } catch (error) {
    next(error);
  }
};
