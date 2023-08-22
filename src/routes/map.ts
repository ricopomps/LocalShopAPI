import express from "express";
import * as MapController from "../controller/mapController";

const router = express.Router();

router.get("/:storeId", MapController.getMap);
router.post("/", MapController.createUpdateMap);

export default router;
