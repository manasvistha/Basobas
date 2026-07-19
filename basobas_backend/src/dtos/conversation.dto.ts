import z from "zod";

export const CreateConversationSchema = z.object({
  participants: z
    .array(
      z
        .string()
        .trim()
        .regex(/^[a-f\d]{24}$/i, "Each participant must be a valid user id")
    )
    .min(2, "At least two participants required")
    .max(2, "Conversation must be between exactly two users")
});

export const SendMessageSchema = z.object({
  conversationId: z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid conversation id"),
  content: z.string().trim().min(1, "Message content is required")
});

export type CreateConversationDto = z.infer<typeof CreateConversationSchema>;
export type SendMessageDto = z.infer<typeof SendMessageSchema>;
