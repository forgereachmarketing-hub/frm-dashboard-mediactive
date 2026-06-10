---
name: log-sales-call
description: >
  Logs sales calls to a Google Sheet by pulling data from Fathom meeting summaries.
  Use this skill whenever the user wants to log, record, or save a sales call,
  mentions a prospect name or Fathom call, says "log this call", "log all calls",
  "add to the sheet", or asks to update their sales call tracker. Also triggers
  when the user pastes a transcript or meeting notes and wants it saved.
---

# Log Sales Call

Pulls Fathom meeting summaries, extracts structured sales data, shows for review, and logs to Google Sheets via Zapier.

## Setup (do this once)

1. Replace `YOUR_SHEET_ID` below with the ID of your own Sales Calls sheet.
   The ID is the long string in the sheet URL: docs.google.com/spreadsheets/d/**THIS_PART**/edit
2. Replace `YOUR_SHEET_NAME` with the name of your spreadsheet as it appears in Google Drive (e.g. "Sales Calls").
3. Make sure Zapier MCP is connected in Claude with the Google Sheets "add_row" action enabled and pointed at your Google account.

## Fixed config

- Spreadsheet: "YOUR_SHEET_NAME" (ID: YOUR_SHEET_ID)
- Worksheet: Sheet1
- Columns A–J: Prospect name | Call date | Current state | Goal | Objections | Closed? | Notes | Duration | Service | Lead quality

---

## What to log vs skip

**Log these (sales/pitch calls):**
- First pitch of any service (website build, marketing, appointment booking)
- Upsell pitch to an existing client (e.g. pitching appointment booking after website delivery)

**Skip these:**
- Onboarding calls
- Handover / delivery calls
- Internal meetings
- Unnamed meetings with no identifiable prospect ("New Event", "Impromptu Google Meet" with no named guest)

---

## Step 1 — Fetch the meeting

| Input | Action |
|-------|--------|
| Fathom URL | `Fathom:get_recording_by_url(url)` → then `get_meeting_summary(recording_id)` |
| Recording ID | `Fathom:get_meeting_summary(recording_id)` directly |
| Prospect name | `Fathom:find_person(name, recorded_by: "anyone")` → then `get_meeting_summary` |
| "log all" / "log everything" | `Fathom:list_meetings(include_summary: true, max_pages: 10)` → filter to pitch calls → `get_meeting_summary` for each |
| Pasted transcript/notes | Skip Fathom fetch, extract directly from pasted content |

---

## Step 2 — Extract fields

From the summary or transcript, extract:

**Prospect name** — Full name of the prospect (never the seller)

**Call date** — DD MMM YYYY. Infer from meeting metadata if not stated.

**Current state** — Short and factual:
`Clients: X | Revenue: $X/month (or /year) | [1 sentence on how they get clients]`
Example: `Clients: 8 | Revenue: $12k/month | Growth via referrals only`

**Goal** — Short and specific:
`X clients | $X/month | in X months`
If no numbers: one short sentence on what they want.

**Objections** — One line per objection, label + brief reason:
- `Price too high (expected under $1k/month)`
- `Need to think about it (wants to consult partner first)`
- `No budget right now (just invested in new hire)`
- `Lack of trust (no case studies shown)`
Write `None` if there are genuinely no objections.
**Catch subtle objections too** — hesitation, deflection, asking for guarantees, etc.

**Closed?** — `Yes` / `No` / `Follow-up`

**Notes** — One sentence max on next steps.
Example: `Follow-up call scheduled for 24 Apr` or `Declined — no budget`

**Duration** — Total call time in minutes as a plain number (e.g. `47`).
Extract from Fathom meeting metadata. If the same prospect appears in two separate Fathom recordings on the same day (split call), sum the durations. If duration is not available write `n/a`.

**Service** — The service that was pitched. Ask the user before logging if not clear from the transcript. Do not guess or infer — this must come from the user or be explicitly stated in the call.

**Lead quality** — Score 1–5 only, no explanation:
- 5 = ready to buy
- 4 = strong interest
- 3 = maybe
- 2 = weak fit
- 1 = bad fit

### Rules
- Never invent data not in the source
- Missing info → write `n/a`
- Keep everything short and scannable — no full sentences where a label will do

---

## Step 3 — Show for review

Display all fields cleanly. For "log all" flows, show all rows together.

Then ask: **"Looks good? I'll log it."**

Wait for confirmation before logging.

---

## Step 4 — Log to sheet

After confirmation, for each row call:

```
execute_zapier_write_action(
  action: "add_row",
  app: "Google Sheets",
  instructions: "Add this row to spreadsheet 'YOUR_SHEET_NAME', worksheet 'Sheet1':
    Prospect name=..., Call date=..., Current state=..., Goal=...,
    Objections=..., Closed?=..., Notes=..., Duration=..., Service=..., Lead quality=...",
  params: { spreadsheet: "YOUR_SHEET_NAME", worksheet: "Sheet1" }
)
```

---

## Step 5 — Confirm

After logging, confirm with:
> ✅ Logged [Prospect name] — [view sheet](https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID)
