import express from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authorize } from '../middlewears/authorized.middlewears';
import { requirePermission } from '../middlewears/rbac.middlewears';
import { PERMISSIONS } from '../config/rbac';

const router = express.Router();
const notificationController = new NotificationController();

// Get user's notifications
router.get('/', authorize, requirePermission(PERMISSIONS.NOTIFICATION_READ), notificationController.getMyNotifications.bind(notificationController));

// Mark notification as read
router.put('/:id/read', authorize, requirePermission(PERMISSIONS.NOTIFICATION_READ), notificationController.markAsRead.bind(notificationController));

// Mark all notifications as read
router.put('/read-all', authorize, requirePermission(PERMISSIONS.NOTIFICATION_READ), notificationController.markAllAsRead.bind(notificationController));

export default router;