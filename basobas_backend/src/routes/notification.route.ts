import express from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authorize } from '../middlewears/authorized.middlewears';

const router = express.Router();
const notificationController = new NotificationController();

// Get user's notifications
router.get('/', authorize, notificationController.getMyNotifications.bind(notificationController));

// Mark notification as read
router.put('/:id/read', authorize, notificationController.markAsRead.bind(notificationController));

// Mark all notifications as read
router.put('/read-all', authorize, notificationController.markAllAsRead.bind(notificationController));

export default router;