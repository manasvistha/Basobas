import { Request, Response } from "express";
import { ConversationService } from "../services/conversation.service";
import {
  CreateConversationDto,
  CreateConversationSchema,
  SendMessageDto,
  SendMessageSchema,
} from "../dtos/conversation.dto";
import mongoose from "mongoose";

export class ConversationController {
  private conversationService = new ConversationService();

  private getAuthenticatedUserId(req: Request): string {
    const authUser = (req as any).user || {};
    const candidates = [authUser.id, authUser._id, authUser.userId, authUser.sub];
    const userId = candidates.find((candidate) => typeof candidate === "string" && candidate.trim().length > 0) || "";

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Unauthorized");
    }

    return userId;
  }

  async createConversation(req: Request, res: Response) {
    try {
      const parsed = CreateConversationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
      }

      const data: CreateConversationDto = parsed.data;
      const requesterId = this.getAuthenticatedUserId(req);
      const conversation = await this.conversationService.createConversation(data, requesterId);
      res.status(201).json(conversation);
    } catch (error: any) {
      if (error.message === "Unauthorized") {
        return res.status(403).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async getMyConversations(req: Request, res: Response) {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const conversations = await this.conversationService.getConversationsByUser(userId);
      res.json(conversations);
    } catch (error: any) {
      if (error.message === "Unauthorized") {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const rawData: SendMessageDto = {
        conversationId: req.body?.conversationId || id,
        content: req.body?.content,
      };

      const parsed = SendMessageSchema.safeParse(rawData);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
      }

      const data = parsed.data;
      const senderId = this.getAuthenticatedUserId(req);
      if (!data.conversationId || !data.content?.trim()) {
        return res.status(400).json({ error: "conversationId and content are required" });
      }
      const conversation = await this.conversationService.sendMessage(data, senderId);
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });
      res.json(conversation);
    } catch (error: any) {
      if (error.message === "Unauthorized") {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === "Conversation not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async getConversationById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = this.getAuthenticatedUserId(req);
      const conversation = await this.conversationService.getConversationById(id, userId);
      res.json(conversation);
    } catch (error: any) {
      if (error.message === "Conversation not found or unauthorized") {
        return res.status(404).json({ error: error.message });
      }
      res.status(404).json({ error: error.message });
    }
  }

  async deleteConversation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = this.getAuthenticatedUserId(req);
      const deleted = await this.conversationService.deleteConversation(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === "Conversation not found or unauthorized") {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async getBookingConversation(req: Request, res: Response) {
    try {
      const { bookingId } = req.params;
      const userId = this.getAuthenticatedUserId(req);
      const conversation = await this.conversationService.getBookingConversation(bookingId, userId);
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });
      res.json(conversation);
    } catch (error: any) {
      if (error.message === "Unauthorized") {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === "Booking not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async sendBookingMessage(req: Request, res: Response) {
    try {
      const { bookingId } = req.params;
      const senderId = this.getAuthenticatedUserId(req);
      const content = String(req.body?.content || "").trim();

      if (!content) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const conversation = await this.conversationService.sendBookingMessage(
        bookingId,
        content,
        senderId
      );

      res.json(conversation);
    } catch (error: any) {
      if (error.message === "Unauthorized") {
        return res.status(403).json({ error: error.message });
      }
      if (
        error.message === "Booking not found" ||
        error.message === "Conversation not found"
      ) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === "Invalid booking participants") {
        return res.status(400).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }
}
