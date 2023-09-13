import { RequestHandler } from "express";
import StoreModel, { StoreCategories } from "../models/store";
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import mongoose, { Types } from "mongoose";
import { assertIsDefined } from "../util/assertIsDefined";
import env from "../util/validateEnv";
import { StoreService } from "../service/storeService";

const storeService = new StoreService();

export const setSessionStoreId: RequestHandler = async (req, res, next) => {
  try {
    const authenticatedUserId = req.userId;
    assertIsDefined(authenticatedUserId);

    const { storeId } = req.params;

    const store = await StoreModel.findById(storeId).exec();

    if (store?.users.filter((u) => u === authenticatedUserId))
      req.storeId = store._id;

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export const getStores: RequestHandler = async (req, res, next) => {
  try {
    const stores = await StoreModel.find().exec();
    res.status(200).json(stores);
  } catch (error) {
    next(error);
  }
};

interface GetStoreParams {
  storeId: Types.ObjectId;
}

export const getStore: RequestHandler<
  GetStoreParams,
  unknown,
  unknown,
  unknown
> = async (req, res, next) => {
  try {
    const { storeId } = req.params;

    if (!mongoose.isValidObjectId(storeId)) {
      throw createHttpError(400, "Id inválido");
    }

    const store = await storeService.getStore(storeId);

    if (!store) {
      throw createHttpError(404, "Store não encontrada");
    }

    res.status(200).json(store);
  } catch (error) {
    next(error);
  }
};

interface createStoreBody {
  name?: string;
  description?: string;
  image?: string;
  cnpj?: string;
  category?: StoreCategories;
}

export const createStores: RequestHandler<
  unknown,
  unknown,
  createStoreBody,
  unknown
> = async (req, res, next) => {
  try {
    const authenticatedUserId = req.userId;
    assertIsDefined(authenticatedUserId);

    const { name, description, image, cnpj, category } = req.body;
    if (!name) {
      throw createHttpError(400, "O título é obrigatório");
    }

    if (!cnpj) {
      throw createHttpError(400, "CNPJ é obrigatório");
    }

    const existingCnpj = await StoreModel.findOne({ cnpj }).exec();

    if (existingCnpj) {
      throw createHttpError(400, "CNPJ já cadastrado");
    }

    if (!category) {
      throw createHttpError(400, "Categoria é obrigatória");
    }

    if (category && !Object.values(StoreCategories).includes(category)) {
      throw createHttpError(400, "Categoria inválida!");
    }

    const newStore = await StoreModel.create({
      name,
      description,
      image,
      users: [authenticatedUserId],
      cnpj,
      category,
    });

    req.storeId = newStore._id;
    res.status(201).json(newStore);
  } catch (error) {
    next(error);
  }
};

interface UpdateStoreParams {
  storeId: string;
}

interface UpdateStoreBody {
  name?: string;
  description?: string;
  image?: string;
  category?: StoreCategories;
  cnpj?: string;
}

export const updateStore: RequestHandler<
  UpdateStoreParams,
  unknown,
  UpdateStoreBody,
  unknown
> = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const {
      name: newName,
      description: newDescription,
      image: newImage,
      cnpj: newCnpj,
      category: newCategory,
    } = req.body;

    if (!mongoose.isValidObjectId(storeId)) {
      throw createHttpError(400, "Id inválido");
    }

    if (!newName) {
      throw createHttpError(400, "Nome é obrigatório!");
    }

    const store = await StoreModel.findById(storeId).exec();

    if (!store) {
      throw createHttpError(404, "Loja não encontrada!");
    }

    store.name = newName;
    store.description = newDescription;
    store.image = newImage;
    store.cnpj = store.cnpj ?? newCnpj;
    store.category = newCategory ?? store.category;

    const updatedStore = await store.save();

    res.status(200).json(updatedStore);
  } catch (error) {
    next(error);
  }
};

export const deleteStore: RequestHandler = async (req, res, next) => {
  try {
    const { storeId } = req.params;

    if (!mongoose.isValidObjectId(storeId)) {
      throw createHttpError(400, "Id inválido");
    }

    const store = await StoreModel.findById(storeId).exec();

    if (!store) {
      throw createHttpError(404, "Loja não encontrada");
    }

    await store.deleteOne();

    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
};

export const getStoreByLoggedUser: RequestHandler = async (req, res, next) => {
  try {
    let authenticatedUserId = req.userId;
    if (!authenticatedUserId) {
      const cookies = req.cookies;
      const refreshToken = cookies.jwt;
      if (!cookies?.jwt)
        return res.status(401).json({ message: "Unauthorized" });
      jwt.verify(
        refreshToken,
        env.REFRESH_TOKEN_SECRET,
        {},
        async (err, decoded: any) => {
          if (err) return res.status(403).json({ message: "Forbidden" });
          authenticatedUserId = decoded?.userId;
        }
      );
    }

    assertIsDefined(authenticatedUserId);

    if (!mongoose.isValidObjectId(authenticatedUserId)) {
      throw createHttpError(400, "Id inválido");
    }

    const store = await StoreModel.findOne({
      users: { $in: [authenticatedUserId] },
    }).exec();

    if (!store) {
      return res.sendStatus(204);
    }

    res.status(200).json(store);
  } catch (error) {
    next(error);
  }
};

export const getStoreCategories: RequestHandler = async (req, res, next) => {
  try {
    const storeCategories = Object.values(StoreCategories);
    res.status(200).json({ categories: storeCategories });
  } catch (error) {
    next(error);
  }
};
export interface ListStoresQuery {
  category?: StoreCategories;
  name?: string;
  description?: string;
  cnpj?: string;
  favorite?: string;
}

export interface ListStoresFilter {
  name?: { $regex: string; $options: string };
  description?: { $regex: string; $options: string };
  cnpj?: { $regex: string; $options: string };
  category?: StoreCategories;
  _id?: { $in: Types.ObjectId[] };
}

export const listStores: RequestHandler<
  unknown,
  unknown,
  unknown,
  ListStoresQuery
> = async (req, res, next) => {
  try {
    const { category, name, description, cnpj, favorite } = req.query;

    const filter: ListStoresFilter = {};

    if (category) {
      filter.category = category;
    }

    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    if (description) {
      filter.description = { $regex: description, $options: "i" };
    }

    if (cnpj) {
      filter.cnpj = { $regex: cnpj, $options: "i" };
    }

    let jsonFavorite;

    if (favorite) jsonFavorite = JSON.parse(favorite);

    const stores = await storeService.listStores(
      filter,
      req.userId,
      jsonFavorite
    );
    res.status(200).json(stores);
  } catch (error) {
    next(error);
  }
};
