import Conversation, { IConversation } from "../models/conversation.model";
import { CreateConversationDto } from "../dtos/conversation.dto";
import mongoose from "mongoose";

export class ConversationRepository {
  async create(data: CreateConversationDto & { booking?: string }): Promise<IConversation> {
    const conversation = new Conversation({
      participants: data.participants,
      booking: data.booking
    });
    return await conversation.save();
  }

  async findByParticipants(participants: string[]): Promise<IConversation | null> {
    return await Conversation.findOne({
      participants: { $all: participants, $size: participants.length }
    }).populate('participants', 'name email');
  }

  async findByUser(userId: string): Promise<IConversation[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return [];
    }

    return await Conversation.find({
      participants: userId
    }).populate('participants', 'name email').sort({ lastMessageTime: -1 });
  }

  async findByBooking(bookingId: string): Promise<IConversation | null> {
    return await Conversation.findOne({ booking: bookingId }).populate('participants', 'name email');
  }

  async addMessage(conversationId: string, senderId: string, content: string): Promise<IConversation | null> {
    const message = {
      sender: senderId,
      content,
      timestamp: new Date()
    };
    return await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $push: { messages: message },
        lastMessage: content,
        lastMessageTime: new Date()
      },
      { new: true }
    ).populate('participants', 'name email');
  }

  async findById(id: string): Promise<IConversation | null> {
    return await Conversation.findById(id).populate('participants', 'name email');
  }

  async deleteById(id: string): Promise<IConversation | null> {
    return await Conversation.findByIdAndDelete(id);
  }
}
