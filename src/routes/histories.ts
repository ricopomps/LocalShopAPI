import express from "express";
import * as HistoryController from "../controller/historyController";

const router = express.Router();

router.get("/:userId", HistoryController.getHistoryByUser);
router.post("/", HistoryController.createHistory);
router.patch("/:shoppingListId", HistoryController.updateHistory);

export default router;