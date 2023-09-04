import express from "express";
import * as ShoppingListController from "../controller/shoppingListController";

const router = express.Router();

router.get("/:storeId", ShoppingListController.getShoppingListsByUser);
router.post("/", ShoppingListController.createShoppingList);
router.post("/finish", ShoppingListController.finishShoppingList);
router.post("/copy/:historyId", ShoppingListController.copyHistoryList);

export default router;
