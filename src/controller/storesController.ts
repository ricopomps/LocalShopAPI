import { RequestHandler } from "express";
import StoreModel from "../models/store";
import createHttpError from "http-errors";
import mongoose from "mongoose";

export const getStores: RequestHandler = async (req, res, next) => {
  try {
    const stores = await StoreModel.find().exec();
    res.status(200).json(stores);
  } catch (error) {
    next(error);
  }
};

export const getStore: RequestHandler = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    if (!mongoose.isValidObjectId(storeId)) {
      throw createHttpError(400, "Id inválido");
    }

    const store = await StoreModel.findById(storeId).exec();

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
}

export const createStores: RequestHandler<
  unknown,
  unknown,
  createStoreBody,
  unknown
> = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;
    if (!name) {
      throw createHttpError(400, "O Titúlo é obrigatório");
    }

    const newStore = await StoreModel.create({
      name,
      description,
      image,
    });
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
    } = req.body;

    if (!mongoose.isValidObjectId(storeId)) {
      throw createHttpError(400, "Id inválido");
    }

    if (!newName) {
      throw createHttpError(400, "O Titúlo é obrigatório");
    }

    const store = await StoreModel.findById(storeId).exec();

    if (!store) {
      throw createHttpError(404, "Store não encontrada");
    }

    store.name = newName;
    store.description = newDescription;
    store.image = newImage;

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
      throw createHttpError(404, "Store não encontrada");
    }

    await store.deleteOne();

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
