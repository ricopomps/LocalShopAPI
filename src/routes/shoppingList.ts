import express from "express";
import * as ShoppingListController from "../controller/shoppingListController";

const router = express.Router();

router.get("/:userId", ShoppingListController.getShoppingListsByUser);
router.post("/", ShoppingListController.createShoppingList);

export default router;
