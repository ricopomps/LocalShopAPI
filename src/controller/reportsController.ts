import { RequestHandler } from "express";
import { assertIsDefined } from "../util/assertIsDefined";
import { ReportService } from "../service/reportService";

const reportService = new ReportService();
export const getIncomeReport: RequestHandler<
  unknown,
  unknown,
  unknown,
  GetReportQuery
> = async (req, res, next) => {
  try {
    const storeId = req.storeId;
    assertIsDefined(storeId);

    const { startDate, endDate } = req.query;
    const data = await reportService.getIncomeReport(
      startDate,
      endDate,
      storeId
    );
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getSoldProductsReport: RequestHandler<
  unknown,
  unknown,
  unknown,
  GetReportQuery
> = async (req, res, next) => {
  try {
    const storeId = req.storeId;
    assertIsDefined(storeId);

    const { startDate, endDate } = req.query;
    await reportService.getSoldProductsReport(startDate, endDate, storeId);

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

interface GetReportQuery {
  startDate: Date;
  endDate: Date;
}

export const getProductsSoldReport: RequestHandler<
  unknown,
  unknown,
  unknown,
  GetReportQuery
> = async (req, res, next) => {
  try {
    const storeId = req.storeId;
    assertIsDefined(storeId);

    const { startDate, endDate } = req.query;

    const data = await reportService.getSoldProductsReport(
      startDate,
      endDate,
      storeId
    );

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getIncomeByProducts: RequestHandler<
  unknown,
  unknown,
  unknown,
  GetReportQuery
> = async (req, res, next) => {
  try {
    const storeId = req.storeId;
    assertIsDefined(storeId);

    const { startDate, endDate } = req.query;

    const data = await reportService.getIncomeByProducts(
      startDate,
      endDate,
      storeId
    );

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
