import express from "express";
import * as ShoppingListController from "../controller/shoppingListController";

const router = express.Router();

router.get("/:storeId", ShoppingListController.getShoppingListsByUser);
router.post("/", ShoppingListController.createShoppingList);
router.post("/finish", ShoppingListController.finishShoppingList);

export default router;
