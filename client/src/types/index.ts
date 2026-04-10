export interface Application {
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

export interface AuthResponse {
  token: string;
}

export interface ApiError {
  message: string;
}
