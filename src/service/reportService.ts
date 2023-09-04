import { format } from "date-fns";
import { Product } from "../models/product";
import ShoppingListHistoryModel, {
  ShoppingListHistory,
} from "../models/shoppingListHistory";
import { ptBR } from "date-fns/locale";

export interface IReportService {
  getSoldProductsReport(
    startDate: Date,
    endDate: Date
  ): Promise<MultipleReportData[]>;
  getIncomeReport(startDate: Date, endDate: Date): Promise<SingleReportData[]>;
}

interface SingleReportData {
  month: string;
  value: number;
}

interface MultipleReportData {
  month: string;
  values: SingularValue[];
}

interface SingularValue {
  label: string;
  value: number;
}

export class ReportService implements IReportService {
  private shoppingListHistoryRepository;

  constructor() {
    this.shoppingListHistoryRepository = ShoppingListHistoryModel;
  }

  //   async getSoldProductsReport(startDate: Date, endDate: Date) {
  //     const rawData = await this.shoppingListHistoryRepository
  //       .find({
  //         createdAt: {
  //           $gte: startDate,
  //           $lte: endDate,
  //         },
  //       })
  //       .exec();

  //     const data = rawData.map((history) => {
  //       return {};
  //     });

  //     return [];
  //   }
  async getSoldProductsReport(
    startDate: Date,
    endDate: Date
  ): Promise<MultipleReportData[]> {
    const rawData: ShoppingListHistory[] =
      await this.shoppingListHistoryRepository
        .find({
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        // .populate("products.product") // Populate the 'product' field in 'products' array
        .exec();

    const dataMonthSeparated = new Map<string, number>();

    rawData.forEach((history: ShoppingListHistory) => {
      const createdAt = new Date(history.createdAt);
      //   const monthKey = `${createdAt.getFullYear()}-${(createdAt.getMonth() + 1)
      //     .toString()
      //     .padStart(2, "0")}`;

      const monthKey = `${format(createdAt, "MMM")}/${createdAt.getFullYear()}`;

      if (dataMonthSeparated.has(monthKey)) {
        dataMonthSeparated.set(
          monthKey,
          dataMonthSeparated.get(monthKey) ?? 0 + history.totalValue
        );
      } else {
        dataMonthSeparated.set(monthKey, history.totalValue);
      }
    });

    const productSoldMap = new Map<string, number>();

    rawData.forEach((history) => {
      history.products.forEach((productData) => {
        if (productData.product) {
          const productId = (productData.product as Product)._id.toString();
          const quantitySold = productData.quantity;

          if (productSoldMap.has(productId)) {
            productSoldMap.set(
              productId,
              productSoldMap.get(productId) ?? 0 + quantitySold
            );
          } else {
            productSoldMap.set(productId, quantitySold);
          }
        }
      });
    });

    // const reportData: SingleReportData[] = [];
    const reportData: MultipleReportData[] = [];

    // // Convert the map into an array of SingleReportData
    // productSoldMap.forEach((unitsSold, productId) => {
    //   const product = await Product.findById(productId); // Get the product details
    //   if (product) {
    //     reportData.push({
    //       month: product.name, // You can use the product name as the month
    //       value: unitsSold,
    //     });
    //   }
    // });
    console.log("rawData", rawData);
    console.log("productSoldMap", productSoldMap);
    console.log("dataMonthSeparated", dataMonthSeparated);
    return reportData;
  }

  async getIncomeReport(
    startDate: Date,
    endDate: Date
  ): Promise<SingleReportData[]> {
    const rawData: ShoppingListHistory[] =
      await this.shoppingListHistoryRepository
        .find({
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .exec();

    const dataMonthSeparated = new Map<string, number>();

    rawData.forEach((history: ShoppingListHistory) => {
      const createdAt = new Date(history.createdAt);
      const monthKey = `${format(createdAt, "MMM", {
        locale: ptBR,
      })}/${createdAt.getFullYear()}`;

      if (dataMonthSeparated.has(monthKey)) {
        dataMonthSeparated.set(
          monthKey,
          dataMonthSeparated.get(monthKey) ?? 0 + history.totalValue
        );
      } else {
        dataMonthSeparated.set(monthKey, history.totalValue);
      }
    });

    const reportData: SingleReportData[] = [];

    dataMonthSeparated.forEach((value, month) => {
      reportData.push({
        month,
        value,
      });
    });

    return reportData;
  }
}
