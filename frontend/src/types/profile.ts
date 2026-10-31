export interface Education {
  degree: string;
  fieldOfStudy: string;
  institution: string;
  graduationYear?: number | '';
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  targetRole: string;
  currentSkills: string[];
  experienceLevel: 'Fresher/Student' | 'Entry Level' | 'Intermediate' | 'Experienced';
  education: Education;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProfileInput {
  name: string;
  email: string;
  targetRole: string;
  currentSkills: string[];
  experienceLevel: 'Fresher/Student' | 'Entry Level' | 'Intermediate' | 'Experienced';
  education: Education;
}
