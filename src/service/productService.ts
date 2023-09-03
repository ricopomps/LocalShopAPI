import { ClientSession, Types, startSession } from "mongoose";
import createHttpError from "http-errors";
import ProductModel, { Product, ProductCategories } from "../models/product";
import {
  INotificationService,
  NotificationService,
} from "./notificationService";
import { IStoreService, StoreService } from "./storeService";
import { IUserService, UserService } from "./userService";
import { ListProductsByUserFilter } from "../controller/productsController";

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
  listProducts(
    filter: ListProductsByUserFilter,
    userId: Types.ObjectId,
    favorite?: boolean
  ): Promise<Product[]>;
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
  sale?: boolean;
  oldPrice?: number;
  salePercentage?: number;
  stock?: number;
}

export class ProductService implements IProductService {
  private notificationService: INotificationService;
  private storeService: IStoreService;
  private userService: IUserService;
  private productRepository;

  constructor() {
    this.notificationService = new NotificationService();
    this.storeService = new StoreService();
    this.userService = new UserService();
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

      if (
        productData.sale &&
        productData.oldPrice &&
        productData.price &&
        productData.oldPrice < productData.price
      )
        throw createHttpError(
          400,
          "Não é possível cadastrar uma promoção com preço maior que o original"
        );

      if (productData.name) {
        existingProduct.name = productData.name;
      }

      if (productData.description) {
        existingProduct.description = productData.description;
      }

      if (productData.image) {
        existingProduct.image = productData.image;
      }

      if (
        productData.category &&
        Object.values(ProductCategories).includes(productData.category)
      ) {
        existingProduct.category = productData.category;
      }

      if (productData.price) {
        existingProduct.price = productData.price;
      }

      if (productData.location) {
        existingProduct.location = productData.location;
      }

      if (productData.sale !== undefined) {
        existingProduct.sale = productData.sale;
      }

      if (productData.oldPrice) {
        existingProduct.oldPrice = productData.oldPrice;
      }

      if (productData.sale && productData.oldPrice && productData.price) {
        existingProduct.salePercentage =
          ((productData.oldPrice - productData.price) / productData.oldPrice) *
          100;
      } else {
        existingProduct.salePercentage = 0;
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
      if (productData.sale) {
        const usersToNotify = await this.userService.getUsersByFavoriteProduct(
          updatedProduct._id
        );
        usersToNotify.forEach((user) =>
          this.notificationService.createNotification(
            user._id,
            `O seu produto favoritado '${
              updatedProduct.name
            }' entrou em promoção com ${updatedProduct.salePercentage?.toFixed(
              0
            )}% de desconto!`
          )
        );
      }
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

    if (stock < 20) {
      try {
        const store = await this.storeService.getStore(product.storeId);

        store.users.forEach((user) => {
          this.notificationService.createNotification(
            user,
            `O estoque do produto: '${product.name}' está baixo! Apenas ${product.stock} produtos no estoque`
          );
        });
      } catch (error) {
        console.error(
          "Ocorreu um erro ao enviar notificação de estoque baixo: ",
          error
        );
      }
    }

    return product;
  }

  async listProducts(
    filter: ListProductsByUserFilter,
    userId: Types.ObjectId,
    favorite?: boolean | undefined
  ): Promise<Product[]> {
    if (favorite) {
      const favoriteStores = await this.userService.getFavoriteProducts(userId);
      filter._id = { $in: favoriteStores };
    }

    const products = await this.productRepository.find(filter).exec();
    return products;
  }
}
