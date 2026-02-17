# 📘 PROJECT GUIDE v2.0
## Florida Journeyman Electrician Exam Platform
### Claude Code Master Instruction Document

---

# 1️⃣ PROJECT IDENTITY

## Project Name
**Florida Journeyman Electrician Exam Platform**

## Primary Objective
Build a structured, data-driven, NEC 2020–based study and exam simulation engine for the Miami-Dade Journeyman Electrician License exam.

## What This Platform Must Achieve

### Core Capabilities
1. **Simulate realistic exam blueprint distributions** — The real Miami-Dade exam follows a specific distribution across 10 categories. This platform must replicate that distribution exactly, not generate random questions.

2. **Generate weighted questions** — Questions must be selected based on category weights, difficulty levels, and user performance history (in later phases).

3. **Track weak areas** — The system must identify which blueprint categories a user struggles with, enabling targeted study recommendations.

4. **Support open-book NEC navigation logic** — The real exam is open-book. Users should learn to find answers in the NEC, not memorize them. Every question must reference specific NEC articles/sections.

5. **Be scalable to future NEC editions** — The NEC updates every 3 years (2020, 2023, 2026). The architecture must support multiple editions without restructuring.

## Critical Identity Statement

> **This is NOT a simple quiz app.**
> **It is a controlled exam engine with NEC traceability.**

The distinction matters because:
- Quiz apps generate random questions
- This engine generates **structured, traceable, blueprint-compliant** exams
- Every answer must be verifiable against the NEC code
- No question exists without a valid NEC reference

---

# 2️⃣ ABSOLUTE ARCHITECTURE RULES

These rules are **non-negotiable**. Claude Code must follow these without deviation under any circumstance.

## Runtime Environment

| Component | Requirement | Reason |
|-----------|-------------|--------|
| **Node.js** | Node 20 LTS ONLY | Stability, long-term support, Prisma compatibility |
| **Forbidden** | Node 22, 23, 24 | Potential breaking changes, untested dependencies |

If any dependency requires Node 22+, that dependency must be replaced or the feature must wait.

## Package Manager

| Tool | Requirement |
|------|-------------|
| **Package Manager** | pnpm workspaces |
| **Forbidden** | npm, yarn, bun |

### Why pnpm?
- Faster installs via hard links
- Strict dependency resolution (prevents phantom dependencies)
- Native monorepo support via workspaces
- Disk space efficiency

## Repository Structure

```
root/
 ├── apps/
 │    └── web/                    # Next.js 14 Application
 │         ├── app/               # App Router pages
 │         ├── components/        # React components
 │         ├── lib/               # Utilities and helpers
 │         └── next.config.mjs    # Next.js configuration (NOT .ts)
 │
 ├── packages/
 │    └── db/                     # Database Package
 │         ├── prisma/
 │         │    ├── schema.prisma # Single source of truth for data model
 │         │    ├── migrations/   # Version-controlled migrations
 │         │    └── seed.ts       # Seed data for development
 │         ├── src/
 │         │    └── client.ts     # Prisma client export
 │         └── package.json
 │
 ├── docker-compose.yml           # SINGLE compose file (no duplicates)
 ├── pnpm-workspace.yaml          # Workspace configuration
 ├── .env                         # Environment variables (gitignored)
 ├── .env.example                 # Template for environment variables
 └── .github/
      └── workflows/
           └── ci.yml             # Continuous integration pipeline
```

### Structure Rules
1. **One docker-compose.yml** — Never create `docker-compose.dev.yml`, `docker-compose.prod.yml`, or any variant. All environments use the same file with environment variable overrides.

2. **One .env file at root** — Never duplicate DATABASE_URL or other connection strings across multiple files.

3. **Packages are isolated** — The `db` package exports only what `web` needs. No circular dependencies.

## Database Requirements

| Component | Specification |
|-----------|---------------|
| **Database** | PostgreSQL 16 |
| **Deployment** | Docker container |
| **ORM** | Prisma |
| **Connection** | Single DATABASE_URL in root .env |

### Critical Database Rules

1. **`necRef.section` MUST NEVER be null**
   - Always normalize to empty string `""`
   - This is required for composite key integrity
   - Validation must occur before any database write

2. **Composite keys cannot contain null**
   - PostgreSQL treats NULL ≠ NULL
   - This would break unique constraints
   - All composite key fields must have default values

3. **Always normalize before DB writes**
   - Input: `{ article: "310", section: null }`
   - Normalized: `{ article: "310", section: "" }`
   - This normalization must happen in the service layer, not the database

## Next.js Configuration

| Setting | Requirement | Reason |
|---------|-------------|--------|
| **Config file** | `next.config.mjs` | ES modules support, NOT `.ts` |
| **Router** | App Router | Modern patterns, server components |
| **TypeScript** | Strict mode enabled | Catch errors at compile time |
| **Experimental features** | NONE | Stability over bleeding edge |

---

# 3️⃣ DATABASE CORE DESIGN

These entities form the foundation of the exam engine. Each entity has a specific purpose and strict rules.

## Entity: `exam`

### Purpose
Represents a single exam simulation instance. When a user starts a practice exam, one `exam` record is created to track that session.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `createdAt` | DateTime | When the exam was started |
| `completedAt` | DateTime? | When the exam was finished (null if in progress) |
| `totalQuestions` | Int | Number of questions in this exam (e.g., 40, 50, 100) |
| `blueprintVersion` | String | Which blueprint version was used (e.g., "2024-MD-01") |
| `necEdition` | String | Which NEC edition (e.g., "2020", "2023") |
| `userId` | UUID? | Optional link to user (Phase 2+) |

### Business Rules
- An exam cannot be modified after `completedAt` is set
- `totalQuestions` must match the actual count of generated questions
- `blueprintVersion` determines the category distribution weights

---

## Entity: `blueprintCategory`

### Purpose
Defines the 10 official Miami-Dade Journeyman exam categories. These categories are mandated by the licensing authority and determine how questions are distributed.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `code` | String | Primary key: BC01 through BC10 |
| `name` | String | Official category name |
| `description` | String | Detailed description of what this category covers |
| `weight` | Decimal? | Percentage weight in exam (null = use default) |
| `necArticles` | String[] | Primary NEC articles related to this category |
| `isActive` | Boolean | Whether this category is currently in use |

### The 10 Official Categories

| Code | Name | Primary NEC Coverage |
|------|------|---------------------|
| **BC01** | Wiring Methods & Materials | Articles 300-399 |
| **BC02** | Wiring & Protection | Articles 200-299 |
| **BC03** | General Electrical Theory & Principles | Articles 100, Annex D |
| **BC04** | Equipment for General Use | Articles 400-490 |
| **BC05** | Plan Reading | Blueprints, specifications, schedules |
| **BC06** | Communication Systems | Articles 800-820 |
| **BC07** | Motors & Controls | Articles 430, 440 |
| **BC08** | Special Conditions | Articles 500-590 |
| **BC09** | Special Equipment | Articles 600-695 |
| **BC10** | Special Occupancies | Articles 500-590 |

### Business Rules
- Category codes are immutable (BC01 will always be BC01)
- Weights must sum to 100% when defined
- A category cannot be deleted if questions reference it

---

## Entity: `necRef`

### Purpose
Represents specific reference points in the National Electrical Code. This is the traceability layer that ensures every answer can be verified against the official code.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `article` | String | NEC article number (e.g., "310", "430") |
| `section` | String | Section within article (e.g., "16", "52(A)") — **DEFAULT ""** |
| `title` | String | Human-readable title of this reference |
| `edition` | String | NEC edition year (e.g., "2020") |
| `summary` | String? | Brief explanation of what this section covers |
| `createdAt` | DateTime | When this reference was added |

### Critical Rules

> **⚠️ `section` MUST NEVER be null**

This rule exists because:
1. The `(article, section)` pair forms a composite index
2. PostgreSQL treats `NULL ≠ NULL`, breaking uniqueness checks
3. Empty string `""` represents "article-level reference without specific section"

**Correct Examples:**
- `{ article: "310", section: "16" }` → Specific section
- `{ article: "310", section: "" }` → Article-level reference
- `{ article: "430", section: "52(A)(1)" }` → Subsection reference

**Incorrect (FORBIDDEN):**
- `{ article: "310", section: null }` ❌

### Indexes
```sql
CREATE INDEX idx_necref_article_section ON necRef(article, section);
CREATE INDEX idx_necref_edition ON necRef(edition);
```

---

## Entity: `questionTemplate`

### Purpose
This is NOT just a question. It is a blueprint-linked, NEC-backed question structure that serves as a template for generating exam questions.

### Why "Template"?
A single `questionTemplate` can generate multiple variations:
- Same concept, different values
- Same calculation, different given data
- Same rule, different application scenarios

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `categoryCode` | String | FK to blueprintCategory (BC01-BC10) |
| `prompt` | String | The question text |
| `options` | JSON? | Answer choices (for multiple choice) |
| `answer` | String | Correct answer |
| `explanation` | String | Why this is correct, with NEC reasoning |
| `difficulty` | Int | 1 (easy) to 5 (expert) |
| `questionType` | String | "multiple_choice", "calculation", "code_lookup" |
| `isActive` | Boolean | Whether this question is available for use |
| `status` | String | "draft", "validated", "reviewed", "retired" |
| `createdAt` | DateTime | When created |
| `updatedAt` | DateTime | Last modification |

### Question Types Explained

| Type | Description | Example |
|------|-------------|---------|
| `multiple_choice` | Standard 4-option question | "What is the minimum burial depth for UF cable?" |
| `calculation` | Requires math using NEC tables | "Calculate conductor ampacity for 3 #8 THWN in conduit" |
| `code_lookup` | Tests ability to find NEC reference | "Where in the NEC would you find requirements for swimming pools?" |

### Options JSON Structure
```json
{
  "A": "12 inches",
  "B": "18 inches", 
  "C": "24 inches",
  "D": "6 inches"
}
```

### Business Rules
- Every questionTemplate MUST have at least one necRef
- `explanation` MUST reference the specific NEC article/section
- Questions cannot be deleted, only set to `status: "retired"`
- Difficulty must be calibrated against actual exam difficulty

---

## Entity: `questionTemplateNecRef`

### Purpose
Junction table that links questions to their NEC references. A question can reference multiple NEC sections, and an NEC section can be referenced by multiple questions.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `questionId` | UUID | FK to questionTemplate |
| `necRefId` | UUID | FK to necRef |
| `isPrimary` | Boolean | Is this the main reference for the question? |
| `relevance` | String? | How this reference relates to the question |

### Primary Key
```sql
PRIMARY KEY (questionId, necRefId)
```

### Business Rules
- At least one relationship must have `isPrimary: true`
- No null values allowed in either foreign key
- Deleting a necRef requires updating all linked questions first

---

# 4️⃣ NEC VALIDATION RULES

Every question in this system must be traceable to the National Electrical Code. This section defines the validation process that ensures no question exists without proper NEC backing.

## Why This Matters

The real Journeyman exam is **open-book**. Candidates can use the NEC during the exam. The skill being tested is:
1. Knowing where to find information in the NEC
2. Interpreting the code correctly
3. Applying the code to scenarios

If our questions don't have valid NEC references, users learn incorrect information. This could lead to:
- Exam failure
- Unsafe electrical work
- Code violations in real installations

## Validation Process

When generating or storing a question, Claude (or any system process) must follow these steps:

### Step 1: Assign Blueprint Category
Determine which of the 10 categories (BC01-BC10) this question belongs to.

**Validation Check:**
- Is the category code valid (BC01-BC10)?
- Does the question content match the category description?

### Step 2: Identify NEC Article
Find the primary NEC article that governs this topic.

**Validation Check:**
- Is this a valid NEC 2020 article number?
- Is this article relevant to the blueprint category?

### Step 3: Identify NEC Section
Find the specific section within the article.

**Validation Check:**
- Does this section exist in the specified article?
- If no specific section applies, use empty string `""`
- NEVER use null

### Step 4: Check for Exceptions
The NEC often has exceptions to general rules. Questions must account for these.

**Validation Check:**
- Are there exceptions that affect the answer?
- Is the question clear about whether exceptions apply?
- Does the explanation mention relevant exceptions?

### Step 5: Attach necRef
Create or link to the appropriate necRef record.

**Validation Check:**
- Does a necRef with this article/section/edition exist?
- If not, create it with proper title and summary
- Link to questionTemplate via questionTemplateNecRef

### Step 6: Store Explanation
The explanation must clearly reference the NEC logic.

**Validation Check:**
- Does the explanation cite specific NEC references?
- Can a user find this information in their NEC book?
- Is the reasoning clear and educational?

### Step 7: Set Status
Track the validation state of each question.

| Status | Meaning |
|--------|---------|
| `draft` | Initial creation, not validated |
| `validated` | NEC reference confirmed accurate |
| `reviewed` | Expert electrician has reviewed |
| `retired` | No longer in use (outdated, error found) |

## The Golden Rule

> **No necRef = No valid question**

This rule is absolute. If a question cannot be linked to at least one NEC reference, it cannot exist in the system. This prevents:
- Hallucinated electrical information
- Answers that can't be verified
- Questions based on "common knowledge" that may be wrong
- Inconsistency with the actual code

---

# 5️⃣ BLUEPRINT WEIGHT ENGINE LOGIC

The Blueprint Weight Engine is the heart of the exam generation system. It ensures that generated exams match the distribution of the real Miami-Dade Journeyman exam.

## Why Weighted Distribution Matters

The real exam doesn't have equal questions from each category. Some topics are emphasized more than others. For example:
- Wiring Methods might have 15% of questions
- Communication Systems might have only 5%

If we generate random distributions, users practice the wrong proportions and are surprised on exam day.

## Distribution Algorithm

### Scenario 1: Weights Exist

When `blueprintCategory.weight` values are defined:

```
Input: User requests 50 questions
Weights: BC01=15%, BC02=12%, BC03=10%, ... (totaling 100%)

Calculation:
BC01: 50 × 0.15 = 7.5 → 8 questions
BC02: 50 × 0.12 = 6.0 → 6 questions
BC03: 50 × 0.10 = 5.0 → 5 questions
...
```

### Scenario 2: No Weights (Uniform Distribution)

When weights are not defined or null:

```
Input: User requests 50 questions
Categories: 10

Calculation:
Each category: 50 ÷ 10 = 5 questions
```

### Rounding Drift Prevention

**The Problem:**
Rounding 7.5 to 8 across multiple categories can result in more or fewer total questions than requested.

**The Solution:**
1. Calculate exact floating-point distribution
2. Round down all values
3. Calculate remainder (requested - sum of rounded)
4. Distribute remainder to categories with highest fractional parts

**Example:**
```
Requested: 50 questions
Initial: [7.5, 6.3, 5.1, 4.9, 4.8, 4.7, 4.6, 4.5, 4.4, 3.2]
Rounded down: [7, 6, 5, 4, 4, 4, 4, 4, 4, 3] = 45
Remainder: 50 - 45 = 5
Fractional parts: [0.5, 0.3, 0.1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.2]
Top 5: indices 3, 4, 5, 6, 0
Final: [8, 6, 5, 5, 5, 5, 5, 4, 4, 3] = 50 ✓
```

## Guarantees

The Blueprint Weight Engine MUST guarantee:

1. **Total Integrity** — Sum of distributed questions equals requested amount
2. **Category Coverage** — Every category with weight > 0 gets at least 1 question (if total allows)
3. **Proportional Accuracy** — Distribution matches weights within ±1 question per category
4. **Deterministic Results** — Same inputs produce same outputs (for testing)

---

# 6️⃣ DEVELOPMENT PHASES

This project follows a strict phased approach. Each phase builds on the previous one. Claude must respect phase boundaries and not implement features from future phases.

## Phase Philosophy

> **Each phase must be usable and testeable independently.**

This means:
- Phase 1 delivers value: users can practice exams
- Phase 2 adds memory: system remembers user history
- Phase 3 adds intelligence: system adapts to user
- Phase 4 adds polish: refined experience
- Phase 5 adds power features: advanced capabilities

---

## PHASE 1 — Foundation & Stabilization
**Status: CURRENT PHASE**

### Objective
Establish a working foundation where a user can take a basic exam with valid questions.

### Deliverables

| Task | Description | Acceptance Criteria |
|------|-------------|---------------------|
| **Seed Blueprint Categories** | Populate all 10 BC codes with accurate data | All 10 categories exist with names, descriptions |
| **Fix necRef Normalization** | Ensure no null values in section field | DB constraint passes, existing data cleaned |
| **CI Pipeline Green** | All builds pass, tests pass | GitHub Actions shows green |
| **Exam Preview Endpoint** | API returns valid exam structure | GET /api/exam/preview returns question distribution |
| **Basic Question Pool** | Minimum 100 validated questions | At least 10 per category, all with necRef |

### Database Schema (Phase 1)

```prisma
model BlueprintCategory {
  code        String   @id
  name        String
  description String
  weight      Decimal?
  isActive    Boolean  @default(true)
  
  questions   QuestionTemplate[]
}

model NecRef {
  id        String   @id @default(uuid())
  article   String
  section   String   @default("")
  title     String
  edition   String   @default("2020")
  createdAt DateTime @default(now())
  
  questions QuestionTemplateNecRef[]
  
  @@index([article, section])
}

model QuestionTemplate {
  id           String   @id @default(uuid())
  categoryCode String
  prompt       String
  options      Json?
  answer       String
  explanation  String
  difficulty   Int      @default(3)
  status       String   @default("draft")
  createdAt    DateTime @default(now())
  
  category     BlueprintCategory @relation(fields: [categoryCode], references: [code])
  necRefs      QuestionTemplateNecRef[]
}

model QuestionTemplateNecRef {
  questionId String
  necRefId   String
  isPrimary  Boolean @default(false)
  
  question   QuestionTemplate @relation(fields: [questionId], references: [id])
  necRef     NecRef           @relation(fields: [necRefId], references: [id])
  
  @@id([questionId, necRefId])
}

model Exam {
  id               String    @id @default(uuid())
  totalQuestions   Int
  blueprintVersion String
  createdAt        DateTime  @default(now())
  completedAt      DateTime?
}
```

### Restrictions
- ❌ No user authentication
- ❌ No question history tracking
- ❌ No adaptive features
- ❌ No analytics
- ❌ No difficulty adjustment

### Exit Criteria
Phase 1 is complete when:
1. All 10 blueprint categories are seeded
2. Minimum 100 questions exist with valid necRefs
3. Exam preview endpoint returns correct distribution
4. CI pipeline passes consistently
5. No null values exist in necRef.section

---

## PHASE 2 — User Identity & Question History
**Status: PLANNED**

### Objective
Track who is using the system and remember their question history to enable rotation and prevent repetition.

### Deliverables

| Task | Description | Acceptance Criteria |
|------|-------------|---------------------|
| **User Model** | Basic user identification | Users can be created and identified |
| **Question History** | Track every question shown to user | History records created on question display |
| **Basic Rotation** | Avoid recently shown questions | Questions not repeated within configurable window |
| **Cooldown System** | Correctly answered questions have cooldown | Questions answered correctly don't reappear for N sessions |

### New Database Schema (Phase 2 Additions)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String?  @unique
  createdAt DateTime @default(now())
  
  questionHistory UserQuestionHistory[]
  examSessions    ExamSession[]
}

model UserQuestionHistory {
  id              String   @id @default(uuid())
  userId          String
  questionId      String
  timesShown      Int      @default(1)
  timesCorrect    Int      @default(0)
  lastShownAt     DateTime @default(now())
  lastAnsweredAt  DateTime?
  lastCorrect     Boolean?
  nextEligibleAt  DateTime @default(now())  // Cooldown control
  
  user     User             @relation(fields: [userId], references: [id])
  question QuestionTemplate @relation(fields: [questionId], references: [id])
  
  @@unique([userId, questionId])
  @@index([userId, nextEligibleAt])
}

model ExamSession {
  id          String    @id @default(uuid())
  examId      String
  userId      String
  startedAt   DateTime  @default(now())
  completedAt DateTime?
  score       Int?
  
  user User @relation(fields: [userId], references: [id])
  exam Exam @relation(fields: [examId], references: [id])
}
```

### Rotation Logic

```typescript
// Pseudo-code for question selection
async function selectQuestion(userId: string, categoryCode: string) {
  // Get questions eligible for this user (cooldown expired)
  const eligible = await db.questionTemplate.findMany({
    where: {
      categoryCode,
      status: 'validated',
      OR: [
        // Never shown to this user
        { history: { none: { userId } } },
        // Cooldown has expired
        { history: { some: { userId, nextEligibleAt: { lte: now() } } } }
      ]
    },
    orderBy: [
      // Prioritize never-shown questions
      { history: { _count: 'asc' } },
      // Then by least recently shown
      { history: { lastShownAt: 'asc' } }
    ]
  });
  
  return eligible[0];
}
```

### Cooldown Rules

| Outcome | Cooldown Duration |
|---------|-------------------|
| Answered correctly | 5 sessions or 7 days |
| Answered incorrectly | 1 session or 1 day |
| Skipped | 0 (can appear immediately) |

### Exit Criteria
Phase 2 is complete when:
1. Users can be identified (even anonymously via session)
2. Question history is tracked accurately
3. Questions don't repeat within the same exam
4. Cooldown system prevents rapid re-exposure of mastered questions

---

## PHASE 3 — Intelligent Learning & Spaced Repetition
**Status: PLANNED**

### Objective
Make the system intelligent. Questions should appear based on user performance patterns, not just recency.

### Deliverables

| Task | Description | Acceptance Criteria |
|------|-------------|---------------------|
| **Spaced Repetition Engine** | Implement SM-2 algorithm variant | Intervals calculated correctly |
| **Difficulty Adaptation** | Adjust question difficulty based on performance | Difficulty shifts within ±1 based on streak |
| **Weak Area Detection** | Identify struggling categories | Algorithm identifies bottom 3 categories |
| **Performance Analytics** | Calculate scores per category | Accurate percentage calculations |

### Spaced Repetition Implementation

The system uses a simplified SM-2 algorithm:

```typescript
interface RepetitionData {
  easeFactor: number;      // 1.3 to 2.5, starts at 2.5
  interval: number;        // Days until next review
  repetitions: number;     // Consecutive correct answers
}

function calculateNextReview(
  current: RepetitionData,
  quality: number  // 0-5 rating of answer quality
): RepetitionData {
  let { easeFactor, interval, repetitions } = current;
  
  if (quality < 3) {
    // Incorrect answer - reset
    repetitions = 0;
    interval = 1;
  } else {
    // Correct answer
    repetitions += 1;
    
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 3;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }
  
  // Update ease factor
  easeFactor = Math.max(1.3, 
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  
  return { easeFactor, interval, repetitions };
}
```

### New Schema (Phase 3 Additions)

```prisma
model UserQuestionHistory {
  // ... existing fields ...
  
  // Spaced repetition fields
  easeFactor   Float    @default(2.5)
  interval     Int      @default(0)     // Days
  repetitions  Int      @default(0)     // Consecutive correct
  nextReviewAt DateTime @default(now())
  
  // Performance tracking
  averageTimeMs    Int?    // Average time to answer
  confidenceScore  Float?  // User's self-rated confidence (future)
}

model UserCategoryPerformance {
  id           String @id @default(uuid())
  userId       String
  categoryCode String
  
  totalAttempts    Int   @default(0)
  correctAttempts  Int   @default(0)
  currentStreak    Int   @default(0)
  bestStreak       Int   @default(0)
  averageDifficulty Float @default(3.0)
  
  user     User              @relation(fields: [userId], references: [id])
  category BlueprintCategory @relation(fields: [categoryCode], references: [code])
  
  @@unique([userId, categoryCode])
}
```

### Difficulty Adaptation Logic

```typescript
function getTargetDifficulty(userId: string, categoryCode: string): number {
  const performance = await getUserCategoryPerformance(userId, categoryCode);
  const baseTarget = 3; // Medium
  
  if (performance.currentStreak >= 3) {
    // User is doing well - increase difficulty
    return Math.min(5, performance.averageDifficulty + 1);
  } else if (performance.correctRate < 0.5) {
    // User is struggling - decrease difficulty
    return Math.max(1, performance.averageDifficulty - 1);
  }
  
  return performance.averageDifficulty;
}
```

### Exit Criteria
Phase 3 is complete when:
1. Spaced repetition intervals are calculated and stored
2. Questions resurface at calculated intervals
3. Difficulty adapts based on performance streaks
4. Weak categories are identified per user
5. Per-category performance metrics are accurate

---

## PHASE 4 — Practice Modes & UI Polish
**Status: PLANNED**

### Objective
Deliver a polished user experience with multiple ways to practice.

### Deliverables

| Task | Description | Acceptance Criteria |
|------|-------------|---------------------|
| **Exam Simulation Mode** | Full timed exam replicating real test | Timer works, distribution matches, results shown |
| **Category Practice Mode** | Drill specific categories | User can select 1+ categories |
| **Review Mode** | Study incorrect answers | Shows explanation, NEC reference |
| **NEC Hunt Mode** | Given article, find answer | Trains open-book skills |
| **Dashboard** | Performance overview | Charts, weak areas, progress |

### Practice Modes Detailed

#### Mode 1: Exam Simulation
Replicates the real Miami-Dade exam as closely as possible.

| Feature | Specification |
|---------|---------------|
| Question Count | Configurable (50, 75, 100) |
| Time Limit | 4 hours (real exam timing) |
| Distribution | Matches official blueprint weights |
| Navigation | Can skip and return to questions |
| Results | Score by category, pass/fail indication |

#### Mode 2: Category Practice
Focused drill on specific areas, ideal for targeting weak spots.

| Feature | Specification |
|---------|---------------|
| Category Selection | Single or multiple categories |
| Question Count | User-defined (10, 25, 50) |
| No Time Limit | Untimed practice |
| Immediate Feedback | See correct answer after each question |
| Continue Until | User stops or questions exhausted |

#### Mode 3: Review Mode
Study previously answered questions, especially incorrect ones.

| Feature | Specification |
|---------|---------------|
| Filter Options | All, Incorrect Only, Flagged |
| Sort Options | By date, by category, by difficulty |
| Show | Question, user's answer, correct answer, explanation |
| NEC Link | Direct reference to code section |
| Re-attempt | Try question again |

#### Mode 4: NEC Hunt Mode
Unique mode that trains the open-book skill.

| Feature | Specification |
|---------|---------------|
| Format | "Find in NEC: Article 310.16" |
| Question | "What is the ampacity of #6 THWN-2 at 75°C?" |
| Skill Trained | Navigating the code book quickly |
| Feedback | Shows table/section where answer is found |

### UI Components Required

```
/app
  /exam
    /[examId]
      /page.tsx          # Active exam view
      /results/page.tsx  # Exam results
  /practice
    /category/page.tsx   # Category selection
    /review/page.tsx     # Review mode
    /nec-hunt/page.tsx   # NEC Hunt mode
  /dashboard
    /page.tsx            # Performance dashboard
```

### Exit Criteria
Phase 4 is complete when:
1. All 4 practice modes are functional
2. Exam simulation has working timer
3. Dashboard shows accurate analytics
4. Review mode displays all historical attempts
5. Mobile-responsive design implemented

---

## PHASE 5 — Question Variants & Advanced Features
**Status: PLANNED**

### Objective
Add sophisticated features that increase question variety and user engagement.

### Deliverables

| Task | Description | Acceptance Criteria |
|------|-------------|---------------------|
| **Question Variants** | Same concept, different values | Variants generate correctly |
| **Gamification** | Streaks, achievements, progress | Visual indicators work |
| **Exam Predictor** | Estimate pass probability | Algorithm is calibrated |
| **Weak Area Focus** | Auto-generate practice sets | Targets lowest-performing categories |

### Question Variants System

A variant allows the same question template to generate different instances:

```prisma
model QuestionTemplate {
  // ... existing fields ...
  
  hasVariants  Boolean @default(false)
  variantData  Json?   // Template for variant generation
  
  variants QuestionVariant[]
}

model QuestionVariant {
  id               String @id @default(uuid())
  baseQuestionId   String
  variantValues    Json   // Specific values for this variant
  generatedPrompt  String // Fully rendered question text
  generatedOptions Json   // Fully rendered options
  generatedAnswer  String // Correct answer for this variant
  
  baseQuestion QuestionTemplate @relation(fields: [baseQuestionId], references: [id])
}
```

### Variant Example

**Base Question:**
```json
{
  "prompt": "What is the minimum burial depth for UF cable under a driveway?",
  "variantData": {
    "template": "What is the minimum burial depth for {{cable_type}} cable under {{location}}?",
    "variables": {
      "cable_type": ["UF", "USE", "Direct Burial"],
      "location": ["a driveway", "a lawn", "a concrete slab"]
    },
    "answerMatrix": {
      "UF+driveway": "24 inches",
      "UF+lawn": "12 inches",
      // ... etc
    }
  }
}
```

### Gamification Elements

| Element | Description | Implementation |
|---------|-------------|----------------|
| **Daily Streak** | Consecutive days practiced | Counter + calendar heatmap |
| **Category Mastery** | % mastered per category | Progress bars |
| **Achievement Badges** | Milestones reached | Unlockable icons |
| **Leaderboard** | Optional competitive element | Weekly rankings |

### Exam Pass Predictor

Uses historical performance to estimate probability of passing:

```typescript
function predictPassProbability(userId: string): number {
  const categoryPerformances = await getAllCategoryPerformances(userId);
  const weights = await getBlueprintWeights();
  
  let weightedScore = 0;
  
  for (const perf of categoryPerformances) {
    const weight = weights[perf.categoryCode];
    const correctRate = perf.correctAttempts / perf.totalAttempts;
    weightedScore += correctRate * weight;
  }
  
  // Factor in difficulty adjustment
  const difficultyFactor = getDifficultyAdjustment(categoryPerformances);
  
  // Factor in sample size confidence
  const confidenceFactor = getConfidenceFactor(categoryPerformances);
  
  return Math.min(0.99, weightedScore * difficultyFactor * confidenceFactor);
}
```

### Exit Criteria
Phase 5 is complete when:
1. Question variants generate correctly
2. User sees different numbers/scenarios on repeated questions
3. Streak tracking is accurate
4. Pass predictor shows reasonable estimates
5. Weak area practice sets generate correctly

---

## PHASE 6 — Multi-Edition & Scalability
**Status: FUTURE**

### Objective
Support multiple NEC editions and potentially multiple jurisdictions.

### Deliverables

| Task | Description |
|------|-------------|
| **NEC 2023 Support** | Add 2023 code references |
| **Edition Switching** | User can select which NEC to study |
| **Question Mapping** | Map 2020 questions to 2023 equivalents |
| **Jurisdiction Expansion** | Support other Florida counties |

### Schema Changes

```prisma
model NecEdition {
  code        String   @id  // "2020", "2023"
  name        String
  effectiveDate DateTime
  isActive    Boolean
  
  necRefs NecRef[]
}

model Jurisdiction {
  code        String @id  // "MD" for Miami-Dade
  name        String
  state       String
  necEdition  String  // Which NEC edition this jurisdiction uses
  
  blueprints JurisdictionBlueprint[]
}
```

### Exit Criteria
Phase 6 is complete when:
1. NEC 2023 references are loaded
2. Users can switch between 2020 and 2023
3. Questions show appropriate references for selected edition
4. At least one additional jurisdiction is supported

---

# 7️⃣ CI REQUIREMENTS

Continuous Integration ensures code quality before merging. These requirements are mandatory.

## Pipeline Configuration

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'  # MUST BE 20
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Generate Prisma Client
        run: pnpm --filter db db:generate
        
      - name: Type Check
        run: pnpm --filter web type-check
        
      - name: Build
        run: pnpm --filter web build
        
      - name: Lint
        run: pnpm --filter web lint
```

## Mandatory Checks

| Check | Requirement | Blocking |
|-------|-------------|----------|
| **Node Version** | Must be 20.x | Yes |
| **pnpm Install** | No missing dependencies | Yes |
| **Prisma Generate** | Client generates without errors | Yes |
| **Type Check** | Zero TypeScript errors | Yes |
| **Build** | Production build succeeds | Yes |
| **Lint** | No linting errors | Yes |

## Rules

1. **CI must be green before merge** — No exceptions
2. **Failed CI = No deploy** — Block all deployments
3. **Fix CI immediately** — Broken CI is highest priority
4. **No skipping checks** — Never use `[skip ci]` on main

---

# 8️⃣ STRICT DEVELOPMENT RULES

These rules govern how Claude Code operates within this project.

## Branch Strategy

| Rule | Description |
|------|-------------|
| **One feature = One branch** | Never combine unrelated changes |
| **Branch naming** | `feature/xxx`, `fix/xxx`, `chore/xxx` |
| **Fixes update same PR** | Don't create new PRs for PR fixes |
| **Rebase over merge** | Keep history clean |

## Code Changes

| Rule | Description |
|------|-------------|
| **Minimal changes** | Don't refactor unrelated code |
| **No new dependencies** | Without explicit approval |
| **No architecture changes** | Without explicit discussion |
| **Comment complex logic** | But don't over-comment obvious code |

## Database Rules

| Rule | Description |
|------|-------------|
| **Never allow null in necRef.section** | Normalize to "" |
| **Test migrations locally** | Before pushing |
| **Backup before destructive migrations** | Always |
| **One migration per feature** | Don't split or combine |

## File Rules

| Rule | Description |
|------|-------------|
| **Single docker-compose.yml** | Never create variants |
| **Single .env at root** | Never duplicate |
| **Never duplicate DATABASE_URL** | Causes connection issues |
| **Respect .gitignore** | Never commit secrets |

## When to STOP

Claude must immediately stop and report conflict if any change would:

1. Require Node version > 20
2. Introduce null values to necRef.section
3. Create additional docker-compose files
4. Require a different package manager
5. Break the monorepo structure
6. Require changing the ORM

Report format:
```
⚠️ CONFLICT DETECTED

Change requested: [what was asked]
Conflicts with: [which rule]
Reason: [why it conflicts]
Recommendation: [alternative approach]
```

---

# 9️⃣ STRATEGIC LONG TERM VISION

This section describes where this platform is heading. These are not immediate requirements but guide architectural decisions.

## Future Capabilities

### Multiple NEC Editions
- Support NEC 2020, 2023, 2026 simultaneously
- Map questions across editions
- Track code changes between editions
- Show "what changed" for updated sections

### Multiple Jurisdictions
- Miami-Dade (current)
- Broward County
- Palm Beach County
- Other Florida counties
- Eventually other states

### Adaptive Intelligence
- Predict exam pass probability
- Recommend optimal study paths
- Identify knowledge gaps
- Adjust to learning speed

### Content Generation
- AI-assisted question creation (with human validation)
- Automatic variant generation
- NEC change detection

### Enterprise Features
- Contractor training programs
- Bulk user management
- Custom exam configurations
- Compliance tracking

## Guiding Principle

> **This is an engine, not a static quiz.**

Every architectural decision should support:
1. Data-driven operation
2. Traceable answers
3. Scalable content
4. Measurable outcomes

---

# 🔟 CLAUDE EXECUTION INSTRUCTIONS

When operating in this project, Claude must follow these directives.

## Primary Directives

1. **Use this document as canonical reference** — This PROJECT GUIDE is the single source of truth

2. **Never override defined architecture** — Node 20, pnpm, Prisma, PostgreSQL are fixed

3. **Never introduce alternative stack** — No switching ORMs, databases, or frameworks

4. **Database integrity first** — Before any change, verify it won't corrupt data

5. **Prefer stability over speed** — A slow correct implementation beats a fast broken one

## Decision Making

When faced with implementation choices:

```
Priority Order:
1. Database integrity
2. CI stability  
3. Simplicity
4. Performance
5. Feature completeness
```

## Communication Style

- Report blockers immediately
- Explain structural changes before implementing
- Confirm understanding before large changes
- Provide alternatives when saying "no"

## Error Handling

If something fails:

1. Report exact error message
2. Identify root cause
3. Propose solution
4. Wait for confirmation before fixing

Never attempt creative workarounds that might compromise architecture.

---

# 🧠 IMPORTANT FINAL DIRECTIVE

## Hard Stops

If any change conflicts with these fundamentals, Claude must STOP and report instead of improvising:

| Fundamental | Non-Negotiable |
|-------------|----------------|
| **Runtime** | Node 20 LTS only |
| **Data Integrity** | necRef.section = "" (never null) |
| **Infrastructure** | Single docker-compose.yml |
| **Monorepo** | pnpm workspace structure |
| **ORM** | Prisma only |
| **Database** | PostgreSQL 16 |

## When Conflicted

```
❌ NEVER improvise a workaround
❌ NEVER proceed hoping it works
❌ NEVER assume approval

✅ ALWAYS stop
✅ ALWAYS report conflict
✅ ALWAYS wait for direction
```

---

# 📎 APPENDIX A: Quick Reference

## Blueprint Categories

| Code | Name | % Weight (Estimated) |
|------|------|---------------------|
| BC01 | Wiring Methods & Materials | 15% |
| BC02 | Wiring & Protection | 12% |
| BC03 | General Electrical Theory | 10% |
| BC04 | Equipment for General Use | 10% |
| BC05 | Plan Reading | 8% |
| BC06 | Communication Systems | 5% |
| BC07 | Motors & Controls | 15% |
| BC08 | Special Conditions | 8% |
| BC09 | Special Equipment | 10% |
| BC10 | Special Occupancies | 7% |

## NEC 2020 Article Ranges

| Article Range | Topic |
|---------------|-------|
| 100 | Definitions |
| 200-299 | Wiring & Protection |
| 300-399 | Wiring Methods |
| 400-499 | Equipment |
| 500-599 | Special Occupancies |
| 600-699 | Special Equipment |
| 700-799 | Special Conditions |
| 800-899 | Communications |

## Key Commands

```bash
# Start development
pnpm install
docker-compose up -d
pnpm --filter db db:push
pnpm --filter web dev

# Database operations
pnpm --filter db db:generate  # Generate Prisma client
pnpm --filter db db:push      # Push schema to DB
pnpm --filter db db:seed      # Seed data
pnpm --filter db db:studio    # Open Prisma Studio

# Build
pnpm --filter web build

# Test
pnpm --filter web test
```

---

# 📎 APPENDIX B: Phase Checklist

## Phase 1 Checklist
- [ ] PostgreSQL 16 running in Docker
- [ ] Prisma schema defined with all core entities
- [ ] All 10 blueprint categories seeded
- [ ] necRef.section normalized (no nulls)
- [ ] Minimum 100 questions with necRefs
- [ ] Exam preview endpoint functional
- [ ] CI pipeline green
- [ ] Basic exam generation working

## Phase 2 Checklist
- [ ] User model implemented
- [ ] UserQuestionHistory tracking
- [ ] Question rotation (no immediate repeats)
- [ ] Cooldown system for mastered questions
- [ ] ExamSession tracking

## Phase 3 Checklist
- [ ] Spaced repetition algorithm
- [ ] Difficulty adaptation
- [ ] UserCategoryPerformance tracking
- [ ] Weak area detection
- [ ] Performance analytics API

## Phase 4 Checklist
- [ ] Exam Simulation mode
- [ ] Category Practice mode
- [ ] Review mode
- [ ] NEC Hunt mode
- [ ] Dashboard UI
- [ ] Mobile responsive

## Phase 5 Checklist
- [ ] Question variant generation
- [ ] Streak tracking
- [ ] Achievement system
- [ ] Pass probability predictor
- [ ] Weak area auto-practice

## Phase 6 Checklist
- [ ] NEC 2023 data loaded
- [ ] Edition switching UI
- [ ] Question edition mapping
- [ ] Additional jurisdiction support

---

*Document Version: 2.0*
*Last Updated: 2025*
*Maintainer: Claude Code Assistant*
