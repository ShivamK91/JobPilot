import { Request } from 'express';

export interface IUser {
  _id: string;
  email: string;
  password: string;
}

export interface IApplication {
  _id: string;
  userId: string;
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

export interface ParsedJob {
  company: string;
  role: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  seniority: string;
  location: string;
}

export interface AuthRequest extends Request {
  userId?: string;
}
