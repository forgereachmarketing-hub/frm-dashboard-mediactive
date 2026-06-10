# Mediactive Dashboard v2

Sales analytics dashboard for outreach teams. Connect your own Google Sheets and Calendly, no backend needed.

## What is new in v2

- **Setup wizard** — connect any Google Sheets through a guided onboarding flow
- **Bring your own data** — no hardcoded sheet IDs, every user connects their own spreadsheets
- **Dynamic month tabs** — pick any tabs from your outreach sheet, the dashboard adapts
- **Calendly integration** — see upcoming booked calls on the dashboard
- **Settings page** — manage connections, export and import config between devices
- **Privacy first** — data flows directly between your browser and your own Google account through a script you deploy yourself

## How it works

1. Deploy a small Apps Script web app to your own Google account (the wizard walks you through it)
2. Paste your spreadsheet links and pick the tabs
3. Optionally add a Calendly personal access token
4. Configuration is stored in your browser (localStorage) and can be exported as JSON

## Expected sheet structure

The outreach sheet uses monthly tabs with a header row containing `Name` and `Date` columns, plus a `Total` summary row near the top. The sales sheet is a flat call log with outcome in column F and objections in later columns.

## Development

```
npm install
npm run dev
npm run build
```

Deployed to GitHub Pages from the `dist` folder on push to `main`.
