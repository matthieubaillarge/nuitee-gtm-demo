# PRD: Connect Activation Console (Nuitée / LiteAPI case study demo)

**Owner:** Matthieu Baillargé
**Purpose:** A live, browser-accessible demo artifact for the first-round GTM Engineer interview with Gian Caprini (VP Growth, Nuitée). It supports a 5 to 10 minute spoken presentation of the "Customer Journey" case study.
**Deadline:** Interview is Thursday. Build must be demoable before then.
**Status:** ✅ Built. All phases complete. Ready to deploy to Vercel.

---

## 1. Context (read this first, it shapes every design choice)

This artifact is not a dashboard for its own sake. It is a prop for an argument. The developer should optimise for the argument landing in a screenshare, not for feature completeness.

The case study prompt: "Review the journey from initial interest to an active Connect (LiteAPI) customer. Explain where you would focus your attention, what challenges or opportunities you would investigate, and how you would prioritise improvements."

The candidate's thesis (the spine of the whole thing):

1. The **front** of the journey (docs, sandbox, first successful API call) is genuinely excellent. The candidate tested it. He will say so out loud.
2. But "an **active** customer" means one running LiteAPI in **production, driving real booking volume**, because Nuitée earns margin on bookings, not on signups. So the real journey is: interest → first call → **first production booking → sustained volume**.
3. Every hotel-booking API leaks hardest on the **back half**, and it leaks **invisibly**, precisely because the smooth front produces a pile of testers who quietly never ship to production.
4. The right first move is not to pour more testers into a leaky bucket (developer acquisition on RapidAPI, Product Hunt, GitHub, etc., which is a known playbook and sits lower on the priority list). The right first move is to **make the invisible funnel visible, then attack the biggest revenue-weighted leak**, which is activation into production.
5. Prioritise by **GMV** (gross merchandise value, the euro value of bookings), not by count of signups.

The console **is** the "make the invisible funnel visible" step, rendered. It also demonstrates that the candidate thinks like a GTM engineer (events → CRM → automated lifecycle action), which is literally the job description.

**GMV definition for anyone unfamiliar:** the total euro value of bookings flowing through the platform. It is the number Nuitée makes margin on. "GMV-weighted" means prioritise by where the booking money is, not by headcount of accounts.

---

## 2. Goals and non-goals

### Goals
- Render an activation funnel from "got API key" to "sustained booking volume" that shows a clear, visible **leak** in the back half.
- Provide a live **count vs GMV toggle** that genuinely recomputes and visibly relocates where the value sits (from many small indie testers to a few high-value accounts).
- Provide a **segment filter** (indie / funded OTA-builder / enterprise-fintech) so the presenter can show the journey looks completely different per persona.
- Show a **trigger layer**: a list of lifecycle automation rules with live account counts, demonstrating data → decision → action.
- Look like a real Nuitée internal tool (branded), load fast, and be fully legible in a 1080p screenshare.
- Be deployed to a public Vercel URL.

### Non-goals (explicitly out of scope, keep the build tight)
- No real data. All numbers are fabricated but internally consistent. The UI states this plainly.
- No real integrations. It does **not** connect to PostHog, HubSpot, LiteAPI, or any live source.
- No backend, no database, no auth, no persistence. Pure static front end.
- No account drill-down / event timeline. Trigger layer is **display-only** (rules plus live counts). This was a deliberate decision to keep build time short.
- Not mobile-first. Desktop screenshare is the only target viewport that matters, though it should not break on a laptop screen.

---

## 3. The demo narrative the artifact must support

The presenter talks for 5 to 10 minutes. The UI must let him move left to right through this story without fumbling. Design the single-screen layout so the eye travels in roughly this order.

1. **"Here is the journey, mapped and segmented."** Presenter shows the funnel. Notes honestly that the front (first two stages) is excellent, he tested it.
2. **"But active means production volume, so here is where I would actually look."** Presenter points at the cliff between "first production call" and "first production booking." This is the thesis, rendered as a red drop.
3. **"And it matters more than the count suggests."** Presenter flips the **GMV toggle**. The indie noise collapses, funded and enterprise swell. The money-framed leak appears (roughly a large euro figure of represented pipeline that reaches production-call and never books).
4. **"The journey is really three journeys."** Presenter uses the **segment filter** to show the smooth journey he tested is the indie one, and the funded OTA-builder (his ICP) and enterprise look nothing like it.
5. **"So the first move is to instrument it and act on it, which is this role."** Presenter gestures at the **trigger layer**: rules that catch stalled accounts and route them to a sequence or an AE.
6. **Close:** "I would rather find out why 100 testers become 5 customers than go find 200 more testers." Developer acquisition is named but sequenced second.

Design implication: the three interactive moments (GMV toggle, segment filter, and the visible leak) are the load-bearing UI. Everything else is supporting cast.

---

## 4. Layout (single screen, 16:9, minimal scroll)

One route, `/`, one viewport. Target 1920x1080, degrade gracefully to a 1440 wide laptop. Three panels plus a header.

```
┌───────────────────────────────────────────────────────────────────────┐
│  [Nuitée / LiteAPI wordmark]   Connect Activation Console               │
│  Subtitle: "Interest to active Connect customer. Illustrative data."    │
│  [ Metric: (Count) (GMV) toggle ]     [ Segment: All | Indie | Funded   │
│                                          OTA | Enterprise ]              │
├───────────────────────────────────────┬───────────────────────────────┤
│  PANEL 1: THE FUNNEL (dominant, ~65%)  │  PANEL 3: TRIGGER LAYER (~35%) │
│                                        │                               │
│  5 horizontal stage bars, width ∝      │  Lifecycle rules, each with:  │
│  value. Top 2 healthy (green). Red     │  - plain-language rule        │
│  drop annotated at the production      │  - segment it mostly catches  │
│  booking stage: "← the journey they    │  - live count badge           │
│  are asking about."                    │                               │
│                                        │  (display only, counts derive │
│  PANEL 2 controls (toggle + filter)    │   from the same data)         │
│  live in the header and drive this.    │                               │
├───────────────────────────────────────┴───────────────────────────────┤
│  Footer: "Numbers illustrative. Instrumentation logic is real."         │
└───────────────────────────────────────────────────────────────────────┘
```

Panel 2 (the toggle and segment filter) is not a separate box; it lives in the header and controls Panels 1 and 3. Listing it as a panel in earlier discussion was conceptual. Implement it as global controls.

---

## 5. Feature specs

### 5.1 Panel 1: the funnel

Five stages, in order:

| # | Stage key | Label | Health | Conversion |
|---|-----------|-------|--------|------------|
| 0 | `api_key` | API Key | healthy | (entry) |
| 1 | `sandbox_call` | Sandbox Call | healthy | ~92% |
| 2 | `production_call` | Production Call | **the cliff** | ~45% |
| 3 | `production_booking` | Production Booking | recovering | ~70% |
| 4 | `sustained_volume` | Sustained Volume | goal | ~64% |

- Render as **horizontal stacked bars**, width proportional to the current metric value (count or monthly GMV) for the current segment selection. Each bar is composed of three colored segments showing the **ICP breakdown** (Indie in yellow, Startups in blue, Enterprise in green). This visualization shows how the segment composition shifts as accounts progress through the funnel.
- **Cliff highlighting:** the drop into stage 2 (Production Call) is always highlighted with a red ring and annotation callout. This is hardcoded, not dynamically calculated, because the Sandbox → Production Call drop (~45%) is THE thesis of the demo: most accounts test the sandbox but never ship to production.
- Each bar shows: label, the value (formatted as an integer count, or as euros with k/M suffixes in GMV mode), and the **conversion rate from the previous stage**.
- **Conversion rate coloring:** Green if ≥75%, red if <50%, orange for the rest. This makes the 45% cliff rate immediately visible in red.
- The transition when the metric toggles must **animate the bar widths** (width transition, ~400ms ease). This morph is the single most memorable moment of the demo. Do not skip it.
- **Legend:** shows the three ICP colors (Indie, Startups, Enterprise) in the funnel header.

### 5.2 Global controls (metric toggle + segment filter)

- **Metric toggle:** two states, `count` and `gmv`. Switches every value in Panels 1 and 3 between account counts and represented GMV. Must be a genuine recompute from the underlying data, not two hardcoded views.
- **Segment filter:** `all` (default), `indie`, `funded_ota`, `enterprise`. Filters the accounts feeding both panels. Default view on load is `all` with metric `count`, so the presenter starts on the familiar picture and then reveals.
- Both controls update Panel 1 and Panel 3 reactively. State is two variables (`metric`, `segment`); all views are pure functions of `(accounts, metric, segment)`.

### 5.3 Panel 3: trigger layer (display-only)

A vertical list of lifecycle automation rules. Each row:
- **Rule description** in plain language (the "if this, do that").
- A small **segment tag** showing which segment it mostly catches.
- A **live count badge** of accounts currently matching the rule, computed from the same account data and **respecting the active segment filter**.

Seed rules (in display order):

1. **Onboarding Nudge.** "First production booking in last 7 days → trigger onboarding sequence." Mixed segments. Tag: "New" (green). Expected seed count (all segments): ~**2-3** (accounts at stage 3 with firstBookingWithin7d).
2. **Reactivation Sequence.** "Tested sandbox, no production call, silent 14+ days → enroll in reactivation sequence." Mostly indie. Tag: "At Risk" (orange). Expected seed count: ~**10-14** (accounts at stage 1 with 14+ days inactivity, mostly the 18 indie testers).
3. **AE Alert.** "Production call, no booking yet, high GMV, stalled → alert account executive." Mostly funded + enterprise. Tag: "Priority" (red). Expected seed count: ~**2-3** (6 accounts at stage 2, top 30% by GMV and stalled). This is the row that shows the tool routing money-weighted risk to a human.
4. **Expansion Play.** "Sustained volume with GMV headroom → expansion play." Funded + enterprise. Tag: "Growth" (blue). Expected seed count: ~**4-5** (9 accounts at stage 4 with hasHeadroom).

The counts must be **computed**, not hardcoded, so that if the seed data is tweaked the badges stay honest. The numbers above are the expected outputs of the provided seed.

Display-only means: no click-through, no timeline. The rows are informative cards. This is the intentional scope cut.

---

## 6. Data model (the heart of internal consistency)

All values are illustrative. The point is that count and GMV are two views of **one** dataset, so toggling is a real recompute and the funnel cannot contradict itself.

### 6.1 Types

```ts
type Segment = 'all' | 'indie' | 'funded_ota' | 'enterprise';
type Metric = 'count' | 'gmv';
type StageIndex = 0 | 1 | 2 | 3 | 4;

interface Account {
  id: string;
  segment: Exclude<Segment, 'all'>;
  stage: StageIndex;              // furthest stage reached
  gmvMonthly: number;             // euros/month this account represents
  daysSinceLastActivity: number;  // drives reactivation trigger
  firstBookingWithin7d: boolean;  // drives onboarding trigger
  hasHeadroom: boolean;           // drives expansion trigger
}

interface SegmentBreakdown {
  indie: number;
  funded_ota: number;
  enterprise: number;
}

interface StageData {
  index: StageIndex;
  label: string;
  value: number;                  // total count or GMV
  breakdown: SegmentBreakdown;    // ICP breakdown for stacked bars
  conversionRate: number | null;
}
```

### 6.2 Derivations (implement as pure functions)

- **Funnel value, count mode, for stage s, segment filter f:** number of accounts where `account.furthestStage >= s` and (`f === 'all'` or `account.segment === f`).
- **Funnel value, GMV mode, for stage s, segment filter f:** sum of `expectedMonthlyGmv` over the same set of accounts. This is "represented GMV trapped at or beyond this stage", which is the money-framed funnel.
- **Stage-to-stage conversion:** `value(s) / value(s-1)`.
- **Trigger counts:** filter accounts by the rule predicate, respecting the segment filter.

The funnel is cumulative (accounts reaching **at least** stage s), so it is monotonically non-increasing, as a real funnel should be.

### 6.3 Seed dataset (use these exact shapes so the leak reads well)

Segment sizes and per-segment expected monthly GMV per account (illustrative averages):

| Segment | Accounts | Avg expected GMV / account / month |
|---------|----------|-----------------------------------|
| indie | 30 | ~€3,000 |
| funded_ota | 12 | ~€60,000 |
| enterprise | 6 | ~€400,000 |
| **total** | **48** | |

Cumulative accounts reaching each stage (this produces the intended cliff at stage 1→2):

| Stage | indie | funded_ota | enterprise | total (count) | Conv. |
|-------|-------|-----------|-----------|---------------|-------|
| 0 got_key | 30 | 12 | 6 | **48** | — |
| 1 sandbox_call | 28 | 11 | 5 | **44** | 92% |
| 2 production_call | 10 | 7 | 3 | **20** | **45%** ← THE CLIFF |
| 3 production_booking | 7 | 5 | 2 | **14** | 70% |
| 4 sustained_volume | 4 | 3 | 2 | **9** | 64% |

Resulting represented GMV per stage (count of accounts at stage x their segment avg GMV):

| Stage | Represented GMV (approx) |
|-------|--------------------------|
| 0 got_key | ~€3.21M |
| 1 sandbox_call | ~€3.14M |
| 2 production_call | ~€2.51M |
| 3 production_booking | ~€1.91M |
| 4 sustained_volume | ~€1.38M |

The two punchlines this seed guarantees:

- **Count mode:** indies are 30 of 48 keys (63%) but 1 of 7 sustained (14%). Funded + enterprise are 37% of keys but 86% of sustained. The bottom of the funnel is where the money already lives.
- **GMV mode:** even at the top, enterprise (€2.4M) plus funded (€0.72M) dwarf indie (€0.09M). Roughly **€600k/month of represented pipeline reaches a production call and never books** (the €2.51M to €1.91M drop). That is the leak, framed in money, and almost none of it is indie.

The developer should generate 48 concrete `Account` records consistent with the table above (assign `furthestStage` so the cumulative counts match, spread `expectedMonthlyGmv` around the segment averages with mild variance, set `daysSinceLastActivity` so ~16 stage-1 accounts exceed 14 days, mark the 4 high-GMV stalled accounts, 3 recent-booking accounts, 5 headroom accounts). Names should feel real per segment (indie: solo-dev / side-project vibes; funded_ota: seed/Series A travel startups; enterprise: fintech / large OTA / airline-ancillary vibes). Do **not** use any real company's name.

---

## 7. Visual and design direction

**Brand:** this should read as a real LiteAPI Connect internal tool, matching the Connect product dashboard.

### Design System (from Connect dashboard)

- **Background:** white (`#ffffff`)
- **Cards:** white background, gray border (`rgba(229, 233, 240, 0.6)`), subtle shadow (`0 1px 2px 0 rgba(0,0,0,0.05)`), 8px border radius
- **Typography:**
  - H1: Onest 600, 18px, rgb(25, 23, 44)
  - H2: Onest 600, 16px, rgb(25, 23, 44)
  - Subtitles: Onest 400, 14px, rgb(100, 116, 139)
  - Labels: Onest 500, 12px, rgb(100, 116, 139)
  - Numbers: black (#000000), semibold
- **Colors (from rs-color palette):**
  - Orange: #fa8900 (Demo badge, At Risk triggers)
  - Red: #f44336 (Priority triggers, cliff highlight)
  - Green: #4caf50 (New triggers, Enterprise segment)
  - Blue: #2196f3 (Growth triggers, Startups segment)
  - Yellow: #ffb300 (Indie segment)
- **Trigger cards:** colored backgrounds with matching borders, title color matches border color, small SVG icons

### Implementation

- **Logo:** LiteAPI logo (`/public/liteAPI-v3-logo.svg`)
- **Header:** white background, contains logo, title "Activation Console", metric toggle, segment filter, and orange "Demo" badge
- **Funnel bars:** stacked by ICP with colors (Indie: yellow, Startups: blue, Enterprise: green)
- **Legibility rule:** every number must be readable in a 1080p screenshare. Numbers are black on the colored bars.

---

## 8. Tech stack and architecture

- **Framework:** Next.js (App Router, latest stable), TypeScript, Tailwind CSS. Single route `/`. This matches the owner's stack and deploys to Vercel with zero config.
- **Rendering:** fully static / client-side. No server components need data, no API routes, no env vars, no secrets.
- **State:** React `useState` for `metric` and `segment`. All derived data are pure selector functions. No global state library needed.
- **Data:** a single typed module, e.g. `/lib/data.ts`, exporting the `accounts` array and the pure selector functions (`funnelValues`, `stageConversions`, `triggerCounts`). Keep the seed easy to edit in one place.
- **Charts:** hand-rolled horizontal bars in CSS/SVG are preferred over a chart library, because the count-to-GMV **width morph** is easiest to control and animate with plain CSS width transitions. Recharts is acceptable if faster, but verify the toggle animation still feels smooth. No heavy dependencies.
- **No browser storage.** No localStorage/sessionStorage. State is in-memory React only.
- **Accessibility / robustness:** works offline once loaded (static), no console errors, no layout break at 1440 wide.

Implemented file layout:
```
app/
  page.tsx            // the single screen, composes header + panels
  layout.tsx          // root layout with Onest font
  globals.css         // Connect design tokens and card styles
components/
  Header.tsx          // LiteAPI logo, metric toggle, segment filter, Demo badge
  Funnel.tsx          // Panel 1 with stacked ICP bars
  FunnelStage.tsx     // Individual stage bar with ICP breakdown
  TriggerLayer.tsx    // Panel 3 container
  TriggerRule.tsx     // Individual trigger card with icon and count
lib/
  data.ts             // seed accounts + pure selectors (getFunnelValues, getTriggerCounts)
  types.ts            // TypeScript interfaces (Account, Segment, StageData, etc.)
  formatters.ts       // Euro formatting (€3.21M style)
  brand.ts            // Color tokens
public/
  liteAPI-v3-logo.svg // LiteAPI wordmark
```

---

## 9. Deployment

- Deploy to the owner's **Vercel** account, resulting in a public URL to open live during the interview.
- Path: push the repo to GitHub and import into Vercel, or `vercel --prod` from the CLI. No environment variables required.
- Acceptance: opening the URL in a fresh browser loads the console in under ~2 seconds with no console errors and no auth wall.
- Recommend the presenter opens the tab **before** the call and does not rely on a live rebuild.

---

## 10. Acceptance criteria (definition of done)

1. Public Vercel URL loads the single-screen console in under ~2s, no console errors.
2. Funnel renders all five stages with **stacked ICP bars** (Indie/Startups/Enterprise) and a **clearly visible cliff** at Production Booking (stage 3), annotated with red ring and callout.
3. Metric toggle switches count ↔ monthly GMV and **animates** the bar widths; values are recomputed from the seed, not hardcoded twice.
4. In GMV mode, the stacked bar composition shifts visibly (enterprise and startup segments swell, indie collapses).
5. Segment filter (all / indie / funded_ota / enterprise) updates both panels; when filtered to a single segment, bars show only that segment's color.
6. Trigger layer shows the four rules in order (Onboarding Nudge, Reactivation, AE Alert, Expansion) with **computed** count badges, and badges update with the segment filter.
7. Each funnel stage shows its stage-to-stage conversion percentage.
8. Styled to match Connect product dashboard (white background, gray borders, Connect typography, LiteAPI logo).
9. Fully legible in a 1080p screenshare; numbers are black on colored bars; no layout break down to 1440 wide.
10. Default load state is `all` + `count`.

---

## 11. Build sequence (so there is always a demoable thing before Thursday)

**Phase 1, MVP, must ship (carries the demo on its own):**
seed data model + selectors, Panel 1 funnel with the visible leak, metric toggle with the animated morph, segment filter, basic Nuitée branding. If only Phase 1 ships, the demo still works.

**Phase 2:**
Panel 3 trigger layer with live computed counts.

**Phase 3, polish:**
leak annotation callout, conversion-rate labels, transition easing, brand refinement against the live sites, footer disclaimer, screenshare legibility pass.

Ship Phase 1 first and deploy it, then layer 2 and 3 onto the same URL.

---

## 12. Decisions log (resolved)

- **Hero segment:** funded OTA-builder. It is the ICP. It is the default focus of the narrative, though `all` loads first so the reveal works. Its data should be the richest / most credible.
- **Visual identity:** Nuitée-branded (their colours, reads as a real internal tool). Signals the "genuine, specific knowledge of Nuitée" the interviewer explicitly asked for.
- **Trigger layer depth:** display-only (rules plus live counts). No drill-down. Deliberate scope cut for build time.

## 13. Open items (non-blocking, developer's discretion)
- Whether to obtain the real Nuitée/LiteAPI logo asset or use a clean text wordmark. Either is acceptable; do not spend long on it.
- Exact euro suffix formatting (€3.21M vs €3,210k). Pick whichever is most legible at screenshare distance.

---

## Appendix A: demo script to UI mapping

| Spoken beat | UI action | The line |
|-------------|-----------|----------|
| Map the journey, front is great | Land on funnel, `all` + `count` | "The front, docs to first call, is excellent. I tested it." |
| Active means production | Point at the stage 2 to 3 cliff | "But active means production volume. This is the journey they are asking about." |
| It is a money problem | Flip **GMV toggle** | "And weighted by GMV, ~€600k/month reaches a production call and never books." |
| Three journeys | Cycle **segment filter** | "The smooth journey I tested is the indie one. Funded and enterprise look nothing like it." |
| This is the job | Gesture at **trigger layer** | "So I would instrument it and act: this rule routes a stalled high-GMV account to an AE." |
| Close | Whole screen | "I would rather learn why 100 testers become 5 customers than go find 200 more testers." |

## Appendix B: formatting note for anyone editing this document
Per the owner's standing preference, avoid em dashes and hyphens used as sentence-level dashes in any copy that ships in the UI. Use commas, colons, or parentheses instead. Hyphens in numeric ranges and compound words are fine.