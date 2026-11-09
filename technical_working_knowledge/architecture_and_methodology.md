# Technical Architecture, Data Flow, Methodology & User Journey

---

## 1. Executive System Architecture

The **AI-Based Career and Skill Gap Analyzer** is designed around a scalable, modern 3-Tier Full-Stack Microservices Architecture with external AI and RESTful integrations:

```mermaid
flowchart TD
    subgraph ClientTier ["1. Presentation Tier (Client SPA)"]
        UI["React 19 + TypeScript + Vite"]
        Router["Client-Side State & Dynamic Tab Router"]
        Components["Dashboard Components\n(Overview, SkillGapTab, AiRoadmapTab, CustomJobTab, JobOpportunitiesTab)"]
        UI --> Router --> Components
    end

    subgraph APITier ["2. Application & API Gateway Tier (Node.js & Express)"]
        Express["Express.js Server (Port 5000)"]
        AuthMiddleware["JWT Authentication Middleware (protect)"]
        CorsLogger["CORS & Body Parser (15MB limit)"]
        
        subgraph SubRouters ["Modular REST Routers"]
            R_Auth["/api/auth (Register, Login)"]
            R_Profile["/api/profiles (CRUD, Sync, Resume)"]
            R_Role["/api/roles (Benchmark Roles, 75/25 Gap Analysis)"]
            R_Roadmap["/api/ai/roadmap (Gemini 12-Week Curriculum, Checkboxes)"]
            R_Custom["/api/ai/analyze-job (Unstructured Job Extraction)"]
            R_Jobs["/api/jobs (Live Aggregator, Arbeitnow, Remotive, Bookmarks)"]
        end

        Express --> CorsLogger --> AuthMiddleware --> SubRouters
    end

    subgraph ServiceTier ["3. Processing & Integration Services"]
        GeminiService["geminiService.js\n(Official @google/genai SDK)"]
        JobService["jobService.js\n(In-Memory 10-Min Cache & Matcher)"]
        SeedService["seedDatabase.js\n(Auto-populates 8 Benchmark Roles)"]
    end

    subgraph DataTier ["4. Persistent Data Tier (Local MongoDB)"]
        Mongo[("MongoDB Database\n(career_skill_analyzer)")]
        C_Users["users (Auth & Bcrypt Hash)"]
        C_Profiles["userprofiles (Target, Skills, Bookmarks)"]
        C_Roles["careerroles (8 Benchmark Roles)"]
        C_Roadmaps["roadmaps (12-Week Plans & Tasks)"]
        Mongo --- C_Users & C_Profiles & C_Roles & C_Roadmaps
    end

    subgraph ExternalTier ["5. External Cloud & Intelligence Services"]
        GeminiCloud["Google Gemini 2.5 Flash API\n(Structured JSON Mode)"]
        ArbeitnowAPI["Arbeitnow Public Tech Jobs API\n(Global & European Feed)"]
        RemotiveAPI["Remotive Remote Developer API\n(Global Remote Feed)"]
    end

    %% Tier Connections
    Components <==>|"REST JSON over HTTP / Axios / Fetch"| Express
    SubRouters --> ServiceTier
    ServiceTier <==>|"Mongoose ODM (O(1) Indexed Queries)"| Mongo
    GeminiService <==>|"HTTPS (Gemini API Key)"| GeminiCloud
    JobService <==>|"HTTPS Public REST (No Auth Key Required)"| ArbeitnowAPI & RemotiveAPI
```

---

## 2. Data Flow Diagrams (DFD)

### 2.1. Level 0 DFD (Context Diagram)
The Context Diagram illustrates the boundary of the system, external entities, and high-level data exchanges:

```mermaid
flowchart LR
    Candidate(["Candidate / Job Seeker"])
    System[["AI Career & Skill Gap Analyzer System"]]
    Gemini(["Google Gemini AI Engine"])
    JobAPIs(["Live Job Networks (Arbeitnow & Remotive)"])
    DB[(MongoDB Database)]

    Candidate -->|"1. Credentials, Skills, Resume, Target Role"| System
    System -->|"2. Gap Reports, AI Roadmaps, Live Jobs, Match Scores"| Candidate

    System -->|"3. Resume & Job Text, Context Prompts"| Gemini
    Gemini -->|"4. Structured Skills, 12-Week Curriculums, Gaps"| System

    System -->|"5. Search Queries (Category, Remote)"| JobAPIs
    JobAPIs -->|"6. Real-Time Tech Job Postings (JSON)"| System

    System <-->|"7. Profiles, Benchmark Roles, Roadmaps, Bookmarks"| DB
```

---

### 2.2. Level 1 DFD (Detailed Sub-System Processes)
This diagram decomposes the system into its 5 primary functional processes:

```mermaid
flowchart TD
    User(["Candidate"])

    subgraph P1 ["Process 1.0: Authentication & Profile Management"]
        P1_Proc["Register / Login / Profile Setup"]
        D1[("users Collection")]
        D2[("userprofiles Collection")]
        User -->|"Name, Email, Password"| P1_Proc
        P1_Proc -->|"Store Bcrypt Hash"| D1
        P1_Proc -->|"Save Target Role & Skills"| D2
    end

    subgraph P2 ["Process 2.0: Resume Parsing & Skill Ingestion"]
        P2_Proc["AI Resume Ingestion Engine"]
        Ext_Gemini_1["Gemini Flash API"]
        User -->|"Upload PDF or Paste Text"| P2_Proc
        P2_Proc -->|"Ephemeral Base64 / Text"| Ext_Gemini_1
        Ext_Gemini_1 -->|"Atomic Skills & Education"| P2_Proc
        P2_Proc -->|"Update currentSkills"| D2
    end

    subgraph P3 ["Process 3.0: Benchmark & Custom Skill Gap Analyzer"]
        P3_Proc["75/25 Weighted Matcher"]
        D3[("careerroles Collection")]
        D2 -->|"Read currentSkills"| P3_Proc
        D3 -->|"Read Benchmark coreSkills & optionalSkills"| P3_Proc
        P3_Proc -->|"Return Match %, Matched & Missing Chips"| User
    end

    subgraph P4 ["Process 4.0: AI Personalized Roadmap Synthesizer"]
        P4_Proc["Curriculum Synthesis & Task Tracker"]
        Ext_Gemini_2["Gemini Flash API"]
        D4[("roadmaps Collection")]
        P3_Proc -->|"Forward Missing Skills"| P4_Proc
        P4_Proc -->|"Context Payload"| Ext_Gemini_2
        Ext_Gemini_2 -->|"12-Week Phased Curriculum"| P4_Proc
        P4_Proc -->|"Upsert Roadmap Document"| D4
        User <-->|"Toggle Task Checkboxes [x]"| P4_Proc
    end

    subgraph P5 ["Process 5.0: Live Opportunity Aggregation & Apply"]
        P5_Proc["Real-Time Job Matcher & Cache"]
        Ext_Jobs["Arbeitnow & Remotive APIs"]
        P5_Proc <-->|"10-Min Cache Fetch"| Ext_Jobs
        D2 -->|"Read Profile Skills"| P5_Proc
        P5_Proc -->|"Ranked Cards with Match % & Apply Links"| User
        User -->|"Click [Save Job ★]"| D2
        User -->|"Click [Apply Now 🚀]"| Ext_Apply["External Employer Application"]
    end
```

---

## 3. Engineering Methodology & Algorithms

The development methodology is grounded in **Evidence-Based Software Engineering (EBSE)** and **Human-in-the-Loop AI Collaboration**:

```
Stage 1: Ingestion & Normalization
  ├── Multimodal PDF Binary Buffer Extraction (RAM)
  └── Regex-driven Technical Tokenization & Alias Mapping
Stage 2: Deterministic Diagnostic Scoring
  ├── Set-Intersection Math for Verified Accuracy
  └── 75% Core / 25% Optional Weighting Matrix
Stage 3: Generative AI Personalization
  ├── Structured JSON Schema Mode (Google Gemini Flash)
  └── Prompt Constraints for Zero Hallucination
Stage 4: Market Alignment & Action
  ├── Real-Time Public API Aggregation & In-Memory Caching
  └── Direct Employer Application Handoff
```

### 3.1. Technical Skill Normalization Pipeline
To solve the industry problem of synonym fragmentation (e.g. `Node`, `Node.js`, `NodeJS` representing the same technology):
1. **Case & Space Normalization**: String converted to trimmed lowercase.
2. **Canonical Alias Resolution**: Mapped through `ALIAS_MAP`:
   - `k8s` $\rightarrow$ `kubernetes`
   - `ts` $\rightarrow$ `typescript`
   - `js` $\rightarrow$ `javascript`
   - `mongo` $\rightarrow$ `mongodb`
   - `postgres` $\rightarrow$ `postgresql`
   - `rest api` $\rightarrow$ `rest apis`
3. **Compound Token Containment**: Substring verification with a minimum 3-character threshold to prevent single-letter false matches.

### 3.2. Mathematical Evaluation Matrix
Recruiter hiring criteria prioritize mandatory skills over bonus competencies:

$$\text{Core Match Ratio } (R_c) = \frac{|\text{UserSkills} \cap \text{CoreSkills}|}{|\text{CoreSkills}|}$$

$$\text{Bonus Match Ratio } (R_b) = \frac{|\text{UserSkills} \cap \text{OptionalSkills}|}{|\text{OptionalSkills}|}$$

$$\text{Readiness Score} = \text{round}\left( (0.75 \cdot R_c + 0.25 \cdot R_b) \times 100 \right)$$

- **Readiness Classification**:
  - $\ge 80\%$: **Job Ready** (Eligible for technical screening).
  - $50\% - 79\%$: **Intermediate** (Viable candidate needing 2–3 targeted skills).
  - $< 50\%$: **Foundational** (Needs structural learning).

---

## 4. End-to-End User Journey Flowchart

```mermaid
flowchart TD
    Start(["User Visits Application"]) --> CheckAuth{"Is User Logged In?"}
    
    %% Unauthenticated Flow
    CheckAuth -->|"No"| Landing["Landing Hero Page\n(Feature Highlights, Project Architecture)"]
    Landing --> AuthModal["Auth Modal (Login or Register)"]
    AuthModal -->|"Submit Form"| JWT["Server Issues JWT Token & Auth User Object"]
    JWT --> Dash["Access Authenticated Dashboard"]

    %% Authenticated Flow
    CheckAuth -->|"Yes"| Dash

    Dash --> CheckProfile{"Does UserProfile Exist in MongoDB?"}
    CheckProfile -->|"No"| SetupProfile["Profile Setup View\n(Name, Degree, Target Role, Initial Skills)"]
    SetupProfile --> SaveProfile["POST /api/profiles/me (Save to MongoDB)"]
    SaveProfile --> DashOverview["Dashboard Overview Tab"]

    CheckProfile -->|"Yes"| DashOverview

    %% Main Navigation Paths
    DashOverview --> NavChoice{"Candidate Explores Tabs"}

    %% Path 1: Profile & Resume
    NavChoice -->|"Profile Settings"| EditProfile["Edit Profile & Skills Tab"]
    EditProfile --> UploadResume["Click 'Upload Resume with AI'"]
    UploadResume -->|"Upload PDF or Paste Text"| ParseAI["Gemini Flash Extracts Skills & Experience"]
    ParseAI --> ReviewSkills["Review & Edit Extracted Skill Chips"]
    ReviewSkills --> SaveProfile

    %% Path 2: Skill Gap Analysis
    NavChoice -->|"Skill Gap Analyzer"| GapTab["Skill Gap Analyzer Tab"]
    GapTab --> ViewGaps["View 75/25 Match % & Missing Core Skills"]
    ViewGaps --> RoleSim{"Explore Other Roles?"}
    RoleSim -->|"Yes"| SimModal["Select Role from Catalog\n(DevOps, AI, Backend, etc.)"]
    SimModal --> ViewGaps
    RoleSim -->|"Make Primary Target"| SaveTarget["Click 'Set as My Target Role'"]
    SaveTarget --> SaveProfile
    ViewGaps --> LaunchRoadmap["Click 'Generate AI Roadmap'"]

    %% Path 3: AI Roadmap
    NavChoice -->|"AI Roadmap"| RoadmapTab["AI Roadmap Tab"]
    LaunchRoadmap --> RoadmapTab
    RoadmapTab --> CheckRoadmap{"Roadmap Already Generated?"}
    CheckRoadmap -->|"No"| GenRoadmap["Click 'Generate Personalized Roadmap'"]
    GenRoadmap --> GeminiCall["Gemini Flash Synthesizes 12-Week Curriculum"]
    GeminiCall --> SaveRMap["Save to MongoDB (roadmaps collection)"]
    SaveRMap --> RenderRMap["Interactive 12-Week Roadmap\n(Phases, Projects, Interview Prep)"]
    CheckRoadmap -->|"Yes"| RenderRMap
    RenderRMap --> CheckTasks["Candidate Checks Off Action Items [x]"]
    CheckTasks --> PatchProgress["PATCH /api/ai/roadmap/action-item (MongoDB Update)"]

    %% Path 4: Custom Job Analysis
    NavChoice -->|"Analyze Custom Job"| CustomTab["Custom Job Tab"]
    CustomTab --> PasteJob["Paste Job Description from LinkedIn/Indeed"]
    PasteJob --> AnalyzeJob["Click 'Analyze Job Posting'"]
    AnalyzeJob --> GeminiExtract["Two-Tier Engine Extracts Skills & Computes Gap"]
    GeminiExtract --> CustomResult["View Match %, Core Gaps & Readiness Status"]
    CustomResult --> CustomActions{"Next Action"}
    CustomActions -->|"Adopt as Target"| SaveTarget
    CustomActions -->|"Build Curriculum"| LaunchRoadmap

    %% Path 5: Live Opportunities
    NavChoice -->|"Live Opportunities"| JobsTab["Live Opportunities Tab"]
    JobsTab --> FetchFeed["Real-Time Feed from Arbeitnow & Remotive APIs"]
    FetchFeed --> MatchCards["Render Cards with Candidate Match % & Skill Chips"]
    MatchCards --> FilterJobs["Filter by Keyword, Location, or 'Remote Only'"]
    FilterJobs --> MatchCards
    MatchCards --> JobActions{"Candidate Action"}
    JobActions -->|"Apply to Role"| DirectApply["Click '🚀 Apply Now'\n(Opens Employer Application Page)"]
    JobActions -->|"Deep AI Analysis"| TestAI["Click '⚡ Test with AI Analyzer'\n(Passes Job Text to Custom Analyzer Tab)"]
    TestAI --> CustomTab
    JobActions -->|"Save for Later"| Bookmark["Click '★ Save Job'"]
    Bookmark --> SaveBookmark["POST /api/jobs/save (Persist to userprofiles.savedJobs)"]
    SaveBookmark --> SavedView["Access from '⭐ Saved Bookmarks' Sub-Tab"]

    %% Logout
    DashOverview --> Logout["Click 'Log Out'"]
    Logout --> ClearStorage["Clear JWT & User from LocalStorage"]
    ClearStorage --> Landing
```

---

## 5. Security, State Management & Resiliency

| Dimension | Implementation Strategy | Security / Reliability Impact |
| :--- | :--- | :--- |
| **Authentication** | JSON Web Tokens (JWT) signed with secret key; 30-day expiration. | Stateless authentication; no server session storage required. |
| **Password Protection** | Bcrypt salted hashing with cost factor 10. | Resistance against rainbow tables and brute-force attacks. |
| **Route Protection** | Express middleware extracts Bearer token, verifies signature, injects `req.user`. | Unauthenticated clients are blocked from profile, roadmap, and bookmark APIs. |
| **Network Failover** | 10-minute in-memory cache + 6 curated benchmark partner jobs. | Guarantees live feed is never blank even during external API downtime or rate-limits. |
| **CORS & Payload Security** | Explicit CORS whitelist; Express JSON body parser capped at 15MB. | Prevents Cross-Origin Exploits and protects against Denial-of-Service buffer overloads. |
