import { RequestHandler } from "express";
import ProductModel from "../models/product";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { assertIsDefined } from "../util/assertIsDefined";

export const getProducts: RequestHandler = async (req, res, next) => {
  try {
    const products = await ProductModel.find().exec();
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

export const getProduct: RequestHandler = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      throw createHttpError(400, "Id inválido");
    }

    const product = await ProductModel.findById(productId).exec();

    if (!product) {
      throw createHttpError(404, "Product não encontrada");
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

interface createProductBody {
  name?: string;
  description?: string;
  image?: string;
}

export const createProducts: RequestHandler<
  unknown,
  unknown,
  createProductBody,
  unknown
> = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;
    if (!name) {
      throw createHttpError(400, "O Titúlo é obrigatório");
    }

    const newProduct = await ProductModel.create({
      name,
      description,
      image,
    });
    res.status(201).json(newProduct);
  } catch (error) {
    next(error);
  }
};

interface UpdateProductParams {
  productId: string;
}

interface UpdateProductBody {
  name?: string;
  description?: string;
  image?: string;
}

export const updateProduct: RequestHandler<
  UpdateProductParams,
  unknown,
  UpdateProductBody,
  unknown
> = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const {
      name: newName,
      description: newDescription,
      image: newImage,
    } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      throw createHttpError(400, "Id inválido");
    }

    if (!newName) {
      throw createHttpError(400, "O Titúlo é obrigatório");
    }

    const product = await ProductModel.findById(productId).exec();

    if (!product) {
      throw createHttpError(404, "Product não encontrada");
    }

    product.name = newName;
    product.description = newDescription;
    product.image = newImage;

    const updatedProduct = await product.save();

    res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct: RequestHandler = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      throw createHttpError(400, "Id inválido");
    }

    const product = await ProductModel.findById(productId).exec();

    if (!product) {
      throw createHttpError(404, "Product não encontrada");
    }

    await product.deleteOne();

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
