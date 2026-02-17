# Florida Journeyman Electrician Exam Platform

Phase 1 monorepo for the Florida Journeyman Electrician Exam Platform.

## Tech Stack

- **Node.js**: 20 LTS
- **Package Manager**: pnpm workspaces
- **Framework**: Next.js 14 (App Router)
- **ORM**: Prisma
- **Database**: PostgreSQL 16
- **Language**: TypeScript (strict mode)

## Project Structure

```
root/
├── apps/web/              # Next.js 14 App Router
├── packages/db/           # Prisma ORM
├── docker-compose.yml     # PostgreSQL 16
├── pnpm-workspace.yaml
└── .env.example
```

## Getting Started

1. Install dependencies: `pnpm install`
2. Start database: `docker-compose up -d`
3. Copy env: `cp .env.example .env`
4. Push schema: `pnpm db:push`
5. Seed data: `pnpm db:seed`
6. Start dev: `pnpm dev`

## API Endpoints

### GET /api/exam/preview?questions=N

Preview exam question distribution based on blueprint weights.

## Blueprint Categories (10 seeded)

| Code | Category | Weight | Articles |
|------|----------|--------|----------|
| BC01 | Wiring Methods & Materials | 15% | 300-399 |
| BC02 | Wiring & Protection | 12% | 200-299 |
| BC03 | General Electrical Theory | 10% | 100 |
| BC04 | Equipment for General Use | 10% | 400-490 |
| BC05 | Plan Reading | 8% | N/A |
| BC06 | Communication Systems | 5% | 800-820 |
| BC07 | Motors & Controls | 15% | 430-440 |
| BC08 | Special Conditions | 8% | 700-799 |
| BC09 | Special Equipment | 10% | 600-695 |
| BC10 | Special Occupancies | 7% | 500-599 |
