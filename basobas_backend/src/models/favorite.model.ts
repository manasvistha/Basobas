import mongoose, { Document, Schema } from "mongoose";

export interface IFavorite extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId; // reference to User
  property: mongoose.Types.ObjectId; // reference to Property
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteSchema: Schema = new Schema<IFavorite>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent duplicate favorites
FavoriteSchema.index({ user: 1, property: 1 }, { unique: true });

export default mongoose.model<IFavorite>('Favorite', FavoriteSchema);
