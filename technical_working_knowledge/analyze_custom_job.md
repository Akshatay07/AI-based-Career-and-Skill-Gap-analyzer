# Technical Architecture: Custom Job Description Analyzer

---

## 1. Overview & Objective
Real-world job postings on LinkedIn, Indeed, Wellfound, and company career portals are notoriously unstructured. They mix boilerplate corporate descriptions, soft skills, and irregular technical phrasing (e.g., *"JS/TS expert"*, *"K8s container wizard"*, *"RESTful service architect"*).

The **Custom Job Analyzer** enables candidates to paste any arbitrary job posting text into the application. It runs a **Two-Tier Hybrid Extraction & Matching Engine** that converts unstructured HR prose into standardized, actionable skill gap intelligence.

---

## 2. Two-Tier Hybrid Extraction & Matching Engine

```
                          Unstructured Job Text (Pasted by Candidate)
                                             │
                                             ▼
       ┌───────────────────────────────────────────────────────────────────────────┐
       │             TIER 1: Gemini Flash Generative Extraction Engine             │
       │  • Parses role title, industry category, and clean description           │
       │  • Isolates atomic technical skills into coreSkills vs optionalSkills     │
       │  • Performs initial semantic match against candidate's profile skills     │
       └─────────────────────────────────────┬─────────────────────────────────────┘
                                             │
                                             ▼
       ┌───────────────────────────────────────────────────────────────────────────┐
       │             TIER 2: Canonical Alias Map & Algorithmic Matcher             │
       │  • Normalizes common developer abbreviations (k8s -> kubernetes, etc.)     │
       │  • Performs bidirectional substring matching for compound phrases         │
       │  • Merges Gemini semantic set + Algorithmic set to prevent false negatives │
       └─────────────────────────────────────┬─────────────────────────────────────┘
                                             │
                                             ▼
       ┌───────────────────────────────────────────────────────────────────────────┐
       │                        Weighted Scoring Engine                            │
       │    Score = round(0.75 * Core Match % + 0.25 * Bonus Match %)              │
       │    Readiness Tier: Job Ready (>=80%) | Intermediate (>=50%) | Foundational│
       └───────────────────────────────────────────────────────────────────────────┘
```

---

### 2.1. Tier 1: Gemini Flash Generative Extraction
- **API Endpoint**: `POST /api/ai/analyze-job` (Protected with JWT)
- **Model**: `gemini-2.5-flash` via official `@google/genai` SDK
- **Prompt Guardrails**:
  - The model is instructed to ignore generic soft skills (e.g., *"good communicator"*, *"team player"*, *"hard worker"*) and extract strictly **atomic, verifiable technical tools, languages, frameworks, databases, and architectural patterns**.
  - Distinguishes between **Core Requirements** (explicit must-haves, e.g. *"3+ years with Node.js and SQL"*) and **Optional Competencies** (e.g. *"Nice to have: Docker, AWS"*).
  - Returns a validated JSON object conforming to strict schema definitions.

### 2.2. Tier 2: Canonical Technical Alias Normalizer
To prevent false negatives when job descriptions use informal abbreviations, the backend applies an internal canonical alias dictionary (`ALIAS_MAP` in `aiRoutes.js`):

```javascript
const ALIAS_MAP = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  nodejs: "node.js",
  node: "node.js",
  reactjs: "react",
  k8s: "kubernetes",
  docker: "docker",
  aws: "aws",
  gcp: "gcp",
  azure: "azure",
  git: "git",
  github: "git",
  mongo: "mongodb",
  postgres: "postgresql",
  rest: "rest apis",
  "restful api": "rest apis",
  sql: "sql",
  ml: "machine learning",
  llm: "large language models",
  // ... comprehensive technical mappings
};
```

**Matching Logic**:
1. Check for exact case-insensitive equality: `normalizeSkill(user) === normalizeSkill(job)`.
2. Check for alias canonical equality: `ALIAS_MAP[user] === ALIAS_MAP[job]`.
3. Check for multi-word substring containment (with a minimum length threshold of 3 characters to prevent false single-letter matches like `"C"` in `"CSS"`).
4. Combine Gemini's semantic matches with algorithmic alias matches:
   $$\text{Matched Skills} = \text{GeminiMatches} \cup \text{AlgorithmicMatches}$$

---

## 3. Mathematical Weighting & Output Format

The custom analyzer uses the same recruiter weighting formula as the benchmark analyzer:

$$\text{Readiness Score} = \text{round}\left( 0.75 \times \frac{|\text{Matched Core}|}{|\text{Total Core}|} \times 100 + 0.25 \times \frac{|\text{Matched Optional}|}{|\text{Total Optional}|} \times 100 \right)$$

### Response Schema:
```json
{
  "success": true,
  "data": {
    "role": {
      "_id": "custom-job-1731174000000",
      "title": "Senior React & Node.js Engineer",
      "category": "Software Engineering",
      "description": "Building high-performance SaaS applications with modern React and microservices...",
      "demandLevel": "High"
    },
    "scores": {
      "overallMatch": 78,
      "coreMatch": 80,
      "bonusMatch": 71,
      "readinessStatus": "Intermediate",
      "statusTone": "info"
    },
    "breakdown": {
      "core": {
        "total": 5,
        "matchedCount": 4,
        "missingCount": 1,
        "matched": ["React", "Node.js", "TypeScript", "RESTful APIs"],
        "missing": ["Docker"]
      },
      "optional": {
        "total": 3,
        "matchedCount": 2,
        "missingCount": 1,
        "matched": ["MongoDB", "Tailwind CSS"],
        "missing": ["AWS"]
      }
    }
  }
}
```

---

## 4. Seamless Workflow Integrations

### 4.1. Integration with "Live Opportunities" Feed
- When a candidate browses the real-time job feed in the **Live Opportunities** tab, every job card features a prominent **`⚡ Test with AI Analyzer`** button.
- Clicking this button automatically extracts the posting's title, company, description, and requirements, pre-populates the Custom Job input text area, and switches to the analyzer tab for instant evaluation.

### 4.2. Actionable Post-Analysis Workflows
Once the custom job analysis completes, the UI presents two primary actions:
1. **"Set as My Target Role"**: Updates the candidate's active `userprofiles.targetRole` in MongoDB so their entire dashboard is tailored to this new opportunity.
2. **"Generate AI Roadmap for This Job"**: Passes the custom job's missing skills directly into the Gemini Roadmap generator, creating a tailored 12-week study plan specifically designed to qualify the candidate for this exact posting.
