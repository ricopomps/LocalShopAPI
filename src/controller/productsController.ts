import { RequestHandler } from "express";
import ProductModel, { ProductCategories } from "../models/product";
import createHttpError from "http-errors";
import mongoose, { ObjectId, Types } from "mongoose";
import { assertIsDefined } from "../util/assertIsDefined";
import {
  IProductService,
  ProductService,
  ProductSort,
} from "../service/productService";

const productService: IProductService = new ProductService();

interface GetProductsQuery {
  storeId: ObjectId;
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
    const { page = 0, take = 10, storeId } = req.query;
    assertIsDefined(storeId);

    const products = await ProductModel.find({
      storeId,
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

    const product = await productService.getProduct(productId);

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
  sale: boolean;
  oldPrice?: number;
  salePercentage?: number;
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

    const { name, description, image, category } = req.body;

    const sale = Boolean(req.body.sale);
    const price = Number(req.body.price);

    let oldPrice = 0;

    if (req.body.oldPrice) oldPrice = Number(req.body.oldPrice);

    let salePercentage;

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

    if (price >= oldPrice && sale) {
      throw createHttpError(400, "Precificação incoerente!");
    }

    if (oldPrice <= price || oldPrice === 0 || sale === false) {
      salePercentage = 0;
    }

    if (sale === true) {
      salePercentage = ((oldPrice - price) / oldPrice) * 100;
    }

    const newProduct = await productService.createProduct({
      storeId: authenticatedStoreId,
      name,
      description,
      image,
      category,
      price,
      sale,
      oldPrice,
      salePercentage,
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
  price?: number;
  location: Location;
  sale: boolean;
  oldPrice?: number;
  stock?: number;
}

interface Location {
  x: number;
  y: number;
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
      price: newPrice,
      sale: newSale,
      location: newLocation,
      oldPrice: newOldPrice,
      stock: newStock,
    } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      throw createHttpError(400, "Id inválido");
    }

    const productData: UpdateProductBody = {
      name: newName,
      description: newDescription,
      image: newImage,
      category: newCategory,
      price: newPrice,
      sale: newSale,
      location: newLocation,
      oldPrice: newOldPrice,
      stock: newStock,
    };

    const updatedProduct = await productService.updateProduct(
      productId,
      productData
    );

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

export const getSortOptions: RequestHandler = async (req, res, next) => {
  try {
    const productsCategories = Object.values(ProductSort);
    res.status(200).json({ sortOptions: productsCategories });
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
  favorite?: string;
  sort?: ProductSort;
}

export interface ListProductsByUserFilter {
  storeId: ObjectId;
  name?: { $regex: string; $options: string };
  category?: ProductCategories;
  price?: {
    $gte?: number;
    $lte?: number;
  };
  _id?: { $in: Types.ObjectId[] };
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

    const { productName, category, favorite, sort } = req.query;

    const priceFrom = Number(req.query.priceFrom);
    const priceTo = Number(req.query.priceTo);

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
    let jsonFavorite;

    if (favorite) jsonFavorite = JSON.parse(favorite);

    if (jsonFavorite) filter = { ...filter, _id: { $in: [] } };

    const products = await productService.listProducts(
      filter,
      req.userId,
      jsonFavorite,
      sort
    );

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

export const getProductList: RequestHandler = async (req, res, next) => {
  try {
    const storeId = req.storeId;
    assertIsDefined(storeId);

    const products = await ProductModel.find({ storeId }).select("name").exec();
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};
