export interface CareerRole {
  _id: string;
  title: string;
  category: string;
  description: string;
  coreSkills: string[];
  optionalSkills: string[];
  demandLevel: "Moderate" | "High" | "Very High";
  createdAt?: string;
  updatedAt?: string;
}

export interface SkillCategoryBreakdown {
  total: number;
  matchedCount: number;
  missingCount: number;
  matched: string[];
  missing: string[];
}

export interface RoleAnalysisResult {
  role: {
    _id: string;
    title: string;
    category: string;
    description: string;
    demandLevel: "Moderate" | "High" | "Very High";
  };
  scores: {
    overallMatch: number;
    coreMatch: number;
    bonusMatch: number;
    readinessStatus: "Foundational" | "Intermediate" | "Job Ready";
    statusTone: "warning" | "info" | "success";
  };
  breakdown: {
    core: SkillCategoryBreakdown;
    optional: SkillCategoryBreakdown;
  };
}

