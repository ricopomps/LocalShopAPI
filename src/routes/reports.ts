import express from "express";
import * as ReportsController from "../controller/reportsController";

const router = express.Router();

router.get("/", ReportsController.getSoldProductsReport);
router.get("/productssold", ReportsController.getProductsSoldReport);
router.get("/incomeReport", ReportsController.getIncomeReport);

export default router;
