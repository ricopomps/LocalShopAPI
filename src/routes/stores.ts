import express from "express";
import * as StoresController from "../controller/storesController";

const router = express.Router();

router.get("/", StoresController.getStores);
router.get("/session", StoresController.getStoreByLoggedUser);
router.get("/categories", StoresController.getStoreCategories);
router.get("/list", StoresController.listStores);
router.get("/:storeId", StoresController.getStore);
router.post("/", StoresController.createStores);
router.patch("/:storeId", StoresController.updateStore);
router.delete("/:storeId", StoresController.deleteStore);
router.patch("/session/:storeId", StoresController.setSessionStoreId);
export default router;
