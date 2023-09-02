import createHttpError from "http-errors";
import NotificationModel, { Notification } from "../models/notification";

interface INotificationService {
  createNotification(userId: string, text: string): Promise<void>;
  getNotifications(userId: string): Promise<Notification[]>;
  deleteNotification(notificationId: string): Promise<void>;
  readNotification(notificationId: string): Promise<void>;
  readAllNotification(userId: string): Promise<void>;
  removeAllNotifications(userId: string): Promise<void>;
}

export class NotificationService implements INotificationService {
  private notificationRepository;

  constructor() {
    this.notificationRepository = NotificationModel;
  }

  async createNotification(userId: string, text: string): Promise<void> {
    await this.notificationRepository.create({
      userId,
      text,
    });
  }

  async getNotifications(userId: string): Promise<Notification[]> {
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
    if (!notification) throw createHttpError(404, "Note não encontrada");
    notification.read = true;
    await notification.save();
  }

  async readAllNotification(userId: string): Promise<void> {
    await this.notificationRepository.updateMany(
      { userId },
      { $set: { read: true } }
    );
  }

  async removeAllNotifications(userId: string): Promise<void> {
    await this.notificationRepository.deleteMany({ userId });
  }
}
