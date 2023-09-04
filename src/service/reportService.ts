import { format } from "date-fns";
import { Product } from "../models/product";
import ShoppingListHistoryModel, {
  ShoppingListHistory,
} from "../models/shoppingListHistory";
import { ptBR } from "date-fns/locale";
import { Types } from "mongoose";

export interface IReportService {
  getSoldProductsReport(
    startDate: Date,
    endDate: Date,
    storeId: Types.ObjectId
  ): Promise<MultipleReportData[]>;
  getIncomeReport(startDate: Date, endDate: Date, storeId: Types.ObjectId): Promise<SingleReportData[]>;
  getIncomeByProducts(
    startDate: Date,
    endDate: Date,
    storeId: Types.ObjectId
  ) : Promise<MultipleReportData[]>
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

  private createMonthKey(creationDate: Date) {
    const monthKey = `${format(
      creationDate,
      "MMM", { locale: ptBR }
    )}/${creationDate.getFullYear()}`;
    return monthKey;
  }

async getSoldProductsReport(
    startDate: Date,
    endDate: Date,
    storeId: Types.ObjectId
  ): Promise<MultipleReportData[]> {
    const rawData: ShoppingListHistory[] =
      await this.shoppingListHistoryRepository
        .find({
          storeId,
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .exec();
        

    const dataMonthSeparated = new Map<string, ShoppingListHistory[]>();
    rawData.forEach((history: ShoppingListHistory) => {
      const createdAt = new Date(history.createdAt);

      const monthKey = this.createMonthKey(createdAt);

      if (dataMonthSeparated.has(monthKey)) {
        dataMonthSeparated.get(monthKey)?.push(history);
      } else {
        dataMonthSeparated.set(monthKey, [history]);
      }
    });

    const reportData: MultipleReportData[] = [];

    dataMonthSeparated.forEach((value, month) => {
      const mapOfProducts = new Map<string, number>();
      const singularData: SingularValue[] = [];

      value.forEach((history: ShoppingListHistory) => {
        history.products.forEach((productItem) => {
          if (productItem.product) {
            const key = (productItem.product as Product).name;
            const quantity = productItem.quantity;

            if (mapOfProducts.has(key)) {
              mapOfProducts.set(key, (mapOfProducts.get(key) ?? 0) + quantity);
            } else {
              mapOfProducts.set(key, quantity);
            }
          }
        });
      });

      mapOfProducts.forEach((value, label) => {
        singularData.push({
          label,
          value,
        });
      });

      reportData.push({
        month,
        values: singularData,
      });
    });

    return reportData;
  }


  async getIncomeReport(
    startDate: Date,
    endDate: Date,
    storeId: Types.ObjectId
  ): Promise<SingleReportData[]> {
    const rawData: ShoppingListHistory[] =
      await this.shoppingListHistoryRepository
        .find({
          storeId,
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .exec();

    const dataMonthSeparated = new Map<string, number>();

    rawData.forEach((history: ShoppingListHistory) => {
      const monthKey = this.createMonthKey(history.createdAt);

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



  async getIncomeByProducts(
    startDate: Date,
    endDate: Date,
    storeId: Types.ObjectId
  ): Promise<MultipleReportData[]> {
    const rawData: ShoppingListHistory[] =
      await this.shoppingListHistoryRepository
        .find({
          storeId,
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .exec();

        const dataMonthSeparated = new Map<string, ShoppingListHistory[]>();
    rawData.forEach((history: ShoppingListHistory) => {
      const createdAt = new Date(history.createdAt);

      const monthKey = this.createMonthKey(createdAt);

      if (dataMonthSeparated.has(monthKey)) {
        dataMonthSeparated.get(monthKey)?.push(history);
      } else {
        dataMonthSeparated.set(monthKey, [history]);
      }
    });

    const reportData: MultipleReportData[] = [];

    dataMonthSeparated.forEach((value, month) => {
      const mapOfProducts = new Map<string, number>();
      const singularData: SingularValue[] = [];

      value.forEach((history: ShoppingListHistory) => {
        history.products.forEach((productItem) => {
          if (productItem.product) {
            const key = (productItem.product as Product).name;
            const quantity = productItem.quantity;
            const price = productItem.product.price;

            const income = quantity * price;

            if (mapOfProducts.has(key)) {
              mapOfProducts.set(key, (mapOfProducts.get(key) ?? 0) + income);
            } else {
              mapOfProducts.set(key, income);
            }
          }
        });
      });

      mapOfProducts.forEach((value, label) => {
        singularData.push({
          label,
          value,
        });
      });

      reportData.push({
        month,
        values: singularData,
      });
    });

    return reportData;
  }
}
