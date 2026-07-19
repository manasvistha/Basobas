import mongoose, { Document, Schema } from "mongoose";

export interface IMessage {
  sender: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
}

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[]; // user ids
  booking?: mongoose.Types.ObjectId;
  messages: IMessage[];
  lastMessage?: string;
  lastMessageTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ConversationSchema: Schema = new Schema<IConversation>(
  {
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking'
    },
    messages: [MessageSchema],
    lastMessage: String,
    lastMessageTime: Date
  },
  {
    timestamps: true
  }
);

// Index for efficient querying
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ booking: 1 }, { unique: true, sparse: true });

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
