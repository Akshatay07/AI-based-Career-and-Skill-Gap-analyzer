export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  companyLogo?: string | null;
  location: string;
  isRemote: boolean;
  jobType: string;
  tags: string[];
  descriptionSnippet: string;
  description: string;
  applyUrl: string;
  linkedinSearchUrl: string;
  postedAt: string;
  source: string;
  salary?: string | null;
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
}

export interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  applyUrl: string;
  linkedinSearchUrl?: string;
  tags: string[];
  descriptionSnippet: string;
  source: string;
  savedAt: string;
}

export interface JobFilterParams {
  query?: string;
  location?: string;
  remoteOnly?: boolean;
  skills?: string[];
}
