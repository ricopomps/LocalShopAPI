import { RequestHandler } from "express";
import mongoose, { Types } from "mongoose";
import createHttpError from "http-errors";
import { ShoppingListItem } from "../models/shoppingList";
import { ShoppingListService } from "../service/shoppingListService";
import { assertIsDefined } from "../util/assertIsDefined";

const shoppingListService = new ShoppingListService();
interface CreateShoppingListBody {
  storeId?: Types.ObjectId;
  products?: ShoppingListItem[];
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

    if (!storeId) throw createHttpError(400, "Loja inválida");

    const shoppingList = await shoppingListService.createOrUpdateShoppingList(
      creatorId,
      storeId,
      products
    );

    res.status(200).json(shoppingList);
  } catch (error) {
    next(error);
  }
};

interface GetShoppingListsByUserParams {
  storeId: Types.ObjectId;
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

    const shoppingList = await shoppingListService.getShoppingListsByUser(
      userId,
      storeId
    );

    res.status(200).json(shoppingList);
  } catch (error) {
    next(error);
  }
};

interface FinishShoppingListBody {
  storeId?: Types.ObjectId;
  products?: ShoppingListItem[];
}

export const finishShoppingList: RequestHandler<
  unknown,
  unknown,
  FinishShoppingListBody,
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
        "Não é possível finalizar uma lista de compras sem produtos"
      );
    }

    if (!storeId) throw createHttpError(400, "Loja inválida");

    await shoppingListService.finishShoppingList(creatorId, storeId, products);

    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
};

interface CopyHistoryListParams {
  historyId: Types.ObjectId;
}

export const copyHistoryList: RequestHandler<
  CopyHistoryListParams,
  unknown,
  unknown,
  unknown
> = async (req, res, next) => {
  try {
    const { historyId } = req.params;
    assertIsDefined(historyId);
    await shoppingListService.copyHistoryList(historyId);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export const getShoppingListShortestPath: RequestHandler<
  unknown,
  unknown,
  CreateShoppingListBody,
  unknown
> = async (req, res, next) => {
  try {
    const creatorId = req.userId;
    const { storeId, products } = req.body;
    assertIsDefined(storeId);

    if (!mongoose.isValidObjectId(creatorId || storeId)) {
      throw createHttpError(400, "Id inválido");
    }

    if (!products || products?.length == 0) {
      throw createHttpError(
        400,
        "Não é possível criar uma lista de compras sem produtos"
      );
    }

    const paths = await shoppingListService.getShoppingListShortestPath(
      creatorId,
      storeId,
      products
    );
    res.status(200).json(paths);
  } catch (error) {
    next(error);
  }
};
