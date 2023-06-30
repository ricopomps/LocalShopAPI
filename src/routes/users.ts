import express from "express";
import * as UserController from "../controller/userController";
import { requiresAuth } from "../middleware/auth";

const router = express.Router();

router.get("/", requiresAuth, UserController.getAuthenticatedUser);
router.post("/signup", UserController.signUp);
router.post("/login", UserController.login);
router.post("/logout", requiresAuth, UserController.logout);

export default router;
