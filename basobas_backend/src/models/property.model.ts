import mongoose, { Document, Schema } from "mongoose";

export interface IProperty extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  price: number; // per month or whatever
  bedrooms?: number;
  bathrooms?: number;
  area?: number; // in sqft
  propertyType?: string; // room, house, apartment, etc
  furnished?: boolean;
  floor?: number;
  parking?: boolean;
  petPolicy?: string;
  amenities?: string[];
  availability: {
    startDate: Date;
    endDate: Date;
  }[];
  images: string[]; // URLs or paths
  owner: mongoose.Types.ObjectId; // reference to User
  status: 'pending' | 'approved' | 'rejected' | 'available' | 'assigned' | 'booked';
  assignedTo?: mongoose.Types.ObjectId; // user who rented it
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema: Schema = new Schema<IProperty>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    bedrooms: {
      type: Number,
      default: 0
    },
    bathrooms: {
      type: Number,
      default: 0
    },
    area: {
      type: Number,
      default: 0
    },
    propertyType: {
      type: String,
      enum: ['room', 'house', 'apartment', 'studio', 'other'],
      default: 'room'
    },
    furnished: {
      type: Boolean,
      default: false
    },
    floor: {
      type: Number
    },
    parking: {
      type: Boolean,
      default: false
    },
    petPolicy: {
      type: String,
      enum: ['allowed', 'not-allowed', 'on-request'],
      default: 'not-allowed'
    },
    amenities: [{
      type: String
    }],
    availability: [{
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true }
    }],
    images: [{
      type: String
    }],
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'available', 'assigned', 'booked'],
      default: 'pending'
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

PropertySchema.index({ "coordinates.latitude": 1, "coordinates.longitude": 1 });

export default mongoose.model<IProperty>('Property', PropertySchema);
