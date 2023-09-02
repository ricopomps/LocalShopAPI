import express from "express";
import * as ShoppingListHistoryController from "../controller/shoppingListHistoryController";

const router = express.Router();

router.get(
  "/:storeId",
  ShoppingListHistoryController.getShoppingListsHistoryByUser
);
router.post("/", ShoppingListHistoryController.createShoppingListHistory);

export default router;
