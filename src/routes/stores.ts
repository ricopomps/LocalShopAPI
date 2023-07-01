import express from "express";
import * as StoresController from "../controller/storesController";

const router = express.Router();

router.get("/", StoresController.getStores);
router.get("/:storeId", StoresController.getStore);
router.post("/", StoresController.createStores);
router.patch("/:storeId", StoresController.updateStore);
router.delete("/:storeId", StoresController.deleteStore);

export default router;
