import createHttpError from "http-errors";
import NotificationModel, { Notification } from "../models/notification";
import { Types } from "mongoose";

export interface INotificationService {
  createNotification(userId: Types.ObjectId, text: string): Promise<void>;
  getNotifications(userId: Types.ObjectId): Promise<Notification[]>;
  deleteNotification(notificationId: string): Promise<void>;
  readNotification(notificationId: string): Promise<void>;
  readAllNotification(userId: Types.ObjectId): Promise<void>;
  removeAllNotifications(userId: Types.ObjectId): Promise<void>;
}

export class NotificationService implements INotificationService {
  private notificationRepository;

  constructor() {
    this.notificationRepository = NotificationModel;
  }

  async createNotification(
    userId: Types.ObjectId,
    text: string
  ): Promise<void> {
    await this.notificationRepository.create({
      userId,
      text,
    });
  }
  async getNotifications(userId: Types.ObjectId): Promise<Notification[]> {
    const notifications = await this.notificationRepository
      .find({ userId })
      .sort({ _id: "desc" })
      .exec();
    return notifications;
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.notificationRepository.findByIdAndDelete(notificationId);
  }

  async readNotification(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(
      notificationId
    );
    if (!notification) throw createHttpError(404, "Notificação não encontrada");
    notification.read = true;
    await notification.save();
  }

  async readAllNotification(userId: Types.ObjectId): Promise<void> {
    await this.notificationRepository.updateMany(
      { userId },
      { $set: { read: true } }
    );
  }

  async removeAllNotifications(userId: Types.ObjectId): Promise<void> {
    await this.notificationRepository.deleteMany({ userId });
  }
}
