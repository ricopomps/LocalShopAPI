import { RequestHandler } from "express";
import ProductModel, { ProductCategories } from "../models/product";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { assertIsDefined } from "../util/assertIsDefined";

export const getProducts: RequestHandler = async (req, res, next) => {
  try {
    const authenticatedStoreId = req.storeId;
    assertIsDefined(authenticatedStoreId);

    const products = await ProductModel.find({
      storeId: authenticatedStoreId,
    }).exec();
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

    const authenticatedStoreId = req.storeId;
    assertIsDefined(authenticatedStoreId);

    if (!product.storeId.equals(authenticatedStoreId))
      throw createHttpError(
        401,
        "Usuário não possui permissão para acessar essa informação"
      );

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

interface createProductBody {
  name?: string;
  description?: string;
  image?: string;
  category?: ProductCategories;
}

export const createProducts: RequestHandler<
  unknown,
  unknown,
  createProductBody,
  unknown
> = async (req, res, next) => {
  try {
    const authenticatedStoreId = req.storeId;
    assertIsDefined(authenticatedStoreId);

    const { name, description, image, category } = req.body;

    if (!name) {
      throw createHttpError(400, "O nome é obrigatório");
    }

    if (!category) {
      throw createHttpError(400, "A categoria é obrigatório");
    }

    if (!Object.values(ProductCategories).includes(category)) {
      throw createHttpError(400, "Categoria inválida!");
    }

    const newProduct = await ProductModel.create({
      storeId: authenticatedStoreId,
      name,
      description,
      image,
      category,
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
  category?: ProductCategories;
}

export const updateProduct: RequestHandler<
  UpdateProductParams,
  unknown,
  UpdateProductBody,
  unknown
> = async (req, res, next) => {
  try {
    const authenticatedStoreId = req.storeId;
    assertIsDefined(authenticatedStoreId);

    const { productId } = req.params;
    const {
      name: newName,
      description: newDescription,
      image: newImage,
      category: newCategory,
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

    if (!product.storeId.equals(authenticatedStoreId))
      throw createHttpError(
        401,
        "Usuário não possui permissão para acessar essa informação"
      );

    if (
      newCategory &&
      !Object.values(ProductCategories).includes(newCategory)
    ) {
      throw createHttpError(400, "Categoria inválida!");
    }

    product.name = newName;
    product.description = newDescription;
    product.image = newImage;
    product.category = product.category ?? newCategory;

    const updatedProduct = await product.save();

    res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct: RequestHandler = async (req, res, next) => {
  try {
    const authenticatedStoreId = req.storeId;
    assertIsDefined(authenticatedStoreId);

    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      throw createHttpError(400, "Id inválido");
    }

    const product = await ProductModel.findById(productId).exec();

    if (!product) {
      throw createHttpError(404, "Product não encontrada");
    }

    if (!product.storeId.equals(authenticatedStoreId))
      throw createHttpError(
        401,
        "Usuário não possui permissão para acessar essa informação"
      );

    await product.deleteOne();

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

export const getProductCategories: RequestHandler = async (req, res, next) => {
  try {
    const productsCategories = Object.values(ProductCategories);
    res.status(200).json({ categories: productsCategories });
  } catch (error) {
    next(error);
  }
};
