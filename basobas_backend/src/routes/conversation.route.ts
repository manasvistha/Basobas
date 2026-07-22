import express from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { authorize } from '../middlewears/authorized.middlewears';
import { sensitiveLimiter } from '../middlewears/rate-limit.middlewears';
import { requirePermission } from '../middlewears/rbac.middlewears';
import { PERMISSIONS } from '../config/rbac';

const router = express.Router();
const conversationController = new ConversationController();

// Get user's conversations
router.get('/', authorize, requirePermission(PERMISSIONS.CONVERSATION_PARTICIPATE), conversationController.getMyConversations.bind(conversationController));

// Create conversation (or return existing)
router.post('/', sensitiveLimiter, authorize, requirePermission(PERMISSIONS.CONVERSATION_PARTICIPATE), conversationController.createConversation.bind(conversationController));

// Booking-linked conversation
router.get('/booking/:bookingId', authorize, requirePermission(PERMISSIONS.CONVERSATION_PARTICIPATE), conversationController.getBookingConversation.bind(conversationController));
router.post('/booking/:bookingId/message', sensitiveLimiter, authorize, requirePermission(PERMISSIONS.CONVERSATION_PARTICIPATE), conversationController.sendBookingMessage.bind(conversationController));

// Get specific conversation
router.get('/:id', authorize, requirePermission(PERMISSIONS.CONVERSATION_PARTICIPATE), conversationController.getConversationById.bind(conversationController));

// Delete conversation for participant
router.delete('/:id', authorize, requirePermission(PERMISSIONS.CONVERSATION_PARTICIPATE), conversationController.deleteConversation.bind(conversationController));

// Send message in conversation
router.post('/:id/message', sensitiveLimiter, authorize, requirePermission(PERMISSIONS.CONVERSATION_PARTICIPATE), conversationController.sendMessage.bind(conversationController));

export default router;
