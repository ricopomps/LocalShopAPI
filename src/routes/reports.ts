import express from "express";
import * as ReportsController from "../controller/reportsController";

const router = express.Router();

router.get("/", ReportsController.getReport);
router.get("/productssold", ReportsController.getProductsSoldReport);

export default router;
