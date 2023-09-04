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
    const { startDate, endDate } = req.query;
    const data = await reportService.getIncomeReport(startDate, endDate);
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
    const { startDate, endDate } = req.query;
    await reportService.getSoldProductsReport(startDate, endDate);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

interface GetReportQuery {
  startDate: Date;
  endDate: Date;
}
export const getReport: RequestHandler<
  unknown,
  unknown,
  unknown,
  GetReportQuery
> = async (req, res, next) => {
  try {
    const storeId = req.storeId;
    assertIsDefined(storeId);

    const { startDate, endDate } = req.query;

    const data = [
      {
        month: "feb",
        value: 159,
      },
      {
        month: "mar",
        value: 129,
      },
      {
        month: "abr",
        value: 189,
      },
    ];

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

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
    const data = [
      {
        month: "feb",
        values: [
          {
            label: "product1",
            value: 55,
          },
          {
            label: "product2",
            value: 65,
          },
          {
            label: "product5",
            value: 75,
          },
        ],
      },
      {
        month: "mar",
        values: [
          {
            label: "product1",
            value: 25,
          },
          {
            label: "product2",
            value: 45,
          },
          {
            label: "product3",
            value: 35,
          },
        ],
      },
      {
        month: "abr",
        values: [
          {
            label: "product1",
            value: 65,
          },
          {
            label: "product5",
            value: 85,
          },
          {
            label: "product3",
            value: 95,
          },
        ],
      },
    ];

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
