# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build
npm run lint     # ESLint (flat config, v9)
```

No test runner is configured yet.

## Versions to be aware of

- **Next.js 16.2.4** with **React 19.2.4** — potentially breaking vs your training data. Read `node_modules/next/dist/docs/` before writing any Next.js-specific code.
- **Tailwind CSS v4** — PostCSS-based, CSS-first config (no `tailwind.config.*`). Import via `@import "tailwindcss"` in CSS, not via `@tailwind` directives.
- **ESLint v9** — flat config format (`eslint.config.mjs`), not `.eslintrc`.

## Path alias

`@/*` resolves to the repo root (e.g. `@/app/...`, `@/lib/...`).

## App architecture (planned — nothing implemented yet)

This is a two-person household account book. The requirements live in `docs/requirements.md`. Planned stack:

| Layer | Choice |
|---|---|
| Framework | Next.js App Router |
| Auth | NextAuth.js (Google OAuth, invite-based couple linking) |
| DB/Storage | Supabase (PostgreSQL + Storage for receipt images) |
| ORM | Prisma |
| OCR / AI | Claude API Vision (receipt parsing + category inference) |
| UI | shadcn/ui + Tailwind v4 |
| Deploy | Vercel |

### Data model (from requirements)

```
User       — id, email, name, coupleId
Couple     — id, monthlyBudget
Receipt    — id, coupleId, uploadedBy, imageUrl, storeName, date, totalAmount, createdAt
ReceiptItem— id, receiptId, name, amount, category
Category   — FOOD | DAILY | UTILITY | RENT | SAVING | OTHER
Reimbursement — id, receiptId, requestedBy, amount, isPaid, paidAt
Notification  — id, userId, type, message, isRead, createdAt
```

### Core flows

- **Receipt OCR**: image upload → Claude Vision extracts store name, date, items + amounts → user can reassign categories per item → saved as `Receipt` + `ReceiptItem` rows.
- **Reimbursement**: payer registers advance payment → taps "Request payment" → partner gets in-app notification → either party marks `isPaid`.
- **Dashboard**: monthly budget vs. actual per category.
