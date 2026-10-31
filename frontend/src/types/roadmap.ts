export interface ActionItem {
  _id?: string;
  task: string;
  isCompleted: boolean;
}

export interface ResourceItem {
  _id?: string;
  title: string;
  type: string;
  urlOrPlatform: string;
}

export interface TimelinePhase {
  _id?: string;
  phaseNumber: number;
  title: string;
  duration: string;
  focusSkills: string[];
  actionItems: ActionItem[];
  resources: ResourceItem[];
}

export interface RecommendedProject {
  _id?: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  demonstratesSkills: string[];
  architectureHighlights: string[];
}

export interface Roadmap {
  _id: string;
  user: string;
  targetRole: string;
  experienceLevel: string;
  missingSkills: string[];
  overview: string;
  timelinePhases: TimelinePhase[];
  recommendedProjects: RecommendedProject[];
  interviewFocusAreas: string[];
  createdAt?: string;
  updatedAt?: string;
}

