# Nuitée Case Study: Presentation Script

**Target: 6 minutes spoken, leaving room for questions.**
Dashboard: https://nuiteecom.vercel.app/

Open by setting the frame:
"I'll walk through this in about 6 minutes: first the customer journey and where I'd focus, then my recommendations. Then I'd love your questions."

---

## Part 1: The journey and the focus (about 3 min)

### 1. Map the journey (30 sec)
Land on the funnel, all segments, count view.
 "The journey has five stages: got an API key, first sandbox call, first production call, first booking, then sustained volume. An active customer isn't someone who tested it. It's someone running LiteAPI in production with real, recurring booking volume. That's the only stage Nuitée earns margin on."

### 2. Name the strength honestly (20 sec)
 "First thing I did was test it myself. The front of the journey is excellent. Docs, sandbox, first successful call, it's fast and clean. I compared it to Amadeus and Skyscanner and it's genuinely smoother. So I'm not going to pretend acquisition is broken. It isn't."

### 3. Point at the wall (40 sec)
Point at the drop between sandbox call and production call.
 "The leak is here: sandbox to production. And it makes sense. A sandbox call is free curiosity, no code, no risk. A production call means the dev has decided to actually build: real integration, auth, taking on real work. That decision is the filter. Most people test, then never commit. Once they're past it, they push through the edge cases and payments because they've already invested."

### 4. Flip to GMV (40 sec)
Toggle to GMV.
 "But raw counts mislead. Watch what happens weighted by GMV, the euro value of bookings each account represents. The indie noise collapses. A handful of funded and enterprise accounts dominate. So the stalls I care about aren't the loudest, they're the most valuable. This is how I'd prioritize: by money stuck, not by headcount."

### 5. Split by segment (30 sec)
Cycle the segment filter.
 "It's really three journeys. Indie devs: high volume, near-zero GMV, mostly self-serve. Funded startups: mid volume, real GMV, my main focus. Enterprise like Grab: low volume, huge GMV, mostly sales-led. The smooth journey I praised is the indie one. The others look different."

### 6. Show the machinery (20 sec)
Gesture at SQL panel
 "This isn't a mockup of a chart. It's the instrumentation I'd build. Real queries behind each stage, and lifecycle triggers that catch a stalled account and route it, automation for the indie long tail, a human alert for a high-GMV stall."

---

## Part 2: Recommendations (about 3 min)

Transition:
 "So where would I focus, and what would I actually do."

### Recommendation 1: Drive down time-to-production (30 sec)
 "My north-star metric is time from first sandbox call to first production call. Because once Production is reached, they have gone past a point where they will stick much more. Everything I do should shorten that time. This model isn't a traditional sales motion with contracts and negotiation. It's a developer activation motion. The lever isn't persuasion, it's speed and friction removal."

### Recommendation 2: Find out why, first (30 sec)
 "First we need to investigate why people stall at that step. Is it because of the product which we can measure based on their activity, error logs, support tickets. Or is it based on more external factors, such as the maturity of their project, or product, their need to get buy-in from their team/managers. Is it because our docs, etc."

### Recommendation 3: Split by value (30 sec)
 "Then I'd split the response. Indie long tail: automation and great self-serve docs, not worth a human. High-GMV stalls: a person on them fast, sales or developer success. That's the GMV weighting in action, humans where the money is, automation everywhere else."

### Recommendation 4: Remove Frictions and support devs (30 sec)
"3 frictions types: 
- Product related > Feedback loop to Product team and Roadmap
- Developper Enablement > Help developpers achieve their goals faster and easier with docs, content, support, training, community, etc. 
- External > managers buy-in, hierarchy validation, project maturity, etc. => keep it the loop and nurture"

### Recommendation 5: Build developer credibility (40 sec)
"One thing a bit more specific but that might play a role when developpers compare solutions is presence and good ratings accross developepr communities and directories. It usually means good doc, good support, even community you can get help from to build your app. It's not only acquisition but validation as well."

### Close: how I'd prioritize (20 sec)
Point at the prioritization view.
 "How I'd prioritize: by GMV-weighted impact against effort. The biggest trapped euros are the funded and enterprise accounts stuck between production call and booking, so that's first. Not the indie top of funnel. Fix the leak before pouring more in."

Then stop:
 "That's the core of it. Happy to go deeper anywhere."

---

## If running long: cut list (in order)
1. Cut Recommendation 3 to one sentence.
2. Cut the segment cycle (step 5) to naming the three, no clicking.
3. Merge steps 1 and 2.

## Likely questions to have ready
- "First 30 days?" Instrument the stall, ship the enrichment and one trigger, get a first read on why people drop.
- "Why GMV not margin?" Margin scales with GMV and GMV is visible early. If margin % varies by segment, weight by estimated margin instead.
- "Why is enterprise in a self-serve funnel?" It's not for self-serve. It's an early-warning signal: if a big account's dev starts testing, catch it and route to sales.
- "You don't know SQL / BigQuery." Be honest: strong on APIs, automation, HubSpot, Clay. SQL is the gap I'm closing now, and the fundamentals map onto what I already do.

---

## Prioritization view: content to build into the dashboard

Add a sortable table, sorted by impact descending. Columns: Recommendation, Leak it targets, Segment, Effort, Impact.

| Recommendation | Targets | Segment | Effort | Impact |
|---|---|---|---|---|
| Investigate why accounts stall (instrument + enrich) | Sandbox to production | All | Low | High |
| Human on high-GMV stalls, automate the rest | Sandbox to production | Funded, Enterprise | Medium | High |
| Per-persona docs and content for the stall point | Sandbox to production | Indie, Funded | Medium | Medium |
| Feed friction back to product roadmap | Production to booking | Funded, Enterprise | Medium | High |
| Build developer credibility (RapidAPI, GitHub, directories) | Interest to sandbox | Indie, Funded | Medium | Medium |

Design note: keep it visually consistent with the rest of the dashboard, and make impact a colored tag so the eye lands on the High rows first. This view is what you point at when you say the word "prioritize," so it should read in two seconds.