import mongoose, { Document, Schema } from 'mongoose';

export interface IUserDocument extends Document {
  email: string;
  password: string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUserDocument>('User', UserSchema);
