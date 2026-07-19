import { ConversationRepository } from "../repositories/conversation.repository";
import { BookingRepository } from "../repositories/booking.repository";
import { NotificationService } from "./notification.service";
import { CreateConversationDto, SendMessageDto } from "../dtos/conversation.dto";
import mongoose from "mongoose";
import Property from "../models/property.model";
import Notification from "../models/notification.model";

export class ConversationService {
  private conversationRepository = new ConversationRepository();
  private bookingRepository = new BookingRepository();
  private notificationService = new NotificationService();

  private toId(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value._id) return value._id.toString();
    return value.toString();
  }

  private isParticipant(conversation: any, userId: string): boolean {
    return conversation.participants.some((participant: any) => this.toId(participant) === userId);
  }

  private isValidObjectId(value: string): boolean {
    return Boolean(value && mongoose.Types.ObjectId.isValid(value));
  }

  private normalizeParticipants(participants: string[]): string[] {
    return Array.from(
      new Set(
        participants
          .map((participant) => String(participant || "").trim())
          .filter((participant) => participant.length > 0)
      )
    );
  }

  private async inferOwnerFromPropertyBookings(propertyId: string, bookingUserId: string): Promise<string> {
    try {
      const propertyBookings = await this.bookingRepository.findByProperty(propertyId);
      const ownerFromOtherBookings = propertyBookings
        .map((propertyBooking) => this.toId((propertyBooking as any).owner))
        .find((candidate) => this.isValidObjectId(candidate) && candidate !== bookingUserId);

      return ownerFromOtherBookings || "";
    } catch {
      return "";
    }
  }

  private async inferOwnerFromNotifications(propertyId: string, bookingUserId: string): Promise<string> {
    if (!this.isValidObjectId(propertyId) || !this.isValidObjectId(bookingUserId)) {
      return "";
    }

    const ownerHintNotification = await Notification.findOne({
      relatedId: new mongoose.Types.ObjectId(propertyId),
      user: { $ne: new mongoose.Types.ObjectId(bookingUserId) },
      message: {
        $regex: /(your property|booking request received|approved a booking request|has been booked)/i,
      },
    })
      .sort({ createdAt: -1 })
      .select("user");

    return this.toId(ownerHintNotification?.user);
  }

  async createConversation(data: CreateConversationDto, requesterId: string) {
    const uniqueParticipants = this.normalizeParticipants(data.participants);

    if (!uniqueParticipants.every((participant) => this.isValidObjectId(participant))) {
      throw new Error("Each participant must be a valid user id");
    }

    if (!uniqueParticipants.includes(requesterId)) {
      throw new Error("Unauthorized");
    }

    if (uniqueParticipants.length !== 2) {
      throw new Error("Conversation must be between exactly two users");
    }

    // Check if conversation already exists
    const existing = await this.conversationRepository.findByParticipants(uniqueParticipants);
    if (existing) return existing;

    return await this.conversationRepository.create({ participants: uniqueParticipants });
  }

  async getConversationsByUser(userId: string) {
    return await this.conversationRepository.findByUser(userId);
  }

  async sendMessage(data: SendMessageDto, senderId: string) {
    const existingConversation = await this.conversationRepository.findById(data.conversationId);
    if (!existingConversation) {
      throw new Error("Conversation not found");
    }

    if (!this.isParticipant(existingConversation, senderId)) {
      throw new Error("Unauthorized");
    }

    const conversation = await this.conversationRepository.addMessage(data.conversationId, senderId, data.content);
    if (conversation) {
      // Notify other participants
      const otherParticipants = conversation.participants.filter((participant) => this.toId(participant) !== senderId);
      for (const participant of otherParticipants) {
        await this.notificationService.createNotification(
          this.toId(participant),
          `New message in conversation.`,
          'message',
          data.conversationId
        );
      }
    }
    return conversation;
  }

  async getConversationById(id: string, userId: string) {
    const conversation = await this.conversationRepository.findById(id);
    if (!conversation || !this.isParticipant(conversation, userId)) {
      throw new Error("Conversation not found or unauthorized");
    }
    return conversation;
  }

  async deleteConversation(id: string, userId: string) {
    const conversation = await this.conversationRepository.findById(id);
    if (!conversation || !this.isParticipant(conversation, userId)) {
      throw new Error("Conversation not found or unauthorized");
    }

    return await this.conversationRepository.deleteById(id);
  }

  private async getBookingForParticipant(bookingId: string, userId: string) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    const bookingUserId = this.toId(booking.user);
    const bookingPropertyId = this.toId(booking.property);

    const ownerCandidates = [
      this.toId((booking as any).owner),
      typeof booking.property === "object" && (booking.property as any)?.owner
        ? this.toId((booking.property as any).owner)
        : "",
    ].filter((candidate) => candidate.length > 0);

    // Recovery path for legacy bookings with missing owner on the booking row.
    if (!ownerCandidates.some((candidate) => this.isValidObjectId(candidate)) && this.isValidObjectId(bookingPropertyId)) {
      const property = await Property.findById(bookingPropertyId).select("owner");
      ownerCandidates.push(this.toId(property?.owner));
    }

    if (!ownerCandidates.some((candidate) => this.isValidObjectId(candidate)) && this.isValidObjectId(bookingPropertyId)) {
      ownerCandidates.push(await this.inferOwnerFromPropertyBookings(bookingPropertyId, bookingUserId));
    }

    if (!ownerCandidates.some((candidate) => this.isValidObjectId(candidate)) && this.isValidObjectId(bookingPropertyId)) {
      ownerCandidates.push(await this.inferOwnerFromNotifications(bookingPropertyId, bookingUserId));
    }

    const bookingOwnerId = ownerCandidates.find((candidate) => this.isValidObjectId(candidate)) || "";

    const originalOwnerId = this.toId((booking as any).owner);
    if (!this.isValidObjectId(originalOwnerId) && this.isValidObjectId(bookingOwnerId)) {
      try {
        await this.bookingRepository.updateOwner(bookingId, bookingOwnerId);
      } catch {
        // Owner recovery persistence is best-effort.
      }
    }

    if (!this.isValidObjectId(bookingUserId) || !this.isValidObjectId(bookingOwnerId)) {
      throw new Error("Invalid booking participants");
    }

    if (bookingUserId !== userId && bookingOwnerId !== userId) {
      throw new Error("Unauthorized");
    }

    return {
      booking,
      bookingUserId,
      bookingOwnerId,
    };
  }

  async getBookingConversation(bookingId: string, userId: string) {
    const { bookingUserId, bookingOwnerId } = await this.getBookingForParticipant(bookingId, userId);

    const existing = await this.conversationRepository.findByBooking(bookingId);
    if (existing) {
      return existing;
    }

    const created = await this.conversationRepository.create({
      participants: [bookingUserId, bookingOwnerId],
      booking: bookingId,
    });

    return await this.conversationRepository.findById(created._id.toString());
  }

  async sendBookingMessage(bookingId: string, content: string, senderId: string) {
    const conversation = await this.getBookingConversation(bookingId, senderId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const updatedConversation = await this.conversationRepository.addMessage(
      conversation._id.toString(),
      senderId,
      content
    );

    if (!updatedConversation) {
      throw new Error("Conversation not found");
    }

    const otherParticipants = updatedConversation.participants.filter(
      (participant) => this.toId(participant) !== senderId
    );

    for (const participant of otherParticipants) {
      await this.notificationService.createNotification(
        this.toId(participant),
        `New message in booking chat.`,
        'message',
        bookingId
      );
    }

    return updatedConversation;
  }
}
