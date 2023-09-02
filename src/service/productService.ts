import { ClientSession, Types, startSession } from "mongoose";
import ProductModel, { Product, ProductCategories } from "../models/product";
import createHttpError from "http-errors";

export interface IProductService {
  getProduct(productId: string): Promise<Product>;
  createProduct(product: ProductData): Promise<Product>;
  updateProduct(productId: string, product: ProductData): Promise<Product>;
  addStock(
    productId: string,
    stock: number,
    session?: ClientSession
  ): Promise<Product>;
  removeStock(
    productId: string,
    stock: number,
    session?: ClientSession
  ): Promise<Product>;
}

interface ProductData {
  storeId?: Types.ObjectId;
  name?: string;
  description?: string;
  image?: string;
  category?: ProductCategories;
  price?: number;
  location?: {
    x?: number;
    y?: number;
  };
  stock?: number;
}

export class ProductService implements IProductService {
  private productRepository;

  constructor() {
    this.productRepository = ProductModel;
  }

  async createProduct(product: ProductData): Promise<Product> {
    const newProduct = await this.productRepository.create(product);

    return newProduct;
  }

  async getProduct(productId: string): Promise<Product> {
    const product = await this.productRepository.findById(productId).exec();

    if (!product) throw createHttpError(404, "Produto não encontrado");

    return product;
  }

  async updateProduct(
    productId: string,
    productData: ProductData
  ): Promise<Product> {
    const session = await startSession();
    session.startTransaction();
    try {
      const existingProduct = await this.productRepository
        .findById(productId)
        .session(session)
        .exec();

      if (!existingProduct)
        throw createHttpError(404, "Produto não encontrado");

      if (!existingProduct) {
        throw createHttpError(404, "Produto não encontrado");
      }

      if (productData.name !== undefined) {
        existingProduct.name = productData.name;
      }

      if (productData.description !== undefined) {
        existingProduct.description = productData.description;
      }

      if (productData.image !== undefined) {
        existingProduct.image = productData.image;
      }

      if (
        productData.category !== undefined &&
        Object.values(ProductCategories).includes(productData.category)
      ) {
        existingProduct.category = productData.category;
      }

      if (productData.price !== undefined) {
        existingProduct.price = productData.price;
      }

      if (productData.location !== undefined) {
        existingProduct.location = productData.location;
      }

      if (productData.stock !== undefined) {
        const stockDifference = productData.stock - existingProduct.stock;

        if (stockDifference > 0) {
          await this.addStock(productId, stockDifference, session);
        } else if (stockDifference < 0) {
          await this.removeStock(productId, -stockDifference, session);
        }

        existingProduct.stock = productData.stock;
      }

      const updatedProduct = await existingProduct.save();
      await session.commitTransaction();
      session.endSession();
      return updatedProduct;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async addStock(
    productId: string,
    stock: number,
    session?: ClientSession
  ): Promise<Product> {
    const query = this.productRepository.findById(productId);

    if (session) {
      query.session(session);
    }

    const product = await query.exec();

    if (!product) {
      throw createHttpError(404, "Produto não encontrado");
    }

    product.stock += stock;
    await product.save({ session });

    return product;
  }

  async removeStock(
    productId: string,
    stock: number,
    session?: ClientSession
  ): Promise<Product> {
    const query = this.productRepository.findById(productId);

    if (session) {
      query.session(session);
    }

    const product = await query.exec();

    if (!product) {
      throw createHttpError(404, "Produto não encontrado");
    }

    if (stock > product.stock) {
      throw createHttpError(
        400,
        `O Produto: '${product.name}' não possui estoque suficiente (estoque atual: ${product.stock})`
      );
    }

    product.stock -= stock;
    await product.save({ session });

    return product;
  }
}
