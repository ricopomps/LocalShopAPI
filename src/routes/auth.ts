import express from "express";
import * as AuthController from "../controller/authController";

const router = express.Router();

router.post("/", AuthController.auth);
router.get("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);
router.post("/recover", AuthController.sendRecoverPasswordEmail);
router.post("/change", AuthController.changePassword);

export default router;
