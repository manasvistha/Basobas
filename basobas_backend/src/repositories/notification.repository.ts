import Notification, { INotification } from "../models/notification.model";

export class NotificationRepository {
  async create(data: {
    user: string;
    message: string;
    type: 'assignment' | 'status_update' | 'message' | 'general';
    relatedId?: string;
  }): Promise<INotification> {
    const notification = new Notification(data);
    return await notification.save();
  }

  async findByUser(userId: string, page: number = 1, limit: number = 20): Promise<{ notifications: INotification[]; total: number; page: number; pages: number }> {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ user: userId })
    ]);
    return {
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  async markAsRead(notificationId: string): Promise<INotification | null> {
    return await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany({ user: userId }, { isRead: true });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await Notification.countDocuments({ user: userId, isRead: false });
  }
}