import { RequestHandler } from "express";
import ProductModel, { ProductCategories } from "../models/product";
import createHttpError from "http-errors";
import mongoose, { ObjectId } from "mongoose";
import { assertIsDefined } from "../util/assertIsDefined";

interface GetProductsQuery {
  page: number;
  take?: number;
}

export const getProducts: RequestHandler<
  unknown,
  unknown,
  unknown,
  GetProductsQuery
> = async (req, res, next) => {
  try {
    const authenticatedStoreId = req.storeId;
    assertIsDefined(authenticatedStoreId);

    const { page = 0, take = 10 } = req.query;

    const products = await ProductModel.find({
      storeId: authenticatedStoreId,
    })
      .limit(take)
      .skip(page * take)
      .exec();

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

interface CreateProductBody {
  name?: string;
  description?: string;
  image?: string;
  category?: ProductCategories;
  price?: number;
}

export const createProducts: RequestHandler<
  unknown,
  unknown,
  CreateProductBody,
  unknown
> = async (req, res, next) => {
  try {
    const authenticatedStoreId = req.storeId;
    assertIsDefined(authenticatedStoreId);

    const { name, description, image, category, price } = req.body;

    if (!name) {
      throw createHttpError(400, "O nome é obrigatório");
    }

    if (!category) {
      throw createHttpError(400, "A categoria é obrigatório");
    }

    if (!Object.values(ProductCategories).includes(category)) {
      throw createHttpError(400, "Categoria inválida!");
    }

    if (!price) {
      throw createHttpError(400, "Precificação obrigatória!");
    }

    const newProduct = await ProductModel.create({
      storeId: authenticatedStoreId,
      name,
      description,
      image,
      category,
      price,
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
    product.category = newCategory ?? product.category;

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

interface ListProductsFromUserParams {
  storeId: ObjectId;
}

interface ListProductsByUserQuery {
  storeId: ObjectId;
  productName?: string;
  category?: ProductCategories;
  priceFrom?: number;
  priceTo?: number;
}

interface ListProductsByUserFilter {
  storeId: ObjectId;
  name?: { $regex: string; $options: string };
  category?: ProductCategories;
  price?: {
    $gte?: number;
    $lte?: number;
  };
}

export const listProducts: RequestHandler<
  ListProductsFromUserParams,
  unknown,
  unknown,
  ListProductsByUserQuery
> = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    assertIsDefined(storeId);

    if (!mongoose.isValidObjectId(storeId)) {
      throw createHttpError(400, "Loja não encontrada (ID inválido)!");
    }

    const { productName, category, priceFrom, priceTo } = req.query;

    if (category && !Object.values(ProductCategories).includes(category)) {
      throw createHttpError(400, "Categoria inválida!");
    }

    let filter: ListProductsByUserFilter = { storeId };

    if (productName) {
      filter = { ...filter, name: { $regex: productName, $options: "i" } };
    }

    if (category) {
      filter = { ...filter, category };
    }

    if (priceFrom && priceTo && priceFrom > priceTo) {
      throw createHttpError(400, "Intervalo de preços inválido!");
    }

    if (priceFrom) {
      filter = { ...filter, price: { $gte: priceFrom } };
    }

    if (priceTo) {
      filter = { ...filter, price: { ...filter.price, $lte: priceTo } };
    }

    const products = await ProductModel.find(filter).exec();

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};
