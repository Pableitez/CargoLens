# NaoLab

**Supply chain management for logistics SMBs**

─────────────────────────────────────────

**BUSINESS PLAN**

**Version 1.1 · June 2026**

Internal use — execution guide

**Pablo Benéitez · naolab.io**

─────────────────────────────────────────

## Table of contents

1.  Executive summary
2.  Problem and market
3.  Product and roadmap
4.  Business model
5.  Go-to-market
6.  Operations and execution
7.  Finance
8.  Key metrics
9.  Long-term vision
10. Next steps

**Reference milestone:** March 2027 — sellable product, credible early traction, PMF in the export + bookings wedge.

---

## Version history

| Version | Date     | Main change                                               |
| ------- | -------- | --------------------------------------------------------- |
| 1.0     | Jun 2026 | Initial BP (CargoLens / container visibility)             |
| 1.1     | Jun 2026 | Pivot to trade-ops; March 2027 milestone; merged document |

---

## 01. Executive summary

NaoLab is a SaaS **commercial operations** platform for small freight forwarders and importers/exporters — orders, bookings, and trade setup in one workspace, without enterprise ERP complexity or cost.

### The problem in one sentence

Logistics SMBs run **orders and bookings** on inadequate tools (Excel, email, WhatsApp) because market ERPs cost €500 to several thousand per month and take months to implement — while commercial data (client, shipper, consignee, booking) gets lost across operators.

### The solution

A tool **focused on export and bookings**, easy to adopt and affordable — built by someone who has lived the problem from the inside for 10+ years at Maersk, Kuehne+Nagel, and Noatum.

**Value proposition:** export and booking operations in one place, with onboarding in hours, not months.

### Current state (June 2026)

| Dimension       | Status                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Product**     | Working MVP — export orders (PO), shipper bookings (SB), carrier bookings (CB), trade setup, partial client portal, messaging |
| **Stack**       | React · Node.js · Express · MongoDB · CI/CD                                                                                   |
| **Team**        | Solo founder — development, sales, product, support                                                                           |
| **Legal**       | Self-employed (in progress) — Kit Digital under evaluation                                                                    |
| **Domain**      | naolab.io / naolabs.com — being finalized                                                                                     |
| **Positioning** | Trade-ops for SMB forwarders — **not** container tracking as core                                                             |

### March 2027 target

| Metric           | Target                                     |
| ---------------- | ------------------------------------------ |
| Paying customers | 15–20                                      |
| MRR              | €1,000–2,000                               |
| Monthly churn    | < 6%                                       |
| Time to value    | < 48 h (signup → first real PO or booking) |
| Testimonials     | ≥ 2 publishable                            |

### Why now

- Spain’s logistics SMB segment (~2,000 forwarders, mostly SMBs) remains underserved by accessible software.
- The product already has **live, sellable modules**: PO → SB → CB with commercial masters.
- The founder combines **domain credibility** and technical delivery — the main risk is commercial, not concept.

### What we do not do

- We do not compete with CargoWise or commodity visibility tools.
- We do not promise a full ERP before validating the wedge with paying customers.

### Critical next step

**2–3 real pilots before October 2026** — symbolic price (€29/month), real operations, biweekly feedback.

---

## 02. Problem and market

### The real pain

A small forwarder (5–20 people) juggles:

- Dozens of active **orders and bookings** across clients, shippers, and carriers
- **Scattered commercial data** — PO in Excel, SB in email, CB on carrier portals
- Client communication on shipment status with no minimal portal
- No **operational source of truth** for shipper, consignee, and trade chain
- Reliance on calls, email, and one-off carrier portals

**Outcome:** commercial data errors, rework, slow client responses, wasted operator time, and reputational risk.

### Target market

**Primary segment:** independent freight forwarders with 3–30 employees in Spain. Medium term: Spanish-speaking and European markets.

### Market indicators

| Data point                             | Value                          |
| -------------------------------------- | ------------------------------ |
| Registered forwarders in Spain         | ~2,000 companies, mostly SMBs  |
| SMB logistics software growth (Europe) | ~8–10% annually                |
| Global freight management software TAM | >$5B — underserved SMB segment |

### Primary buyer persona

- Operations manager or head of ops at a small forwarder
- 35–55, logistics background, low tolerance for complex software
- Direct buyer — no long procurement cycle
- Price-sensitive but willing to pay when ROI is clear and fast (**less Excel, fewer errors**)

---

## 03. Product and roadmap

### Value proposition

> **Export and booking operations in one place, without enterprise ERP complexity or cost.**

NaoLab centralizes what today lives in Excel, email, and WhatsApp: **orders (PO), shipper bookings (SB), carrier bookings (CB), contractual clients, and client portal collaboration** — onboarding in hours, not months.

We do not compete with CargoWise. **We do the small forwarder’s operational flow very well** for export and bookings.

### MVP capabilities (live — June 2026)

**Staff (forwarder team)**

| Module                | Status | Description                                         |
| --------------------- | ------ | --------------------------------------------------- |
| Export orders (PO)    | Live   | CRUD, SKU lines, Excel import, commercial context   |
| Shipper bookings (SB) | Live   | Bookings, link to orders, Excel import              |
| Carrier bookings (CB) | Live   | Linked to SB; INTTRA flow (mock by default)         |
| Trade setup           | Live   | Parties, facilities, relationships, master import   |
| Invites               | Live   | Staff (company code) and clients (contractual code) |
| Messages              | Live   | Staff ↔ client portal                               |

**Client portal**

| Module      | Status  | Description                          |
| ----------- | ------- | ------------------------------------ |
| Trade setup | Partial | Parties and chains for their account |
| Messages    | Live    | Thread with forwarder                |

**Out of product:** container tracking, vessel maps, commodity visibility.

**Roadmap (placeholders, do not sell yet):** import, warehouse, documents, operational finance, analytics.

### What NaoLab is not

- Not a full TMS/ERP (customs, warehouse, finance end-to-end).
- Not a tracking or fleet map tool.
- Does not replace live carrier portals until real credentials are integrated.

### Competitive advantage

| Factor           | Why it matters                                                  |
| ---------------- | --------------------------------------------------------------- |
| Domain knowledge | 10+ years in freight forwarding — real flows, not hypotheticals |
| Adoption speed   | Signup → first PO or booking in the same session                |
| SMB pricing      | From €49/month — see chapter 04                                 |
| Focus            | Export + bookings + trade setup before expanding                |

### Product roadmap — June 2026 to March 2027

**Principle:** nothing enters development without a pilot or paying customer signal.

| Phase             | Period            | Business goal                 | Deliverables                              |
| ----------------- | ----------------- | ----------------------------- | ----------------------------------------- |
| **A — Alignment** | Jun–Jul 2026      | Landing + 10 outreaches       | PO→SB→CB demo; polished onboarding        |
| **B — Pilots**    | Aug–Oct 2026      | 2–3 pilots (€29/mo)           | Sellable v1.1 client portal               |
| **C — Paid**      | Nov 2026–Jan 2027 | 8–12 Starter/Growth customers | v1.2 stability + 1 top integration        |
| **D — Milestone** | Feb–Mar 2027      | PMF; €1,000–2,000 MRR         | v1.3 documents **or** email notifications |

**v1.3 (after January 2027, pick one):**

- **Option A:** basic documents (BL, packing list, invoice on PO/SB)
- **Option B:** client email notifications on operational milestones

**Deferred after March 2027:** import, warehouse, analytics, tracking, native mobile app.

```
Jun–Jul 2026     Aug–Oct 2026        Nov 2026–Jan 2027      Feb–Mar 2027
Alignment    →   Pilots v1.1     →   Paid + v1.2        →   PMF milestone
```

---

## 04. Business model

### Pricing (to validate with market)

| Plan        | Price/mo | Target               | Includes                                      |
| ----------- | -------- | -------------------- | --------------------------------------------- |
| **Starter** | €49      | 1–3 users, basic ops | PO, SB, CB, trade setup, email support        |
| **Growth**  | €149     | Up to 10 users       | All Starter + client portal + integrations    |
| **Pro**     | €299     | Teams >10 users      | All Growth + analytics + dedicated onboarding |

**Model:** monthly or annual SaaS (2 months free on annual). No setup fees.

**Early adopter pilot:** €29/month — full access to live modules in exchange for biweekly feedback.

### Target unit economics

| Metric                       | Target                          |
| ---------------------------- | ------------------------------- |
| MRR target **March 2027**    | €1,000–2,000 (15–20 customers)  |
| MRR target year 1 (Jun 2027) | €2,500–3,500 (~25–35 customers) |
| MRR target year 2            | €15,000 (~100+ mixed customers) |
| Churn target                 | < 6% monthly (v1.1)             |
| CAC target                   | < €300 (digital + referrals)    |
| LTV target (24 months)       | > €1,500 per customer           |

---

## 05. Go-to-market

### Phase 0 — Validation (Jun–Aug 2026)

**Goal:** 2–3 real pilot customers at €29/month.

- Personal network (Maersk, Kuehne+Nagel, Noatum)
- LinkedIn outreach to ops managers at small forwarders in Spain
- Industry groups and forums (FETEIA, independent forwarders)
- **Early adopter** offer with direct product input
- Demo: **PO → SB → CB → client portal** (15 min)

### Phase 1 — Early traction (Sep 2026 – Jan 2027)

- LinkedIn content: operational pain (Excel, bookings, commercial errors)
- Use case + pilot testimonial on landing
- Outreach: **10 conversations/week**
- Basic SEO: _forwarder software_, _SMB export booking management_, _forwarder operations_

### Phase 2 — Scale (Feb–Dec 2027)

- Referrals: 1 free month per converted referral
- Partnerships (FETEIA, logistics cluster)
- Events: Logistics Spain, SIL Barcelona (if MRR > €1,500)
- Logistics consultants as indirect channel

**Primary short-term channel:** LinkedIn + direct outreach. No paid ads until churn is controlled and messaging is validated.

---

## 06. Operations and execution

### Priorities — next 90 days (Jun–Sep 2026)

**Weeks 1–4**

- [ ] Register as self-employed
- [ ] Finalize NaoLab domain and branding
- [ ] Public landing — **trade-ops** positioning (not tracking)
- [ ] Demo script PO → SB → CB → portal (15 min)
- [ ] 10 outreaches to industry contacts

**Weeks 5–8**

- [ ] 1 active pilot on real operations
- [ ] Biweekly structured feedback → v1.1 backlog
- [ ] Client portal v1.1 if feedback confirms

**Weeks 9–12**

- [ ] 2–3 active pilots
- [ ] First paying Starter customers (target MRR > €200)
- [ ] Evaluate Kit Digital as acquisition or funding channel

### Risk management

| Risk                            | Prob.  | Impact | Mitigation                                                      |
| ------------------------------- | ------ | ------ | --------------------------------------------------------------- |
| Long sales cycle                | High   | Medium | €29/mo pilot; concrete ops demo                                 |
| Churn from missing integrations | Medium | High   | Prioritize 1 top integration from pilots (INTTRA, email, Excel) |
| Large competitor enters SMB     | Low    | High   | Speed, trade-ops focus, domain as moat                          |
| Limited capacity (solo founder) | High   | Medium | Ruthless prioritization; zero scope creep                       |
| Product–message misalignment    | Medium | High   | BP v1.1 + landing + demo aligned; do not resell tracking        |

---

## 07. Finance

### Cost structure (initial phase)

| Item                                              | Cost/month          |
| ------------------------------------------------- | ------------------- |
| Self-employed (flat rate, year 1)                 | ~€85                |
| Infrastructure (hosting, DB, domain)              | ~€50–80             |
| Integrations / APIs (INTTRA, transactional email) | ~€0–50 by volume    |
| SaaS tools (design, marketing)                    | ~€50                |
| **EST. FIXED TOTAL**                              | **~€250–350/month** |

_v1.1 note: tracking API costs (Safecube/Sinay) removed — out of core._

**Operating break-even:** ~8–10 Starter customers (€390–490 MRR). Achievable in Q4 2026 if Phase B (pilots) runs.

### Conservative forecast (v1.1 revised)

| Date         | Customers  | Est. MRR         | Notes                   |
| ------------ | ---------- | ---------------- | ----------------------- |
| Sep 2026     | 2–3 pilots | ~€90             | Symbolic price          |
| Dec 2026     | 8–10       | ~€600–800        | First Starter customers |
| **Mar 2027** | **15–20**  | **€1,000–2,000** | **PMF milestone**       |
| Jun 2027     | 25–35      | €2,500–3,500     | Scale GTM               |
| Dec 2027     | 50–70      | €5,000–7,000     | Second product lever    |

_Indicative projections. Update monthly with real data._

---

## 08. Key metrics

Track from the first month with active customers:

| Metric                  | Description                       | Frequency | v1.1 target            |
| ----------------------- | --------------------------------- | --------- | ---------------------- |
| MRR and MoM growth      | Recurring revenue and change      | Monthly   | Mar 2027: €1,000–2,000 |
| Churn rate              | % customers cancelling/month      | Monthly   | < 6%                   |
| NPS / satisfaction      | Retention signal                  | Quarterly | ≥ 30 on pilots         |
| CAC                     | Cost per acquired customer        | Monthly   | < €300                 |
| Time to value           | Signup → first real PO or booking | Monthly   | < 48 h                 |
| Most-used features      | Roadmap prioritization            | Weekly    | PO, SB, CB, portal     |
| Pilot → paid conversion | % pilots moving to Starter/Growth | Monthly   | ≥ 33%                  |

---

## 09. Long-term vision

### NaoLab in 3 years

- Reference for **commercial operations** of logistics SMBs in Spain (>500 active customers)
- Spanish-speaking expansion — LATAM with a huge gap in accessible tools
- **Platform**, not just a tool: integrations with carriers, customs, and e-commerce
- Potential acquisition by a larger player, or Series A if traction justifies it

### The name

The _nao_ was the ship that connected worlds and opened impossible trade routes. **NaoLab connects logistics operators with the unified commercial operations they deserve** — orders, bookings, and clients in one place, without enterprise ERP weight.

---

## 10. Next steps

### This week

- [ ] Publish landing with trade-ops proposition (not tracking)
- [ ] Demo script: PO → SB → CB → client portal (15 min)
- [ ] Identify 10 contacts for pilot outreach
- [ ] Set pilot pricing (€29) and Starter (€49)

### Next 4 weeks

- [ ] First pilot on real operations
- [ ] Biweekly feedback structure for pilots
- [ ] v1.1 client portal backlog prioritized from feedback
- [ ] Measure time-to-value from first external signup

### Before September 2026

- [ ] Minimum 2 active pilots
- [ ] Evaluate Kit Digital
- [ ] First metrics report (even with 1–2 customers)
- [ ] Document decision: Option A (documents) vs B (notifications) for v1.3

### Before March 2027

- [ ] 15–20 paying customers
- [ ] €1,000–2,000 MRR
- [ ] 2 publishable testimonials on landing
- [ ] Monthly churn < 6% for 3 consecutive months

---

─────────────────────────────────────────

_Living document — version 1.1 · Pablo Benéitez · naolab.io_

_Update with each product iteration and pilot cycle._
