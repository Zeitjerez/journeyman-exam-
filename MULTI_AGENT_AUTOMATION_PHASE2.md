# 🤖 MULTI-AGENT AUTOMATION PROTOCOL
## Florida Journeyman Electrician Exam Platform — Complementary Instruction

**Document Type:** Complementary System Instruction  
**Applies From:** Phase 2 (Question Engine) onward  
**Parent Documents:** PROJECT_BOOTSTRAP + CLAUDE CODE SYSTEM INSTRUCTION  
**Activation Condition:** Phase 1 must be 100% complete (CI green, schema stable, seeds validated)

---

## 1️⃣ PURPOSE

Define the autonomous collaboration protocol between **Claude Code** (primary agent) and **Codex** (secondary agent) via MCP server, optimizing token usage while guaranteeing **100% verifiable NEC 2020 content** for realistic Miami-Dade Journeyman exam simulation.

**Core Principle:**  
Every question, answer, and explanation must be traceable to a real NEC 2020 article/section.  
No generated content enters the system without NEC validation.  
The exam experience must mirror the real test as closely as possible.

---

## 2️⃣ AGENT ROLES — STRICT BOUNDARIES

### Claude Code (Primary Agent — Architect + Validator)

**Owns:**
- Schema integrity and migrations
- NEC validation logic (final authority)
- Blueprint engine logic
- CI/CD pipeline
- Architecture decisions
- Content review and approval gate
- MCP server orchestration

**Never delegates:**
- Database schema changes
- NEC reference validation
- Blueprint weight distribution logic
- Exam generation engine core
- Any decision that affects data integrity

### Codex (Secondary Agent — Generator + Worker)

**Executes:**
- Bulk questionTemplate generation from NEC specs
- Unit test scaffolding from specs defined by Claude Code
- Seed data files (questions, NEC refs, categories)
- UI component boilerplate (Phase 4)
- Repetitive code patterns

**Never does:**
- Schema modifications
- Architecture decisions
- NEC validation (only Claude Code validates)
- Direct database writes without Claude Code review
- Deviation from constraints in AGENTS.md

---

## 3️⃣ MCP SERVER SPECIFICATION

### Architecture

```
Claude Code (terminal)
    │
    └── MCP Server (local, Node.js)
            │
            ├── Tool: generate_questions
            ├── Tool: generate_tests
            ├── Tool: generate_seed_data
            └── Tool: generate_ui_component
                    │
                    └── Codex API (wrapped, invisible to user)
```

### MCP Tools Definition

#### `generate_questions`
```
Input:
  - categoryCode: BCxx
  - necArticles: [string]  (mandatory — real NEC articles only)
  - count: number
  - difficultyRange: [min, max]
  - format: "prisma_seed" | "json"

Output:
  - Array of questionTemplate objects
  - Each MUST include: prompt, options, answer, explanation, necRef(article, section)

Constraint:
  - Codex prompt MUST include NEC article text/reference
  - Output MUST be validated by Claude Code before DB insert
```

#### `generate_tests`
```
Input:
  - targetFile: string (path to file being tested)
  - testType: "unit" | "integration"
  - spec: string (what to test, defined by Claude Code)

Output:
  - Test file content (vitest/jest compatible)
```

#### `generate_seed_data`
```
Input:
  - entity: "necRef" | "questionTemplate" | "blueprintCategory"
  - count: number
  - constraints: object (NEC articles, sections, categories)

Output:
  - Prisma-compatible seed data
```

#### `generate_ui_component`
```
Input:
  - componentName: string
  - spec: string (props, behavior, styling rules)
  - framework: "nextjs_app_router"

Output:
  - TSX component file
```

---

## 4️⃣ CONTENT VERACITY PROTOCOL — ZERO HALLUCINATION

This is the most critical section of this document.

### The Problem
LLMs can fabricate NEC references that don't exist. A fake NEC citation in an exam question destroys platform credibility and teaches wrong information to electricians preparing for licensure.

### The Solution: Three-Layer Verification

```
Layer 1: SOURCE CONSTRAINT (at generation)
  → Codex receives ONLY real NEC 2020 article numbers + titles
  → Prompt explicitly states: "Do NOT invent articles or sections"
  → Each question prompt includes the actual NEC text being referenced

Layer 2: STRUCTURAL VALIDATION (at ingestion)
  → Claude Code checks every generated question:
     ✓ necRef.article exists in master NEC reference table
     ✓ necRef.section is valid ("" or real section number)
     ✓ answer aligns with NEC logic
     ✓ explanation references correct article
     ✓ No null values in composite keys

Layer 3: CROSS-REFERENCE AUDIT (periodic)
  → Batch validation script compares all questionTemplate necRefs
    against the canonical NEC 2020 reference list
  → Flags orphaned or suspicious references
  → Generates audit report
```

### NEC Reference Master List

The system MUST maintain a canonical `necRef` table seeded from real NEC 2020 content:

```
Required coverage (minimum):
  - Article 90: Introduction
  - Articles 100-199: General (definitions, requirements)
  - Articles 200-299: Wiring and Protection
  - Articles 300-399: Wiring Methods and Materials
  - Articles 400-499: Equipment for General Use
  - Articles 500-599: Special Occupancies
  - Articles 600-699: Special Equipment
  - Articles 700-799: Special Conditions
  - Articles 800-899: Communication Systems
  - Chapter 9: Tables
  - Annex D: Examples
```

### Question Quality Standards

Every question entering the system MUST meet:

| Criterion | Requirement | Validator |
|---|---|---|
| NEC Reference | Real article + section | Claude Code |
| Answer Accuracy | Matches NEC 2020 code | Claude Code |
| Explanation | Cites specific NEC logic | Claude Code |
| Difficulty Rating | 1-5, appropriate to content | Claude Code |
| Blueprint Category | Correct BCxx assignment | Claude Code |
| Distractor Quality | Wrong options are plausible but clearly wrong per NEC | Claude Code |
| Exam Realism | Mirrors real Miami-Dade question style | Manual review (Phase 4) |

### Content Status Pipeline

```
draft → validated → reviewed → active

draft:      Generated by Codex, not yet checked
validated:  Passed Claude Code structural validation
reviewed:   Manually verified against NEC (future phase)
active:     Approved for exam generation
```

No question with status < `validated` can appear in any exam instance.

---

## 5️⃣ EXAM REALISM REQUIREMENTS

### What Makes It Realistic

The Miami-Dade Journeyman exam is:
- **Open-book** (NEC allowed during test)
- **90 questions** (standard)
- **Timed** (4-4.5 hours)
- **Blueprint-distributed** (10 categories, weighted)
- **Multiple choice** (4 options)

### Platform Must Replicate

| Real Exam Feature | Platform Implementation |
|---|---|
| 10 blueprint categories | blueprintCategory BC01-BC10 with accurate weights |
| Open-book format | Questions require NEC navigation, not memorization |
| Realistic distractors | Wrong answers must be common misconceptions or adjacent NEC errors |
| Time pressure | Timer per exam instance (Phase 4 UI) |
| Question difficulty mix | Distribution across difficulty 1-5 per category |
| Code calculation questions | Include questions requiring NEC table lookups (Chapter 9) |
| Exception-based questions | Questions that test NEC exceptions (e.g., Article 210.12 exceptions) |

### Question Type Distribution (Target)

```
Direct code reference:     30%  ("According to NEC Article X...")
Calculation-based:         25%  ("What is the minimum conductor size for...")
Exception/condition:       20%  ("Which of the following is an exception to...")
Application/scenario:      15%  ("A commercial building requires... What applies?")
Definition/terminology:    10%  ("As defined in Article 100...")
```

---

## 6️⃣ AUTOMATION WORKFLOW — PHASE BY PHASE

### Phase 2: Question Engine (MCP Activation)

```
Step 1: Claude Code builds MCP server with 4 tools
Step 2: Claude Code seeds master NEC reference table
Step 3: For each blueprint category (BC01-BC10):
   a. Claude Code defines NEC articles applicable to category
   b. Claude Code calls generate_questions via MCP
   c. Codex generates batch (10-20 questions per call)
   d. Claude Code validates each question (Layer 2)
   e. Valid questions → status: validated → DB insert
   f. Invalid questions → logged + discarded
Step 4: Claude Code calls generate_tests for question engine
Step 5: CI validates everything
```

**Target:** 500+ validated questions across all 10 categories.

### Phase 3: Analytics

```
- Claude Code builds analytics layer (no delegation)
- Codex generates test fixtures for analytics via MCP
- Performance tracking per category per user
```

### Phase 4: UI

```
- Claude Code defines component specs
- Codex generates UI boilerplate via MCP
- Claude Code integrates with exam engine
- Manual review of exam experience realism
```

---

## 7️⃣ TOKEN OPTIMIZATION STRATEGY

### Why This Saves Tokens

| Task | Claude Code Solo | With Codex via MCP |
|---|---|---|
| Generate 50 questions | ~4,000 tokens | ~800 tokens (orchestration only) |
| Write 10 test files | ~6,000 tokens | ~1,200 tokens |
| Seed data for 100 necRefs | ~3,000 tokens | ~500 tokens |
| UI boilerplate (5 components) | ~5,000 tokens | ~1,000 tokens |

**Estimated Phase 2 savings:** 60-70% token reduction on delegable tasks.

### Rules for Token Efficiency

1. Claude Code NEVER generates bulk content directly if MCP tool exists for it
2. Codex prompts are pre-built templates (no token waste on prompt engineering per call)
3. Validation is structural (fast, low-token) not generative
4. Failed validations return error codes, not explanations

---

## 8️⃣ REPO CONFIGURATION FOR DUAL-AGENT

### Files to Add

```
root/
  ├── AGENTS.md                    ← Constraints file Codex reads
  ├── .mcp/
  │    └── codex-server/
  │         ├── index.ts           ← MCP server
  │         ├── tools/
  │         │    ├── generateQuestions.ts
  │         │    ├── generateTests.ts
  │         │    ├── generateSeedData.ts
  │         │    └── generateUIComponent.ts
  │         └── templates/
  │              ├── question-prompt.txt
  │              └── test-prompt.txt
  └── scripts/
       └── nec-audit.ts            ← Cross-reference audit script
```

### AGENTS.md (For Codex Context)

Must contain:
- All architecture constraints from bootstrap
- necRef.section normalization rule
- Blueprint category list (BC01-BC10)
- Question format specification
- NEC reference format specification
- Prohibited actions list

---

## 9️⃣ FAILURE PROTOCOL — MULTI-AGENT SPECIFIC

| Failure | Action |
|---|---|
| MCP server down | Claude Code works solo (fallback) |
| Codex generates invalid NEC ref | Discard question, log error, continue batch |
| Codex output fails validation > 50% | Stop batch, review prompt template |
| Codex unavailable | Claude Code generates content directly (higher token cost accepted) |
| Schema conflict from generated content | Stop, Claude Code investigates, never force insert |

---

## 🔟 ACTIVATION CHECKLIST

Before enabling this protocol, ALL must be true:

- [ ] Phase 1 complete (CI green, schema stable)
- [ ] Master NEC reference table seeded with real articles
- [ ] MCP server built and tested
- [ ] AGENTS.md committed to repo
- [ ] Codex API access configured
- [ ] At least one successful end-to-end test:
      Codex generates → Claude Code validates → DB insert → CI passes

---

## 📌 GOVERNING PRINCIPLE

**Content accuracy is non-negotiable.**

A wrong NEC reference is worse than no question at all.  
The platform trains electricians for a real licensing exam.  
Incorrect information has real-world safety consequences.

**Priority order for this protocol:**

```
1. NEC content veracity
2. Database integrity
3. Token efficiency
4. Speed of generation
5. Volume of content
```

Never sacrifice accuracy for volume.
