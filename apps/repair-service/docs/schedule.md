# Schedule System Documentation

> ASKO Repair Management Platform — Work Schedule & Availability System

**Related docs:**
- [Repair Request Architecture](./repair-request.md) — how repair requests consume the schedule (guards, overtime recording, timezone)
- [Repair Service README](../README.md) — service overview
- [Top-level docs index](../../../docs/README.md)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [Entry Types & Business Rules](#entry-types--business-rules)
- [Pattern System](#pattern-system)
- [Validation Rules](#validation-rules)
- [API Reference](#api-reference)
- [Schedule Resolver](#schedule-resolver)
- [Repair Assignment Flow](#repair-assignment-flow)
- [Event System](#event-system)
- [Frontend Components](#frontend-components)
- [File Reference](#file-reference)

---

## Overview

The schedule system manages repairer work availability through two mechanisms:

1. **Patterns** — recurring work/rest cycles (e.g. 5 work days / 2 rest days)
2. **Entries** — one-time schedule events (vacation, sick leave, overtime, extra day)

Entries override patterns. The system determines daily availability for repair request assignment.

```
┌─────────────────────────────────────────────────────────┐
│                    Schedule System                       │
│                                                         │
│  ┌──────────────┐          ┌──────────────────────────┐ │
│  │   Patterns   │          │        Entries           │ │
│  │              │          │                          │ │
│  │  Recurring   │  ◄─────  │  vacation    sick_leave  │ │
│  │  work/rest   │ override │  overtime    extra_day   │ │
│  │  cycles      │          │                          │ │
│  └──────┬───────┘          └────────────┬─────────────┘ │
│         │                               │               │
│         └───────────┬───────────────────┘               │
│                     ▼                                   │
│         ┌───────────────────────┐                       │
│         │  Schedule Resolver    │                       │
│         │  (today's status)     │                       │
│         └───────────┬───────────┘                       │
│                     ▼                                   │
│         ┌───────────────────────┐                       │
│         │  Repair Assignment    │                       │
│         │  (repairer selector)  │                       │
│         └───────────────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

---

## Architecture

```
┌───────────┐     REST      ┌──────────────────┐     gRPC      ┌─────────────────┐
│           │  /schedule/*  │                  │               │                 │
│  Next.js  ├──────────────►│  Repair Gateway  ├──────────────►│  Repair Service │
│  Frontend │               │  (:4002)         │               │  (:5003)        │
│           │◄──────────────┤                  │◄──────────────┤                 │
└───────────┘               └──────────────────┘               └────────┬────────┘
                                                                       │
                                                               ┌───────▼────────┐
                                                               │   PostgreSQL   │
                                                               │  (repair DB)   │
                                                               └───────┬────────┘
                                                                       │
                                                               ┌───────▼────────┐
                                                               │   RabbitMQ     │
                                                               │  (events)      │
                                                               └────────────────┘
```

**Layers:**

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| Frontend | `apps/web` | UI, client-side validation, schedule resolver |
| Gateway | `apps/repair-gateway` | REST endpoints, auth, server-side validation |
| Service | `apps/repair-service` | Business logic, DB, gRPC, events |
| Shared | `packages/shared` | DTOs, enums, validation functions, date utilities |

---

## Data Model

### WSchedule (Entry)

```
┌─────────────────────────────────────────────────┐
│                   WSchedule                      │
├─────────────────────────────────────────────────┤
│  id            UUID (PK)                        │
│  userId        UUID (FK → user)                 │
│  type          enum: vacation | sick_leave       │
│                      | overtime | extra_day      │
│  dateFrom      date (ISO string)                │
│  dateTo        date (ISO string)                │
│  startTime     time string (HH:MM)              │
│  endTime       time string (HH:MM)              │
│  status        enum: pending | approved          │
│                      | rejected                  │
│  approvedBy    UUID? (FK → user)                │
│  note          string?                          │
│  autoGenerated boolean (default: false)          │
│  createdAt     timestamp                        │
│  updatedAt     timestamp                        │
└─────────────────────────────────────────────────┘
```

### WSchedulePattern

```
┌─────────────────────────────────────────────────┐
│               WSchedulePattern                   │
├─────────────────────────────────────────────────┤
│  id               UUID (PK)                     │
│  userId           UUID (FK → user, unique)      │
│  cycleLength      int (1–14)                    │
│  anchorDate       date (ISO string)             │
│  defaultStartTime time string (HH:MM)           │
│  defaultEndTime   time string (HH:MM)           │
│  slots            PatternSlotData[]             │
│  status           enum: pending | approved       │
│                        | rejected               │
│  approvedBy       UUID?                         │
│  approvedAt       timestamp?                    │
│  pendingData      PatternPendingData?           │
│  createdAt        timestamp                     │
│  updatedAt        timestamp                     │
├─────────────────────────────────────────────────┤
│  PatternSlotData = {                            │
│    work: boolean                                │
│    startTime?: string                           │
│    endTime?: string                             │
│  }                                              │
│                                                 │
│  PatternPendingData = {                         │
│    cycleLength, anchorDate,                     │
│    defaultStartTime, defaultEndTime,            │
│    slots[]                                      │
│  }                                              │
└─────────────────────────────────────────────────┘
```

### Entity Relationship

```
                        ┌─────────────┐
                        │    User     │
                        └──────┬──────┘
                               │
                 ┌─────────────┼─────────────┐
                 │                           │
          ┌──────▼──────┐          ┌─────────▼─────────┐
          │  WSchedule  │          │ WSchedulePattern  │
          │  (0..many)  │          │    (0..1)         │
          └─────────────┘          └───────────────────┘

  One user → one pattern (unique constraint on userId)
  One user → many entries (vacation, sick, overtime, extra_day)
```

---

## Entry Types & Business Rules

### Type Comparison

```
┌──────────────┬─────────────────────┬──────────────┬─────────────────────┬─────────────────┐
│              │     EXTRA_DAY       │   OVERTIME   │     VACATION        │   SICK_LEAVE    │
├──────────────┼─────────────────────┼──────────────┼─────────────────────┼─────────────────┤
│ Purpose      │ Work on a day off   │ Extra hours  │ Extended leave      │ Illness leave   │
│ Created by   │ User or Staff       │ User or Staff│ User or Staff       │ User or Staff   │
│ Date range   │ Today only          │ Today+       │ Future only         │ Today+          │
│ Max duration │ 1 day               │ —            │ —                   │ 30 days         │
│ Initial      │ PENDING             │ PENDING      │ PENDING             │ PENDING         │
│ Unique?      │ No                  │ No           │ 1 active per user   │ 1 active/user   │
│ Approval     │ Required (strict)   │ By staff     │ By staff            │ By staff        │
│ Self-approve │ Yes (own extra_day) │ No           │ No                  │ No              │
│ Editable by  │ Same day only       │ Admins       │ Before start only   │ Shorten only    │
│ Deletable by │ Admins only         │ Admins only  │ Admins only         │ Admins only     │
│ Priority     │ Highest             │ High         │ Low                 │ Low             │
└──────────────┴─────────────────────┴──────────────┴─────────────────────┴─────────────────┘
```

### Extra Day Flow

The **extra_day** type has special semantics: it represents working on a normally non-work day. Approval is **strictly required** — a manager cannot bypass it.

```
     ┌───────────┐                    ┌───────────┐                    ┌───────────┐
     │  Manager  │                    │  System   │                    │  Repairer │
     └─────┬─────┘                    └─────┬─────┘                    └─────┬─────┘
           │                                │                                │
           │  1. Propose extra day          │                                │
           │  POST /schedule                │                                │
           │  {type: extra_day,             │                                │
           │   userId: repairer,            │                                │
           │   dateFrom/To: today}          │                                │
           ├───────────────────────────────►│                                │
           │                                │                                │
           │                                │  2. Create PENDING entry       │
           │                                │  Emit schedule.created         │
           │                                ├───────────────────────────────►│
           │                                │     Notification sent          │
           │                                │                                │
           │                                │  3a. Repairer ACCEPTS          │
           │                                │  POST /schedule/:id/approve    │
           │                                │◄───────────────────────────────┤
           │                                │                                │
           │  4. Entry now APPROVED         │                                │
           │  Repairer available for        │                                │
           │  assignment today              │                                │
           │◄───────────────────────────────┤                                │
           │                                │                                │
           │                                │  3b. Repairer DECLINES         │
           │                                │  POST /schedule/:id/reject     │
           │                                │◄───────────────────────────────┤
           │                                │                                │
           │  4b. Entry REJECTED            │                                │
           │  Repairer NOT available        │                                │
           │◄───────────────────────────────┤                                │
           │                                │                                │
```

**Key rule:** Even during repair request assignment, the manager can only *propose* an extra day. The repairer must accept before being assigned.

### Repairer Self-Created Extra Day

```
     ┌───────────┐                    ┌───────────┐                    ┌───────────┐
     │  Repairer │                    │  System   │                    │   Staff   │
     └─────┬─────┘                    └─────┬─────┘                    └─────┬─────┘
           │                                │                                │
           │  1. Request extra day          │                                │
           │  POST /schedule                │                                │
           │  {type: extra_day,             │                                │
           │   dateFrom/To: today}          │                                │
           ├───────────────────────────────►│                                │
           │                                │                                │
           │                                │  2. Create PENDING entry       │
           │                                │  Emit schedule.created         │
           │                                ├───────────────────────────────►│
           │                                │     Notification sent          │
           │                                │                                │
           │                                │  3. Staff APPROVES             │
           │                                │  POST /schedule/:id/approve    │
           │                                │◄───────────────────────────────┤
           │                                │                                │
           │  4. Entry now APPROVED         │                                │
           │◄───────────────────────────────┤                                │
           │                                │                                │
```

**Note:** Repairer cannot create extra_day on a work day (resolved at pattern level — pattern already marks that day as work).

### Vacation Flow

```
     ┌───────────┐                    ┌───────────┐                    ┌───────────┐
     │  Repairer │                    │  System   │                    │   Staff   │
     └─────┬─────┘                    └─────┬─────┘                    └─────┬─────┘
           │                                │                                │
           │  1. Request vacation           │                                │
           │  POST /schedule/vacation       │                                │
           │  {dateFrom, dateTo}            │                                │
           ├───────────────────────────────►│                                │
           │                                │                                │
           │          ┌─────────────────────┤                                │
           │          │ Validate:           │                                │
           │          │ • Not in past       │                                │
           │          │ • No active vacation│                                │
           │          └─────────────────────┤                                │
           │                                │                                │
           │                                │  2. Create PENDING vacation    │
           │                                ├───────────────────────────────►│
           │                                │                                │
           │                                │  3. Staff approves/rejects     │
           │                                │◄───────────────────────────────┤
           │                                │                                │
           │  4. Status updated             │                                │
           │◄───────────────────────────────┤                                │
           │                                │                                │
```

**Constraint:** Only one active (non-rejected, dateTo >= today) vacation per user.

### Sick Leave Flow

```
     ┌───────────┐                    ┌───────────┐                    ┌───────────┐
     │  Repairer │                    │  System   │                    │   Staff   │
     └─────┬─────┘                    └─────┬─────┘                    └─────┬─────┘
           │                                │                                │
           │  1. Report sick leave          │                                │
           │  POST /schedule               │                                │
           │  {type: sick_leave,            │                                │
           │   dateFrom: today,             │                                │
           │   dateTo: +N days (max 30)}    │                                │
           ├───────────────────────────────►│                                │
           │                                │                                │
           │          ┌─────────────────────┤                                │
           │          │ Validate:           │                                │
           │          │ • dateFrom >= today │                                │
           │          │ • duration <= 30d   │                                │
           │          │ • No active sick    │                                │
           │          └─────────────────────┤                                │
           │                                │                                │
           │                                │  2. Create PENDING entry       │
           │                                ├───────────────────────────────►│
           │                                │                                │
           │  — Later: end sick leave —     │                                │
           │                                │                                │
           │  3. End early                  │                                │
           │  PUT /schedule/:id             │                                │
           │  {dateTo: today}               │                                │
           ├───────────────────────────────►│                                │
           │                                │                                │
           │          ┌─────────────────────┤                                │
           │          │ Validate:           │                                │
           │          │ • Only shorten      │                                │
           │          │ • dateTo <= original│                                │
           │          │ • Record preserved  │                                │
           │          └─────────────────────┤                                │
           │                                │                                │
```

**Edit constraints:** Non-admin can only shorten `dateTo` (to today or earlier). Cannot change `dateFrom`, `startTime`, `endTime`, or `type`. The full record is preserved for audit.

---

## Pattern System

### Cycle Resolution

Patterns define a repeating work/rest cycle. The position in the cycle for any date is calculated:

```
position = ((diffDays % cycleLength) + cycleLength) % cycleLength

where: diffDays = targetDate - anchorDate (in days)
```

### Example: 5/2 Pattern (Work Mon–Fri, Rest Sat–Sun)

```
Anchor: Monday (2026-04-06)
Cycle Length: 7
Slots: [W, W, W, W, W, R, R]

         Mon  Tue  Wed  Thu  Fri  Sat  Sun
Week 1:  [W]  [W]  [W]  [W]  [W]  [R]  [R]
Week 2:  [W]  [W]  [W]  [W]  [W]  [R]  [R]
  ...repeating...

Each slot can have custom times:
  Slot 0 (Mon): work=true, 09:00–18:00
  Slot 5 (Sat): work=false
```

### Common Presets

```
┌──────────┬──────────────┬────────────────────────────┐
│ Preset   │ Cycle Length  │ Pattern                    │
├──────────┼──────────────┼────────────────────────────┤
│ 5/2      │ 7            │ WWWWWRR                    │
│ 2/2      │ 4            │ WWRR                       │
│ 3/3      │ 6            │ WWWRRR                     │
│ 6/1      │ 7            │ WWWWWWR                    │
│ 7/0      │ 7            │ WWWWWWW (every day)        │
└──────────┴──────────────┴────────────────────────────┘
```

### Pattern Approval Workflow

```
                    ┌──────────────────────────────────┐
                    │         Pattern Upsert           │
                    └──────────────┬───────────────────┘
                                   │
                         ┌─────────▼─────────┐
                         │  Existing pattern? │
                         └─────────┬─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │ No                          │ Yes
                    ▼                              ▼
           ┌────────────────┐           ┌─────────────────┐
           │  Is staff?     │           │ Is staff?       │
           └───────┬────────┘           └────────┬────────┘
                   │                             │
            ┌──────┼──────┐               ┌──────┼──────┐
            │ No         │ Yes            │ No         │ Yes
            ▼             ▼               ▼             ▼
    ┌──────────────┐ ┌──────────┐  ┌───────────┐ ┌──────────────┐
    │ Create as    │ │ Create   │  │ Status?   │ │ Apply direct │
    │ PENDING      │ │ APPROVED │  └─────┬─────┘ │ APPROVED     │
    └──────────────┘ └──────────┘        │       │ Clear pending│
                                   ┌─────┼─────┐ └──────────────┘
                                   │           │
                              PENDING     APPROVED
                                   │           │
                                   ▼           ▼
                           ┌────────────┐ ┌─────────────────┐
                           │ Refine     │ │ Stash changes   │
                           │ in place   │ │ in pendingData  │
                           │ (PENDING)  │ │ Live unaffected │
                           └────────────┘ └─────────────────┘
```

### Staged Edit (pendingData)

When a non-staff user edits an **approved** pattern, the change is stashed — the live pattern continues to serve schedule resolution:

```
┌─────────────────────────────────────────────────────────┐
│              WSchedulePattern (APPROVED)                 │
│                                                         │
│  Live (active):          Pending (staged):              │
│  ┌─────────────────┐     ┌──────────────────────┐      │
│  │ cycleLength: 7  │     │ pendingData:         │      │
│  │ slots: WWWWWRR  │     │   cycleLength: 4    │      │
│  │ times: 09–18    │     │   slots: WWRR       │      │
│  └─────────────────┘     │   times: 08–20      │      │
│                           └──────────────────────┘      │
│                                                         │
│  ► Resolver uses LIVE data                              │
│  ► Staff sees both and can approve/reject staged edit   │
└─────────────────────────────────────────────────────────┘
```

On **approve**: `pendingData` → applied to live fields, `pendingData` cleared.
On **reject**: `pendingData` discarded, live pattern unchanged.

---

## Validation Rules

### Shared Validation Functions (`@asko/shared`)

```
┌────────────────────────────┬────────────────────────────────────────────┐
│ Function                   │ Rule                                       │
├────────────────────────────┼────────────────────────────────────────────┤
│ assertNotInPast(date,time) │ date+time must be >= now                  │
│ assertDateNotBeforeToday   │ date must be >= today (start of day)      │
│ assertDateIsToday(date)    │ date must be exactly today                │
│ assertMaxDuration(from,to) │ to - from must be <= maxDays              │
└────────────────────────────┴────────────────────────────────────────────┘
```

### Validation Matrix per Operation

```
             ┌──────────────────────────────────────────────────────────┐
             │                    CREATE                                │
             ├──────────────┬──────────────┬──────────────┬────────────┤
             │  extra_day   │   overtime   │  sick_leave  │  vacation  │
┌────────────┼──────────────┼──────────────┼──────────────┼────────────┤
│ Date check │ Today only   │ >= Today     │ >= Today     │ Not past   │
│ Max days   │ 1 (implicit) │ —            │ 30           │ —          │
│ Unique?    │ —            │ —            │ 1 active     │ 1 active   │
│ Time check │ —            │ —            │ —            │ Not in past│
└────────────┴──────────────┴──────────────┴──────────────┴────────────┘

             ┌──────────────────────────────────────────────────────────┐
             │                    UPDATE (non-admin)                    │
             ├──────────────┬──────────────┬──────────────┬────────────┤
             │  extra_day   │   overtime   │  sick_leave  │  vacation  │
┌────────────┼──────────────┼──────────────┼──────────────┼────────────┤
│ Allowed    │ Same day only│ —            │ Shorten only │ Before     │
│            │              │              │ (reduce end) │ start only │
│ Type change│ No           │ No           │ No           │ No         │
│ Resets to  │ —            │ —            │ —            │ PENDING    │
│ Unique?    │ —            │ —            │ Re-checked   │ Re-checked │
└────────────┴──────────────┴──────────────┴──────────────┴────────────┘

             ┌─────────────────────────────────┐
             │         DELETE / APPROVE         │
             ├─────────────────────────────────┤
             │ DELETE: Admin roles only         │
             │ APPROVE: Staff, or self          │
             │   (self: own EXTRA_DAY only)     │
             │ REJECT: Staff, or self           │
             │   (self: own EXTRA_DAY only)     │
             └─────────────────────────────────┘
```

---

## API Reference

### Schedule Entry Endpoints

Base: `GET|POST|PUT|DELETE /schedule`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/` | Staff, Repairer | Create entry (type-specific validation) |
| `POST` | `/vacation` | Staff, Repairer | Create vacation (simplified) |
| `GET` | `/` | Staff, Repairer | List entries (non-staff sees own only) |
| `GET` | `/:id` | Staff | Get entry by ID |
| `PUT` | `/:id` | Staff, Repairer | Update entry (type-specific restrictions) |
| `DELETE` | `/:id` | Admin | Delete entry |
| `POST` | `/:id/approve` | Staff, or self (extra_day) | Approve entry |
| `POST` | `/:id/reject` | Staff, or self (extra_day) | Reject entry |

### Schedule Pattern Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/pattern/:userId` | Staff, Repairer (self) | Get pattern |
| `PUT` | `/pattern/:userId` | Staff, Repairer (self) | Create/update pattern |
| `DELETE` | `/pattern/:userId` | Staff, Repairer (self) | Delete pattern |
| `POST` | `/pattern/:userId/approve` | Staff | Approve pattern |
| `POST` | `/pattern/:userId/reject` | Staff | Reject pattern |
| `GET` | `/patterns?userIds=a,b,c` | Staff | Batch get patterns |

### Query Parameters (GET /)

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `userId` | UUID | Filter by user |
| `type` | string | Filter by entry type |
| `status` | string | Filter by status |
| `dateFrom` | ISO date | Filter entries overlapping from |
| `dateTo` | ISO date | Filter entries overlapping to |

---

## Schedule Resolver

The frontend resolves a repairer's **today** status from pattern + entries:

### Resolution Priority

```
                         ┌──────────────────────┐
                         │  Approved entries     │
                         │  covering today?      │
                         └──────────┬───────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               │                    │                    │
          extra_day            overtime              vacation
          (highest)                                  sick_leave
               │                    │                    │
               ▼                    ▼                    ▼
        ┌────────────┐     ┌─────────────┐     ┌──────────────┐
        │ status:    │     │ status:     │     │ status:      │
        │ extra_day  │     │ overtime    │     │ vacation /   │
        │ + times    │     │ + times    │     │ sick_leave   │
        └────────────┘     └─────────────┘     └──────────────┘
                                                       │
                                                       ▼
                                                Check for pending
                                                extra_day →
                                                pendingExtraDay: true

If no approved entries cover today:
               │
               ▼
     ┌──────────────────┐
     │ Pattern exists   │
     │ and APPROVED?    │
     └────────┬─────────┘
              │
       ┌──────┼──────┐
       │ Yes         │ No
       ▼             ▼
  ┌──────────┐  ┌──────────┐
  │ Resolve  │  │ status:  │
  │ slot for │  │ unknown  │
  │ today    │  └──────────┘
  └────┬─────┘
       │
  ┌────┼────┐
  │ work   │ rest
  ▼         ▼
working    off
+ times    + pendingExtraDay?
```

### Status Values

| Status | Meaning | Badge Color |
|--------|---------|-------------|
| `working` | Normal work day (from pattern) | Green |
| `extra_day` | Approved extra day | Green |
| `overtime` | Approved overtime | Blue |
| `off` | Rest day (from pattern) | Yellow |
| `vacation` | On vacation | Red |
| `sick_leave` | On sick leave | Red |
| `unknown` | No pattern, no entries | Gray |

### Assignment Priority Sort

```
Best for assignment ─────────────────────► Worst for assignment

  working      unknown      off       sick_leave    vacation
  extra_day                           
  overtime                            
    (0)          (1)        (2)          (3)           (4)
```

---

## Repair Assignment Flow

### Manager Assigning a Repairer

```
┌────────────────┐
│ Manager opens  │
│ request detail │
└───────┬────────┘
        │
        ▼
┌────────────────────────────────────────┐
│ 1. Fetch repairers for service type    │
│ 2. Fetch ALL schedule entries          │
│    (no status filter — includes        │
│     pending for pendingExtraDay flag)  │
│ 3. Fetch patterns (batch)             │
└───────────────────┬────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│ 4. For each repairer:                 │
│    resolveScheduleForToday(           │
│      pattern, entries                 │
│    ) → RepairerScheduleInfo           │
│                                       │
│ 5. Sort by compareBySchedule()        │
│    (working first, vacation last)     │
└───────────────────┬────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│ 6. Display repairer selector:         │
│                                       │
│  ┌──────────────────────────────────┐ │
│  │ Иванов Петр            ~12.5 км │ │
│  │ [Свободен] [Работает 09:00–18:00]│ │
│  ├──────────────────────────────────┤ │
│  │ Сидоров Алексей         ~3.2 км │ │
│  │ [Занят (2)] [Выходной]          │ │
│  │ [Ожидает доп. день]             │ │
│  ├──────────────────────────────────┤ │
│  │ Козлов Дмитрий     Тот же город │ │
│  │ [Свободен] [В отпуске]         │ │
│  └──────────────────────────────────┘ │
└───────────────────┬────────────────────┘
                    │
        ┌───────────┼───────────┐
        │                       │
   Available              Unavailable
   (working/extra/        (off/vacation/
    overtime)              sick_leave)
        │                       │
        ▼                       ▼
┌──────────────┐    ┌────────────────────────┐
│ Direct       │    │ Show proposal modal:   │
│ assignment   │    │                        │
│ PUT /repair  │    │ "Мастер не работает    │
│ /assign      │    │  сегодня. Предложить   │
│              │    │  доп. день?"           │
└──────────────┘    │                        │
                    │ [Предложить доп. день] │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │ POST /schedule         │
                    │ {type: extra_day,      │
                    │  userId: repairer,     │
                    │  dateFrom/To: today,   │
                    │  status: PENDING}      │
                    │                        │
                    │ Repairer must accept   │
                    │ before assignment      │
                    └────────────────────────┘
```

### Repairer Selector Badges

```
Row 1:  [Name]                          [Distance/City badge]
Row 2:  [Availability] [Schedule status] [Pending extra day] [Details]

Examples:

  Иванов Петр                                    ~12.5 км
  [Свободен] [Работает 09:00–18:00] [Выполнено: 15]

  Сидоров Алексей                                ~3.2 км
  [Занят (2)] [Выходной] [Ожидает доп. день] [Текущая: Диагностика]

  Козлов Дмитрий                            Тот же город
  [Свободен] [Доп. день 09:00–18:00]

  Петров Сергей                                  Москва
  [Свободен] [Переработка 18:00–22:00]

  Волков Андрей                                  ~45 км
  [Свободен] [В отпуске]

  Морозов Виктор                                 Казань
  [Свободен] [На больничном] [Ожидает доп. день]
```

---

## Event System

### RabbitMQ Events

All schedule operations emit events through the repair event service:

```
┌─────────────────────┐     RabbitMQ      ┌──────────────────────┐
│   Repair Service    │                   │ Notification Service │
│                     │                   │                      │
│ schedule.created   ─┼──────────────────►│ → Notify user/staff  │
│ schedule.updated   ─┼──────────────────►│                      │
│ schedule.deleted   ─┼──────────────────►│                      │
│ schedule.approved  ─┼──────────────────►│ → Notify repairer    │
│ schedule.rejected  ─┼──────────────────►│ → Notify repairer    │
│                     │                   │                      │
│ schedule.pattern_  ─┼──────────────────►│ → Notify user/staff  │
│   created/updated   │                   │                      │
│ schedule.pattern_  ─┼──────────────────►│ → Notify repairer    │
│   approved/rejected │                   │                      │
└─────────────────────┘                   └──────────────────────┘
```

### Auto-Generated Entries

The system can auto-create entries via RabbitMQ commands:

```
┌───────────────────┐     schedule.record_overtime     ┌─────────────────────┐
│  Any Service      │ ────────────────────────────────►│  Repair Service     │
│  (e.g. repair)    │                                  │  (consumer)         │
│                   │     Payload:                     │                     │
│                   │     {userId, date, start,        │  Creates APPROVED   │
│                   │      end, requestId}             │  overtime entry     │
│                   │                                  │  (idempotent)       │
└───────────────────┘                                  └─────────────────────┘
```

### Event Metadata

```json
{
  "type": "schedule.approved",
  "scheduleId": "uuid",
  "userId": "repairer-uuid",
  "actorId": "manager-uuid",
  "timestamp": "2026-04-12T10:30:00Z"
}
```

Pattern events include additional fields:

```json
{
  "type": "schedule.pattern_updated",
  "patternId": "uuid",
  "userId": "repairer-uuid",
  "actorId": "manager-uuid",
  "staged": true,
  "firstSubmission": false
}
```

---

## Frontend Components

### Component Map

```
apps/web/src/components/account/schedule/
├── my-schedule-page.tsx      ── Personal schedule view (repairer)
├── schedule-page.tsx         ── Admin/manager roster view
├── schedule-form-modal.tsx   ── Create/edit entry modal
├── pattern-editor.tsx        ── Interactive cycle editor
├── pattern-preview.tsx       ── Read-only pattern display
├── week-projection.tsx       ── Mon–Sun week view
├── stats.ts                  ── Compute schedule statistics
└── user-schedule-batch.tsx   ── Per-user entry batch (admin view)

apps/web/src/components/account/manager/request-detail/
├── schedule-resolver.ts      ── Resolve today's status
├── repairer-selector.tsx     ── Assignment dropdown
├── manager-request-detail.tsx── Request detail page + assignment
└── types.ts                  ── RepairerScheduleInfo type
```

### Page Responsibilities

**My Schedule Page** (`/account/schedule`)
- View own pattern and entries
- Create new entries (all types)
- Accept/decline extra_day proposals
- End sick leave early
- Edit pattern (goes to PENDING or stages)

**Schedule Management Page** (`/account/admin/schedule`)
- View all users' patterns and entries
- Approve/reject pending patterns and entries
- Staff can create entries for any repairer
- Delete entries (admin only)
- Batch pattern approval queue

### Schedule Form Modal

```
┌─────────────────────────────────────────┐
│          Новая запись графика            │
├─────────────────────────────────────────┤
│                                         │
│  Тип:  [Доп. день ▼]                   │
│                                         │
│  Дата начала:  [2026-04-12] (disabled)  │
│  Дата конца:   [2026-04-12] (disabled)  │
│                                         │
│  Время начала: [09:00]                  │
│  Время конца:  [18:00]                  │
│                                         │
│  Примечание:   [                    ]   │
│                                         │
│              [Создать]                  │
└─────────────────────────────────────────┘

Type-specific behavior:
• extra_day  → date locked to today
• sick_leave → max date = today + 30d
• overtime   → date >= today
• vacation   → date > now
```

---

## File Reference

| Purpose | Path |
|---------|------|
| **Backend** | |
| Schedule entity | `apps/repair-service/src/entities/wschedule.entity.ts` |
| Pattern entity | `apps/repair-service/src/entities/wschedule-pattern.entity.ts` |
| Schedule service | `apps/repair-service/src/services/wschedule.service.ts` |
| Pattern service | `apps/repair-service/src/services/wschedule-pattern.service.ts` |
| gRPC controller (entries) | `apps/repair-service/src/controllers/schedule.grpc.controller.ts` |
| gRPC controller (patterns) | `apps/repair-service/src/controllers/schedule-pattern.grpc.controller.ts` |
| Command consumer | `apps/repair-service/src/consumers/schedule-command.consumer.ts` |
| Event service | `apps/repair-service/src/modules/repair-event.service.ts` |
| **Gateway** | |
| REST controller | `apps/repair-gateway/src/modules/wschedule/controllers/wschedule.controller.ts` |
| Schedule gRPC client | `apps/repair-gateway/src/modules/repair-client/schedule-client.service.ts` |
| **Shared** | |
| DTOs | `packages/shared/src/schedule/wschedule.dto.ts` |
| Types & enums | `packages/shared/src/schedule/schedule.type.ts` |
| Validation functions | `packages/shared/src/schedule/validation.ts` |
| Date utilities | `packages/shared/src/utils/date.ts` |
| **Proto** | |
| gRPC definitions | `packages/proto/repair.proto` |
| **Frontend** | |
| API client | `apps/web/src/lib/api/schedule.ts` |
| Schedule pages | `apps/web/src/components/account/schedule/` |
| Schedule resolver | `apps/web/src/components/account/manager/request-detail/schedule-resolver.ts` |
| Repairer selector | `apps/web/src/components/account/manager/request-detail/repairer-selector.tsx` |
| Manager request detail | `apps/web/src/components/account/manager/request-detail/manager-request-detail.tsx` |

---

## Key Constraints Summary

| Constraint | Enforced At |
|------------|-------------|
| One active vacation per user | Gateway (create/update) |
| One active sick_leave per user | Gateway (create/update) |
| Extra day = today only | Gateway (create), Shared validation |
| Sick leave max 30 days | Gateway (create), Shared validation |
| Extra day approval is strict | Gateway (approve endpoint) |
| Non-admin cannot delete entries | Gateway (RBAC) |
| Non-staff edit restrictions | Gateway (per-type logic) |
| Pattern cycle 1–14 days | Service (upsert validation) |
| Pattern min 1 work slot | Service (upsert validation) |
| Only approved patterns resolve | Frontend resolver, Service |
| Pending pattern edits are staged | Service (upsert logic) |
