import express from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { authorize } from '../middlewears/authorized.middlewears';

const router = express.Router();
const conversationController = new ConversationController();

// Get user's conversations
router.get('/', authorize, conversationController.getMyConversations.bind(conversationController));

// Create conversation (or return existing)
router.post('/', authorize, conversationController.createConversation.bind(conversationController));

// Booking-linked conversation
router.get('/booking/:bookingId', authorize, conversationController.getBookingConversation.bind(conversationController));
router.post('/booking/:bookingId/message', authorize, conversationController.sendBookingMessage.bind(conversationController));

// Get specific conversation
router.get('/:id', authorize, conversationController.getConversationById.bind(conversationController));

// Delete conversation for participant
router.delete('/:id', authorize, conversationController.deleteConversation.bind(conversationController));

// Send message in conversation
router.post('/:id/message', authorize, conversationController.sendMessage.bind(conversationController));

export default router;
