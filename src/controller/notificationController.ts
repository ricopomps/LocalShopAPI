import { RequestHandler } from "express";
import NotificationModel from "../models/notification";

export const createNotification: RequestHandler = async (req, res, next) => {
  try {
    const notification = await NotificationModel.create({
      userId: req.userId,
      text: "Alterações realizadas no perfil",
    });
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
};

export const getNotifications: RequestHandler = async (req, res, next) => {
  try {
    const notifications = await NotificationModel.find({
      userId: req.userId,
    })
      .sort({ _id: "desc" })
      .exec();
    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

export const deleteNotification: RequestHandler = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    await NotificationModel.findByIdAndDelete(notificationId);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};
