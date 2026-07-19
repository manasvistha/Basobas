import { NotificationRepository } from "../repositories/notification.repository";

export class NotificationService {
  private notificationRepository = new NotificationRepository();

  async createNotification(userId: string, message: string, type: 'assignment' | 'status_update' | 'message' | 'general', relatedId?: string) {
    return await this.notificationRepository.create({
      user: userId,
      message,
      type,
      relatedId
    });
  }

  async getNotificationsByUser(userId: string, page: number = 1, limit: number = 20) {
    return await this.notificationRepository.findByUser(userId, page, limit);
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.markAsRead(notificationId);
    if (!notification || notification.user.toString() !== userId) {
      throw new Error("Notification not found or unauthorized");
    }
    return notification;
  }

  async markAllAsRead(userId: string) {
    return await this.notificationRepository.markAllAsRead(userId);
  }

  async getUnreadCount(userId: string) {
    return await this.notificationRepository.getUnreadCount(userId);
  }
}