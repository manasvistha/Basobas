import mongoose, { Document, Schema } from "mongoose";

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId; // tenant/requester
  owner: mongoose.Types.ObjectId; // property owner
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  message?: string; // optional message from user
  tenantInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    idNumber?: string;
  };
  payment?: {
    method?: string;
    amount?: number;
    currency?: string;
    status?: 'pending' | 'success' | 'failed';
    transactionId?: string;
    meta?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema<IBooking>(
  {
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending'
    },
    message: String
    ,
    tenantInfo: {
      name: String,
      email: String,
      phone: String,
      idNumber: String
    },
    payment: {
      method: String,
      amount: Number,
      currency: String,
      status: String,
      transactionId: String,
      meta: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Index for property bookings
BookingSchema.index({ property: 1, status: 1 });
BookingSchema.index({ property: 1, user: 1 }, { unique: true });
BookingSchema.index({ owner: 1, createdAt: -1 });
BookingSchema.index(
  { property: 1 },
  { unique: true, partialFilterExpression: { status: 'approved' } }
);

export default mongoose.model<IBooking>('Booking', BookingSchema);
