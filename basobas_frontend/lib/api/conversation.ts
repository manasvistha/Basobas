import axios from './axios';
import { API } from './endpoints';

export interface Message {
  sender: string | { _id?: string; name?: string; email?: string };
  content: string;
  timestamp: string;
}

export interface Conversation {
  _id: string;
  participants: Array<{ _id: string; name?: string; email?: string }>;
  booking?: string;
  messages: Message[];
  lastMessage?: string;
  lastMessageTime?: string;
  createdAt: string;
}

export const createConversation = async (participantIds: string[]) => {
  const participants = Array.from(
    new Set(
      (participantIds || [])
        .map((participantId) => String(participantId || "").trim())
        .filter((participantId) => participantId.length > 0)
    )
  );

  if (participants.length < 2) {
    throw new Error("Both participants are required to start a conversation");
  }

  const res = await axios.post(API.CONVERSATION.CREATE, { participants });
  return res.data as Conversation;
};

export const getConversations = async () => {
  const res = await axios.get(API.CONVERSATION.LIST);
  return res.data as Conversation[];
};

export const getConversation = async (id: string) => {
  const res = await axios.get(API.CONVERSATION.GET(id));
  return res.data as Conversation;
};

export const sendMessage = async (conversationId: string, content: string) => {
  const res = await axios.post(API.CONVERSATION.SEND_MESSAGE(conversationId), { conversationId, content });
  return res.data as Conversation;
};

export const getBookingConversation = async (bookingId: string) => {
  const res = await axios.get(API.CONVERSATION.BY_BOOKING(bookingId));
  return res.data as Conversation;
};

export const sendBookingMessage = async (bookingId: string, content: string) => {
  const res = await axios.post(API.CONVERSATION.SEND_BOOKING_MESSAGE(bookingId), { content });
  return res.data as Conversation;
};

export default {
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  getBookingConversation,
  sendBookingMessage,
};
