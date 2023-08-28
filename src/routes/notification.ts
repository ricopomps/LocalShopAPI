import express from "express";
import * as NotificationController from "../controller/notificationController";

const router = express.Router();

router.get("/", NotificationController.getNotifications);
router.post("/", NotificationController.createNotification);
router.delete("/:notificationId", NotificationController.deleteNotification);

export default router;
