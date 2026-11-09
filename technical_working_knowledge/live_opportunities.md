# Technical Architecture: Real-Time Live Job Opportunities & Direct Application Matcher

---

## 1. Overview & Value Proposition
This feature enables candidates to transition directly from identifying their skill gaps to finding and applying for real-world hiring opportunities. Rather than presenting generic search links or static job placeholders, the system dynamically fetches active tech postings, computes a live skill compatibility score against the candidate's MongoDB profile, and provides direct links to submit job applications.

---

## 2. Technology Tools & Justification

| Component | Tool / Technology | Technical Rationale |
| :--- | :--- | :--- |
| **Live Job Aggregator** | **Arbeitnow & Remotive Public Tech Jobs API** (REST JSON) | **100% Free, Public & Open**. Requires zero third-party billing, credit card setup, or proprietary API key management. Allows anyone who downloads the repository or ZIP file to run the feature immediately out-of-the-box. |
| **Backend API Layer** | Node.js, Express (`jobRoutes.js`, `jobService.js`) | Acts as a secure intermediary proxy. Fetches external postings, normalizes heterogeneous data schemas, filters out expired postings, and calculates skill match percentages before delivering clean JSON to the client. |
| **AI Compatibility Matcher** | In-Memory Weighted Matcher + Google Gemini Flash | Performs set-intersection and semantic alignment between the required skills in the job description and the candidate's active `currentSkills` arsenal from MongoDB. |
| **Frontend UI** | React + TypeScript (`JobOpportunitiesTab.tsx`) | Presents interactive, glassmorphic job cards with role tags, company badges, match readiness bars, direct application buttons, and 1-click links to search on LinkedIn. |
| **Database** | MongoDB & Mongoose | Stores persistent candidate profiles and user-saved bookmarks (Saved Jobs) while keeping dynamic search results ephemeral to prevent database bloat. |

---

## 3. Architecture & Data Pipeline Diagram

```
                               ┌────────────────────────────────────────────────┐
                               │           User in React Dashboard              │
                               │      (Navigates to "Job Opportunities")        │
                               └───────────────────────┬────────────────────────┘
                                                       │
                                                       │ 1. GET /api/jobs?query=Full+Stack+Developer
                                                       ▼
                               ┌────────────────────────────────────────────────┐
                               │             Express Backend Proxy              │
                               │           (backend/routes/jobRoutes.js)        │
                               └───────────┬────────────────────────┬───────────┘
                                           │                        │
       2. Fetches saved user skills from   │                        │ 3. Dispatches query to Live Jobs API
          MongoDB UserProfile document     │                        │
                                           ▼                        ▼
                       ┌─────────────────────────┐    ┌─────────────────────────────────┐
                       │   MongoDB Database      │    │  External Live Tech Jobs API    │
                       │ (collections: profiles) │    │  (Arbeitnow / Remotive Endpoints│
                       └─────────────────────────┘    └────────────────┬────────────────┘
                                                                       │
                                                                       │ 4. Returns raw job listings JSON
                                                                       ▼
                               ┌────────────────────────────────────────────────┐
                               │           Backend Data Processing Engine       │
                               │             (backend/services/jobService.js)   │
                               │  • Strips HTML and normalizes schema           │
                               │  • Extracts required technologies & tags       │
                               │  • Computes % skill match against profile      │
                               │  • Injects direct application & LinkedIn links │
                               └───────────────────────┬────────────────────────┘
                                                       │
                                                       │ 5. Returns standardized, scored job cards
                                                       ▼
                               ┌────────────────────────────────────────────────┐
                               │            Client-Side Presentation            │
                               │          (JobOpportunitiesTab.tsx)             │
                               │  [ Swiggy | Junior Full Stack Dev | 85% Match ]│
                               │  [ Tags: React, Node.js, TypeScript, AWS ]     │
                               │  [ 🚀 Apply Direct ]  [ ⚡ Analyze with AI ]   │
                               └────────────────────────────────────────────────┘
```

---

## 4. Step-by-Step Data Processing Lifecycle

1. **Trigger & Query Formation**:
   - When the user opens the "Job Opportunities" tab, the client automatically pre-fills the query with the user's active `targetRole` (e.g. `Full Stack Developer` or `Cybersecurity Analyst`) and experience level.
   - The user can also type a custom search term, location (e.g. `Remote`, `India`), or filter by seniority.

2. **Backend Proxy & Fetching**:
   - The frontend sends an authenticated request to `GET /api/jobs`.
   - The Express backend handles the request to avoid CORS issues and prevent exposing direct third-party endpoints on the client.
   - It queries the external live jobs feed and retrieves real-time JSON postings.

3. **Data Normalization & Cleaning**:
   - Raw external job data formats vary significantly across sources. The `jobService` maps every job to a standardized schema:
     ```typescript
     interface LiveJobOpportunity {
       id: string;
       title: string;
       company: string;
       companyLogo?: string;
       location: string;
       isRemote: boolean;
       tags: string[];
       descriptionSnippet: string;
       applyUrl: string;
       linkedinSearchUrl: string;
       postedAt: string;
       matchScore?: number;
       matchedSkills?: string[];
       missingSkills?: string[];
     }
     ```

4. **Skill Fit Evaluation**:
   - The backend compares the job's detected tech tags against the candidate's `currentSkills` saved in MongoDB.
   - It generates a live **Match Readiness Score** (e.g., 4 out of 5 required technologies possessed = `80% Match`), enabling candidates to quickly prioritize openings where they are most competitive.

5. **Direct Application & 1-Click Exploration**:
   - Each rendered card provides:
     - **Direct Apply Button**: Opens the company's application form or portal directly.
     - **LinkedIn Deep-Link**: Opens LinkedIn's search engine pre-filtered for that exact role and company.
     - **Analyze with Gemini**: Injects the job description straight into our Custom Job Analyzer to view detailed core vs. bonus requirement breakdowns.

---

## 5. Database (MongoDB) Storage Strategy

### Why We Do NOT Permanently Store All Search Results in MongoDB:
- **Ephemeral Nature of Jobs**: Job openings are short-lived (companies typically close postings within 14–30 days).
- **Preventing Database Bloat**: Persisting every searched job into MongoDB would quickly bloat the database with thousands of expired postings that candidates can no longer apply to.
- **Guaranteed Freshness**: Querying live on-demand ensures candidates are always reviewing active listings.

### What IS Stored in MongoDB:
1. **Short-Term Server Cache (In-Memory / TTL)**:
   - Recent search query results are cached for 5 to 10 minutes. If the candidate switches tabs and returns, the results load instantaneously without redundant external network requests.
2. **User Bookmarks ("Saved Jobs")**:
   - When a candidate clicks the ⭐ **Save Job** button on an opening, that specific job object is stored in the user's document in MongoDB (`UserProfile.savedJobs`).
   - This allows candidates to maintain a personal pipeline of jobs they are tracking or have applied to.

---

## 6. Key Frontend & Backend Touchpoints

```text
backend/
├── routes/
│   └── jobRoutes.js          # REST endpoints for searching & saving live jobs
└── services/
    └── jobService.js         # API aggregation, normalization, and skill scoring

frontend/
├── src/
│   ├── components/dashboard/
│   │   └── JobOpportunitiesTab.tsx   # Live job search UI, filter bar & cards
│   ├── services/
│   │   └── api.ts                    # Client fetch methods for /api/jobs
│   └── types/
│       └── job.ts                    # TypeScript definitions for live jobs
```
