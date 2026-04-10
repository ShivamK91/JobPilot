import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IApplicationDocument extends Document {
  userId: Types.ObjectId;
  company: string;
  role: string;
  jdLink: string;
  notes: string;
  dateApplied: Date;
  status: 'Applied' | 'Phone Screen' | 'Interview' | 'Offer' | 'Rejected';
  salaryRange?: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  seniority: string;
  location: string;
  resumeSuggestions: string[];
}

const ApplicationSchema = new Schema<IApplicationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    jdLink: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    dateApplied: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected'],
      default: 'Applied',
    },
    salaryRange: {
      type: String,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    niceToHaveSkills: {
      type: [String],
      default: [],
    },
    seniority: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    resumeSuggestions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IApplicationDocument>('Application', ApplicationSchema);
