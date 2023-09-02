import express from "express";
import * as UserController from "../controller/userController";
import { verifyJWT } from "../middleware/verifyJWT";

const router = express.Router();

router.get("/", verifyJWT, UserController.getAuthenticatedUser);
router.post("/signup", UserController.signUp);
router.post("/login", UserController.login);
router.post("/logout", verifyJWT, UserController.logout);
router.post("/favoriteProduct", verifyJWT, UserController.favoriteProduct);
router.post("/favoriteStores", verifyJWT, UserController.favoriteStores);
router.post("/unFavoriteProduct", verifyJWT, UserController.unFavoriteProduct);
router.post("/unFavoriteStores", verifyJWT, UserController.unFavoriteStores);
router.patch("/", verifyJWT, UserController.updateUser);

export default router;
