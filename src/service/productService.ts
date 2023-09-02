import { Types } from "mongoose";
import ProductModel, { Product, ProductCategories } from "../models/product";
import createHttpError from "http-errors";

export interface IProductService {
  getProduct(productId: string): Promise<Product>;
  createProduct(product: ProductData): Promise<Product>;
  addStock(productId: string, stock: number): Promise<Product>;
  removeStock(productId: string, stock: number): Promise<Product>;
}

interface ProductData {
  storeId: Types.ObjectId;
  name: string;
  description?: string;
  image?: string;
  category: ProductCategories;
  price: number;
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

  async addStock(productId: string, stock: number): Promise<Product> {
    const product = await this.productRepository.findById(productId).exec();

    if (!product) throw createHttpError(404, "Produto não encontrado");

    product.stock += stock;
    await product.save();

    return product;
  }

  async removeStock(productId: string, stock: number): Promise<Product> {
    const product = await this.productRepository.findById(productId).exec();

    if (!product) throw createHttpError(404, "Produto não encontrado");

    if (stock > product.stock)
      throw createHttpError(
        400,
        `O Produto: '${product.name}' não possui estoque suficiente (estoque atual: ${product.stock})`
      );

    product.stock -= stock;
    await product.save();

    return product;
  }
}
